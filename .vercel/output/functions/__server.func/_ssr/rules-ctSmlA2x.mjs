//#region node_modules/.nitro/vite/services/ssr/assets/rules-ctSmlA2x.js
/**
* Pure posting rules — no I/O. The stock writer (posting.ts) and the screens
* share these so a kg never disappears and a test can fail the slice without a DB.
*/
var MOVE_TYPES = [
	"GRN_RECEIPT",
	"QC_RELEASE",
	"QC_REJECT",
	"WO_ISSUE",
	"WO_BACKFLUSH",
	"WO_RECEIPT_SFG_FG",
	"WO_SCRAP",
	"ADJUST_PLUS",
	"ADJUST_MINUS",
	"TRANSFER",
	"JW_OUT",
	"JW_RETURN_GOOD",
	"JW_RETURN_REJECT",
	"JW_RETURN_SCRAP",
	"JW_EXCESS_LOSS",
	"JW_IN_RECEIVE",
	"JW_IN_CONSUME",
	"JW_IN_RETURN",
	"DISPATCH",
	"SALES_RETURN",
	"MELT_OUT",
	"OPENING"
];
var REASON_CODES = {
	SCRAP: [
		"SCRAP-TURN",
		"SCRAP-FLASH",
		"SCRAP-RUNNER",
		"SCRAP-DROSS",
		"SCRAP-PLATE-STRIP",
		"SCRAP-QC"
	],
	REJ: [
		"REJ-DIM",
		"REJ-POROSITY",
		"REJ-THREAD",
		"REJ-PLATE-THK",
		"REJ-PLATE-ADH",
		"REJ-MIXED-ALLOY",
		"REJ-HANDLE"
	],
	ADJ: [
		"ADJ-COUNT",
		"ADJ-UOM-ERROR",
		"ADJ-THEFT-INVESTIGATE"
	]
};
var ALL_REASON_CODES = [
	...REASON_CODES.SCRAP,
	...REASON_CODES.REJ,
	...REASON_CODES.ADJ
];
var CONV_TOL = {
	ROD: .005,
	FG: .001
};
function n(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
function roundKg(v) {
	return Math.round(v * 1e3) / 1e3;
}
/** Lot-tracked metal/SFG/FG/scrap always carries a lot. */
function assertLotRequired(lotId, itemType) {
	if (lotId == null || !Number.isFinite(Number(lotId)) || Number(lotId) <= 0) throw new Error("Lot-tracked item requires a lot — no silent any-lot pick");
}
function assertAlloyMatch(opts) {
	const a = opts.lotAlloyId ?? null;
	const b = opts.itemAlloyId ?? null;
	if (a != null && b != null && Number(a) !== Number(b)) throw new Error(`Alloy mismatch${opts.context ? ` (${opts.context})` : ""}: lot alloy #${a} ≠ item alloy #${b}. Cannot issue a ${opts.lotAlloyCode ?? "foreign"} lot onto a ${opts.itemAlloyCode ?? "different"} component.`);
	const ca = (opts.lotAlloyCode ?? "").trim();
	const cb = (opts.itemAlloyCode ?? "").trim();
	if (ca && cb && ca !== cb) throw new Error(`Cannot issue ${ca} lot to a ${cb} component${opts.context ? ` (${opts.context})` : ""}.`);
}
/**
* qtyKg vs qtyPcs must agree with the item/BOM conversion.
* Skip when the unused UOM is 0 (rod issued by kg only).
*/
function assertConversion(opts) {
	const kg = Math.abs(n(opts.qtyKg));
	const pcs = Math.abs(n(opts.qtyPcs));
	const per = n(opts.kgPerPc);
	if (pcs === 0 || per <= 0 || kg === 0) return;
	const theoretical = pcs * per;
	const tol = CONV_TOL[opts.kind];
	const denom = Math.max(theoretical, kg);
	if (Math.abs(kg - theoretical) / denom > tol) throw new Error(`Qty kg ${kg.toFixed(3)} vs ${pcs} pcs × ${per} kg/pc = ${theoretical.toFixed(3)} kg exceeds ${opts.kind === "ROD" ? "0.5%" : "0.1%"} conversion tolerance${opts.context ? ` (${opts.context})` : ""}.`);
}
function assertSufficient(opts) {
	const haveKg = n(opts.haveKg);
	const takeKg = n(opts.takeKg);
	if (takeKg > 0 && haveKg + 5e-4 < takeKg) throw new Error(`Cannot ${opts.what ?? "issue"} ${takeKg.toFixed(3)} kg — lot has ${haveKg.toFixed(3)} kg`);
	const havePcs = n(opts.havePcs);
	const takePcs = n(opts.takePcs);
	if (takePcs > 0 && havePcs + 5e-4 < takePcs) throw new Error(`Cannot ${opts.what ?? "dispatch"} ${takePcs} pcs — lot has ${havePcs} pcs`);
}
function packingKgMatch(invoiceNetKg, packingNetKg) {
	const d = Math.abs(n(invoiceNetKg) - n(packingNetKg));
	if (d > .001) return {
		ok: false,
		delta: roundKg(d)
	};
	return { ok: true };
}
function assertPackingMatch(invoiceNetKg, packingNetKg) {
	const r = packingKgMatch(invoiceNetKg, packingNetKg);
	if (!r.ok) throw new Error(`Packing-list net kg ${n(packingNetKg).toFixed(3)} ≠ invoice net kg ${n(invoiceNetKg).toFixed(3)} (Δ ${r.delta.toFixed(3)} kg). Dispatch blocked.`);
}
/** Section C — JW return working. All kg. */
function jwLossWorking(opts) {
	const sentKg = roundKg(n(opts.sentKg));
	const accountedKg = roundKg(n(opts.goodKg) + n(opts.rejectKg) + n(opts.scrapReturnedKg) + n(opts.scrapRetainedKg));
	const actualLossKg = roundKg(Math.max(0, sentKg - accountedKg));
	const normKg = roundKg(sentKg * (n(opts.lossNormPct) / 100));
	return {
		sentKg,
		accountedKg,
		actualLossKg,
		normKg,
		excessLossKg: roundKg(Math.max(0, actualLossKg - normKg)),
		actualLossPct: sentKg > 0 ? actualLossKg / sentKg * 100 : 0
	};
}
function woCompleteCheck(opts) {
	const theoreticalKg = roundKg((n(opts.goodPcs) + n(opts.rejectPcs)) * n(opts.kgPerPc));
	const issued = n(opts.issuedKg);
	const tol = n(opts.tolerancePct ?? .5) / 100;
	if (issued + issued * tol + 5e-4 < theoreticalKg) return {
		theoreticalKg,
		ok: false,
		message: `Issued ${issued.toFixed(3)} kg + ${(tol * 100).toFixed(1)}% < theoretical ${opts.goodPcs + opts.rejectPcs} pcs × ${opts.kgPerPc} = ${theoreticalKg.toFixed(3)} kg. Issue more rod before booking.`
	};
	return {
		theoreticalKg,
		ok: true
	};
}
function jwVendorBlocked(opts) {
	if (!opts.settingOn) return false;
	return n(opts.ageDays) > n(opts.blockDays);
}
function assertJwVendorAllowed(opts) {
	if (jwVendorBlocked(opts)) throw new Error(`Blocked: challan ${opts.docNo ?? ""} is ${opts.ageDays} days old (>${opts.blockDays}d statutory clock). Return it before issuing more to this vendor.`);
}
/** JW-OUT (own metal at vendor) stays on valuation. JW-IN customer metal does not. */
function moveValuePaise(opts) {
	if ((opts.ownerType ?? "OWN") === "CUSTOMER") return 0;
	if (opts.warehouseValuationEligible === false) return 0;
	const kg = n(opts.qtyKg);
	if (kg === 0) return 0;
	const mag = Math.round(Math.abs(kg) * n(opts.ratePaisePerKg));
	return kg < 0 ? -mag : mag;
}
function yieldGap(opts) {
	const accountedKg = roundKg(n(opts.goodKg) + n(opts.rejectKg) + n(opts.scrapKg));
	return {
		accountedKg,
		remainderKg: roundKg(Math.max(0, n(opts.issuedKg) - accountedKg))
	};
}
function isReasonCode(code) {
	if (!code) return false;
	return ALL_REASON_CODES.includes(code);
}
function encodeMoveNotes(opts) {
	const tags = [];
	if (opts.reasonCode) tags.push(`REASON:${opts.reasonCode}`);
	if (opts.lineId != null) tags.push(`LINE:${opts.lineId}`);
	if (opts.reverseOf != null) tags.push(`REVERSES:${opts.reverseOf}`);
	if (opts.fromWh != null) tags.push(`FROM:${opts.fromWh}`);
	if (opts.toWh != null) tags.push(`TO:${opts.toWh}`);
	return [tags.join(" "), (opts.text ?? "").trim()].filter(Boolean).join(" | ") || null;
}
function parseReverseOf(notes) {
	const m = String(notes ?? "").match(/REVERSES:(\d+)/);
	return m ? Number(m[1]) : null;
}
function parseReasonCode(notes) {
	const m = String(notes ?? "").match(/REASON:([A-Z0-9-]+)/);
	return m ? m[1] : null;
}
var LEGACY = {
	GRN: "GRN_RECEIPT",
	ISSUE: "WO_ISSUE",
	RECEIPT: "WO_RECEIPT_SFG_FG",
	SCRAP: "WO_SCRAP",
	ADJUST: "ADJUST_PLUS",
	JW_RETURN: "JW_RETURN_GOOD",
	MELT_OUT: "MELT_OUT",
	OPENING: "OPENING"
};
function toMoveType(raw, qtyKg) {
	if (MOVE_TYPES.includes(raw)) return raw;
	if (raw === "ADJUST") return n(qtyKg) < 0 ? "ADJUST_MINUS" : "ADJUST_PLUS";
	return LEGACY[raw] ?? raw;
}
function assertNegativeStockKind(warehouseKind, nextKg, nextPcs) {
	const k = (warehouseKind ?? "").toUpperCase();
	if (!(k === "RM" || k === "SCRAP" || k === "SFG" || k === "FG" || k === "HOLD" || k === "REJECT" || k === "JW_OUT" || k === "JW_IN")) return;
	if (nextKg < -5e-4 || nextPcs < -5e-4) throw new Error(`Negative stock blocked on ${k || "this"} warehouse (would be ${nextKg.toFixed(3)} kg / ${nextPcs} pcs)`);
}
//#endregion
export { yieldGap as _, assertLotRequired as a, assertSufficient as c, jwLossWorking as d, moveValuePaise as f, woCompleteCheck as g, toMoveType as h, assertJwVendorAllowed as i, encodeMoveNotes as l, parseReverseOf as m, assertAlloyMatch as n, assertNegativeStockKind as o, parseReasonCode as p, assertConversion as r, assertPackingMatch as s, REASON_CODES as t, isReasonCode as u };
