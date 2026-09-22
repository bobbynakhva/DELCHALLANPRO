import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, audit, erpSql, nextDoc, requireStaff } from "./core.server";
import { n, todayISO } from "./format";
import { uid, type Row } from "./row";
import { assertPeriodAllows, billMatchLines, postJournal } from "@/modules/finance/journal";
import { gstBreakup } from "./quote-math";
const auth = [authMiddleware];

export const postVendorBillEnhanced = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      grnId: z.coerce.number(),
      vendorInvoiceNo: z.string().optional(),
      gstPct: z.coerce.number().min(0).max(28).default(18),
      finalDiscPct: z.coerce.number().min(0).max(100).default(0),
    })
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "purchase");
    const sql = await erpSql();
    const grn = (
      await sql.query<{
        id: number;
        doc_no: string;
        partner_id: number;
        po_id: number | null;
        grn_date: string;
      }>(`select * from grn where id = $1`, [data.grnId])
    )[0];
    if (!grn) throw new Error("GRN not found");
    const existing = (
      await sql.query<{ id: number }>(`select id from vendor_bill where grn_id = $1`, [grn.id])
    )[0];
    if (existing) throw new Error("GRN already billed");
    await assertPeriodAllows(sql, todayISO(), "BILL");
    const line = (
      await sql.query<{ item_id: number; net_kg: string; po_line_id: number | null }>(
        `select item_id, net_kg, po_line_id from grn_line where grn_id = $1`,
        [grn.id],
      )
    )[0];
    if (!line) throw new Error("GRN has no lines");
    const po = line.po_line_id
      ? (
          await sql.query<{ rate_paise_per_kg: number }>(
            `select rate_paise_per_kg from po_line where id = $1`,
            [line.po_line_id],
          )
        )[0]
      : null;
    const rate = po?.rate_paise_per_kg ?? 62000;
    const qty = n(line.net_kg);
    
    // Apply discount
    const taxable = Math.round(qty * rate * (1 - data.finalDiscPct / 100));
    
    const partner = (
      await sql.query<{ state_code: string | null; is_msme: boolean; credit_days: number }>(
        `select state_code, is_msme, credit_days from partner where id = $1`,
        [grn.partner_id],
      )
    )[0]!;
    const company = (await sql.query<{ state_code: string }>(`select state_code from company limit 1`))[0]!;
    const gst = gstBreakup({
      taxablePaise: taxable,
      gstPct: data.gstPct,
      fromState: company.state_code,
      toState: partner.state_code,
      isExport: false,
    });
    const dueDays = partner.is_msme ? partner.credit_days || 45 : partner.credit_days || 45;
    const due = new Date(todayISO() + "T00:00:00Z");
    due.setUTCDate(due.getUTCDate() + dueDays);
    const docNo = await nextDoc(sql, "BILL");
    const bill = (
      await sql.query<{ id: number }>(
        `insert into vendor_bill (
           doc_no, partner_id, bill_date, due_date, grn_id, kind,
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status, created_by, vendor_invoice_no, final_disc_pct, gst_pct_override
         ) values ($1,$2,$3,$4,$5,'GRN',$6,$7,$8,$9,$10,'POSTED',$11,$12,$13,$14) returning id`,
        [
          docNo,
          grn.partner_id,
          todayISO(),
          due.toISOString().slice(0, 10),
          grn.id,
          taxable,
          gst.cgst,
          gst.sgst,
          gst.igst,
          taxable + gst.cgst + gst.sgst + gst.igst,
          staff.user_id,
          data.vendorInvoiceNo || null,
          data.finalDiscPct,
          data.gstPct,
        ],
      )
    )[0]!;
    await sql.query(
      `insert into vendor_bill_line (bill_id, item_id, qty, qty_uom, rate_paise, taxable_paise)
       values ($1,$2,$3,'KG',$4,$5)`,
      [bill.id, line.item_id, qty, rate, taxable],
    );
    await postJournal(sql, {
      narration: `3-way bill ${docNo} clears GRNI on ${grn.doc_no}`,
      sourceType: "BILL",
      sourceId: bill.id,
      userId: staff.user_id,
      lines: billMatchLines({ taxablePaise: taxable, cgstPaise: gst.cgst, sgstPaise: gst.sgst, igstPaise: gst.igst }),
    });
    await audit(sql, { userId: staff.user_id, action: "VENDOR_BILL", entity: "vendor_bill", entityId: bill.id, after: { docNo, grn: grn.doc_no, qty, finalDiscPct: data.finalDiscPct, gstPct: data.gstPct, vendorInvoiceNo: data.vendorInvoiceNo } });
    return { docNo, id: bill.id, taxable, qty };
  });
