import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { a as formatPcs, i as formatKg } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { B as releaseLot, R as listOpenDocs, S as AppShell, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/qc-DMTfvZs9.js
var import_jsx_runtime = require_jsx_runtime();
function QcPage() {
	const qc = useQueryClient();
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const mut = useMutation({
		mutationFn: (p) => releaseLot({ data: p }),
		onSuccess: (r) => {
			toast.success(r.debitNoteNo ? `${r.lotNo} → ${r.status} · purchase DN draft ${r.debitNoteNo}` : `${r.lotNo} → ${r.status}`);
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
		kicker: "QC",
		title: "Inspections — only QC releases lots"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "app-table",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "QI" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Item" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Whs" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "kg" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "pcs" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Lot status" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Result" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {})
		] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.qis ?? []).map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: q.doc_no
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: q.lot_no
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: q.sku
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "font-mono",
				children: q.warehouse
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatKg(q.qty_kg)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "tabular",
				children: formatPcs(q.qty_pcs)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: q.lot_status,
				children: q.lot_status
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				tone: q.result,
				children: q.result
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				className: "space-x-1",
				children: q.result === "PENDING" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					onClick: () => mut.mutate({
						inspectionId: q.id,
						result: "PASS"
					}),
					children: "Release"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "sm",
					variant: "danger",
					onClick: () => mut.mutate({
						inspectionId: q.id,
						result: "FAIL"
					}),
					children: "Reject"
				})] }) : null
			})
		] }, q.id)) })]
	}) })] });
}
//#endregion
export { QcPage as component };
