/**
 * The ONLY writer of stock_lot.qty_* and stock_move rows.
 * Callers create document headers, then come here for every kilogram.
 */
import type { Sql } from "@/lib/db";
import { audit, nextDoc } from "@/lib/erp/core.server";
import { n, roundKg, todayISO } from "@/lib/erp/format";
import { assertPeriodAllows, journalFromMove } from "@/modules/finance/journal";
import {
  assertAlloyMatch,
  assertConversion,
  assertLotRequired,
  assertNegativeStockKind,
  assertSufficient,
  CONV_TOL,
  encodeMoveNotes,
  moveValuePaise,
  parseReverseOf,
  toMoveType,
  type MoveType,
} from "./rules.ts";

export type LotRow = {
  id: number;
  lot_no: string;
  item_id: number;
  warehouse_id: number;
  alloy_id: number | null;
  heat_no: string | null;
  qty_kg: string;
  qty_pcs: string;
  status: string;
  owner_type: string;
  owner_partner_id: number | null;
  unit_value_paise_per_kg: number;
  parent_lot_id: number | null;
};

export type StockMoveInput = {
  type: MoveType | string;
  itemId: number;
  lotId: number;
  fromWh?: number | null;
  toWh?: number | null;
  qtyKg: number;
  qtyPcs: number;
  ratePaise?: number;
  refType?: string;
  refId?: number;
  lineId?: number;
  reasonCode?: string | null;
  userId?: string;
  notes?: string | null;
  reverseOf?: number | null;
  kgPerPc?: number | null;
  conversionKind?: keyof typeof CONV_TOL;
  alloyId?: number | null;
  itemAlloyId?: number | null;
  allowZeroQty?: boolean;
  parentMoveId?: number | null;
  consumedLotId?: number | null;
  isoDate?: string | null;
};

export async function withStockTx<T>(sql: Sql, fn: () => Promise<T>): Promise<T> {
  await sql.query("begin");
  try {
    const r = await fn();
    await sql.query("commit");
    return r;
  } catch (err) {
    try {
      await sql.query("rollback");
    } catch {
      /* ignore */
    }
    throw err;
  }
}

export async function getLot(sql: Sql, id: number): Promise<LotRow> {
  const rows = await sql.query<LotRow>(`select * from stock_lot where id = $1`, [id]);
  if (!rows[0]) throw new Error(`Lot ${id} not found`);
  return rows[0];
}

export async function createLot(
  sql: Sql,
  opts: {
    itemId: number;
    warehouseId: number;
    alloyId: number | null;
    heatNo?: string | null;
    qtyKg?: number;
    qtyPcs?: number;
    status: string;
    ownerType?: string;
    ownerPartnerId?: number | null;
    unitValuePaisePerKg?: number;
    parentLotId?: number | null;
    sourceType?: string;
    sourceId?: number | null;
    lotNo?: string | null;
  },
): Promise<LotRow> {
  if (n(opts.qtyKg) !== 0 || n(opts.qtyPcs) !== 0) {
    throw new Error("createLot starts at 0 — postStockMove is the only qty writer");
  }
  const lotNo = opts.lotNo || (await nextDoc(sql, "LOT"));
  const rows = await sql.query<LotRow>(
    `insert into stock_lot (
       lot_no, item_id, warehouse_id, alloy_id, heat_no, qty_kg, qty_pcs, status,
       owner_type, owner_partner_id, unit_value_paise_per_kg, parent_lot_id, source_type, source_id
     ) values ($1,$2,$3,$4,$5,0,0,$6,$7,$8,$9,$10,$11,$12)
     returning *`,
    [
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
      opts.sourceId ?? null,
    ],
  );
  return rows[0]!;
}

