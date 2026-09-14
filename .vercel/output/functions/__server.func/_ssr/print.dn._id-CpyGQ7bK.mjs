import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { l as Route$7 } from "./router-Cx8Dk8pR.mjs";
import { t as CreditDebitNote } from "./credit-debit-note-D8eYZT9U.mjs";
import { c as getNoteDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.dn._id-CpyGQ7bK.js
var import_jsx_runtime = require_jsx_runtime();
function NotePrint() {
	const { id } = Route$7.useParams();
	const q = useQuery({
		queryKey: ["notedoc", id],
		queryFn: () => getNoteDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading note…"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditDebitNote, { doc: q.data });
}
//#endregion
export { NotePrint as component };
