import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { n as displayHsn } from "./tax-TUTmm3iB.mjs";
import { t as CHALLAN_COPIES } from "./types-DdJ4U74k.mjs";
import { r as validateDocSerial } from "./serial-BYMeNAaS.mjs";
import { n as formatInrGrouped } from "./words-H9cyahe6.mjs";
import { a as SignatureBlock, n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
import { t as PartyBlock } from "./party-block-ChEQtNj-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/delivery-challan-Cvbm9s6l.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** CGST Act s.143 job work · Rules 45 + 55 delivery challan. Rule 55(2) copies. */
function DeliveryChallan({ doc }) {
	const [copy, setCopy] = (0, import_react.useState)(CHALLAN_COPIES[0]);
	const issues = [];
	const serial = validateDocSerial(doc.docNo);
	if (!serial.ok) issues.push({
		code: "SERIAL",
		message: serial.error,
		level: "block"
	});
	for (const ln of doc.lines) if (!String(ln.hsn ?? "").trim()) issues.push({
		code: "HSN",
		message: `HSN blank on line ${ln.sl}`,
		level: "block"
	});
	const isReturn = doc.variant === "JW_RETURN";
	const hsnDigits = doc.company.hsnDigits || 6;
	const due = formatDateIN(doc.statutoryDue);
	const goodsLabel = doc.goodsKind === "CAPITAL" ? "Capital goods" : doc.goodsKind === "SEMI" ? "Semi-finished goods" : "Inputs";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "CGST Act s.143 · Rules 45 + 55",
		copies: CHALLAN_COPIES,
		copy,
		onCopy: setCopy,
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
						className: "mt-1 text-[8px] uppercase tracking-wide",
						children: copy
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[9px]",
						children: "Not a tax invoice. Not a supply."
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[11px] font-bold",
				children: isReturn ? "Return of goods from job worker to principal" : "Goods sent for job work without payment of tax under Section 143 of the CGST Act, 2017"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Consigner (principal)",
					party: doc.consigner
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Consignee (job worker)",
					party: doc.consignee
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-2 grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Process: "
					}), doc.processName] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Goods: "
					}), goodsLabel] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Expected return: "
					}), formatDateIN(doc.expectedReturn)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Statutory due (s.143): "
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: due })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "E-way reason: "
					}), "3 Job Work"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "e-way: "
					}), doc.ewayNo ?? "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Vehicle: "
					}), doc.vehicleNo ?? "—"] }),
					doc.interState ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Place of supply: "
					}), doc.placeOfSupply] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Place of supply: "
					}), doc.placeOfSupply ?? "Intra-state"] }),
					isReturn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Original challan: "
						}),
						doc.originalChallanNo,
						" dated ",
						formatDateIN(doc.originalChallanDate)
					] }) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 border border-ink px-2 py-1 text-[10px]",
				children: [
					"Goods must be received back on or before ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: due }),
					" failing which the movement shall be treated as a deemed supply on the challan date (s.143). Inputs / semi-finished: 1 year. Capital goods: 3 years."
				]
			}),
			isReturn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReturnTable, {
				doc,
				hsnDigits
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OutTable, {
				doc,
				hsnDigits
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[10px] font-semibold",
				children: "GST not payable on this challan — not a supply."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[9px]",
				children: [
					"Taxable value (reference, not a supply) ",
					formatInrGrouped(doc.taxablePaise),
					" · GST ",
					n(doc.gstPct).toFixed(2),
					"% · tax amount (reference) ",
					formatInrGrouped(doc.taxPaise),
					"."
				]
			}),
			isReturn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[9px]",
				children: "s.143(5): waste and scrap generated during job work, if supplied from the job worker's premises, is invoiced by the job worker if registered, otherwise by the principal."
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureBlock, { company: doc.company }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
function OutTable({ doc, hsnDigits }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "doc-table mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "UQC" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty NOS" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty KGS" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot/heat" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable ₹ (ref.)" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rate %" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Tax ₹ (ref.)" })
		] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: doc.lines.map((ln) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: ln.sl
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: ln.description }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: displayHsn(ln.hsn, hsnDigits)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: ln.uqc }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "tabular",
				children: [formatPcs(ln.qtyNos), ln.provisional ? " (Provisional)" : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
				className: "tabular",
				children: [formatKg(ln.qtyKgs), ln.provisional ? " (Provisional)" : ""]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: ln.lotHeat ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatInrGrouped(ln.taxablePaise)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: n(ln.gstPct).toFixed(2)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatInrGrouped(n(ln.cgstPaise) + n(ln.sgstPaise) + n(ln.igstPaise) || doc.taxPaise)
			})
		] }, ln.sl)) })]
	});
}
function ReturnTable({ doc, hsnDigits }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "doc-table mt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sl" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sent NOS" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sent KGS" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Good recd" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Reject" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Scrap returned" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Scrap kept by JW" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Loss" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot/heat" })
		] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: doc.lines.map((ln) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: ln.sl
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: ln.description }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: displayHsn(ln.hsn, hsnDigits)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(ln.sentNos ?? ln.qtyNos)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatKg(ln.sentKgs ?? ln.qtyKgs)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(ln.goodReceived ?? 0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(ln.reject ?? 0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(ln.scrapReturned ?? 0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(ln.scrapKeptByJw ?? 0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(ln.loss ?? 0)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: ln.lotHeat ?? "—"
			})
		] }, ln.sl)) })]
	});
}
//#endregion
export { DeliveryChallan as t };
