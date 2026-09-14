/** Foundry heat / charge / spectro / pour. Stock only via postStockMove. */
import type { Sql } from "@/lib/db";
import { audit, nextDoc, setting } from "./core.server";
import { n, roundKg } from "./format";
import type { Row } from "./row";
import { createLot, getLot, itemBySku, linkGenealogy, postMove, warehouseByCode, withStockTx } from "./stock.server";
import { meltYieldWorking, spectroVsAlloy } from "@/modules/foundry/math";

export const HEAT_STATUSES = [
  "DRAFT",
  "CHARGED",
  "HOLD_SPECTRO",
  "RELEASED_POUR",
  "POURED",
  "CLOSED",
] as const;
export type HeatStatus = (typeof HEAT_STATUSES)[number];

export const ACTIVE_HEAT = new Set(["CHARGED", "HOLD_SPECTRO", "RELEASED_POUR", "POURED"]);

export async function foundryEnabled(sql: Sql): Promise<boolean> {
  return (await setting(sql, "foundry_enabled", "true")) !== "false";
}

export async function assertFoundryOn(sql: Sql): Promise<void> {
  if (!(await foundryEnabled(sql))) throw new Error("Foundry is switched off (foundry_enabled=false).");
}

type HeatRow = {
  id: number;
  doc_no: string;
  furnace: string;
  alloy_id: number;
  recipe_id: number | null;
  recipe_snapshot_json: string | null;
  status: string;
  wip_lot_id: number | null;
  charged_kg: string;
  good_kg: string;
  runner_kg: string;
  dross_kg: string;
  reject_kg: string;
  loss_kg: string;
  owner_override: boolean;
};

async function heatById(sql: Sql, id: number): Promise<HeatRow> {
  const row = (await sql.query<HeatRow>(`select * from heat where id = $1`, [id]))[0];
  if (!row) throw new Error("Heat not found");
  return row;
}

async function alloyOf(sql: Sql, alloyId: number) {
  const a = (
    await sql.query<{
      id: number;
      code: string;
      cu_pct: string;
      zn_pct: string;
      pb_pct: string;
      cu_min_pct: string | null;
      cu_max_pct: string | null;
      zn_min_pct: string | null;
      zn_max_pct: string | null;
      pb_min_pct: string | null;
      pb_max_pct: string | null;
    }>(`select * from alloy where id = $1`, [alloyId])
  )[0];
  if (!a) throw new Error("Alloy not found");
  return a;
}

export async function createHeat(
  sql: Sql,
  opts: { alloyId: number; furnace?: string; recipeId?: number | null; userId: string },
): Promise<{ id: number; docNo: string; status: HeatStatus }> {
  await assertFoundryOn(sql);
  const furnace = opts.furnace?.trim() || "MELT-1";
  const open = (
    await sql.query<{ n: string }>(
      `select count(*)::int as n from heat where status in ('CHARGED','HOLD_SPECTRO','RELEASED_POUR','POURED')`,
    )
  )[0];
  if (n(open?.n) > 0) {
    throw new Error("Shop runs one heat at a time — close or finish the open heat first.");
  }
  const docNo = await nextDoc(sql, "HT");
  const recipeId =
    opts.recipeId ??
    (
      await sql.query<{ id: number }>(
        `select id from melt_recipe where alloy_id = $1 and status = 'ACTIVE' order by id limit 1`,
        [opts.alloyId],
      )
    )[0]?.id ??
    null;
  const row = (
    await sql.query<{ id: number }>(
      `insert into heat (doc_no, furnace, alloy_id, recipe_id, status, created_by)
       values ($1,$2,$3,$4,'DRAFT',$5) returning id`,
      [docNo, furnace, opts.alloyId, recipeId, opts.userId],
    )
  )[0]!;
  await audit(sql, {
    userId: opts.userId,
    action: "HEAT_CREATE",
    entity: "heat",
    entityId: row.id,
    after: { docNo, furnace, alloyId: opts.alloyId },
  });
  return { id: row.id, docNo, status: "DRAFT" };
}

