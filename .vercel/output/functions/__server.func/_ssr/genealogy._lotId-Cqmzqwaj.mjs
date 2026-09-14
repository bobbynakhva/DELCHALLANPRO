import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatPcs, i as formatKg } from "./format-Bcy9062O.mjs";
import { A as getGenealogy, S as AppShell, g as Badge, h as Route$16, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/genealogy._lotId-Cqmzqwaj.js
var import_jsx_runtime = require_jsx_runtime();
function GenePage() {
	const { lotId } = Route$16.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GenealogyView, { lotId });
}
function GenealogyView({ lotId }) {
	const q = useQuery({
		queryKey: ["gene", lotId],
		queryFn: () => getGenealogy({ data: { id: Number(lotId) } })
	});
	const g = q.data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "Genealogy",
		title: g ? String(g.lot.lot_no) : `Lot ${lotId}`,
		children: g ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "font-mono text-sm",
			children: [
				g.lot.sku,
				" · heat ",
				g.lot.heat_no ?? "—",
				" · ",
				g.lot.alloy,
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/print/coc/$id",
					params: { id: lotId },
					className: "ml-2 text-navy underline",
					children: "CoC"
				})
			]
		}) : null
	}), q.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-danger",
		children: q.error.message
	}) : g ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-2",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "This lot",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
					className: "grid grid-cols-2 gap-2 p-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Warehouse"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-mono",
							children: g.lot.warehouse
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "kg / pcs"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
							className: "tabular",
							children: [
								formatKg(g.lot.qty_kg),
								" / ",
								formatPcs(g.lot.qty_pcs)
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Status"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: g.lot.status,
							children: g.lot.status
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
							className: "text-muted",
							children: "Heat / GRN"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
							className: "font-mono",
							children: g.lot.heat_no ?? "—"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Moves on this lot",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Type" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "pcs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Whs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Consumed" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (g.moves ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: m.move_type
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(m.qty_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatPcs(m.qty_pcs)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: m.warehouse
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: m.consumed_lot_id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/stock/lots/$lotId/genealogy",
								params: { lotId: String(m.consumed_lot_id) },
								className: "underline",
								children: ["lot ", m.consumed_lot_id]
							}) : "—"
						})
					] }, m.id)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Cartons (if packed)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Carton" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Pcs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Net kg" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Packing" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Invoice" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: g.cartons.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: c.carton_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatPcs(c.qty_pcs)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(c.net_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: c.packing_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: c.invoice_no
						})
					] }, c.carton_no)) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Parents (what went into this lot)",
				children: g.parents.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SKU" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Heat" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: g.parents.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/stock/lots/$lotId/genealogy",
								params: { lotId: String(p.id) },
								className: "underline",
								children: p.lot_no
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: p.sku
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: p.heat_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(p.qty_kg)
						})
					] }, p.id)) })]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "p-3 text-sm text-muted",
					children: "No parent lots — opening lot or not yet issued through a WO."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Walk back to rod / heat / GRN / JW",
				children: g.ancestors.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "space-y-1 p-3 font-mono text-sm",
					children: g.ancestors.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						"—".repeat(nDepth(a.depth)),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/stock/lots/$lotId/genealogy",
							params: { lotId: String(a.id) },
							className: "underline",
							children: [
								a.sku,
								" ",
								a.lot_no
							]
						}),
						" ",
						"heat ",
						a.heat_no,
						" ",
						formatKg(a.qty_kg),
						" kg"
					] }, `${a.id}-${i}`))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "p-3 text-sm text-muted",
					children: "No upstream chain on this lot yet. FG receipts after a WO issue walk back to the rod / heat."
				})
			})
		]
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-muted",
		children: "Loading genealogy…"
	})] });
}
function nDepth(v) {
	const n = Number(v);
	return Number.isFinite(n) ? n : 1;
}
//#endregion
export { GenealogyView, GenePage as component };
