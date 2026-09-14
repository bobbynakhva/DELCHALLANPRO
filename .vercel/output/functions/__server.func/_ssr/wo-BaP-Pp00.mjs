import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { L as listOnHand, N as issueToWo, R as listOpenDocs, S as AppShell, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/wo-BaP-Pp00.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function WoPage() {
	const qc = useQueryClient();
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const rods = (useQuery({
		queryKey: ["onhand"],
		queryFn: () => listOnHand()
	}).data ?? []).filter((l) => l.item_type === "RM" && l.status === "AVAILABLE" && l.owner_type === "OWN");
	const [woId, setWoId] = (0, import_react.useState)("");
	const [lotId, setLotId] = (0, import_react.useState)("");
	const [qtyKg, setQtyKg] = (0, import_react.useState)("");
	const selectedWo = (docs.data?.wos ?? []).find((w) => String(w.id) === (woId || String(docs.data?.wos[0]?.id)));
	const neededKg = n(qtyKg || selectedWo?.required_kg);
	const sourceLot = rods.find((l) => String(l.id) === lotId) ?? rods.find((l) => n(l.qty_kg) + 5e-4 >= neededKg) ?? rods[0];
	const mut = useMutation({
		mutationFn: () => issueToWo({ data: {
			woId: Number(woId || selectedWo?.id),
			lotId: Number(lotId || sourceLot?.id),
			qtyKg: n(qtyKg || selectedWo?.required_kg)
		} }),
		onSuccess: (r) => {
			toast.success(`Issued ${r.issuedKg} kg from ${r.lotNo}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "PPC / stores",
		title: "Work orders — issue rod"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 lg:grid-cols-[20rem_1fr]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "space-y-2 rounded-md border border-line bg-paper p-3",
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Work order",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: woId || String(selectedWo?.id ?? ""),
						onChange: (e) => setWoId(e.target.value),
						children: (docs.data?.wos ?? []).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: w.id,
							children: [
								w.doc_no,
								" · ",
								w.sku
							]
						}, w.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Rod lot",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: lotId || String(sourceLot?.id ?? ""),
						onChange: (e) => setLotId(e.target.value),
						children: rods.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
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
					label: "Issue kg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: qtyKg,
						placeholder: selectedWo ? String(selectedWo.required_kg) : "",
						onChange: (e) => setQtyKg(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: mut.isPending,
					children: "Issue to WO"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Work orders",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Item" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Pcs" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Req kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Issued kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Good" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Reject" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Scrap kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.wos ?? []).map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: w.doc_no
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: w.sku
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(w.qty_pcs)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(w.required_kg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(w.issued_kg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(w.good_pcs)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatPcs(w.reject_pcs)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: formatKg(w.scrap_kg)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						tone: w.status,
						children: w.status
					}) })
				] }, w.id)) })]
			})
		})]
	})] });
}
//#endregion
export { WoPage as component };
