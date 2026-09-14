import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { a as Route$3 } from "./router-Cx8Dk8pR.mjs";
import { t as PackingList } from "./packing-list-ByTRFP_f.mjs";
import { l as getPackingDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.packing._id-Ge8_zeWe.js
var import_jsx_runtime = require_jsx_runtime();
function PackingPrint() {
	const { id } = Route$3.useParams();
	const q = useQuery({
		queryKey: ["pldoc", id],
		queryFn: () => getPackingDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading packing list…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackingList, { doc: q.data });
}
//#endregion
export { PackingPrint as component };
