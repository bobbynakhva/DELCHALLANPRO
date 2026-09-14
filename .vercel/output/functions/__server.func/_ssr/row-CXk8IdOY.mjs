//#region node_modules/.nitro/vite/services/ssr/assets/row-CXk8IdOY.js
function uid(context) {
	const id = context?.userId;
	if (!id) throw new Error("Unauthorized");
	return id;
}
//#endregion
export { uid as t };
