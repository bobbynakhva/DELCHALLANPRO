import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as formatKg, o as n } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as listMasters, H as reverseGrn, R as listOpenDocs, S as AppShell, g as Badge, v as PageHeader, x as linesOf, y as Panel, z as postGrn } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/grn-C8XV9wPi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function GrnPage() {
	const qc = useQueryClient();
	const masters = useQuery({
		queryKey: ["masters"],
		queryFn: () => listMasters()
	});
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const rods = (masters.data?.items ?? []).filter((i) => i.type === "RM");
	const vendors = (masters.data?.partners ?? []).filter((p) => p.is_vendor);
	const defaultItem = rods.find((i) => i.sku === "ROD-C360-12MM")?.id ?? rods[0]?.id ?? "";
	const defaultPartner = vendors.find((p) => p.code === "V-RAJESH")?.id ?? vendors[0]?.id ?? "";
	const [partnerId, setPartnerId] = (0, import_react.useState)("");
	const [itemId, setItemId] = (0, import_react.useState)("");
	const [poId, setPoId] = (0, import_react.useState)("");
	const [heatNo, setHeatNo] = (0, import_react.useState)("H26-0913");
	const [gross, setGross] = (0, import_react.useState)("1262.800");
	const [tare, setTare] = (0, import_react.useState)("12.300");
	const [vehicle, setVehicle] = (0, import_react.useState)("GJ-01-AB-4421");
	const net = (0, import_react.useMemo)(() => n(gross) - n(tare), [gross, tare]);
	const mut = useMutation({
		mutationFn: () => postGrn({ data: {
			partnerId: Number(partnerId || defaultPartner),
			itemId: Number(itemId || defaultItem),
			poId: poId ? Number(poId) : void 0,
			heatNo,
			grossKg: n(gross),
			tareKg: n(tare),
			vehicleNo: vehicle
		} }),
		onSuccess: (r) => {
			toast.success(`Posted ${r.docNo} · lot ${r.lotNo} · ${r.netKg} kg on QC hold`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const rev = useMutation({
		mutationFn: (grnId) => reverseGrn({ data: { grnId } }),
		onSuccess: (r) => {
			toast.success(`Reversed ${r.docNo} — original GRN_RECEIPT remains, opposite posted`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "Stores / purchase",
		title: "Goods receipt — gross / tare / net kg"
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
					label: "Vendor",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: partnerId || String(defaultPartner),
						onChange: (e) => setPartnerId(e.target.value),
						children: vendors.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: p.id,
							children: p.name
						}, p.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Against PO (optional)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: poId,
						onChange: (e) => setPoId(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "— none —"
						}), (docs.data?.pos ?? []).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: p.id,
							children: p.doc_no
						}, p.id))]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Item",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Select, {
						value: itemId || String(defaultItem),
						onChange: (e) => setItemId(e.target.value),
						children: rods.map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: i.id,
							children: i.sku
						}, i.id))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Heat no.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: heatNo,
						onChange: (e) => setHeatNo(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Gross kg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: gross,
						onChange: (e) => setGross(e.target.value),
						inputMode: "decimal"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Tare kg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: tare,
						onChange: (e) => setTare(e.target.value),
						inputMode: "decimal"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Vehicle",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: vehicle,
						onChange: (e) => setVehicle(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-sm bg-cream px-2 py-2 font-mono text-sm",
					children: [
						"Net ",
						formatKg(net),
						" kg · posts to QUARANTINE"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					disabled: mut.isPending,
					children: "Post GRN"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-micro text-muted",
					children: "Journey 1: 1250.500 net of C360 12 mm rod."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "GRNs",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Vendor" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Net kg" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Heat" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.grns ?? []).map((g) => {
					const lines = linesOf(g.lines);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: g.doc_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: g.partner_name }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "tabular",
							children: formatKg(lines[0]?.net_kg)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "font-mono",
							children: lines[0]?.heat_no
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							tone: g.status,
							children: g.status
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/print/grn/$id",
							params: { id: String(g.id) },
							className: "text-sm text-navy underline",
							children: "Weighment"
						}), g.status !== "REVERSED" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ml-2 text-sm text-danger underline",
							onClick: () => rev.mutate(g.id),
							children: "Reverse"
						}) : null] })
					] }, g.id);
				}) })]
			})
		})]
	})] });
}
//#endregion
export { GrnPage as component };
