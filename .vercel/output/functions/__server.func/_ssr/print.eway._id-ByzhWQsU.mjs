import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { c as Route$6 } from "./router-Cx8Dk8pR.mjs";
import { t as EwayForm } from "./eway-CE4VMDiL.mjs";
import { i as getEwayDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.eway._id-ByzhWQsU.js
var import_jsx_runtime = require_jsx_runtime();
function EwayPrint() {
	const { id } = Route$6.useParams();
	const q = useQuery({
		queryKey: ["ewbdoc", id],
		queryFn: () => getEwayDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading e-way…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EwayForm, { doc: q.data });
}
//#endregion
export { EwayPrint as component };
