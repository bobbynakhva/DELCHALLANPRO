import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, audit, erpSql, nextDoc, requireStaff, setting } from "./core.server";
import { n, roundKg, todayISO } from "./format";
import { uid, type Row } from "./row";
import { computeAtp, assertOverrideReason } from "@/modules/planning/atp";
import { explodeDemand, netRequirement, wcLoadPct, type MrpItemSupply } from "@/modules/planning/mrp";
import { quoteItem, loadMetalBook } from "@/modules/quote/load";
import { assertRateDateNotFuture, quoteIsFrozen, type MetalBasis } from "@/modules/quote/engine";
import { createHeat, foundryEnabled, foundryKpis } from "./foundry-service";

const auth = [authMiddleware];

export const previewQuote = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(
    z.object({
      itemId: z.coerce.number(),
      asOf: z.string().optional(),
      basis: z.enum(["CU_ZN_BLEND", "ALLOY_DEALER_RATE"]).optional(),
      marginPct: z.coerce.number().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const asOf = data.asOf || todayISO();
    assertRateDateNotFuture(asOf, todayISO());
    const snap = await quoteItem(sql, {
      itemId: data.itemId,
      asOf,
      basis: data.basis as MetalBasis | undefined,
      marginPct: data.marginPct,
    });
    return snap;
  });

async function atpParts(sql: Awaited<ReturnType<typeof erpSql>>, itemId: number, excludeSoLineId?: number) {
  const fg = (
    await sql.query<{ pcs: string }>(
      `select coalesce(sum(l.qty_pcs),0) as pcs
         from stock_lot l join warehouse w on w.id = l.warehouse_id
        where l.item_id = $1 and l.status = 'AVAILABLE' and l.owner_type = 'OWN'
          and w.kind in ('FG','SFG') and w.is_customer_owned = false`,
      [itemId],
    )
  )[0];
  const wo = (
    await sql.query<{ pcs: string }>(
      `select coalesce(sum(qty_pcs - good_pcs - reject_pcs),0) as pcs
         from work_order where item_id = $1 and status in ('OPEN','ISSUED','DRAFT')`,
      [itemId],
    )
  )[0];
  const jw = (
    await sql.query<{ pcs: string }>(
      `select coalesce(sum(l.qty_pcs - l.returned_pcs),0) as pcs
         from job_work_challan_line l
         join job_work_challan c on c.id = l.challan_id
        where l.item_id = $1 and c.status <> 'CLOSED'`,
      [itemId],
    )
  )[0];
  const promised = (
    await sql.query<{ pcs: string }>(
      `select coalesce(sum(qty_pcs - qty_dispatched - reserved_pcs),0) as pcs
         from so_line sl join sales_order so on so.id = sl.so_id
        where sl.item_id = $1 and so.status in ('OPEN','PARTIAL')
          and ($2::int is null or sl.id <> $2)`,
      [itemId, excludeSoLineId ?? null],
    )
  )[0];
  const item = (
    await sql.query<{
      daily_pcs: string;
      purchase_lead_days: number;
      jw_days: number;
      pack_days: number;
    }>(`select daily_pcs, purchase_lead_days, jw_days, pack_days from item where id = $1`, [itemId])
  )[0];
  const setup = (
    await sql.query<{ setup_min: number }>(
      `select coalesce(max(ro.setup_min),0)::int as setup_min
         from routing r join routing_op ro on ro.routing_id = r.id
        where r.item_id = $1`,
      [itemId],
    )
  )[0];
  return {
    availableFgPcs: n(fg?.pcs),
    openWoRemainingPcs: Math.max(0, n(wo?.pcs)),
    jwPipelinePcs: n(jw?.pcs),
    alreadyPromisedPcs: Math.max(0, n(promised?.pcs)),
    dailyPcs: n(item?.daily_pcs) || 1600,
    purchaseLeadDays: item?.purchase_lead_days ?? 7,
    jwDays: item?.jw_days ?? 14,
    packDays: item?.pack_days ?? 1,
    setupMin: setup?.setup_min ?? 0,
  };
}

export const promiseSoLine = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      soLineId: z.coerce.number(),
      overrideDate: z.string().optional(),
      overrideReason: z.string().optional(),
      allocateLotId: z.coerce.number().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "sales");
    const sql = await erpSql();
    const line = (
      await sql.query<{
        id: number;
        so_id: number;
        item_id: number;
        qty_pcs: string;
        qty_dispatched: string;
        promise_date: string | null;
      }>(`select * from so_line where id = $1`, [data.soLineId])
    )[0];
    if (!line) throw new Error("SO line not found");
    const parts = await atpParts(sql, line.item_id, line.id);
    const atp = computeAtp({ qtyPcs: n(line.qty_pcs) - n(line.qty_dispatched), ...parts, today: todayISO() });
    let promiseDate = atp.promiseDate;
    if (data.overrideDate && data.overrideDate !== atp.promiseDate) {
      assertOverrideReason(true, data.overrideReason);
      promiseDate = data.overrideDate;
    }
    if (data.allocateLotId) {
      const lot = (
        await sql.query<{ id: number; item_id: number; qty_pcs: string; reserved_so_line_id: number | null; status: string }>(
          `select id, item_id, qty_pcs, reserved_so_line_id, status from stock_lot where id = $1`,
          [data.allocateLotId],
        )
      )[0];
      if (!lot || lot.item_id !== line.item_id) throw new Error("Lot does not match SO item");
      if (lot.status !== "AVAILABLE") throw new Error("Lot is not AVAILABLE");
      if (lot.reserved_so_line_id && lot.reserved_so_line_id !== line.id) {
        throw new Error("Lot is reserved to another SO — cannot allocate");
      }
      await sql.query(`update stock_lot set reserved_so_line_id = $1, reserved_pcs = $2 where id = $3`, [
        line.id,
        n(line.qty_pcs),
        lot.id,
      ]);
      await sql.query(`update so_line set reserved_lot_id = $1, reserved_pcs = $2 where id = $3`, [
        lot.id,
        n(line.qty_pcs),
        line.id,
      ]);
    }
    await sql.query(
      `update so_line set promise_date = $1, promise_working = $2, promise_override_reason = $3 where id = $4`,
      [promiseDate, atp.working.join("\n"), data.overrideReason ?? null, line.id],
    );
    return { promiseDate, atp };
  });

