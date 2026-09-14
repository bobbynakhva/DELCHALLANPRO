import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { s as Route$5 } from "./router-Cx8Dk8pR.mjs";
import { t as GrnSlip } from "./grn-slip-uqKUVmje.mjs";
import { a as getGrnDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.grn._id-unIQGREo.js
var import_jsx_runtime = require_jsx_runtime();
function GrnPrint() {
	const { id } = Route$5.useParams();
	const q = useQuery({
		queryKey: ["grndoc", id],
		queryFn: () => getGrnDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading GRN…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GrnSlip, { doc: q.data });
}
//#endregion
export { GrnPrint as component };
