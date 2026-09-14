import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { i as formatDateTimeIST } from "./dates-BQYs1Vuz.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/signature-block-VVZRWvAz.js
var import_jsx_runtime = require_jsx_runtime();
/** Rule 46 / Rule 55(2) — copy watermarks on tax invoice and delivery challan. */
function CopyWatermark({ text }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden",
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "select-none text-center text-[36px] font-bold uppercase leading-tight tracking-widest text-ink/10",
			style: { transform: "rotate(-28deg)" },
			children: text
		})
	});
}
function DocFrame({ citation, copies, copy, onCopy, issues, children }) {
	const blocks = (issues ?? []).filter((i) => i.level === "block");
	const warns = (issues ?? []).filter((i) => i.level === "warn");
	const blocked = blocks.length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-cream p-3 print:bg-white print:p-0",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print mb-3 flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => window.print(),
						disabled: blocked,
						children: "Print / Save PDF"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => history.back(),
						children: "Back"
					}),
					copies?.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: "h-9 rounded-sm border border-line bg-paper px-2 text-sm",
						value: copy,
						onChange: (e) => onCopy?.(e.target.value),
						children: copies.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c,
							children: c
						}, c))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-micro text-muted",
						children: citation
					})
				]
			}),
			blocked ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "no-print mb-2 border border-danger bg-danger/10 px-3 py-2 text-sm text-danger",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "BLOCK PRINT." }),
					" ",
					blocks.map((b) => b.message).join(" · ")
				]
			}) : null,
			warns.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "no-print mb-2 border border-warn bg-warn/10 px-3 py-2 text-sm text-warn",
				children: warns.map((w) => w.message).join(" · ")
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "doc-gst relative mx-auto bg-white text-ink shadow-sm print:shadow-none",
				children: [copy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyWatermark, { text: copy }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative",
					children
				})]
			})
		]
	});
}
/** GSTIN first two digits = state code. Gujarat = 24. */
var GST_STATES = {
	"01": "Jammu and Kashmir",
	"02": "Himachal Pradesh",
	"03": "Punjab",
	"04": "Chandigarh",
	"05": "Uttarakhand",
	"06": "Haryana",
	"07": "Delhi",
	"08": "Rajasthan",
	"09": "Uttar Pradesh",
	"10": "Bihar",
	"11": "Sikkim",
	"12": "Arunachal Pradesh",
	"13": "Nagaland",
	"14": "Manipur",
	"15": "Mizoram",
	"16": "Tripura",
	"17": "Meghalaya",
	"18": "Assam",
	"19": "West Bengal",
	"20": "Jharkhand",
	"21": "Odisha",
	"22": "Chhattisgarh",
	"23": "Madhya Pradesh",
	"24": "Gujarat",
	"25": "Daman and Diu",
	"26": "Dadra and Nagar Haveli and Daman and Diu",
	"27": "Maharashtra",
	"29": "Karnataka",
	"30": "Goa",
	"32": "Kerala",
	"33": "Tamil Nadu",
	"34": "Puducherry",
	"36": "Telangana",
	"37": "Andhra Pradesh",
	"97": "Other Territory"
};
function placeOfSupplyLabel(code, fallbackName) {
	if (!code) return fallbackName ? fallbackName : "—";
	const c = String(code).padStart(2, "0");
	const name = GST_STATES[c] ?? fallbackName ?? "";
	return name ? `${c}-${name}` : c;
}
function gstinLooksValid(gstin) {
	return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.trim().toUpperCase());
}
/** GSTIN 15 chars; state name + code wherever required. */
function GstinLine({ gstin, stateCode, stateName, unregistered }) {
	if (unregistered || !gstin) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["GSTIN: URP (unregistered)", stateCode ? ` · ${placeOfSupplyLabel(stateCode, stateName)}` : ""] });
	const ok = gstinLooksValid(gstin);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		"GSTIN: ",
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono tracking-wide",
			children: gstin
		}),
		ok ? "" : " (check format)",
		" · ",
		placeOfSupplyLabel(gstin.slice(0, 2), stateName)
	] });
}
function GstLetterhead({ company, right }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex justify-between gap-4 border-b-2 border-ink pb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[15px] font-bold leading-tight text-ink",
					children: company.legalName
				}),
				company.tradeName && company.tradeName !== company.legalName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[11px]",
					children: ["Trade name: ", company.tradeName]
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [company.addressLine1, company.addressLine2 ? `, ${company.addressLine2}` : ""] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					company.city,
					", ",
					company.state,
					" ",
					company.pincode
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GstinLine, {
					gstin: company.gstin,
					stateCode: company.stateCode,
					stateName: company.state
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					"PAN ",
					company.pan,
					company.cin ? ` · CIN ${company.cin}` : ""
				] }),
				company.phone || company.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					company.phone,
					" ",
					company.email
				] }) : null
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0 text-right",
			children: right
		})]
	});
}
function SignatureBlock({ company }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 grid grid-cols-2 gap-6 text-[10px]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Certified that the particulars given above are true and correct." }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-right",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["For ", company.legalName] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-10 font-semibold",
					children: company.authorisedSignatory
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [company.authorisedDesignation, " · Authorised signatory"] })
			]
		})]
	});
}
function DocFooter({ company }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "mt-4 border-t border-ink pt-1 text-[8px] leading-snug text-ink",
		children: [
			company.cin ? `CIN ${company.cin} · ` : "",
			"Registered office: ",
			company.registeredOffice ?? `${company.addressLine1}, ${company.city}`,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
			"This is a computer-generated document. Printed ",
			formatDateTimeIST(),
			"."
		]
	});
}
//#endregion
export { SignatureBlock as a, GstinLine as i, DocFrame as n, GstLetterhead as r, DocFooter as t };
