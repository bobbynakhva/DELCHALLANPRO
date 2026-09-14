import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { r as getHealthz } from "./api-finance-DafwBR3A.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/healthz-DSX4d31d.js
var import_jsx_runtime = require_jsx_runtime();
function HealthzPage() {
	const q = useQuery({
		queryKey: ["healthz"],
		queryFn: () => getHealthz()
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-cream p-6 font-mono text-sm text-navy",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "font-display text-2xl",
			children: "healthz"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
			className: "mt-3 rounded-md border border-line bg-paper p-3",
			children: JSON.stringify(q.data ?? q.error ?? "…", null, 2)
		})]
	});
}
//#endregion
export { HealthzPage as component };
