import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, audit, erpSql, nextDoc, requireStaff } from "./core.server";
import { n, todayISO } from "./format";
import { uid, type Row } from "./row";
import {
  assertPeriodAllows,
  billMatchLines,
  excessLossLines,
  invoiceJournalLines,
  jwVendorBillLines,
  postJournal,
  receiptLines,
  trialBalance,
  yearMonth,
} from "@/modules/finance/journal";
import { CANCEL_CREDIT_NOTE_MSG, assertCancelWindow } from "@/modules/compliance/irp/stub";
import {
  documentsIssued,
  gstr1Csv,
  gstr3bCsv,
  itc04Csv,
  itc04Period,
  WORKSHEET_WATERMARK,
  type BillRow,
  type ChallanRow,
  type InvoiceRow,
  type NoteRow,
  type SeriesRow,
} from "@/modules/finance/gst-worksheets";
import { gstBreakup } from "./quote-math";

const auth = [authMiddleware];

export async function assertCreditAllows(
  sql: Awaited<ReturnType<typeof erpSql>>,
  partnerId: number,
  extraPaise: number,
  opts?: { ownerOverride?: boolean; role?: string },
): Promise<void> {
  const p = (
    await sql.query<{ credit_limit_paise: number; name: string }>(
      `select credit_limit_paise, name from partner where id = $1`,
      [partnerId],
    )
  )[0];
  if (!p) throw new Error("Partner not found");
  const open = (
    await sql.query<{ ar: string }>(
      `select coalesce(sum(total_paise - received_paise),0)::bigint as ar
         from sales_invoice where partner_id = $1 and status = 'POSTED'`,
      [partnerId],
    )
  )[0];
  const overdue = (
    await sql.query<{ n: string }>(
      `select count(*)::int as n from sales_invoice
        where partner_id = $1 and status = 'POSTED' and received_paise < total_paise
          and coalesce(due_date, invoice_date + 30) < current_date`,
      [partnerId],
    )
  )[0];
  if (n(overdue?.n) > 0 && !opts?.ownerOverride) {
    throw new Error(`DISPATCH blocked — ${p.name} has overdue invoices. Owner override required.`);
  }
  if (p.credit_limit_paise > 0 && n(open?.ar) + extraPaise > p.credit_limit_paise && !opts?.ownerOverride) {
    throw new Error(`DISPATCH blocked — credit limit exceeded for ${p.name}. Owner override required.`);
  }
}

export async function postInvoiceJournal(
  sql: Awaited<ReturnType<typeof erpSql>>,
  opts: {
    invoiceId: number;
    isExport: boolean;
    taxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    totalPaise: number;
    userId?: string;
    date?: string;
  },
) {
  await postJournal(sql, {
    date: opts.date,
    narration: `Sales invoice #${opts.invoiceId}`,
    sourceType: "INV",
    sourceId: opts.invoiceId,
    userId: opts.userId,
    lines: invoiceJournalLines(opts),
  });
}

export async function postExcessLossJournal(
  sql: Awaited<ReturnType<typeof erpSql>>,
  opts: { paise: number; returnId: number; userId?: string },
) {
  if (opts.paise <= 0) return;
  await postJournal(sql, {
    narration: `JW excess loss return #${opts.returnId}`,
    sourceType: "JW_LOSS",
    sourceId: opts.returnId,
    userId: opts.userId,
    lines: excessLossLines(opts.paise),
  });
}

export const getTrialBalance = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role === "SHOP") throw new Error("SHOP cannot see the chart of accounts");
    const sql = await erpSql();
    return trialBalance(sql);
  });

export const listJournals = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role === "SHOP") throw new Error("SHOP cannot see journals");
    const sql = await erpSql();
    const headers = await sql.query<Row>(`select * from journal order by id desc limit 80`);
    const lines = await sql.query<Row>(
      `select l.*, a.name as account_name from journal_line l
         join chart_of_accounts a on a.code = l.account_code
        where l.journal_id in (select id from journal order by id desc limit 80)
        order by l.journal_id, l.line_no`,
    );
    return { headers, lines };
  });

export const listCoa = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role === "SHOP") throw new Error("SHOP cannot see the chart of accounts");
    const sql = await erpSql();
    return sql.query<Row>(`select * from chart_of_accounts order by code`);
  });

