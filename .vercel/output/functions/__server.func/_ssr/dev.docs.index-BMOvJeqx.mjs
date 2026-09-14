import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as DOC_INDEX } from "./fixtures-BgLpXt_G.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dev.docs.index-BMOvJeqx.js
var import_jsx_runtime = require_jsx_runtime();
function DocsIndex() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-cream px-4 py-6 text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-micro font-semibold uppercase tracking-[0.14em] text-brass-deep",
					children: "GST documents — seeded examples"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl font-semibold text-navy",
					children: "Print previews (A4)"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "One fixture each. Print / Save PDF from the document. Live books (when posted) print from the invoice, challan, GRN and quote screens."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 divide-y divide-line rounded-md border border-line bg-paper",
					children: DOC_INDEX.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/dev/docs/$slug",
						params: { slug: d.slug },
						className: "flex items-baseline justify-between gap-3 px-3 py-2 hover:bg-cream",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-navy",
							children: d.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-micro text-muted",
							children: d.law
						})]
					}) }, d.slug))
				})
			]
		})
	});
}
//#endregion
export { DocsIndex as component };
