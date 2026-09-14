import { r as createServerFn } from "./ssr.mjs";
import { n as authMiddleware, o as n } from "./format-Bcy9062O.mjs";
import { i as invoiceJournalLines, r as excessLossLines, s as postJournal } from "./journal-CdeDVFjA.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { _n as object, bn as string, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-finance-DafwBR3A.js
var auth = [authMiddleware];
async function assertCreditAllows(sql, partnerId, extraPaise, opts) {
	const p = (await sql.query(`select credit_limit_paise, name from partner where id = $1`, [partnerId]))[0];
	if (!p) throw new Error("Partner not found");
	const open = (await sql.query(`select coalesce(sum(total_paise - received_paise),0)::bigint as ar
         from sales_invoice where partner_id = $1 and status = 'POSTED'`, [partnerId]))[0];
	const overdue = (await sql.query(`select count(*)::int as n from sales_invoice
        where partner_id = $1 and status = 'POSTED' and received_paise < total_paise
          and coalesce(due_date, invoice_date + 30) < current_date`, [partnerId]))[0];
	if (n(overdue?.n) > 0 && !opts?.ownerOverride) throw new Error(`DISPATCH blocked — ${p.name} has overdue invoices. Owner override required.`);
	if (p.credit_limit_paise > 0 && n(open?.ar) + extraPaise > p.credit_limit_paise && !opts?.ownerOverride) throw new Error(`DISPATCH blocked — credit limit exceeded for ${p.name}. Owner override required.`);
}
async function postInvoiceJournal(sql, opts) {
	await postJournal(sql, {
		date: opts.date,
		narration: `Sales invoice #${opts.invoiceId}`,
		sourceType: "INV",
		sourceId: opts.invoiceId,
		userId: opts.userId,
		lines: invoiceJournalLines(opts)
	});
}
async function postExcessLossJournal(sql, opts) {
	if (opts.paise <= 0) return;
	await postJournal(sql, {
		narration: `JW excess loss return #${opts.returnId}`,
		sourceType: "JW_LOSS",
		sourceId: opts.returnId,
		userId: opts.userId,
		lines: excessLossLines(opts.paise)
	});
}
var getTrialBalance = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("b8046068d84529b638feeb56c563c111bc70763e180b8e853428c58928d61cb4"));
var listJournals = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("d6d5ec50f9120a0c0b79a1f21b35cec04dd73b93e0e89b5b1a4df6fe43593ad7"));
createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("61829f03d4bd14468012ceb2e0b6767d0d881295b5057aa456e33e1a01d87cec"));
var postVendorBill = createServerFn({ method: "POST" }).middleware(auth).validator(object({ grnId: number() })).handler(createSsrRpc("115fed9feb4f0997e8d1920d321c8e411d6062cd0cc8a71cc9ca074c1492cb4b"));
createServerFn({ method: "POST" }).middleware(auth).validator(object({ returnId: number() })).handler(createSsrRpc("689d0b1cfbda6ccf3a27f627460215327a79ab84447bedbc26a5709b522cadd9"));
var postReceipt = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	partnerId: number(),
	amountPaise: number().positive(),
	invoiceId: number().optional()
})).handler(createSsrRpc("767303ae39e70b28d38fc4470838e997ebac7d32a74001f63dc86b0481c609ce"));
var listArAp = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("6fdb6fe4ae7e08dffe8f46aa909fbde67b970101e85ba43c16bd05ab2c53c10b"));
var setPeriodStatus = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	yearMonth: string(),
	status: _enum([
		"OPEN",
		"SOFT_CLOSE",
		"LOCKED"
	])
})).handler(createSsrRpc("f5b7d77a8af298acecbae023cde0c0b2a7f989122c94906a1e4c8218553a2284"));
var listPeriods = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("b2c0e5a22a90d9eec2886302453583601fbaa652648c214724bf4a37195ffbd6"));
createServerFn({ method: "POST" }).middleware(auth).validator(object({
	invoiceId: number(),
	reason: string().min(3)
})).handler(createSsrRpc("42157040cb527869f974ca7d674f3f936dc31217206baf6ec28c50ff82fa124e"));
createServerFn({ method: "POST" }).middleware(auth).validator(object({
	itemId: number(),
	hsn: string().optional(),
	kgPerPc: number().optional(),
	alloyId: number().optional(),
	stockUom: string().optional(),
	confirmSku: string().optional()
})).handler(createSsrRpc("0c8e9c84c6e412af5f1f9e7c850ad2a8293b107903863f73ff0d6ab357ee952d"));
var getGstWorksheets = createServerFn({ method: "GET" }).middleware(auth).validator(object({
	from: string().optional(),
	to: string().optional()
})).handler(createSsrRpc("3432f7c26f2bbf7fbcc28f5ca2e32545a19b920e3785ee42ee04b126c35f7dc0"));
var getPermissionsMatrix = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("cf245a36df879ec1d9718f26222bef33fe76bae1f8deaf1c8fd4eec9dfaa33eb"));
var getHealthz = createServerFn({ method: "GET" }).handler(createSsrRpc("3362337d970255e1eb0c53cc2237606254e603fa816fdfd2b430247e1ea54d21"));
//#endregion
export { getTrialBalance as a, listPeriods as c, postReceipt as d, postVendorBill as f, getPermissionsMatrix as i, postExcessLossJournal as l, getGstWorksheets as n, listArAp as o, setPeriodStatus as p, getHealthz as r, listJournals as s, assertCreditAllows as t, postInvoiceJournal as u };
