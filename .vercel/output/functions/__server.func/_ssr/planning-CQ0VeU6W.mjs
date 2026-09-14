import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as formatPcs, i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { a as listMrp, c as runMrp, t as applyMrpDrafts } from "./api-planning-BRCqgLhR.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as AppShell, _ as Empty, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/planning-CQ0VeU6W.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PlanningPage() {
	const qc = useQueryClient();
	const [horizon, setHorizon] = (0, import_react.useState)(14);
	const [picked, setPicked] = (0, import_react.useState)([]);
	const q = useQuery({
		queryKey: ["mrp"],
		queryFn: () => listMrp()
	});
	const run = useMutation({
		mutationFn: () => runMrp({ data: { horizonDays: horizon } }),
		onSuccess: (r) => {
			toast.success(`${r.runNo} · ${r.lines.length} lines · ${horizon}d`);
			setPicked([]);
			qc.invalidateQueries({ queryKey: ["mrp"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const apply = useMutation({
		mutationFn: () => applyMrpDrafts({ data: {
			runId: n(q.data?.latest?.id),
			lineIds: picked
		} }),
		onSuccess: (r) => {
			toast.success(r.created.map((c) => `${c.kind} ${c.docNo}`).join(", ") || "No drafts");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const lines = q.data?.lines ?? [];
	const latest = q.data?.latest;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "PPC",
			title: "Weekly MRP",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: horizon === 14 ? "rounded-sm bg-navy px-3 py-1.5 text-sm text-cream" : "rounded-sm border border-line px-3 py-1.5 text-sm",
						onClick: () => setHorizon(14),
						children: "14 days"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: horizon === 42 ? "rounded-sm bg-navy px-3 py-1.5 text-sm text-cream" : "rounded-sm border border-line px-3 py-1.5 text-sm",
						onClick: () => setHorizon(42),
						children: "42 days"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => run.mutate(),
						disabled: run.isPending,
						children: "Run MRP"
					})
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-muted",
			children: "Demand = open unshipped SO + safety stock. Forecast only if the table has rows (seeded empty). Time fence 3 days — released WOs inside the fence are never cancelled. Checked lines spawn DRAFT WO / PO / JW — no stock post."
		}),
		!latest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No planning run yet" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-2 font-mono text-sm text-navy",
				children: [
					latest.run_no,
					" · horizon ",
					latest.horizon_days,
					"d · fence ",
					latest.time_fence_days,
					"d"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "MRP lines",
				actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					disabled: !picked.length || apply.isPending,
					onClick: () => apply.mutate(),
					children: [
						"Create drafts (",
						picked.length,
						")"
					]
				}),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SKU" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "UOM" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Demand" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Supply" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Avail" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "WO" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "PO" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "JW" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Short" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Action" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Suggest" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Draft" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: lines.map((ln) => {
						const id = ln.id;
						const action = ln.action;
						const fmt = ln.qty_uom === "KG" ? formatKg : formatPcs;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: (action === "CREATE_WO" || action === "CREATE_PO" || action === "CREATE_JW") && !ln.draft_doc_id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: picked.includes(id),
								onChange: (e) => setPicked((p) => e.target.checked ? [...p, id] : p.filter((x) => x !== id))
							}) : null }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: ln.sku
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: ln.qty_uom
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: fmt(ln.demand_qty)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: fmt(ln.supply_qty)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: fmt(ln.available_qty)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: fmt(ln.open_wo_qty)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: fmt(ln.open_po_qty)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: fmt(ln.jw_pipeline_qty)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: fmt(ln.shortfall_qty)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								tone: action === "NONE" ? "AVAILABLE" : "HOLD",
								children: action
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: n(ln.suggested_qty) ? fmt(ln.suggested_qty) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: ln.draft_doc_type ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: ln.draft_doc_type === "WO" ? "/wo" : ln.draft_doc_type === "PO" ? "/po" : "/jw",
									className: "underline",
									children: [
										ln.draft_doc_type,
										" #",
										ln.draft_doc_id
									]
								}) : "—"
							})
						] }, id);
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Work-centre load (open WO minutes / weekly capacity)",
				className: "mt-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Centre" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Weekly min" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Open min" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Load %" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Queue d" })
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (q.data?.load ?? []).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: w.code
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: w.weekly_minutes
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: n(w.open_minutes).toFixed(0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: "tabular",
							children: [n(w.load_pct).toFixed(1), "%"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: w.queue_days
						})
					] }, w.code)) })]
				})
			})
		] })
	] });
}
//#endregion
export { PlanningPage as component };
