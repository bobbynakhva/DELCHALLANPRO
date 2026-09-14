import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { i as formatKg } from "./format-Bcy9062O.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { a as SignatureBlock, n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
import { t as PartyBlock } from "./party-block-ChEQtNj-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/grn-slip-uqKUVmje.js
var import_jsx_runtime = require_jsx_runtime();
/** Factory GRN / weighment slip. Gross − tare = net kg to 3 decimals. */
function GrnSlip({ doc }) {
	const recomputed = Math.round((doc.grossKg - doc.tareKg) * 1e3) / 1e3;
	const issues = Math.abs(recomputed - doc.netKg) > .001 ? [{
		code: "WEIGH",
		message: `Gross ${doc.grossKg.toFixed(3)} − tare ${doc.tareKg.toFixed(3)} = ${recomputed.toFixed(3)} ≠ net ${doc.netKg.toFixed(3)}.`,
		level: "block"
	}] : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "GRN / weighment slip",
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 font-semibold",
						children: doc.qcStatus
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Vendor",
					party: doc.vendor
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[10px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Vehicle: "
						}), doc.vehicleNo] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Alloy: "
						}), doc.alloy] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "SKU: "
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: doc.sku
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Heat: "
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-mono",
							children: doc.heatNo
						})] })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table mt-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Gross kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Tare kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Net kg (gross − tare)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "QC" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-mono text-[12px]",
						children: formatKg(doc.grossKg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-mono text-[12px]",
						children: formatKg(doc.tareKg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-mono text-[12px] font-bold",
						children: formatKg(doc.netKg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-semibold",
						children: doc.qcStatus
					})
				] }) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-[10px]",
				children: [
					"Weighment to 3 decimal kg. Lot lands QUARANTINE until QC ",
					doc.qcStatus === "RELEASED" ? "released" : "holds",
					" it."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureBlock, { company: doc.company }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
//#endregion
export { GrnSlip as t };
