import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg } from "./format-Bcy9062O.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { n as packingGenerateBlocked } from "./validate-DEmGVSpZ.mjs";
import { a as SignatureBlock, n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
import { t as PartyBlock } from "./party-block-ChEQtNj-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/packing-list-ByTRFP_f.js
var import_jsx_runtime = require_jsx_runtime();
/** Factory / export packing list. Net kg must equal invoice net kg (Δ ≤ 0.001 kg). */
function PackingList({ doc }) {
	const blocked = packingGenerateBlocked(doc.invoiceNetKg, doc.packingNetKg);
	const issues = blocked ? [{
		code: "WEIGHT",
		message: `Packing-list net kg ${doc.packingNetKg.toFixed(3)} ≠ invoice net kg ${doc.invoiceNetKg.toFixed(3)}.`,
		level: "block"
	}] : [];
	const match = !blocked;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "Packing list — factory / export practice",
		issues,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GstLetterhead, {
				company: doc.company,
				right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[13px] font-bold uppercase tracking-wide",
						children: doc.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[13px]",
						children: doc.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Date ", formatDateIN(doc.docDate)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						"Invoice ",
						doc.invoiceNo,
						" dated ",
						formatDateIN(doc.invoiceDate)
					] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Consignee",
					party: doc.consignee
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[10px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Country of origin: "
						}), doc.countryOfOrigin] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Carton marks: "
						}), doc.cartonMarks] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Cartons: "
						}), doc.cartons.length] })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Carton" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot / heat" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Net kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Gross kg" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [doc.cartons.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.cartonNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.description }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.lotHeat
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(c.qtyNos)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(c.netKg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(c.grossKg)
					})
				] }, c.cartonNo)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 3,
						className: "font-semibold",
						children: "Total"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-semibold",
						children: formatPcs(doc.cartons.reduce((s, c) => s + c.qtyNos, 0))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-semibold",
						children: formatKg(doc.packingNetKg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-semibold",
						children: formatKg(doc.packingGrossKg)
					})
				] })] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `mt-3 text-[11px] font-bold ${match ? "" : "uppercase"}`,
				children: [
					"Net weight on this packing list equals net weight on Invoice ",
					doc.invoiceNo,
					": ",
					formatKg(doc.packingNetKg),
					" kg = ",
					formatKg(doc.invoiceNetKg),
					" kg — ",
					match ? "MATCH" : "MISMATCH — DO NOT GENERATE",
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureBlock, { company: doc.company }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
//#endregion
export { PackingList as t };
