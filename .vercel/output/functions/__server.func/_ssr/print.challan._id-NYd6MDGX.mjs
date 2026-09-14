import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { f as Route$10 } from "./router-Cx8Dk8pR.mjs";
import { t as DeliveryChallan } from "./delivery-challan-Cvbm9s6l.mjs";
import { n as getChallanDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.challan._id-NYd6MDGX.js
var import_jsx_runtime = require_jsx_runtime();
function ChallanPrint() {
	const { id } = Route$10.useParams();
	const q = useQuery({
		queryKey: ["chdoc", id],
		queryFn: () => getChallanDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading job-work challan…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryChallan, { doc: q.data });
}
//#endregion
export { ChallanPrint as component };
