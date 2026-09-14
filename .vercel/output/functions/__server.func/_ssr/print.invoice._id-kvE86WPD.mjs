import { a as require_jsx_runtime, n as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { o as Route$4 } from "./router-Cx8Dk8pR.mjs";
import { n as TaxInvoice, t as BillOfSupply } from "./tax-invoice-EVnoLZpe.mjs";
import { s as getInvoiceDoc } from "./api-gst-Smktkco_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/print.invoice._id-kvE86WPD.js
var import_jsx_runtime = require_jsx_runtime();
function InvoicePrint() {
	const { id } = Route$4.useParams();
	const q = useQuery({
		queryKey: ["invdoc", id],
		queryFn: () => getInvoiceDoc({ data: { id: Number(id) } })
	});
	if (q.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-danger",
		children: q.error.message
	});
	if (!q.data) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "p-8 text-muted",
		children: "Loading tax invoice…"
	});
	const doc = q.data;
	if (doc.company.composition) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillOfSupply, { doc: {
		title: "BILL OF SUPPLY",
		docNo: doc.docNo,
		docDate: doc.docDate,
		company: doc.company,
		billTo: doc.billTo,
		lines: doc.lines.map((l) => ({
			sl: l.sl,
			description: l.description,
			hsn: l.hsn,
			qtyNos: l.qtyNos,
			qtyKgs: l.qtyKgs,
			amountPaise: l.taxablePaise
		})),
		totalPaise: doc.taxablePaise
	} });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxInvoice, { doc });
}
//#endregion
export { InvoicePrint as component };
