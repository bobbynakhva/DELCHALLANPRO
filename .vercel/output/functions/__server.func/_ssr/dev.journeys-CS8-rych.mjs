import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as listJourneyRuns } from "./api-planning-BRCqgLhR.mjs";
import { S as AppShell, _ as Empty, g as Badge, v as PageHeader, y as Panel } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dev.journeys-CS8-rych.js
var import_jsx_runtime = require_jsx_runtime();
function DevJourneys() {
	const q = useQuery({
		queryKey: ["journey-runs"],
		queryFn: () => listJourneyRuns()
	});
	let file = null;
	const raw = q.data && "reportJson" in q.data ? q.data.reportJson : null;
	if (raw) try {
		file = JSON.parse(raw);
	} catch {
		file = null;
	}
	const steps = file?.steps ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Acceptance",
			title: "Last journey pack",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-sm text-navy",
				children: file ? `${file.passed ?? 0} PASS · ${file.failed ?? 0} FAIL` : "no pack on disk"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-3 text-sm text-muted",
			children: [
				"The CLI pack runs on a freshly seeded PGLite via posting.ts and writes",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono",
					children: "artifacts/journeys-last.json"
				}),
				". Live shop stock is a different process — walk it on",
				" ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/journeys",
					className: "text-navy underline",
					children: "10 journeys"
				}),
				"."
			]
		}),
		!file ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, { children: "No planning run yet — no journey pack on disk" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
			title: `Pack ${file.runAt ?? ""}`,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { children: steps.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-start gap-3 border-b border-line px-3 py-3 last:border-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					tone: s.pass ? "AVAILABLE" : "HOLD",
					children: s.pass ? "PASS" : "FAIL"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "font-medium text-navy",
					children: [
						s.n,
						". ",
						s.title
					]
				}), s.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-mono text-micro text-muted",
					children: s.note
				}) : null] })]
			}, s.n)) })
		})
	] });
}
//#endregion
export { DevJourneys as component };
