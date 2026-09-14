import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg } from "./format-Bcy9062O.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
import { t as PartyBlock } from "./party-block-ChEQtNj-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/coc-RuLYnP-a.js
var import_jsx_runtime = require_jsx_runtime();
/** Certificate of conformance — factory QA. Not a BIS / ISI / NABL licence document. */
function CertificateOfConformance({ doc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "Certificate of conformance — not BIS / NABL",
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Date ", formatDateIN(doc.docDate)] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Customer",
					party: doc.customer
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[10px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "SKU: "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono",
						children: doc.sku
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: doc.description })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
				className: "doc-table mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "text-left",
						children: "Alloy specification"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: doc.alloySpec })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "text-left",
						children: "Drawing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "font-mono",
						children: [
							doc.drawingNo,
							" rev ",
							doc.drawingRev
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "text-left",
						children: "Lot"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: doc.lotNo
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "text-left",
						children: "Heat"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: doc.heatNo
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
						className: "text-left",
						children: "Quantity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [
						formatPcs(doc.qtyNos),
						" NOS · ",
						formatKg(doc.qtyKgs),
						" KGS"
					] })] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-[10px]",
				children: "We certify that the goods described above conform to the alloy specification and drawing revision stated, and were produced from the lot / heat identified."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 text-right text-[10px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "QA signatory" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-8 font-semibold",
						children: doc.qaSignatory
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: doc.company.legalName })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 border-t border-ink pt-1 text-[9px] font-semibold",
				children: "This is not a NABL / BIS licence document."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
//#endregion
export { CertificateOfConformance as t };
