import { o as __toESM } from "../_runtime.mjs";
import { a as require_jsx_runtime, i as useQueryClient, n as useQuery, o as require_react, t as useMutation } from "../_libs/react+tanstack__react-query.mjs";
import { c as todayISO, o as n } from "./format-Bcy9062O.mjs";
import { t as Button } from "./button-BKlCONpI.mjs";
import { n as Input, t as Field } from "./input-CysPhmQ2.mjs";
import { l as variancePack } from "./api-planning-BRCqgLhR.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { R as listOpenDocs, S as AppShell, _ as Empty, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/audit-C4nCAAcY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AuditPage() {
	const qc = useQueryClient();
	const docs = useQuery({
		queryKey: ["docs"],
		queryFn: () => listOpenDocs()
	});
	const [from, setFrom] = (0, import_react.useState)("2026-04-01");
	const [to, setTo] = (0, import_react.useState)(todayISO());
	const pack = useMutation({
		mutationFn: (freeze) => variancePack({ data: {
			from,
			to,
			freeze
		} }),
		onSuccess: (r) => {
			toast.success(r.frozen ? "Period frozen — GL not closed" : "Pack computed");
			qc.invalidateQueries();
		},
		onError: (e) => toast.error(e.message)
	});
	const live = pack.data?.pack;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Accounts",
			title: "Yield / JW-loss variance and audit log",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm text-muted",
				children: "Close period freezes CostVariance. Does not close the general ledger."
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mb-3 flex flex-wrap items-end gap-2 rounded-md border border-line bg-paper p-3",
			onSubmit: (e) => {
				e.preventDefault();
				pack.mutate(false);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "From",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: from,
						onChange: (e) => setFrom(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: "To",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "date",
						value: to,
						onChange: (e) => setTo(e.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					variant: "ghost",
					disabled: pack.isPending,
					children: "Pack variances"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "navy",
					disabled: pack.isPending,
					onClick: () => pack.mutate(true),
					children: "Close period"
				})
			]
		}),
		live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "This pack (not GL)",
			className: "mb-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Kind" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Notes" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Expected" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Actual" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Var" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: [
					...live.yield,
					...live.jwLoss,
					...live.metal
				].map((r, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: r.kind
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "text-muted",
						children: r.notes
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(r.expected).toFixed(3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(r.actual).toFixed(3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(r.variance).toFixed(3)
					})
				] }, i)) })]
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Frozen variances",
			className: "mb-3",
			children: (docs.data?.variances ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "When" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Kind" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Expected" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Actual" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Var" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Frozen" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Notes" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.variances ?? []).map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: String(v.created_at).replace("T", " ").slice(0, 19)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: v.kind
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(v.expected).toFixed(3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(v.actual).toFixed(3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: n(v.variance).toFixed(3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: v.frozen ? "yes" : "—" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "text-muted",
						children: v.notes
					})
				] }, v.id)) })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No variance rows yet" })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Stock & price audit",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "When" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Action" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Entity" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Id" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "After" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: (docs.data?.auditRows ?? []).map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular",
						children: String(a.at).replace("T", " ").slice(0, 19)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: a.action
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: a.entity }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: a.entity_id
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "max-w-md truncate font-mono text-micro text-muted",
						children: a.after_json
					})
				] }, a.id)) })]
			})
		})
	] });
}
//#endregion
export { AuditPage as component };
