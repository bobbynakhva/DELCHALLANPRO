import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs } from "./format-Bcy9062O.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { n as formatInrGrouped } from "./words-H9cyahe6.mjs";
import { a as SignatureBlock, n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
import { t as PartyBlock } from "./party-block-ChEQtNj-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/quotation-BFtRz4Wu.js
var import_jsx_runtime = require_jsx_runtime();
/** Quotation — not a tax invoice. Must not look like TAX INVOICE. Metal rate date printed. */
function QuotationDocView({ doc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "Quotation — not a tax invoice",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GstLetterhead, {
				company: doc.company,
				right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[13px] font-bold uppercase tracking-wide",
						children: doc.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px]",
						children: "This is not a tax invoice"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[13px]",
						children: doc.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Date ", formatDateIN(doc.docDate)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Valid until ", formatDateIN(doc.validUntil)] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 border-2 border-ink px-2 py-1 text-[10px] font-semibold",
				children: "This quotation is not a tax invoice and does not create a tax liability. GST extra as applicable."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Customer",
					party: doc.customer
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[10px]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Metal rate date (frozen on this quote): "
						}), formatDateIN(doc.metalRateDate)] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							"Cu ",
							formatInrGrouped(doc.cuPaisePerKg),
							"/kg · Zn ",
							formatInrGrouped(doc.znPaisePerKg),
							"/kg"
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 text-[9px]",
							children: "Formula snapshot: metal = kg/pc × recovery × blended(Cu,Zn,Pb); unit = metal + conversion + JW + packing + overhead + margin."
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SKU" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Metal ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Conv. ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "JW ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Pack ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "OH ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Margin ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Unit ₹" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: doc.lines.map((ln) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: ln.sl
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: ln.sku
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: ln.description }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(ln.qtyNos)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.metalPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.conversionPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.jwPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.packingPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.overheadPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.marginPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular font-semibold",
						children: formatInrGrouped(ln.unitPricePaise)
					})
				] }, ln.sl)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[10px] font-semibold",
				children: "GST extra as applicable."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureBlock, { company: doc.company }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
//#endregion
export { QuotationDocView as t };
