import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as formatInrGrouped, t as amountInWordsINR } from "./words-H9cyahe6.mjs";
import { t as encode } from "../_libs/uqr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tax-summary-BuMA2SFz.js
var import_jsx_runtime = require_jsx_runtime();
function AmountInWordsINR({ paise }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-ink px-2 py-1 text-[10px] leading-snug",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-semibold",
				children: "Amount in words: "
			}),
			amountInWordsINR(paise),
			" (",
			formatInrGrouped(paise),
			")"
		]
	});
}
/** Rule 46 — IRP QR is a particular of the tax invoice. Invoice number ≠ IRN. Never print QR on a slip. */
function IrnQrBlock({ payload, irn, ackNo, ackDt, label = "IRN QR (Rule 46)" }) {
	const qr = encode(payload, {
		ecc: "M",
		border: 1
	});
	const size = qr.size;
	const cells = [];
	for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (qr.data[y]?.[x]) cells.push(`M${x} ${y}h1v1h-1z`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-2 border border-ink p-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			viewBox: `0 0 ${size} ${size}`,
			width: 88,
			height: 88,
			className: "shrink-0 bg-white",
			role: "img",
			"aria-label": label,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: cells.join(""),
				fill: "#111"
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 text-[9px] leading-snug",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-semibold uppercase tracking-wide",
					children: label
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "break-all font-mono",
					children: ["IRN ", irn ?? "— (not generated)"]
				}),
				ackNo ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "font-mono",
					children: [
						"Ack ",
						ackNo,
						" · ",
						ackDt
					]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 text-muted",
					children: "Invoice number is not the IRN."
				})
			]
		})]
	});
}
function irnPayload(opts) {
	return JSON.stringify({
		SellerGstin: opts.sellerGstin,
		BuyerGstin: opts.buyerGstin,
		DocNo: opts.docNo,
		DocTyp: opts.docTyp,
		DocDt: opts.docDt,
		TotInvVal: opts.totInvVal,
		ItemCnt: opts.itemCnt,
		MainHsnCode: opts.mainHsn,
		Irn: opts.irn
	});
}
function TaxSummary({ kind, rows, taxablePaise, cgstPaise, sgstPaise, igstPaise, roundOffPaise, totalPaise }) {
	const intra = kind === "INTRA";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[9px] font-semibold uppercase tracking-wide",
				children: "Tax summary (rate-wise)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rate %" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable ₹" }),
					intra ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "CGST ₹" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SGST ₹" })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IGST ₹" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: r.rate.toFixed(2)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.taxablePaise)
					}),
					intra ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.cgstPaise)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.sgstPaise)
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.igstPaise)
					})
				] }, r.rate)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "ml-auto mt-1 w-56 text-[10px]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Taxable after discount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "tabular",
							children: formatInrGrouped(taxablePaise)
						})]
					}),
					intra ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "CGST" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "tabular",
							children: formatInrGrouped(cgstPaise)
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "SGST" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "tabular",
							children: formatInrGrouped(sgstPaise)
						})]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "IGST" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "tabular",
							children: formatInrGrouped(igstPaise)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Round off" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "tabular",
							children: formatInrGrouped(roundOffPaise)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between border-t border-ink font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Grand total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "tabular",
							children: formatInrGrouped(totalPaise)
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { irnPayload as i, IrnQrBlock as n, TaxSummary as r, AmountInWordsINR as t };
