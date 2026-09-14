import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { _ as FIX_SERIAL_BLOCK, a as FIX_CN, c as FIX_DN, d as FIX_EXPORT_LUT, f as FIX_GRN, g as FIX_QUOTE, h as FIX_PACKING, i as FIX_CHALLAN_RETURN, l as FIX_EWAY, m as FIX_INVOICE_MH, n as FIX_BOS, o as FIX_COC, p as FIX_INVOICE_GJ, r as FIX_CHALLAN_OUT, s as FIX_CONVERSION, u as FIX_EXPORT_IGST } from "./fixtures-BgLpXt_G.mjs";
import { p as Route$11 } from "./router-Cx8Dk8pR.mjs";
import { n as TaxInvoice, t as BillOfSupply } from "./tax-invoice-EVnoLZpe.mjs";
import { t as CertificateOfConformance } from "./coc-RuLYnP-a.mjs";
import { t as CreditDebitNote } from "./credit-debit-note-D8eYZT9U.mjs";
import { t as DeliveryChallan } from "./delivery-challan-Cvbm9s6l.mjs";
import { t as EwayForm } from "./eway-CE4VMDiL.mjs";
import { t as GrnSlip } from "./grn-slip-uqKUVmje.mjs";
import { t as PackingList } from "./packing-list-ByTRFP_f.mjs";
import { t as QuotationDocView } from "./quotation-BFtRz4Wu.mjs";
import { n as RegistersView } from "./registers-ByhVej0g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/dev.docs._slug-Sd5jEnwd.js
var import_jsx_runtime = require_jsx_runtime();
/** CGST Act s.31 · Rule 46 service tax invoice. SAC 9988 manufacturing services on physical inputs owned by others. */
function ConversionInvoice({ doc }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxInvoice, {
		doc,
		citation: "CGST Act s.31 · Rule 46 (service) · SAC 9988"
	});
}
function GstDocPreview({ slug }) {
	switch (slug) {
		case "invoice": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxInvoice, { doc: FIX_INVOICE_GJ });
		case "invoice-mh": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxInvoice, { doc: FIX_INVOICE_MH });
		case "export-lut": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxInvoice, { doc: FIX_EXPORT_LUT });
		case "export-igst": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxInvoice, { doc: FIX_EXPORT_IGST });
		case "challan": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryChallan, { doc: FIX_CHALLAN_OUT });
		case "challan-return": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryChallan, { doc: FIX_CHALLAN_RETURN });
		case "eway": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EwayForm, { doc: FIX_EWAY });
		case "cn": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditDebitNote, { doc: FIX_CN });
		case "dn": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditDebitNote, { doc: FIX_DN });
		case "packing": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackingList, { doc: FIX_PACKING });
		case "grn": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GrnSlip, { doc: FIX_GRN });
		case "coc": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CertificateOfConformance, { doc: FIX_COC });
		case "quote": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuotationDocView, { doc: FIX_QUOTE });
		case "conversion": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConversionInvoice, { doc: FIX_CONVERSION });
		case "bos": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BillOfSupply, { doc: FIX_BOS });
		case "registers": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RegistersView, {});
		case "serial-block": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TaxInvoice, { doc: FIX_SERIAL_BLOCK });
		default: return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-8 text-sm text-muted",
			children: [
				"Unknown document ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono",
					children: slug
				}),
				"."
			]
		});
	}
}
function DocPreview() {
	const { slug } = Route$11.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "no-print px-3 pt-2 text-micro",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: "/dev/docs",
			className: "text-navy underline",
			children: "All GST documents"
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GstDocPreview, { slug })] });
}
//#endregion
export { DocPreview as component };
