import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { i as getPermissionsMatrix } from "./api-finance-DafwBR3A.mjs";
import { S as AppShell, _ as Empty, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.permissions-DfRfYiNK.js
var import_jsx_runtime = require_jsx_runtime();
function PermsPage() {
	const m = useQuery({
		queryKey: ["perms"],
		queryFn: () => getPermissionsMatrix()
	}).data;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Admin",
			title: "Permissions matrix (read-only)"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-3 text-sm text-muted",
			children: "Shop cannot see Sales, COA or margin. Stores cannot change MetalPrice. Denials write to the audit log."
		}),
		m ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Who can do what",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Permission" }), m.roles.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: m.labels[r] }, r))] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: Object.entries(m.perms).map(([k, roles]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "font-mono",
					children: k
				}), m.roles.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "tabular",
					children: roles.includes(r) ? "yes" : "—"
				}, r))] }, k)) })]
			})
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: "Recent denials",
			className: "mt-3",
			children: (m?.denials ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
				className: "app-table",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "When" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Perm" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Detail" })
				] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: m.denials.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: String(d.at)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono",
						children: d.entity
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "font-mono text-micro",
						children: String(d.after_json)
					})
				] }, i)) })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No permission denials logged" })
		})
	] });
}
//#endregion
export { PermsPage as component };