async function assertChargeLot(sql: Sql, lotId: number, heatAlloyId: number, heatAlloyCode: string) {
  const lot = await getLot(sql, lotId);
  if (lot.owner_type === "CUSTOMER") {
    throw new Error("Refuse charge of JW_IN_CUSTOMER lots — customer metal is not our heat.");
  }
  const wh = (
    await sql.query<{ code: string; is_outside_factory: boolean; is_customer_owned: boolean }>(
      `select code, is_outside_factory, is_customer_owned from warehouse where id = $1`,
      [lot.warehouse_id],
    )
  )[0];
  if (wh?.is_outside_factory) {
    throw new Error("Cannot charge metal that is outside the factory (JW-OUT). Use a dedicated foundry lot.");
  }
  if (wh?.is_customer_owned) {
    throw new Error("Refuse charge of JW_IN_CUSTOMER lots — customer metal is not our heat.");
  }
  const lotAlloy = lot.alloy_id
    ? (await sql.query<{ code: string }>(`select code from alloy where id = $1`, [lot.alloy_id]))[0]?.code
    : null;
  if (lot.alloy_id != null && Number(lot.alloy_id) !== Number(heatAlloyId)) {
    throw new Error(`Refuse ${lotAlloy ?? "foreign"} lot into a ${heatAlloyCode} heat.`);
  }
  return lot;
}

export async function addChargeLine(
  sql: Sql,
  opts: { heatId: number; lotId: number; qtyKg: number; userId: string },
): Promise<{ lineId: number }> {
  await assertFoundryOn(sql);
  const heat = await heatById(sql, opts.heatId);
  if (heat.status !== "DRAFT") throw new Error("Charge lines only on a DRAFT heat.");
  const qty = roundKg(opts.qtyKg);
  if (qty <= 0) throw new Error("Charge kg must be positive.");
  const alloy = await alloyOf(sql, heat.alloy_id);
  const lot = await assertChargeLot(sql, opts.lotId, heat.alloy_id, alloy.code);
  if (n(lot.qty_kg) + 0.0005 < qty) {
    throw new Error(`Cannot charge ${qty.toFixed(3)} kg — lot has ${n(lot.qty_kg).toFixed(3)} kg`);
  }
  const line = (
    await sql.query<{ id: number }>(
      `insert into melt_charge_line (heat_id, lot_id, item_id, qty_kg) values ($1,$2,$3,$4) returning id`,
      [heat.id, lot.id, lot.item_id, qty],
    )
  )[0]!;
  await audit(sql, {
    userId: opts.userId,
    action: "HEAT_CHARGE_LINE",
    entity: "heat",
    entityId: heat.id,
    after: { lotId: lot.id, qtyKg: qty },
  });
  return { lineId: line.id };
}