export const postVendorBill = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ grnId: z.coerce.number() }))
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
    const taxable = Math.round(qty * rate);
    const partner = (
      await sql.query<{ state_code: string | null; is_msme: boolean; credit_days: number }>(
        `select state_code, is_msme, credit_days from partner where id = $1`,
        [grn.partner_id],
      )
    )[0]!;
    const company = (await sql.query<{ state_code: string }>(`select state_code from company limit 1`))[0]!;
    const gst = gstBreakup({
      taxablePaise: taxable,
      gstPct: 18,
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
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status, created_by
         ) values ($1,$2,$3,$4,$5,'GRN',$6,$7,$8,$9,$10,'POSTED',$11) returning id`,
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
    await audit(sql, { userId: staff.user_id, action: "VENDOR_BILL", entity: "vendor_bill", entityId: bill.id, after: { docNo, grn: grn.doc_no, qty } });
    return { docNo, id: bill.id, taxable, qty };
  });

export const postJwVendorBill = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ returnId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "purchase");
    const sql = await erpSql();
    const ret = (
      await sql.query<{ id: number; challan_id: number; good_pcs: string }>(
        `select id, challan_id, good_pcs from job_work_return where id = $1`,
        [data.returnId],
      )
    )[0];
    if (!ret) throw new Error("JW return not found");
    const ch = (
      await sql.query<{ partner_id: number; process_code: string }>(
        `select partner_id, process_code from job_work_challan where id = $1`,
        [ret.challan_id],
      )
    )[0]!;
    const line = (
      await sql.query<{ item_id: number }>(
        `select l.item_id from job_work_challan_line l where l.challan_id = $1 limit 1`,
        [ret.challan_id],
      )
    )[0]!;
    const item = (await sql.query<{ family: string }>(`select family from item where id = $1`, [line.item_id]))[0];
    const rate = (
      await sql.query<{ rate_paise_per_pc: number }>(
        `select rate_paise_per_pc from partner_process_rate
          where partner_id = $1 and process_code = $2
            and (item_family = $3 or item_family = '')
          order by case when item_family = $3 then 0 else 1 end limit 1`,
        [ch.partner_id, ch.process_code, item?.family ?? ""],
      )
    )[0];
    const qty = n(ret.good_pcs);
    const taxable = Math.round(qty * (rate?.rate_paise_per_pc ?? 0));
    const gst = { cgst: Math.round(taxable * 0.09), sgst: Math.round(taxable * 0.09), igst: 0 };
    await assertPeriodAllows(sql, todayISO(), "BILL");
    const partner = (
      await sql.query<{ is_msme: boolean; credit_days: number }>(
        `select is_msme, credit_days from partner where id = $1`,
        [ch.partner_id],
      )
    )[0]!;
    const due = new Date(todayISO() + "T00:00:00Z");
    due.setUTCDate(due.getUTCDate() + (partner.credit_days || 45));
    const docNo = await nextDoc(sql, "BILL");
    const bill = (
      await sql.query<{ id: number }>(
        `insert into vendor_bill (
           doc_no, partner_id, bill_date, due_date, jw_return_id, kind,
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status, created_by
         ) values ($1,$2,$3,$4,$5,'JW',$6,$7,$8,$9,$10,'POSTED',$11) returning id`,
        [
          docNo,
          ch.partner_id,
          todayISO(),
          due.toISOString().slice(0, 10),
          ret.id,
          taxable,
          gst.cgst,
          gst.sgst,
          gst.igst,
          taxable + gst.cgst + gst.sgst + gst.igst,
          staff.user_id,
        ],
      )
    )[0]!;
    await sql.query(
      `insert into vendor_bill_line (bill_id, item_id, qty, qty_uom, rate_paise, taxable_paise)
       values ($1,$2,$3,'PCS',$4,$5)`,
      [bill.id, line.item_id, qty, rate?.rate_paise_per_pc ?? 0, taxable],
    );
    await postJournal(sql, {
      narration: `JW vendor bill ${docNo} on returned good ${qty} pcs`,
      sourceType: "BILL",
      sourceId: bill.id,
      userId: staff.user_id,
      lines: jwVendorBillLines({ chargesPaise: taxable, cgstPaise: gst.cgst, sgstPaise: gst.sgst }),
    });
    return { docNo, id: bill.id, qty, taxable };
  });

export const postReceipt = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      partnerId: z.coerce.number(),
      amountPaise: z.coerce.number().positive(),
      invoiceId: z.coerce.number().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    await assertPeriodAllows(sql, todayISO(), "JOURNAL");
    const open = await sql.query<{ id: number; total_paise: number; received_paise: number; doc_no: string }>(
      `select id, total_paise, received_paise, doc_no from sales_invoice
        where partner_id = $1 and status = 'POSTED' and received_paise < total_paise
        order by invoice_date, id`,
      [data.partnerId],
    );
    let left = data.amountPaise;
    const alloc: Array<{ invoiceId: number; amount: number }> = [];
    const prefer = data.invoiceId ? open.filter((i) => i.id === data.invoiceId).concat(open.filter((i) => i.id !== data.invoiceId)) : open;
    for (const inv of prefer) {
      if (left <= 0) break;
      const due = n(inv.total_paise) - n(inv.received_paise);
      const take = Math.min(due, left);
      alloc.push({ invoiceId: inv.id, amount: take });
      left -= take;
    }
    if (alloc.length === 0) throw new Error("No open AR to allocate");
    const applied = data.amountPaise - left;
    const docNo = await nextDoc(sql, "RCT");
    const rct = (
      await sql.query<{ id: number }>(
        `insert into ar_receipt (doc_no, partner_id, receipt_date, amount_paise, created_by)
         values ($1,$2,$3,$4,$5) returning id`,
        [docNo, data.partnerId, todayISO(), applied, staff.user_id],
      )
    )[0]!;
    for (const a of alloc) {
      await sql.query(`insert into ar_receipt_alloc (receipt_id, invoice_id, amount_paise) values ($1,$2,$3)`, [
        rct.id,
        a.invoiceId,
        a.amount,
      ]);
      await sql.query(`update sales_invoice set received_paise = received_paise + $1 where id = $2`, [a.amount, a.invoiceId]);
    }
    await postJournal(sql, {
      narration: `Receipt ${docNo} FIFO`,
      sourceType: "RCT",
      sourceId: rct.id,
      userId: staff.user_id,
      lines: receiptLines(applied),
    });
    return { docNo, applied, alloc };
  });

export const listArAp = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role === "SHOP") throw new Error("SHOP cannot see AR/AP");
    const sql = await erpSql();
    const invoices = await sql.query<Row>(
      `select inv.*, p.name as partner_name, p.credit_limit_paise
         from sales_invoice inv join partner p on p.id = inv.partner_id
        order by inv.id desc limit 50`,
    );
    const bills = await sql.query<Row>(
      `select b.*, p.name as partner_name, p.is_msme,
              case
                when current_date <= b.due_date then '0-45'
                when current_date <= b.due_date + 45 then '46-90'
                else '90+'
              end as age_band
         from vendor_bill b join partner p on p.id = b.partner_id
        order by b.id desc limit 50`,
    );
    const receipts = await sql.query<Row>(`select * from ar_receipt order by id desc limit 30`);
    const grns = await sql.query<Row>(
      `select g.id, g.doc_no, g.grn_date, p.name as partner,
              (select net_kg from grn_line where grn_id = g.id limit 1) as net_kg,
              exists (select 1 from vendor_bill vb where vb.grn_id = g.id) as billed
         from grn g join partner p on p.id = g.partner_id
        order by g.id desc limit 30`,
    );
    return { invoices, bills, receipts, grns };
  });

export const setPeriodStatus = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ yearMonth: z.string(), status: z.enum(["OPEN", "SOFT_CLOSE", "LOCKED"]) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role !== "OWNER" && staff.role !== "ACCOUNTS" && staff.role !== "ADMIN") {
      throw new Error("Only Owner / Accounts can close a period");
    }
    const sql = await erpSql();
    await sql.query(
      `insert into period_lock (year_month, status, closed_by, closed_at)
       values ($1,$2,$3, now())
       on conflict (year_month) do update set status = excluded.status, closed_by = excluded.closed_by, closed_at = now()`,
      [data.yearMonth, data.status, staff.user_id],
    );
    if (data.status === "SOFT_CLOSE" && data.yearMonth.endsWith("-03")) {
      const y = Number(data.yearMonth.slice(0, 4));
      const next = `${String(y).slice(2)}-${String(y + 1).slice(2)}`;
      const already = (await sql.query<{ n: string }>(`select count(*)::int as n from number_series where prefix like $1`, [`%/ ${next}/%`.replace(" ", "")]))[0];
      const has = (
        await sql.query<{ n: string }>(`select count(*)::int as n from number_series where prefix like $1`, [`%/${next}/%`])
      )[0];
      if (n(has?.n) === 0) {
        await sql.query(
          `insert into number_series (doc_type, prefix, next_no, pad)
           values ('INV', $1, 1, 6) on conflict (doc_type) do update set prefix = excluded.prefix, next_no = 1, pad = 6`,
          [`TI/${next}/`],
        );
      }
      void already;
    }
    await audit(sql, { userId: staff.user_id, action: "PERIOD_" + data.status, entity: "period_lock", entityId: data.yearMonth });
    return { yearMonth: data.yearMonth, status: data.status };
  });

export const listPeriods = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    return sql.query<Row>(`select * from period_lock order by year_month`);
  });

export const cancelInvoice = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ invoiceId: z.coerce.number(), reason: z.string().min(3) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const inv = (
      await sql.query<{ id: number; doc_no: string; irn: string | null; irn_ack_dt: string | null; invoice_date: string; status: string }>(
        `select * from sales_invoice where id = $1`,
        [data.invoiceId],
      )
    )[0];
    if (!inv) throw new Error("Invoice not found");
    if (inv.status === "CANCELLED") throw new Error("Already cancelled — number is never reused");
    if (inv.irn) {
      try {
        assertCancelWindow(inv.irn_ack_dt ?? inv.invoice_date);
      } catch {
        throw new Error(CANCEL_CREDIT_NOTE_MSG);
      }
    }
    await sql.query(
      `update sales_invoice set status = 'CANCELLED', cancelled_at = now(), cancel_reason = $1 where id = $2`,
      [data.reason, inv.id],
    );
    await audit(sql, { userId: staff.user_id, action: "INV_CANCEL", entity: "sales_invoice", entityId: inv.id, after: { docNo: inv.doc_no } });
    return { docNo: inv.doc_no, status: "CANCELLED" as const };
  });

export const updateItemMaster = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      itemId: z.coerce.number(),
      hsn: z.string().optional(),
      kgPerPc: z.coerce.number().optional(),
      alloyId: z.coerce.number().optional(),
      stockUom: z.string().optional(),
      confirmSku: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "masters");
    const sql = await erpSql();
    const item = (
      await sql.query<{ id: number; sku: string; hsn: string | null }>(`select id, sku, hsn from item where id = $1`, [data.itemId])
    )[0];
    if (!item) throw new Error("Item not found");
    const risky = data.kgPerPc != null || data.alloyId != null || data.stockUom != null;
    if (risky) {
      const lots = (
        await sql.query<{ n: string }>(
          `select count(*)::int as n from stock_lot where item_id = $1 and status = 'AVAILABLE' and (qty_kg > 0 or qty_pcs > 0)`,
          [item.id],
        )
      )[0];
      if (n(lots?.n) > 0) {
        if (staff.role !== "OWNER" && staff.role !== "ADMIN") {
          throw new Error("Alloy / UOM / kg-per-pc change blocked while AVAILABLE lots exist");
        }
        if (data.confirmSku !== item.sku) {
          throw new Error(`Owner must type the SKU ${item.sku} to change alloy / UOM / kg-per-pc while lots exist`);
        }
      }
    }
    await sql.query(
      `update item set
         hsn = coalesce($1, hsn),
         kg_per_pc = coalesce($2, kg_per_pc),
         alloy_id = coalesce($3, alloy_id),
         stock_uom = coalesce($4, stock_uom)
       where id = $5`,
      [data.hsn ?? null, data.kgPerPc ?? null, data.alloyId ?? null, data.stockUom ?? null, item.id],
    );
    await audit(sql, { userId: staff.user_id, action: "ITEM_UPDATE", entity: "item", entityId: item.id, after: data });
    return { sku: item.sku };
  });

export const getGstWorksheets = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ from: z.string().optional(), to: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role === "SHOP") throw new Error("SHOP cannot see GST worksheets");
    const sql = await erpSql();
    const from = data.from ?? `${new Date().getFullYear()}-04-01`;
    const to = data.to ?? todayISO();
    const company = (await sql.query<{ turnover_above_5cr: boolean }>(`select turnover_above_5cr from company limit 1`))[0];
    const invoices = await sql.query<InvoiceRow>(
      `select inv.doc_no, inv.invoice_date::text, p.gstin, p.name, inv.place_of_supply, inv.is_export,
              inv.taxable_paise, inv.cgst_paise, inv.sgst_paise, inv.igst_paise, inv.total_paise, inv.status,
              coalesce(sil.hsn,'') as hsn, coalesce(sil.qty_pcs,0) as qty_pcs, coalesce(sil.qty_kg,0) as qty_kg
         from sales_invoice inv
         join partner p on p.id = inv.partner_id
         left join sales_invoice_line sil on sil.invoice_id = inv.id`,
    );
    const notes = await sql.query<NoteRow>(
      `select kind, doc_no, note_date::text, original_invoice_no, '' as gstin,
              taxable_paise, cgst_paise, sgst_paise, igst_paise
         from credit_debit_note`,
    );
    const bills = await sql.query<BillRow>(
      `select b.doc_no, b.bill_date::text, p.gstin, p.name, b.taxable_paise, b.cgst_paise, b.sgst_paise, b.igst_paise, b.status
         from vendor_bill b join partner p on p.id = b.partner_id`,
    );
    const challans = await sql.query<ChallanRow>(
      `select c.doc_no, c.issued_at::text, p.name as partner, p.gstin, l.hsn,
              l.qty_pcs, l.qty_kg, c.statutory_due::text, c.status,
              l.returned_pcs,
              coalesce((
                select l.qty_kg
                     - (r.good_pcs * i.kg_per_pc + r.reject_pcs * i.kg_per_pc + coalesce(r.scrap_kg, 0))
                  from job_work_return r
                  join item i on i.id = l.item_id
                 where r.challan_id = c.id
                 limit 1
              ), 0) as actual_loss_kg
         from job_work_challan c
         join partner p on p.id = c.partner_id
         join job_work_challan_line l on l.challan_id = c.id`,
    );
    const series = await sql.query<SeriesRow>(
      `select ns.doc_type, ns.prefix, ns.next_no,
              coalesce((
                select json_agg(doc_no) from (
                  select doc_no from sales_invoice where ns.doc_type in ('INV','TI')
                  union all select doc_no from grn where ns.doc_type = 'GRN'
                  union all select doc_no from job_work_challan where ns.doc_type = 'JW'
                  union all select doc_no from credit_debit_note where ns.doc_type in ('CN','DN')
                ) x
              ), '[]') as used
         from number_series ns`,
    );
    const seriesNorm = series.map((s) => ({
      ...s,
      used: typeof s.used === "string" ? (JSON.parse(s.used) as string[]).filter(Boolean) : ((s.used as string[]) ?? []),
    }));
    const itc = itc04Period(Boolean(company?.turnover_above_5cr), to);
    return {
      watermark: WORKSHEET_WATERMARK,
      from,
      to,
      itc04Period: itc,
      gstr1: gstr1Csv(invoices, notes, from, to, seriesNorm),
      gstr3b: gstr3bCsv(invoices, bills, from, to),
      itc04: itc04Csv(challans, itc.from, itc.to),
      serial: documentsIssued(seriesNorm),
      eway: await sql.query<Row>(`select * from eway_bill order by id desc limit 50`),
    };
  });

export const getPermissionsMatrix = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const { PERMS, ROLES, ROLE_LABEL } = await import("./constants");
    const denials = await (await erpSql()).query<Row>(
      `select at, user_id, entity, after_json from audit_log where action = 'PERM_DENY' order by id desc limit 40`,
    );
    return { perms: PERMS, roles: ROLES, labels: ROLE_LABEL, denials };
  });

export const getHealthz = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await erpSql();
  const mig = await sql.query<{ name: string }>(`select name from _migrations order by name`);
  const last = await sql.query<{ run_at: string; passed: number; failed: number }>(
    `select run_at::text, passed, failed from journey_run order by id desc limit 1`,
  );
  let fileStamp: { runAt?: string; passed?: number; failed?: number } | null = null;
  try {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const raw = JSON.parse(await readFile(join(process.cwd(), "artifacts/journeys-last.json"), "utf8")) as {
      runAt?: string;
      passed?: number;
      failed?: number;
    };
    fileStamp = { runAt: raw.runAt, passed: raw.passed, failed: raw.failed };
  } catch {
    fileStamp = null;
  }
  return {
    ok: true,
    db: "pglite-postgres",
    plantTarget: "postgres",
    migrations: mig.map((m) => m.name),
    lastJourney: last[0] ?? fileStamp,
    lastJourneyFile: fileStamp,
  };
});

export { yearMonth };
