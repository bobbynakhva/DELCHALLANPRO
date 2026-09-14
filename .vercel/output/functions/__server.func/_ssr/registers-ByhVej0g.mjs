import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { n as financialYearLabel, r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { v as TAMBA } from "./fixtures-BgLpXt_G.mjs";
import { n as serialGaps } from "./serial-BYMeNAaS.mjs";
import { n as formatInrGrouped } from "./words-H9cyahe6.mjs";
import { n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/registers-ByhVej0g.js
var import_jsx_runtime = require_jsx_runtime();
/** Printable GST registers: invoice serial, ITC-04, GSTR-1 lite, e-way. Thresholds from company settings. */
var FIX_REGISTERS = {
	company: TAMBA,
	invoices: [{
		docNo: "INV/26-27/0001",
		date: "2026-09-13",
		gstin: "24AAGCG5520F1Z6",
		name: "Gujarat Sanitary",
		place: "24-Gujarat",
		taxablePaise: 20695e3,
		cgstPaise: 1862550,
		sgstPaise: 1862550,
		igstPaise: 0,
		totalPaise: 24420100,
		hsn: "741220"
	}],
	notes: [{
		kind: "CN",
		docNo: "CN/26-27/0001",
		date: "2026-09-13",
		originalNo: "INV/26-27/0001",
		gstin: "24AAGCG5520F1Z6",
		taxablePaise: 2450,
		cgstPaise: 221,
		sgstPaise: 220,
		igstPaise: 0
	}],
	challans: [{
		docNo: "JW/26-27/0001",
		date: "2025-12-07",
		partner: "Amit Polishers",
		gstin: "24AABPA8821E1Z2",
		hsn: "741220",
		qtyNos: 800,
		qtyKgs: 48,
		due: "2026-12-07",
		status: "OPEN",
		receivedNos: 0,
		lossNos: 0
	}, {
		docNo: "JW/26-27/0003",
		date: "2026-09-13",
		partner: "Kiran Platers",
		gstin: "24AAKPK4410D1Z8",
		hsn: "741220",
		qtyNos: 9820,
		qtyKgs: 471.36,
		due: "2027-09-13",
		status: "PARTIAL",
		receivedNos: 9700,
		lossNos: 40
	}],
	eways: [{
		stubNo: "EWB/26-27/0001",
		docNo: "JW/26-27/0003",
		date: "2026-09-13",
		valuePaise: 20695e3,
		partBAt: "2026-09-13T08:40:00+05:30",
		vehicle: "GJ01AB4421",
		reason: "3 Job Work"
	}]
};
function RegistersView({ data = FIX_REGISTERS }) {
	const company = data.company;
	const fy = financialYearLabel(/* @__PURE__ */ new Date());
	const period = company.turnoverAbove5Cr ? "April 2026 – September 2026 (half-year — turnover > ₹5 Cr)" : `FY 20${fy} (annual — turnover ≤ ₹5 Cr)`;
	const docs = data.invoices.map((i) => i.docNo);
	const gaps = serialGaps(docs);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "GSTR-1 lite · ITC-04 · e-way register · invoice serial",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GstLetterhead, {
				company,
				right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[13px] font-bold uppercase tracking-wide",
						children: "GST registers"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["FY ", fy] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[9px]",
						children: period
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 text-[11px] font-bold uppercase",
				children: "Invoice register (serial-gap check)"
			}),
			gaps.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[10px] font-semibold",
				children: [
					"Gap after ",
					gaps.map((g) => `${g.missingAfter} (expected ${g.expected})`).join("; "),
					"."
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px]",
				children: "No serial gaps in this list."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table mt-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Invoice" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "GSTIN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Name" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "POS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "CGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Total" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.invoices.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: gaps.some((g) => g.missingAfter === r.docNo) ? "bg-cream-deep" : void 0,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: r.docNo
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDateIN(r.date) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: r.gstin ?? "URP"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: r.name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: r.place }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatInrGrouped(r.taxablePaise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatInrGrouped(r.cgstPaise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatInrGrouped(r.sgstPaise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatInrGrouped(r.igstPaise)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatInrGrouped(r.totalPaise)
						})
					]
				}, r.docNo)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "GSTR-1 lite — B2B"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "GSTIN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Invoice" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Value" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "POS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "CGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IGST" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.invoices.filter((i) => i.gstin).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: r.gstin
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: r.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDateIN(r.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.totalPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: r.place }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.taxablePaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.cgstPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.sgstPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.igstPaise)
					})
				] }, r.docNo)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "GSTR-1 lite — CDNR"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Note" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Original invoice" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "GSTIN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "CGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IGST" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.notes.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "font-mono",
						children: [
							r.kind,
							" ",
							r.docNo
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDateIN(r.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: r.originalNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: r.gstin ?? "URP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.taxablePaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.cgstPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.sgstPaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(r.igstPaise)
					})
				] }, r.docNo)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "GSTR-1 lite — HSN summary (Table 12 style)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "UQC" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Taxable" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "CGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SGST" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "IGST" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: hsnRollup(data).map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: h.hsn
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: "NOS / KGS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(h.taxable)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(h.cgst)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(h.sgst)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(h.igst)
					})
				] }, h.hsn)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "Job-work / delivery challan register (feeds ITC-04)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Challan" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Job worker" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "GSTIN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "KGS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Due (s.143)" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.challans.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDateIN(c.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.partner }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.gstin ?? "URP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.hsn
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(c.qtyNos)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(c.qtyKgs)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDateIN(c.due) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: c.status })
				] }, c.docNo)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "ITC-04 worksheet — Table 4 (inputs / capital goods sent)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Challan" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "JW GSTIN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty KGS" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.challans.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDateIN(c.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.gstin ?? "URP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.hsn
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(c.qtyNos)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(c.qtyKgs)
					})
				] }, `t4-${c.docNo}`)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "ITC-04 worksheet — Table 5A (received back + losses)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Original challan" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Received NOS" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Loss NOS" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.challans.filter((c) => n(c.receivedNos) > 0 || n(c.lossNos) > 0).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: c.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(c.receivedNos ?? 0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(c.lossNos ?? 0)
					})
				] }, `t5a-${c.docNo}`)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "ITC-04 worksheet — Table 5B (sent to another job worker)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Original challan" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Sent to another JW" })] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.challans.filter((c) => c.sentToAnotherJw).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					colSpan: 2,
					children: "None in this period."
				}) }) : data.challans.filter((c) => c.sentToAnotherJw).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: c.docNo
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: "Yes" })] }, `t5b-${c.docNo}`)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-4 text-[11px] font-bold uppercase",
				children: "E-way register (Part B time = validity start)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "doc-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Stub / e-way" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Document" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Value" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Reason" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vehicle" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Part B (validity start)" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: data.eways.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: e.stubNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: e.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: formatDateIN(e.date) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatInrGrouped(e.valuePaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: e.reason }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: e.vehicle
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: e.partBAt ? e.partBAt.replace("T", " ").slice(0, 19) : "Part A only — validity not started" })
				] }, e.stubNo)) })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-[9px]",
				children: [
					"These worksheets are books of the factory. They are not a GSTN filing. ITC-04 frequency follows the turnover setting (half-year if ",
					">",
					" ₹5 Cr, else annual)."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company })
		]
	});
}
function hsnRollup(data) {
	const m = /* @__PURE__ */ new Map();
	for (const r of data.invoices) {
		const cur = m.get(r.hsn) ?? {
			hsn: r.hsn,
			taxable: 0,
			cgst: 0,
			sgst: 0,
			igst: 0
		};
		cur.taxable += r.taxablePaise;
		cur.cgst += r.cgstPaise;
		cur.sgst += r.sgstPaise;
		cur.igst += r.igstPaise;
		m.set(r.hsn, cur);
	}
	return [...m.values()];
}
//#endregion
export { RegistersView as n, FIX_REGISTERS as t };
