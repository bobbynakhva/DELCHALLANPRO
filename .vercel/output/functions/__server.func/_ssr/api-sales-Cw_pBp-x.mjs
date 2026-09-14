import { r as createServerFn } from "./ssr.mjs";
import { n as authMiddleware } from "./format-Bcy9062O.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { _n as object, bn as string, fn as boolean, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-sales-Cw_pBp-x.js
var postMetalPrice = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	asOfDate: string(),
	cuPaisePerKg: number().positive(),
	znPaisePerKg: number().positive(),
	pbPaisePerKg: number().min(0).default(0),
	scrapPaisePerKg: number().min(0).optional(),
	source: _enum([
		"MCX",
		"dealer",
		"manual"
	]).default("manual")
})).handler(createSsrRpc("35937a08b111be15a5498cd7c1c2bcc7d3fe12f8db137e17e03d830ab22243dc"));
var createQuote = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	partnerId: number(),
	itemId: number(),
	qtyPcs: number().positive(),
	asOf: string().optional(),
	basis: _enum(["CU_ZN_BLEND", "ALLOY_DEALER_RATE"]).optional(),
	marginPct: number().optional()
})).handler(createSsrRpc("76868e72300ce7dec937f4e7eaa705d40e5988e70d71c60e810c073266bd79b3"));
var dispatchSo = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	soId: number(),
	lotId: number(),
	qtyPcs: number().positive(),
	ownerOverride: boolean().optional()
})).handler(createSsrRpc("4dd10a699140097f4a61baf18f156e63db4ce533876ed286d307ed05c011eb31"));
var stubIrn = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ invoiceId: number() })).handler(createSsrRpc("732193793be65bc9b107692270618b22cdb00d22efd19195a6465f21794a006c"));
createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ id: number() })).handler(createSsrRpc("7cc5de95ac8a589183234fab92b2d902eca86440f1285b5b9d48c89e7994ab89"));
var createNcr = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	lotId: number().optional(),
	itemId: number().optional(),
	source: string().default("MANUAL"),
	description: string().min(3)
})).handler(createSsrRpc("f7c52d51f8cf5fc4c5f8fbb44d261b83ecba85ddcec596ad50bf740503d34fc3"));
var createMelt = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	alloyId: number(),
	lotId: number(),
	qtyKg: number().positive(),
	furnace: string().default("MELT-1")
})).handler(createSsrRpc("a47652dda0e39c82658d5b500b2ee6cc463388d60a25b3d817571b8646c20d42"));
var postSpectro = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	meltId: number(),
	cuPct: number(),
	znPct: number(),
	pbPct: number()
})).handler(createSsrRpc("5bb0133ef63a25d3c9dd746c7b9bdd5e207ed25fa787fb129920dcdf2e8f582f"));
var approveBom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({ bomId: number() })).handler(createSsrRpc("0c323c806d445d2d3b1cf02ad7c66bb0929eaa2633a3e8e195e5363ce9a97c1c"));
//#endregion
export { dispatchSo as a, stubIrn as c, createQuote as i, createMelt as n, postMetalPrice as o, createNcr as r, postSpectro as s, approveBom as t };
