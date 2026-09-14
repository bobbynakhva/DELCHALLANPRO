import { c as todayISO, o as n, s as roundKg } from "./format-Bcy9062O.mjs";
import { a as nextDoc, n as audit } from "./core.server-BOQw3eDO.mjs";
import { a as journalFromMove, t as assertPeriodAllows } from "./journal-CdeDVFjA.mjs";
import { a as statutoryDueIso, t as addDaysIso } from "./dates-BQYs1Vuz.mjs";
import { a as lineTotalPaise, i as gstBreakupForKind, o as roundOffToRupee, t as classifySupply } from "./tax-TUTmm3iB.mjs";
import { v as TAMBA } from "./fixtures-BgLpXt_G.mjs";
import { a as assertLotRequired, c as assertSufficient, f as moveValuePaise, h as toMoveType, l as encodeMoveNotes, m as parseReverseOf, n as assertAlloyMatch, o as assertNegativeStockKind, r as assertConversion } from "./rules-ctSmlA2x.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/posting-bGpwTDUP.js
/** Map live ERP rows onto GST document types. */
function str(v, fallback = "") {
	if (v == null) return fallback;
	return String(v);
}
function bool(v, fallback = false) {
	if (v == null) return fallback;
	if (typeof v === "boolean") return v;
	if (v === "t" || v === "true" || v === "1") return true;
	if (v === "f" || v === "false" || v === "0") return false;
	return fallback;
}
function companyFromRow(c) {
	if (!c) return TAMBA;
	const turnover = bool(c.turnover_above_5cr, true);
	return {
		legalName: str(c.name, TAMBA.legalName),
		tradeName: str(c.trade_name, TAMBA.tradeName),
		name: str(c.name, TAMBA.name),
		gstin: str(c.gstin, TAMBA.gstin ?? ""),
		pan: str(c.pan, TAMBA.pan ?? ""),
		cin: str(c.cin, TAMBA.cin ?? ""),
		iec: str(c.iec, TAMBA.iec ?? ""),
		lutArn: str(c.lut_arn, TAMBA.lutArn ?? ""),
		lutValidUntil: str(c.lut_valid_until, TAMBA.lutValidUntil ?? ""),
		addressLine1: str(c.address_line1, TAMBA.addressLine1),
		addressLine2: str(c.address_line2),
		city: str(c.city, TAMBA.city),
		state: str(c.state, TAMBA.state),
		stateCode: str(c.state_code, TAMBA.stateCode ?? "24"),
		pincode: str(c.pincode, TAMBA.pincode),
		country: "IN",
		registeredOffice: str(c.registered_office, TAMBA.registeredOffice ?? ""),
		phone: str(c.phone, TAMBA.phone ?? ""),
		email: str(c.email, TAMBA.email ?? ""),
		authorisedSignatory: str(c.authorised_signatory, TAMBA.authorisedSignatory),
		authorisedDesignation: str(c.authorised_designation, TAMBA.authorisedDesignation),
		composition: bool(c.composition, false),
		turnoverAbove5Cr: turnover,
		hsnDigits: n(c.hsn_digits) || (turnover ? 6 : 4),
		einvoiceApplicable: bool(c.einvoice_applicable, true),
		b2cQr: bool(c.b2c_qr, true),
		ewayThresholdPaise: n(c.eway_threshold_paise) || 5e6,
		msmeCreditDays: n(c.msme_credit_days) || 45,
		bankName: str(c.bank_name, TAMBA.bankName ?? ""),
		bankAccount: str(c.bank_account, TAMBA.bankAccount ?? ""),
		bankIfsc: str(c.bank_ifsc, TAMBA.bankIfsc ?? ""),
		registered: true
	};
}
function partyFromRow(p) {
	const name = str(p.partner_name ?? p.name);
	const gstin = str(p.partner_gstin ?? p.gstin) || null;
	const country = str(p.partner_country ?? p.country, "IN");
	return {
		name,
		gstin,
		pan: str(p.pan) || null,
		addressLine1: str(p.partner_addr ?? p.address_line1),
		addressLine2: str(p.address_line2) || null,
		city: str(p.partner_city ?? p.city),
		state: str(p.partner_state ?? p.state),
		stateCode: str(p.partner_state_code ?? p.state_code) || null,
		pincode: str(p.pincode),
		country,
		registered: Boolean(gstin) && country === "IN"
	};
}
function mapTaxInvoice(opts) {
	const company = companyFromRow(opts.company);
	const inv = opts.invoice;
	const billTo = partyFromRow(inv);
	const isExport = bool(inv.is_export) || billTo.country !== "IN";
	const exportMode = str(inv.export_mode) || (isExport ? "LUT" : null);
	const kind = classifySupply({
		fromState: company.stateCode,
		toState: billTo.stateCode,
		isExport,
		exportMode
	});
	const lines = opts.lines.map((l, i) => {
		const taxable = n(l.taxable_paise);
		const tax = {
			cgstPaise: n(l.cgst_paise),
			sgstPaise: n(l.sgst_paise),
			igstPaise: n(l.igst_paise)
		};
		return {
			sl: i + 1,
			description: `${str(l.item_name)} (${str(l.sku)})`,
			hsn: str(l.hsn),
			uqc: n(l.qty_kg) > 0 ? "NOS / KGS" : "NOS",
			qtyNos: n(l.qty_pcs),
			qtyKgs: n(l.qty_kg),
			lotHeat: [str(l.lot_no), str(l.heat_no)].filter(Boolean).join(" / ") || null,
			taxablePaise: taxable,
			discountPaise: n(l.discount_paise),
			gstPct: n(l.gst_pct) || 18,
			...tax,
			lineTotalPaise: lineTotalPaise(taxable, n(l.discount_paise), {
				cgst: tax.cgstPaise,
				sgst: tax.sgstPaise,
				igst: tax.igstPaise
			})
		};
	});
	const taxable = n(inv.taxable_paise) || lines.reduce((s, l) => s + l.taxablePaise, 0);
	const cgst = n(inv.cgst_paise);
	const sgst = n(inv.sgst_paise);
	const igst = n(inv.igst_paise);
	const exact = n(inv.total_paise) || taxable + cgst + sgst + igst;
	const { rounded, roundOff } = roundOffToRupee(exact);
	const date = str(inv.invoice_date).slice(0, 10);
	const msme = addDaysIso(date, company.msmeCreditDays);
	return {
		title: "TAX INVOICE",
		docNo: str(inv.doc_no),
		docDate: date,
		kind,
		company,
		billTo,
		shipTo: billTo,
		placeOfSupply: str(inv.place_of_supply) || `${billTo.stateCode}-${billTo.state}`,
		rcm: bool(inv.reverse_charge),
		reverseCharge: bool(inv.reverse_charge),
		lines,
		taxablePaise: taxable,
		discountPaise: 0,
		cgstPaise: cgst,
		sgstPaise: sgst,
		igstPaise: igst,
		roundOffPaise: n(inv.round_off_paise) || roundOff,
		totalPaise: n(inv.total_paise) || rounded,
		netKg: n(inv.net_kg),
		packingNetKg: opts.packing ? n(opts.packing.net_kg) : n(inv.net_kg),
		irn: str(inv.irn) || null,
		irnAckNo: str(inv.irn_ack_no) || null,
		irnAckDt: str(inv.irn_ack_dt) || null,
		soNo: str(inv.so_no) || null,
		ewayNo: str(inv.eway_no) || null,
		msmeDueDate: msme,
		vehicleNo: str(inv.vehicle_no) || null,
		export: isExport ? {
			mode: exportMode === "IGST" ? "IGST" : "LUT",
			currency: str(inv.currency, "USD"),
			forexRate: n(inv.forex_rate) || 83.5,
			inrTaxablePaise: taxable,
			country: billTo.country === "AE" ? "United Arab Emirates" : billTo.country,
			port: str(inv.port, "INAMD4 — Ahmedabad ICD"),
			incoterm: str(inv.incoterm, "FOB Mundra"),
			iec: company.iec ?? "",
			lutArn: company.lutArn
		} : null
	};
}
function mapDeliveryChallan(opts) {
	const company = companyFromRow(opts.company);
	const ch = opts.challan;
	const consignee = partyFromRow(ch);
	const issued = str(ch.issued_at).slice(0, 10);
	const goodsKind = "INPUTS";
	const lines = opts.lines.map((l, i) => {
		const taxable = Math.round(n(l.qty_pcs) * 2107);
		return {
			sl: i + 1,
			description: `${str(l.item_name)} (${str(l.sku)})`,
			hsn: str(l.hsn) || "741220",
			uqc: "NOS / KGS",
			qtyNos: n(l.qty_pcs),
			qtyKgs: n(l.qty_kg),
			lotHeat: [str(l.lot_no), str(l.heat_no)].filter(Boolean).join(" / ") || null,
			taxablePaise: taxable,
			discountPaise: 0,
			gstPct: 18,
			cgstPaise: 0,
			sgstPaise: 0,
			igstPaise: 0,
			lineTotalPaise: taxable,
			sentNos: n(l.qty_pcs),
			sentKgs: n(l.qty_kg),
			goodReceived: n(opts.ret?.good_pcs),
			reject: n(opts.ret?.reject_pcs),
			scrapReturned: 0,
			scrapKeptByJw: 0,
			loss: n(opts.ret?.short_pcs)
		};
	});
	const taxable = lines.reduce((s, l) => s + l.taxablePaise, 0);
	return {
		title: "DELIVERY CHALLAN",
		variant: opts.variant ?? "JW_OUT",
		docNo: str(opts.ret?.doc_no ?? ch.doc_no),
		docDate: str(opts.ret?.returned_at ?? issued).slice(0, 10),
		company,
		consigner: company,
		consignee,
		processName: str(ch.process_code),
		goodsKind,
		expectedReturn: str(ch.expected_return_at).slice(0, 10),
		statutoryDue: str(ch.statutory_due).slice(0, 10) || statutoryDueIso(issued, goodsKind),
		placeOfSupply: `${consignee.stateCode}-${consignee.state}`,
		interState: consignee.stateCode !== company.stateCode,
		vehicleNo: str(ch.vehicle_no) || null,
		ewayNo: str(ch.eway_no) || null,
		reasonCode: "3",
		lines,
		taxablePaise: taxable,
		gstPct: 18,
		taxPaise: Math.round(taxable * .18),
		originalChallanNo: opts.variant === "JW_RETURN" ? str(ch.doc_no) : null,
		originalChallanDate: opts.variant === "JW_RETURN" ? issued : null,
		ageDays: n(ch.age_days)
	};
}
function mapPackingList(opts) {
	const company = companyFromRow(opts.company);
	return {
		title: "PACKING LIST",
		docNo: str(opts.packing.doc_no),
		docDate: str(opts.packing.packed_at).slice(0, 10),
		invoiceNo: str(opts.invoice.doc_no),
		invoiceDate: str(opts.invoice.invoice_date).slice(0, 10),
		invoiceNetKg: n(opts.invoice.net_kg),
		packingNetKg: n(opts.packing.net_kg),
		packingGrossKg: n(opts.packing.gross_kg),
		company,
		consignee: partyFromRow(opts.invoice),
		countryOfOrigin: "India",
		cartonMarks: `TAMBA / ${str(opts.invoice.partner_name)}`,
		cartons: opts.packingLines.map((l) => ({
			cartonNo: str(l.carton_no),
			description: str(l.sku || l.item_name || "FG"),
			lotHeat: [str(l.lot_no), str(l.heat_no)].filter(Boolean).join(" / "),
			qtyNos: n(l.qty_pcs),
			netKg: n(l.net_kg),
			grossKg: n(l.gross_kg) || Math.round(n(l.net_kg) * 1.02 * 1e3) / 1e3
		}))
	};
}
function mapGrnSlip(opts) {
	return {
		title: "GRN / WEIGHMENT SLIP",
		docNo: str(opts.grn.doc_no),
		docDate: str(opts.grn.grn_date).slice(0, 10),
		company: companyFromRow(opts.company),
		vendor: partyFromRow(opts.grn),
		vehicleNo: str(opts.grn.vehicle_no),
		alloy: str(opts.line.alloy || opts.line.alloy_code),
		sku: str(opts.line.sku),
		heatNo: str(opts.line.heat_no),
		grossKg: n(opts.line.gross_kg),
		tareKg: n(opts.line.tare_kg),
		netKg: n(opts.line.net_kg),
		qcStatus: str(opts.line.lot_status) === "AVAILABLE" ? "RELEASED" : "QC HOLD"
	};
}
function mapQuote(opts) {
	return {
		title: "QUOTATION",
		docNo: str(opts.quote.doc_no),
		docDate: str(opts.quote.quote_date).slice(0, 10),
		validUntil: str(opts.quote.valid_until).slice(0, 10),
		company: companyFromRow(opts.company),
		customer: partyFromRow(opts.quote),
		metalRateDate: str(opts.quote.metal_rate_date).slice(0, 10),
		cuPaisePerKg: n(opts.quote.cu_paise_per_kg),
		znPaisePerKg: n(opts.quote.zn_paise_per_kg),
		lines: opts.lines.map((l, i) => ({
			sl: i + 1,
			sku: str(l.sku),
			description: str(l.item_name || l.sku),
			qtyNos: n(l.qty_pcs),
			metalPaise: n(l.metal_paise),
			conversionPaise: n(l.conversion_paise),
			jwPaise: n(l.jw_paise),
			packingPaise: n(l.packing_paise),
			overheadPaise: n(l.overhead_paise),
			marginPaise: n(l.margin_paise),
			unitPricePaise: n(l.unit_price_paise)
		}))
	};
}
function mapNote(opts) {
	const company = companyFromRow(opts.company);
	const billTo = partyFromRow(opts.note);
	const kindSupply = classifySupply({
		fromState: company.stateCode,
		toState: billTo.stateCode,
		isExport: false
	});
	const lines = (opts.lines ?? []).map((l, i) => {
		const taxable = n(l.taxable_paise);
		const tax = gstBreakupForKind(taxable, n(l.gst_pct) || 18, kindSupply);
		return {
			sl: i + 1,
			description: str(l.description || l.item_name),
			hsn: str(l.hsn),
			uqc: "NOS / KGS",
			qtyNos: n(l.qty_pcs),
			qtyKgs: n(l.qty_kg),
			taxablePaise: taxable,
			discountPaise: 0,
			gstPct: n(l.gst_pct) || 18,
			cgstPaise: n(l.cgst_paise) || tax.cgst,
			sgstPaise: n(l.sgst_paise) || tax.sgst,
			igstPaise: n(l.igst_paise) || tax.igst,
			lineTotalPaise: lineTotalPaise(taxable, 0, tax)
		};
	});
	return {
		title: str(opts.note.kind) === "DN" ? "DEBIT NOTE" : "CREDIT NOTE",
		kind: str(opts.note.kind) === "DN" ? "DN" : "CN",
		docNo: str(opts.note.doc_no),
		docDate: str(opts.note.note_date).slice(0, 10),
		originalInvoiceNo: str(opts.note.original_invoice_no),
		originalInvoiceDate: str(opts.note.original_invoice_date).slice(0, 10),
		reason: str(opts.note.reason),
		company,
		billTo,
		placeOfSupply: `${billTo.stateCode}-${billTo.state}`,
		kindSupply,
		lines,
		taxablePaise: n(opts.note.taxable_paise),
		cgstPaise: n(opts.note.cgst_paise),
		sgstPaise: n(opts.note.sgst_paise),
		igstPaise: n(opts.note.igst_paise),
		totalPaise: n(opts.note.total_paise),
		irn: str(opts.note.irn) || null
	};
}
function mapEway(opts) {
	const company = companyFromRow(opts.company);
	const e = opts.eway;
	return {
		title: "FORM GST EWB-01",
		stubNo: str(e.stub_no),
		docDate: str(e.doc_date).slice(0, 10),
		company,
		partA: {
			recipientGstin: str(e.recipient_gstin, "URP"),
			deliveryPin: str(e.delivery_pin),
			docNo: str(e.doc_no),
			docDate: str(e.doc_date).slice(0, 10),
			valuePaise: n(e.value_paise),
			hsn: str(e.hsn),
			reasonCode: str(e.reason_code, "3"),
			reasonLabel: str(e.reason_label, "Job Work"),
			documentType: str(e.document_type, "Delivery Challan"),
			billToGstin: str(e.bill_to_gstin, str(e.recipient_gstin)),
			shipToGstin: str(e.ship_to_gstin, str(e.recipient_gstin))
		},
		partB: {
			vehicle: str(e.vehicle),
			mode: str(e.mode, "Road") || "Road",
			transDoc: str(e.trans_doc),
			distanceKm: n(e.distance_km),
			skippedVehicle: bool(e.skipped_vehicle)
		},
		nicSigned: bool(e.nic_signed)
	};
}
function mapCoc(opts) {
	return {
		title: "CERTIFICATE OF CONFORMANCE",
		docNo: str(opts.coc.doc_no),
		docDate: str(opts.coc.doc_date).slice(0, 10),
		company: companyFromRow(opts.company),
		customer: partyFromRow(opts.coc),
		sku: str(opts.coc.sku),
		description: str(opts.coc.description),
		alloySpec: str(opts.coc.alloy_spec),
		drawingNo: str(opts.coc.drawing_no),
		drawingRev: str(opts.coc.drawing_rev),
		lotNo: str(opts.coc.lot_no),
		heatNo: str(opts.coc.heat_no),
		qtyNos: n(opts.coc.qty_nos),
		qtyKgs: n(opts.coc.qty_kgs),
		qaSignatory: str(opts.coc.qa_signatory, "Anjali Trivedi, QC")
	};
}
async function withStockTx(sql, fn) {
	await sql.query("begin");
	try {
		const r = await fn();
		await sql.query("commit");
		return r;
	} catch (err) {
		try {
			await sql.query("rollback");
		} catch {}
		throw err;
	}
}
async function getLot(sql, id) {
	const rows = await sql.query(`select * from stock_lot where id = $1`, [id]);
	if (!rows[0]) throw new Error(`Lot ${id} not found`);
	return rows[0];
}
async function createLot(sql, opts) {
	if (n(opts.qtyKg) !== 0 || n(opts.qtyPcs) !== 0) throw new Error("createLot starts at 0 — postStockMove is the only qty writer");
	const lotNo = opts.lotNo || await nextDoc(sql, "LOT");
	return (await sql.query(`insert into stock_lot (
       lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status,
       owner_type, owner_partner_id, unit_value_paise_per_kg, parent_lot_id, source_type, source_id
     ) values ($1,$2,$3,$4,$5,0,0,$6,$7,$8,$9,$10,$11,$12)
     returning *`, [
		lotNo,
		opts.itemId,
		opts.warehouseId,
		opts.alloyId,
		opts.heatNo ?? null,
		opts.status,
		opts.ownerType ?? "OWN",
		opts.ownerPartnerId ?? null,
		opts.unitValuePaisePerKg ?? 0,
		opts.parentLotId ?? null,
		opts.sourceType ?? null,
		opts.sourceId ?? null
	]))[0];
}
async function warehouseByCode(sql, code) {
	const rows = await sql.query(`select id, code, name, kind, valuation_eligible, is_outside_factory, is_customer_owned from warehouse where code = $1`, [code]);
	if (!rows[0]) throw new Error(`Warehouse ${code} not found`);
	return rows[0];
}
async function linkGenealogy(sql, childLotId, parentLotId, qtyKg, qtyPcs, opts) {
	await sql.query(`insert into genealogy_link (child_lot_id, parent_lot_id, qty_kg, qty_pcs, parent_move_id, child_move_id)
     values ($1,$2,$3,$4,$5,$6)`, [
		childLotId,
		parentLotId,
		roundKg(qtyKg),
		qtyPcs,
		opts?.parentMoveId ?? null,
		opts?.childMoveId ?? null
	]);
}
async function onHandFromMoves(sql, opts) {
	const rows = await sql.query(`select coalesce(sum(qty_kg),0) as kg, coalesce(sum(qty_pcs),0) as pcs from (
        select m.qty_kg, m.qty_pcs
          from stock_move m
          join stock_lot l on l.id = m.lot_id
          join warehouse w on w.id = m.warehouse_id
         where ($1::int is null or l.item_id = $1)
           and ($2::int is null or m.lot_id = $2)
           and ($3::int is null or m.warehouse_id = $3)
           and ($4::text is null or w.code = $4)
           and ($5::text is null or l.owner_type = $5)
           and ($6::text is null or l.status = $6)
        union all
        select l.qty_kg, l.qty_pcs
          from stock_lot l
          join warehouse w on w.id = l.warehouse_id
         where not exists (select 1 from stock_move m where m.lot_id = l.id)
           and ($1::int is null or l.item_id = $1)
           and ($2::int is null or l.id = $2)
           and ($3::int is null or l.warehouse_id = $3)
           and ($4::text is null or w.code = $4)
           and ($5::text is null or l.owner_type = $5)
           and ($6::text is null or l.status = $6)
      ) x`, [
		opts.itemId ?? null,
		opts.lotId ?? null,
		opts.warehouseId ?? null,
		opts.warehouseCode ?? null,
		opts.ownerType ?? null,
		opts.status ?? null
	]);
	return {
		kg: n(rows[0]?.kg),
		pcs: n(rows[0]?.pcs)
	};
}
async function onHandKg(sql, itemId, opts) {
	return (await onHandFromMoves(sql, {
		itemId,
		status: opts?.status ?? "AVAILABLE",
		warehouseCode: opts?.warehouseCode,
		ownerType: opts?.ownerType ?? "OWN"
	})).kg;
}
/**
* Opening seed lots carry qty with no stock_move. The constitution says
* on-hand = sum of moves, so the first writer materialises an OPENING row.
*/
async function ensureOpeningMove(sql, lot) {
	const existing = await sql.query(`select count(*)::int as n from stock_move where lot_id = $1`, [lot.id]);
	if (n(existing[0]?.n) > 0) return;
	const kg = n(lot.qty_kg);
	const pcs = n(lot.qty_pcs);
	if (kg === 0 && pcs === 0) return;
	const wh = (await sql.query(`select valuation_eligible from warehouse where id = $1`, [lot.warehouse_id]))[0];
	const value = moveValuePaise({
		qtyKg: kg,
		ratePaisePerKg: lot.unit_value_paise_per_kg,
		ownerType: lot.owner_type,
		warehouseValuationEligible: wh?.valuation_eligible
	});
	await sql.query(`insert into stock_move (
       move_type, item_id, lot_id, warehouse_id, qty_kg, qty_pcs, value_paise,
       ref_type, notes, alloy_id
     ) values ('OPENING',$1,$2,$3,$4,$5,$6,'OPENING','REASON:ADJ-COUNT | Seeded opening balance',$7)`, [
		lot.item_id,
		lot.id,
		lot.warehouse_id,
		roundKg(kg),
		pcs,
		value,
		lot.alloy_id
	]);
}
async function postStockMove(sql, input) {
	assertLotRequired(input.lotId);
	const type = toMoveType(String(input.type), input.qtyKg);
	await assertPeriodAllows(sql, todayISO(), "STOCK");
	const kg = roundKg(n(input.qtyKg));
	const pcs = n(input.qtyPcs);
	if (kg === 0 && pcs === 0 && !input.allowZeroQty) throw new Error("Mass-changing move requires qtyKg (and qtyPcs for FG/customer). Zero-qty only for QC status events.");
	if (input.kgPerPc != null && n(input.kgPerPc) > 0) assertConversion({
		qtyKg: kg,
		qtyPcs: pcs,
		kgPerPc: n(input.kgPerPc),
		kind: input.conversionKind ?? (Math.abs(pcs) > 0 && Math.abs(kg) / Math.max(1, Math.abs(pcs)) < 1 ? "FG" : "ROD"),
		context: type
	});
	let lot = await getLot(sql, input.lotId);
	if (lot.item_id !== input.itemId) throw new Error(`Lot ${lot.lot_no} is item #${lot.item_id}, not #${input.itemId}`);
	assertAlloyMatch({
		lotAlloyId: lot.alloy_id,
		itemAlloyId: input.itemAlloyId ?? lot.alloy_id,
		context: type
	});
	await ensureOpeningMove(sql, lot);
	lot = await getLot(sql, input.lotId);
	const warehouseId = input.toWh ?? input.fromWh ?? lot.warehouse_id;
	if (kg < 0 || pcs < 0) assertSufficient({
		haveKg: n(lot.qty_kg),
		takeKg: kg < 0 ? -kg : 0,
		havePcs: n(lot.qty_pcs),
		takePcs: pcs < 0 ? -pcs : 0,
		what: type
	});
	const wh = (await sql.query(`select id, kind, valuation_eligible, code from warehouse where id = $1`, [warehouseId]))[0];
	if (!wh) throw new Error("Warehouse not found");
	const nextKg = n(lot.qty_kg) + kg;
	const nextPcs = n(lot.qty_pcs) + pcs;
	assertNegativeStockKind(wh.kind, nextKg, nextPcs);
	const rate = input.ratePaise ?? lot.unit_value_paise_per_kg;
	const value = moveValuePaise({
		qtyKg: kg,
		ratePaisePerKg: rate,
		ownerType: lot.owner_type,
		warehouseValuationEligible: wh.valuation_eligible
	});
	const notes = encodeMoveNotes({
		reasonCode: input.reasonCode,
		lineId: input.lineId,
		reverseOf: input.reverseOf,
		fromWh: input.fromWh,
		toWh: input.toWh,
		text: input.notes
	});
	const moveId = (await sql.query(`insert into stock_move (
       move_type, item_id, lot_id, warehouse_id, qty_kg, qty_pcs, value_paise,
       ref_type, ref_id, notes, user_id, alloy_id, parent_move_id, consumed_lot_id
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     returning id`, [
		type,
		input.itemId,
		input.lotId,
		warehouseId,
		kg,
		pcs,
		value,
		input.refType ?? null,
		input.refId ?? null,
		notes,
		input.userId ?? null,
		input.alloyId ?? lot.alloy_id,
		input.parentMoveId ?? null,
		input.consumedLotId ?? null
	]))[0].id;
	const summed = await sql.query(`select coalesce(sum(qty_kg),0) as kg, coalesce(sum(qty_pcs),0) as pcs from stock_move where lot_id = $1`, [input.lotId]);
	const projKg = n(summed[0]?.kg);
	const projPcs = n(summed[0]?.pcs);
	assertNegativeStockKind(wh.kind, projKg, projPcs);
	if (!(await sql.query(`update stock_lot set qty_kg = $1, qty_pcs = $2 where id = $3 returning id`, [
		roundKg(projKg),
		projPcs,
		input.lotId
	]))[0]) throw new Error("Lot update failed");
	await audit(sql, {
		userId: input.userId,
		action: type,
		entity: "stock_move",
		entityId: moveId,
		after: {
			type,
			lotId: input.lotId,
			lotNo: lot.lot_no,
			qtyKg: kg,
			qtyPcs: pcs,
			warehouseId,
			refType: input.refType,
			refId: input.refId,
			reasonCode: input.reasonCode ?? null
		}
	});
	await journalFromMove(sql, {
		type,
		qtyKg: kg,
		valuePaise: value,
		warehouseKind: wh.kind,
		warehouseCode: wh.code,
		ownerType: lot.owner_type,
		moveId,
		userId: input.userId,
		refType: input.refType,
		refId: input.refId,
		reverseOf: input.reverseOf ?? null
	});
	return {
		moveId,
		lot: await getLot(sql, input.lotId)
	};
}
/** Compatibility wrapper — every historical caller goes through postStockMove. */
async function postMove(sql, opts) {
	return postStockMove(sql, {
		type: toMoveType(opts.moveType, opts.qtyKg),
		itemId: opts.itemId,
		lotId: opts.lotId,
		fromWh: opts.qtyKg < 0 ? opts.warehouseId : void 0,
		toWh: opts.qtyKg >= 0 ? opts.warehouseId : void 0,
		qtyKg: opts.qtyKg,
		qtyPcs: opts.qtyPcs,
		ratePaise: opts.unitValuePaisePerKg,
		refType: opts.refType,
		refId: opts.refId,
		lineId: opts.lineId,
		reasonCode: opts.reasonCode,
		userId: opts.userId,
		notes: opts.notes,
		alloyId: opts.alloyId,
		kgPerPc: opts.kgPerPc,
		conversionKind: opts.conversionKind,
		allowZeroQty: opts.allowZeroQty,
		itemAlloyId: opts.itemAlloyId,
		parentMoveId: opts.parentMoveId,
		consumedLotId: opts.consumedLotId
	});
}
async function reverseStockMove(sql, opts) {
	const orig = (await sql.query(`select * from stock_move where id = $1`, [opts.moveId]))[0];
	if (!orig) throw new Error(`Move ${opts.moveId} not found`);
	if (parseReverseOf(orig.notes) != null) throw new Error("Cannot reverse a reversing move — post a new correction");
	const already = await sql.query(`select id from stock_move where notes like $1 limit 1`, [`%REVERSES:${orig.id}%`]);
	if (already[0]) throw new Error(`Move ${orig.id} already reversed by #${already[0].id}`);
	return {
		reverseMoveId: (await postStockMove(sql, {
			type: orig.move_type,
			itemId: orig.item_id,
			lotId: orig.lot_id,
			fromWh: orig.warehouse_id,
			toWh: orig.warehouse_id,
			qtyKg: -n(orig.qty_kg),
			qtyPcs: -n(orig.qty_pcs),
			refType: orig.ref_type ?? "REVERSAL",
			refId: orig.ref_id ?? orig.id,
			userId: opts.userId,
			reverseOf: orig.id,
			reasonCode: opts.reasonCode,
			notes: `Reversal of move #${orig.id} — original row remains`,
			alloyId: orig.alloy_id,
			allowZeroQty: n(orig.qty_kg) === 0 && n(orig.qty_pcs) === 0
		})).moveId,
		originalId: orig.id
	};
}
async function saveDocSnapshot(sql, opts) {
	await audit(sql, {
		userId: opts.userId,
		action: "DOC_SNAPSHOT",
		entity: opts.entity,
		entityId: opts.entityId,
		after: opts.doc
	});
}
async function loadDocSnapshot(sql, entity, entityId) {
	const rows = await sql.query(`select after_json from audit_log
      where entity = $1 and entity_id = $2 and action = 'DOC_SNAPSHOT'
      order by id desc limit 1`, [entity, String(entityId)]);
	if (!rows[0]?.after_json) return null;
	try {
		return JSON.parse(rows[0].after_json);
	} catch {
		return null;
	}
}
//#endregion
export { saveDocSnapshot as _, loadDocSnapshot as a, mapEway as c, mapPackingList as d, mapQuote as f, reverseStockMove as g, postMove as h, linkGenealogy as i, mapGrnSlip as l, onHandKg as m, createLot as n, mapCoc as o, mapTaxInvoice as p, getLot as r, mapDeliveryChallan as s, companyFromRow as t, mapNote as u, warehouseByCode as v, withStockTx as y };
