import { r as validateDocSerial } from "./serial-BYMeNAaS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/validate-DEmGVSpZ.js
/**
* Hard blocks that must prevent printing a tax invoice (Rule 46 particulars).
* Weight recon is a warning that blocks packing-list generate if |Δ| > 0.001 kg.
*/
function n(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
function invoicePrintIssues(opts) {
	const out = [];
	const serial = validateDocSerial(opts.docNo);
	if (!serial.ok) out.push({
		code: "SERIAL",
		message: serial.error,
		level: "block"
	});
	if (opts.buyerRegistered && !String(opts.buyerGstin ?? "").trim()) out.push({
		code: "GSTIN",
		message: "Registered buyer without GSTIN — invoice cannot be printed.",
		level: "block"
	});
	if (!opts.buyerRegistered && n(opts.buyerUnregisteredValuePaise) >= 5e6 && (!opts.buyerName || !opts.buyerStateCode)) out.push({
		code: "B2C_50K",
		message: "Unregistered buyer, value ≥ ₹50,000: name, delivery address, state name and state code are mandatory (Rule 46).",
		level: "block"
	});
	for (const ln of opts.lines) {
		if (!String(ln.hsn ?? "").trim()) out.push({
			code: "HSN",
			message: `HSN blank on goods line ${ln.sl} — never blank on a goods line.`,
			level: "block"
		});
		const c = n(ln.cgstPaise) + n(ln.sgstPaise);
		const i = n(ln.igstPaise);
		if ((opts.kind === "INTRA" || opts.kind === "EXPORT_LUT") && i > 0) out.push({
			code: "INTRA_IGST",
			message: `Line ${ln.sl}: intra-state / LUT export cannot carry IGST.`,
			level: "block"
		});
		if ((opts.kind === "INTER" || opts.kind === "EXPORT_IGST") && c > 0) out.push({
			code: "INTER_CGST",
			message: `Line ${ln.sl}: inter-state / IGST-paid export cannot carry CGST/SGST.`,
			level: "block"
		});
		if (c > 0 && i > 0) out.push({
			code: "BOTH_HEADS",
			message: `Line ${ln.sl}: CGST/SGST and IGST both present — never both on one line.`,
			level: "block"
		});
	}
	if (opts.packingNetKg != null && opts.invoiceNetKg != null) {
		const d = Math.abs(n(opts.invoiceNetKg) - n(opts.packingNetKg));
		if (d > .001) out.push({
			code: "WEIGHT",
			message: `Packing-list net kg ${n(opts.packingNetKg).toFixed(3)} ≠ invoice net kg ${n(opts.invoiceNetKg).toFixed(3)} (Δ ${d.toFixed(3)} kg).`,
			level: "block"
		});
	}
	return out;
}
function packingGenerateBlocked(invoiceNetKg, packingNetKg) {
	return Math.abs(n(invoiceNetKg) - n(packingNetKg)) > .001;
}
//#endregion
export { packingGenerateBlocked as n, invoicePrintIssues as t };
