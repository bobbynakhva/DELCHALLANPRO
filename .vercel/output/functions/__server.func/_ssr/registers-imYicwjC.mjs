import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { S as AppShell, v as PageHeader } from "./router-Cx8Dk8pR.mjs";
import { n as RegistersView, t as FIX_REGISTERS } from "./registers-ByhVej0g.mjs";
import { d as getRegistersData } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/registers-imYicwjC.js
var import_jsx_runtime = require_jsx_runtime();
function RegistersPage() {
	const live = useQuery({
		queryKey: ["gst-registers"],
		queryFn: () => getRegistersData()
	}).data;
	const empty = live && live.invoices.length === 0 && live.challans.length === 0 && live.notes.length === 0 && live.eways.length === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageHeader, {
			kicker: "Compliance",
			title: "GST registers",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/dev/docs/$slug",
				params: { slug: "registers" },
				className: "text-sm text-navy underline",
				children: "Printable A4"
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mb-3 text-sm text-muted",
			children: [
				"Invoice serial-gap, GSTR-1 lite (B2B / CDNR / HSN Table 12), ITC-04 Tables 4 / 5A / 5B, e-way (Part B = validity start).",
				" ",
				empty ? "No live rows yet — showing seeded worksheet. Post journeys, then refresh." : "Live books."
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegistersView, { data: !live || empty ? FIX_REGISTERS : live })
	] });
}
//#endregion
export { RegistersPage as component };
