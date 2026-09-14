import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as todayISO, n as authMiddleware, o as n$2 } from "./format-Bcy9062O.mjs";
import { a as nextDoc, i as erpSql, n as audit, o as requireStaff, s as setting, t as assertPerm } from "./core.server-BOQw3eDO.mjs";
import { _n as object, bn as string, dn as array, fn as boolean, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
import { t as uid } from "./row-CXk8IdOY.mjs";
import { n as loadMetalBook, r as quoteItem, t as assertRateDateNotFuture } from "./load-DNjC2Qxz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-planning-QaolYdc0.js
/**
* Capable-to-promise — honest, not APS. No drag-and-drop scheduler.
*/
function n$1(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
function addDays(iso, days) {
	const d = /* @__PURE__ */ new Date(iso + "T00:00:00Z");
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}
function computeAtp(input) {
	const qty = n$1(input.qtyPcs);
	const available = n$1(input.availableFgPcs) + n$1(input.openWoRemainingPcs) + n$1(input.jwPipelinePcs) - n$1(input.alreadyPromisedPcs);
	const availablePcs = Math.max(0, Math.round(available));
	const shortfallPcs = Math.max(0, Math.round(qty - availablePcs));
	const daily = Math.max(1, n$1(input.dailyPcs) || 1);
	const woRunDays = shortfallPcs > 0 ? Math.ceil(shortfallPcs / daily) : 0;
	const setupDays = shortfallPcs > 0 && n$1(input.setupMin) > 0 ? Math.max(1, Math.ceil(n$1(input.setupMin) / 480)) : 0;
	const leadDays = shortfallPcs <= 0 ? n$1(input.packDays) : n$1(input.purchaseLeadDays) + woRunDays + setupDays + n$1(input.jwDays) + n$1(input.packDays);
	const promiseDate = addDays(input.today ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10), leadDays);
	const working = [`Available FG ${n$1(input.availableFgPcs)} pcs + open WO remaining ${n$1(input.openWoRemainingPcs)} + JW pipeline ${n$1(input.jwPipelinePcs)} − already promised ${n$1(input.alreadyPromisedPcs)} = ${availablePcs} pcs`, `Order ${qty} pcs → shortfall ${shortfallPcs} pcs`];
	if (shortfallPcs <= 0) working.push(`Covered from stock/WIP. Pack ${n$1(input.packDays)} d → promise ${promiseDate}`);
	else {
		working.push(`Lead = purchase ${n$1(input.purchaseLeadDays)} d + WO run ${shortfallPcs}/${daily} = ${woRunDays} d + setup ${setupDays} d + JW ${n$1(input.jwDays)} d + pack ${n$1(input.packDays)} d = ${leadDays} d`);
		working.push(`Promise ${promiseDate}`);
	}
	return {
		availablePcs,
		shortfallPcs,
		woRunDays,
		setupDays,
		leadDays,
		promiseDate,
		working,
		canPromiseFromStock: shortfallPcs <= 0
	};
}
function assertOverrideReason(dateChanged, reason) {
	if (dateChanged && !String(reason ?? "").trim()) throw new Error("Overriding the computed promise date needs a reason");
}
/**
* Weekly MRP — explode approved BOM for new demand; frozen WO BOM for released WOs.
* Forecast only if demand_forecast has rows. Time fence: do not cancel released WOs inside it.
*/
function n(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
function roundKg(v) {
	return Math.round(v * 1e3) / 1e3;
}
function netRequirement(item) {
	const demand = n(item.soDemandQty) + n(item.forecastQty) + n(item.safetyQty);
	const supply = n(item.availableQty) + n(item.openWoQty) + n(item.openPoQty) + n(item.jwPipelineQty);
	const shortfall = roundKg(Math.max(0, demand - supply));
	let action = "NONE";
	let suggested = 0;
	if (shortfall > 5e-4) {
		if (item.type === "RM") action = "CREATE_PO";
		else if (item.type === "FG" || item.type === "SFG") action = "CREATE_WO";
		else action = "NONE";
		suggested = shortfall;
	} else if (item.releasedWoInsideFence) action = "NONE";
	else if (n(item.extraReleasedQty) > 0 && n(item.openWoQty) > demand) action = "NONE";
	if (shortfall > 5e-4 && item.releasedWoInsideFence && item.type !== "RM") {
		action = "EXPEDITE_WO";
		suggested = shortfall;
	}
	return {
		itemId: item.itemId,
		sku: item.sku,
		type: item.type,
		qtyUom: item.uom,
		demandQty: roundKg(demand),
		supplyQty: roundKg(supply),
		availableQty: roundKg(n(item.availableQty)),
		openWoQty: roundKg(n(item.openWoQty)),
		openPoQty: roundKg(n(item.openPoQty)),
		jwPipelineQty: roundKg(n(item.jwPipelineQty)),
		shortfallQty: shortfall,
		action,
		suggestedQty: suggested,
		pegging: `SO ${n(item.soDemandQty)} + safety ${n(item.safetyQty)} + forecast ${n(item.forecastQty)} vs avail ${n(item.availableQty)} + WO ${n(item.openWoQty)} + PO ${n(item.openPoQty)} + JW ${n(item.jwPipelineQty)}`
	};
}
function explodeDemand(parentQty, bom) {
	return bom.filter((b) => !b.isCoProduct).map((b) => ({
		itemId: b.componentItemId,
		qty: roundKg(parentQty * n(b.qtyPer)),
		uom: b.uom
	}));
}
function wcLoadPct(openWoMinutes, weeklyMinutes) {
	const cap = n(weeklyMinutes);
	if (cap <= 0) return 0;
	return Math.round(n(openWoMinutes) / cap * 1e3) / 10;
}
var auth = [authMiddleware];
var previewQuote_createServerFn_handler = createServerRpc({
	id: "8d2588cdb49a007ff3295aba730c1235a3d10f66e23b246d12c162797a8af033",
	name: "previewQuote",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => previewQuote.__executeServer(opts));
var previewQuote = createServerFn({ method: "GET" }).middleware(auth).validator(object({
	itemId: number(),
	asOf: string().optional(),
	basis: _enum(["CU_ZN_BLEND", "ALLOY_DEALER_RATE"]).optional(),
	marginPct: number().optional()
})).handler(previewQuote_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const asOf = data.asOf || todayISO();
	assertRateDateNotFuture(asOf, todayISO());
	return await quoteItem(sql, {
		itemId: data.itemId,
		asOf,
		basis: data.basis,
		marginPct: data.marginPct
	});
});
async function atpParts(sql, itemId, excludeSoLineId) {
	const fg = (await sql.query(`select coalesce(sum(l.qty_pcs),0) as pcs
         from stock_lot l join warehouse w on w.id = l.warehouse_id
        where l.item_id = $1 and l.status = 'AVAILABLE' and l.owner_type = 'OWN'
          and w.kind in ('FG','SFG') and w.is_customer_owned = false`, [itemId]))[0];
	const wo = (await sql.query(`select coalesce(sum(qty_pcs - good_pcs - reject_pcs),0) as pcs
         from work_order where item_id = $1 and status in ('OPEN','ISSUED','DRAFT')`, [itemId]))[0];
	const jw = (await sql.query(`select coalesce(sum(l.qty_pcs - l.returned_pcs),0) as pcs
         from job_work_challan_line l
         join job_work_challan c on c.id = l.challan_id
        where l.item_id = $1 and c.status <> 'CLOSED'`, [itemId]))[0];
	const promised = (await sql.query(`select coalesce(sum(qty_pcs - qty_dispatched - reserved_pcs),0) as pcs
         from so_line sl join sales_order so on so.id = sl.so_id
        where sl.item_id = $1 and so.status in ('OPEN','PARTIAL')
          and ($2::int is null or sl.id <> $2)`, [itemId, excludeSoLineId ?? null]))[0];
	const item = (await sql.query(`select daily_pcs, purchase_lead_days, jw_days, pack_days from item where id = $1`, [itemId]))[0];
	const setup = (await sql.query(`select coalesce(max(ro.setup_min),0)::int as setup_min
         from routing r join routing_op ro on ro.routing_id = r.id
        where r.item_id = $1`, [itemId]))[0];
	return {
		availableFgPcs: n$2(fg?.pcs),
		openWoRemainingPcs: Math.max(0, n$2(wo?.pcs)),
		jwPipelinePcs: n$2(jw?.pcs),
		alreadyPromisedPcs: Math.max(0, n$2(promised?.pcs)),
		dailyPcs: n$2(item?.daily_pcs) || 1600,
		purchaseLeadDays: item?.purchase_lead_days ?? 7,
		jwDays: item?.jw_days ?? 14,
		packDays: item?.pack_days ?? 1,
		setupMin: setup?.setup_min ?? 0
	};
}
var promiseSoLine_createServerFn_handler = createServerRpc({
	id: "9e27f6e7b07154da3964f8fc8518ddeedf8816dab797e4991aad028d4f3ee9b9",
	name: "promiseSoLine",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => promiseSoLine.__executeServer(opts));
var promiseSoLine = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	soLineId: number(),
	overrideDate: string().optional(),
	overrideReason: string().optional(),
	allocateLotId: number().optional()
})).handler(promiseSoLine_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "sales");
	const sql = await erpSql();
	const line = (await sql.query(`select * from so_line where id = $1`, [data.soLineId]))[0];
	if (!line) throw new Error("SO line not found");
	const parts = await atpParts(sql, line.item_id, line.id);
	const atp = computeAtp({
		qtyPcs: n$2(line.qty_pcs) - n$2(line.qty_dispatched),
		...parts,
		today: todayISO()
	});
	let promiseDate = atp.promiseDate;
	if (data.overrideDate && data.overrideDate !== atp.promiseDate) {
		assertOverrideReason(true, data.overrideReason);
		promiseDate = data.overrideDate;
	}
	if (data.allocateLotId) {
		const lot = (await sql.query(`select id, item_id, qty_pcs, reserved_so_line_id, status from stock_lot where id = $1`, [data.allocateLotId]))[0];
		if (!lot || lot.item_id !== line.item_id) throw new Error("Lot does not match SO item");
		if (lot.status !== "AVAILABLE") throw new Error("Lot is not AVAILABLE");
		if (lot.reserved_so_line_id && lot.reserved_so_line_id !== line.id) throw new Error("Lot is reserved to another SO — cannot allocate");
		await sql.query(`update stock_lot set reserved_so_line_id = $1, reserved_pcs = $2 where id = $3`, [
			line.id,
			n$2(line.qty_pcs),
			lot.id
		]);
		await sql.query(`update so_line set reserved_lot_id = $1, reserved_pcs = $2 where id = $3`, [
			lot.id,
			n$2(line.qty_pcs),
			line.id
		]);
	}
	await sql.query(`update so_line set promise_date = $1, promise_working = $2, promise_override_reason = $3 where id = $4`, [
		promiseDate,
		atp.working.join("\n"),
		data.overrideReason ?? null,
		line.id
	]);
	return {
		promiseDate,
		atp
	};
});
var getAtp_createServerFn_handler = createServerRpc({
	id: "43248dcfddce37e797ddb633de61f255995c538df6d2c3cca24152e86e73974d",
	name: "getAtp",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => getAtp.__executeServer(opts));
var getAtp = createServerFn({ method: "GET" }).middleware(auth).validator(object({ soLineId: number() })).handler(getAtp_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const line = (await sql.query(`select * from so_line where id = $1`, [data.soLineId]))[0];
	if (!line) throw new Error("SO line not found");
	const parts = await atpParts(sql, line.item_id, data.soLineId);
	return {
		atp: computeAtp({
			qtyPcs: n$2(line.qty_pcs) - n$2(line.qty_dispatched),
			...parts,
			today: todayISO()
		}),
		savedDate: line.promise_date,
		savedWorking: line.promise_working,
		override: line.promise_override_reason
	};
});
var runMrp_createServerFn_handler = createServerRpc({
	id: "ca57eafea7aeccac3b05d7e28bf76b65d74a0b1502290d5cd168b343bedcf63a",
	name: "runMrp",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => runMrp.__executeServer(opts));
var runMrp = createServerFn({ method: "POST" }).middleware(auth).validator(object({ horizonDays: number().default(14) })).handler(runMrp_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	if (staff.role !== "OWNER" && staff.role !== "PPC" && staff.role !== "ADMIN") throw new Error("Only PPC / Owner can run MRP");
	const sql = await erpSql();
	const horizon = data.horizonDays === 42 ? 42 : 14;
	const fence = n$2(await setting(sql, "mrp_time_fence_days", "3"));
	const runNo = await nextDoc(sql, "MRP");
	const run = (await sql.query(`insert into mrp_run (run_no, horizon_days, time_fence_days, user_id) values ($1,$2,$3,$4) returning id`, [
		runNo,
		horizon,
		fence,
		staff.user_id
	]))[0];
	const items = await sql.query(`select id, sku, type, stock_uom, safety_stock_pcs, min_qty_kg from item where active = true and type in ('FG','RM')`);
	const supplies = [];
	const extraRod = /* @__PURE__ */ new Map();
	for (const it of items.filter((i) => i.type === "FG")) {
		const soDem = (await sql.query(`select coalesce(sum(sl.qty_pcs - sl.qty_dispatched),0) as q
             from so_line sl join sales_order so on so.id = sl.so_id
            where sl.item_id = $1 and so.status in ('OPEN','PARTIAL')
              and so.order_date <= current_date + ($2 || ' days')::interval`, [it.id, horizon]))[0];
		const fc = (await sql.query(`select coalesce(sum(qty_pcs),0) as q from demand_forecast
            where item_id = $1 and week_start <= current_date + ($2 || ' days')::interval`, [it.id, horizon]))[0];
		const avail = (await sql.query(`select coalesce(sum(qty_pcs),0) as q from stock_lot l
             join warehouse w on w.id = l.warehouse_id
            where l.item_id = $1 and l.status = 'AVAILABLE' and l.owner_type = 'OWN'
              and w.kind in ('FG','SFG')`, [it.id]))[0];
		const wo = (await sql.query(`select coalesce(sum(qty_pcs - good_pcs - reject_pcs),0) as q,
                  bool_or(status in ('ISSUED','OPEN') and coalesce(due_date, current_date) <= current_date + ($2 || ' days')::interval) as fence
             from work_order where item_id = $1 and status in ('OPEN','ISSUED','DRAFT')`, [it.id, fence]))[0];
		const jw = (await sql.query(`select coalesce(sum(l.qty_pcs - l.returned_pcs),0) as q
             from job_work_challan_line l join job_work_challan c on c.id = l.challan_id
            where l.item_id = $1 and c.status <> 'CLOSED'
              and coalesce(c.expected_return_at, current_date) <= current_date + ($2 || ' days')::interval`, [it.id, horizon]))[0];
		const row = netRequirement({
			itemId: it.id,
			sku: it.sku,
			type: it.type,
			uom: "PCS",
			safetyQty: n$2(it.safety_stock_pcs),
			availableQty: n$2(avail?.q),
			openWoQty: n$2(wo?.q),
			openPoQty: 0,
			jwPipelineQty: n$2(jw?.q),
			soDemandQty: n$2(soDem?.q),
			forecastQty: n$2(fc?.q),
			releasedWoInsideFence: Boolean(wo?.fence),
			extraReleasedQty: 0
		});
		supplies.push({
			itemId: it.id,
			sku: it.sku,
			type: it.type,
			uom: "PCS",
			safetyQty: n$2(it.safety_stock_pcs),
			availableQty: n$2(avail?.q),
			openWoQty: n$2(wo?.q),
			openPoQty: 0,
			jwPipelineQty: n$2(jw?.q),
			soDemandQty: n$2(soDem?.q),
			forecastQty: n$2(fc?.q),
			releasedWoInsideFence: Boolean(wo?.fence),
			extraReleasedQty: 0
		});
		if (row.action === "CREATE_WO" || row.action === "EXPEDITE_WO") {
			const bom = await sql.query(`select bl.component_item_id, bl.qty_per, bl.qty_uom, bl.is_co_product
             from bom b join bom_line bl on bl.bom_id = b.id
            where b.item_id = $1 and b.status = 'APPROVED'`, [it.id]);
			for (const nline of explodeDemand(row.suggestedQty, bom.map((b) => ({
				componentItemId: b.component_item_id,
				qtyPer: n$2(b.qty_per),
				uom: b.qty_uom,
				isCoProduct: b.is_co_product
			})))) extraRod.set(nline.itemId, (extraRod.get(nline.itemId) ?? 0) + nline.qty);
		}
		await insertMrpLine(sql, run.id, row, n$2(soDem?.q) > 0 ? void 0 : void 0);
	}
	for (const it of items.filter((i) => i.type === "RM")) {
		const avail = (await sql.query(`select coalesce(sum(qty_kg),0) as q from stock_lot
            where item_id = $1 and status = 'AVAILABLE' and owner_type = 'OWN'`, [it.id]))[0];
		const po = (await sql.query(`select coalesce(sum(qty_kg - received_kg),0) as q from po_line pl
             join purchase_order p on p.id = pl.po_id
            where pl.item_id = $1 and p.status in ('OPEN','PARTIAL','DRAFT')`, [it.id]))[0];
		const exploded = extraRod.get(it.id) ?? 0;
		const row = netRequirement({
			itemId: it.id,
			sku: it.sku,
			type: "RM",
			uom: "KG",
			safetyQty: n$2(it.min_qty_kg),
			availableQty: n$2(avail?.q),
			openWoQty: 0,
			openPoQty: n$2(po?.q),
			jwPipelineQty: 0,
			soDemandQty: exploded,
			forecastQty: 0,
			releasedWoInsideFence: false,
			extraReleasedQty: 0
		});
		await insertMrpLine(sql, run.id, row);
	}
	const lines = await sql.query(`select ml.*, i.sku, i.name as item_name, i.type as item_type
         from mrp_line ml join item i on i.id = ml.item_id
        where ml.run_id = $1 order by i.type, i.sku`, [run.id]);
	await audit(sql, {
		userId: staff.user_id,
		action: "MRP_RUN",
		entity: "mrp_run",
		entityId: run.id,
		after: {
			runNo,
			horizon
		}
	});
	return {
		id: run.id,
		runNo,
		horizonDays: horizon,
		lines
	};
});
async function insertMrpLine(sql, runId, row, pegSo) {
	await sql.query(`insert into mrp_line (
       run_id, item_id, demand_qty, supply_qty, available_qty, open_wo_qty, open_po_qty, jw_pipeline_qty,
       shortfall_qty, qty_uom, action, suggested_qty, pegging_json, pegging_so_id
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [
		runId,
		row.itemId,
		row.demandQty,
		row.supplyQty,
		row.availableQty,
		row.openWoQty,
		row.openPoQty,
		row.jwPipelineQty,
		row.shortfallQty,
		row.qtyUom,
		row.action,
		row.suggestedQty,
		row.pegging,
		pegSo ?? null
	]);
}
var listMrp_createServerFn_handler = createServerRpc({
	id: "e8f908e45e6a6778e63ce00cf40821621671360283d6f332bea70acc1734427a",
	name: "listMrp",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => listMrp.__executeServer(opts));
var listMrp = createServerFn({ method: "GET" }).middleware(auth).handler(listMrp_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const runs = await sql.query(`select * from mrp_run order by id desc limit 8`);
	const latest = runs[0];
	return {
		runs,
		latest,
		lines: latest ? await sql.query(`select ml.*, i.sku, i.name as item_name, i.type as item_type
             from mrp_line ml join item i on i.id = ml.item_id
            where ml.run_id = $1 order by i.type, i.sku`, [latest.id]) : [],
		load: (await sql.query(`select wc.code, wc.name, wc.weekly_minutes, wc.queue_days,
              coalesce((
                select sum(wo.qty_pcs * ro.run_sec_per_pc / 60.0 + ro.setup_min)
                  from work_order wo
                  join routing r on r.item_id = wo.item_id
                  join routing_op ro on ro.routing_id = r.id and ro.work_center_id = wc.id
                 where wo.status in ('OPEN','ISSUED')
              ),0) as open_minutes
         from work_center wc order by wc.id`)).map((w) => ({
			code: w.code,
			name: w.name,
			weekly_minutes: w.weekly_minutes,
			queue_days: w.queue_days,
			open_minutes: w.open_minutes,
			load_pct: wcLoadPct(n$2(w.open_minutes), n$2(w.weekly_minutes))
		}))
	};
});
var applyMrpDrafts_createServerFn_handler = createServerRpc({
	id: "c7e1b65b41698a557c55875ba5f1196e51c498c45c8a9788fa139479128edfdd",
	name: "applyMrpDrafts",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => applyMrpDrafts.__executeServer(opts));
var applyMrpDrafts = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	runId: number(),
	lineIds: array(number())
})).handler(applyMrpDrafts_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	if (staff.role !== "OWNER" && staff.role !== "PPC" && staff.role !== "ADMIN") throw new Error("Only PPC / Owner can spawn drafts");
	const sql = await erpSql();
	const created = [];
	for (const id of data.lineIds) {
		const ln = (await sql.query(`select * from mrp_line where id = $1 and run_id = $2`, [id, data.runId]))[0];
		if (!ln) continue;
		if (ln.action === "CREATE_WO") {
			const bom = (await sql.query(`select id from bom where item_id = $1 and status = 'APPROVED' limit 1`, [ln.item_id]))[0];
			const docNo = await nextDoc(sql, "WO");
			const wo = (await sql.query(`insert into work_order (doc_no, item_id, bom_id, qty_pcs, required_kg, status, created_by, due_date)
             values ($1,$2,$3,$4,$5,'DRAFT',$6, current_date + 14) returning id`, [
				docNo,
				ln.item_id,
				bom?.id ?? null,
				n$2(ln.suggested_qty),
				0,
				staff.user_id
			]))[0];
			await sql.query(`update mrp_line set selected = true, draft_doc_type = 'WO', draft_doc_id = $1 where id = $2`, [wo.id, ln.id]);
			created.push({
				kind: "WO",
				docNo
			});
		} else if (ln.action === "CREATE_PO") {
			const vendor = (await sql.query(`select id from partner where is_vendor = true and is_job_worker = false order by id limit 1`))[0];
			if (!vendor) continue;
			const docNo = await nextDoc(sql, "PO");
			const po = (await sql.query(`insert into purchase_order (doc_no, partner_id, status, order_date, notes, created_by)
             values ($1,$2,'DRAFT', current_date, 'MRP draft — not posted', $3) returning id`, [
				docNo,
				vendor.id,
				staff.user_id
			]))[0];
			await sql.query(`insert into po_line (po_id, item_id, qty_kg, rate_paise_per_kg) values ($1,$2,$3,62000)`, [
				po.id,
				ln.item_id,
				n$2(ln.suggested_qty)
			]);
			await sql.query(`update mrp_line set selected = true, draft_doc_type = 'PO', draft_doc_id = $1 where id = $2`, [po.id, ln.id]);
			created.push({
				kind: "PO",
				docNo
			});
		} else if (ln.action === "CREATE_JW") {
			const worker = (await sql.query(`select id from partner where is_job_worker = true order by id limit 1`))[0];
			if (!worker) continue;
			const docNo = await nextDoc(sql, "JW");
			const jw = (await sql.query(`insert into job_work_order (doc_no, partner_id, process_code, status, loss_norm_pct)
             values ($1,$2,'NI_CR','DRAFT',1.5) returning id`, [docNo, worker.id]))[0];
			await sql.query(`update mrp_line set selected = true, draft_doc_type = 'JW', draft_doc_id = $1 where id = $2`, [jw.id, ln.id]);
			created.push({
				kind: "JW",
				docNo
			});
		}
	}
	return { created };
});
var variancePack_createServerFn_handler = createServerRpc({
	id: "a9234d7214edfb4e0aafff6f2ee9a7e374b7e487fc77b81b602979cb3707d338",
	name: "variancePack",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => variancePack.__executeServer(opts));
var variancePack = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	from: string(),
	to: string(),
	freeze: boolean().default(false)
})).handler(variancePack_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "invoice");
	const sql = await erpSql();
	const yieldRows = await sql.query(`select wo.id as wo_id, wo.doc_no, wo.issued_kg, wo.scrap_kg, wo.good_pcs, i.kg_per_pc, i.sku
         from work_order wo join item i on i.id = wo.item_id
        where wo.created_at::date between $1 and $2`, [data.from, data.to]);
	const jwRows = await sql.query(`select x.*, r.doc_no, c.doc_no as challan_no
         from job_work_loss x
         join job_work_return r on r.id = x.return_id
         join job_work_challan c on c.id = x.challan_id
        where r.returned_at::date between $1 and $2`, [data.from, data.to]);
	const metalRows = await sql.query(`select m.ref_id, sum(m.qty_kg) as kg, avg(l.unit_value_paise_per_kg)::int as lot_rate
         from stock_move m join stock_lot l on l.id = m.lot_id
        where m.move_type in ('WO_ISSUE','ISSUE') and m.posted_at::date between $1 and $2
        group by m.ref_id`, [data.from, data.to]);
	const book = await loadMetalBook(sql, data.to).catch(() => null);
	const pack = {
		yield: yieldRows.map((w) => {
			const theoretical = n$2(w.good_pcs) * n$2(w.kg_per_pc);
			const actual = n$2(w.issued_kg) - n$2(w.scrap_kg);
			return {
				kind: "YIELD",
				wo: w.doc_no,
				expected: theoretical,
				actual,
				variance: actual - theoretical,
				notes: `${w.sku} issued ${w.issued_kg} − scrap ${w.scrap_kg} vs ${w.good_pcs}×${w.kg_per_pc}`
			};
		}),
		jwLoss: jwRows.map((x) => ({
			kind: "JW_EXCESS",
			doc: x.doc_no,
			expected: n$2(x.norm_pct),
			actual: n$2(x.actual_loss_pct),
			variance: n$2(x.excess_kg),
			value_paise: n$2(x.debit_paise),
			notes: `${x.challan_no} DN ${x.debit_note_no}`
		})),
		metal: metalRows.map((m) => ({
			kind: "METAL_PRICE",
			ref: m.ref_id,
			expected: book?.cuPaisePerKg ?? 0,
			actual: n$2(m.lot_rate),
			variance: n$2(m.lot_rate) - (book?.cuPaisePerKg ?? 0),
			notes: `${m.kg} kg issued at lot rate vs book Cu`
		}))
	};
	if (data.freeze) {
		for (const group of [
			pack.yield,
			pack.jwLoss,
			pack.metal
		]) for (const r of group) await sql.query(`insert into cost_variance (kind, expected, actual, variance, notes, period_from, period_to, frozen, frozen_at, value_paise)
             values ($1,$2,$3,$4,$5,$6,$7,true, now(), $8)`, [
			r.kind,
			r.expected,
			r.actual,
			r.variance,
			r.notes,
			data.from,
			data.to,
			"value_paise" in r ? r.value_paise : 0
		]);
		await audit(sql, {
			userId: staff.user_id,
			action: "VARIANCE_CLOSE",
			entity: "cost_variance",
			entityId: `${data.from}:${data.to}`,
			after: {
				from: data.from,
				to: data.to
			}
		});
	}
	return {
		pack,
		frozen: data.freeze
	};
});
var getRoleBoard_createServerFn_handler = createServerRpc({
	id: "e7f7c64dbd74e0393372c7f0a74eb92d4bc6c2ed7f90ef341822366009b9b567",
	name: "getRoleBoard",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => getRoleBoard.__executeServer(opts));
var getRoleBoard = createServerFn({ method: "GET" }).middleware(auth).handler(getRoleBoard_createServerFn_handler, async ({ context }) => {
	const staff = await requireStaff(uid(context));
	const sql = await erpSql();
	const role = staff.role;
	const ageing = await sql.query(`select c.id, c.doc_no, p.name as partner,
              floor(extract(epoch from (now() - c.issued_at)) / 86400)::int as age_days,
              c.statutory_due, c.status
         from job_work_challan c join partner p on p.id = c.partner_id
        where c.status <> 'CLOSED' order by c.issued_at`);
	const aged270 = ageing.filter((a) => n$2(a.age_days) >= 270);
	const billed = (await sql.query(`select
           coalesce((select sum(sl.qty_pcs * sl.unit_price_paise) from so_line sl join sales_order so on so.id = sl.so_id where so.order_date >= current_date - 30),0) as booked,
           coalesce((select sum(total_paise) from sales_invoice where invoice_date >= current_date - 30 and status = 'POSTED'),0) as invoiced`))[0];
	const otif = (await sql.query(`select count(*)::int as n,
                count(*) filter (where sl.qty_dispatched >= sl.qty_pcs and (sl.promise_date is null or inv.invoice_date <= sl.promise_date))::int as ok
           from so_line sl
           join sales_order so on so.id = sl.so_id
           left join sales_invoice inv on inv.so_id = so.id
          where so.order_date >= current_date - 30`))[0];
	const value = (await sql.query(`select
           coalesce(sum(case when l.owner_type = 'OWN' and w.valuation_eligible and w.code <> 'JW-IN-CUSTOMER' then l.qty_kg * l.unit_value_paise_per_kg else 0 end),0)::bigint as v,
           coalesce(sum(case when w.is_outside_factory then l.qty_kg else 0 end),0) as jw
         from stock_lot l join warehouse w on w.id = l.warehouse_id`))[0];
	const ar = (await sql.query(`select coalesce(sum(total_paise),0)::bigint as ar from sales_invoice where status = 'POSTED'`))[0];
	const yieldVar = (await sql.query(`select variance, notes from cost_variance where kind = 'YIELD' order by id desc limit 1`))[0];
	const jwLoss = (await sql.query(`select coalesce(sum(debit_paise),0)::bigint as debit from job_work_loss where debit_status = 'DRAFT'`))[0];
	const latest = (await sql.query(`select id, run_no, horizon_days, run_at from mrp_run order by id desc limit 1`))[0];
	const shortages = latest ? await sql.query(`select ml.id, ml.action, ml.shortfall_qty, i.sku from mrp_line ml join item i on i.id = ml.item_id
            where ml.run_id = $1 and ml.action <> 'NONE' order by ml.shortfall_qty desc`, [latest.id]) : [];
	const wosWeek = await sql.query(`select wo.id, wo.doc_no, wo.due_date, i.sku from work_order wo join item i on i.id = wo.item_id
        where wo.status in ('OPEN','ISSUED','DRAFT')
          and coalesce(wo.due_date, current_date) <= current_date + 7
        order by wo.due_date nulls last`);
	const noPromise = await sql.query(`select so.doc_no, so.id, i.sku from sales_order so
         join so_line sl on sl.so_id = so.id join item i on i.id = sl.item_id
        where so.status in ('OPEN','PARTIAL') and sl.promise_date is null`);
	const load = await sql.query(`select wc.code, wc.name, wc.weekly_minutes, wc.queue_days,
              coalesce((
                select sum(wo.qty_pcs * ro.run_sec_per_pc / 60.0 + ro.setup_min)
                  from work_order wo
                  join routing r on r.item_id = wo.item_id
                  join routing_op ro on ro.routing_id = r.id and ro.work_center_id = wc.id
                 where wo.status in ('OPEN','ISSUED')
              ),0) as open_minutes
         from work_center wc`);
	const qcPending = await sql.query(`select q.doc_no, l.lot_no, i.sku, l.qty_kg, l.status
         from quality_inspection q join stock_lot l on l.id = q.lot_id join item i on i.id = l.item_id
        where q.result = 'PENDING'`);
	const hold = await sql.query(`select l.lot_no, i.sku, l.qty_kg, l.qty_pcs, w.code as warehouse
         from stock_lot l join item i on i.id = l.item_id join warehouse w on w.id = l.warehouse_id
        where l.status in ('QUARANTINE','HOLD') and (l.qty_kg > 0 or l.qty_pcs > 0)`);
	const below = await sql.query(`select i.sku, i.min_qty_kg, coalesce(sum(l.qty_kg),0) as kg
         from item i left join stock_lot l on l.item_id = i.id and l.status = 'AVAILABLE' and l.owner_type = 'OWN'
        where i.type = 'RM'
        group by i.id
       having coalesce(sum(l.qty_kg),0) < i.min_qty_kg and i.min_qty_kg > 0`);
	const due = await sql.query(`select c.doc_no, c.expected_return_at, p.name as partner
         from job_work_challan c join partner p on p.id = c.partner_id
        where c.status <> 'CLOSED' and c.expected_return_at <= current_date + 3`);
	const quarantine = await sql.query(`select l.lot_no, i.sku, l.status, w.code as warehouse, l.qty_kg, l.qty_pcs
         from stock_lot l join item i on i.id = l.item_id join warehouse w on w.id = l.warehouse_id
        where l.status = 'QUARANTINE' and (l.qty_kg > 0 or l.qty_pcs > 0)`);
	const ncr = await sql.query(`select id, doc_no, description, status from ncr where status = 'OPEN' order by id desc`);
	const poLines = await sql.query(`select ml.id, ml.suggested_qty, i.sku from mrp_line ml join item i on i.id = ml.item_id
        join mrp_run r on r.id = ml.run_id
       where ml.action = 'CREATE_PO' and r.id = (select max(id) from mrp_run)`);
	const lastGrn = await sql.query(`select g.doc_no, g.grn_date, i.sku, l.net_kg, p.name as partner
         from grn g join grn_line l on l.grn_id = g.id join item i on i.id = l.item_id
         join partner p on p.id = g.partner_id
        order by g.id desc limit 8`);
	const expiring = await sql.query(`select q.doc_no, q.valid_until, p.name as partner
         from quotation q join partner p on p.id = q.partner_id
        where q.status in ('SENT','DRAFT') and q.valid_until <= current_date + 7
        order by q.valid_until`);
	const blocked = await sql.query(`select so.doc_no, p.name as partner from sales_order so join partner p on p.id = so.partner_id
        where so.credit_blocked = true`);
	const late = await sql.query(`select so.doc_no, sl.promise_date, i.sku, sl.qty_pcs, sl.qty_dispatched
         from so_line sl join sales_order so on so.id = sl.so_id join item i on i.id = sl.item_id
        where so.status in ('OPEN','PARTIAL') and sl.promise_date is not null and sl.promise_date < current_date
          and sl.qty_dispatched < sl.qty_pcs`);
	const unbilled = await sql.query(`select l.lot_no, i.sku, l.qty_pcs, w.code as warehouse
         from stock_lot l join item i on i.id = l.item_id join warehouse w on w.id = l.warehouse_id
        where i.type = 'FG' and l.status = 'AVAILABLE' and w.kind in ('FG','SFG')
          and l.id not in (select lot_id from sales_invoice_line where lot_id is not null)`);
	const unmatched = await sql.query(`select g.doc_no, g.grn_date, p.name as partner
         from grn g join partner p on p.id = g.partner_id
        where g.po_id is null order by g.id desc`);
	const dns = await sql.query(`select doc_no, original_invoice_no, total_paise, status from credit_debit_note where status = 'DRAFT'`);
	const shopWos = await sql.query(`select wo.id, wo.doc_no, wo.qty_pcs, wo.status, i.sku from work_order wo join item i on i.id = wo.item_id
        where wo.status in ('OPEN','ISSUED') order by wo.id desc`);
	const scrap = (await sql.query(`select coalesce(sum(scrap_kg),0) as scrap, coalesce(sum(issued_kg),0) as issued
           from work_order where created_at::date = current_date - 1`))[0];
	return {
		role,
		owner: {
			bookedPaise: n$2(billed?.booked),
			invoicedPaise: n$2(billed?.invoiced),
			otif: otif && n$2(otif.n) ? Math.round(n$2(otif.ok) / n$2(otif.n) * 100) : null,
			otifN: n$2(otif?.n),
			jwKg: n$2(value?.jw),
			inventoryPaise: n$2(value?.v),
			openArPaise: n$2(ar?.ar),
			yield: yieldVar ? {
				variance: n$2(yieldVar.variance),
				notes: String(yieldVar.notes ?? "")
			} : null,
			jwLossPaise: n$2(jwLoss?.debit),
			aged270
		},
		ppc: {
			latestRun: latest ?? null,
			shortages,
			wosThisWeek: wosWeek,
			ageing,
			noPromise,
			bottleneck: load.map((w) => ({
				code: String(w.code),
				name: String(w.name ?? ""),
				weekly_minutes: n$2(w.weekly_minutes),
				queue_days: n$2(w.queue_days),
				open_minutes: n$2(w.open_minutes),
				load_pct: wcLoadPct(n$2(w.open_minutes), n$2(w.weekly_minutes))
			})),
			emptyMrp: latest ? null : "No planning run yet"
		},
		stores: {
			grnQc: qcPending,
			hold,
			belowMin: below,
			jwDue: due,
			emptyQc: qcPending.length ? null : "No GRN pending QC",
			emptyHold: hold.length ? null : "No lots on HOLD"
		},
		qc: {
			quarantine,
			ncr,
			emptyQ: quarantine.length ? null : "No lots in QUARANTINE",
			emptyNcr: ncr.length ? null : "No open NCR"
		},
		purchase: {
			createPo: poLines,
			lastGrn,
			emptyPo: latest ? poLines.length ? null : "No CREATE_PO lines" : "No planning run yet"
		},
		sales: {
			expiring,
			blocked,
			late,
			emptyExp: expiring.length ? null : "No quotes expiring in 7 days",
			emptyBlocked: blocked.length ? null : "No credit-blocked SO",
			emptyLate: late.length ? null : "No late SO"
		},
		accounts: {
			unbilled,
			unmatchedGrn: unmatched,
			aged270,
			draftDn: dns,
			emptyUnbilled: unbilled.length ? null : "No unbilled FG receipts",
			emptyDn: dns.length ? null : "No draft debit notes"
		},
		shop: {
			openWos: shopWos,
			yesterdayScrapKg: n$2(scrap?.scrap),
			yesterdayIssuedKg: n$2(scrap?.issued),
			emptyWo: shopWos.length ? null : "No open work orders"
		}
	};
});
var listJourneyRuns_createServerFn_handler = createServerRpc({
	id: "db704aa60cd7c4b8e5b57ad19819ae4c8dbc8a8c76eb36a73481b0716194a5be",
	name: "listJourneyRuns",
	filename: "src/lib/erp/api-planning.ts"
}, (opts) => listJourneyRuns.__executeServer(opts));
var listJourneyRuns = createServerFn({ method: "GET" }).middleware(auth).handler(listJourneyRuns_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	let reportJson = null;
	try {
		const { readFile } = await import("node:fs/promises");
		const { join } = await import("node:path");
		reportJson = await readFile(join(process.cwd(), "artifacts/journeys-last.json"), "utf8");
	} catch {
		reportJson = null;
	}
	const dbRuns = await sql.query(`select * from journey_run order by id desc limit 8`);
	return {
		reportJson,
		dbRuns
	};
});
//#endregion
export { applyMrpDrafts_createServerFn_handler, getAtp_createServerFn_handler, getRoleBoard_createServerFn_handler, listJourneyRuns_createServerFn_handler, listMrp_createServerFn_handler, previewQuote_createServerFn_handler, promiseSoLine_createServerFn_handler, runMrp_createServerFn_handler, variancePack_createServerFn_handler };
