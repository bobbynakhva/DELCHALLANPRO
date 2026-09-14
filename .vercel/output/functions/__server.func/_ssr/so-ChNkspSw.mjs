import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as getAtp, s as promiseSoLine } from "./api-planning-BRCqgLhR.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as explodeSo, E as createWorkOrder, F as listMasters, L as listOnHand, R as listOpenDocs, S as AppShell, T as createSalesOrder, g as Badge, v as PageHeader, x as linesOf, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/so-ChNkspSw.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SoPage() {
	const qc = useQueryClient();
	const masters = useQuery({
		queryKey: ["masters"],
		queryFn: () => listMasters()
	});
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const lots = useQuery({
		queryKey: ["onhand"],
		queryFn: () => listOnHand()
	});
	const customers = (masters.data?.partners ?? []).filter((p) => p.is_customer);
	const fgs = (masters.data?.items ?? []).filter((i) => i.type === "FG");
	const defC = customers.find((p) => p.code === "C-GS")?.id;
	const defI = fgs.find((i) => i.sku === "HEX-NIPPLE-1/2-NCR")?.id;
	const [partnerId, setPartnerId] = (0, import_react.useState)("");
	const [itemId, setItemId] = (0, import_react.useState)("");
	const [qty, setQty] = (0, import_react.useState)("10000");
	const [exp, setExp] = (0, import_react.useState)(null);
	const [atpLine, setAtpLine] = (0, import_react.useState)(null);
	const [overrideDate, setOverrideDate] = (0, import_react.useState)("");
	const [overrideReason, setOverrideReason] = (0, import_react.useState)("");
	const [allocLot, setAllocLot] = (0, import_react.useState)("");
	const atp = useQuery({
		queryKey: ["atp", atpLine],
		queryFn: () => getAtp({ data: { soLineId: atpLine } }),
		enabled: atpLine != null
	});
	const create = useMutation({
		mutationFn: () => createSalesOrder({ data: {
			partnerId: Number(partnerId || defC),
			itemId: Number(itemId || defI),
			qtyPcs: n(qty)
		} }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} @ ${formatINR(r.unitPricePaise)}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const explode = useMutation({
		mutationFn: (p) => explodeSo({ data: p }),
		onSuccess: (r) => setExp(r),
		onError: (e) => toast.error(e.message)
	});
	const wo = useMutation({
		mutationFn: (p) => createWorkOrder({ data: p }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} · required ${r.requiredKg} kg`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const promise = useMutation({
		mutationFn: () => promiseSoLine({ data: {
			soLineId: atpLine,
			overrideDate: overrideDate || void 0,
			overrideReason: overrideReason || void 0,
			allocateLotId: allocLot ? Number(allocLot) : void 0
		} }),
		onSuccess: (r) => {
			toast.success(`Promised ${r.promiseDate}`);
			qc.invalidateQueries({ queryKey: ["docs"] });
			qc.invalidateQueries({ queryKey: ["atp"] });
		},
		onError: (e) => toast.error(e.message)
	});
	const fgLots = (lots.data ?? []).filter((l) => l.status === "AVAILABLE" && n(l.qty_pcs) > 0 && (l.warehouse === "FG-DOM" || l.warehouse === "FG-EXP"));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Sales / PPC",
			title: "Sales orders — capable-to-promise"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-[18rem_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2 rounded-md border border-line bg-paper p-3",
				onSubmit: (e) => {
					e.preventDefault();
					create.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Customer",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: partnerId || String(defC ?? ""),
							onChange: (e) => setPartnerId(e.target.value),
							children: customers.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: p.id,
								children: p.name
							}, p.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Item",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: itemId || String(defI ?? ""),
							onChange: (e) => setItemId(e.target.value),
							children: fgs.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: i.id,
								children: i.sku
							}, i.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Qty pcs",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: qty,
							onChange: (e) => setQty(e.target.value),
							inputMode: "numeric"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: create.isPending,
						children: "Create SO"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-micro text-muted",
						children: "Journey 2: 10,000 pcs HEX-NIPPLE-1/2-NCR."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Open / recent SOs",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "app-table",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Customer" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Line" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Pcs" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Promise" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Price" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
					] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.sos ?? []).map((so) => {
						const ln = linesOf(so.lines)[0];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: so.doc_no
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: so.partner_name }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "font-mono",
								children: ln?.sku
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: formatPcs(ln?.qty_pcs)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: ln?.promise_date ? String(ln.promise_date).slice(0, 10) : "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "tabular",
								children: formatINR(ln?.unit_price_paise)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "space-x-1",
								children: ln ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => setAtpLine(ln.id),
										children: "ATP"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										variant: "ghost",
										onClick: () => explode.mutate({
											soId: so.id,
											lineId: ln.id
										}),
										children: "Explode"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
										size: "sm",
										onClick: () => wo.mutate({
											soId: so.id,
											lineId: ln.id
										}),
										children: "Create WO"
									})
								] }) : null
							})
						] }, so.id);
					}) })]
				})
			})]
		}),
		atpLine != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Capable-to-promise (honest, not APS)",
			className: "mt-3",
			children: atp.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2 p-3",
				"data-testid": "atp-working",
				children: [
					atp.data.atp.working.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "font-mono text-sm text-navy",
						children: w
					}, w)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-2 sm:grid-cols-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Computed promise",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									readOnly: true,
									value: atp.data.atp.promiseDate
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Override date",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									type: "date",
									value: overrideDate,
									onChange: (e) => setOverrideDate(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Override reason (required if date changes)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: overrideReason,
									onChange: (e) => setOverrideReason(e.target.value)
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Allocate AVAILABLE FG lot (optional — reserved lots cannot dispatch elsewhere)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
							value: allocLot,
							onChange: (e) => setAllocLot(e.target.value),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "— no allocation —"
							}), fgLots.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: l.id,
								children: [
									l.lot_no,
									" · ",
									l.sku,
									" · ",
									formatPcs(l.qty_pcs),
									" pcs"
								]
							}, l.id))]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => promise.mutate(),
						disabled: promise.isPending,
						children: "Save promise"
					}),
					atp.data.savedDate ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-micro text-muted",
						children: [
							"Saved ",
							String(atp.data.savedDate).slice(0, 10),
							atp.data.override ? ` · override ${atp.data.override}` : ""
						]
					}) : null
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "p-3 text-sm text-muted",
				children: "Loading ATP…"
			})
		}) : null,
		exp ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
			title: `Explosion ${exp.sku} × ${exp.qtyPcs} pcs`,
			className: "mt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "px-3 pt-2 font-mono text-sm text-navy",
				children: exp.formula
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Component" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Required kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "On-hand kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Shortage kg" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: exp.rows.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						className: "font-mono",
						children: [r.sku, r.coProduct ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							className: "ml-2",
							children: "co-product"
						}) : null]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(r.requiredKg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: r.coProduct ? "—" : formatKg(r.onHandKg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: r.coProduct ? "—" : formatKg(r.shortageKg)
					})
				] }, r.sku)) })]
			})]
		}) : null
	] });
}
//#endregion
export { SoPage as component };
