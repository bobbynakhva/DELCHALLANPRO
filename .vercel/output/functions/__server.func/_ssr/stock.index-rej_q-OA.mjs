import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatPcs, i as formatKg, r as formatINR } from "./format-Bcy9062O.mjs";
import { L as listOnHand, O as getBootstrap, S as AppShell, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stock.index-rej_q-OA.js
var import_jsx_runtime = require_jsx_runtime();
function StockPage() {
	const q = useQuery({
		queryKey: ["onhand"],
		queryFn: () => listOnHand()
	});
	const hidePrices = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap()
	}).data?.staff.role === "STORES";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "Stores",
		title: "On-hand by lot — kg and pcs",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-sm text-muted",
			children: "Anonymous brass is not allowed. Every lot carries an alloy."
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "app-table",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Item" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Alloy" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Whs" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Heat" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "pcs" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Owner" }),
			hidePrices ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "₹/kg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
		] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (q.data ?? []).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/stock/lots/$lotId/genealogy",
					params: { lotId: String(r.id) },
					className: "text-navy hover:underline",
					children: r.lot_no
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "font-mono",
				children: r.sku
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-micro text-muted",
				children: r.item_name
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: r.alloy
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: r.warehouse
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: r.heat_no ?? "—"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatKg(r.qty_kg)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(r.qty_pcs)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: r.owner_type,
				children: r.owner_type
			}), r.owner_name ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-micro text-muted",
				children: r.owner_name
			}) : null] }),
			hidePrices ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: r.owner_type === "CUSTOMER" ? "₹0" : formatINR(r.unit_value_paise_per_kg)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: r.status,
				children: r.status
			}) })
		] }, r.id)) })]
	}) })] });
}
//#endregion
export { StockPage as component };
