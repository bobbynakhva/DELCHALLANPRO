import { r as createServerFn } from "./ssr.mjs";
import { n as authMiddleware } from "./format-Bcy9062O.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { _n as object, bn as string, dn as array, fn as boolean, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-planning-BRCqgLhR.js
var auth = [authMiddleware];
var previewQuote = createServerFn({ method: "GET" }).middleware(auth).validator(object({
	itemId: number(),
	asOf: string().optional(),
	basis: _enum(["CU_ZN_BLEND", "ALLOY_DEALER_RATE"]).optional(),
	marginPct: number().optional()
})).handler(createSsrRpc("8d2588cdb49a007ff3295aba730c1235a3d10f66e23b246d12c162797a8af033"));
var promiseSoLine = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	soLineId: number(),
	overrideDate: string().optional(),
	overrideReason: string().optional(),
	allocateLotId: number().optional()
})).handler(createSsrRpc("9e27f6e7b07154da3964f8fc8518ddeedf8816dab797e4991aad028d4f3ee9b9"));
var getAtp = createServerFn({ method: "GET" }).middleware(auth).validator(object({ soLineId: number() })).handler(createSsrRpc("43248dcfddce37e797ddb633de61f255995c538df6d2c3cca24152e86e73974d"));
var runMrp = createServerFn({ method: "POST" }).middleware(auth).validator(object({ horizonDays: number().default(14) })).handler(createSsrRpc("ca57eafea7aeccac3b05d7e28bf76b65d74a0b1502290d5cd168b343bedcf63a"));
var listMrp = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("e8f908e45e6a6778e63ce00cf40821621671360283d6f332bea70acc1734427a"));
var applyMrpDrafts = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	runId: number(),
	lineIds: array(number())
})).handler(createSsrRpc("c7e1b65b41698a557c55875ba5f1196e51c498c45c8a9788fa139479128edfdd"));
var variancePack = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	from: string(),
	to: string(),
	freeze: boolean().default(false)
})).handler(createSsrRpc("a9234d7214edfb4e0aafff6f2ee9a7e374b7e487fc77b81b602979cb3707d338"));
var getRoleBoard = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("e7f7c64dbd74e0393372c7f0a74eb92d4bc6c2ed7f90ef341822366009b9b567"));
var listJourneyRuns = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("db704aa60cd7c4b8e5b57ad19819ae4c8dbc8a8c76eb36a73481b0716194a5be"));
//#endregion
export { listMrp as a, runMrp as c, listJourneyRuns as i, variancePack as l, getAtp as n, previewQuote as o, getRoleBoard as r, promiseSoLine as s, applyMrpDrafts as t };