export async function confirmCharge(
  sql: Sql,
  opts: { heatId: number; userId: string },
): Promise<{ chargedKg: number; wipLotNo: string; status: HeatStatus }> {
  await assertFoundryOn(sql);
  return withStockTx(sql, async () => {
    const heat = await heatById(sql, opts.heatId);
    if (heat.status !== "DRAFT") throw new Error("Confirm charge only from DRAFT.");
    const alloy = await alloyOf(sql, heat.alloy_id);
    const lines = await sql.query<{ id: number; lot_id: number; item_id: number; qty_kg: string }>(
      `select id, lot_id, item_id, qty_kg from melt_charge_line where heat_id = $1 order by id`,
      [heat.id],
    );
    if (!lines.length) throw new Error("Charge by lot — add at least one charge lot before confirm.");
    const wipWh = await warehouseByCode(sql, "WIP-MELT");
    const cast = await itemBySku(sql, "CAST-C360");
    let recipeSnap: unknown = null;
    if (heat.recipe_id) {
      const rec = (await sql.query<{ name: string }>(`select name from melt_recipe where id = $1`, [heat.recipe_id]))[0];
      const rlines = await sql.query<{ sku: string; pct: string }>(
        `select i.sku, l.pct from melt_recipe_line l join item i on i.id = l.item_id where l.recipe_id = $1`,
        [heat.recipe_id],
      );
      recipeSnap = { name: rec?.name, lines: rlines };
    }
    let wipLotId = heat.wip_lot_id;
    let firstRate = 0;
    let charged = 0;
    for (const ln of lines) {
      const src = await assertChargeLot(sql, ln.lot_id, heat.alloy_id, alloy.code);
      const qty = roundKg(n(ln.qty_kg));
      if (!wipLotId) {
        firstRate = n(src.unit_value_paise_per_kg);
        const wip = await createLot(sql, {
          itemId: cast.id,
          warehouseId: wipWh.id,
          alloyId: heat.alloy_id,
          heatNo: heat.doc_no,
          status: "AVAILABLE",
          ownerType: "OWN",
          unitValuePaisePerKg: firstRate,
          sourceType: "HEAT",
          sourceId: heat.id,
        });
        wipLotId = wip.id;
      }
      const srcMove = await postMove(sql, {
        moveType: "MELT_CHARGE",
        itemId: src.item_id,
        lotId: src.id,
        warehouseId: src.warehouse_id,
        qtyKg: -qty,
        qtyPcs: 0,
        refType: "HEAT",
        refId: heat.id,
        userId: opts.userId,
        alloyId: src.alloy_id,
        itemAlloyId: heat.alloy_id,
        unitValuePaisePerKg: src.unit_value_paise_per_kg,
        notes: `Charge ${heat.doc_no}`,
      });
      await postMove(sql, {
        moveType: "MELT_CHARGE",
        itemId: cast.id,
        lotId: wipLotId,
        warehouseId: wipWh.id,
        qtyKg: qty,
        qtyPcs: 0,
        refType: "HEAT",
        refId: heat.id,
        userId: opts.userId,
        alloyId: heat.alloy_id,
        itemAlloyId: heat.alloy_id,
        unitValuePaisePerKg: src.unit_value_paise_per_kg,
        consumedLotId: src.id,
        parentMoveId: srcMove.moveId,
        notes: `WIP ${heat.doc_no}`,
      });
      await sql.query(`update melt_charge_line set posted_move_id = $1 where id = $2`, [srcMove.moveId, ln.id]);
      charged = roundKg(charged + qty);
    }
    await sql.query(
      `update heat set status = 'CHARGED', wip_lot_id = $1, charged_kg = $2, charged_at = now(),
         recipe_snapshot_json = $3 where id = $4`,
      [wipLotId, charged, recipeSnap ? JSON.stringify(recipeSnap) : null, heat.id],
    );
    const wip = await getLot(sql, wipLotId!);
    await audit(sql, {
      userId: opts.userId,
      action: "HEAT_CHARGE_CONFIRM",
      entity: "heat",
      entityId: heat.id,
      after: { chargedKg: charged, wipLot: wip.lot_no, recipe: recipeSnap },
    });
    return { chargedKg: charged, wipLotNo: wip.lot_no, status: "CHARGED" as HeatStatus };
  });
}

export async function postSpectro(
  sql: Sql,
  opts: { heatId: number; cuPct: number; znPct: number; pbPct: number; userId: string },
): Promise<{ passed: boolean; status: HeatStatus; reasons: string[] }> {
  await assertFoundryOn(sql);
  const heat = await heatById(sql, opts.heatId);
  if (heat.status !== "CHARGED" && heat.status !== "HOLD_SPECTRO") {
    throw new Error("Spectro only after charge, before pour.");
  }
  const alloy = await alloyOf(sql, heat.alloy_id);
  const vs = spectroVsAlloy(
    { cuPct: opts.cuPct, znPct: opts.znPct, pbPct: opts.pbPct },
    alloy,
  );
  await sql.query(
    `insert into spectro_result (heat_id, cu_pct, zn_pct, pb_pct, passed, created_by)
     values ($1,$2,$3,$4,$5,$6)`,
    [heat.id, opts.cuPct, opts.znPct, opts.pbPct, vs.passed, opts.userId],
  );
  const status: HeatStatus = vs.passed ? "RELEASED_POUR" : "HOLD_SPECTRO";
  await sql.query(`update heat set status = $1 where id = $2`, [status, heat.id]);
  await audit(sql, {
    userId: opts.userId,
    action: "HEAT_SPECTRO",
    entity: "heat",
    entityId: heat.id,
    after: { passed: vs.passed, status, reasons: vs.reasons },
  });
  return { passed: vs.passed, status, reasons: vs.reasons };
}