export const getAtp = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ soLineId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const line = (
      await sql.query<{ item_id: number; qty_pcs: string; qty_dispatched: string; promise_date: string | null; promise_working: string | null; promise_override_reason: string | null }>(
        `select * from so_line where id = $1`,
        [data.soLineId],
      )
    )[0];
    if (!line) throw new Error("SO line not found");
    const parts = await atpParts(sql, line.item_id, data.soLineId);
    const atp = computeAtp({ qtyPcs: n(line.qty_pcs) - n(line.qty_dispatched), ...parts, today: todayISO() });
    return { atp, savedDate: line.promise_date, savedWorking: line.promise_working, override: line.promise_override_reason };
  });

export const runMrp = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ horizonDays: z.coerce.number().default(14) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role !== "OWNER" && staff.role !== "PPC" && staff.role !== "ADMIN") {
      throw new Error("Only PPC / Owner can run MRP");
    }
    const sql = await erpSql();
    const horizon = data.horizonDays === 42 ? 42 : 14;
    const fence = n(await setting(sql, "mrp_time_fence_days", "3"));
    const runNo = await nextDoc(sql, "MRP");
    const run = (
      await sql.query<{ id: number }>(
        `insert into mrp_run (run_no, horizon_days, time_fence_days, user_id) values ($1,$2,$3,$4) returning id`,
        [runNo, horizon, fence, staff.user_id],
      )
    )[0]!;

    const items = await sql.query<{
      id: number;
      sku: string;
      type: string;
      stock_uom: string;
      safety_stock_pcs: string;
      min_qty_kg: string;
    }>(`select id, sku, type, stock_uom, safety_stock_pcs, min_qty_kg from item where active = true and type in ('FG','RM')`);

    const supplies: MrpItemSupply[] = [];
    const extraRod = new Map<number, number>();

    for (const it of items.filter((i) => i.type === "FG")) {
      const soDem = (
        await sql.query<{ q: string }>(
          `select coalesce(sum(sl.qty_pcs - sl.qty_dispatched),0) as q
             from so_line sl join sales_order so on so.id = sl.so_id
            where sl.item_id = $1 and so.status in ('OPEN','PARTIAL')
              and so.order_date <= current_date + ($2 || ' days')::interval`,
          [it.id, horizon],
        )
      )[0];
      const fc = (
        await sql.query<{ q: string }>(
          `select coalesce(sum(qty_pcs),0) as q from demand_forecast
            where item_id = $1 and week_start <= current_date + ($2 || ' days')::interval`,
          [it.id, horizon],
        )
      )[0];
      const avail = (
        await sql.query<{ q: string }>(
          `select coalesce(sum(qty_pcs),0) as q from stock_lot l
             join warehouse w on w.id = l.warehouse_id
            where l.item_id = $1 and l.status = 'AVAILABLE' and l.owner_type = 'OWN'
              and w.kind in ('FG','SFG')`,
          [it.id],
        )
      )[0];
      const wo = (
        await sql.query<{ q: string; fence: boolean }>(
          `select coalesce(sum(qty_pcs - good_pcs - reject_pcs),0) as q,
                  bool_or(status in ('ISSUED','OPEN') and coalesce(due_date, current_date) <= current_date + ($2 || ' days')::interval) as fence
             from work_order where item_id = $1 and status in ('OPEN','ISSUED','DRAFT')`,
          [it.id, fence],
        )
      )[0];
      const jw = (
        await sql.query<{ q: string }>(
          `select coalesce(sum(l.qty_pcs - l.returned_pcs),0) as q
             from job_work_challan_line l join job_work_challan c on c.id = l.challan_id
            where l.item_id = $1 and c.status <> 'CLOSED'
              and coalesce(c.expected_return_at, current_date) <= current_date + ($2 || ' days')::interval`,
          [it.id, horizon],
        )
      )[0];
      const row = netRequirement({
        itemId: it.id,
        sku: it.sku,
        type: it.type,
        uom: "PCS",
        safetyQty: n(it.safety_stock_pcs),
        availableQty: n(avail?.q),
        openWoQty: n(wo?.q),
        openPoQty: 0,
        jwPipelineQty: n(jw?.q),
        soDemandQty: n(soDem?.q),
        forecastQty: n(fc?.q),
        releasedWoInsideFence: Boolean(wo?.fence),
        extraReleasedQty: 0,
      });
      supplies.push({
        itemId: it.id,
        sku: it.sku,
        type: it.type,
        uom: "PCS",
        safetyQty: n(it.safety_stock_pcs),
        availableQty: n(avail?.q),
        openWoQty: n(wo?.q),
        openPoQty: 0,
        jwPipelineQty: n(jw?.q),
        soDemandQty: n(soDem?.q),
        forecastQty: n(fc?.q),
        releasedWoInsideFence: Boolean(wo?.fence),
        extraReleasedQty: 0,
      });
      if (row.action === "CREATE_WO" || row.action === "EXPEDITE_WO") {
        const bom = await sql.query<{ component_item_id: number; qty_per: string; qty_uom: string; is_co_product: boolean }>(
          `select bl.component_item_id, bl.qty_per, bl.qty_uom, bl.is_co_product
             from bom b join bom_line bl on bl.bom_id = b.id
            where b.item_id = $1 and b.status = 'APPROVED'`,
          [it.id],
        );
        for (const nline of explodeDemand(row.suggestedQty, bom.map((b) => ({
          componentItemId: b.component_item_id,
          qtyPer: n(b.qty_per),
          uom: b.qty_uom,
          isCoProduct: b.is_co_product,
        })))) {
          extraRod.set(nline.itemId, (extraRod.get(nline.itemId) ?? 0) + nline.qty);
        }
      }
      await insertMrpLine(sql, run.id, row, n(soDem?.q) > 0 ? undefined : undefined);
    }

    for (const it of items.filter((i) => i.type === "RM")) {
      const avail = (
        await sql.query<{ q: string }>(
          `select coalesce(sum(qty_kg),0) as q from stock_lot
            where item_id = $1 and status = 'AVAILABLE' and owner_type = 'OWN'`,
          [it.id],
        )
      )[0];
      const po = (
        await sql.query<{ q: string }>(
          `select coalesce(sum(qty_kg - received_kg),0) as q from po_line pl
             join purchase_order p on p.id = pl.po_id
            where pl.item_id = $1 and p.status in ('OPEN','PARTIAL','DRAFT')`,
          [it.id],
        )
      )[0];
      const exploded = extraRod.get(it.id) ?? 0;
      const row = netRequirement({
        itemId: it.id,
        sku: it.sku,
        type: "RM",
        uom: "KG",
        safetyQty: n(it.min_qty_kg),
        availableQty: n(avail?.q),
        openWoQty: 0,
        openPoQty: n(po?.q),
        jwPipelineQty: 0,
        soDemandQty: exploded,
        forecastQty: 0,
        releasedWoInsideFence: false,
        extraReleasedQty: 0,
      });
      await insertMrpLine(sql, run.id, row);
    }

    if (await foundryEnabled(sql)) {
      const casts = await sql.query<{
        id: number;
        sku: string;
        min_qty_kg: string;
        alloy_id: number | null;
      }>(
        `select id, sku, min_qty_kg, alloy_id from item where active = true and type = 'SFG' and family = 'CASTING'`,
      );
      for (const it of casts) {
        const avail = (
          await sql.query<{ q: string }>(
            `select coalesce(sum(l.qty_kg),0) as q
               from stock_lot l join warehouse w on w.id = l.warehouse_id
              where l.item_id = $1 and l.status = 'AVAILABLE' and l.owner_type = 'OWN'
                and not w.is_outside_factory`,
            [it.id],
          )
        )[0];
        const wip = (
          await sql.query<{ q: string }>(
            `select coalesce(sum(l.qty_kg),0) as q
               from stock_lot l join warehouse w on w.id = l.warehouse_id
              where w.code = 'WIP-MELT' and l.alloy_id is not distinct from $1`,
            [it.alloy_id],
          )
        )[0];
        const openHeat = (
          await sql.query<{ q: string }>(
            `select coalesce(sum(charged_kg - good_kg - runner_kg - dross_kg - reject_kg - loss_kg),0) as q
               from heat where alloy_id is not distinct from $1
                 and status in ('CHARGED','HOLD_SPECTRO','RELEASED_POUR','POURED')`,
            [it.alloy_id],
          )
        )[0];
        const row = netRequirement({
          itemId: it.id,
          sku: it.sku,
          type: "SFG",
          uom: "KG",
          safetyQty: n(it.min_qty_kg),
          availableQty: n(avail?.q) + n(wip?.q),
          openWoQty: n(openHeat?.q),
          openPoQty: 0,
          jwPipelineQty: 0,
          soDemandQty: 0,
          forecastQty: 0,
          releasedWoInsideFence: false,
          extraReleasedQty: 0,
        });
        const action = row.shortfallQty > 0.0005 ? "CREATE_MELT" : "NONE";
        await insertMrpLine(sql, run.id, { ...row, action });
      }
    }

    const lines = await sql.query<Row>(
      `select ml.*, i.sku, i.name as item_name, i.type as item_type
         from mrp_line ml join item i on i.id = ml.item_id
        where ml.run_id = $1 order by i.type, i.sku`,
      [run.id],
    );
    await audit(sql, { userId: staff.user_id, action: "MRP_RUN", entity: "mrp_run", entityId: run.id, after: { runNo, horizon } });
    return { id: run.id, runNo, horizonDays: horizon, lines };
  });

