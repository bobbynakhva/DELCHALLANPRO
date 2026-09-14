import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { n as displayHsn } from "./tax-TUTmm3iB.mjs";
import { r as INVOICE_COPIES } from "./types-DdJ4U74k.mjs";
import { t as invoicePrintIssues } from "./validate-DEmGVSpZ.mjs";
import { n as formatInrGrouped } from "./words-H9cyahe6.mjs";
import { i as irnPayload, n as IrnQrBlock, r as TaxSummary, t as AmountInWordsINR } from "./tax-summary-BuMA2SFz.mjs";
import { a as SignatureBlock, n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
import { t as PartyBlock } from "./party-block-ChEQtNj-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/credit-debit-note-D8eYZT9U.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** CGST Act s.34 · Rule 53 credit / debit note. Must print original invoice no. + date. */
function CreditDebitNote({ doc }) {
	const [copy, setCopy] = (0, import_react.useState)(INVOICE_COPIES[0]);
	const issues = invoicePrintIssues({
		docNo: doc.docNo,
		kind: doc.kindSupply,
		buyerRegistered: Boolean(doc.billTo.registered),
		buyerGstin: doc.billTo.gstin,
		lines: doc.lines
	});
	const intra = doc.kindSupply === "INTRA";
	const showIgst = !intra;
	const hsnDigits = doc.company.hsnDigits || 6;
	const payload = irnPayload({
		sellerGstin: doc.company.gstin ?? "",
		buyerGstin: doc.billTo.gstin ?? "URP",
		docNo: doc.docNo,
		docTyp: doc.kind,
		docDt: formatDateIN(doc.docDate),
		totInvVal: n(doc.totalPaise) / 100,
		itemCnt: doc.lines.length,
		mainHsn: displayHsn(doc.lines[0]?.hsn, hsnDigits),
		irn: doc.irn ?? "IRN-NOT-GENERATED"
	});
	const rateRows = doc.lines.map((ln) => ({
		rate: ln.gstPct,
		taxablePaise: ln.taxablePaise,
		cgstPaise: ln.cgstPaise,
		sgstPaise: ln.sgstPaise,
		igstPaise: ln.igstPaise
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "CGST Act s.34 · Rule 53",
		copies: INVOICE_COPIES,
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
					})
				] })
			}),
			doc.company.einvoiceApplicable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IrnQrBlock, {
					payload,
					irn: doc.irn
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 border border-ink px-2 py-1 text-[10px]",
				children: [
					"Against original tax invoice ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
						className: "font-mono",
						children: doc.originalInvoiceNo
					}),
					" dated",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatDateIN(doc.originalInvoiceDate) }),
					". Same tax head as the original invoice."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-[10px]",
				children: ["Reason: ", doc.reason]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[9px] text-muted",
				children: [
					"An IRN cannot be cancelled after 24 hours of acknowledgement — use this ",
					doc.kind === "CN" ? "credit" : "debit",
					" ",
					"note."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Recipient",
					party: doc.billTo
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[10px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Place of supply: "
					}), doc.placeOfSupply] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Tax head: "
					}), intra ? "CGST + SGST (intra-state)" : "IGST (inter-state / export)"] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "UQC" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty KGS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rate %" }),
					intra ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "CGST ₹" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SGST ₹" })] }) : null,
					showIgst ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IGST ₹" }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Line total ₹" })
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(ln.qtyNos)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: ln.qtyKgs ? formatKg(ln.qtyKgs) : "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.taxablePaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(ln.gstPct).toFixed(2)
					}),
					intra ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.cgstPaise)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.sgstPaise)
					})] }) : null,
					showIgst ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.igstPaise)
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.lineTotalPaise)
					})
				] }, ln.sl)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxSummary, {
				kind: doc.kindSupply,
				rows: rateRows,
				taxablePaise: doc.taxablePaise,
				cgstPaise: doc.cgstPaise,
				sgstPaise: doc.sgstPaise,
				igstPaise: doc.igstPaise,
				roundOffPaise: 0,
				totalPaise: doc.totalPaise
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AmountInWordsINR, { paise: doc.totalPaise })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureBlock, { company: doc.company }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
//#endregion
export { CreditDebitNote as t };