export async function warehouseByCode(sql: Sql, code: string) {
  const rows = await sql.query<{
    id: number;
    code: string;
    name: string;
    kind: string;
    valuation_eligible: boolean;
    is_outside_factory: boolean;
    is_customer_owned: boolean;
  }>(`select id, code, name, kind, valuation_eligible, is_outside_factory, is_customer_owned from warehouse where code = $1`, [
    code,
  ]);
  if (!rows[0]) throw new Error(`Warehouse ${code} not found`);
  return rows[0];
}

export async function itemBySku(sql: Sql, sku: string) {
  const rows = await sql.query<{
    id: number;
    sku: string;
    name: string;
    type: string;
    alloy_id: number | null;
    kg_per_pc: string | null;
    recovery_factor: string;
    hsn: string | null;
    inspection_required: boolean;
    family: string | null;
  }>(`select * from item where sku = $1`, [sku]);
  if (!rows[0]) throw new Error(`Item ${sku} not found`);
  return rows[0];
}

export async function linkGenealogy(
  sql: Sql,
  childLotId: number,
  parentLotId: number,
  qtyKg: number,
  qtyPcs: number,
  opts?: { parentMoveId?: number | null; childMoveId?: number | null },
) {
  await sql.query(
    `insert into genealogy_link (child_lot_id, parent_lot_id, qty_kg, qty_pcs, parent_move_id, child_move_id)
     values ($1,$2,$3,$4,$5,$6)`,
    [childLotId, parentLotId, roundKg(qtyKg), qtyPcs, opts?.parentMoveId ?? null, opts?.childMoveId ?? null],
  );
}

export async function onHandFromMoves(
  sql: Sql,
  opts: { itemId?: number; lotId?: number; warehouseId?: number; warehouseCode?: string; ownerType?: string; status?: string },
): Promise<{ kg: number; pcs: number }> {
  const rows = await sql.query<{ kg: string; pcs: string }>(
    `select coalesce(sum(qty_kg),0) as kg, coalesce(sum(qty_pcs),0) as pcs from (
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
      ) x`,
    [
      opts.itemId ?? null,
      opts.lotId ?? null,
      opts.warehouseId ?? null,
      opts.warehouseCode ?? null,
      opts.ownerType ?? null,
      opts.status ?? null,
    ],
  );
  return { kg: n(rows[0]?.kg), pcs: n(rows[0]?.pcs) };
}

export async function onHandKg(
  sql: Sql,
  itemId: number,
  opts?: { status?: string; warehouseCode?: string; ownerType?: string },
): Promise<number> {
  const r = await onHandFromMoves(sql, {
    itemId,
    status: opts?.status ?? "AVAILABLE",
    warehouseCode: opts?.warehouseCode,
    ownerType: opts?.ownerType ?? "OWN",
  });
  return r.kg;
}

/**
 * Opening seed lots carry qty with no stock_move. The constitution says
 * on-hand = sum of moves, so the first writer materialises an OPENING row.
 */
async function ensureOpeningMove(sql: Sql, lot: LotRow) {
  const existing = await sql.query<{ n: string }>(
    `select count(*)::int as n from stock_move where lot_id = $1`,
    [lot.id],
  );
  if (n(existing[0]?.n) > 0) return;
  const kg = n(lot.qty_kg);
  const pcs = n(lot.qty_pcs);
  if (kg === 0 && pcs === 0) return;
  const wh = (
    await sql.query<{ valuation_eligible: boolean }>(
      `select valuation_eligible from warehouse where id = $1`,
      [lot.warehouse_id],
    )
  )[0];
  const value = moveValuePaise({
    qtyKg: kg,
    ratePaisePerKg: lot.unit_value_paise_per_kg,
    ownerType: lot.owner_type,
    warehouseValuationEligible: wh?.valuation_eligible,
  });
  await sql.query(
    `insert into stock_move (
       move_type, item_id, lot_id, warehouse_id, qty_kg, qty_pcs, value_paise,
       ref_type, notes, alloy_id
     ) values ('OPENING',$1,$2,$3,$4,$5,$6,'OPENING','REASON:ADJ-COUNT | Seeded opening balance',$7)`,
    [lot.item_id, lot.id, lot.warehouse_id, roundKg(kg), pcs, value, lot.alloy_id],
  );
}

