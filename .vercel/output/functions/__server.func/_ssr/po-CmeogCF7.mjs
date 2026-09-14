import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { i as formatKg, r as formatINR } from "./format-Bcy9062O.mjs";
import { R as listOpenDocs, S as AppShell, g as Badge, v as PageHeader, x as linesOf, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/po-CmeogCF7.js
var import_jsx_runtime = require_jsx_runtime();
function PoPage() {
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "Purchase",
		title: "Purchase orders"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "app-table",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vendor" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Date" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Qty kg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rate" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Received" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
		] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.pos ?? []).map((p) => {
			const ln = linesOf(p.lines)[0];
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: p.doc_no
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: p.partner_name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: String(p.order_date).slice(0, 10) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: ln?.sku
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: formatKg(ln?.qty_kg)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
					className: "tabular",
					children: [formatINR(ln?.rate_paise_per_kg), "/kg"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: formatKg(ln?.received_kg)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: p.status,
					children: p.status
				}) })
			] }, p.id);
		}) })]
	}) })] });
}
//#endregion
export { PoPage as component };
