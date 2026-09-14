import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as listMasters, L as listOnHand, R as listOpenDocs, S as AppShell, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { n as createMelt, s as postSpectro } from "./api-sales-Cw_pBp-x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/foundry-DB9nzw4C.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function FoundryPage() {
	const qc = useQueryClient();
	const masters = useQuery({
		queryKey: ["masters"],
		queryFn: () => listMasters()
	});
	const lots = useQuery({
		queryKey: ["onhand"],
		queryFn: () => listOnHand()
	});
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const scrap = (lots.data ?? []).filter((l) => l.item_type === "SCRAP" && l.owner_type === "OWN" && n(l.qty_kg) > 0);
	const [alloyId, setAlloyId] = (0, import_react.useState)("");
	const [lotId, setLotId] = (0, import_react.useState)("");
	const [qty, setQty] = (0, import_react.useState)("10");
	const [meltId, setMeltId] = (0, import_react.useState)("");
	const [cu, setCu] = (0, import_react.useState)("61.4");
	const [zn, setZn] = (0, import_react.useState)("35.5");
	const [pb, setPb] = (0, import_react.useState)("3.1");
	const melt = useMutation({
		mutationFn: () => createMelt({ data: {
			alloyId: Number(alloyId || masters.data?.alloys[0]?.id),
			lotId: Number(lotId || scrap[0]?.id),
			qtyKg: n(qty)
		} }),
		onSuccess: (r) => {
			toast.success(`${r.docNo} heat ${r.heatNo}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const spec = useMutation({
		mutationFn: () => postSpectro({ data: {
			meltId: Number(meltId || docs.data?.melts[0]?.id),
			cuPct: n(cu),
			znPct: n(zn),
			pbPct: n(pb)
		} }),
		onSuccess: (r) => {
			toast.success(r.passed ? "Spectro PASS" : "Spectro HOLD");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Foundry lite",
			title: "Charge scrap of known alloy · spectro"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2 rounded-md border border-line bg-paper p-3",
				onSubmit: (e) => {
					e.preventDefault();
					melt.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Alloy",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: alloyId || String(masters.data?.alloys[0]?.id ?? ""),
							onChange: (e) => setAlloyId(e.target.value),
							children: (masters.data?.alloys ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: a.id,
								children: a.code
							}, a.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Charge lot (scrap)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: lotId || String(scrap[0]?.id ?? ""),
							onChange: (e) => setLotId(e.target.value),
							children: scrap.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
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
						label: "Charge kg",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							value: qty,
							onChange: (e) => setQty(e.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						children: "Open melt"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "space-y-2 rounded-md border border-line bg-paper p-3",
				onSubmit: (e) => {
					e.preventDefault();
					spec.mutate();
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Melt",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
							value: meltId || String(docs.data?.melts[0]?.id ?? ""),
							onChange: (e) => setMeltId(e.target.value),
							children: (docs.data?.melts ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
								value: m.id,
								children: [
									m.doc_no,
									" · ",
									m.alloy,
									" · ",
									m.heat_no
								]
							}, m.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-3 gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Cu %",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: cu,
									onChange: (e) => setCu(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Zn %",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: zn,
									onChange: (e) => setZn(e.target.value)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
								label: "Pb %",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									value: pb,
									onChange: (e) => setPb(e.target.value)
								})
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						variant: "navy",
						className: "w-full",
						children: "Post spectro"
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Melts",
			className: "mt-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Heat" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Alloy" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Furnace" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.melts ?? []).map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: m.doc_no
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: m.heat_no
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: m.alloy
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: m.furnace }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: m.status === "PASSED" ? "AVAILABLE" : "HOLD",
						children: m.status
					}) })
				] }, m.id)) })]
			})
		})
	] });
}
//#endregion
export { FoundryPage as component };
