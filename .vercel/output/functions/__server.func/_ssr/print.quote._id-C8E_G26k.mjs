import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { i as Route$2 } from "./router-Cx8Dk8pR.mjs";
import { t as QuotationDocView } from "./quotation-BFtRz4Wu.mjs";
import { u as getQuoteDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.quote._id-C8E_G26k.js
var import_jsx_runtime = require_jsx_runtime();
function QuotePrint() {
	const { id } = Route$2.useParams();
	const q = useQuery({
		queryKey: ["qtdoc", id],
		queryFn: () => getQuoteDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading quotation…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuotationDocView, { doc: q.data });
}
//#endregion
export { QuotePrint as component };
