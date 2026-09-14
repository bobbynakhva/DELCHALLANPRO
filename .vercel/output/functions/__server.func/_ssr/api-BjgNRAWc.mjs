import { r as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
import { c as todayISO, n as authMiddleware, o as n, s as roundKg } from "./format-Bcy9062O.mjs";
import { a as nextDoc, i as erpSql, n as audit, o as requireStaff, s as setting, t as assertPerm } from "./core.server-BOQw3eDO.mjs";
import { t as assertPeriodAllows } from "./journal-CdeDVFjA.mjs";
import { _n as object, bn as string, ln as _enum } from "../_libs/@better-auth/core+[...].mjs";
import { n as number } from "../_libs/zod.mjs";
import { t as uid } from "./row-CXk8IdOY.mjs";
import { _ as yieldGap, g as woCompleteCheck, n as assertAlloyMatch, p as parseReasonCode, t as REASON_CODES, u as isReasonCode } from "./rules-ctSmlA2x.mjs";
import { _ as saveDocSnapshot, g as reverseStockMove, h as postMove, i as linkGenealogy, l as mapGrnSlip, m as onHandKg, n as createLot, r as getLot, v as warehouseByCode, y as withStockTx } from "./posting-bGpwTDUP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-BjgNRAWc.js
var FORMULA = "metal = kgPerPc * recoveryFactor * blended(Cu,Zn,Pb); unitPrice = metal + conversion + jw + packing + overhead + margin";
function blendMetalPaisePerKg(input) {
	return Math.round(n(input.cuPct) / 100 * n(input.cuPaisePerKg) + n(input.znPct) / 100 * n(input.znPaisePerKg) + n(input.pbPct) / 100 * n(input.pbPaisePerKg));
}
function priceQuote(input) {
	const blendedPaisePerKg = blendMetalPaisePerKg(input);
	const metalPaise = Math.round(n(input.kgPerPc) * n(input.recoveryFactor) * blendedPaisePerKg);
	const unitPricePaise = metalPaise + n(input.conversionPaise) + n(input.jwPaise) + n(input.packingPaise) + n(input.overheadPaise) + n(input.marginPaise);
	return {
		blendedPaisePerKg,
		metalPaise,
		conversionPaise: n(input.conversionPaise),
		jwPaise: n(input.jwPaise),
		packingPaise: n(input.packingPaise),
		overheadPaise: n(input.overheadPaise),
		marginPaise: n(input.marginPaise),
		unitPricePaise,
		formula: FORMULA
	};
}
var auth = [authMiddleware];
function idSchema() {
	return object({ id: number() });
}
var getBootstrap_createServerFn_handler = createServerRpc({
	id: "99ebf663435a057263e2a810747080542f90b50bfea38bbe05a73d9d222ac14e",
	name: "getBootstrap",
	filename: "src/lib/erp/api.ts"
}, (opts) => getBootstrap.__executeServer(opts));
var getBootstrap = createServerFn({ method: "GET" }).middleware(auth).handler(getBootstrap_createServerFn_handler, async ({ context }) => {
	const sql = await erpSql();
	return {
		staff: await requireStaff(uid(context)),
		company: (await sql.query(`select * from company limit 1`))[0]
	};
});
var getDashboard_createServerFn_handler = createServerRpc({
	id: "b0f91fdba740888ca42fd4d6604cea0542d5370207323f1c67d7ec34f06e9bfd",
	name: "getDashboard",
	filename: "src/lib/erp/api.ts"
}, (opts) => getDashboard.__executeServer(opts));
var getDashboard = createServerFn({ method: "GET" }).middleware(auth).handler(getDashboard_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const onhand = await sql.query(`select
         coalesce(sum(case when l.owner_type = 'OWN' then l.qty_kg else 0 end),0) as kg,
         coalesce(sum(case when l.owner_type = 'OWN' then l.qty_pcs else 0 end),0) as pcs,
         coalesce(sum(case when l.owner_type = 'OWN' and w.valuation_eligible then l.qty_kg * l.unit_value_paise_per_kg else 0 end),0)::bigint as value_paise,
         coalesce(sum(case when l.owner_type = 'CUSTOMER' then l.qty_kg else 0 end),0) as customer_kg,
         coalesce(sum(case when w.is_outside_factory then l.qty_kg else 0 end),0) as outside_kg
       from stock_lot l
       join warehouse w on w.id = l.warehouse_id
       where l.qty_kg > 0 or l.qty_pcs > 0`);
	const byWh = await sql.query(`select w.code, w.name, w.is_outside_factory,
              coalesce(sum(l.qty_kg),0) as kg,
              coalesce(sum(l.qty_pcs),0) as pcs
         from warehouse w
         left join stock_lot l on l.warehouse_id = w.id and (l.qty_kg > 0 or l.qty_pcs > 0)
        group by w.id
        order by w.id`);
	const ageing = await sql.query(`select c.id, c.doc_no, p.name as partner, c.process_code, c.status,
              c.issued_at, c.statutory_due,
              floor(extract(epoch from (now() - c.issued_at)) / 86400)::int as age_days,
              coalesce((select sum(qty_kg) from job_work_challan_line where challan_id = c.id),0) as kg,
              coalesce((select sum(qty_pcs - returned_pcs) from job_work_challan_line where challan_id = c.id),0) as open_pcs
         from job_work_challan c
         join partner p on p.id = c.partner_id
        where c.status <> 'CLOSED'
        order by c.issued_at`);
	const openDocs = await sql.query(`select 'SO' as kind, count(*)::int as n from sales_order where status = 'OPEN'
       union all select 'PO', count(*)::int from purchase_order where status in ('OPEN','PARTIAL')
       union all select 'WO', count(*)::int from work_order where status in ('OPEN','ISSUED')
       union all select 'JW', count(*)::int from job_work_challan where status <> 'CLOSED'`);
	const price = (await sql.query(`select * from metal_price order by as_of_date desc limit 1`))[0];
	const alloys = await sql.query(`select a.code, a.name,
              coalesce(sum(l.qty_kg),0) as kg
         from alloy a
         left join stock_lot l on l.alloy_id = a.id and (l.qty_kg > 0)
        group by a.id
        order by a.id`);
	const qiHold = await sql.query(`select count(*)::int as n from stock_lot where status in ('QUARANTINE','HOLD') and (qty_kg > 0 or qty_pcs > 0)`);
	return {
		onhand: onhand[0],
		byWh,
		ageing,
		openDocs,
		price,
		alloys,
		qiHold: qiHold[0]?.n ?? 0
	};
});
var listOnHand_createServerFn_handler = createServerRpc({
	id: "e311d1a6091c7c9f651ce2da0126a25ec4bfa763162762edadaefca275439df4",
	name: "listOnHand",
	filename: "src/lib/erp/api.ts"
}, (opts) => listOnHand.__executeServer(opts));
var listOnHand = createServerFn({ method: "GET" }).middleware(auth).handler(listOnHand_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	return (await erpSql()).query(`select l.id, l.lot_no, l.heat_no, l.qty_kg, l.qty_pcs, l.status, l.owner_type,
              l.unit_value_paise_per_kg, i.sku, i.name as item_name, i.type as item_type,
              a.code as alloy, w.code as warehouse, w.name as warehouse_name,
              p.name as owner_name, l.reserved_so_line_id, l.reserved_pcs
         from stock_lot l
         join item i on i.id = l.item_id
         join warehouse w on w.id = l.warehouse_id
         left join alloy a on a.id = l.alloy_id
         left join partner p on p.id = l.owner_partner_id
        where l.qty_kg > 0.0005 or l.qty_pcs > 0.0005
        order by w.code, i.sku, l.lot_no`);
});
var listMoves_createServerFn_handler = createServerRpc({
	id: "d1d21819deff787f75bccb1edf652f0d621f3d58f68771659fb8d99043321b12",
	name: "listMoves",
	filename: "src/lib/erp/api.ts"
}, (opts) => listMoves.__executeServer(opts));
var listMoves = createServerFn({ method: "GET" }).middleware(auth).validator(object({
	lotId: number().optional(),
	reasonCode: string().optional()
}).optional()).handler(listMoves_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const lotId = data?.lotId ?? null;
	const reason = data?.reasonCode ?? null;
	const rows = await sql.query(`select m.id, m.posted_at, m.move_type, m.qty_kg, m.qty_pcs, m.value_paise,
              m.ref_type, m.ref_id, m.notes, i.sku, l.lot_no, l.id as lot_id, w.code as warehouse, a.code as alloy
         from stock_move m
         join item i on i.id = m.item_id
         join stock_lot l on l.id = m.lot_id
         join warehouse w on w.id = m.warehouse_id
         left join alloy a on a.id = m.alloy_id
        where ($1::int is null or m.lot_id = $1)
          and ($2::text is null or m.notes like $2)
        order by m.id ${lotId ? "asc" : "desc"}
        limit 400`, [lotId, reason ? `%REASON:${reason}%` : null]);
	let runKg = 0;
	let runPcs = 0;
	return rows.map((m) => {
		runKg = Math.round((runKg + n(m.qty_kg)) * 1e3) / 1e3;
		runPcs += n(m.qty_pcs);
		return {
			...m,
			reason_code: parseReasonCode(m.notes),
			running_kg: lotId ? runKg : null,
			running_pcs: lotId ? runPcs : null
		};
	});
});
var getLotLedger_createServerFn_handler = createServerRpc({
	id: "2cfbdb7527381e92bf80b3316589e77b82ee4e863c335df22db195aab50168bd",
	name: "getLotLedger",
	filename: "src/lib/erp/api.ts"
}, (opts) => getLotLedger.__executeServer(opts));
var getLotLedger = createServerFn({ method: "GET" }).middleware(auth).validator(object({ lotId: number() })).handler(getLotLedger_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const lot = await getLot(sql, data.lotId);
	const item = (await sql.query(`select sku, name from item where id = $1`, [lot.item_id]))[0];
	const rows = await sql.query(`select m.id, m.posted_at, m.move_type, m.qty_kg, m.qty_pcs, m.value_paise,
              m.ref_type, m.ref_id, m.notes, i.sku, l.lot_no, w.code as warehouse, a.code as alloy
         from stock_move m
         join item i on i.id = m.item_id
         join stock_lot l on l.id = m.lot_id
         join warehouse w on w.id = m.warehouse_id
         left join alloy a on a.id = m.alloy_id
        where m.lot_id = $1
        order by m.id asc`, [data.lotId]);
	let runKg = 0;
	let runPcs = 0;
	const moves = rows.map((m) => {
		runKg = Math.round((runKg + n(m.qty_kg)) * 1e3) / 1e3;
		runPcs += n(m.qty_pcs);
		return {
			...m,
			reason_code: parseReasonCode(m.notes),
			running_kg: runKg,
			running_pcs: runPcs
		};
	});
	return {
		lot,
		sku: item?.sku,
		itemName: item?.name,
		moves
	};
});
var listMasters_createServerFn_handler = createServerRpc({
	id: "53804c1b40f15bd860cb987f51c6d0a1e4adb3a21720f3e2a285b908e6b91379",
	name: "listMasters",
	filename: "src/lib/erp/api.ts"
}, (opts) => listMasters.__executeServer(opts));
var listMasters = createServerFn({ method: "GET" }).middleware(auth).handler(listMasters_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const [items, alloys, warehouses, partners, prices, rates, boms, priceLines, tariffs] = await Promise.all([
		sql.query(`select i.*, a.code as alloy_code from item i left join alloy a on a.id = i.alloy_id order by i.sku`),
		sql.query(`select * from alloy order by id`),
		sql.query(`select * from warehouse order by id`),
		sql.query(`select * from partner order by id`),
		sql.query(`select * from metal_price order by as_of_date desc`),
		sql.query(`select r.*, p.name as partner_name, p.code as partner_code
           from partner_process_rate r join partner p on p.id = r.partner_id order by p.name`),
		sql.query(`select b.*, i.sku, i.name as item_name
           from bom b join item i on i.id = b.item_id order by b.id`),
		sql.query(`select * from metal_price_line order by as_of_date desc, instrument`),
		sql.query(`select * from process_tariff order by process_code, item_family`)
	]);
	return {
		items,
		alloys,
		warehouses,
		partners,
		prices,
		rates,
		boms,
		bomLines: await sql.query(`select bl.*, i.sku as component_sku, i.name as component_name
         from bom_line bl join item i on i.id = bl.component_item_id order by bl.bom_id, bl.line_no`),
		priceLines,
		tariffs,
		settings: await sql.query(`select key, value from settings where key in ('quote_metal_basis','default_recovery_factor','default_margin_pct','mrp_time_fence_days')`)
	};
});
var listOpenDocs_createServerFn_handler = createServerRpc({
	id: "4d199d802c9a7ba5c698074c53d7ccc1e529f34be4a6fcea6ee954fbf05df846",
	name: "listOpenDocs",
	filename: "src/lib/erp/api.ts"
}, (opts) => listOpenDocs.__executeServer(opts));
var listOpenDocs = createServerFn({ method: "GET" }).middleware(auth).handler(listOpenDocs_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	return {
		pos: await sql.query(`select po.*, p.name as partner_name,
              (select json_agg(json_build_object('id', l.id, 'sku', i.sku, 'qty_kg', l.qty_kg, 'rate_paise_per_kg', l.rate_paise_per_kg, 'received_kg', l.received_kg, 'item_id', l.item_id))
                 from po_line l join item i on i.id = l.item_id where l.po_id = po.id) as lines
         from purchase_order po join partner p on p.id = po.partner_id order by po.id desc`),
		sos: await sql.query(`select so.*, p.name as partner_name, p.country,
              (select json_agg(json_build_object('id', l.id, 'sku', i.sku, 'item_id', l.item_id, 'name', i.name, 'qty_pcs', l.qty_pcs, 'qty_dispatched', l.qty_dispatched, 'unit_price_paise', l.unit_price_paise, 'kg_per_pc', i.kg_per_pc, 'recovery_factor', i.recovery_factor, 'promise_date', l.promise_date, 'promise_working', l.promise_working, 'promise_override_reason', l.promise_override_reason, 'reserved_lot_id', l.reserved_lot_id, 'reserved_pcs', l.reserved_pcs))
                 from so_line l join item i on i.id = l.item_id where l.so_id = so.id) as lines
         from sales_order so join partner p on p.id = so.partner_id order by so.id desc`),
		wos: await sql.query(`select wo.*, i.sku, i.name as item_name, i.kg_per_pc, i.recovery_factor
         from work_order wo join item i on i.id = wo.item_id order by wo.id desc`),
		grns: await sql.query(`select g.*, p.name as partner_name,
              (select json_agg(json_build_object('sku', i.sku, 'gross_kg', l.gross_kg, 'tare_kg', l.tare_kg, 'net_kg', l.net_kg, 'heat_no', l.heat_no, 'lot_id', l.lot_id))
                 from grn_line l join item i on i.id = l.item_id where l.grn_id = g.id) as lines
         from grn g join partner p on p.id = g.partner_id order by g.id desc`),
		qis: await sql.query(`select q.*, l.lot_no, l.status as lot_status, l.qty_kg, l.qty_pcs, i.sku, w.code as warehouse
         from quality_inspection q
         join stock_lot l on l.id = q.lot_id
         join item i on i.id = l.item_id
         join warehouse w on w.id = l.warehouse_id
        order by q.id desc`),
		quotes: await sql.query(`select q.*, p.name as partner_name,
              (select json_agg(json_build_object('sku', i.sku, 'qty_pcs', l.qty_pcs, 'unit_price_paise', l.unit_price_paise, 'metal_paise', l.metal_paise, 'kg_per_pc', l.kg_per_pc, 'recovery_factor', l.recovery_factor, 'cu_paise_per_kg', l.cu_paise_per_kg, 'alloy_code', l.alloy_code, 'formula_text', l.formula_text, 'metal_rate_date', l.metal_rate_date))
                 from quotation_line l join item i on i.id = l.item_id where l.quotation_id = q.id) as lines
         from quotation q join partner p on p.id = q.partner_id order by q.id desc`),
		ncrs: await sql.query(`select n.*, i.sku, l.lot_no from ncr n
         left join item i on i.id = n.item_id
         left join stock_lot l on l.id = n.lot_id
        order by n.id desc`),
		invoices: await sql.query(`select inv.*, p.name as partner_name,
              (select doc_no from packing_list where invoice_id = inv.id limit 1) as packing_no,
              (select net_kg from packing_list where invoice_id = inv.id limit 1) as packing_net_kg
         from sales_invoice inv join partner p on p.id = inv.partner_id order by inv.id desc`),
		melts: await sql.query(`select m.*, a.code as alloy from melt_order m join alloy a on a.id = m.alloy_id order by m.id desc`),
		variances: await sql.query(`select * from cost_variance order by id desc limit 50`),
		auditRows: await sql.query(`select * from audit_log order by id desc limit 80`),
		approvals: await sql.query(`select * from approval_request order by id desc limit 30`)
	};
});
var listJobWork_createServerFn_handler = createServerRpc({
	id: "2bfccac46b259a2df939f0f720dd9a912193a7dc30c76db3abafff6a33b62958",
	name: "listJobWork",
	filename: "src/lib/erp/api.ts"
}, (opts) => listJobWork.__executeServer(opts));
var listJobWork = createServerFn({ method: "GET" }).middleware(auth).handler(listJobWork_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	return {
		challans: await sql.query(`select c.*, p.name as partner_name, p.gstin as partner_gstin,
              floor(extract(epoch from (now() - c.issued_at)) / 86400)::int as age_days,
              (select json_agg(json_build_object(
                 'id', l.id, 'sku', i.sku, 'name', i.name, 'qty_pcs', l.qty_pcs, 'qty_kg', l.qty_kg,
                 'returned_pcs', l.returned_pcs, 'hsn', l.hsn, 'jw_lot_id', l.jw_lot_id, 'item_id', l.item_id
               )) from job_work_challan_line l join item i on i.id = l.item_id where l.challan_id = c.id) as lines
         from job_work_challan c
         join partner p on p.id = c.partner_id
        order by c.issued_at desc`),
		returns: await sql.query(`select r.*, c.doc_no as challan_no, p.name as partner_name,
              (select json_build_object('actual_loss_pct', x.actual_loss_pct, 'norm_pct', x.norm_pct, 'excess_pcs', x.excess_pcs, 'debit_paise', x.debit_paise, 'debit_note_no', x.debit_note_no, 'debit_status', x.debit_status)
                 from job_work_loss x where x.return_id = r.id limit 1) as loss
         from job_work_return r
         join job_work_challan c on c.id = r.challan_id
         join partner p on p.id = c.partner_id
        order by r.id desc`)
	};
});
var getGenealogy_createServerFn_handler = createServerRpc({
	id: "2a993c0cfc8bf6df6b61b0fa60d16e60c5a043501d4c50983b2c286fd80d2863",
	name: "getGenealogy",
	filename: "src/lib/erp/api.ts"
}, (opts) => getGenealogy.__executeServer(opts));
var getGenealogy = createServerFn({ method: "GET" }).middleware(auth).validator(idSchema()).handler(getGenealogy_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const lot = (await sql.query(`select l.*, i.sku, i.name as item_name, a.code as alloy, w.code as warehouse
           from stock_lot l
           join item i on i.id = l.item_id
           join warehouse w on w.id = l.warehouse_id
           left join alloy a on a.id = l.alloy_id
          where l.id = $1`, [data.id]))[0];
	if (!lot) throw new Error("Lot not found");
	const parents = await sql.query(`select g.qty_kg, g.qty_pcs, l.id, l.lot_no, l.heat_no, i.sku, w.code as warehouse, a.code as alloy
         from genealogy_link g
         join stock_lot l on l.id = g.parent_lot_id
         join item i on i.id = l.item_id
         join warehouse w on w.id = l.warehouse_id
         left join alloy a on a.id = l.alloy_id
        where g.child_lot_id = $1`, [data.id]);
	const children = await sql.query(`select g.qty_kg, g.qty_pcs, l.id, l.lot_no, l.heat_no, i.sku, w.code as warehouse
         from genealogy_link g
         join stock_lot l on l.id = g.child_lot_id
         join item i on i.id = l.item_id
         join warehouse w on w.id = l.warehouse_id
        where g.parent_lot_id = $1`, [data.id]);
	const ancestors = [];
	const walk = async (id, depth) => {
		if (depth > 8) return;
		const rows = await sql.query(`select g.qty_kg, g.qty_pcs, l.id, l.lot_no, l.heat_no, i.sku, i.type, w.code as warehouse, a.code as alloy
           from genealogy_link g
           join stock_lot l on l.id = g.parent_lot_id
           join item i on i.id = l.item_id
           join warehouse w on w.id = l.warehouse_id
           left join alloy a on a.id = l.alloy_id
          where g.child_lot_id = $1`, [id]);
		for (const r of rows) {
			ancestors.push({
				...r,
				depth
			});
			await walk(n(r.id), depth + 1);
		}
	};
	await walk(data.id, 1);
	if (ancestors.length === 0) {
		const viaMove = await sql.query(`select l.id, l.lot_no, l.heat_no, i.sku, i.type, w.code as warehouse, a.code as alloy,
                m.qty_kg, m.qty_pcs
           from stock_move m
           join stock_lot l on l.id = m.consumed_lot_id
           join item i on i.id = l.item_id
           join warehouse w on w.id = l.warehouse_id
           left join alloy a on a.id = l.alloy_id
          where m.lot_id = $1 and m.consumed_lot_id is not null`, [data.id]);
		for (const r of viaMove) {
			ancestors.push({
				...r,
				depth: 1
			});
			await walk(n(r.id), 2);
		}
	}
	const moves = await sql.query(`select m.id, m.move_type, m.qty_kg, m.qty_pcs, m.ref_type, m.ref_id, m.posted_at,
              m.consumed_lot_id, m.parent_move_id, w.code as warehouse
         from stock_move m
         join warehouse w on w.id = m.warehouse_id
        where m.lot_id = $1
        order by m.id`, [data.id]);
	return {
		lot,
		parents,
		children,
		ancestors,
		cartons: await sql.query(`select pl.carton_no, pl.qty_pcs, pl.net_kg, p.doc_no as packing_no, inv.doc_no as invoice_no
         from packing_list_line pl
         join packing_list p on p.id = pl.packing_list_id
         join sales_invoice inv on inv.id = p.invoice_id
        where pl.lot_id = $1`, [data.id]),
		moves
	};
});
var getJourneys_createServerFn_handler = createServerRpc({
	id: "ce32278bd9fb31790c223d31c596f1f9f1522aa65825fa7bb697fb50f37c6785",
	name: "getJourneys",
	filename: "src/lib/erp/api.ts"
}, (opts) => getJourneys.__executeServer(opts));
var getJourneys = createServerFn({ method: "GET" }).middleware(auth).handler(getJourneys_createServerFn_handler, async ({ context }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const grn = await sql.query(`select g.doc_no, l.net_kg, sl.status from grn g
         join grn_line l on l.grn_id = g.id
         left join stock_lot sl on sl.id = l.lot_id
        where l.net_kg = 1250.500`);
	const so = await sql.query(`select so.doc_no from sales_order so
         join so_line l on l.so_id = so.id
         join item i on i.id = l.item_id
        where i.sku = 'HEX-NIPPLE-1/2-NCR' and l.qty_pcs = 10000`);
	const wo = await sql.query(`select wo.doc_no, wo.required_kg, wo.issued_kg, wo.status, wo.good_pcs, wo.reject_pcs, wo.scrap_kg
         from work_order wo join item i on i.id = wo.item_id
        where i.sku = 'HEX-NIPPLE-1/2-NCR'`);
	const book = wo[0];
	const jw = await sql.query(`select c.doc_no, l.qty_pcs, p.code from job_work_challan c
         join job_work_challan_line l on l.challan_id = c.id
         join partner p on p.id = c.partner_id
         join item i on i.id = l.item_id
        where i.sku = 'HEX-NIPPLE-1/2-NCR' and l.qty_pcs = 9820 and p.code = 'V-KIRAN'`);
	const ret = await sql.query(`select r.doc_no, r.good_pcs, r.reject_pcs, r.short_pcs, x.debit_note_no, x.debit_status, x.excess_pcs
         from job_work_return r
         join job_work_challan c on c.id = r.challan_id
         join job_work_challan_line l on l.challan_id = c.id
         join item i on i.id = l.item_id
         left join job_work_loss x on x.return_id = r.id
        where i.sku = 'HEX-NIPPLE-1/2-NCR'`);
	const inv = await sql.query(`select inv.doc_no, inv.net_kg, pl.net_kg as packing_net_kg, sil.qty_pcs
         from sales_invoice inv
         join sales_invoice_line sil on sil.invoice_id = inv.id
         join item i on i.id = sil.item_id
         left join packing_list pl on pl.invoice_id = inv.id
        where i.sku = 'HEX-NIPPLE-1/2-NCR' and sil.qty_pcs = 5000`);
	const oldQ = await sql.query(`select q.doc_no, q.cu_paise_per_kg, q.metal_rate_date from quotation q order by q.id asc limit 1`);
	const latestPrice = (await sql.query(`select cu_paise_per_kg from metal_price order by as_of_date desc limit 1`))[0];
	const fgQc = await sql.query(`select q.doc_no, l.lot_no, l.status
         from quality_inspection q
         join stock_lot l on l.id = q.lot_id
         join item i on i.id = l.item_id
         join warehouse w on w.id = l.warehouse_id
        where i.sku = 'HEX-NIPPLE-1/2-NCR' and q.result = 'PASS'
          and l.status = 'AVAILABLE' and w.code in ('FG-DOM','FG-EXP')`);
	const gene = await sql.query(`select g.id from genealogy_link g
         join stock_lot c on c.id = g.child_lot_id
         join stock_lot p on p.id = g.parent_lot_id
         join item ci on ci.id = c.item_id
         join item pi on pi.id = p.item_id
        where ci.type in ('FG','SFG') and pi.type = 'RM'`);
	const aged = await sql.query(`select doc_no, floor(extract(epoch from (now() - issued_at)) / 86400)::int as age_days
         from job_work_challan
        where floor(extract(epoch from (now() - issued_at)) / 86400) >= 270`);
	const outside = (await sql.query(`select coalesce(sum(l.qty_kg),0) as kg from stock_lot l
           join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`))[0];
	return {
		steps: [
			{
				n: 1,
				title: "GRN 1250.500 kg C360 rod → QC hold → release",
				href: "/grn",
				done: grn.some((g) => n(g.net_kg) === 1250.5 && g.status === "AVAILABLE"),
				note: grn[0] ? `${grn[0].doc_no} lot ${grn[0].status}` : "Not posted"
			},
			{
				n: 2,
				title: "SO 10,000 pcs HEX-NIPPLE-1/2-NCR",
				href: "/so",
				done: so.length > 0,
				note: so[0] ? so[0].doc_no : "Not created"
			},
			{
				n: 3,
				title: "Explode rod kg = 10,000 × 0.048 × 1.08 minus on-hand; create WO",
				href: "/so",
				done: wo.length > 0 && n(wo[0].required_kg) > 0,
				note: wo[0] ? `${wo[0].doc_no} req ${wo[0].required_kg} kg` : "No WO"
			},
			{
				n: 4,
				title: "Issue rod; book 9820 good, 80 reject, 6.400 kg turning",
				href: "/shop",
				done: book ? n(book.good_pcs) >= 9820 && n(book.reject_pcs) >= 80 && n(book.scrap_kg) >= 6.4 : false,
				note: book ? `issued ${book.issued_kg} kg · good ${book.good_pcs}` : "Not booked"
			},
			{
				n: 5,
				title: "JW challan 9820 pcs to Kiran Platers; stock in JW-OUT; print PDF",
				href: "/jw",
				done: jw.length > 0,
				note: jw[0] ? jw[0].doc_no : "Not issued"
			},
			{
				n: 6,
				title: "Return 9700 good, 80 reject, 40 short; excess-loss debit draft; FG via QC",
				href: "/jw",
				done: ret.some((r) => n(r.good_pcs) === 9700) && fgQc.length > 0,
				note: ret[0] ? `DN ${ret[0].debit_note_no ?? "—"} · FG ${fgQc[0] ? fgQc[0].lot_no : "awaiting QC"}` : "Not returned"
			},
			{
				n: 7,
				title: "Dispatch 5000; packing Σ net kg = invoice Σ net kg",
				href: "/dispatch",
				done: inv.some((i) => n(i.net_kg) === n(i.packing_net_kg)),
				note: inv[0] ? `${inv[0].doc_no} ${n(inv[0].net_kg)} kg` : "Not dispatched"
			},
			{
				n: 8,
				title: "Change Cu rate; new quote uses it; old quote stays frozen",
				href: "/quotes",
				done: Boolean(oldQ[0] && latestPrice && n(oldQ[0].cu_paise_per_kg) !== n(latestPrice.cu_paise_per_kg)),
				note: oldQ[0] ? `Frozen Cu ${n(oldQ[0].cu_paise_per_kg) / 100} vs live ${n(latestPrice?.cu_paise_per_kg) / 100}` : "—"
			},
			{
				n: 9,
				title: "Genealogy from FG lot back to rod lot / heat",
				href: "/stock",
				done: gene.length > 0,
				note: gene.length ? `${gene.length} RM←FG links` : "Book a WO to create links"
			},
			{
				n: 10,
				title: "280-day challan on ageing board; Owner kg-outside-factory",
				href: "/",
				done: aged.length > 0 && n(outside?.kg) > 0,
				note: `${aged.length} aged · outside ${outside?.kg ?? 0} kg`
			}
		],
		outsideKg: n(outside?.kg)
	};
});
var explodeSo_createServerFn_handler = createServerRpc({
	id: "c8a23d7eae705aea6e72aeced1ee09606757728f3f494ee0b7fd5975bd10bc04",
	name: "explodeSo",
	filename: "src/lib/erp/api.ts"
}, (opts) => explodeSo.__executeServer(opts));
var explodeSo = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	soId: number(),
	lineId: number()
})).handler(explodeSo_createServerFn_handler, async ({ context, data }) => {
	await requireStaff(uid(context));
	const sql = await erpSql();
	const line = (await sql.query(`select l.item_id, l.qty_pcs, i.sku, i.kg_per_pc, i.recovery_factor
           from so_line l join item i on i.id = l.item_id where l.id = $1 and l.so_id = $2`, [data.lineId, data.soId]))[0];
	if (!line) throw new Error("SO line not found");
	const bom = (await sql.query(`select id from bom where item_id = $1 and status = 'APPROVED' order by id desc limit 1`, [line.item_id]))[0];
	if (!bom) throw new Error("No approved BOM for this item");
	const inputs = await sql.query(`select bl.component_item_id, bl.qty_per, i.sku, bl.is_co_product
         from bom_line bl join item i on i.id = bl.component_item_id where bl.bom_id = $1`, [bom.id]);
	const rows = [];
	for (const inp of inputs) {
		if (inp.is_co_product) {
			rows.push({
				sku: inp.sku,
				itemId: inp.component_item_id,
				requiredKg: roundKg(n(line.qty_pcs) * n(inp.qty_per)),
				onHandKg: 0,
				shortageKg: 0,
				coProduct: true
			});
			continue;
		}
		const oh = await onHandKg(sql, inp.component_item_id, {
			warehouseCode: "RM-ROD",
			status: "AVAILABLE"
		});
		const requiredKg = roundKg(n(line.qty_pcs) * n(inp.qty_per));
		rows.push({
			sku: inp.sku,
			itemId: inp.component_item_id,
			requiredKg,
			onHandKg: roundKg(oh),
			shortageKg: roundKg(Math.max(0, requiredKg - oh)),
			coProduct: false
		});
	}
	const requiredKg = rows.filter((r) => !r.coProduct).reduce((s, r) => s + r.requiredKg, 0);
	return {
		sku: line.sku,
		qtyPcs: n(line.qty_pcs),
		bomId: bom.id,
		formula: `${n(line.qty_pcs)} × ${n(line.kg_per_pc)} × ${n(line.recovery_factor)} = ${requiredKg} kg`,
		requiredKg,
		rows
	};
});
var postGrn_createServerFn_handler = createServerRpc({
	id: "39a08218128e662786ec60e00f350ae56aa10322ca4d845710fcfb935ccc0e94",
	name: "postGrn",
	filename: "src/lib/erp/api.ts"
}, (opts) => postGrn.__executeServer(opts));
var postGrn = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	partnerId: number(),
	poId: number().optional(),
	itemId: number(),
	heatNo: string().min(1),
	grossKg: number().positive(),
	tareKg: number().min(0).default(0),
	vehicleNo: string().optional(),
	grnDate: string().optional()
})).handler(postGrn_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "purchase");
	const sql = await erpSql();
	const net = roundKg(data.grossKg - data.tareKg);
	if (net <= 0) throw new Error("Net kg must be positive (gross − tare)");
	const grnDate = data.grnDate ?? todayISO();
	await assertPeriodAllows(sql, grnDate, "STOCK");
	const item = (await sql.query(`select id, alloy_id, sku, name from item where id = $1`, [data.itemId]))[0];
	if (!item) throw new Error("Item not found");
	if (!item.alloy_id) throw new Error("Rod must carry an alloy — no anonymous brass");
	const wh = await warehouseByCode(sql, "RM-ROD");
	const poLine = data.poId ? (await sql.query(`select id, rate_paise_per_kg from po_line where po_id = $1 and item_id = $2 limit 1`, [data.poId, data.itemId]))[0] : null;
	const unit = poLine?.rate_paise_per_kg ?? 62e3;
	const vendor = (await sql.query(`select * from partner where id = $1`, [data.partnerId]))[0];
	if (!vendor) throw new Error("Vendor not found");
	const company = (await sql.query(`select * from company limit 1`))[0];
	return withStockTx(sql, async () => {
		const docNo = await nextDoc(sql, "GRN");
		const grn = (await sql.query(`insert into grn (doc_no, po_id, partner_id, grn_date, vehicle_no, status, created_by)
           values ($1,$2,$3,$4,$5,'QC_HOLD',$6) returning id`, [
			docNo,
			data.poId ?? null,
			data.partnerId,
			data.grnDate ?? todayISO(),
			data.vehicleNo ?? null,
			staff.user_id
		]))[0];
		const lot = await createLot(sql, {
			itemId: item.id,
			warehouseId: wh.id,
			alloyId: item.alloy_id,
			heatNo: data.heatNo,
			qtyKg: 0,
			qtyPcs: 0,
			status: "QUARANTINE",
			unitValuePaisePerKg: unit,
			sourceType: "GRN",
			sourceId: grn.id
		});
		await postMove(sql, {
			moveType: "GRN_RECEIPT",
			itemId: item.id,
			lotId: lot.id,
			warehouseId: wh.id,
			qtyKg: net,
			qtyPcs: 0,
			refType: "GRN",
			refId: grn.id,
			notes: `Heat ${data.heatNo} gross ${data.grossKg} tare ${data.tareKg}`,
			userId: staff.user_id,
			alloyId: item.alloy_id,
			unitValuePaisePerKg: unit,
			itemAlloyId: item.alloy_id
		});
		await sql.query(`insert into grn_line (grn_id, item_id, po_line_id, heat_no, gross_kg, tare_kg, net_kg, lot_id, warehouse_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [
			grn.id,
			item.id,
			poLine?.id ?? null,
			data.heatNo,
			data.grossKg,
			data.tareKg,
			net,
			lot.id,
			wh.id
		]);
		if (poLine) await sql.query(`update po_line set received_kg = received_kg + $1 where id = $2`, [net, poLine.id]);
		const qiNo = await nextDoc(sql, "QI");
		await sql.query(`insert into quality_inspection (doc_no, lot_id, result) values ($1,$2,'PENDING')`, [qiNo, lot.id]);
		const slip = mapGrnSlip({
			company,
			grn: {
				...vendor,
				doc_no: docNo,
				grn_date: todayISO(),
				vehicle_no: data.vehicleNo ?? "",
				partner_name: vendor.name,
				partner_gstin: vendor.gstin,
				partner_addr: vendor.address_line1
			},
			line: {
				sku: item.sku,
				heat_no: data.heatNo,
				gross_kg: data.grossKg,
				tare_kg: data.tareKg,
				net_kg: net,
				lot_status: "QUARANTINE"
			}
		});
		await saveDocSnapshot(sql, {
			userId: staff.user_id,
			entity: "grn",
			entityId: grn.id,
			doc: slip
		});
		await audit(sql, {
			userId: staff.user_id,
			action: "GRN",
			entity: "grn",
			entityId: grn.id,
			after: {
				docNo,
				net,
				lot: lot.lot_no,
				heatNo: data.heatNo
			}
		});
		return {
			docNo,
			lotNo: lot.lot_no,
			netKg: net,
			qiNo,
			lotId: lot.id,
			grnId: grn.id
		};
	});
});
var releaseLot_createServerFn_handler = createServerRpc({
	id: "e93c7dea806ea0ca8a482481a00caeac642a8616ae5cc9d7607e9ee6e6823057",
	name: "releaseLot",
	filename: "src/lib/erp/api.ts"
}, (opts) => releaseLot.__executeServer(opts));
var releaseLot = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	inspectionId: number(),
	result: _enum(["PASS", "FAIL"]),
	notes: string().optional(),
	spectroCu: number().optional(),
	spectroZn: number().optional(),
	spectroPb: number().optional()
})).handler(releaseLot_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "qc_release");
	const sql = await erpSql();
	const qi = (await sql.query(`select id, lot_id, result from quality_inspection where id = $1`, [data.inspectionId]))[0];
	if (!qi) throw new Error("Inspection not found");
	const lot = await getLot(sql, qi.lot_id);
	const item = (await sql.query(`select type, alloy_id from item where id = $1`, [lot.item_id]))[0];
	const status = data.result === "PASS" ? "AVAILABLE" : "REJECTED";
	let debitNoteNo = null;
	await withStockTx(sql, async () => {
		if (data.result === "PASS") {
			const dest = lot.status === "QUARANTINE" && item?.type === "FG" ? await warehouseByCode(sql, "FG-DOM") : null;
			if (dest && dest.id !== lot.warehouse_id) {
				const kg = n(lot.qty_kg);
				const pcs = n(lot.qty_pcs);
				if (kg !== 0 || pcs !== 0) await postMove(sql, {
					moveType: "QC_RELEASE",
					itemId: lot.item_id,
					lotId: lot.id,
					warehouseId: lot.warehouse_id,
					qtyKg: -kg,
					qtyPcs: -pcs,
					refType: "QI",
					refId: qi.id,
					notes: `PASS out of hold`,
					userId: staff.user_id,
					alloyId: lot.alloy_id,
					unitValuePaisePerKg: lot.unit_value_paise_per_kg,
					itemAlloyId: item?.alloy_id ?? lot.alloy_id,
					kgPerPc: pcs !== 0 ? kg / pcs : null,
					conversionKind: pcs !== 0 ? "FG" : "ROD"
				});
				await sql.query(`update stock_lot set warehouse_id = $1, status = 'AVAILABLE' where id = $2`, [dest.id, lot.id]);
				if (kg !== 0 || pcs !== 0) await postMove(sql, {
					moveType: "QC_RELEASE",
					itemId: lot.item_id,
					lotId: lot.id,
					warehouseId: dest.id,
					qtyKg: kg,
					qtyPcs: pcs,
					refType: "QI",
					refId: qi.id,
					notes: `PASS into ${dest.code}`,
					userId: staff.user_id,
					alloyId: lot.alloy_id,
					unitValuePaisePerKg: lot.unit_value_paise_per_kg,
					itemAlloyId: item?.alloy_id ?? lot.alloy_id,
					kgPerPc: pcs !== 0 ? kg / pcs : null,
					conversionKind: pcs !== 0 ? "FG" : "ROD"
				});
			} else {
				await postMove(sql, {
					moveType: "QC_RELEASE",
					itemId: lot.item_id,
					lotId: lot.id,
					warehouseId: lot.warehouse_id,
					qtyKg: 0,
					qtyPcs: 0,
					refType: "QI",
					refId: qi.id,
					notes: `PASS ${data.notes ?? ""}`.trim(),
					userId: staff.user_id,
					alloyId: lot.alloy_id,
					unitValuePaisePerKg: lot.unit_value_paise_per_kg,
					allowZeroQty: true,
					itemAlloyId: item?.alloy_id ?? lot.alloy_id
				});
				await sql.query(`update stock_lot set status = 'AVAILABLE' where id = $1`, [lot.id]);
			}
		} else {
			const rej = await warehouseByCode(sql, n(lot.qty_pcs) > 0 ? "FG-REJECT" : "RM-SCRAP");
			const kg = n(lot.qty_kg);
			const pcs = n(lot.qty_pcs);
			if (kg !== 0 || pcs !== 0) await postMove(sql, {
				moveType: "QC_REJECT",
				itemId: lot.item_id,
				lotId: lot.id,
				warehouseId: lot.warehouse_id,
				qtyKg: -kg,
				qtyPcs: -pcs,
				refType: "QI",
				refId: qi.id,
				notes: `FAIL out of ${lot.warehouse_id}`,
				userId: staff.user_id,
				alloyId: lot.alloy_id,
				unitValuePaisePerKg: lot.unit_value_paise_per_kg,
				reasonCode: "SCRAP-QC",
				itemAlloyId: item?.alloy_id ?? lot.alloy_id
			});
			await sql.query(`update stock_lot set warehouse_id = $1, status = 'REJECTED' where id = $2`, [rej.id, lot.id]);
			if (kg !== 0 || pcs !== 0) await postMove(sql, {
				moveType: "QC_REJECT",
				itemId: lot.item_id,
				lotId: lot.id,
				warehouseId: rej.id,
				qtyKg: kg,
				qtyPcs: pcs,
				refType: "QI",
				refId: qi.id,
				notes: `FAIL into ${rej.code}`,
				userId: staff.user_id,
				alloyId: lot.alloy_id,
				unitValuePaisePerKg: lot.unit_value_paise_per_kg,
				reasonCode: "SCRAP-QC",
				itemAlloyId: item?.alloy_id ?? lot.alloy_id
			});
			const grn = (await sql.query(`select g.id, g.doc_no, g.partner_id from grn g join grn_line l on l.grn_id = g.id where l.lot_id = $1 limit 1`, [lot.id]))[0];
			if (grn) {
				debitNoteNo = await nextDoc(sql, "DN");
				const taxable = Math.round(kg * lot.unit_value_paise_per_kg);
				await sql.query(`insert into credit_debit_note (
               kind, doc_no, note_date, original_invoice_no, partner_id, reason,
               taxable_paise, total_paise, status, created_by
             ) values ('DN',$1,$2,$3,$4,$5,$6,$6,'DRAFT',$7)`, [
					debitNoteNo,
					todayISO(),
					grn.doc_no,
					grn.partner_id,
					"QC reject — purchase debit-note draft (not posted)",
					taxable,
					staff.user_id
				]);
			}
		}
		await sql.query(`update quality_inspection
            set result = $1, inspector_id = $2, inspected_at = now(), notes = $3,
                spectro_cu = $4, spectro_zn = $5, spectro_pb = $6
          where id = $7`, [
			data.result,
			staff.user_id,
			data.notes ?? null,
			data.spectroCu ?? null,
			data.spectroZn ?? null,
			data.spectroPb ?? null,
			qi.id
		]);
		await sql.query(`update grn set status = $1 from grn_line where grn_line.lot_id = $2 and grn.id = grn_line.grn_id`, [data.result === "PASS" ? "CLOSED" : "QC_HOLD", lot.id]);
		await audit(sql, {
			userId: staff.user_id,
			action: "QC_RELEASE",
			entity: "stock_lot",
			entityId: lot.id,
			before: { status: lot.status },
			after: {
				status,
				debitNoteNo
			}
		});
	});
	return {
		lotNo: lot.lot_no,
		status,
		debitNoteNo
	};
});
var createSalesOrder_createServerFn_handler = createServerRpc({
	id: "29af64e96889453314a80302b9ff2909c04f340ea191e564edb56d41bb98cea6",
	name: "createSalesOrder",
	filename: "src/lib/erp/api.ts"
}, (opts) => createSalesOrder.__executeServer(opts));
var createSalesOrder = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	partnerId: number(),
	itemId: number(),
	qtyPcs: number().positive(),
	unitPricePaise: number().min(0).default(0),
	notes: string().optional()
})).handler(createSalesOrder_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "sales");
	const sql = await erpSql();
	if (!(await sql.query(`select * from item where id = $1`, [data.itemId]))[0]) throw new Error("Item not found");
	const gstPct = (await sql.query(`select country, state_code from partner where id = $1`, [data.partnerId]))[0]?.country === "IN" ? 18 : 0;
	let unit = data.unitPricePaise;
	if (!unit) {
		const price = (await sql.query(`select * from metal_price order by as_of_date desc limit 1`))[0];
		const alloy = (await sql.query(`select a.* from item i join alloy a on a.id = i.alloy_id where i.id = $1`, [data.itemId]))[0];
		const full = (await sql.query(`select * from item where id = $1`, [data.itemId]))[0];
		const jw = (await sql.query(`select rate_paise_per_pc from partner_process_rate
            where process_code = 'NI_CR' and (item_family = $1 or item_family = '')
            order by id limit 1`, [full.family]))[0];
		unit = priceQuote({
			kgPerPc: n(full.kg_per_pc),
			recoveryFactor: n(full.recovery_factor),
			cuPct: n(alloy?.cu_pct),
			znPct: n(alloy?.zn_pct),
			pbPct: n(alloy?.pb_pct),
			cuPaisePerKg: price?.cu_paise_per_kg ?? 0,
			znPaisePerKg: price?.zn_paise_per_kg ?? 0,
			pbPaisePerKg: price?.pb_paise_per_kg ?? 0,
			conversionPaise: full.conversion_paise,
			jwPaise: jw?.rate_paise_per_pc ?? 0,
			packingPaise: full.packing_paise,
			overheadPaise: full.overhead_paise,
			marginPaise: full.default_margin_paise
		}).unitPricePaise;
	}
	const docNo = await nextDoc(sql, "SO");
	const so = (await sql.query(`insert into sales_order (doc_no, partner_id, order_date, status, notes, created_by)
         values ($1,$2,$3,'OPEN',$4,$5) returning id`, [
		docNo,
		data.partnerId,
		todayISO(),
		data.notes ?? null,
		staff.user_id
	]))[0];
	await sql.query(`insert into so_line (so_id, item_id, qty_pcs, unit_price_paise, gst_pct) values ($1,$2,$3,$4,$5)`, [
		so.id,
		data.itemId,
		data.qtyPcs,
		unit,
		gstPct
	]);
	return {
		docNo,
		id: so.id,
		unitPricePaise: unit
	};
});
var createWorkOrder_createServerFn_handler = createServerRpc({
	id: "f51d021e78840d06c59d8011580a41953b819ed4204330326e464f4842810f9e",
	name: "createWorkOrder",
	filename: "src/lib/erp/api.ts"
}, (opts) => createWorkOrder.__executeServer(opts));
var createWorkOrder = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	soId: number(),
	lineId: number()
})).handler(createWorkOrder_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "booking");
	const sql = await erpSql();
	const explosion = await explodeSo({ data: {
		soId: data.soId,
		lineId: data.lineId
	} });
	const line = (await sql.query(`select item_id, qty_pcs from so_line where id = $1`, [data.lineId]))[0];
	if (!line) throw new Error("SO line not found");
	const docNo = await nextDoc(sql, "WO");
	const wo = (await sql.query(`insert into work_order (doc_no, item_id, bom_id, so_id, qty_pcs, required_kg, status, created_by)
         values ($1,$2,$3,$4,$5,$6,'OPEN',$7) returning id`, [
		docNo,
		line.item_id,
		explosion.bomId,
		data.soId,
		n(line.qty_pcs),
		explosion.requiredKg,
		staff.user_id
	]))[0];
	const bomLines = await sql.query(`select bl.*, i.sku, i.alloy_id, a.code as alloy_code
         from bom_line bl
         join item i on i.id = bl.component_item_id
         left join alloy a on a.id = i.alloy_id
        where bl.bom_id = $1
        order by bl.line_no`, [explosion.bomId]);
	const routing = await sql.query(`select ro.seq, ro.process_code, ro.is_subcontract, wc.code as work_center
         from routing r
         join routing_op ro on ro.routing_id = r.id
         left join work_center wc on wc.id = ro.work_center_id
        where r.item_id = $1
        order by ro.seq`, [line.item_id]);
	await audit(sql, {
		userId: staff.user_id,
		action: "WO_FREEZE",
		entity: "work_order",
		entityId: wo.id,
		after: {
			docNo,
			bomId: explosion.bomId,
			requiredKg: explosion.requiredKg,
			bomLines,
			routing,
			formula: explosion.formula
		}
	});
	return {
		docNo,
		id: wo.id,
		requiredKg: explosion.requiredKg,
		explosion
	};
});
var issueToWo_createServerFn_handler = createServerRpc({
	id: "c702b8a5874015c724307dc9fdac5c25d8a444a6b6a9e66e5fe406d516b78b32",
	name: "issueToWo",
	filename: "src/lib/erp/api.ts"
}, (opts) => issueToWo.__executeServer(opts));
var issueToWo = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	woId: number(),
	lotId: number(),
	qtyKg: number().positive()
})).handler(issueToWo_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "booking");
	const sql = await erpSql();
	const wo = (await sql.query(`select * from work_order where id = $1`, [data.woId]))[0];
	if (!wo) throw new Error("WO not found");
	const lot = await getLot(sql, data.lotId);
	if (lot.status !== "AVAILABLE") throw new Error("Lot is not AVAILABLE");
	if (lot.owner_type !== "OWN") throw new Error("Cannot issue customer-owned metal into our WO value stream this way");
	const component = (await sql.query(`select bl.component_item_id, i.alloy_id, a.code as alloy_code, i.sku
           from work_order wo
           join bom_line bl on bl.bom_id = wo.bom_id and bl.is_co_product = false
           join item i on i.id = bl.component_item_id
           left join alloy a on a.id = i.alloy_id
          where wo.id = $1
          order by bl.line_no
          limit 1`, [wo.id]))[0];
	const lotAlloy = (await sql.query(`select code from alloy where id = $1`, [lot.alloy_id]))[0];
	if (component) {
		assertAlloyMatch({
			lotAlloyId: lot.alloy_id,
			itemAlloyId: component.alloy_id,
			lotAlloyCode: lotAlloy?.code,
			itemAlloyCode: component.alloy_code,
			context: `WO issue of ${lot.lot_no} onto ${component.sku}`
		});
		if (lot.item_id !== component.component_item_id && lot.alloy_id !== component.alloy_id) throw new Error(`Lot item does not match frozen BOM component ${component.sku}`);
	}
	const kgPer = n((await sql.query(`select kg_per_pc from item where id = $1`, [lot.item_id]))[0]?.kg_per_pc);
	return withStockTx(sql, async () => {
		await postMove(sql, {
			moveType: "WO_ISSUE",
			itemId: lot.item_id,
			lotId: lot.id,
			warehouseId: lot.warehouse_id,
			qtyKg: -data.qtyKg,
			qtyPcs: 0,
			refType: "WO",
			refId: wo.id,
			notes: "Issue to work order",
			userId: staff.user_id,
			alloyId: lot.alloy_id,
			unitValuePaisePerKg: lot.unit_value_paise_per_kg,
			kgPerPc: kgPer || null,
			conversionKind: "ROD",
			itemAlloyId: component?.alloy_id ?? lot.alloy_id
		});
		await sql.query(`insert into wo_issue (wo_id, lot_id, item_id, qty_kg) values ($1,$2,$3,$4)`, [
			wo.id,
			lot.id,
			lot.item_id,
			data.qtyKg
		]);
		await sql.query(`update work_order set issued_kg = issued_kg + $1, status = 'ISSUED' where id = $2`, [data.qtyKg, wo.id]);
		await audit(sql, {
			userId: staff.user_id,
			action: "WO_ISSUE",
			entity: "work_order",
			entityId: wo.id,
			after: {
				lot: lot.lot_no,
				qtyKg: data.qtyKg
			}
		});
		return {
			ok: true,
			issuedKg: data.qtyKg,
			lotNo: lot.lot_no
		};
	});
});
var bookWo_createServerFn_handler = createServerRpc({
	id: "b1b591d8c20874f3e8c9b2df229a6a6a5c27a1f26f2e79b105ca3dbc441738b1",
	name: "bookWo",
	filename: "src/lib/erp/api.ts"
}, (opts) => bookWo.__executeServer(opts));
var bookWo = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	woId: number(),
	goodPcs: number().min(0),
	rejectPcs: number().min(0),
	scrapKg: number().min(0)
})).handler(bookWo_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "booking");
	const sql = await erpSql();
	const wo = (await sql.query(`select * from work_order where id = $1`, [data.woId]))[0];
	if (!wo) throw new Error("WO not found");
	if (wo.status === "COMPLETE") throw new Error("WO already complete");
	const item = (await sql.query(`select * from item where id = $1`, [wo.item_id]))[0];
	const kgPer = n(item.kg_per_pc);
	const goodKg = roundKg(data.goodPcs * kgPer);
	const rejectKg = roundKg(data.rejectPcs * kgPer);
	const scrapKg = roundKg(data.scrapKg);
	const issues = await sql.query(`select lot_id, qty_kg, item_id from wo_issue where wo_id = $1`, [wo.id]);
	if (!issues[0]) throw new Error("Issue rod before booking");
	const parentLot = await getLot(sql, issues[0].lot_id);
	const gate = woCompleteCheck({
		issuedKg: n(wo.issued_kg),
		goodPcs: data.goodPcs,
		rejectPcs: data.rejectPcs,
		kgPerPc: kgPer,
		tolerancePct: .5
	});
	if (!gate.ok) throw new Error(gate.message);
	const parentAlloy = (await sql.query(`select code from alloy where id = $1`, [parentLot.alloy_id]))[0];
	const sfg = await warehouseByCode(sql, "SFG");
	const rejWh = await warehouseByCode(sql, "FG-REJECT");
	const scrapWh = await warehouseByCode(sql, "RM-SCRAP");
	const unit = parentLot.unit_value_paise_per_kg;
	const backflush = await setting(sql, "wo_backflush", "1") !== "0";
	const gap = yieldGap({
		issuedKg: n(wo.issued_kg),
		goodKg,
		rejectKg,
		scrapKg
	});
	return withStockTx(sql, async () => {
		let fgLot = null;
		let rejectLot = null;
		let scrapLot = null;
		let runnerLot = null;
		if (data.goodPcs > 0) {
			fgLot = await createLot(sql, {
				itemId: item.id,
				warehouseId: sfg.id,
				alloyId: item.alloy_id,
				heatNo: parentLot.heat_no,
				qtyKg: 0,
				qtyPcs: 0,
				status: "AVAILABLE",
				unitValuePaisePerKg: unit,
				parentLotId: parentLot.id,
				sourceType: "WO",
				sourceId: wo.id
			});
			await postMove(sql, {
				moveType: "WO_RECEIPT_SFG_FG",
				itemId: item.id,
				lotId: fgLot.id,
				warehouseId: sfg.id,
				qtyKg: goodKg,
				qtyPcs: data.goodPcs,
				refType: "WO",
				refId: wo.id,
				userId: staff.user_id,
				alloyId: item.alloy_id,
				unitValuePaisePerKg: unit,
				kgPerPc: kgPer,
				conversionKind: "FG",
				itemAlloyId: item.alloy_id,
				consumedLotId: parentLot.id
			});
			await linkGenealogy(sql, fgLot.id, parentLot.id, goodKg, data.goodPcs);
		}
		if (data.rejectPcs > 0) {
			rejectLot = await createLot(sql, {
				itemId: item.id,
				warehouseId: rejWh.id,
				alloyId: item.alloy_id,
				heatNo: parentLot.heat_no,
				qtyKg: 0,
				qtyPcs: 0,
				status: "REJECTED",
				unitValuePaisePerKg: unit,
				parentLotId: parentLot.id,
				sourceType: "WO",
				sourceId: wo.id
			});
			await postMove(sql, {
				moveType: "WO_RECEIPT_SFG_FG",
				itemId: item.id,
				lotId: rejectLot.id,
				warehouseId: rejWh.id,
				qtyKg: rejectKg,
				qtyPcs: data.rejectPcs,
				refType: "WO",
				refId: wo.id,
				userId: staff.user_id,
				alloyId: item.alloy_id,
				unitValuePaisePerKg: unit,
				kgPerPc: kgPer,
				conversionKind: "FG",
				itemAlloyId: item.alloy_id,
				reasonCode: "REJ-DIM",
				notes: "Shop reject"
			});
			await linkGenealogy(sql, rejectLot.id, parentLot.id, rejectKg, data.rejectPcs);
			const ncrNo = await nextDoc(sql, "NCR");
			await sql.query(`insert into ncr (doc_no, lot_id, item_id, source, description, status, created_by)
         values ($1,$2,$3,'WO','Shop reject on booking','OPEN',$4)`, [
				ncrNo,
				rejectLot.id,
				item.id,
				staff.user_id
			]);
		}
		const turnItem = (await sql.query(`select i.id, i.alloy_id, i.sku from bom_line bl
           join item i on i.id = bl.component_item_id
          where bl.bom_id = $1 and bl.is_co_product = true and i.type = 'SCRAP'
          order by case when i.sku like '%TURN%' then 0 else 1 end
          limit 1`, [wo.bom_id]))[0];
		if (scrapKg > 0) {
			if (!turnItem) throw new Error("No same-alloy turning scrap item on the frozen BOM");
			assertAlloyMatch({
				lotAlloyId: parentLot.alloy_id,
				itemAlloyId: turnItem.alloy_id,
				lotAlloyCode: parentAlloy?.code,
				context: `WO turning scrap ${turnItem.sku}`
			});
			const existing = (await sql.query(`select id from stock_lot where item_id = $1 and warehouse_id = $2 and status = 'AVAILABLE' limit 1`, [turnItem.id, scrapWh.id]))[0];
			scrapLot = existing ? await getLot(sql, existing.id) : await createLot(sql, {
				itemId: turnItem.id,
				warehouseId: scrapWh.id,
				alloyId: turnItem.alloy_id,
				qtyKg: 0,
				qtyPcs: 0,
				status: "AVAILABLE",
				unitValuePaisePerKg: 41e3,
				sourceType: "WO",
				sourceId: wo.id
			});
			await postMove(sql, {
				moveType: "WO_SCRAP",
				itemId: turnItem.id,
				lotId: scrapLot.id,
				warehouseId: scrapWh.id,
				qtyKg: scrapKg,
				qtyPcs: 0,
				refType: "WO",
				refId: wo.id,
				notes: "Turning — same alloy",
				userId: staff.user_id,
				alloyId: turnItem.alloy_id,
				unitValuePaisePerKg: 41e3,
				itemAlloyId: turnItem.alloy_id,
				reasonCode: "SCRAP-TURN"
			});
			await linkGenealogy(sql, scrapLot.id, parentLot.id, scrapKg, 0);
		}
		const issued = n(wo.issued_kg);
		const accounted = gap.accountedKg;
		const runnerKg = backflush ? gap.remainderKg : 0;
		const runnerItem = (await sql.query(`select id, alloy_id from item where sku = 'SC-C360-RUNNER'`))[0];
		if (runnerKg > 5e-4 && runnerItem) {
			assertAlloyMatch({
				lotAlloyId: parentLot.alloy_id,
				itemAlloyId: runnerItem.alloy_id,
				lotAlloyCode: parentAlloy?.code,
				context: "WO runner backflush"
			});
			const existing = (await sql.query(`select id from stock_lot where item_id = $1 and warehouse_id = $2 and status = 'AVAILABLE' limit 1`, [runnerItem.id, scrapWh.id]))[0];
			runnerLot = existing ? await getLot(sql, existing.id) : await createLot(sql, {
				itemId: runnerItem.id,
				warehouseId: scrapWh.id,
				alloyId: runnerItem.alloy_id,
				qtyKg: 0,
				qtyPcs: 0,
				status: "AVAILABLE",
				unitValuePaisePerKg: 39e3,
				sourceType: "WO",
				sourceId: wo.id
			});
			await postMove(sql, {
				moveType: "WO_BACKFLUSH",
				itemId: runnerItem.id,
				lotId: runnerLot.id,
				warehouseId: scrapWh.id,
				qtyKg: runnerKg,
				qtyPcs: 0,
				refType: "WO",
				refId: wo.id,
				notes: "Unaccounted issue auto-posted to runner (mass conservation)",
				userId: staff.user_id,
				alloyId: runnerItem.alloy_id,
				unitValuePaisePerKg: 39e3,
				itemAlloyId: runnerItem.alloy_id,
				reasonCode: "SCRAP-RUNNER"
			});
		}
		await sql.query(`insert into wo_booking (wo_id, good_pcs, reject_pcs, scrap_kg, scrap_item_id, fg_lot_id, reject_lot_id, scrap_lot_id, runner_lot_id, user_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [
			wo.id,
			data.goodPcs,
			data.rejectPcs,
			scrapKg,
			turnItem?.id ?? null,
			fgLot?.id ?? null,
			rejectLot?.id ?? null,
			scrapLot?.id ?? null,
			runnerLot?.id ?? null,
			staff.user_id
		]);
		const done = n(wo.good_pcs) + data.goodPcs + data.rejectPcs >= n(wo.qty_pcs);
		await sql.query(`update work_order
          set good_pcs = good_pcs + $1, reject_pcs = reject_pcs + $2, scrap_kg = scrap_kg + $3,
              status = $4
        where id = $5`, [
			data.goodPcs,
			data.rejectPcs,
			scrapKg,
			done ? "COMPLETE" : "ISSUED",
			wo.id
		]);
		const yieldPct = issued > 0 ? goodKg / issued * 100 : 0;
		await sql.query(`insert into cost_variance (wo_id, kind, expected, actual, variance, notes)
       values ($1,'YIELD',$2,$3,$4,$5)`, [
			wo.id,
			100 / 1.08,
			yieldPct,
			yieldPct - 100 / 1.08,
			`good ${data.goodPcs} pcs / issued ${issued} kg · gap ${gap.remainderKg} kg`
		]);
		return {
			fgLotNo: fgLot?.lot_no ?? null,
			rejectLotNo: rejectLot?.lot_no ?? null,
			scrapLotNo: scrapLot?.lot_no ?? null,
			runnerKg,
			goodKg,
			yieldPct,
			yieldGapKg: gap.remainderKg,
			theoreticalKg: gate.theoreticalKg,
			accountedKg: accounted
		};
	});
});
var requestStockAdjust_createServerFn_handler = createServerRpc({
	id: "d534ec36077ab69ba158f92bc4afe4a244365bbf7b8351b59d41dc397f1ecfc6",
	name: "requestStockAdjust",
	filename: "src/lib/erp/api.ts"
}, (opts) => requestStockAdjust.__executeServer(opts));
var requestStockAdjust = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	lotId: number(),
	qtyKg: number(),
	qtyPcs: number().default(0),
	reason: string().min(3),
	reasonCode: _enum([
		"ADJ-COUNT",
		"ADJ-UOM-ERROR",
		"ADJ-THEFT-INVESTIGATE"
	]).default("ADJ-COUNT")
})).handler(requestStockAdjust_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "stock_adjust");
	if (!isReasonCode(data.reasonCode) || !REASON_CODES.ADJ.includes(data.reasonCode)) throw new Error("Adjustment requires a reason code (ADJ-COUNT / ADJ-UOM-ERROR / ADJ-THEFT-INVESTIGATE)");
	const sql = await erpSql();
	const lot = await getLot(sql, data.lotId);
	if (data.qtyKg < 0 && n(lot.qty_kg) + data.qtyKg < -5e-4) throw new Error("Would drive lot kg negative");
	if (data.qtyPcs < 0 && n(lot.qty_pcs) + data.qtyPcs < -5e-4) throw new Error("Would drive lot pcs negative");
	const absValue = Math.abs(Math.round(data.qtyKg * lot.unit_value_paise_per_kg));
	const threshold = n(await setting(sql, "adjust_dual_approval_paise", "500000"));
	if (absValue > threshold && staff.role !== "OWNER" && staff.role !== "ADMIN") {
		const row = (await sql.query(`insert into approval_request (kind, payload_json, threshold_paise, requested_by, status)
           values ('STOCK_ADJUST', $1, $2, $3, 'PENDING') returning id`, [
			JSON.stringify({
				lotId: data.lotId,
				lotNo: lot.lot_no,
				qtyKg: data.qtyKg,
				qtyPcs: data.qtyPcs,
				reason: data.reason,
				reasonCode: data.reasonCode
			}),
			absValue,
			staff.user_id
		]))[0];
		await audit(sql, {
			userId: staff.user_id,
			action: "ADJUST_REQUEST",
			entity: "approval_request",
			entityId: row.id,
			after: data
		});
		return {
			status: "PENDING",
			id: row.id,
			absValue,
			threshold
		};
	}
	const moveType = data.qtyKg < 0 || data.qtyPcs < 0 ? "ADJUST_MINUS" : "ADJUST_PLUS";
	await withStockTx(sql, async () => {
		await postMove(sql, {
			moveType,
			itemId: lot.item_id,
			lotId: lot.id,
			warehouseId: lot.warehouse_id,
			qtyKg: data.qtyKg,
			qtyPcs: data.qtyPcs,
			notes: data.reason,
			userId: staff.user_id,
			alloyId: lot.alloy_id,
			unitValuePaisePerKg: lot.unit_value_paise_per_kg,
			reasonCode: data.reasonCode,
			itemAlloyId: lot.alloy_id
		});
	});
	await audit(sql, {
		userId: staff.user_id,
		action: "STOCK_ADJUST",
		entity: "stock_lot",
		entityId: lot.id,
		after: data
	});
	return {
		status: "POSTED",
		absValue,
		threshold
	};
});
var approveStockAdjust_createServerFn_handler = createServerRpc({
	id: "c6f981083003ff788b943df83e911bc6039befe24e024375b56da06ec558a31f",
	name: "approveStockAdjust",
	filename: "src/lib/erp/api.ts"
}, (opts) => approveStockAdjust.__executeServer(opts));
var approveStockAdjust = createServerFn({ method: "POST" }).middleware(auth).validator(object({
	id: number(),
	decision: _enum(["APPROVE", "REJECT"])
})).handler(approveStockAdjust_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	if (staff.role !== "OWNER" && staff.role !== "ADMIN") throw new Error("Only Owner / Admin can approve stock adjustments");
	const sql = await erpSql();
	const req = (await sql.query(`select * from approval_request where id = $1`, [data.id]))[0];
	if (!req) throw new Error("Approval not found");
	if (req.status !== "PENDING") throw new Error("Already decided");
	if (req.requested_by === staff.user_id) throw new Error("Requester cannot self-approve");
	if (data.decision === "REJECT") {
		await sql.query(`update approval_request set status = 'REJECTED', approved_by = $1, approved_at = now() where id = $2`, [staff.user_id, req.id]);
		return { status: "REJECTED" };
	}
	const payload = JSON.parse(req.payload_json);
	const lot = await getLot(sql, payload.lotId);
	const reasonCode = payload.reasonCode && isReasonCode(payload.reasonCode) ? payload.reasonCode : "ADJ-COUNT";
	const moveType = payload.qtyKg < 0 || payload.qtyPcs < 0 ? "ADJUST_MINUS" : "ADJUST_PLUS";
	await withStockTx(sql, async () => {
		await postMove(sql, {
			moveType,
			itemId: lot.item_id,
			lotId: lot.id,
			warehouseId: lot.warehouse_id,
			qtyKg: payload.qtyKg,
			qtyPcs: payload.qtyPcs,
			notes: payload.reason,
			userId: staff.user_id,
			alloyId: lot.alloy_id,
			unitValuePaisePerKg: lot.unit_value_paise_per_kg,
			reasonCode,
			itemAlloyId: lot.alloy_id
		});
	});
	await sql.query(`update approval_request set status = 'APPROVED', approved_by = $1, approved_at = now() where id = $2`, [staff.user_id, req.id]);
	await audit(sql, {
		userId: staff.user_id,
		action: "ADJUST_APPROVE",
		entity: "approval_request",
		entityId: req.id,
		after: payload
	});
	return { status: "APPROVED" };
});
var reverseGrn_createServerFn_handler = createServerRpc({
	id: "d119ccf47b096492d2ce9d638bf07dc52b6fac8947a5faa6d11d6c5d2897423e",
	name: "reverseGrn",
	filename: "src/lib/erp/api.ts"
}, (opts) => reverseGrn.__executeServer(opts));
var reverseGrn = createServerFn({ method: "POST" }).middleware(auth).validator(object({ grnId: number() })).handler(reverseGrn_createServerFn_handler, async ({ context, data }) => {
	const staff = await requireStaff(uid(context));
	assertPerm(staff, "purchase");
	const sql = await erpSql();
	const grn = (await sql.query(`select * from grn where id = $1`, [data.grnId]))[0];
	if (!grn) throw new Error("GRN not found");
	if (grn.status === "REVERSED") throw new Error("GRN already reversed");
	const originals = await sql.query(`select id, notes, qty_kg from stock_move
        where ref_type = 'GRN' and ref_id = $1 and move_type in ('GRN_RECEIPT','GRN')
        order by id`, [grn.id]);
	if (!originals[0]) throw new Error("No GRN_RECEIPT move to reverse");
	const reversed = await withStockTx(sql, async () => {
		const ids = [];
		for (const m of originals) {
			if (String(m.notes ?? "").includes("REVERSES:")) continue;
			if ((await sql.query(`select id from stock_move where notes like $1 limit 1`, [`%REVERSES:${m.id}%`]))[0]) continue;
			const r = await reverseStockMove(sql, {
				moveId: m.id,
				userId: staff.user_id,
				reasonCode: "ADJ-COUNT"
			});
			ids.push(r.reverseMoveId);
		}
		if (!ids.length) throw new Error("GRN receipt already reversed");
		await sql.query(`update grn set status = 'REVERSED' where id = $1`, [grn.id]);
		await audit(sql, {
			userId: staff.user_id,
			action: "GRN_REVERSE",
			entity: "grn",
			entityId: grn.id,
			after: {
				originalDoc: grn.doc_no,
				reverseMoveIds: ids
			}
		});
		return ids;
	});
	return {
		docNo: grn.doc_no,
		reverseMoveIds: reversed,
		originalRemains: true
	};
});
//#endregion
export { approveStockAdjust_createServerFn_handler, bookWo_createServerFn_handler, createSalesOrder_createServerFn_handler, createWorkOrder_createServerFn_handler, explodeSo_createServerFn_handler, getBootstrap_createServerFn_handler, getDashboard_createServerFn_handler, getGenealogy_createServerFn_handler, getJourneys_createServerFn_handler, getLotLedger_createServerFn_handler, issueToWo_createServerFn_handler, listJobWork_createServerFn_handler, listMasters_createServerFn_handler, listMoves_createServerFn_handler, listOnHand_createServerFn_handler, listOpenDocs_createServerFn_handler, postGrn_createServerFn_handler, releaseLot_createServerFn_handler, requestStockAdjust_createServerFn_handler, reverseGrn_createServerFn_handler };
