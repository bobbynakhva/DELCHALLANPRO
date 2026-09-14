import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, r as Select, t as Field } from "./input-CysPhmQ2.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { F as listMasters, R as listOpenDocs, S as AppShell, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
import { r as createNcr } from "./api-sales-Cw_pBp-x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ncr-CLSYoi8w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NcrPage() {
	const qc = useQueryClient();
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const masters = useQuery({
		queryKey: ["masters"],
		queryFn: () => listMasters()
	});
	const [itemId, setItemId] = (0, import_react.useState)("");
	const [desc, setDesc] = (0, import_react.useState)("Dimensional drift on hex across-flats");
	const mut = useMutation({
		mutationFn: () => createNcr({ data: {
			itemId: itemId ? Number(itemId) : void 0,
			description: desc,
			source: "MANUAL"
		} }),
		onSuccess: (r) => {
			toast.success(r.docNo);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "QC",
			title: "Non-conformance"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mb-3 flex flex-wrap items-end gap-2 rounded-md border border-line bg-paper p-3",
			onSubmit: (e) => {
				e.preventDefault();
				mut.mutate();
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Item",
					className: "w-56",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
						value: itemId,
						onChange: (e) => setItemId(e.target.value),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "—"
						}), (masters.data?.items ?? []).map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: i.id,
							children: i.sku
						}, i.id))]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "Description",
					className: "min-w-64 flex-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: desc,
						onChange: (e) => setDesc(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					children: "Raise NCR"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "app-table",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Doc" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Item" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Source" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Description" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Status" })
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.ncrs ?? []).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: n.doc_no
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: n.sku
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: n.lot_no
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: n.source }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: n.description }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: n.status,
					children: n.status
				}) })
			] }, n.id)) })]
		}) })
	] });
}
//#endregion
export { NcrPage as component };
