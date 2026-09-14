import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { u as Route$8 } from "./router-Cx8Dk8pR.mjs";
import { t as CertificateOfConformance } from "./coc-RuLYnP-a.mjs";
import { r as getCocDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.coc._id-CMF0PNsf.js
var import_jsx_runtime = require_jsx_runtime();
function CocPrint() {
	const { id } = Route$8.useParams();
	const q = useQuery({
		queryKey: ["cocdoc", id],
		queryFn: () => getCocDoc({ data: { lotId: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading CoC…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CertificateOfConformance, { doc: q.data });
}
//#endregion
export { CocPrint as component };