export async function postStockMove(sql: Sql, input: StockMoveInput): Promise<{ moveId: number; lot: LotRow }> {
  assertLotRequired(input.lotId);
  const type = toMoveType(String(input.type), input.qtyKg);
  await assertPeriodAllows(sql, input.isoDate || todayISO(), "STOCK");
  const kg = roundKg(n(input.qtyKg));
  const pcs = n(input.qtyPcs);
  if (kg === 0 && pcs === 0 && !input.allowZeroQty) {
    throw new Error("Mass-changing move requires qtyKg (and qtyPcs for FG/customer). Zero-qty only for QC status events.");
  }
  if (input.kgPerPc != null && n(input.kgPerPc) > 0) {
    assertConversion({
      qtyKg: kg,
      qtyPcs: pcs,
      kgPerPc: n(input.kgPerPc),
      kind: input.conversionKind ?? (Math.abs(pcs) > 0 && Math.abs(kg) / Math.max(1, Math.abs(pcs)) < 1 ? "FG" : "ROD"),
      context: type,
    });
  }

  let lot = await getLot(sql, input.lotId);
  if (lot.item_id !== input.itemId) {
    throw new Error(`Lot ${lot.lot_no} is item #${lot.item_id}, not #${input.itemId}`);
  }
  assertAlloyMatch({
    lotAlloyId: lot.alloy_id,
    itemAlloyId: input.itemAlloyId ?? lot.alloy_id,
    context: type,
  });

  // Seeded opening qty is not a move yet — bootstrap it so on-hand = sum(moves).
  await ensureOpeningMove(sql, lot);
  lot = await getLot(sql, input.lotId);

  const warehouseId = input.toWh ?? input.fromWh ?? lot.warehouse_id;
  if (kg < 0 || pcs < 0) {
    assertSufficient({
      haveKg: n(lot.qty_kg),
      takeKg: kg < 0 ? -kg : 0,
      havePcs: n(lot.qty_pcs),
      takePcs: pcs < 0 ? -pcs : 0,
      what: type,
    });
  }

  const wh = (
    await sql.query<{ id: number; kind: string; valuation_eligible: boolean; code: string }>(
      `select id, kind, valuation_eligible, code from warehouse where id = $1`,
      [warehouseId],
    )
  )[0];
  if (!wh) throw new Error("Warehouse not found");

  const nextKg = n(lot.qty_kg) + kg;
  const nextPcs = n(lot.qty_pcs) + pcs;
  assertNegativeStockKind(wh.kind, nextKg, nextPcs);

  const rate = input.ratePaise ?? lot.unit_value_paise_per_kg;
  const value = moveValuePaise({
    qtyKg: kg,
    ratePaisePerKg: rate,
    ownerType: lot.owner_type,
    warehouseValuationEligible: wh.valuation_eligible,
  });

  const notes = encodeMoveNotes({
    reasonCode: input.reasonCode,
    lineId: input.lineId,
    reverseOf: input.reverseOf,
    fromWh: input.fromWh,
    toWh: input.toWh,
    text: input.notes,
  });

  const moved = await sql.query<{ id: number }>(
    `insert into stock_move (
       move_type, item_id, lot_id, warehouse_id, qty_kg, qty_pcs, value_paise,
       ref_type, ref_id, notes, user_id, alloy_id, parent_move_id, consumed_lot_id
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     returning id`,
    [
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
      input.consumedLotId ?? null,
    ],
  );
  const moveId = moved[0]!.id;

  // Projection = sum of immutable moves for this lot (do not trust a stale cache).
  const summed = await sql.query<{ kg: string; pcs: string }>(
    `select coalesce(sum(qty_kg),0) as kg, coalesce(sum(qty_pcs),0) as pcs from stock_move where lot_id = $1`,
    [input.lotId],
  );
  const projKg = n(summed[0]?.kg);
  const projPcs = n(summed[0]?.pcs);
  assertNegativeStockKind(wh.kind, projKg, projPcs);

  const updated = await sql.query<{ id: number }>(
    `update stock_lot set qty_kg = $1, qty_pcs = $2 where id = $3 returning id`,
    [roundKg(projKg), projPcs, input.lotId],
  );
  if (!updated[0]) throw new Error("Lot update failed");

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
      reasonCode: input.reasonCode ?? null,
    },
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
    reverseOf: input.reverseOf ?? null,
    date: input.isoDate || undefined,
  });

  return { moveId, lot: await getLot(sql, input.lotId) };
}

