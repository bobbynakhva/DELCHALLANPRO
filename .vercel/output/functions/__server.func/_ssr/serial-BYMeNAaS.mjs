//#region node_modules/.nitro/vite/services/ssr/assets/serial-BYMeNAaS.js
/** CGST Rule 46 — invoice serial: unique, consecutive, ≤16 chars, [A-Za-z0-9/-] only. */
var DOC_SERIAL_RE = /^[A-Za-z0-9/-]+$/;
function validateDocSerial(docNo) {
	const s = (docNo ?? "").trim();
	if (!s) return {
		ok: false,
		error: "Document number is blank"
	};
	if (s.length > 16) return {
		ok: false,
		error: `Document number exceeds 16 characters (${s.length}): ${s}`
	};
	if (s.includes("#")) return {
		ok: false,
		error: `Document number contains illegal character '#': ${s}`
	};
	if (!DOC_SERIAL_RE.test(s)) return {
		ok: false,
		error: `Document number may only contain A–Z, a–z, 0–9, / and -: ${s}`
	};
	return { ok: true };
}
function assertDocSerial(docNo) {
	const r = validateDocSerial(docNo);
	if (!r.ok) throw new Error(r.error);
	return docNo;
}
/** Detect a gap in a sorted list of serial suffixes (the numeric tail). */
function serialGaps(docNos) {
	const parsed = docNos.map((d) => {
		const m = d.match(/^(.*?)(\d+)$/);
		if (!m) return null;
		return {
			full: d,
			prefix: m[1],
			n: Number(m[2]),
			pad: m[2].length
		};
	}).filter((x) => x != null).sort((a, b) => a.n - b.n);
	const gaps = [];
	for (let i = 1; i < parsed.length; i++) if (parsed[i].prefix === parsed[i - 1].prefix && parsed[i].n > parsed[i - 1].n + 1) gaps.push({
		missingAfter: parsed[i - 1].full,
		expected: `${parsed[i].prefix}${String(parsed[i - 1].n + 1).padStart(parsed[i].pad, "0")}`
	});
	return gaps;
}
//#endregion
export { serialGaps as n, validateDocSerial as r, assertDocSerial as t };
