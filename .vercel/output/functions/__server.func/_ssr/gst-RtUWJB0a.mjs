import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { c as todayISO } from "./format-Bcy9062O.mjs";
import { n as getGstWorksheets } from "./api-finance-DafwBR3A.mjs";
import { s as toCsv } from "./gst-worksheets-nHLWxJiz.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { S as AppShell, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/gst-RtUWJB0a.js
var import_jsx_runtime = require_jsx_runtime();
function download(name, text) {
	const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	a.click();
	URL.revokeObjectURL(url);
}
function GstPage() {
	const d = useQuery({
		queryKey: ["gst-ws"],
		queryFn: () => getGstWorksheets({ data: {
			from: "2026-04-01",
			to: todayISO()
		} })
	}).data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Compliance",
			title: "GST worksheets",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: d?.watermark
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-3 text-sm text-muted",
			children: [
				"No GSTN login. Dates IST. FY 1 Apr–31 Mar. ITC-04 period is ",
				d?.itc04Period.label ?? "—",
				"."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !d,
					onClick: () => d && download("gstr-1.csv", d.gstr1),
					children: "GSTR-1 CSV"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !d,
					onClick: () => d && download("gstr-3b.csv", d.gstr3b),
					children: "GSTR-3B CSV"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !d,
					onClick: () => d && download("itc-04.csv", d.itc04),
					children: "ITC-04 CSV"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !d,
					onClick: () => d && download("eway-register.csv", toCsv([
						"Stub",
						"Doc",
						"Date",
						"Vehicle"
					], (d.eway ?? []).map((e) => [
						e.stub_no,
						e.doc_no,
						e.doc_date,
						e.vehicle
					]))),
					children: "E-way stub CSV"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Serial integrity (FY gaps in red)",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Type" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Prefix" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Issued" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Next" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Gaps" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (d?.serial ?? []).map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: s.doc_type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: s.prefix
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: s.issued
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: s.next
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: s.gaps.length ? "font-mono text-danger" : "font-mono",
						children: s.gaps.length ? s.gaps.join(", ") : "—"
					})
				] }, s.doc_type)) })]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "E-way stub register",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
				className: "overflow-auto p-3 font-mono text-micro",
				children: JSON.stringify(d?.eway ?? [], null, 2)
			})
		})
	] });
}
//#endregion
export { GstPage as component };
