import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { r as Route$1 } from "./router-Cx8Dk8pR.mjs";
import { t as DeliveryChallan } from "./delivery-challan-Cvbm9s6l.mjs";
import { f as getReturnDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.return._id-B7XTn2LT.js
var import_jsx_runtime = require_jsx_runtime();
function ReturnPrint() {
	const { id } = Route$1.useParams();
	const q = useQuery({
		queryKey: ["retdoc", id],
		queryFn: () => getReturnDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading return challan…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryChallan, { doc: q.data });
}
//#endregion
export { ReturnPrint as component };
