//#region node_modules/.nitro/vite/services/ssr/assets/dates-BQYs1Vuz.js
/** Dates on GST documents are DD/MM/YYYY in IST. FY = 1 April–31 March. */
var IST = "Asia/Kolkata";
function parseIsoDate(input) {
	if (!input) return null;
	if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
	const s = String(input).trim();
	const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 6, 0, 0));
	const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
	if (dmy) return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), 6, 0, 0));
	const d = new Date(s);
	return Number.isNaN(d.getTime()) ? null : d;
}
function formatDateIN(input) {
	const d = parseIsoDate(input);
	if (!d) return "—";
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: IST,
		day: "2-digit",
		month: "2-digit",
		year: "numeric"
	}).format(d);
}
function formatDateTimeIST(input = /* @__PURE__ */ new Date()) {
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: IST,
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false
	}).format(input) + " IST";
}
function toIsoDate(input) {
	const d = parseIsoDate(input);
	if (!d) return "";
	return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(d);
}
function addDaysIso(isoDate, days) {
	const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
function addYearsIso(isoDate, years) {
	const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
	return new Date(Date.UTC(y + years, m - 1, d)).toISOString().slice(0, 10);
}
/** s.143 — inputs / semi-finished: 1 year; capital goods: 3 years. */
function statutoryDueIso(challanIso, kind = "INPUTS") {
	if (kind === "CAPITAL") return addYearsIso(challanIso, 3);
	return addDaysIso(challanIso, 365);
}
function financialYearLabel(input = /* @__PURE__ */ new Date()) {
	const [y, m] = toIsoDate(parseIsoDate(input) ?? /* @__PURE__ */ new Date()).split("-").map(Number);
	const start = m >= 4 ? y : y - 1;
	return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}
//#endregion
export { statutoryDueIso as a, formatDateTimeIST as i, financialYearLabel as n, toIsoDate as o, formatDateIN as r, addDaysIso as t };
