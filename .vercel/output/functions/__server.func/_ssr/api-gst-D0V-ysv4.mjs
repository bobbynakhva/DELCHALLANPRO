import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as todayISO, n as authMiddleware, o as n } from "./format-Bcy9062O.mjs";
import { a as nextDoc, i as erpSql, n as audit, o as requireStaff, t as assertPerm } from "./core.server-BOQw3eDO.mjs";
import { _n as object, bn as string, fn as boolean, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
import { t as uid } from "./row-CXk8IdOY.mjs";
import { a as loadDocSnapshot, c as mapEway, d as mapPackingList, f as mapQuote, l as mapGrnSlip, o as mapCoc, p as mapTaxInvoice, s as mapDeliveryChallan, t as companyFromRow, u as mapNote } from "./posting-bGpwTDUP.mjs";
import { n as EWAY_REASONS } from "./types-DdJ4U74k.mjs";
import { t as assertDocSerial } from "./serial-BYMeNAaS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-gst-D0V-ysv4.js
var auth = [authMiddleware];
var getGstSettings_createServerFn_handler = createServerRpc({
	id: "5141443cf036fdfeeefcf262c3831b0abc4c29fadf03c500060fef5957158cc9",
	name: "getGstSettings",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getGstSettings.__executeServer(opts));
var getGstSettings = createServerFn({ method: "GET" }).middleware(auth).handler(getGstSettings_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const company = (await sql.query(`select * from company limit 1`))[0];
	const series = await sql.query(`select * from number_series order by doc_type`);
	return {
		company: companyFromRow(company),
		raw: company,
		series
	};
});
var saveGstSettings_createServerFn_handler = createServerRpc({
	id: "bfc1502c5d40e13fab266129e0c93f9b5b93a616b7fb566a221ee05d17914023",
	name: "saveGstSettings",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => saveGstSettings.__executeServer(opts));
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
})).handler(saveGstSettings_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "invoice");
	const sql = await erpSql();
	const hsnDigits = data.turnoverAbove5Cr ? 6 : 4;
	await sql.query(`update company set
         name=$1, trade_name=$2, gstin=$3, pan=$4, cin=$5, iec=$6, lut_arn=$7, lut_valid_until=$8,
         address_line1=$9, city=$10, state=$11, state_code=$12, pincode=$13, registered_office=$14,
         phone=$15, email=$16, authorised_signatory=$17, authorised_designation=$18,
         composition=$19, turnover_above_5cr=$20, hsn_digits=$21, einvoice_applicable=$22, b2c_qr=$23,
         eway_threshold_paise=$24, msme_credit_days=$25, bank_name=$26, bank_account=$27, bank_ifsc=$28`, [
		data.legalName,
		data.tradeName,
		data.gstin.toUpperCase(),
		data.pan ?? null,
		data.cin ?? null,
		data.iec ?? null,
		data.lutArn ?? null,
		data.lutValidUntil || null,
		data.addressLine1,
		data.city,
		data.state,
		data.stateCode,
		data.pincode,
		data.registeredOffice ?? null,
		data.phone ?? null,
		data.email ?? null,
		data.authorisedSignatory,
		data.authorisedDesignation,
		data.composition,
		data.turnoverAbove5Cr,
		hsnDigits,
		data.einvoiceApplicable,
		data.b2cQr,
		data.ewayThresholdPaise,
		data.msmeCreditDays,
		data.bankName ?? null,
		data.bankAccount ?? null,
		data.bankIfsc ?? null
	]);
	await audit(sql, {
		userId: staff.user_id,
		action: "GST_SETTINGS",
		entity: "company",
		after: data
	});
	return {
		ok: true,
		hsnDigits
	};
});
var getRegistersData_createServerFn_handler = createServerRpc({
	id: "5ebbe801097131ad0633e9029630fd45339bf0477ca5204df42fc3e49617439b",
	name: "getRegistersData",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getRegistersData.__executeServer(opts));
var getRegistersData = createServerFn({ method: "GET" }).middleware(auth).handler(getRegistersData_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const company = companyFromRow((await sql.query(`select * from company limit 1`))[0]);
	const invoices = await sql.query(`select inv.doc_no, inv.invoice_date as date, p.gstin, p.name,
              inv.place_of_supply as place, inv.taxable_paise, inv.cgst_paise, inv.sgst_paise,
              inv.igst_paise, inv.total_paise,
              coalesce((select hsn from sales_invoice_line where invoice_id = inv.id limit 1),'') as hsn
         from sales_invoice inv join partner p on p.id = inv.partner_id
        order by inv.doc_no`);
	const notes = await sql.query(`select n.kind, n.doc_no, n.note_date as date, n.original_invoice_no as original_no,
              p.gstin, n.taxable_paise, n.cgst_paise, n.sgst_paise, n.igst_paise
         from credit_debit_note n
         left join partner p on p.id = n.partner_id
        order by n.doc_no`);
	const challans = await sql.query(`select c.doc_no, c.issued_at as date, p.name as partner, p.gstin,
              coalesce((select hsn from job_work_challan_line where challan_id = c.id limit 1),'741220') as hsn,
              coalesce((select sum(qty_pcs) from job_work_challan_line where challan_id = c.id),0) as qty_nos,
              coalesce((select sum(qty_kg) from job_work_challan_line where challan_id = c.id),0) as qty_kgs,
              c.statutory_due as due, c.status,
              coalesce((select sum(good_pcs) from job_work_return where challan_id = c.id),0) as received_nos,
              coalesce((select sum(short_pcs) from job_work_return where challan_id = c.id),0) as loss_nos
         from job_work_challan c join partner p on p.id = c.partner_id
        order by c.issued_at`);
	const eways = await sql.query(`select stub_no, doc_no, doc_date as date, value_paise, part_b_at, vehicle,
              coalesce(reason_label, reason_code) as reason
         from eway_bill order by id`);
	return {
		company,
		invoices: invoices.map((r) => ({
			docNo: String(r.doc_no),
			date: String(r.date),
			gstin: r.gstin ? String(r.gstin) : null,
			name: String(r.name),
			place: String(r.place ?? ""),
			taxablePaise: n(r.taxable_paise),
			cgstPaise: n(r.cgst_paise),
			sgstPaise: n(r.sgst_paise),
			igstPaise: n(r.igst_paise),
			totalPaise: n(r.total_paise),
			hsn: String(r.hsn ?? "")
		})),
		notes: notes.map((r) => ({
			kind: r.kind === "DN" ? "DN" : "CN",
			docNo: String(r.doc_no),
			date: String(r.date),
			originalNo: String(r.original_no),
			gstin: r.gstin ? String(r.gstin) : null,
			taxablePaise: n(r.taxable_paise),
			cgstPaise: n(r.cgst_paise),
			sgstPaise: n(r.sgst_paise),
			igstPaise: n(r.igst_paise)
		})),
		challans: challans.map((r) => ({
			docNo: String(r.doc_no),
			date: String(r.date),
			partner: String(r.partner),
			gstin: r.gstin ? String(r.gstin) : null,
			hsn: String(r.hsn),
			qtyNos: n(r.qty_nos),
			qtyKgs: n(r.qty_kgs),
			due: String(r.due),
			status: String(r.status),
			receivedNos: n(r.received_nos),
			lossNos: n(r.loss_nos)
		})),
		eways: eways.map((r) => ({
			stubNo: String(r.stub_no),
			docNo: String(r.doc_no ?? ""),
			date: String(r.date ?? ""),
			valuePaise: n(r.value_paise),
			partBAt: r.part_b_at ? String(r.part_b_at) : null,
			vehicle: String(r.vehicle ?? ""),
			reason: String(r.reason ?? "")
		}))
	};
});
var deemedSupply_createServerFn_handler = createServerRpc({
	id: "9cd926b6330a80b1409eb57454dda19a1473e40df37b68e3e57124c9d12ef1af",
	name: "deemedSupply",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => deemedSupply.__executeServer(opts));
var deemedSupply = createServerFn({ method: "POST" }).middleware(auth).validator(object({ challanId: number() })).handler(deemedSupply_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "invoice");
	const sql = await erpSql();
	const existing = (await sql.query(`select id, invoice_id, status from deemed_supply where challan_id = $1`, [data.challanId]))[0];
	if (existing?.invoice_id) {
		const inv = (await sql.query(`select doc_no, status from sales_invoice where id = $1`, [existing.invoice_id]))[0];
		return {
			invoiceId: existing.invoice_id,
			docNo: inv?.doc_no,
			status: inv?.status ?? "DRAFT",
			already: true
		};
	}
	const ch = (await sql.query(`select c.*, p.name as partner_name, p.state_code as partner_state_code
           from job_work_challan c join partner p on p.id = c.partner_id where c.id = $1`, [data.challanId]))[0];
	if (!ch) throw new Error("Challan not found");
	const lines = await sql.query(`select l.*, i.sku, i.name as item_name, i.hsn as item_hsn
         from job_work_challan_line l join item i on i.id = l.item_id where l.challan_id = $1`, [data.challanId]);
	const taxable = lines.reduce((s, l) => s + Math.round(n(l.qty_pcs) * 2107), 0);
	const tax = Math.round(taxable * .18);
	const half = Math.round(tax / 2);
	const intra = str(ch.partner_state_code) === "24";
	const docNo = assertDocSerial(await nextDoc(sql, "INV"));
	const invoiceDate = String(ch.issued_at).slice(0, 10);
	const inv = (await sql.query(`insert into sales_invoice (
           doc_no, partner_id, invoice_date, place_of_supply, is_export,
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, net_kg, status, created_by
         ) values ($1,$2,$3,$4,false,$5,$6,$7,$8,$9,$10,'DRAFT',$11) returning id`, [
		docNo,
		ch.partner_id,
		invoiceDate,
		intra ? "24-Gujarat" : `${ch.partner_state_code}`,
		taxable,
		intra ? half : 0,
		intra ? tax - half : 0,
		intra ? 0 : tax,
		taxable + tax,
		lines.reduce((s, l) => s + n(l.qty_kg), 0),
		staff.user_id
	]))[0];
	for (const l of lines) {
		const lineTaxable = Math.round(n(l.qty_pcs) * 2107);
		const lineTax = Math.round(lineTaxable * .18);
		const h = Math.round(lineTax / 2);
		await sql.query(`insert into sales_invoice_line (
           invoice_id, item_id, lot_id, hsn, qty_pcs, qty_kg, unit_price_paise, taxable_paise,
           gst_pct, cgst_paise, sgst_paise, igst_paise
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,18,$9,$10,$11)`, [
			inv.id,
			l.item_id,
			l.lot_id,
			l.hsn ?? l.item_hsn ?? "741220",
			l.qty_pcs,
			l.qty_kg,
			2107,
			lineTaxable,
			intra ? h : 0,
			intra ? lineTax - h : 0,
			intra ? 0 : lineTax
		]);
	}
	await sql.query(`insert into deemed_supply (challan_id, invoice_id, invoice_date, status, created_by)
       values ($1,$2,$3,'DRAFT',$4)`, [
		data.challanId,
		inv.id,
		invoiceDate,
		staff.user_id
	]);
	await audit(sql, {
		userId: staff.user_id,
		action: "DEEMED_SUPPLY_DRAFT",
		entity: "sales_invoice",
		entityId: inv.id,
		after: {
			challan: ch.doc_no,
			invoice: docNo,
			date: invoiceDate
		}
	});
	return {
		invoiceId: inv.id,
		docNo,
		status: "DRAFT",
		already: false
	};
});
var stubEway_createServerFn_handler = createServerRpc({
	id: "4c4285ffc802ea41072516d52b19b1f37fd0e0f4857f62fe5197beb2d62519c7",
	name: "stubEway",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => stubEway.__executeServer(opts));
var stubEway = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	docType: _enum(["CHALLAN", "INVOICE"]),
	docId: number(),
	reasonCode: string().default("3"),
	vehicle: string().optional(),
	distanceKm: number().min(0).default(18),
	force: boolean().default(false)
})).handler(stubEway_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "invoice");
	const sql = await erpSql();
	const company = (await sql.query(`select * from company limit 1`))[0];
	const threshold = n(company.eway_threshold_paise) || 5e6;
	let docNo = "";
	let docDate = todayISO();
	let recipientGstin = "URP";
	let pin = "";
	let valuePaise = 0;
	let hsn = "741220";
	if (data.docType === "CHALLAN") {
		const ch = (await sql.query(`select c.*, p.gstin, p.pincode from job_work_challan c join partner p on p.id = c.partner_id where c.id = $1`, [data.docId]))[0];
		if (!ch) throw new Error("Challan not found");
		const ln = (await sql.query(`select hsn, qty_pcs, qty_kg from job_work_challan_line where challan_id = $1`, [data.docId]))[0];
		docNo = String(ch.doc_no);
		docDate = String(ch.issued_at).slice(0, 10);
		recipientGstin = String(ch.gstin ?? "URP");
		pin = String(ch.pincode ?? "");
		valuePaise = Math.round(n(ln?.qty_pcs) * 2107);
		hsn = String(ln?.hsn ?? "741220");
	} else {
		const inv = (await sql.query(`select inv.*, p.gstin, p.pincode from sales_invoice inv join partner p on p.id = inv.partner_id where inv.id = $1`, [data.docId]))[0];
		if (!inv) throw new Error("Invoice not found");
		const ln = (await sql.query(`select hsn from sales_invoice_line where invoice_id = $1 limit 1`, [data.docId]))[0];
		docNo = String(inv.doc_no);
		docDate = String(inv.invoice_date).slice(0, 10);
		recipientGstin = String(inv.gstin ?? "URP");
		pin = String(inv.pincode ?? "");
		valuePaise = n(inv.total_paise);
		hsn = String(ln?.hsn ?? "741220");
	}
	if (valuePaise < threshold && data.reasonCode !== "3" && !data.force) throw new Error(`Value ${valuePaise} paise is below e-way threshold. Force-generate or use Job Work reason 3.`);
	const skip = data.distanceKm <= 50 && !data.vehicle;
	const stubNo = assertDocSerial(await nextDoc(sql, "EWB"));
	const row = (await sql.query(`insert into eway_bill (
           stub_no, doc_type, doc_id, doc_no, doc_date, recipient_gstin, delivery_pin, value_paise, hsn,
           reason_code, reason_label, document_type, bill_to_gstin, ship_to_gstin, vehicle, mode,
           distance_km, skipped_vehicle, part_b_at, nic_signed, created_by
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$6,$6,$13,'Road',$14,$15, now(), false, $16)
         returning id`, [
		stubNo,
		data.docType,
		data.docId,
		docNo,
		docDate,
		recipientGstin,
		pin,
		valuePaise,
		hsn,
		data.reasonCode,
		EWAY_REASONS[data.reasonCode] ?? "Others",
		data.docType === "CHALLAN" ? "Delivery Challan" : "Invoice",
		skip ? "" : data.vehicle ?? "",
		data.distanceKm,
		skip,
		staff.user_id
	]))[0];
	if (data.docType === "CHALLAN") await sql.query(`update job_work_challan set eway_no = $1 where id = $2`, [stubNo, data.docId]);
	else await sql.query(`update sales_invoice set eway_no = $1 where id = $2`, [stubNo, data.docId]);
	return {
		id: row.id,
		stubNo,
		nicSigned: false
	};
});
var getInvoiceDoc_createServerFn_handler = createServerRpc({
	id: "6245eb22e8037e5425edb6c4bbd19105ba67828115658f2040b66567ecfadcdd",
	name: "getInvoiceDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getInvoiceDoc.__executeServer(opts));
var getInvoiceDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getInvoiceDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const snap = await loadDocSnapshot(sql, "sales_invoice", data.id);
	if (snap?.docNo) return snap;
	const packed = await loadInvoice(sql, data.id);
	return mapTaxInvoice(packed);
});
var getPackingDoc_createServerFn_handler = createServerRpc({
	id: "84c97292a1ae3e8fc1385799b2662705d4514b25c69c01469780cdaf9b9a7586",
	name: "getPackingDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getPackingDoc.__executeServer(opts));
var getPackingDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getPackingDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const packed = await loadInvoice(sql, data.id);
	if (!packed.packing) throw new Error("No packing list for this invoice");
	const snap = await loadDocSnapshot(sql, "packing_list", packed.packing.id);
	if (snap?.docNo) return snap;
	return mapPackingList({
		company: packed.company,
		invoice: packed.invoice,
		packing: packed.packing,
		packingLines: packed.packingLines
	});
});
var getChallanDoc_createServerFn_handler = createServerRpc({
	id: "8d3af8cb2e529e0650078e486e91d9686447179cec7735cc2b9bf6bb0d534437",
	name: "getChallanDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getChallanDoc.__executeServer(opts));
var getChallanDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getChallanDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const snap = await loadDocSnapshot(sql, "job_work_challan", data.id);
	if (snap?.docNo) return snap;
	return mapDeliveryChallan(await loadChallan(sql, data.id));
});
var getReturnDoc_createServerFn_handler = createServerRpc({
	id: "3bfc4f487c28179b253f1ac3f216296d8ffff454aa1bfcedcadb4ac9520a730e",
	name: "getReturnDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getReturnDoc.__executeServer(opts));
var getReturnDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getReturnDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const snap = await loadDocSnapshot(sql, "job_work_return", data.id);
	if (snap?.docNo) return snap;
	const ret = (await sql.query(`select * from job_work_return where id = $1`, [data.id]))[0];
	if (!ret) throw new Error("Return not found");
	const base = await loadChallan(sql, n(ret.challan_id));
	return mapDeliveryChallan({
		...base,
		variant: "JW_RETURN",
		ret
	});
});
var getGrnDoc_createServerFn_handler = createServerRpc({
	id: "c50b9f43dd054cef844790d995a64837d4603fc9fff34c317faff4057c4c1d93",
	name: "getGrnDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getGrnDoc.__executeServer(opts));
var getGrnDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getGrnDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const snap = await loadDocSnapshot(sql, "grn", data.id);
	if (snap?.docNo) return snap;
	const company = (await sql.query(`select * from company limit 1`))[0];
	const grn = (await sql.query(`select g.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
                p.pincode, p.country as partner_country
           from grn g join partner p on p.id = g.partner_id where g.id = $1`, [data.id]))[0];
	if (!grn) throw new Error("GRN not found");
	const line = (await sql.query(`select l.*, i.sku, a.code as alloy, sl.status as lot_status
           from grn_line l
           join item i on i.id = l.item_id
           left join alloy a on a.id = i.alloy_id
           left join stock_lot sl on sl.id = l.lot_id
          where l.grn_id = $1
          order by l.id limit 1`, [data.id]))[0];
	if (!line) throw new Error("GRN has no lines");
	return mapGrnSlip({
		company,
		grn,
		line
	});
});
var getQuoteDoc_createServerFn_handler = createServerRpc({
	id: "a73195673623ba6e6767d5365ced362606613d43ddc39fb1da03b8723b06339a",
	name: "getQuoteDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getQuoteDoc.__executeServer(opts));
var getQuoteDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getQuoteDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const company = (await sql.query(`select * from company limit 1`))[0];
	const quote = (await sql.query(`select q.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
                p.pincode, p.country as partner_country, p.pan
           from quotation q join partner p on p.id = q.partner_id where q.id = $1`, [data.id]))[0];
	if (!quote) throw new Error("Quote not found");
	const lines = await sql.query(`select l.*, i.sku, i.name as item_name from quotation_line l join item i on i.id = l.item_id where l.quotation_id = $1`, [data.id]);
	return mapQuote({
		company,
		quote,
		lines
	});
});
var getNoteDoc_createServerFn_handler = createServerRpc({
	id: "862507fbc466054c1d0401d8d746bb10451d6a8dad06a1ae68fa68d702aa6965",
	name: "getNoteDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getNoteDoc.__executeServer(opts));
var getNoteDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getNoteDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const company = (await sql.query(`select * from company limit 1`))[0];
	const note = (await sql.query(`select n.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
                p.pincode, p.country as partner_country
           from credit_debit_note n
           left join partner p on p.id = n.partner_id
          where n.id = $1`, [data.id]))[0];
	if (!note) throw new Error("Note not found");
	const lines = await sql.query(`select * from credit_debit_note_line where note_id = $1`, [data.id]);
	return mapNote({
		company,
		note,
		lines
	});
});
var getEwayDoc_createServerFn_handler = createServerRpc({
	id: "c660cb0a912b8e5128fbde8c21cc9bff5f18ee6ea1fdb7c854231dc3c4baac0f",
	name: "getEwayDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getEwayDoc.__executeServer(opts));
var getEwayDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ id: number() })).handler(getEwayDoc_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const company = (await sql.query(`select * from company limit 1`))[0];
	const eway = (await sql.query(`select * from eway_bill where id = $1`, [data.id]))[0];
	if (!eway) throw new Error("e-way not found");
	return mapEway({
		company,
		eway
	});
});
var getCocDoc_createServerFn_handler = createServerRpc({
	id: "952b4837378c0abc9df3587fc8ee1c3654f908496efe7b718e442fdc8a20de31",
	name: "getCocDoc",
	filename: "src/lib/erp/api-gst.ts"
}, (opts) => getCocDoc.__executeServer(opts));
var getCocDoc = createServerFn({ method: "GET" }).middleware(auth).validator(object({ lotId: number() })).handler(getCocDoc_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	const sql = await erpSql();
	const company = (await sql.query(`select * from company limit 1`))[0];
	const lot = (await sql.query(`select l.*, i.sku, i.name as item_name, i.drawing_no, i.drawing_rev,
                a.code as alloy, a.cu_pct, a.zn_pct, a.pb_pct
           from stock_lot l
           join item i on i.id = l.item_id
           left join alloy a on a.id = l.alloy_id
          where l.id = $1`, [data.lotId]))[0];
	if (!lot) throw new Error("Lot not found");
	const existing = (await sql.query(`select * from certificate_of_conformance where lot_id = $1 order by id desc limit 1`, [data.lotId]))[0];
	if (existing) return mapCoc({
		company,
		coc: {
			...existing,
			partner_name: "Gujarat Sanitary",
			partner_gstin: "24AAGCG5520F1Z6",
			partner_addr: "Narol-Naroda Highway",
			partner_city: "Ahmedabad",
			partner_state: "Gujarat",
			partner_state_code: "24",
			pincode: "382405",
			partner_country: "IN"
		}
	});
	const docNo = assertDocSerial(await nextDoc(sql, "COC"));
	const alloySpec = lot.alloy ? `${lot.alloy} — Cu ${lot.cu_pct}% Zn ${lot.zn_pct}% Pb ${lot.pb_pct}%` : "As specified";
	await sql.query(`insert into certificate_of_conformance (
         doc_no, doc_date, lot_id, sku, description, alloy_spec, drawing_no, drawing_rev,
         lot_no, heat_no, qty_nos, qty_kgs, qa_signatory, created_by
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
		docNo,
		todayISO(),
		data.lotId,
		lot.sku,
		lot.item_name,
		alloySpec,
		lot.drawing_no,
		lot.drawing_rev,
		lot.lot_no,
		lot.heat_no,
		lot.qty_pcs,
		lot.qty_kg,
		"Anjali Trivedi, QC",
		staff.user_id
	]);
	return mapCoc({
		company,
		coc: {
			doc_no: docNo,
			doc_date: todayISO(),
			sku: lot.sku,
			description: lot.item_name,
			alloy_spec: alloySpec,
			drawing_no: lot.drawing_no,
			drawing_rev: lot.drawing_rev,
			lot_no: lot.lot_no,
			heat_no: lot.heat_no,
			qty_nos: lot.qty_pcs,
			qty_kgs: lot.qty_kg,
			qa_signatory: "Anjali Trivedi, QC",
			partner_name: "Gujarat Sanitary",
			partner_gstin: "24AAGCG5520F1Z6",
			partner_addr: "Narol-Naroda Highway",
			partner_city: "Ahmedabad",
			partner_state: "Gujarat",
			partner_state_code: "24",
			pincode: "382405",
			partner_country: "IN"
		}
	});
});
async function loadInvoice(sql, id) {
	const company = (await sql.query(`select * from company limit 1`))[0];
	const invoice = (await sql.query(`select inv.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
              p.city as partner_city, p.state as partner_state, p.country as partner_country,
              p.state_code as partner_state_code, p.pan, p.pincode, so.doc_no as so_no
         from sales_invoice inv
         join partner p on p.id = inv.partner_id
         left join sales_order so on so.id = inv.so_id
        where inv.id = $1`, [id]))[0];
	if (!invoice) throw new Error("Invoice not found");
	const lines = await sql.query(`select l.*, i.sku, i.name as item_name, sl.lot_no, sl.heat_no
       from sales_invoice_line l
       join item i on i.id = l.item_id
       left join stock_lot sl on sl.id = l.lot_id
      where l.invoice_id = $1`, [id]);
	const packing = (await sql.query(`select * from packing_list where invoice_id = $1`, [id]))[0] ?? null;
	return {
		company,
		invoice,
		lines,
		packing,
		packingLines: packing ? await sql.query(`select pl.*, i.sku, i.name as item_name, sl.lot_no, sl.heat_no
           from packing_list_line pl
           join item i on i.id = pl.item_id
           left join stock_lot sl on sl.id = pl.lot_id
          where pl.packing_list_id = $1 order by pl.id`, [packing.id]) : []
	};
}
async function loadChallan(sql, id) {
	const company = (await sql.query(`select * from company limit 1`))[0];
	const challan = (await sql.query(`select c.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
              p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
              p.pincode, p.country as partner_country,
              floor(extract(epoch from (now() - c.issued_at)) / 86400)::int as age_days
         from job_work_challan c join partner p on p.id = c.partner_id where c.id = $1`, [id]))[0];
	if (!challan) throw new Error("Challan not found");
	return {
		company,
		challan,
		lines: await sql.query(`select l.*, i.sku, i.name as item_name, sl.lot_no, sl.heat_no
       from job_work_challan_line l
       join item i on i.id = l.item_id
       left join stock_lot sl on sl.id = coalesce(l.jw_lot_id, l.lot_id)
      where l.challan_id = $1`, [id])
	};
}
function str(v) {
	return v == null ? "" : String(v);
}
//#endregion
export { deemedSupply_createServerFn_handler, getChallanDoc_createServerFn_handler, getCocDoc_createServerFn_handler, getEwayDoc_createServerFn_handler, getGrnDoc_createServerFn_handler, getGstSettings_createServerFn_handler, getInvoiceDoc_createServerFn_handler, getNoteDoc_createServerFn_handler, getPackingDoc_createServerFn_handler, getQuoteDoc_createServerFn_handler, getRegistersData_createServerFn_handler, getReturnDoc_createServerFn_handler, saveGstSettings_createServerFn_handler, stubEway_createServerFn_handler };
