import { o as n } from "./format-Bcy9062O.mjs";
import { n as financialYearLabel, o as toIsoDate, r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gst-worksheets-nHLWxJiz.js
/** GST worksheets a CA can file from. Not a GSTN login. Dates IST. FY 1 Apr–31 Mar. */
var WORKSHEET_WATERMARK = "Worksheet only. Not a filed return.";
function csvEscape(v) {
	const s = v == null ? "" : String(v);
	if (/[",\n]/.test(s)) return `"${s.replace(/"/g, "\"\"")}"`;
	return s;
}
function toCsv(headers, rows) {
	return [headers.map(csvEscape).join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n") + "\n";
}
function inPeriod(iso, from, to) {
	const d = toIsoDate(iso);
	return d >= from && d <= to;
}
function gstr1B2b(invoices, from, to) {
	return invoices.filter((i) => i.status !== "CANCELLED" && !i.is_export && Boolean(i.gstin) && inPeriod(i.invoice_date, from, to));
}
function gstr1B2cl(invoices, from, to) {
	return invoices.filter((i) => i.status !== "CANCELLED" && !i.is_export && !i.gstin && inPeriod(i.invoice_date, from, to));
}
function gstr1Hsn(invoices, from, to) {
	const map = /* @__PURE__ */ new Map();
	for (const i of invoices.filter((x) => x.status !== "CANCELLED" && inPeriod(x.invoice_date, from, to))) {
		const h = i.hsn || "—";
		const cur = map.get(h) ?? {
			hsn: h,
			qty: 0,
			kg: 0,
			taxable: 0,
			cgst: 0,
			sgst: 0,
			igst: 0
		};
		cur.qty += n(i.qty_pcs);
		cur.kg += n(i.qty_kg);
		cur.taxable += n(i.taxable_paise);
		cur.cgst += n(i.cgst_paise);
		cur.sgst += n(i.sgst_paise);
		cur.igst += n(i.igst_paise);
		map.set(h, cur);
	}
	return [...map.values()];
}
function gstr3bOutward(invoices, from, to) {
	const rows = invoices.filter((i) => i.status !== "CANCELLED" && inPeriod(i.invoice_date, from, to));
	return {
		taxable: rows.reduce((s, r) => s + n(r.taxable_paise), 0),
		cgst: rows.reduce((s, r) => s + n(r.cgst_paise), 0),
		sgst: rows.reduce((s, r) => s + n(r.sgst_paise), 0),
		igst: rows.reduce((s, r) => s + n(r.igst_paise), 0)
	};
}
function gstr3bItc(bills, from, to) {
	const rows = bills.filter((b) => b.status === "POSTED" && inPeriod(b.bill_date, from, to));
	return {
		cgst: rows.reduce((s, r) => s + n(r.cgst_paise), 0),
		sgst: rows.reduce((s, r) => s + n(r.sgst_paise), 0),
		igst: rows.reduce((s, r) => s + n(r.igst_paise), 0)
	};
}
function itc04Period(turnoverAbove5Cr, asOf) {
	const fy = financialYearLabel(asOf);
	const [a, b] = fy.split("-").map((x) => 2e3 + Number(x));
	const start = `${a}-04-01`;
	const end = `${b}-03-31`;
	if (!turnoverAbove5Cr) return {
		from: start,
		to: end,
		label: `FY ${fy}`
	};
	const m = Number(asOf.slice(5, 7));
	if (m >= 4 && m <= 9) return {
		from: `${a}-04-01`,
		to: `${a}-09-30`,
		label: `H1 ${fy}`
	};
	return {
		from: `${a}-10-01`,
		to: end,
		label: `H2 ${fy}`
	};
}
function documentsIssued(series) {
	return series.map((s) => {
		const nums = s.used.map((d) => {
			const m = d.match(/(\d+)$/);
			return m ? Number(m[1]) : 0;
		});
		const max = Math.max(0, ...nums, s.next_no - 1);
		const missing = [];
		const set = new Set(nums);
		for (let i = 1; i <= max; i++) if (!set.has(i)) missing.push(i);
		return {
			doc_type: s.doc_type,
			prefix: s.prefix,
			issued: nums.length,
			next: s.next_no,
			gaps: missing
		};
	});
}
function gstr1Csv(invoices, notes, from, to, series = []) {
	const b2b = gstr1B2b(invoices, from, to);
	const b2cl = gstr1B2cl(invoices, from, to);
	const hsn = gstr1Hsn(invoices, from, to);
	const cdnr = notes.filter((n0) => inPeriod(n0.note_date, from, to));
	const issued = documentsIssued(series);
	return [
		WORKSHEET_WATERMARK,
		"GSTR-1 B2B",
		toCsv([
			"GSTIN",
			"Invoice",
			"Date",
			"Place of supply",
			"Taxable ₹",
			"CGST ₹",
			"SGST ₹",
			"IGST ₹",
			"Total ₹"
		], b2b.map((i) => [
			i.gstin,
			i.doc_no,
			formatDateIN(i.invoice_date),
			i.place_of_supply,
			n(i.taxable_paise) / 100,
			n(i.cgst_paise) / 100,
			n(i.sgst_paise) / 100,
			n(i.igst_paise) / 100,
			n(i.total_paise) / 100
		])),
		"GSTR-1 B2CL (unregistered)",
		toCsv([
			"Invoice",
			"Date",
			"Place of supply",
			"Taxable ₹",
			"IGST ₹",
			"Total ₹"
		], b2cl.map((i) => [
			i.doc_no,
			formatDateIN(i.invoice_date),
			i.place_of_supply,
			n(i.taxable_paise) / 100,
			n(i.igst_paise) / 100,
			n(i.total_paise) / 100
		])),
		"GSTR-1 HSN Table 12",
		toCsv([
			"HSN",
			"Qty NOS",
			"Qty KGS",
			"Taxable ₹",
			"CGST ₹",
			"SGST ₹",
			"IGST ₹"
		], hsn.map((h) => [
			h.hsn,
			h.qty,
			h.kg,
			h.taxable / 100,
			h.cgst / 100,
			h.sgst / 100,
			h.igst / 100
		])),
		"GSTR-1 CDNR",
		toCsv([
			"Kind",
			"Note",
			"Date",
			"Original invoice",
			"GSTIN",
			"Taxable ₹"
		], cdnr.map((c) => [
			c.kind,
			c.doc_no,
			formatDateIN(c.note_date),
			c.original_invoice_no,
			c.gstin,
			n(c.taxable_paise) / 100
		])),
		"GSTR-1 documents issued",
		toCsv([
			"Doc type",
			"Prefix",
			"Issued",
			"Next",
			"Gaps"
		], issued.map((s) => [
			s.doc_type,
			s.prefix,
			s.issued,
			s.next,
			s.gaps.length ? s.gaps.join(" ") : ""
		]))
	].join("\n");
}
function gstr3bCsv(invoices, bills, from, to) {
	const out = gstr3bOutward(invoices, from, to);
	const itc = gstr3bItc(bills, from, to);
	return [
		WORKSHEET_WATERMARK,
		"GSTR-3B 3.1 Outward supplies",
		toCsv([
			"Description",
			"Taxable ₹",
			"CGST ₹",
			"SGST ₹",
			"IGST ₹"
		], [[
			"Outward taxable",
			out.taxable / 100,
			out.cgst / 100,
			out.sgst / 100,
			out.igst / 100
		]]),
		"GSTR-3B 4 Eligible ITC (POSTED vendor bills only)",
		toCsv([
			"Description",
			"CGST ₹",
			"SGST ₹",
			"IGST ₹"
		], [[
			"ITC from posted bills",
			itc.cgst / 100,
			itc.sgst / 100,
			itc.igst / 100
		]])
	].join("\n");
}
function itc04Csv(challans, from, to) {
	const sent = challans.filter((c) => inPeriod(c.issued_at, from, to));
	const back = challans.filter((c) => n(c.returned_pcs) > 0 && inPeriod(c.issued_at, from, to));
	return [
		WORKSHEET_WATERMARK,
		"ITC-04 Table 4 — Details of inputs/capital goods sent to job worker",
		toCsv([
			"GSTIN of job worker",
			"Challan number",
			"Challan date",
			"Description of goods",
			"UQC",
			"Quantity",
			"Taxable value / qty kg",
			"Type of goods"
		], sent.map((c) => [
			c.gstin,
			c.doc_no,
			formatDateIN(c.issued_at),
			"Brass parts",
			"NOS",
			c.qty_pcs,
			c.qty_kg,
			"Inputs"
		])),
		"ITC-04 Table 5A — Details of inputs/capital goods received back from job worker",
		toCsv([
			"Original challan number",
			"GSTIN of job worker",
			"Quantity received back (NOS)",
			"Losses (kg) — posted actualLossKg",
			"Statutory due"
		], back.map((c) => [
			c.doc_no,
			c.gstin,
			c.returned_pcs,
			c.actual_loss_kg,
			formatDateIN(c.statutory_due)
		])),
		"ITC-04 Table 5B — Received from another job worker",
		toCsv([
			"Original challan",
			"GSTIN of another JW",
			"Quantity"
		], [])
	].join("\n");
}
//#endregion
export { itc04Csv as a, gstr3bCsv as i, documentsIssued as n, itc04Period as o, gstr1Csv as r, toCsv as s, WORKSHEET_WATERMARK as t };
