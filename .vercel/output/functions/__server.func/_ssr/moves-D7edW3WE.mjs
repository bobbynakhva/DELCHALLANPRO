import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n, r as formatINR } from "./format-Bcy9062O.mjs";
import { t as REASON_CODES } from "./rules-ctSmlA2x.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as approveStockAdjust, I as listMoves, L as listOnHand, M as getLotLedger, O as getBootstrap, R as listOpenDocs, S as AppShell, V as requestStockAdjust, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/moves-D7edW3WE.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function MovesPage() {
	const qc = useQueryClient();
	const lots = useQuery({
		queryKey: ["onhand"],
		queryFn: () => listOnHand()
	});
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const role = useQuery({
		queryKey: ["bootstrap"],
		queryFn: () => getBootstrap()
	}).data?.staff.role;
	const canAdjust = role === "OWNER" || role === "STORES" || role === "ADMIN";
	const canApprove = role === "OWNER" || role === "ADMIN";
	const [lotId, setLotId] = (0, import_react.useState)("");
	const [qtyKg, setQtyKg] = (0, import_react.useState)("1.000");
	const [reason, setReason] = (0, import_react.useState)("Cycle count");
	const [reasonCode, setReasonCode] = (0, import_react.useState)("ADJ-COUNT");
	const [filterLot, setFilterLot] = (0, import_react.useState)("");
	const [filterReason, setFilterReason] = (0, import_react.useState)("");
	const ownLots = (lots.data ?? []).filter((l) => l.owner_type === "OWN" && n(l.qty_kg) + n(l.qty_pcs) > 0);
	const q = useQuery({
		queryKey: [
			"moves",
			filterLot,
			filterReason
		],
		queryFn: () => listMoves({ data: {
			lotId: filterLot ? Number(filterLot) : void 0,
			reasonCode: filterReason || void 0
		} })
	});
	const ledger = useQuery({
		queryKey: ["ledger", filterLot],
		queryFn: () => getLotLedger({ data: { lotId: Number(filterLot) } }),
		enabled: Boolean(filterLot)
	});
	const mut = useMutation({
		mutationFn: () => requestStockAdjust({ data: {
			lotId: Number(lotId || ownLots[0]?.id),
			qtyKg: n(qtyKg),
			qtyPcs: 0,
			reason,
			reasonCode
		} }),
		onSuccess: (r) => {
			toast.success(r.status === "PENDING" ? `Queued for dual approval (${formatINR(r.absValue)} > ${formatINR(r.threshold)})` : `Posted adjustment ${formatINR(r.absValue)}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const decide = useMutation({
		mutationFn: (p) => approveStockAdjust({ data: p }),
		onSuccess: (r) => {
			toast.success(r.status);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Stores",
			title: "Stock ledger",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: "Sales cannot adjust. Above ₹5,000 needs Owner dual approval."
			})
		}),
		canAdjust ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-4",
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Lot",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: lotId || String(ownLots[0]?.id ?? ""),
						onChange: (e) => setLotId(e.target.value),
						children: ownLots.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: l.id,
							children: [
								l.lot_no,
								" · ",
								l.sku,
								" · ",
								formatKg(l.qty_kg),
								" kg"
							]
						}, l.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Δ kg (signed)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: qtyKg,
						onChange: (e) => setQtyKg(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Reason code",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: reasonCode,
						onChange: (e) => setReasonCode(e.target.value),
						children: REASON_CODES.ADJ.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c,
							children: c
						}, c))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Reason",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: reason,
						onChange: (e) => setReason(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: mut.isPending,
						children: "Adjust / request"
					})
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-muted",
			children: "Your role cannot post stock adjustments."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Lot filter (running kg / pcs)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: filterLot,
						onChange: (e) => setFilterLot(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "All lots"
						}), (lots.data ?? []).map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: l.id,
							children: [
								l.lot_no,
								" · ",
								l.sku
							]
						}, l.id))]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Reason code filter",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: filterReason,
						onChange: (e) => setFilterReason(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "All"
						}), [
							...REASON_CODES.SCRAP,
							...REASON_CODES.REJ,
							...REASON_CODES.ADJ
						].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c,
							children: c
						}, c))]
					})
				}),
				ledger.data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end font-mono text-sm",
					children: [
						String(ledger.data.sku ?? ""),
						" · on-hand ",
						formatKg(ledger.data.lot.qty_kg),
						" kg / ",
						formatPcs(ledger.data.lot.qty_pcs),
						" pcs"
					]
				}) : null
			]
		}),
		(docs.data?.approvals ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Dual-approval queue",
			className: "mb-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Id" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Kind" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Value" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.approvals ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: a.id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: a.kind
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatINR(a.threshold_paise)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: a.status,
						children: a.status
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "space-x-1",
						children: canApprove && a.status === "PENDING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							onClick: () => decide.mutate({
								id: a.id,
								decision: "APPROVE"
							}),
							children: "Approve"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							size: "sm",
							variant: "danger",
							onClick: () => decide.mutate({
								id: a.id,
								decision: "REJECT"
							}),
							children: "Reject"
						})] }) : null
					})
				] }, a.id)) })]
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "When" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Type" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Item" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Whs" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "pcs" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Run kg" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Run pcs" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Alloy" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Reason" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Ref" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Notes" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (q.data ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "whitespace-nowrap tabular",
					children: String(m.posted_at).replace("T", " ").slice(0, 19)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: m.move_type
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: m.sku
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: m.lot_no
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: m.warehouse
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
					className: "tabular",
					children: m.running_kg != null ? formatKg(m.running_kg) : "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: m.running_pcs != null ? formatPcs(m.running_pcs) : "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: m.alloy ?? "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: m.reason_code ?? "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
					className: "font-mono",
					children: [
						m.ref_type,
						"/",
						m.ref_id
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "max-w-48 truncate text-muted",
					children: m.notes ?? ""
				})
			] }, m.id)) })]
		}) })
	] });
}
//#endregion
export { MovesPage as component };