export async function pourAndKnockout(
  sql: Sql,
  opts: {
    heatId: number;
    goodKg: number;
    runnerKg: number;
    drossKg: number;
    rejectKg?: number;
    drossToVariance?: boolean;
    userId: string;
  },
): Promise<{
  pourNo: string;
  knockoutNo: string;
  castingLotNo: string;
  runnerLotNo: string | null;
  drossLotNo: string | null;
  status: HeatStatus;
}> {
  await assertFoundryOn(sql);
  return withStockTx(sql, async () => {
    const heat = await heatById(sql, opts.heatId);
    if (heat.status === "HOLD_SPECTRO" || heat.status === "CHARGED") {
      throw new Error("Spectro FAIL blocks pour. Post a PASS reading first (not a BIS/NABL certificate).");
    }
    if (heat.status !== "RELEASED_POUR") throw new Error("Pour only from RELEASED_POUR.");
    if (!heat.wip_lot_id) throw new Error("Heat has no WIP-MELT lot.");
    const good = roundKg(opts.goodKg);
    const runner = roundKg(opts.runnerKg);
    const dross = roundKg(opts.drossKg);
    const reject = roundKg(opts.rejectKg ?? 0);
    if (good <= 0) throw new Error("Pour needs good kg.");
    const wip = await getLot(sql, heat.wip_lot_id);
    const need = roundKg(good + runner + dross + reject);
    if (n(wip.qty_kg) + 0.0005 < need) {
      throw new Error(`Pour ${need.toFixed(3)} kg > WIP-MELT ${n(wip.qty_kg).toFixed(3)} kg`);
    }
    const alloy = await alloyOf(sql, heat.alloy_id);
    const sfg = await warehouseByCode(sql, "SFG");
    const scrapWh = await warehouseByCode(sql, "RM-SCRAP");
    const rejectWh = await warehouseByCode(sql, "FG-REJECT");
    const runnerSku = `SC-${alloy.code.replace(/00$/, "").replace("C360", "C360")}-RUNNER`;
    const runnerItem = await itemBySku(sql, alloy.code === "C36000" ? "SC-C360-RUNNER" : runnerSku).catch(async () =>
      itemBySku(sql, "SC-C360-RUNNER"),
    );
    const drossItem = await itemBySku(sql, "SC-C360-DROSS");
    const castItem = await itemBySku(sql, "CAST-C360");
    const rate = n(wip.unit_value_paise_per_kg);

    const destPour = await postMove(sql, {
      moveType: "MELT_POUR",
      itemId: wip.item_id,
      lotId: wip.id,
      warehouseId: wip.warehouse_id,
      qtyKg: -good,
      qtyPcs: 0,
      refType: "HEAT",
      refId: heat.id,
      userId: opts.userId,
      alloyId: heat.alloy_id,
      unitValuePaisePerKg: rate,
      notes: `Pour ${heat.doc_no}`,
    });
    const casting = await createLot(sql, {
      itemId: castItem.id,
      warehouseId: sfg.id,
      alloyId: heat.alloy_id,
      heatNo: heat.doc_no,
      status: "AVAILABLE",
      ownerType: "OWN",
      unitValuePaisePerKg: rate,
      sourceType: "HEAT",
      sourceId: heat.id,
    });
    await postMove(sql, {
      moveType: "MELT_POUR",
      itemId: castItem.id,
      lotId: casting.id,
      warehouseId: sfg.id,
      qtyKg: good,
      qtyPcs: 0,
      refType: "HEAT",
      refId: heat.id,
      userId: opts.userId,
      alloyId: heat.alloy_id,
      unitValuePaisePerKg: rate,
      consumedLotId: wip.id,
      parentMoveId: destPour.moveId,
    });
    const charges = await sql.query<{ lot_id: number; qty_kg: string }>(
      `select lot_id, qty_kg from melt_charge_line where heat_id = $1`,
      [heat.id],
    );
    for (const c of charges) {
      await linkGenealogy(sql, casting.id, c.lot_id, roundKg((n(c.qty_kg) / n(heat.charged_kg)) * good), 0, {
        childMoveId: destPour.moveId,
      });
    }

    let runnerLotNo: string | null = null;
    let runnerLotId: number | null = null;
    if (runner > 0) {
      await postMove(sql, {
        moveType: "MELT_RUNNER",
        itemId: wip.item_id,
        lotId: wip.id,
        warehouseId: wip.warehouse_id,
        qtyKg: -runner,
        qtyPcs: 0,
        refType: "HEAT",
        refId: heat.id,
        userId: opts.userId,
        alloyId: heat.alloy_id,
        unitValuePaisePerKg: rate,
        reasonCode: "SCRAP-RUNNER",
      });
      const rLot = await createLot(sql, {
        itemId: runnerItem.id,
        warehouseId: scrapWh.id,
        alloyId: heat.alloy_id,
        heatNo: heat.doc_no,
        status: "AVAILABLE",
        ownerType: "OWN",
        unitValuePaisePerKg: rate,
        sourceType: "HEAT",
        sourceId: heat.id,
      });
      await postMove(sql, {
        moveType: "MELT_RUNNER",
        itemId: runnerItem.id,
        lotId: rLot.id,
        warehouseId: scrapWh.id,
        qtyKg: runner,
        qtyPcs: 0,
        refType: "HEAT",
        refId: heat.id,
        userId: opts.userId,
        alloyId: heat.alloy_id,
        itemAlloyId: runnerItem.alloy_id,
        unitValuePaisePerKg: rate,
        consumedLotId: wip.id,
      });
      runnerLotNo = rLot.lot_no;
      runnerLotId = rLot.id;
    }

    let drossLotNo: string | null = null;
    let drossLotId: number | null = null;
    const drossVar = Boolean(opts.drossToVariance);
    if (dross > 0) {
      if (drossVar) {
        await postMove(sql, {
          moveType: "MELT_YIELD_LOSS",
          itemId: wip.item_id,
          lotId: wip.id,
          warehouseId: wip.warehouse_id,
          qtyKg: -dross,
          qtyPcs: 0,
          refType: "HEAT",
          refId: heat.id,
          userId: opts.userId,
          alloyId: heat.alloy_id,
          unitValuePaisePerKg: rate,
          reasonCode: "SCRAP-DROSS",
          notes: "dross to variance",
        });
      } else {
        await postMove(sql, {
          moveType: "MELT_DROSS",
          itemId: wip.item_id,
          lotId: wip.id,
          warehouseId: wip.warehouse_id,
          qtyKg: -dross,
          qtyPcs: 0,
          refType: "HEAT",
          refId: heat.id,
          userId: opts.userId,
          alloyId: heat.alloy_id,
          unitValuePaisePerKg: rate,
          reasonCode: "SCRAP-DROSS",
          notes: "dross to stock",
        });
        const dLot = await createLot(sql, {
          itemId: drossItem.id,
          warehouseId: scrapWh.id,
          alloyId: heat.alloy_id,
          heatNo: heat.doc_no,
          status: "AVAILABLE",
          ownerType: "OWN",
          unitValuePaisePerKg: rate,
          sourceType: "HEAT",
          sourceId: heat.id,
        });
        await postMove(sql, {
          moveType: "MELT_DROSS",
          itemId: drossItem.id,
          lotId: dLot.id,
          warehouseId: scrapWh.id,
          qtyKg: dross,
          qtyPcs: 0,
          refType: "HEAT",
          refId: heat.id,
          userId: opts.userId,
          alloyId: heat.alloy_id,
          unitValuePaisePerKg: rate,
          consumedLotId: wip.id,
        });
        drossLotNo = dLot.lot_no;
        drossLotId = dLot.id;
      }
    }

    if (reject > 0) {
      await postMove(sql, {
        moveType: "MELT_REJECT",
        itemId: wip.item_id,
        lotId: wip.id,
        warehouseId: wip.warehouse_id,
        qtyKg: -reject,
        qtyPcs: 0,
        refType: "HEAT",
        refId: heat.id,
        userId: opts.userId,
        alloyId: heat.alloy_id,
        unitValuePaisePerKg: rate,
      });
      const rejLot = await createLot(sql, {
        itemId: castItem.id,
        warehouseId: rejectWh.id,
        alloyId: heat.alloy_id,
        heatNo: heat.doc_no,
        status: "REJECT",
        ownerType: "OWN",
        unitValuePaisePerKg: rate,
        sourceType: "HEAT",
        sourceId: heat.id,
      });
      await postMove(sql, {
        moveType: "MELT_REJECT",
        itemId: castItem.id,
        lotId: rejLot.id,
        warehouseId: rejectWh.id,
        qtyKg: reject,
        qtyPcs: 0,
        refType: "HEAT",
        refId: heat.id,
        userId: opts.userId,
        alloyId: heat.alloy_id,
        unitValuePaisePerKg: rate,
        consumedLotId: wip.id,
      });
    }

    const pourNo = await nextDoc(sql, "POUR");
    const koNo = await nextDoc(sql, "KO");
    const pour = (
      await sql.query<{ id: number }>(
        `insert into melt_pour (heat_id, doc_no, good_kg, casting_lot_id, created_by, snapshot_json)
         values ($1,$2,$3,$4,$5,$6) returning id`,
        [
          heat.id,
          pourNo,
          good,
          casting.id,
          opts.userId,
          JSON.stringify({ heat: heat.doc_no, goodKg: good, alloy: alloy.code }),
        ],
      )
    )[0]!;
    await sql.query(
      `insert into melt_knockout (heat_id, pour_id, doc_no, runner_kg, dross_kg, reject_kg, runner_lot_id, dross_lot_id, dross_to_variance, created_by, snapshot_json)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        heat.id,
        pour.id,
        koNo,
        runner,
        dross,
        reject,
        runnerLotId,
        drossLotId,
        drossVar,
        opts.userId,
        JSON.stringify({ heat: heat.doc_no, runnerKg: runner, drossKg: dross, rejectKg: reject }),
      ],
    );
    await sql.query(
      `update heat set status = 'POURED', good_kg = $1, runner_kg = $2, dross_kg = $3, reject_kg = $4, poured_at = now()
        where id = $5`,
      [good, runner, dross, reject, heat.id],
    );
    await audit(sql, {
      userId: opts.userId,
      action: "HEAT_POUR",
      entity: "heat",
      entityId: heat.id,
      after: { pourNo, koNo, good, runner, dross, reject, casting: casting.lot_no },
    });
    return {
      pourNo,
      knockoutNo: koNo,
      castingLotNo: casting.lot_no,
      runnerLotNo,
      drossLotNo,
      status: "POURED" as HeatStatus,
    };
  });
}

export async function closeHeat(
  sql: Sql,
  opts: { heatId: number; userId: string; ownerOverride?: boolean; role?: string },
): Promise<{ lossKg: number; lossPct: number; status: HeatStatus }> {
  await assertFoundryOn(sql);
  return withStockTx(sql, async () => {
    const heat = await heatById(sql, opts.heatId);
    if (heat.status !== "POURED") throw new Error("Close only a POURED heat.");
    const working = meltYieldWorking({
      chargedKg: n(heat.charged_kg),
      goodKg: n(heat.good_kg),
      runnerKg: n(heat.runner_kg),
      drossKg: n(heat.dross_kg),
      rejectKg: n(heat.reject_kg),
    });
    if (working.needsOwnerOverride && !opts.ownerOverride) {
      throw new Error(
        `Melt loss ${working.lossKg.toFixed(3)} kg (${working.lossPct.toFixed(2)}%) exceeds 3%. Owner override required.`,
      );
    }
    if (working.needsOwnerOverride && opts.role && opts.role !== "OWNER" && opts.role !== "ADMIN") {
      throw new Error("Only Owner can override melt loss above 3%.");
    }
    if (heat.wip_lot_id && working.lossKg > 0.0005) {
      const wip = await getLot(sql, heat.wip_lot_id);
      const take = roundKg(Math.min(n(wip.qty_kg), working.lossKg));
      if (take > 0) {
        await postMove(sql, {
          moveType: "MELT_YIELD_LOSS",
          itemId: wip.item_id,
          lotId: wip.id,
          warehouseId: wip.warehouse_id,
          qtyKg: -take,
          qtyPcs: 0,
          refType: "HEAT",
          refId: heat.id,
          userId: opts.userId,
          alloyId: heat.alloy_id,
          unitValuePaisePerKg: wip.unit_value_paise_per_kg,
          notes: "Melt yield loss to variance",
        });
      }
    }
    await sql.query(
      `update heat set status = 'CLOSED', loss_kg = $1, owner_override = $2, closed_at = now() where id = $3`,
      [working.lossKg, Boolean(opts.ownerOverride), heat.id],
    );
    await sql.query(
      `insert into cost_variance (kind, expected, actual, variance, notes)
       values ('MELT_YIELD',$1,$2,$3,$4)`,
      [
        n(heat.charged_kg),
        n(heat.good_kg) + n(heat.runner_kg) + n(heat.dross_kg) + n(heat.reject_kg),
        working.lossKg,
        `${heat.doc_no} loss ${working.lossKg.toFixed(3)} kg`,
      ],
    );
    await audit(sql, {
      userId: opts.userId,
      action: "HEAT_CLOSE",
      entity: "heat",
      entityId: heat.id,
      after: { lossKg: working.lossKg, lossPct: working.lossPct },
    });
    return { lossKg: working.lossKg, lossPct: working.lossPct, status: "CLOSED" };
  });
}

export async function listHeats(sql: Sql) {
  return sql.query<{
    id: number;
    doc_no: string;
    furnace: string;
    status: string;
    alloy: string;
    charged_kg: string;
    good_kg: string;
    runner_kg: string;
    dross_kg: string;
    loss_kg: string;
    wip_lot_id: number | null;
    recipe_snapshot_json: string | null;
    created_at: string;
  }>(
    `select h.*, a.code as alloy
       from heat h join alloy a on a.id = h.alloy_id
      order by h.id desc`,
  );
}

export async function getHeatDetail(sql: Sql, id: number) {
  const heat = (
    await sql.query<Row>(
      `select h.*, a.code as alloy, a.cu_min_pct, a.cu_max_pct, a.zn_min_pct, a.zn_max_pct, a.pb_min_pct, a.pb_max_pct
         from heat h join alloy a on a.id = h.alloy_id where h.id = $1`,
      [id],
    )
  )[0];
  if (!heat) throw new Error("Heat not found");
  const charges = await sql.query<Row>(
    `select c.*, l.lot_no, l.heat_no as lot_heat, i.sku, l.qty_kg as lot_qty_kg, a.code as lot_alloy
       from melt_charge_line c
       join stock_lot l on l.id = c.lot_id
       join item i on i.id = c.item_id
       left join alloy a on a.id = l.alloy_id
      where c.heat_id = $1 order by c.id`,
    [id],
  );
  const spectros = await sql.query<Row>(
    `select * from spectro_result where heat_id = $1 order by id`,
    [id],
  );
  const pours = await sql.query<Row>(
    `select p.*, l.lot_no as casting_lot_no from melt_pour p left join stock_lot l on l.id = p.casting_lot_id
      where p.heat_id = $1 order by p.id`,
    [id],
  );
  const knockouts = await sql.query<Row>(
    `select k.*, rl.lot_no as runner_lot_no, dl.lot_no as dross_lot_no
       from melt_knockout k
       left join stock_lot rl on rl.id = k.runner_lot_id
       left join stock_lot dl on dl.id = k.dross_lot_id
      where k.heat_id = $1 order by k.id`,
    [id],
  );
  return { heat, charges, spectros, pours, knockouts };
}

export async function foundryKpis(sql: Sql): Promise<{
  meltKg: number;
  heatsOpen: number;
  spectroHold: number;
  yield7dPct: number | null;
}> {
  const melt = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg
         from stock_lot l join warehouse w on w.id = l.warehouse_id
        where w.code = 'WIP-MELT'`,
    )
  )[0];
  const open = (
    await sql.query<{ n: string }>(
      `select count(*)::int as n from heat where status in ('CHARGED','HOLD_SPECTRO','RELEASED_POUR','POURED')`,
    )
  )[0];
  const hold = (
    await sql.query<{ n: string }>(`select count(*)::int as n from heat where status = 'HOLD_SPECTRO'`)
  )[0];
  const y = (
    await sql.query<{ pct: string | null }>(
      `select case when coalesce(sum(charged_kg),0) > 0
              then round(((sum(charged_kg) - sum(loss_kg)) / sum(charged_kg)) * 100, 2)
              else null end as pct
         from heat
        where status = 'CLOSED' and closed_at >= now() - interval '7 days'`,
    )
  )[0];
  return {
    meltKg: n(melt?.kg),
    heatsOpen: n(open?.n),
    spectroHold: n(hold?.n),
    yield7dPct: y?.pct == null ? null : n(y.pct),
  };
}
