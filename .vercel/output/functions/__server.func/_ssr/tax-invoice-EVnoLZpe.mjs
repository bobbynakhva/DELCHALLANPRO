import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { n as displayHsn } from "./tax-TUTmm3iB.mjs";
import { r as INVOICE_COPIES } from "./types-DdJ4U74k.mjs";
import { r as validateDocSerial } from "./serial-BYMeNAaS.mjs";
import { t as invoicePrintIssues } from "./validate-DEmGVSpZ.mjs";
import { n as formatInrGrouped } from "./words-H9cyahe6.mjs";
import { i as irnPayload, n as IrnQrBlock, r as TaxSummary, t as AmountInWordsINR } from "./tax-summary-BuMA2SFz.mjs";
import { a as SignatureBlock, n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
import { t as PartyBlock } from "./party-block-ChEQtNj-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tax-invoice-EVnoLZpe.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** CGST Rule 49 bill of supply — composition / exempt. No tax columns. */
function BillOfSupply({ doc }) {
	const issues = [];
	const serial = validateDocSerial(doc.docNo);
	if (!serial.ok) issues.push({
		code: "SERIAL",
		message: serial.error,
		level: "block"
	});
	if (!doc.company.composition) issues.push({
		code: "COMPOSITION",
		message: "Bill of supply is only for composition / exempt supplies (Rule 49). Company is not marked composition.",
		level: "warn"
	});
	const hsnDigits = doc.company.hsnDigits || 6;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "CGST Rule 49 — bill of supply",
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
						className: "text-[9px]",
						children: "Composition dealer — not a tax invoice"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[13px]",
						children: doc.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Date ", formatDateIN(doc.docDate)] })
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[10px] font-semibold",
				children: "Composition taxable person. Tax is not collected on this document. No CGST / SGST / IGST columns."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Recipient",
					party: doc.billTo
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty KGS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Amount ₹" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [doc.lines.map((ln) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
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
						children: formatPcs(ln.qtyNos)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(ln.qtyKgs)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(ln.amountPaise)
					})
				] }, ln.sl)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					colSpan: 5,
					className: "font-semibold",
					children: "Total"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular font-semibold",
					children: formatInrGrouped(doc.totalPaise)
				})] })] })]
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
/** CGST Act s.31 tax invoice · CGST Rule 46 particulars. IRP QR is a Rule 46 particular. */
function TaxInvoice({ doc, citation = "CGST Act s.31 · CGST Rule 46" }) {
	const [copy, setCopy] = (0, import_react.useState)(INVOICE_COPIES[0]);
	const service = "service" in doc && doc.service;
	const issues = invoicePrintIssues({
		docNo: doc.docNo,
		kind: doc.kind,
		buyerRegistered: Boolean(doc.billTo.registered),
		buyerGstin: doc.billTo.gstin,
		buyerUnregisteredValuePaise: doc.totalPaise,
		buyerName: doc.billTo.name,
		buyerStateCode: doc.billTo.stateCode,
		lines: doc.lines,
		invoiceNetKg: doc.netKg,
		packingNetKg: doc.packingNetKg
	});
	const intra = doc.kind === "INTRA";
	const showIgst = doc.kind === "INTER" || doc.kind === "EXPORT_IGST" || doc.kind === "EXPORT_LUT";
	const hsnDigits = doc.company.hsnDigits || (doc.company.turnoverAbove5Cr ? 6 : 4);
	const rateRows = groupRates(doc);
	const irnJson = irnPayload({
		sellerGstin: doc.company.gstin ?? "",
		buyerGstin: doc.billTo.gstin ?? "URP",
		docNo: doc.docNo,
		docTyp: "INV",
		docDt: formatDateIN(doc.docDate),
		totInvVal: n(doc.totalPaise) / 100,
		itemCnt: doc.lines.length,
		mainHsn: displayHsn(doc.lines[0]?.hsn, hsnDigits),
		irn: doc.irn ?? "IRN-NOT-GENERATED"
	});
	const b2c = !doc.billTo.registered && doc.company.b2cQr && !doc.export;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation,
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
					service ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px] font-semibold",
						children: "Job-work / conversion service (SAC 9988)"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-[13px]",
						children: doc.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Date ", formatDateIN(doc.docDate)] }),
					doc.soNo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["SO ", doc.soNo] }) : null,
					doc.ewayNo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["e-way ", doc.ewayNo] }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[8px] uppercase tracking-wide",
						children: copy
					})
				] })
			}),
			doc.company.einvoiceApplicable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IrnQrBlock, {
					payload: irnJson,
					irn: doc.irn,
					ackNo: doc.irnAckNo,
					ackDt: doc.irnAckDt ? formatDateIN(doc.irnAckDt) : null
				})
			}) : null,
			b2c ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IrnQrBlock, {
					payload: irnJson,
					irn: null,
					label: "B2C Dynamic QR (Rule 46A)"
				})
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-2 grid grid-cols-2 gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Bill to (recipient)",
					party: doc.billTo
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PartyBlock, {
					label: "Ship to (delivery)",
					party: doc.shipTo
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "mt-2 grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Place of supply: "
					}), doc.placeOfSupply] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Supply: "
					}), supplyLabel(doc.kind)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: "Vehicle: "
					}), doc.vehicleNo ?? "—"] })
				]
			}),
			doc.reverseCharge || doc.rcm ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-[11px] font-bold uppercase",
				children: "Tax is payable on reverse charge basis."
			}) : null,
			service ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 border border-ink px-2 py-1 text-[10px]",
				children: [
					"GST is charged on conversion charges only (SAC ",
					"sac" in doc && doc.sac || "9988",
					"). Customer-owned metal is not a supply of goods on this invoice and is not valued here."
				]
			}) : null,
			doc.export ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExportBand, { exp: doc.export }) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "UQC" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty KGS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot/heat" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Discount ₹" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rate %" }),
					intra ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "CGST ₹" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SGST ₹" })] }) : null,
					showIgst ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IGST ₹" }) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Line total ₹" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: doc.lines.map((ln) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: ln.sl
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [ln.description, ln.sac ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["SAC ", ln.sac] }) : null] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: displayHsn(ln.hsn, hsnDigits) || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: ln.uqc }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "tabular",
						children: [formatPcs(ln.qtyNos), ln.provisional ? " *" : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: ln.qtyKgs ? formatKg(ln.qtyKgs) : "—"
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
						children: formatInrGrouped(ln.discountPaise)
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
				kind: doc.kind,
				rows: rateRows,
				taxablePaise: doc.taxablePaise,
				cgstPaise: doc.cgstPaise,
				sgstPaise: doc.sgstPaise,
				igstPaise: doc.igstPaise,
				roundOffPaise: doc.roundOffPaise,
				totalPaise: doc.totalPaise
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AmountInWordsINR, { paise: doc.totalPaise })
			}),
			doc.msmeDueDate && doc.billTo.registered && doc.billTo.country === "IN" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-[10px]",
				children: [
					"Payment due date under the MSMED Act, 2006: ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: formatDateIN(doc.msmeDueDate) }),
					" (invoice date + ",
					doc.company.msmeCreditDays,
					" days)."
				]
			}) : null,
			doc.company.bankName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-[9px]",
				children: [
					"Bank: ",
					doc.company.bankName,
					" · A/c ",
					doc.company.bankAccount,
					" · IFSC ",
					doc.company.bankIfsc
				]
			}) : null,
			doc.netKg ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-[9px]",
				children: [
					"Invoice net weight ",
					formatKg(doc.netKg),
					" kg",
					doc.packingNetKg != null ? ` · packing list net ${formatKg(doc.packingNetKg)} kg` : "",
					"."
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[8px] text-muted",
				children: "IRN cannot be cancelled after 24 hours of acknowledgement — use a credit / debit note (s.34)."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureBlock, { company: doc.company }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
function supplyLabel(kind) {
	if (kind === "INTRA") return "Intra-state (CGST + SGST)";
	if (kind === "INTER") return "Inter-state (IGST)";
	if (kind === "EXPORT_LUT") return "Export of goods under LUT/Bond";
	return "Export of goods on payment of IGST";
}
function ExportBand({ exp }) {
	const sentence = exp.mode === "LUT" ? "Supply meant for export under LUT/Bond without payment of IGST" : "Supply meant for export on payment of IGST";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2 border-2 border-ink px-2 py-1.5 text-[10px]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "font-bold uppercase",
				children: [sentence, "."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 grid grid-cols-3 gap-x-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["IEC ", exp.iec] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["LUT ARN ", exp.lutArn ?? "—"] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						"Currency ",
						exp.currency,
						" · forex ",
						exp.forexRate.toFixed(2)
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Country ", exp.country] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Port ", exp.port] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Incoterm ", exp.incoterm] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["INR taxable ", formatInrGrouped(exp.inrTaxablePaise)] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1",
				children: "No CGST/SGST on export of goods."
			})
		]
	});
}
function groupRates(doc) {
	const map = /* @__PURE__ */ new Map();
	for (const ln of doc.lines) {
		const cur = map.get(ln.gstPct) ?? {
			rate: ln.gstPct,
			taxablePaise: 0,
			cgstPaise: 0,
			sgstPaise: 0,
			igstPaise: 0
		};
		cur.taxablePaise += n(ln.taxablePaise) - n(ln.discountPaise);
		cur.cgstPaise += n(ln.cgstPaise);
		cur.sgstPaise += n(ln.sgstPaise);
		cur.igstPaise += n(ln.igstPaise);
		map.set(ln.gstPct, cur);
	}
	return [...map.values()];
}
//#endregion
export { TaxInvoice as n, BillOfSupply as t };
