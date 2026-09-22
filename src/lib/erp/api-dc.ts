import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff, nextDoc, assertPerm } from "./core.server";
import { uid, type Row } from "./row";
import { todayISO } from "./format";

const auth = [authMiddleware];

export const createDcInvoice = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      soId: z.coerce.number(),
      lotId: z.coerce.number(),
      qtyPcs: z.coerce.number().positive(),
      shipToPartnerId: z.coerce.number().optional(),
      customerPoNo: z.string().optional(),
      transporterName: z.string().optional(),
      transportDocNo: z.string().optional(),
      vehicleNo: z.string().optional(),
      dispatchFrom: z.string().optional(),
      dispatchTo: z.string().optional(),
      grossWtKg: z.coerce.number().optional(),
      qtyPerPkt: z.coerce.number().optional(),
      lineGrossWtKg: z.coerce.number().optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "sales");
    const sql = await erpSql();

    const dcNo = await nextDoc(sql, "DC");
    const invNo = await nextDoc(sql, "INV");

    const so = (await sql.query<Row>(`SELECT * FROM sales_order WHERE id = $1`, [data.soId]))[0];
    if (!so) throw new Error("Sales order not found");

    const result = await sql.query<Row>(
      `INSERT INTO dispatch (
        doc_no, dc_no, partner_id, ship_to_partner_id, customer_po_no,
        is_dc_cum_invoice, dispatch_date, vehicle_no, transport_doc_no,
        dispatch_from, dispatch_to, gross_wt_kg, status, created_by
      ) VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10, $11, 'POSTED', $12)
      RETURNING id, doc_no, dc_no`,
      [
        invNo,
        dcNo,
        so.partner_id,
        data.shipToPartnerId || so.partner_id,
        data.customerPoNo || null,
        todayISO(),
        data.vehicleNo || null,
        data.transportDocNo || null,
        data.dispatchFrom || "Jamnagar",
        data.dispatchTo || null,
        data.grossWtKg || 0,
        staff.user_id || staff.id,
      ]
    );

    const dispatchId = result[0]!.id as number;

    const lot = (await sql.query<Row>(`SELECT item_id FROM stock_lot WHERE id = $1`, [data.lotId]))[0];

    await sql.query<Row>(
      `INSERT INTO dispatch_line (
        dispatch_id, lot_id, item_id, qty_pcs, gross_wt_kg, qty_per_pkt
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        dispatchId,
        data.lotId,
        lot?.item_id || null,
        data.qtyPcs,
        data.lineGrossWtKg || 0,
        data.qtyPerPkt || 0,
      ]
    );

    return result[0];
  });

export const getDcInvoice = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const dispatch = (
      await sql.query<Row>(
        `SELECT d.*, p1.name as bill_to_name, p1.gstin as bill_to_gstin, p1.address_line1 as bill_to_address,
                p2.name as ship_to_name, p2.gstin as ship_to_gstin, p2.address_line1 as ship_to_address
         FROM dispatch d
         LEFT JOIN partner p1 ON p1.id = d.partner_id
         LEFT JOIN partner p2 ON p2.id = d.ship_to_partner_id
         WHERE d.id = $1`,
        [data.id]
      )
    )[0];

    if (!dispatch) throw new Error("DC Invoice not found");

    const lines = await sql.query<Row>(
      `SELECT dl.*, i.sku, i.name as item_name, i.hsn_code as hsn, sl.lot_no, sl.heat_no
       FROM dispatch_line dl
       LEFT JOIN item i ON i.id = dl.item_id
       LEFT JOIN stock_lot sl ON sl.id = dl.lot_id
       WHERE dl.dispatch_id = $1`,
      [data.id]
    );

    const company = (await sql.query<Row>(`SELECT * FROM company LIMIT 1`))[0];

    return { ...dispatch, lines, company };
  });

export const listDcInvoices = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const rows = await sql.query<Row>(`
      SELECT d.*, p.name as partner_name
      FROM dispatch d
      LEFT JOIN partner p ON p.id = d.partner_id
      WHERE d.is_dc_cum_invoice = true
      ORDER BY d.id DESC
    `);
    return rows;
  });
