//#region node_modules/.nitro/vite/services/ssr/assets/tax-TUTmm3iB.js
/**
* CGST Act s.8 / s.12 + IGST Act s.5 — intra-state CGST+SGST; inter-state IGST;
* export of goods: LUT = 0 tax, or IGST-paid = IGST only. Never both heads on one line.
*/
function n(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
function classifySupply(opts) {
	if (opts.isExport) return opts.exportMode === "IGST" ? "EXPORT_IGST" : "EXPORT_LUT";
	const a = (opts.fromState ?? "").padStart(2, "0");
	const b = (opts.toState ?? "").padStart(2, "0");
	if (a && b && a === b) return "INTRA";
	return "INTER";
}
function gstBreakup(opts) {
	const kind = classifySupply(opts);
	return gstBreakupForKind(n(opts.taxablePaise), n(opts.gstPct), kind);
}
function gstBreakupForKind(taxablePaise, gstPct, kind) {
	const tax = Math.round(n(taxablePaise) * (n(gstPct) / 100));
	if (kind === "EXPORT_LUT") return {
		cgst: 0,
		sgst: 0,
		igst: 0
	};
	if (kind === "EXPORT_IGST" || kind === "INTER") return {
		cgst: 0,
		sgst: 0,
		igst: tax
	};
	const half = Math.round(tax / 2);
	return {
		cgst: half,
		sgst: tax - half,
		igst: 0
	};
}
function lineTotalPaise(taxable, disc, tax) {
	return n(taxable) - n(disc) + tax.cgst + tax.sgst + tax.igst;
}
function roundOffToRupee(totalPaise) {
	const rounded = Math.round(n(totalPaise) / 100) * 100;
	return {
		rounded,
		roundOff: rounded - Math.round(n(totalPaise))
	};
}
function displayHsn(hsn, digits) {
	const raw = String(hsn ?? "").replace(/\s/g, "");
	if (!raw) return "";
	const d = raw.replace(/\D/g, "") || raw;
	const keep = Math.max(4, digits);
	return d.length <= keep ? d : d.slice(0, keep);
}
//#endregion
export { lineTotalPaise as a, gstBreakupForKind as i, displayHsn as n, roundOffToRupee as o, gstBreakup as r, classifySupply as t };
