import { Cn as _coercedNumber, Sn as _coercedBoolean, cn as ZodString, on as ZodBoolean, sn as ZodNumber, wn as _coercedString } from "./@better-auth/core+[...].mjs";
//#region node_modules/zod/v4/classic/coerce.js
function string(params) {
	return _coercedString(ZodString, params);
}
function number(params) {
	return _coercedNumber(ZodNumber, params);
}
function boolean(params) {
	return _coercedBoolean(ZodBoolean, params);
}
//#endregion
export { number as n, string as r, boolean as t };