async function insertMrpLine(
  sql: Awaited<ReturnType<typeof erpSql>>,
  runId: number,
  row: ReturnType<typeof netRequirement>,
  pegSo?: number,
) {
  await sql.query(
    `insert into mrp_line (
       run_id, item_id, demand_qty, supply_qty, available_qty, open_wo_qty, open_po_qty, jw_pipeline_qty,
       shortfall_qty, qty_uom, action, suggested_qty, pegging_json, pegging_so_id
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
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
      pegSo ?? null,
    ],
  );
}

export const listMrp = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const runs = await sql.query<Row>(`select * from mrp_run order by id desc limit 8`);
    const latest = runs[0];
    const lines = latest
      ? await sql.query<Row>(
          `select ml.*, i.sku, i.name as item_name, i.type as item_type
             from mrp_line ml join item i on i.id = ml.item_id
            where ml.run_id = $1 order by i.type, i.sku`,
          [latest.id],
        )
      : [];
    const load = await sql.query<Row>(
      `select wc.code, wc.name, wc.weekly_minutes, wc.queue_days,
              coalesce((
                select sum(wo.qty_pcs * ro.run_sec_per_pc / 60.0 + ro.setup_min)
                  from work_order wo
                  join routing r on r.item_id = wo.item_id
                  join routing_op ro on ro.routing_id = r.id and ro.work_center_id = wc.id
                 where wo.status in ('OPEN','ISSUED')
              ),0) as open_minutes
         from work_center wc order by wc.id`,
    );
    return {
      runs,
      latest,
      lines,
      load: load.map((w) => ({
        code: w.code,
        name: w.name,
        weekly_minutes: w.weekly_minutes,
        queue_days: w.queue_days,
        open_minutes: w.open_minutes,
        load_pct: wcLoadPct(n(w.open_minutes), n(w.weekly_minutes)),
      })),
    };
  });

export const applyMrpDrafts = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ runId: z.coerce.number(), lineIds: z.array(z.coerce.number()) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    if (staff.role !== "OWNER" && staff.role !== "PPC" && staff.role !== "ADMIN") {
      throw new Error("Only PPC / Owner can spawn drafts");
    }
    const sql = await erpSql();
    const created: Array<{ kind: string; docNo: string }> = [];
    for (const id of data.lineIds) {
      const ln = (
        await sql.query<{
          id: number;
          item_id: number;
          action: string;
          suggested_qty: string;
          qty_uom: string;
        }>(`select * from mrp_line where id = $1 and run_id = $2`, [id, data.runId])
      )[0];
      if (!ln) continue;
      if (ln.action === "CREATE_WO") {
        const bom = (
          await sql.query<{ id: number }>(`select id from bom where item_id = $1 and status = 'APPROVED' limit 1`, [
            ln.item_id,
          ])
        )[0];
        const docNo = await nextDoc(sql, "WO");
        const wo = (
          await sql.query<{ id: number }>(
            `insert into work_order (doc_no, item_id, bom_id, qty_pcs, required_kg, status, created_by, due_date)
             values ($1,$2,$3,$4,$5,'DRAFT',$6, current_date + 14) returning id`,
            [docNo, ln.item_id, bom?.id ?? null, n(ln.suggested_qty), 0, staff.user_id],
          )
        )[0]!;
        await sql.query(`update mrp_line set selected = true, draft_doc_type = 'WO', draft_doc_id = $1 where id = $2`, [
          wo.id,
          ln.id,
        ]);
        created.push({ kind: "WO", docNo });
      } else if (ln.action === "CREATE_PO") {
        const vendor = (
          await sql.query<{ id: number }>(`select id from partner where is_vendor = true and is_job_worker = false order by id limit 1`)
        )[0];
        if (!vendor) continue;
        const docNo = await nextDoc(sql, "PO");
        const po = (
          await sql.query<{ id: number }>(
            `insert into purchase_order (doc_no, partner_id, status, order_date, notes, created_by)
             values ($1,$2,'DRAFT', current_date, 'MRP draft — not posted', $3) returning id`,
            [docNo, vendor.id, staff.user_id],
          )
        )[0]!;
        await sql.query(
          `insert into po_line (po_id, item_id, qty_kg, rate_paise_per_kg) values ($1,$2,$3,62000)`,
          [po.id, ln.item_id, n(ln.suggested_qty)],
        );
        await sql.query(`update mrp_line set selected = true, draft_doc_type = 'PO', draft_doc_id = $1 where id = $2`, [
          po.id,
          ln.id,
        ]);
        created.push({ kind: "PO", docNo });
      } else if (ln.action === "CREATE_JW") {
        const worker = (
          await sql.query<{ id: number }>(`select id from partner where is_job_worker = true order by id limit 1`)
        )[0];
        if (!worker) continue;
        const docNo = await nextDoc(sql, "JW");
        const jw = (
          await sql.query<{ id: number }>(
            `insert into job_work_order (doc_no, partner_id, process_code, status, loss_norm_pct)
             values ($1,$2,'NI_CR','DRAFT',1.5) returning id`,
            [docNo, worker.id],
          )
        )[0]!;
        await sql.query(`update mrp_line set selected = true, draft_doc_type = 'JW', draft_doc_id = $1 where id = $2`, [
          jw.id,
          ln.id,
        ]);
        created.push({ kind: "JW", docNo });
      } else if (ln.action === "CREATE_MELT") {
        const item = (
          await sql.query<{ alloy_id: number | null }>(`select alloy_id from item where id = $1`, [ln.item_id])
        )[0];
        if (!item?.alloy_id) continue;
        const heat = await createHeat(sql, { alloyId: item.alloy_id, userId: staff.user_id });
        await sql.query(`update mrp_line set selected = true, draft_doc_type = 'HT', draft_doc_id = $1 where id = $2`, [
          heat.id,
          ln.id,
        ]);
        created.push({ kind: "HT", docNo: heat.docNo });
      }
    }
    return { created };
  });

export const variancePack = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      from: z.string(),
      to: z.string(),
      freeze: z.boolean().default(false),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const yieldRows = await sql.query<Row>(
      `select wo.id as wo_id, wo.doc_no, wo.issued_kg, wo.scrap_kg, wo.good_pcs, i.kg_per_pc, i.sku
         from work_order wo join item i on i.id = wo.item_id
        where wo.created_at::date between $1 and $2`,
      [data.from, data.to],
    );
    const jwRows = await sql.query<Row>(
      `select x.*, r.doc_no, c.doc_no as challan_no
         from job_work_loss x
         join job_work_return r on r.id = x.return_id
         join job_work_challan c on c.id = x.challan_id
        where r.returned_at::date between $1 and $2`,
      [data.from, data.to],
    );
    const metalRows = await sql.query<Row>(
      `select m.ref_id, sum(m.qty_kg) as kg, avg(l.unit_value_paise_per_kg)::int as lot_rate
         from stock_move m join stock_lot l on l.id = m.lot_id
        where m.move_type in ('WO_ISSUE','ISSUE') and m.posted_at::date between $1 and $2
        group by m.ref_id`,
      [data.from, data.to],
    );
    const book = await loadMetalBook(sql, data.to).catch(() => null);
    const pack = {
      yield: yieldRows.map((w) => {
        const theoretical = n(w.good_pcs) * n(w.kg_per_pc);
        const actual = n(w.issued_kg) - n(w.scrap_kg);
        return {
          kind: "YIELD",
          wo: w.doc_no,
          expected: theoretical,
          actual,
          variance: actual - theoretical,
          notes: `${w.sku} issued ${w.issued_kg} − scrap ${w.scrap_kg} vs ${w.good_pcs}×${w.kg_per_pc}`,
        };
      }),
      jwLoss: jwRows.map((x) => ({
        kind: "JW_EXCESS",
        doc: x.doc_no,
        expected: n(x.norm_pct),
        actual: n(x.actual_loss_pct),
        variance: n(x.excess_kg),
        value_paise: n(x.debit_paise),
        notes: `${x.challan_no} DN ${x.debit_note_no}`,
      })),
      metal: metalRows.map((m) => ({
        kind: "METAL_PRICE",
        ref: m.ref_id,
        expected: book?.cuPaisePerKg ?? 0,
        actual: n(m.lot_rate),
        variance: n(m.lot_rate) - (book?.cuPaisePerKg ?? 0),
        notes: `${m.kg} kg issued at lot rate vs book Cu`,
      })),
    };
    if (data.freeze) {
      for (const group of [pack.yield, pack.jwLoss, pack.metal]) {
        for (const r of group) {
          await sql.query(
            `insert into cost_variance (kind, expected, actual, variance, notes, period_from, period_to, frozen, frozen_at, value_paise)
             values ($1,$2,$3,$4,$5,$6,$7,true, now(), $8)`,
            [r.kind, r.expected, r.actual, r.variance, r.notes, data.from, data.to, "value_paise" in r ? r.value_paise : 0],
          );
        }
      }
      await audit(sql, {
        userId: staff.user_id,
        action: "VARIANCE_CLOSE",
        entity: "cost_variance",
        entityId: `${data.from}:${data.to}`,
        after: { from: data.from, to: data.to },
      });
    }
    return { pack, frozen: data.freeze };
  });

export const getRoleBoard = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();
    const role = staff.role;

    const ageing = await sql.query<Row>(
      `select c.id, c.doc_no, p.name as partner,
              floor(extract(epoch from (now() - c.issued_at)) / 86400)::int as age_days,
              c.statutory_due, c.status
         from job_work_challan c join partner p on p.id = c.partner_id
        where c.status <> 'CLOSED' order by c.issued_at`,
    );
    const aged270 = ageing.filter((a) => n(a.age_days) >= 270);

    const billed = (
      await sql.query<{ booked: string; invoiced: string }>(
        `select
           coalesce((select sum(sl.qty_pcs * sl.unit_price_paise) from so_line sl join sales_order so on so.id = sl.so_id where so.order_date >= current_date - 30),0) as booked,
           coalesce((select sum(total_paise) from sales_invoice where invoice_date >= current_date - 30 and status = 'POSTED'),0) as invoiced`,
      )
    )[0];
    const otif = (
      await sql.query<{ n: number; ok: number }>(
        `select count(*)::int as n,
                count(*) filter (where sl.qty_dispatched >= sl.qty_pcs and (sl.promise_date is null or inv.invoice_date <= sl.promise_date))::int as ok
           from so_line sl
           join sales_order so on so.id = sl.so_id
           left join sales_invoice inv on inv.so_id = so.id
          where so.order_date >= current_date - 30`,
      )
    )[0];
    const value = (
      await sql.query<{ v: string; jw: string }>(
        `select
           coalesce(sum(case when l.owner_type = 'OWN' and w.valuation_eligible and w.code <> 'JW-IN-CUSTOMER' then l.qty_kg * l.unit_value_paise_per_kg else 0 end),0)::bigint as v,
           coalesce(sum(case when w.is_outside_factory then l.qty_kg else 0 end),0) as jw
         from stock_lot l join warehouse w on w.id = l.warehouse_id`,
      )
    )[0];
    const ar = (
      await sql.query<{ ar: string }>(
        `select coalesce(sum(total_paise),0)::bigint as ar from sales_invoice where status = 'POSTED'`,
      )
    )[0];
    const yieldVar = (
      await sql.query<Row>(`select variance, notes from cost_variance where kind = 'YIELD' order by id desc limit 1`)
    )[0];
    const jwLoss = (
      await sql.query<{ debit: string }>(
        `select coalesce(sum(debit_paise),0)::bigint as debit from job_work_loss where debit_status = 'DRAFT'`,
      )
    )[0];

    const latest = (await sql.query<Row>(`select id, run_no, horizon_days, run_at from mrp_run order by id desc limit 1`))[0];
    const shortages = latest
      ? await sql.query<Row>(
          `select ml.id, ml.action, ml.shortfall_qty, i.sku from mrp_line ml join item i on i.id = ml.item_id
            where ml.run_id = $1 and ml.action <> 'NONE' order by ml.shortfall_qty desc`,
          [latest.id],
        )
      : [];
    const wosWeek = await sql.query<Row>(
      `select wo.id, wo.doc_no, wo.due_date, i.sku from work_order wo join item i on i.id = wo.item_id
        where wo.status in ('OPEN','ISSUED','DRAFT')
          and coalesce(wo.due_date, current_date) <= current_date + 7
        order by wo.due_date nulls last`,
    );
    const noPromise = await sql.query<Row>(
      `select so.doc_no, so.id, i.sku from sales_order so
         join so_line sl on sl.so_id = so.id join item i on i.id = sl.item_id
        where so.status in ('OPEN','PARTIAL') and sl.promise_date is null`,
    );
    const load = await sql.query<Row>(
      `select wc.code, wc.name, wc.weekly_minutes, wc.queue_days,
              coalesce((
                select sum(wo.qty_pcs * ro.run_sec_per_pc / 60.0 + ro.setup_min)
                  from work_order wo
                  join routing r on r.item_id = wo.item_id
                  join routing_op ro on ro.routing_id = r.id and ro.work_center_id = wc.id
                 where wo.status in ('OPEN','ISSUED')
              ),0) as open_minutes
         from work_center wc`,
    );

    const qcPending = await sql.query<Row>(
      `select q.doc_no, l.lot_no, i.sku, l.qty_kg, l.status
         from quality_inspection q join stock_lot l on l.id = q.lot_id join item i on i.id = l.item_id
        where q.result = 'PENDING'`,
    );
    const hold = await sql.query<Row>(
      `select l.lot_no, i.sku, l.qty_kg, l.qty_pcs, w.code as warehouse
         from stock_lot l join item i on i.id = l.item_id join warehouse w on w.id = l.warehouse_id
        where l.status in ('QUARANTINE','HOLD') and (l.qty_kg > 0 or l.qty_pcs > 0)`,
    );
    const below = await sql.query<Row>(
      `select i.sku, i.min_qty_kg, coalesce(sum(l.qty_kg),0) as kg
         from item i left join stock_lot l on l.item_id = i.id and l.status = 'AVAILABLE' and l.owner_type = 'OWN'
        where i.type = 'RM'
        group by i.id
       having coalesce(sum(l.qty_kg),0) < i.min_qty_kg and i.min_qty_kg > 0`,
    );
    const due = await sql.query<Row>(
      `select c.doc_no, c.expected_return_at, p.name as partner
         from job_work_challan c join partner p on p.id = c.partner_id
        where c.status <> 'CLOSED' and c.expected_return_at <= current_date + 3`,
    );

    const quarantine = await sql.query<Row>(
      `select l.lot_no, i.sku, l.status, w.code as warehouse, l.qty_kg, l.qty_pcs
         from stock_lot l join item i on i.id = l.item_id join warehouse w on w.id = l.warehouse_id
        where l.status = 'QUARANTINE' and (l.qty_kg > 0 or l.qty_pcs > 0)`,
    );
    const ncr = await sql.query<Row>(`select id, doc_no, description, status from ncr where status = 'OPEN' order by id desc`);

    const poLines = await sql.query<Row>(
      `select ml.id, ml.suggested_qty, i.sku from mrp_line ml join item i on i.id = ml.item_id
        join mrp_run r on r.id = ml.run_id
       where ml.action = 'CREATE_PO' and r.id = (select max(id) from mrp_run)`,
    );
    const lastGrn = await sql.query<Row>(
      `select g.doc_no, g.grn_date, i.sku, l.net_kg, p.name as partner
         from grn g join grn_line l on l.grn_id = g.id join item i on i.id = l.item_id
         join partner p on p.id = g.partner_id
        order by g.id desc limit 8`,
    );

    const expiring = await sql.query<Row>(
      `select q.doc_no, q.valid_until, p.name as partner
         from quotation q join partner p on p.id = q.partner_id
        where q.status in ('SENT','DRAFT') and q.valid_until <= current_date + 7
        order by q.valid_until`,
    );
    const blocked = await sql.query<Row>(
      `select so.doc_no, p.name as partner from sales_order so join partner p on p.id = so.partner_id
        where so.credit_blocked = true`,
    );
    const late = await sql.query<Row>(
      `select so.doc_no, sl.promise_date, i.sku, sl.qty_pcs, sl.qty_dispatched
         from so_line sl join sales_order so on so.id = sl.so_id join item i on i.id = sl.item_id
        where so.status in ('OPEN','PARTIAL') and sl.promise_date is not null and sl.promise_date < current_date
          and sl.qty_dispatched < sl.qty_pcs`,
    );

    const unbilled = await sql.query<Row>(
      `select l.lot_no, i.sku, l.qty_pcs, w.code as warehouse
         from stock_lot l join item i on i.id = l.item_id join warehouse w on w.id = l.warehouse_id
        where i.type = 'FG' and l.status = 'AVAILABLE' and w.kind in ('FG','SFG')
          and l.id not in (select lot_id from sales_invoice_line where lot_id is not null)`,
    );
    const unmatched = await sql.query<Row>(
      `select g.doc_no, g.grn_date, p.name as partner
         from grn g join partner p on p.id = g.partner_id
        where g.po_id is null order by g.id desc`,
    );
    const dns = await sql.query<Row>(
      `select doc_no, original_invoice_no, total_paise, status from credit_debit_note where status = 'DRAFT'`,
    );

    const shopWos = await sql.query<Row>(
      `select wo.id, wo.doc_no, wo.qty_pcs, wo.status, i.sku from work_order wo join item i on i.id = wo.item_id
        where wo.status in ('OPEN','ISSUED') order by wo.id desc`,
    );
    const scrap = (
      await sql.query<{ scrap: string; issued: string }>(
        `select coalesce(sum(scrap_kg),0) as scrap, coalesce(sum(issued_kg),0) as issued
           from work_order where created_at::date = current_date - 1`,
      )
    )[0];

    const foundry = await foundryKpis(sql);
    const openHeat = await sql.query<Row>(
      `select h.id, h.doc_no, h.status, h.charged_kg, a.code as alloy
         from heat h join alloy a on a.id = h.alloy_id
        where h.status in ('CHARGED','HOLD_SPECTRO','RELEASED_POUR','POURED') order by h.id desc`,
    );

    return {
      role,
      owner: {
        bookedPaise: n(billed?.booked),
        invoicedPaise: n(billed?.invoiced),
        otif: otif && n(otif.n) ? Math.round((n(otif.ok) / n(otif.n)) * 100) : null,
        otifN: n(otif?.n),
        jwKg: n(value?.jw),
        inventoryPaise: n(value?.v),
        openArPaise: n(ar?.ar),
        yield: yieldVar ? { variance: n(yieldVar.variance), notes: String(yieldVar.notes ?? "") } : null,
        jwLossPaise: n(jwLoss?.debit),
        aged270,
        meltKg: foundry.meltKg,
        meltYield7dPct: foundry.yield7dPct,
        spectroHold: foundry.spectroHold,
        heatsOpen: foundry.heatsOpen,
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
          weekly_minutes: n(w.weekly_minutes),
          queue_days: n(w.queue_days),
          open_minutes: n(w.open_minutes),
          load_pct: wcLoadPct(n(w.open_minutes), n(w.weekly_minutes)),
        })),
        emptyMrp: latest ? null : "No planning run yet",
        meltKg: foundry.meltKg,
        meltYield7dPct: foundry.yield7dPct,
        spectroHold: foundry.spectroHold,
        heatsOpen: foundry.heatsOpen,
      },
      stores: {
        grnQc: qcPending,
        hold,
        belowMin: below,
        jwDue: due,
        emptyQc: qcPending.length ? null : "No GRN pending QC",
        emptyHold: hold.length ? null : "No lots on HOLD",
      },
      qc: {
        quarantine,
        ncr,
        emptyQ: quarantine.length ? null : "No lots in QUARANTINE",
        emptyNcr: ncr.length ? null : "No open NCR",
      },
      purchase: {
        createPo: poLines,
        lastGrn,
        emptyPo: latest ? (poLines.length ? null : "No CREATE_PO lines") : "No planning run yet",
      },
      sales: {
        expiring,
        blocked,
        late,
        emptyExp: expiring.length ? null : "No quotes expiring in 7 days",
        emptyBlocked: blocked.length ? null : "No credit-blocked SO",
        emptyLate: late.length ? null : "No late SO",
      },
      accounts: {
        unbilled,
        unmatchedGrn: unmatched,
        aged270,
        draftDn: dns,
        emptyUnbilled: unbilled.length ? null : "No unbilled FG receipts",
        emptyDn: dns.length ? null : "No draft debit notes",
      },
      shop: {
        openWos: shopWos,
        yesterdayScrapKg: n(scrap?.scrap),
        yesterdayIssuedKg: n(scrap?.issued),
        emptyWo: shopWos.length ? null : "No open work orders",
        openHeat,
      },
    };
  });

export { loadMetalBook };
void quoteIsFrozen;

export const listJourneyRuns = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    let reportJson: string | null = null;
    try {
      const { readFile } = await import("node:fs/promises");
      const { join } = await import("node:path");
      reportJson = await readFile(join(process.cwd(), "artifacts/journeys-last.json"), "utf8");
    } catch {
      reportJson = null;
    }
    const dbRuns = await sql.query<Row>(`select * from journey_run order by id desc limit 8`);
    return { reportJson, dbRuns };
  });