/** Compatibility wrapper — every historical caller goes through postStockMove. */
export async function postMove(
  sql: Sql,
  opts: {
    moveType: string;
    itemId: number;
    lotId: number;
    warehouseId: number;
    qtyKg: number;
    qtyPcs: number;
    refType?: string;
    refId?: number;
    notes?: string;
    userId?: string;
    alloyId?: number | null;
    unitValuePaisePerKg?: number;
    reasonCode?: string | null;
    lineId?: number;
    kgPerPc?: number | null;
    conversionKind?: keyof typeof CONV_TOL;
    allowZeroQty?: boolean;
    itemAlloyId?: number | null;
    parentMoveId?: number | null;
    consumedLotId?: number | null;
    isoDate?: string | null;
  },
) {
  return postStockMove(sql, {
    type: toMoveType(opts.moveType, opts.qtyKg),
    itemId: opts.itemId,
    lotId: opts.lotId,
    fromWh: opts.qtyKg < 0 ? opts.warehouseId : undefined,
    toWh: opts.qtyKg >= 0 ? opts.warehouseId : undefined,
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
    consumedLotId: opts.consumedLotId,
    isoDate: opts.isoDate,
  });
}

export async function reverseStockMove(
  sql: Sql,
  opts: { moveId: number; userId?: string; reasonCode?: string },
): Promise<{ reverseMoveId: number; originalId: number }> {
  const orig = (
    await sql.query<{
      id: number;
      move_type: string;
      item_id: number;
      lot_id: number;
      warehouse_id: number;
      qty_kg: string;
      qty_pcs: string;
      ref_type: string | null;
      ref_id: number | null;
      notes: string | null;
      alloy_id: number | null;
    }>(`select * from stock_move where id = $1`, [opts.moveId])
  )[0];
  if (!orig) throw new Error(`Move ${opts.moveId} not found`);
  if (parseReverseOf(orig.notes) != null) {
    throw new Error("Cannot reverse a reversing move — post a new correction");
  }
  const already = await sql.query<{ id: number }>(
    `select id from stock_move where notes like $1 limit 1`,
    [`%REVERSES:${orig.id}%`],
  );
  if (already[0]) throw new Error(`Move ${orig.id} already reversed by #${already[0].id}`);

  const r = await postStockMove(sql, {
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
    allowZeroQty: n(orig.qty_kg) === 0 && n(orig.qty_pcs) === 0,
  });
  return { reverseMoveId: r.moveId, originalId: orig.id };
}

export async function saveDocSnapshot(
  sql: Sql,
  opts: { userId?: string; entity: string; entityId: number | string; doc: unknown },
) {
  await audit(sql, {
    userId: opts.userId,
    action: "DOC_SNAPSHOT",
    entity: opts.entity,
    entityId: opts.entityId,
    after: opts.doc,
  });
}

export async function loadDocSnapshot<T>(sql: Sql, entity: string, entityId: number | string): Promise<T | null> {
  const rows = await sql.query<{ after_json: string }>(
    `select after_json from audit_log
      where entity = $1 and entity_id = $2 and action = 'DOC_SNAPSHOT'
      order by id desc limit 1`,
    [entity, String(entityId)],
  );
  if (!rows[0]?.after_json) return null;
  try {
    return JSON.parse(rows[0].after_json) as T;
  } catch {
    return null;
  }
}
