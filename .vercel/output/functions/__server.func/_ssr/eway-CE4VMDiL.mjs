import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { r as formatDateIN } from "./dates-BQYs1Vuz.mjs";
import { n as EWAY_REASONS } from "./types-DdJ4U74k.mjs";
import { n as formatInrGrouped } from "./words-H9cyahe6.mjs";
import { a as SignatureBlock, i as GstinLine, n as DocFrame, r as GstLetterhead, t as DocFooter } from "./signature-block-VVZRWvAz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/eway-CE4VMDiL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** CGST Act s.68 goods in movement · Rule 138 Form GST EWB-01. No NIC API this slice. */
function EwayForm({ doc }) {
	const [skip, setSkip] = (0, import_react.useState)(doc.partB.skippedVehicle);
	const sameStateShort = doc.partB.distanceKm <= 50;
	const belowThreshold = doc.partA.valuePaise < doc.company.ewayThresholdPaise;
	const forceJw = doc.partA.reasonCode === "3";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DocFrame, {
		citation: "CGST Act s.68 · Rule 138 Form GST EWB-01",
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
						children: doc.stubNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Date ", formatDateIN(doc.docDate)] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-[9px] font-semibold",
						children: doc.nicSigned ? "NIC-signed" : "STUB — not a NIC-signed e-way bill until submitted"
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-[10px]",
				children: [
					"Threshold ",
					formatInrGrouped(doc.company.ewayThresholdPaise),
					belowThreshold ? forceJw ? " — value is below threshold; generated because reason is Job Work (force allowed)." : " — value is below threshold." : ".",
					" ",
					"Validity of e-way bill starts from Part B, not Part A."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 text-[11px] font-bold uppercase tracking-wide",
				children: "Part A"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
				className: "doc-table",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "A.1 Recipient GSTIN / URP",
						v: doc.partA.recipientGstin
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "A.2 Delivery PIN",
						v: doc.partA.deliveryPin
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "A.3 Document no.",
						v: doc.partA.docNo
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "A.4 Document date",
						v: formatDateIN(doc.partA.docDate)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "A.5 Value",
						v: formatInrGrouped(doc.partA.valuePaise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "A.6 HSN",
						v: doc.partA.hsn
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "A.7 Reason",
						v: `${doc.partA.reasonCode} ${doc.partA.reasonLabel || EWAY_REASONS[doc.partA.reasonCode] || ""}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "Document type",
						v: doc.partA.documentType
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "Bill-to GSTIN",
						v: doc.partA.billToGstin
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "Ship-to GSTIN",
						v: doc.partA.shipToGstin
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-1 text-[10px]",
				children: [
					"Reasons:",
					" ",
					Object.entries(EWAY_REASONS).map(([c, l]) => `${c} ${l}`).join(" / "),
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-3 text-[11px] font-bold uppercase tracking-wide",
				children: "Part B"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
				className: "doc-table",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "Vehicle",
						v: skip ? "— (skipped ≤ 50 km same State/UT)" : doc.partB.vehicle
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "Mode",
						v: doc.partB.mode
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "GR / RR / AWB / BL",
						v: doc.partB.transDoc || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kv, {
						k: "Distance (km)",
						v: String(doc.partB.distanceKm)
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "no-print mt-2 flex items-start gap-2 text-[10px]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "checkbox",
					checked: skip,
					onChange: (e) => setSkip(e.target.checked),
					disabled: !sameStateShort
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Skip vehicle number only if movement is ≤ 50 km inside the same State/UT.", !sameStateShort ? " Disabled — distance exceeds 50 km or not intra-state." : " Warning: Part B still starts validity."] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-[10px] font-semibold",
				children: "Validity of e-way bill starts from Part B, not Part A."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[9px]",
				children: [
					"Driver copy — carry with the goods. Consigner GSTIN",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono",
						children: doc.company.gstin
					}),
					"."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 text-[10px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GstinLine, {
					gstin: doc.company.gstin,
					stateCode: doc.company.stateCode,
					stateName: doc.company.state
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignatureBlock, { company: doc.company }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocFooter, { company: doc.company })
		]
	});
}
function Kv({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: "w-48 text-left",
		children: k
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: "font-mono",
		children: v
	})] });
}
//#endregion
export { EwayForm as t };
