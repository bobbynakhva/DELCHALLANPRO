import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { i as GstinLine } from "./signature-block-VVZRWvAz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/party-block-ChEQtNj-.js
var import_jsx_runtime = require_jsx_runtime();
function PartyBlock({ label, party }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-[9px] font-semibold uppercase tracking-wide",
			children: label
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "font-semibold",
			children: party.name
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: party.addressLine1 }),
		party.addressLine2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: party.addressLine2 }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			party.city,
			", ",
			party.state,
			" ",
			party.pincode,
			party.country && party.country !== "IN" ? ` · ${party.country}` : ""
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GstinLine, {
			gstin: party.gstin,
			stateCode: party.stateCode,
			stateName: party.state,
			unregistered: !party.registered
		}),
		party.pan ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["PAN ", party.pan] }) : null
	] });
}
//#endregion
export { PartyBlock as t };
