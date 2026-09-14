import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as listMasters, S as AppShell, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { t as approveBom } from "./api-sales-Cw_pBp-x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/masters-CQSos-AD.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	"Items",
	"Alloys",
	"Warehouses",
	"Partners",
	"BOM",
	"Rates",
	"Tariffs"
];
function MastersPage() {
	const [tab, setTab] = (0, import_react.useState)("Items");
	const qc = useQueryClient();
	const m = useQuery({
		queryKey: ["masters"],
		queryFn: () => listMasters()
	}).data;
	const appr = useMutation({
		mutationFn: (bomId) => approveBom({ data: { bomId } }),
		onSuccess: () => {
			toast.success("BOM approved");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Masters",
			title: "Items, alloys, warehouses, partners"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mb-3 flex flex-wrap gap-1",
			children: TABS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setTab(t),
				className: tab === t ? "rounded-sm bg-navy px-3 py-1.5 text-sm text-cream" : "rounded-sm border border-line bg-paper px-3 py-1.5 text-sm",
				children: t
			}, t))
		}),
		tab === "Items" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SKU" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Type" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Alloy" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg/pc" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Recovery" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HSN" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Drg" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "M/B" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (m?.items ?? []).map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: i.sku
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: i.type }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: i.alloy_code
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: i.kg_per_pc ? n(i.kg_per_pc).toFixed(3) : "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: n(i.recovery_factor).toFixed(2)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: i.hsn
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
					className: "font-mono",
					children: [
						i.drawing_no,
						" ",
						i.drawing_rev
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: i.make_or_buy })
			] }, i.id)) })]
		}) }) : null,
		tab === "Alloys" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Code" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Cu %" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Zn %" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Pb %" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (m?.alloys ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: a.code
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: a.name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: a.cu_pct
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: a.zn_pct
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: a.pb_pct
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: a.is_scrap ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "scrap family" }) : null })
			] }, a.id)) })]
		}) }) : null,
		tab === "Warehouses" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Code" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Kind" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Outside" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Customer" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Valued" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (m?.warehouses ?? []).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: w.code
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: w.name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: w.kind }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: w.is_outside_factory ? "yes" : "" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: w.is_customer_owned ? "yes" : "" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: w.valuation_eligible ? "yes" : "no" })
			] }, w.id)) })]
		}) }) : null,
		tab === "Partners" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Code" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Name" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Flags" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "GSTIN" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Place" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Credit" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (m?.partners ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: p.code
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: p.name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
					className: "space-x-1",
					children: [
						p.is_customer ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "cust" }) : null,
						p.is_vendor ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "vend" }) : null,
						p.is_job_worker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: "HOLD",
							children: "JW"
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: p.gstin ?? "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [
					p.city,
					", ",
					p.state
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: p.credit_limit_paise ? formatINR(p.credit_limit_paise) : "—"
				})
			] }, p.id)) })]
		}) }) : null,
		tab === "BOM" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "FG" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Rev" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lines" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (m?.boms ?? []).map((b) => {
				const lines = (m?.bomLines ?? []).filter((l) => l.bom_id === b.id);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: b.sku
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: b.drawing_rev }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: b.status,
						children: b.status
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "text-micro",
						children: lines.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							l.is_co_product ? "↗" : "↙",
							" ",
							l.component_sku,
							" ",
							n(l.qty_per),
							" ",
							l.qty_uom
						] }, l.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: b.status !== "APPROVED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						onClick: () => appr.mutate(b.id),
						children: "Approve"
					}) : null })
				] }, b.id);
			}) })]
		}) }) : null,
		tab === "Rates" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vendor" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Process" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Family" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "₹/pc" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Loss norm" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (m?.rates ?? []).map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: r.partner_name }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: r.process_code
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: r.item_family }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: formatINR(r.rate_paise_per_pc)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
					className: "tabular",
					children: [n(r.loss_norm_pct).toFixed(2), "%"]
				})
			] }, r.id)) })]
		}) }) : null,
		tab === "Tariffs" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Own-shop process_tariff (PartnerProcessRate remains JW source of truth)",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Process" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Family" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "₹/pc" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "From" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (m?.tariffs ?? []).map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: t.process_code
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: t.item_family }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatINR(t.rate_paise_per_pc)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: String(t.effective_from).slice(0, 10)
					})
				] }, t.id)) })]
			})
		}) : null
	] });
}
//#endregion
export { MastersPage as component };
