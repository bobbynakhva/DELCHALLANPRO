import { r as createServerFn } from "./ssr.mjs";
import { n as authMiddleware } from "./format-Bcy9062O.mjs";
import { t as createSsrRpc } from "./createSsrRpc-B2Izd0c7.mjs";
import { _n as object, bn as string, fn as boolean, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-gst-Smktkco_.js
var auth = [authMiddleware];
var getGstSettings = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("5141443cf036fdfeeefcf262c3831b0abc4c29fadf03c500060fef5957158cc9"));
var saveGstSettings = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	legalName: string().min(2),
	tradeName: string().min(1),
	gstin: string().min(15).max(15),
	pan: string().optional(),
	cin: string().optional(),
	iec: string().optional(),
	lutArn: string().optional(),
	lutValidUntil: string().optional(),
	addressLine1: string().min(1),
	city: string().min(1),
	state: string().min(1),
	stateCode: string().min(2).max(2),
	pincode: string().min(4),
	registeredOffice: string().optional(),
	phone: string().optional(),
	email: string().optional(),
	authorisedSignatory: string().min(1),
	authorisedDesignation: string().min(1),
	composition: boolean(),
	turnoverAbove5Cr: boolean(),
	einvoiceApplicable: boolean(),
	b2cQr: boolean(),
	ewayThresholdPaise: number().min(0),
	msmeCreditDays: number().min(0),
	bankName: string().optional(),
	bankAccount: string().optional(),
	bankIfsc: string().optional()
})).handler(createSsrRpc("bfc1502c5d40e13fab266129e0c93f9b5b93a616b7fb566a221ee05d17914023"));
var getRegistersData = createServerFn({ method: "GET" }).middleware(auth).handler(createSsrRpc("5ebbe801097131ad0633e9029630fd45339bf0477ca5204df42fc3e49617439b"));
var deemedSupply = createServerFn({ method: "POST" }).middleware(auth).validator(object({ challanId: number() })).handler(createSsrRpc("9cd926b6330a80b1409eb57454dda19a1473e40df37b68e3e57124c9d12ef1af"));
var stubEway = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	docType: _enum(["CHALLAN", "INVOICE"]),
	docId: number(),
	reasonCode: string().default("3"),
	vehicle: string().optional(),
	distanceKm: number().min(0).default(18),
	force: boolean().default(false)
})).handler(createSsrRpc("4c4285ffc802ea41072516d52b19b1f37fd0e0f4857f62fe5197beb2d62519c7"));
var getInvoiceDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("6245eb22e8037e5425edb6c4bbd19105ba67828115658f2040b66567ecfadcdd"));
var getPackingDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("84c97292a1ae3e8fc1385799b2662705d4514b25c69c01469780cdaf9b9a7586"));
var getChallanDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("8d3af8cb2e529e0650078e486e91d9686447179cec7735cc2b9bf6bb0d534437"));
var getReturnDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("3bfc4f487c28179b253f1ac3f216296d8ffff454aa1bfcedcadb4ac9520a730e"));
var getGrnDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("c50b9f43dd054cef844790d995a64837d4603fc9fff34c317faff4057c4c1d93"));
var getQuoteDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("a73195673623ba6e6767d5365ced362606613d43ddc39fb1da03b8723b06339a"));
var getNoteDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("862507fbc466054c1d0401d8d746bb10451d6a8dad06a1ae68fa68d702aa6965"));
var getEwayDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(createSsrRpc("c660cb0a912b8e5128fbde8c21cc9bff5f18ee6ea1fdb7c854231dc3c4baac0f"));
var getCocDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ lotId: number() })).handler(createSsrRpc("952b4837378c0abc9df3587fc8ee1c3654f908496efe7b718e442fdc8a20de31"));
//#endregion
export { getGrnDoc as a, getNoteDoc as c, getRegistersData as d, getReturnDoc as f, getEwayDoc as i, getPackingDoc as l, stubEway as m, getChallanDoc as n, getGstSettings as o, saveGstSettings as p, getCocDoc as r, getInvoiceDoc as s, deemedSupply as t, getQuoteDoc as u };
