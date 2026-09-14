import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { m as Check, p as Circle } from "../_libs/lucide-react.mjs";
import { S as AppShell, j as getJourneys, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journeys-BXBVED_w.js
var import_jsx_runtime = require_jsx_runtime();
function Journeys() {
	const steps = useQuery({
		queryKey: ["journeys"],
		queryFn: () => getJourneys()
	}).data?.steps ?? [];
	const done = steps.filter((s) => s.done).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Acceptance",
			title: "Journeys — the books must move",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "font-mono text-sm text-navy",
				children: [done, " / 10 posted on this board"]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-3 text-sm text-muted",
			children: [
				"Interactive 1–10 live here. CLI pack 1–17 (finance + GST) at",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/dev/journeys",
					className: "text-navy underline",
					children: "/dev/journeys"
				}),
				"."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { children: steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-start gap-3 border-b border-line px-3 py-3 last:border-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: s.done ? "text-ok" : "text-muted",
				children: s.done ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Circle, { className: "size-4" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-baseline justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "font-medium text-navy",
						children: [
							s.n,
							". ",
							s.title
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: s.href,
						className: "text-sm text-brass-deep hover:underline",
						children: "Open"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-micro text-muted",
					children: s.note
				})]
			})]
		}, s.n)) }) }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-3 max-w-3xl text-sm text-muted",
			children: "Suggested path: GRN 1250.500 kg of C360 12 mm from Rajeshwar → QC release as QC → SO 10,000 HEX-NIPPLE-1/2-NCR to Gujarat Sanitary → explode & WO → issue rod → shop booking 9820 / 80 / 6.400 → JW OUT to Kiran → return 9700 / 80 / 40 → QC the FG lot → dispatch 5000 → change Cu and cut a new quote against the frozen June quote."
		})
	] });
}
//#endregion
export { Journeys as component };
