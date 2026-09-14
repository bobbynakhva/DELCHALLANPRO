import { a as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { m as GenealogyView, n as Route } from "./router-Cx8Dk8pR.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stock.lots._lotId.genealogy-aTSf6qmP.js
var import_jsx_runtime = require_jsx_runtime();
function StockGenePage() {
	const { lotId } = Route.useParams();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GenealogyView, { lotId });
}
//#endregion
export { StockGenePage as component };
