import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as todayISO, n as authMiddleware, o as n, s as roundKg } from "./format-Bcy9062O.mjs";
import { a as nextDoc, i as erpSql, n as audit, o as requireStaff, s as setting, t as assertPerm } from "./core.server-BOQw3eDO.mjs";
import { _n as object, bn as string } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
import { l as postExcessLossJournal } from "./api-finance-DafwBR3A.mjs";
import { t as uid } from "./row-CXk8IdOY.mjs";
import { d as jwLossWorking, i as assertJwVendorAllowed } from "./rules-ctSmlA2x.mjs";
import { _ as saveDocSnapshot, h as postMove, i as linkGenealogy, n as createLot, r as getLot, s as mapDeliveryChallan, v as warehouseByCode, y as withStockTx } from "./posting-bGpwTDUP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-jw-xAA6Ee5M.js
var issueJobWork_createServerFn_handler = createServerRpc({
	id: "037449f58b34ac7a0ea456be98a230cdfc363672635ba9ba543a5b7bf6056ace",
	name: "issueJobWork",
	filename: "src/lib/erp/api-jw.ts"
}, (opts) => issueJobWork.__executeServer(opts));
var issueJobWork = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	partnerId: number(),
	processCode: string().min(1),
	lotId: number(),
	qtyPcs: number().positive(),
	vehicleNo: string().optional(),
	expectedDays: number().min(1).default(14)
})).handler(issueJobWork_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "jw");
	const sql = await erpSql();
	const blockDays = n(await setting(sql, "jw_block_days", "330"));
	const settingOn = await setting(sql, "jw_block_aged", "1") !== "0";
	const aged = await sql.query(`select doc_no, floor(extract(epoch from (now() - issued_at)) / 86400)::int as age
         from job_work_challan
        where partner_id = $1 and status <> 'CLOSED'
          and issued_at < now() - ($2::text || ' days')::interval`, [data.partnerId, blockDays]);
	if (aged[0]) assertJwVendorAllowed({
		ageDays: aged[0].age,
		blockDays,
		settingOn,
		docNo: aged[0].doc_no
	});
	const lot = await getLot(sql, data.lotId);
	if (lot.status !== "AVAILABLE") throw new Error("Source lot must be AVAILABLE");
	const item = (await sql.query(`select * from item where id = $1`, [lot.item_id]))[0];
	const kgPer = n(item.kg_per_pc) || n(lot.qty_kg) / Math.max(1, n(lot.qty_pcs));
	const qtyKg = roundKg(data.qtyPcs * kgPer);
	if (n(lot.qty_pcs) + 5e-4 < data.qtyPcs) throw new Error("Not enough pcs on the source lot");
	const rate = (await sql.query(`select loss_norm_pct, rate_paise_per_pc from partner_process_rate
          where partner_id = $1 and process_code = $2
            and (item_family = $3 or item_family = '')
          order by case when item_family = $3 then 0 else 1 end
          limit 1`, [
		data.partnerId,
		data.processCode,
		item.family
	]))[0];
	const lossNorm = n(rate?.loss_norm_pct ?? 0);
	const jwWh = await warehouseByCode(sql, "JW-OUT");
	const company = (await sql.query(`select * from company limit 1`))[0];
	const partner = (await sql.query(`select * from partner where id = $1`, [data.partnerId]))[0];
	if (!partner) throw new Error("Vendor not found");
	return withStockTx(sql, async () => {
		await postMove(sql, {
			moveType: "JW_OUT",
			itemId: lot.item_id,
			lotId: lot.id,
			warehouseId: lot.warehouse_id,
			qtyKg: -qtyKg,
			qtyPcs: -data.qtyPcs,
			refType: "JW",
			userId: staff.user_id,
			alloyId: lot.alloy_id,
			unitValuePaisePerKg: lot.unit_value_paise_per_kg,
			kgPerPc: kgPer,
			conversionKind: "FG",
			itemAlloyId: lot.alloy_id
		});
		const jwLot = await createLot(sql, {
			itemId: lot.item_id,
			warehouseId: jwWh.id,
			alloyId: lot.alloy_id,
			heatNo: lot.heat_no,
			qtyKg: 0,
			qtyPcs: 0,
			status: "AVAILABLE",
			unitValuePaisePerKg: lot.unit_value_paise_per_kg,
			parentLotId: lot.id,
			sourceType: "JW"
		});
		await postMove(sql, {
			moveType: "JW_OUT",
			itemId: lot.item_id,
			lotId: jwLot.id,
			warehouseId: jwWh.id,
			qtyKg,
			qtyPcs: data.qtyPcs,
			refType: "JW",
			userId: staff.user_id,
			alloyId: lot.alloy_id,
			unitValuePaisePerKg: lot.unit_value_paise_per_kg,
			kgPerPc: kgPer,
			conversionKind: "FG",
			itemAlloyId: lot.alloy_id
		});
		await linkGenealogy(sql, jwLot.id, lot.id, qtyKg, data.qtyPcs);
		const docNo = await nextDoc(sql, "JW");
		const issued = /* @__PURE__ */ new Date();
		const statutory = new Date(issued.getTime() + 31536e6);
		const expected = new Date(issued.getTime() + data.expectedDays * 864e5);
		const ch = (await sql.query(`insert into job_work_challan (
             doc_no, partner_id, process_code, issued_at, expected_return_at, statutory_due,
             status, vehicle_no, created_by, loss_norm_pct
           ) values ($1,$2,$3,$4,$5,$6,'OPEN',$7,$8,$9) returning id`, [
			docNo,
			data.partnerId,
			data.processCode,
			issued,
			expected.toISOString().slice(0, 10),
			statutory.toISOString().slice(0, 10),
			data.vehicleNo ?? null,
			staff.user_id,
			lossNorm
		]))[0];
		await sql.query(`insert into job_work_challan_line (challan_id, item_id, lot_id, jw_lot_id, qty_pcs, qty_kg, hsn)
         values ($1,$2,$3,$4,$5,$6,$7)`, [
			ch.id,
			item.id,
			lot.id,
			jwLot.id,
			data.qtyPcs,
			qtyKg,
			item.hsn
		]);
		await sql.query(`update stock_lot set source_id = $1 where id = $2`, [ch.id, jwLot.id]);
		const snap = mapDeliveryChallan({
			company,
			challan: {
				...partner,
				doc_no: docNo,
				issued_at: issued.toISOString(),
				statutory_due: statutory.toISOString().slice(0, 10),
				process_code: data.processCode,
				partner_name: partner.name,
				partner_gstin: partner.gstin,
				partner_addr: partner.address_line1,
				partner_city: partner.city,
				partner_state: partner.state,
				partner_state_code: partner.state_code,
				vehicle_no: data.vehicleNo ?? ""
			},
			lines: [{
				sku: item.sku,
				item_name: item.name,
				qty_pcs: data.qtyPcs,
				qty_kg: qtyKg,
				hsn: item.hsn,
				lot_no: jwLot.lot_no
			}],
			variant: "JW_OUT"
		});
		await saveDocSnapshot(sql, {
			userId: staff.user_id,
			entity: "job_work_challan",
			entityId: ch.id,
			doc: snap
		});
		await audit(sql, {
			userId: staff.user_id,
			action: "JW_OUT",
			entity: "job_work_challan",
			entityId: ch.id,
			after: {
				docNo,
				qtyPcs: data.qtyPcs,
				qtyKg,
				statutoryDue: statutory.toISOString().slice(0, 10)
			}
		});
		return {
			docNo,
			id: ch.id,
			jwLotNo: jwLot.lot_no,
			qtyKg,
			statutoryDue: statutory.toISOString().slice(0, 10)
		};
	});
});
var returnJobWork_createServerFn_handler = createServerRpc({
	id: "8d5bb1e0d90f1e3d5bd764832304ed31b81cde781078567c532aa5cc736fbd21",
	name: "returnJobWork",
	filename: "src/lib/erp/api-jw.ts"
}, (opts) => returnJobWork.__executeServer(opts));
var returnJobWork = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	challanId: number(),
	goodPcs: number().min(0),
	rejectPcs: number().min(0),
	shortPcs: number().min(0),
	scrapReturnedKg: number().min(0).default(0),
	scrapRetainedKg: number().min(0).default(0)
})).handler(returnJobWork_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "jw");
	const sql = await erpSql();
	const ch = (await sql.query(`select * from job_work_challan where id = $1`, [data.challanId]))[0];
	if (!ch) throw new Error("Challan not found");
	const line = (await sql.query(`select * from job_work_challan_line where challan_id = $1 limit 1`, [ch.id]))[0];
	if (!line || !line.jw_lot_id) throw new Error("Challan line missing JW lot");
	const sentPcs = n(line.qty_pcs);
	const already = n(line.returned_pcs);
	const taking = data.goodPcs + data.rejectPcs + data.shortPcs;
	if (already + taking - sentPcs > 5e-4) throw new Error("Return exceeds issued pcs");
	const item = (await sql.query(`select * from item where id = $1`, [line.item_id]))[0];
	const kgPer = n(item.kg_per_pc) || n(line.qty_kg) / Math.max(1, sentPcs);
	const sentKg = n(line.qty_kg);
	const goodKg = roundKg(data.goodPcs * kgPer);
	const rejectKg = roundKg(data.rejectPcs * kgPer);
	const scrapReturnedKg = roundKg(data.scrapReturnedKg);
	const scrapRetainedKg = roundKg(data.scrapRetainedKg);
	const working = jwLossWorking({
		sentKg,
		goodKg,
		rejectKg,
		scrapReturnedKg,
		scrapRetainedKg,
		lossNormPct: n(ch.loss_norm_pct)
	});
	const jwLot = await getLot(sql, line.jw_lot_id);
	const hold = await warehouseByCode(sql, "FG-HOLD");
	const rejWh = await warehouseByCode(sql, "FG-REJECT");
	const scrapWh = await warehouseByCode(sql, "RM-SCRAP");
	const company = (await sql.query(`select * from company limit 1`))[0];
	const partner = (await sql.query(`select * from partner where id = $1`, [ch.partner_id]))[0];
	const turnItem = (await sql.query(`select id, alloy_id from item where sku = 'SC-C360-TURN'`))[0];
	return withStockTx(sql, async () => {
		let fgLot = null;
		let rejectLot = null;
		let scrapLot = null;
		const outOfJw = roundKg(goodKg + rejectKg + scrapReturnedKg + working.actualLossKg + scrapRetainedKg);
		const outPcs = data.goodPcs + data.rejectPcs + data.shortPcs;
		if (outOfJw > 5e-4 || outPcs > 0) await postMove(sql, {
			moveType: "JW_RETURN_GOOD",
			itemId: item.id,
			lotId: jwLot.id,
			warehouseId: jwLot.warehouse_id,
			qtyKg: -outOfJw,
			qtyPcs: -outPcs,
			refType: "JW",
			refId: ch.id,
			userId: staff.user_id,
			alloyId: jwLot.alloy_id,
			unitValuePaisePerKg: jwLot.unit_value_paise_per_kg,
			itemAlloyId: item.alloy_id,
			notes: `Return working sent ${working.sentKg} accounted ${working.accountedKg} loss ${working.actualLossKg} excess ${working.excessLossKg}`
		});
		if (data.goodPcs > 0) {
			fgLot = await createLot(sql, {
				itemId: item.id,
				warehouseId: hold.id,
				alloyId: item.alloy_id,
				heatNo: jwLot.heat_no,
				qtyKg: 0,
				qtyPcs: 0,
				status: "QUARANTINE",
				unitValuePaisePerKg: jwLot.unit_value_paise_per_kg,
				parentLotId: jwLot.id,
				sourceType: "JW",
				sourceId: ch.id
			});
			await postMove(sql, {
				moveType: "JW_RETURN_GOOD",
				itemId: item.id,
				lotId: fgLot.id,
				warehouseId: hold.id,
				qtyKg: goodKg,
				qtyPcs: data.goodPcs,
				refType: "JW",
				refId: ch.id,
				userId: staff.user_id,
				alloyId: item.alloy_id,
				unitValuePaisePerKg: jwLot.unit_value_paise_per_kg,
				kgPerPc: kgPer,
				conversionKind: "FG",
				itemAlloyId: item.alloy_id
			});
			await linkGenealogy(sql, fgLot.id, jwLot.id, goodKg, data.goodPcs);
			const qiNo = await nextDoc(sql, "QI");
			await sql.query(`insert into quality_inspection (doc_no, lot_id, result) values ($1,$2,'PENDING')`, [qiNo, fgLot.id]);
		}
		if (data.rejectPcs > 0) {
			rejectLot = await createLot(sql, {
				itemId: item.id,
				warehouseId: rejWh.id,
				alloyId: item.alloy_id,
				heatNo: jwLot.heat_no,
				qtyKg: 0,
				qtyPcs: 0,
				status: "REJECTED",
				unitValuePaisePerKg: jwLot.unit_value_paise_per_kg,
				parentLotId: jwLot.id,
				sourceType: "JW",
				sourceId: ch.id
			});
			await postMove(sql, {
				moveType: "JW_RETURN_REJECT",
				itemId: item.id,
				lotId: rejectLot.id,
				warehouseId: rejWh.id,
				qtyKg: rejectKg,
				qtyPcs: data.rejectPcs,
				refType: "JW",
				refId: ch.id,
				userId: staff.user_id,
				alloyId: item.alloy_id,
				unitValuePaisePerKg: jwLot.unit_value_paise_per_kg,
				kgPerPc: kgPer,
				conversionKind: "FG",
				itemAlloyId: item.alloy_id,
				reasonCode: "REJ-PLATE-THK"
			});
		}
		if (scrapReturnedKg > 5e-4 && turnItem) {
			const existing = (await sql.query(`select id from stock_lot where item_id = $1 and warehouse_id = $2 and status = 'AVAILABLE' limit 1`, [turnItem.id, scrapWh.id]))[0];
			scrapLot = existing ? await getLot(sql, existing.id) : await createLot(sql, {
				itemId: turnItem.id,
				warehouseId: scrapWh.id,
				alloyId: turnItem.alloy_id,
				qtyKg: 0,
				qtyPcs: 0,
				status: "AVAILABLE",
				unitValuePaisePerKg: 41e3,
				sourceType: "JW",
				sourceId: ch.id
			});
			await postMove(sql, {
				moveType: "JW_RETURN_SCRAP",
				itemId: turnItem.id,
				lotId: scrapLot.id,
				warehouseId: scrapWh.id,
				qtyKg: scrapReturnedKg,
				qtyPcs: 0,
				refType: "JW",
				refId: ch.id,
				userId: staff.user_id,
				alloyId: turnItem.alloy_id,
				unitValuePaisePerKg: 41e3,
				reasonCode: "SCRAP-PLATE-STRIP"
			});
		}
		if (working.excessLossKg > 5e-4) await postMove(sql, {
			moveType: "JW_EXCESS_LOSS",
			itemId: item.id,
			lotId: jwLot.id,
			warehouseId: jwLot.warehouse_id,
			qtyKg: 0,
			qtyPcs: 0,
			refType: "JW",
			refId: ch.id,
			userId: staff.user_id,
			alloyId: jwLot.alloy_id,
			unitValuePaisePerKg: jwLot.unit_value_paise_per_kg,
			allowZeroQty: true,
			notes: `Excess ${working.excessLossKg} kg vs norm ${working.normKg} kg`
		});
		const scrapRate = 41e3;
		const metal = jwLot.unit_value_paise_per_kg;
		const rate = (await sql.query(`select rate_paise_per_pc from partner_process_rate
            where partner_id = $1 and process_code = $2
            order by id limit 1`, [ch.partner_id, ch.process_code]))[0];
		const excessPcs = kgPer > 0 ? Math.round(working.excessLossKg / kgPer) : 0;
		const debitPaise = Math.round(scrapRetainedKg * scrapRate) + Math.round(working.excessLossKg * metal + excessPcs * (rate?.rate_paise_per_pc ?? 0));
		const docNo = await nextDoc(sql, "JWR");
		const ret = (await sql.query(`insert into job_work_return (doc_no, challan_id, good_pcs, reject_pcs, short_pcs, scrap_kg, fg_lot_id, reject_lot_id, created_by)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`, [
			docNo,
			ch.id,
			data.goodPcs,
			data.rejectPcs,
			data.shortPcs,
			roundKg(scrapReturnedKg + scrapRetainedKg),
			fgLot?.id ?? null,
			rejectLot?.id ?? null,
			staff.user_id
		]))[0];
		const dn = await nextDoc(sql, "DN");
		await sql.query(`insert into job_work_loss (return_id, challan_id, actual_loss_pct, norm_pct, excess_pcs, excess_kg, debit_paise, debit_note_no, debit_status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT')`, [
			ret.id,
			ch.id,
			working.actualLossPct,
			n(ch.loss_norm_pct),
			excessPcs,
			working.excessLossKg,
			debitPaise,
			dn
		]);
		await postExcessLossJournal(sql, {
			paise: Math.round(working.excessLossKg * metal),
			returnId: ret.id,
			userId: staff.user_id
		});
		if (scrapRetainedKg > 5e-4 || working.excessLossKg > 5e-4 || debitPaise > 0) await sql.query(`insert into credit_debit_note (
             kind, doc_no, note_date, original_invoice_no, partner_id, reason,
             taxable_paise, total_paise, status, created_by
           ) values ('DN',$1,$2,$3,$4,$5,$6,$6,'DRAFT',$7)`, [
			dn,
			todayISO(),
			ch.doc_no,
			ch.partner_id,
			scrapRetainedKg > 0 ? `s.143(5) scrap retained ${scrapRetainedKg.toFixed(3)} kg — kg stays on books until invoiced` : `JW excess loss ${working.excessLossKg.toFixed(3)} kg vs ${n(ch.loss_norm_pct)}% norm`,
			debitPaise,
			staff.user_id
		]);
		await sql.query(`update job_work_challan_line set returned_pcs = returned_pcs + $1 where id = $2`, [taking, line.id]);
		const remaining = sentPcs - already - taking;
		await sql.query(`update job_work_challan set status = $1 where id = $2`, [remaining <= 5e-4 ? "CLOSED" : "PARTIAL", ch.id]);
		await sql.query(`insert into cost_variance (jw_return_id, kind, expected, actual, variance, notes)
         values ($1,'JW_LOSS',$2,$3,$4,$5)`, [
			ret.id,
			n(ch.loss_norm_pct),
			working.actualLossPct,
			working.actualLossPct - n(ch.loss_norm_pct),
			`excess ${working.excessLossKg} kg · DN ${dn}`
		]);
		const snap = mapDeliveryChallan({
			company,
			challan: {
				...partner,
				...ch,
				partner_name: partner.name,
				partner_gstin: partner.gstin,
				partner_addr: partner.address_line1
			},
			lines: [{
				sku: item.sku,
				item_name: item.name,
				qty_pcs: data.goodPcs + data.rejectPcs,
				qty_kg: roundKg(goodKg + rejectKg),
				hsn: line.hsn ?? item.hsn
			}],
			variant: "JW_RETURN",
			ret: {
				doc_no: docNo,
				good_pcs: data.goodPcs,
				reject_pcs: data.rejectPcs,
				short_pcs: data.shortPcs
			}
		});
		await saveDocSnapshot(sql, {
			userId: staff.user_id,
			entity: "job_work_return",
			entityId: ret.id,
			doc: snap
		});
		await audit(sql, {
			userId: staff.user_id,
			action: "JW_RETURN",
			entity: "job_work_return",
			entityId: ret.id,
			after: {
				working,
				good: data.goodPcs,
				reject: data.rejectPcs,
				short: data.shortPcs,
				dn
			}
		});
		return {
			docNo,
			debitNoteNo: dn,
			debitPaise,
			excessPcs,
			actualLossPct: working.actualLossPct,
			normPct: n(ch.loss_norm_pct),
			fgLotNo: fgLot?.lot_no ?? null,
			fgLotId: fgLot?.id ?? null,
			working,
			openKg: remaining <= 5e-4 ? 0 : roundKg(remaining / sentPcs * sentKg)
		};
	});
});
var receiveCustomerMetal_createServerFn_handler = createServerRpc({
	id: "dcafefd676d434c8ab10767c96d0d478ee0db47cf6e255a1baa57961479674da",
	name: "receiveCustomerMetal",
	filename: "src/lib/erp/api-jw.ts"
}, (opts) => receiveCustomerMetal.__executeServer(opts));
var receiveCustomerMetal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	partnerId: number(),
	itemId: number(),
	heatNo: string().min(1),
	qtyKg: number().positive(),
	qtyPcs: number().min(0).default(0)
})).handler(receiveCustomerMetal_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "jw");
	const sql = await erpSql();
	const item = (await sql.query(`select * from item where id = $1`, [data.itemId]))[0];
	if (!item) throw new Error("Item not found");
	if (!(await sql.query(`select * from partner where id = $1`, [data.partnerId]))[0]?.is_customer) throw new Error("JW-IN receive is customer metal only");
	const wh = await warehouseByCode(sql, "JW-IN-CUSTOMER");
	return withStockTx(sql, async () => {
		const lot = await createLot(sql, {
			itemId: item.id,
			warehouseId: wh.id,
			alloyId: item.alloy_id,
			heatNo: data.heatNo,
			qtyKg: 0,
			qtyPcs: 0,
			status: "AVAILABLE",
			ownerType: "CUSTOMER",
			ownerPartnerId: data.partnerId,
			unitValuePaisePerKg: 0,
			sourceType: "JW_IN"
		});
		await postMove(sql, {
			moveType: "JW_IN_RECEIVE",
			itemId: item.id,
			lotId: lot.id,
			warehouseId: wh.id,
			qtyKg: roundKg(data.qtyKg),
			qtyPcs: data.qtyPcs,
			refType: "JW_IN",
			userId: staff.user_id,
			alloyId: item.alloy_id,
			unitValuePaisePerKg: 0,
			itemAlloyId: item.alloy_id,
			notes: "Customer metal — value 0"
		});
		await audit(sql, {
			userId: staff.user_id,
			action: "JW_IN_RECEIVE",
			entity: "stock_lot",
			entityId: lot.id,
			after: {
				lotNo: lot.lot_no,
				qtyKg: data.qtyKg,
				partnerId: data.partnerId
			}
		});
		return {
			lotNo: lot.lot_no,
			lotId: lot.id,
			qtyKg: roundKg(data.qtyKg),
			valuePaise: 0
		};
	});
});
var consumeCustomerMetal_createServerFn_handler = createServerRpc({
	id: "5faca6e55e412aa96a3c0739aff6a9ddf5d2c96330d41520f86dbf04581a0d43",
	name: "consumeCustomerMetal",
	filename: "src/lib/erp/api-jw.ts"
}, (opts) => consumeCustomerMetal.__executeServer(opts));
var consumeCustomerMetal = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	lotId: number(),
	qtyKg: number().positive(),
	qtyPcs: number().min(0).default(0)
})).handler(consumeCustomerMetal_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "jw");
	const sql = await erpSql();
	const lot = await getLot(sql, data.lotId);
	if (lot.owner_type !== "CUSTOMER") throw new Error("Consume only customer-owned JW-IN lots");
	const wh = await warehouseByCode(sql, "JW-IN-CUSTOMER");
	if (lot.warehouse_id !== wh.id) throw new Error("Lot is not in JW-IN-CUSTOMER");
	return withStockTx(sql, async () => {
		await postMove(sql, {
			moveType: "JW_IN_CONSUME",
			itemId: lot.item_id,
			lotId: lot.id,
			warehouseId: lot.warehouse_id,
			qtyKg: -roundKg(data.qtyKg),
			qtyPcs: -data.qtyPcs,
			refType: "JW_IN",
			userId: staff.user_id,
			alloyId: lot.alloy_id,
			unitValuePaisePerKg: 0,
			itemAlloyId: lot.alloy_id,
			notes: "Consume customer metal — value stays 0"
		});
		return {
			lotNo: lot.lot_no,
			qtyKg: roundKg(data.qtyKg),
			valuePaise: 0
		};
	});
});
var returnCustomerFg_createServerFn_handler = createServerRpc({
	id: "98ef5f7cd6542123f51338b9ca1bd5a5026b44e28a8d4a436ab57b724dc88ce7",
	name: "returnCustomerFg",
	filename: "src/lib/erp/api-jw.ts"
}, (opts) => returnCustomerFg.__executeServer(opts));
var returnCustomerFg = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator(object({
	lotId: number(),
	qtyKg: number().positive(),
	qtyPcs: number().min(0).default(0)
})).handler(returnCustomerFg_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "jw");
	const sql = await erpSql();
	const lot = await getLot(sql, data.lotId);
	if (lot.owner_type !== "CUSTOMER") throw new Error("Return only customer-owned lots");
	return withStockTx(sql, async () => {
		await postMove(sql, {
			moveType: "JW_IN_RETURN",
			itemId: lot.item_id,
			lotId: lot.id,
			warehouseId: lot.warehouse_id,
			qtyKg: -roundKg(data.qtyKg),
			qtyPcs: -data.qtyPcs,
			refType: "JW_IN",
			userId: staff.user_id,
			alloyId: lot.alloy_id,
			unitValuePaisePerKg: 0,
			itemAlloyId: lot.alloy_id,
			notes: "Return leftover / FG to customer — value 0"
		});
		return {
			lotNo: lot.lot_no,
			qtyKg: roundKg(data.qtyKg),
			valuePaise: 0
		};
	});
});
var getChallanPrint_createServerFn_handler = createServerRpc({
	id: "7ed3a66492bd27b1e274017d88864301f385eea06578842b7f006e2fa638e3d0",
	name: "getChallanPrint",
	filename: "src/lib/erp/api-jw.ts"
}, (opts) => getChallanPrint.__executeServer(opts));
var getChallanPrint = createServerFn({ method: "GET" }).middleware([authMiddleware]).validator(object({ id: number() })).handler(getChallanPrint_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const company = (await sql.query(`select * from company limit 1`))[0];
	const challan = (await sql.query(`select c.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code
           from job_work_challan c join partner p on p.id = c.partner_id where c.id = $1`, [data.id]))[0];
	if (!challan) throw new Error("Challan not found");
	return {
		company,
		challan,
		lines: await sql.query(`select l.*, i.sku, i.name as item_name from job_work_challan_line l join item i on i.id = l.item_id where l.challan_id = $1`, [data.id])
	};
});
//#endregion
export { consumeCustomerMetal_createServerFn_handler, getChallanPrint_createServerFn_handler, issueJobWork_createServerFn_handler, receiveCustomerMetal_createServerFn_handler, returnCustomerFg_createServerFn_handler, returnJobWork_createServerFn_handler };
