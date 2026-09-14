import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as todayISO, n as authMiddleware, o as n } from "./format-Bcy9062O.mjs";
import { a as nextDoc, i as erpSql, n as audit, o as requireStaff, t as assertPerm } from "./core.server-BOQw3eDO.mjs";
import { c as receiptLines, l as trialBalance, n as billMatchLines, o as jwVendorBillLines, s as postJournal, t as assertPeriodAllows } from "./journal-CdeDVFjA.mjs";
import { _n as object, bn as string, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
import { t as uid } from "./row-CXk8IdOY.mjs";
import { r as gstBreakup } from "./tax-TUTmm3iB.mjs";
import { a as itc04Csv, i as gstr3bCsv, n as documentsIssued, o as itc04Period, r as gstr1Csv, t as WORKSHEET_WATERMARK } from "./gst-worksheets-nHLWxJiz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-finance-DGY-2kYz.js
var auth = [authMiddleware];
var getTrialBalance_createServerFn_handler = createServerRpc({
	id: "b8046068d84529b638feeb56c563c111bc70763e180b8e853428c58928d61cb4",
	name: "getTrialBalance",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => getTrialBalance.__executeServer(opts));
var getTrialBalance = createServerFn({ method: "GET" }).middleware(auth).handler(getTrialBalance_createServerFn_handler, async ({ context }) => {
	if ((await requireStaff(uid(context))).role === "SHOP") throw new Error("SHOP cannot see the chart of accounts");
	const sql = await erpSql();
	return trialBalance(sql);
});
var listJournals_createServerFn_handler = createServerRpc({
	id: "d6d5ec50f9120a0c0b79a1f21b35cec04dd73b93e0e89b5b1a4df6fe43593ad7",
	name: "listJournals",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => listJournals.__executeServer(opts));
var listJournals = createServerFn({ method: "GET" }).middleware(auth).handler(listJournals_createServerFn_handler, async ({ context }) => {
	if ((await requireStaff(uid(context))).role === "SHOP") throw new Error("SHOP cannot see journals");
	const sql = await erpSql();
	return {
		headers: await sql.query(`select * from journal order by id desc limit 80`),
		lines: await sql.query(`select l.*, a.name as account_name from journal_line l
         join chart_of_accounts a on a.code = l.account_code
        where l.journal_id in (select id from journal order by id desc limit 80)
        order by l.journal_id, l.line_no`)
	};
});
var listCoa_createServerFn_handler = createServerRpc({
	id: "61829f03d4bd14468012ceb2e0b6767d0d881295b5057aa456e33e1a01d87cec",
	name: "listCoa",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => listCoa.__executeServer(opts));
var listCoa = createServerFn({ method: "GET" }).middleware(auth).handler(listCoa_createServerFn_handler, async ({ context }) => {
	if ((await requireStaff(uid(context))).role === "SHOP") throw new Error("SHOP cannot see the chart of accounts");
	return (await erpSql()).query(`select * from chart_of_accounts order by code`);
});
var postVendorBill_createServerFn_handler = createServerRpc({
	id: "115fed9feb4f0997e8d1920d321c8e411d6062cd0cc8a71cc9ca074c1492cb4b",
	name: "postVendorBill",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => postVendorBill.__executeServer(opts));
var postVendorBill = createServerFn({ method: "POST" }).middleware(auth).validator(object({ grnId: number() })).handler(postVendorBill_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "purchase");
	const sql = await erpSql();
	const grn = (await sql.query(`select * from grn where id = $1`, [data.grnId]))[0];
	if (!grn) throw new Error("GRN not found");
	if ((await sql.query(`select id from vendor_bill where grn_id = $1`, [grn.id]))[0]) throw new Error("GRN already billed");
	await assertPeriodAllows(sql, todayISO(), "BILL");
	const line = (await sql.query(`select item_id, net_kg, po_line_id from grn_line where grn_id = $1`, [grn.id]))[0];
	if (!line) throw new Error("GRN has no lines");
	const rate = (line.po_line_id ? (await sql.query(`select rate_paise_per_kg from po_line where id = $1`, [line.po_line_id]))[0] : null)?.rate_paise_per_kg ?? 62e3;
	const qty = n(line.net_kg);
	const taxable = Math.round(qty * rate);
	const partner = (await sql.query(`select state_code, is_msme, credit_days from partner where id = $1`, [grn.partner_id]))[0];
	const company = (await sql.query(`select state_code from company limit 1`))[0];
	const gst = gstBreakup({
		taxablePaise: taxable,
		gstPct: 18,
		fromState: company.state_code,
		toState: partner.state_code,
		isExport: false
	});
	const dueDays = partner.is_msme ? partner.credit_days || 45 : partner.credit_days || 45;
	const due = /* @__PURE__ */ new Date(todayISO() + "T00:00:00Z");
	due.setUTCDate(due.getUTCDate() + dueDays);
	const docNo = await nextDoc(sql, "BILL");
	const bill = (await sql.query(`insert into vendor_bill (
           doc_no, partner_id, bill_date, due_date, grn_id, kind,
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status, created_by
         ) values ($1,$2,$3,$4,$5,'GRN',$6,$7,$8,$9,$10,'POSTED',$11) returning id`, [
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
		staff.user_id
	]))[0];
	await sql.query(`insert into vendor_bill_line (bill_id, item_id, qty, qty_uom, rate_paise, taxable_paise)
       values ($1,$2,$3,'KG',$4,$5)`, [
		bill.id,
		line.item_id,
		qty,
		rate,
		taxable
	]);
	await postJournal(sql, {
		narration: `3-way bill ${docNo} clears GRNI on ${grn.doc_no}`,
		sourceType: "BILL",
		sourceId: bill.id,
		userId: staff.user_id,
		lines: billMatchLines({
			taxablePaise: taxable,
			cgstPaise: gst.cgst,
			sgstPaise: gst.sgst,
			igstPaise: gst.igst
		})
	});
	await audit(sql, {
		userId: staff.user_id,
		action: "VENDOR_BILL",
		entity: "vendor_bill",
		entityId: bill.id,
		after: {
			docNo,
			grn: grn.doc_no,
			qty
		}
	});
	return {
		docNo,
		id: bill.id,
		taxable,
		qty
	};
});
var postJwVendorBill_createServerFn_handler = createServerRpc({
	id: "689d0b1cfbda6ccf3a27f627460215327a79ab84447bedbc26a5709b522cadd9",
	name: "postJwVendorBill",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => postJwVendorBill.__executeServer(opts));
var postJwVendorBill = createServerFn({ method: "POST" }).middleware(auth).validator(object({ returnId: number() })).handler(postJwVendorBill_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "purchase");
	const sql = await erpSql();
	const ret = (await sql.query(`select id, challan_id, good_pcs from job_work_return where id = $1`, [data.returnId]))[0];
	if (!ret) throw new Error("JW return not found");
	const ch = (await sql.query(`select partner_id, process_code from job_work_challan where id = $1`, [ret.challan_id]))[0];
	const line = (await sql.query(`select l.item_id from job_work_challan_line l where l.challan_id = $1 limit 1`, [ret.challan_id]))[0];
	const item = (await sql.query(`select family from item where id = $1`, [line.item_id]))[0];
	const rate = (await sql.query(`select rate_paise_per_pc from partner_process_rate
          where partner_id = $1 and process_code = $2
            and (item_family = $3 or item_family = '')
          order by case when item_family = $3 then 0 else 1 end limit 1`, [
		ch.partner_id,
		ch.process_code,
		item?.family ?? ""
	]))[0];
	const qty = n(ret.good_pcs);
	const taxable = Math.round(qty * (rate?.rate_paise_per_pc ?? 0));
	const gst = {
		cgst: Math.round(taxable * .09),
		sgst: Math.round(taxable * .09),
		igst: 0
	};
	await assertPeriodAllows(sql, todayISO(), "BILL");
	const partner = (await sql.query(`select is_msme, credit_days from partner where id = $1`, [ch.partner_id]))[0];
	const due = /* @__PURE__ */ new Date(todayISO() + "T00:00:00Z");
	due.setUTCDate(due.getUTCDate() + (partner.credit_days || 45));
	const docNo = await nextDoc(sql, "BILL");
	const bill = (await sql.query(`insert into vendor_bill (
           doc_no, partner_id, bill_date, due_date, jw_return_id, kind,
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status, created_by
         ) values ($1,$2,$3,$4,$5,'JW',$6,$7,$8,$9,$10,'POSTED',$11) returning id`, [
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
		staff.user_id
	]))[0];
	await sql.query(`insert into vendor_bill_line (bill_id, item_id, qty, qty_uom, rate_paise, taxable_paise)
       values ($1,$2,$3,'PCS',$4,$5)`, [
		bill.id,
		line.item_id,
		qty,
		rate?.rate_paise_per_pc ?? 0,
		taxable
	]);
	await postJournal(sql, {
		narration: `JW vendor bill ${docNo} on returned good ${qty} pcs`,
		sourceType: "BILL",
		sourceId: bill.id,
		userId: staff.user_id,
		lines: jwVendorBillLines({
			chargesPaise: taxable,
			cgstPaise: gst.cgst,
			sgstPaise: gst.sgst
		})
	});
	return {
		docNo,
		id: bill.id,
		qty,
		taxable
	};
});
var postReceipt_createServerFn_handler = createServerRpc({
	id: "767303ae39e70b28d38fc4470838e997ebac7d32a74001f63dc86b0481c609ce",
	name: "postReceipt",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => postReceipt.__executeServer(opts));
var postReceipt = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	partnerId: number(),
	amountPaise: number().positive(),
	invoiceId: number().optional()
})).handler(postReceipt_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "invoice");
	const sql = await erpSql();
	await assertPeriodAllows(sql, todayISO(), "JOURNAL");
	const open = await sql.query(`select id, total_paise, received_paise, doc_no from sales_invoice
        where partner_id = $1 and status = 'POSTED' and received_paise < total_paise
        order by invoice_date, id`, [data.partnerId]);
	let left = data.amountPaise;
	const alloc = [];
	const prefer = data.invoiceId ? open.filter((i) => i.id === data.invoiceId).concat(open.filter((i) => i.id !== data.invoiceId)) : open;
	for (const inv of prefer) {
		if (left <= 0) break;
		const due = n(inv.total_paise) - n(inv.received_paise);
		const take = Math.min(due, left);
		alloc.push({
			invoiceId: inv.id,
			amount: take
		});
		left -= take;
	}
	if (alloc.length === 0) throw new Error("No open AR to allocate");
	const applied = data.amountPaise - left;
	const docNo = await nextDoc(sql, "RCT");
	const rct = (await sql.query(`insert into ar_receipt (doc_no, partner_id, receipt_date, amount_paise, created_by)
         values ($1,$2,$3,$4,$5) returning id`, [
		docNo,
		data.partnerId,
		todayISO(),
		applied,
		staff.user_id
	]))[0];
	for (const a of alloc) {
		await sql.query(`insert into ar_receipt_alloc (receipt_id, invoice_id, amount_paise) values ($1,$2,$3)`, [
			rct.id,
			a.invoiceId,
			a.amount
		]);
		await sql.query(`update sales_invoice set received_paise = received_paise + $1 where id = $2`, [a.amount, a.invoiceId]);
	}
	await postJournal(sql, {
		narration: `Receipt ${docNo} FIFO`,
		sourceType: "RCT",
		sourceId: rct.id,
		userId: staff.user_id,
		lines: receiptLines(applied)
	});
	return {
		docNo,
		applied,
		alloc
	};
});
var listArAp_createServerFn_handler = createServerRpc({
	id: "6fdb6fe4ae7e08dffe8f46aa909fbde67b970101e85ba43c16bd05ab2c53c10b",
	name: "listArAp",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => listArAp.__executeServer(opts));
var listArAp = createServerFn({ method: "GET" }).middleware(auth).handler(listArAp_createServerFn_handler, async ({ context }) => {
	if ((await requireStaff(uid(context))).role === "SHOP") throw new Error("SHOP cannot see AR/AP");
	const sql = await erpSql();
	return {
		invoices: await sql.query(`select inv.*, p.name as partner_name, p.credit_limit_paise
         from sales_invoice inv join partner p on p.id = inv.partner_id
        order by inv.id desc limit 50`),
		bills: await sql.query(`select b.*, p.name as partner_name, p.is_msme,
              case
                when current_date <= b.due_date then '0-45'
                when current_date <= b.due_date + 45 then '46-90'
                else '90+'
              end as age_band
         from vendor_bill b join partner p on p.id = b.partner_id
        order by b.id desc limit 50`),
		receipts: await sql.query(`select * from ar_receipt order by id desc limit 30`),
		grns: await sql.query(`select g.id, g.doc_no, g.grn_date, p.name as partner,
              (select net_kg from grn_line where grn_id = g.id limit 1) as net_kg,
              exists (select 1 from vendor_bill vb where vb.grn_id = g.id) as billed
         from grn g join partner p on p.id = g.partner_id
        order by g.id desc limit 30`)
	};
});
var setPeriodStatus_createServerFn_handler = createServerRpc({
	id: "f5b7d77a8af298acecbae023cde0c0b2a7f989122c94906a1e4c8218553a2284",
	name: "setPeriodStatus",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => setPeriodStatus.__executeServer(opts));
var setPeriodStatus = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	yearMonth: string(),
	status: _enum([
		"OPEN",
		"SOFT_CLOSE",
		"LOCKED"
	])
})).handler(setPeriodStatus_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	if (staff.role !== "OWNER" && staff.role !== "ACCOUNTS" && staff.role !== "ADMIN") throw new Error("Only Owner / Accounts can close a period");
	const sql = await erpSql();
	await sql.query(`insert into period_lock (year_month, status, closed_by, closed_at)
       values ($1,$2,$3, now())
       on conflict (year_month) do update set status = excluded.status, closed_by = excluded.closed_by, closed_at = now()`, [
		data.yearMonth,
		data.status,
		staff.user_id
	]);
	if (data.status === "SOFT_CLOSE" && data.yearMonth.endsWith("-03")) {
		const y = Number(data.yearMonth.slice(0, 4));
		const next = `${String(y).slice(2)}-${String(y + 1).slice(2)}`;
		(await sql.query(`select count(*)::int as n from number_series where prefix like $1`, [`%/ ${next}/%`.replace(" ", "")]))[0];
		const has = (await sql.query(`select count(*)::int as n from number_series where prefix like $1`, [`%/${next}/%`]))[0];
		if (n(has?.n) === 0) await sql.query(`insert into number_series (doc_type, prefix, next_no, pad)
           values ('INV', $1, 1, 6) on conflict (doc_type) do update set prefix = excluded.prefix, next_no = 1, pad = 6`, [`TI/${next}/`]);
	}
	await audit(sql, {
		userId: staff.user_id,
		action: "PERIOD_" + data.status,
		entity: "period_lock",
		entityId: data.yearMonth
	});
	return {
		yearMonth: data.yearMonth,
		status: data.status
	};
});
var listPeriods_createServerFn_handler = createServerRpc({
	id: "b2c0e5a22a90d9eec2886302453583601fbaa652648c214724bf4a37195ffbd6",
	name: "listPeriods",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => listPeriods.__executeServer(opts));
var listPeriods = createServerFn({ method: "GET" }).middleware(auth).handler(listPeriods_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	return (await erpSql()).query(`select * from period_lock order by year_month`);
});
var cancelInvoice_createServerFn_handler = createServerRpc({
	id: "42157040cb527869f974ca7d674f3f936dc31217206baf6ec28c50ff82fa124e",
	name: "cancelInvoice",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => cancelInvoice.__executeServer(opts));
var cancelInvoice = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	invoiceId: number(),
	reason: string().min(3)
})).handler(cancelInvoice_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "invoice");
	const sql = await erpSql();
	const inv = (await sql.query(`select * from sales_invoice where id = $1`, [data.invoiceId]))[0];
	if (!inv) throw new Error("Invoice not found");
	if (inv.status === "CANCELLED") throw new Error("Already cancelled — number is never reused");
	if (inv.irn) {
		const ack = inv.irn_ack_dt ? new Date(inv.irn_ack_dt) : new Date(inv.invoice_date);
		if (Date.now() - ack.getTime() > 864e5) throw new Error("E-invoice stub window (24h) has closed — raise a credit note. Number stays in documents-issued.");
	}
	await sql.query(`update sales_invoice set status = 'CANCELLED', cancelled_at = now(), cancel_reason = $1 where id = $2`, [data.reason, inv.id]);
	await audit(sql, {
		userId: staff.user_id,
		action: "INV_CANCEL",
		entity: "sales_invoice",
		entityId: inv.id,
		after: { docNo: inv.doc_no }
	});
	return {
		docNo: inv.doc_no,
		status: "CANCELLED"
	};
});
var updateItemMaster_createServerFn_handler = createServerRpc({
	id: "0c8e9c84c6e412af5f1f9e7c850ad2a8293b107903863f73ff0d6ab357ee952d",
	name: "updateItemMaster",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => updateItemMaster.__executeServer(opts));
var updateItemMaster = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	itemId: number(),
	hsn: string().optional(),
	kgPerPc: number().optional(),
	alloyId: number().optional(),
	stockUom: string().optional(),
	confirmSku: string().optional()
})).handler(updateItemMaster_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "masters");
	const sql = await erpSql();
	const item = (await sql.query(`select id, sku, hsn from item where id = $1`, [data.itemId]))[0];
	if (!item) throw new Error("Item not found");
	if (data.kgPerPc != null || data.alloyId != null || data.stockUom != null) {
		const lots = (await sql.query(`select count(*)::int as n from stock_lot where item_id = $1 and status = 'AVAILABLE' and (qty_kg > 0 or qty_pcs > 0)`, [item.id]))[0];
		if (n(lots?.n) > 0) {
			if (staff.role !== "OWNER" && staff.role !== "ADMIN") throw new Error("Alloy / UOM / kg-per-pc change blocked while AVAILABLE lots exist");
			if (data.confirmSku !== item.sku) throw new Error(`Owner must type the SKU ${item.sku} to change alloy / UOM / kg-per-pc while lots exist`);
		}
	}
	await sql.query(`update item set
         hsn = coalesce($1, hsn),
         kg_per_pc = coalesce($2, kg_per_pc),
         alloy_id = coalesce($3, alloy_id),
         stock_uom = coalesce($4, stock_uom)
       where id = $5`, [
		data.hsn ?? null,
		data.kgPerPc ?? null,
		data.alloyId ?? null,
		data.stockUom ?? null,
		item.id
	]);
	await audit(sql, {
		userId: staff.user_id,
		action: "ITEM_UPDATE",
		entity: "item",
		entityId: item.id,
		after: data
	});
	return { sku: item.sku };
});
var getGstWorksheets_createServerFn_handler = createServerRpc({
	id: "3432f7c26f2bbf7fbcc28f5ca2e32545a19b920e3785ee42ee04b126c35f7dc0",
	name: "getGstWorksheets",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => getGstWorksheets.__executeServer(opts));
var getGstWorksheets = createServerFn({ method: "GET" }).middleware(auth).validator(object({
	from: string().optional(),
	to: string().optional()
})).handler(getGstWorksheets_createServerFn_handler, async ({ context, data }) => {
	if ((await requireStaff(uid(context))).role === "SHOP") throw new Error("SHOP cannot see GST worksheets");
	const sql = await erpSql();
	const from = data.from ?? `${(/* @__PURE__ */ new Date()).getFullYear()}-04-01`;
	const to = data.to ?? todayISO();
	const company = (await sql.query(`select turnover_above_5cr from company limit 1`))[0];
	const invoices = await sql.query(`select inv.doc_no, inv.invoice_date::text, p.gstin, p.name, inv.place_of_supply, inv.is_export,
              inv.taxable_paise, inv.cgst_paise, inv.sgst_paise, inv.igst_paise, inv.total_paise, inv.status,
              coalesce(sil.hsn,'') as hsn, coalesce(sil.qty_pcs,0) as qty_pcs, coalesce(sil.qty_kg,0) as qty_kg
         from sales_invoice inv
         join partner p on p.id = inv.partner_id
         left join sales_invoice_line sil on sil.invoice_id = inv.id`);
	const notes = await sql.query(`select kind, doc_no, note_date::text, original_invoice_no, '' as gstin,
              taxable_paise, cgst_paise, sgst_paise, igst_paise
         from credit_debit_note`);
	const bills = await sql.query(`select b.doc_no, b.bill_date::text, p.gstin, p.name, b.taxable_paise, b.cgst_paise, b.sgst_paise, b.igst_paise, b.status
         from vendor_bill b join partner p on p.id = b.partner_id`);
	const challans = await sql.query(`select c.doc_no, c.issued_at::text, p.name as partner, p.gstin, l.hsn,
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
         join job_work_challan_line l on l.challan_id = c.id`);
	const seriesNorm = (await sql.query(`select ns.doc_type, ns.prefix, ns.next_no,
              coalesce((
                select json_agg(doc_no) from (
                  select doc_no from sales_invoice where ns.doc_type in ('INV','TI')
                  union all select doc_no from grn where ns.doc_type = 'GRN'
                  union all select doc_no from job_work_challan where ns.doc_type = 'JW'
                  union all select doc_no from credit_debit_note where ns.doc_type in ('CN','DN')
                ) x
              ), '[]') as used
         from number_series ns`)).map((s) => ({
		...s,
		used: typeof s.used === "string" ? JSON.parse(s.used).filter(Boolean) : s.used ?? []
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
		eway: await sql.query(`select * from eway_bill order by id desc limit 50`)
	};
});
var getPermissionsMatrix_createServerFn_handler = createServerRpc({
	id: "cf245a36df879ec1d9718f26222bef33fe76bae1f8deaf1c8fd4eec9dfaa33eb",
	name: "getPermissionsMatrix",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => getPermissionsMatrix.__executeServer(opts));
var getPermissionsMatrix = createServerFn({ method: "GET" }).middleware(auth).handler(getPermissionsMatrix_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const { PERMS, ROLES, ROLE_LABEL } = await import("./constants-D3MrD-wy.mjs").then((n) => n.a).then((n) => n.a);
	return {
		perms: PERMS,
		roles: ROLES,
		labels: ROLE_LABEL,
		denials: await (await erpSql()).query(`select at, user_id, entity, after_json from audit_log where action = 'PERM_DENY' order by id desc limit 40`)
	};
});
var getHealthz_createServerFn_handler = createServerRpc({
	id: "3362337d970255e1eb0c53cc2237606254e603fa816fdfd2b430247e1ea54d21",
	name: "getHealthz",
	filename: "src/lib/erp/api-finance.ts"
}, (opts) => getHealthz.__executeServer(opts));
var getHealthz = createServerFn({ method: "GET" }).handler(getHealthz_createServerFn_handler, async () => {
	const sql = await erpSql();
	const mig = await sql.query(`select name from _migrations order by name`);
	const last = await sql.query(`select run_at::text, passed, failed from journey_run order by id desc limit 1`);
	let fileStamp = null;
	try {
		const { readFile } = await import("node:fs/promises");
		const { join } = await import("node:path");
		const raw = JSON.parse(await readFile(join(process.cwd(), "artifacts/journeys-last.json"), "utf8"));
		fileStamp = {
			runAt: raw.runAt,
			passed: raw.passed,
			failed: raw.failed
		};
	} catch {
		fileStamp = null;
	}
	return {
		ok: true,
		db: "pglite-postgres",
		plantTarget: "postgres",
		migrations: mig.map((m) => m.name),
		lastJourney: last[0] ?? fileStamp,
		lastJourneyFile: fileStamp
	};
});
//#endregion
export { cancelInvoice_createServerFn_handler, getGstWorksheets_createServerFn_handler, getHealthz_createServerFn_handler, getPermissionsMatrix_createServerFn_handler, getTrialBalance_createServerFn_handler, listArAp_createServerFn_handler, listCoa_createServerFn_handler, listJournals_createServerFn_handler, listPeriods_createServerFn_handler, postJwVendorBill_createServerFn_handler, postReceipt_createServerFn_handler, postVendorBill_createServerFn_handler, setPeriodStatus_createServerFn_handler, updateItemMaster_createServerFn_handler };
