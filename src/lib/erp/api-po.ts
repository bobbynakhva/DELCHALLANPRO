import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, erpSql, nextDoc, requireStaff } from "./core.server";
import { todayISO } from "./format";
import { uid, type Row } from "./row";

const auth = [authMiddleware];

// ── List all Purchase Orders ──────────────────────────────────────────────────
export const listPurchaseOrders = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    return sql.query<Row>(
      `select po.*,
              p.name as partner_name, p.address_line1, p.city, p.state,
              p.gstin as partner_gstin, p.phone as partner_phone,
              (select json_agg(
                json_build_object(
                  'id',       l.id,
                  'seq',      l.seq,
                  'item_id',  l.item_id,
                  'sku',      i.sku,
                  'name',     i.name,
                  'drawing_no', i.drawing_no,
                  'hsn',      i.hsn,
                  'uom',      l.uom,
                  'qty_kg',   l.qty_kg,
                  'qty_pcs',  l.qty_pcs,
                  'rate_paise_per_kg', l.rate_paise_per_kg,
                  'rate_paise_per_pc', l.rate_paise_per_pc,
                  'discount_pct',      l.discount_pct,
                  'received_kg',       l.received_kg,
                  'cancelled',         l.cancelled
                ) order by l.seq, l.id
              ) from po_line l join item i on i.id = l.item_id where l.po_id = po.id) as lines
         from purchase_order po
         join partner p on p.id = po.partner_id
        order by po.id desc`,
    );
  });

// ── Get single PO detail ──────────────────────────────────────────────────────
export const getPurchaseOrderDetail = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const [po] = await sql.query<Row>(
      `select po.*,
              p.name as partner_name, p.address_line1, p.city, p.state, p.pincode,
              p.gstin as partner_gstin, p.phone as partner_phone
         from purchase_order po
         join partner p on p.id = po.partner_id
        where po.id = $1`,
      [data.id],
    );
    if (!po) throw new Error("Purchase Order not found");
    const lines = await sql.query<Row>(
      `select l.*, i.sku, i.name as item_name, i.drawing_no, i.hsn
         from po_line l
         join item i on i.id = l.item_id
        where l.po_id = $1
        order by l.seq, l.id`,
      [data.id],
    );
    const company = (await sql.query<Row>(`select * from company limit 1`))[0];
    return { po, lines, company };
  });

// ── Create Purchase Order ─────────────────────────────────────────────────────
const poLineInput = z.object({
  itemId:          z.coerce.number().positive(),
  uom:             z.enum(["KG", "PCS"]).default("KG"),
  qtyKg:           z.coerce.number().min(0).default(0),
  qtyPcs:          z.coerce.number().min(0).default(0),
  ratePaisePerKg:  z.coerce.number().min(0).default(0),
  ratePaisePerPc:  z.coerce.number().min(0).default(0),
  discountPct:     z.coerce.number().min(0).max(100).default(0),
  seq:             z.coerce.number().default(0),
});

export const createPurchaseOrder = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      partnerId:           z.coerce.number().positive(),
      orderDate:           z.string().optional(),
      expectedDate:        z.string().optional(),
      attnName:            z.string().optional(),
      remarksInternal:     z.string().optional(),
      refQuote:            z.string().optional(),
      rejectionTracking:   z.boolean().default(false),
      testCertRequired:    z.boolean().default(false),
      discountPct:         z.coerce.number().min(0).max(100).default(0),
      freightPaise:        z.coerce.number().min(0).default(0),
      pnfPaise:            z.coerce.number().min(0).default(0),
      insurancePaise:      z.coerce.number().min(0).default(0),
      cgstPct:             z.coerce.number().min(0).max(28).default(0),
      sgstPct:             z.coerce.number().min(0).max(28).default(0),
      otherChargesPaise:   z.coerce.number().min(0).default(0),
      termsText:           z.string().optional(),
      lines:               z.array(poLineInput).min(1, "At least one line item required"),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "purchase");
    const sql = await erpSql();

    const docNo = await nextDoc(sql, "PO");
    const [po] = await sql.query<{ id: number }>(
      `insert into purchase_order (
         doc_no, partner_id, status, order_date, expected_date,
         attn_name, remarks_internal, ref_quote,
         rejection_tracking, test_cert_required,
         discount_pct, freight_paise, pnf_paise, insurance_paise,
         cgst_pct, sgst_pct, other_charges_paise, terms_text,
         created_by
       ) values ($1,$2,'OPEN',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       returning id`,
      [
        docNo,
        data.partnerId,
        data.orderDate ?? todayISO(),
        data.expectedDate ?? null,
        data.attnName ?? null,
        data.remarksInternal ?? null,
        data.refQuote ?? null,
        data.rejectionTracking,
        data.testCertRequired,
        data.discountPct,
        data.freightPaise,
        data.pnfPaise,
        data.insurancePaise,
        data.cgstPct,
        data.sgstPct,
        data.otherChargesPaise,
        data.termsText ?? null,
        staff.user_id,
      ],
    );

    for (let i = 0; i < data.lines.length; i++) {
      const l = data.lines[i];
      await sql.query<Row>(
        `insert into po_line
           (po_id, item_id, seq, uom, qty_kg, qty_pcs,
            rate_paise_per_kg, rate_paise_per_pc, discount_pct)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          po!.id,
          l.itemId,
          l.seq || (i + 1) * 10,
          l.uom,
          l.uom === "KG" ? l.qtyKg : 0,
          l.uom === "PCS" ? l.qtyPcs : 0,
          l.uom === "KG" ? l.ratePaisePerKg : 0,
          l.uom === "PCS" ? l.ratePaisePerPc : 0,
          l.discountPct,
        ],
      );
    }

    return { docNo, id: po!.id };
  });

// ── Cancel a single PO line ───────────────────────────────────────────────────
export const cancelPoLine = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ lineId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "purchase");
    const sql = await erpSql();
    await sql.query<Row>(`update po_line set cancelled = true where id = $1`, [data.lineId]);
    // Auto-cancel PO if all lines are cancelled
    await sql.query<Row>(
      `update purchase_order set status = 'CANCELLED'
        where id = (select po_id from po_line where id = $1)
          and not exists (select 1 from po_line where po_id = (select po_id from po_line where id = $1) and not cancelled)`,
      [data.lineId],
    );
    return { ok: true };
  });

// ── Cancel / close entire PO ──────────────────────────────────────────────────
export const closePurchaseOrder = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number(), reason: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "purchase");
    const sql = await erpSql();
    await sql.query<Row>(
      `update purchase_order
          set status = 'CANCELLED',
              notes = coalesce(notes || chr(10), '') || $2
        where id = $1`,
      [data.id, `Cancelled by ${staff.name}${data.reason ? ": " + data.reason : ""}`],
    );
    return { ok: true };
  });
