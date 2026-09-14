/** Cutover kit — isolated CUTOVERDEMO openings. Stock only via postStockMove. */
import type { Sql } from "@/lib/db";
import { audit, nextDoc, setting } from "./core.server";
import { n, roundKg, todayISO } from "./format";
import { createLot, itemBySku, postMove, warehouseByCode, withStockTx } from "./stock.server";
import { assertPeriodAllows, postJournal, trialBalance } from "@/modules/finance/journal";
import { statutoryDueIso } from "@/modules/compliance/gst/dates";
import { companyFromRow } from "@/modules/compliance/documents/map";
import {
  canTransition,
  freezeItemIssues,
  openingValueCheck,
  parseOpeningJwCsv,
  parseOpeningStockCsv,
  reconcileGate,
  TALLY_NOT_BOOK,
  type CutoverState,
  type OpeningStockRow,
} from "@/modules/cutover/math";
import type { Row } from "./row";

export const DEMO_CUTOVER_CODE = "CUTOVERDEMO";

type CompanyRow = {
  id: number;
  code: string;
  name: string;
  opening_date: string;
  state: string;
  cutover_blocks_live_docs: boolean;
  live_at: string | null;
  tally_sunset_at: string | null;
  owner_override: boolean;
};

export async function getCutoverCompany(sql: Sql, code = DEMO_CUTOVER_CODE): Promise<CompanyRow> {
  const row = (
    await sql.query<CompanyRow>(`select * from cutover_company where code = $1`, [code])
  )[0];
  if (!row) throw new Error(`Cutover company ${code} not found`);
  return row;
}

export async function ensureCutoverDemo(sql: Sql): Promise<CompanyRow> {
  const existing = (await sql.query<CompanyRow>(`select * from cutover_company where code = $1`, [DEMO_CUTOVER_CODE]))[0];
  if (existing) return existing;
  await sql.query(
    `insert into cutover_company (code, name, opening_date, state, cutover_blocks_live_docs)
     values ($1,$2,$3,'NOT_STARTED', true)`,
    [DEMO_CUTOVER_CODE, "Cutover Demo Co", todayISO()],
  );
  return getCutoverCompany(sql, DEMO_CUTOVER_CODE);
}

export async function assertLiveDocsAllowed(sql: Sql, companyCode?: string): Promise<void> {
  const code = (companyCode ?? "TAMBA").toUpperCase();
  if (code === "TAMBA") {
    const flag = await setting(sql, "cutover_blocks_live_docs", "false");
    if (flag !== "true") return;
  }
  if (code === DEMO_CUTOVER_CODE || code !== "TAMBA") {
    const co = await sql.query<CompanyRow>(`select * from cutover_company where code = $1`, [code]);
    const row = co[0];
    if (!row) return;
    if (!row.cutover_blocks_live_docs) return;
    if (row.state === "LIVE" || row.state === "TALLY_SUNSET") return;
    throw new Error(`Live documents blocked until cutover is LIVE (now ${row.state}).`);
  }
}

async function advance(sql: Sql, co: CompanyRow, to: CutoverState, userId: string, notes?: string) {
  if (co.state === to) return;
  if (!canTransition(co.state, to)) {
    throw new Error(`Cannot move cutover ${co.code} ${co.state} → ${to}.`);
  }
  await sql.query(`update cutover_company set state = $1 where id = $2`, [to, co.id]);
  await audit(sql, {
    userId,
    action: `CUTOVER_${to}`,
    entity: "cutover_company",
    entityId: co.id,
    after: { from: co.state, to, notes },
  });
}

export async function mastersFreeze(sql: Sql): Promise<{
  issues: Array<{ sku?: string; code?: string; message: string }>;
  duplicates: Array<{ kind: string; code: string; n: number }>;
}> {
  const items = await sql.query<{
    sku: string;
    type: string;
    alloy_id: number | null;
    stock_uom: string | null;
    alt_uom: string | null;
    hsn: string | null;
    kg_per_pc: string | null;
  }>(`select sku, type, alloy_id, stock_uom, alt_uom, hsn, kg_per_pc from item where active = true`);
  const issues: Array<{ sku?: string; code?: string; message: string }> = [];
  for (const it of items) {
    for (const msg of freezeItemIssues({
      sku: it.sku,
      type: it.type,
      alloyId: it.alloy_id,
      stockUom: it.stock_uom,
      altUom: it.alt_uom,
      hsn: it.hsn,
      kgPerPc: it.kg_per_pc == null ? null : n(it.kg_per_pc),
    })) {
      issues.push({ sku: it.sku, message: msg });
    }
  }
  const dup = async (kind: string, table: string, col: string) => {
    const rows = await sql.query<{ code: string; n: string }>(
      `select ${col} as code, count(*)::int as n from ${table} group by ${col} having count(*) > 1`,
    );
    return rows.map((r) => ({ kind, code: r.code, n: n(r.n) }));
  };
  const duplicates = [
    ...(await dup("item", "item", "sku")),
    ...(await dup("partner", "partner", "code")),
    ...(await dup("warehouse", "warehouse", "code")),
    ...(await dup("alloy", "alloy", "code")),
  ];
  return { issues, duplicates };
}

function remapWarehouse(code: string, owner: string): string {
  if (owner === "CUSTOMER") return "CUTOVER-JW-IN";
  const c = code.toUpperCase();
  if (c === "RM-ROD" || c === "CUTOVER-RM") return "CUTOVER-RM";
  if (c.startsWith("FG") || c === "CUTOVER-FG") return "CUTOVER-FG";
  if (c === "JW-OUT" || c === "CUTOVER-JW-OUT") return "CUTOVER-JW-OUT";
  if (c.includes("JW-IN") || c === "CUTOVER-JW-IN") return "CUTOVER-JW-IN";
  if (c.startsWith("CUTOVER-")) return c;
  return "CUTOVER-RM";
}

export type DryStockLine = OpeningStockRow & {
  ok: boolean;
  error?: string;
  expectedValue?: number;
  warehouseMapped?: string;
};

export async function dryRunOpeningStock(sql: Sql, csv: string): Promise<{ rows: DryStockLine[]; ok: boolean }> {
  const parsed = parseOpeningStockCsv(csv);
  const out: DryStockLine[] = [];
  const lotSeen = new Set<string>();
  for (const r of parsed) {
    const line: DryStockLine = { ...r, ok: true, warehouseMapped: remapWarehouse(r.warehouseCode, r.owner) };
    if (!r.sku) {
      line.ok = false;
      line.error = "sku required";
    }
    if (!r.lotNo) {
      line.ok = false;
      line.error = "lotNo required";
    }
    if (r.lotNo && lotSeen.has(r.lotNo)) {
      line.ok = false;
      line.error = `duplicate lotNo ${r.lotNo}`;
    }
    if (r.lotNo) lotSeen.add(r.lotNo);
    const item = (
      await sql.query<{
        sku: string;
        type: string;
        alloy_id: number | null;
        stock_uom: string | null;
        alt_uom: string | null;
        hsn: string | null;
        kg_per_pc: string | null;
      }>(`select sku, type, alloy_id, stock_uom, alt_uom, hsn, kg_per_pc from item where sku = $1`, [r.sku])
    )[0];
    if (!item) {
      line.ok = false;
      line.error = `unknown sku ${r.sku}`;
    } else {
      const freeze = freezeItemIssues({
        sku: item.sku,
        type: item.type,
        alloyId: item.alloy_id,
        stockUom: item.stock_uom,
        altUom: item.alt_uom,
        hsn: item.hsn,
        kgPerPc: item.kg_per_pc == null ? null : n(item.kg_per_pc),
      });
      if (freeze.length) {
        line.ok = false;
        line.error = freeze.join("; ");
      }
      if (item.type === "FG" && n(item.kg_per_pc) > 0 && n(r.qtyPcs) > 0 && n(r.qtyKg) <= 0) {
        line.qtyKg = roundKg(n(r.qtyPcs) * n(item.kg_per_pc));
      }
    }
    if (r.owner === "CUSTOMER") {
      line.valuePaise = 0;
      line.ratePaisePerKg = 0;
    } else {
      const chk = openingValueCheck({
        ratePaisePerKg: r.ratePaisePerKg,
        qtyKg: line.qtyKg,
        valuePaise: r.valuePaise,
      });
      line.expectedValue = chk.expected;
      if (!chk.ok) {
        line.ok = false;
        line.error = `value ${r.valuePaise} vs rate×kg ${chk.expected} Δ ₹${(chk.delta / 100).toFixed(2)} > ₹1`;
      }
    }
    out.push(line);
  }
  return { rows: out, ok: out.length > 0 && out.every((r) => r.ok) };
}

export async function postOpeningStock(
  sql: Sql,
  opts: { csv: string; userId: string; companyCode?: string },
): Promise<{ posted: number; ownValuePaise: number; customerKg: number }> {
  const co = await getCutoverCompany(sql, opts.companyCode ?? DEMO_CUTOVER_CODE);
  if (co.state !== "NOT_STARTED" && co.state !== "COUNTED") {
    throw new Error(`Opening stock only before JW confirm (state ${co.state}).`);
  }
  const openingDate = String(co.opening_date).slice(0, 10);
  await assertPeriodAllows(sql, openingDate, "STOCK");
  const dry = await dryRunOpeningStock(sql, opts.csv);
  if (!dry.ok) throw new Error(dry.rows.find((r) => !r.ok)?.error ?? "Opening stock dry-run failed.");
  return withStockTx(sql, async () => {
    await sql.query(`delete from cutover_opening_stock where company_id = $1`, [co.id]);
    let own = 0;
    let customerKg = 0;
    let posted = 0;
    for (const r of dry.rows) {
      const item = await itemBySku(sql, r.sku);
      const alloy = r.alloyCode
        ? (await sql.query<{ id: number }>(`select id from alloy where code = $1`, [r.alloyCode]))[0]
        : null;
      if (r.alloyCode && alloy && item.alloy_id != null && Number(item.alloy_id) !== Number(alloy.id)) {
        throw new Error(`Alloy ${r.alloyCode} does not match item ${r.sku}.`);
      }
      const wh = await warehouseByCode(sql, r.warehouseMapped ?? remapWarehouse(r.warehouseCode, r.owner));
      let ownerPartnerId: number | null = null;
      if (r.owner === "CUSTOMER") {
        if (!r.customerCode) throw new Error("CUSTOMER opening needs customerCode.");
        const p = (await sql.query<{ id: number }>(`select id from partner where code = $1`, [r.customerCode]))[0];
        if (!p) throw new Error(`Unknown customer ${r.customerCode}`);
        ownerPartnerId = p.id;
      }
      const existing = (await sql.query<{ id: number }>(`select id from stock_lot where lot_no = $1`, [r.lotNo]))[0];
      if (existing) throw new Error(`Lot ${r.lotNo} already exists.`);
      const lot = await createLot(sql, {
        itemId: item.id,
        warehouseId: wh.id,
        alloyId: alloy?.id ?? item.alloy_id,
        heatNo: r.heatNo || null,
        status: "AVAILABLE",
        ownerType: r.owner,
        ownerPartnerId,
        unitValuePaisePerKg: r.owner === "CUSTOMER" ? 0 : r.ratePaisePerKg,
        sourceType: "CUTOVER",
        sourceId: co.id,
        lotNo: r.lotNo,
      });
      const mv = await postMove(sql, {
        moveType: "OPENING_STOCK",
        itemId: item.id,
        lotId: lot.id,
        warehouseId: wh.id,
        qtyKg: r.qtyKg,
        qtyPcs: r.qtyPcs,
        refType: "CUTOVER",
        refId: co.id,
        userId: opts.userId,
        alloyId: alloy?.id ?? item.alloy_id,
        itemAlloyId: item.alloy_id,
        unitValuePaisePerKg: r.owner === "CUSTOMER" ? 0 : r.ratePaisePerKg,
        kgPerPc: n(item.kg_per_pc) > 0 ? n(item.kg_per_pc) : undefined,
        conversionKind: item.type === "FG" ? "FG" : undefined,
        notes: r.notes || `Opening ${co.code}`,
        isoDate: openingDate,
      });
      await sql.query(
        `insert into cutover_opening_stock (
           company_id, sku, lot_no, warehouse_code, alloy_code, qty_kg, qty_pcs,
           rate_paise_per_kg, value_paise, heat_no, owner_type, customer_code, notes,
           lot_id, posted_move_id, dry_run_ok
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true)`,
        [
          co.id,
          r.sku,
          r.lotNo,
          wh.code,
          r.alloyCode,
          r.qtyKg,
          r.qtyPcs,
          r.ratePaisePerKg,
          r.owner === "CUSTOMER" ? 0 : r.valuePaise,
          r.heatNo,
          r.owner,
          r.customerCode || null,
          r.notes,
          lot.id,
          mv.moveId,
        ],
      );
      if (r.owner === "CUSTOMER") customerKg = roundKg(customerKg + r.qtyKg);
      else own += r.valuePaise;
      posted += 1;
    }
    if (co.state === "NOT_STARTED") await advance(sql, co, "COUNTED", opts.userId, `posted ${posted} lots`);
    return { posted, ownValuePaise: own, customerKg };
  });
}

export async function postOpeningJw(
  sql: Sql,
  opts: { csv: string; userId: string; companyCode?: string },
): Promise<{ posted: number; confirmationNo: string | null; challanIds: number[] }> {
  const co = await getCutoverCompany(sql, opts.companyCode ?? DEMO_CUTOVER_CODE);
  if (co.state !== "COUNTED" && co.state !== "JW_CONFIRMED") {
    throw new Error(`Opening JW after stock count (state ${co.state}).`);
  }
  const openingDate = String(co.opening_date).slice(0, 10);
  await assertPeriodAllows(sql, openingDate, "STOCK");
  const rows = parseOpeningJwCsv(opts.csv);
  if (!rows.length) throw new Error("Opening JW CSV is empty.");
  return withStockTx(sql, async () => {
    await sql.query(`delete from cutover_opening_jw where company_id = $1`, [co.id]);
    const challanIds: number[] = [];
    let confirmationNo: string | null = null;
    for (const r of rows) {
      if (!r.originalChallanNo || !r.originalChallanDate) {
        throw new Error("Opening JW needs original challanNo + challanDate.");
      }
      const due = statutoryDueIso(r.originalChallanDate.slice(0, 10), "INPUTS");
      const item = await itemBySku(sql, r.sku);
      const partner = (
        await sql.query<{ id: number }>(`select id from partner where code = $1`, [r.partnerCode])
      )[0];
      if (!partner) throw new Error(`Unknown JW vendor ${r.partnerCode}`);
      const kg = r.qtyKg > 0 ? r.qtyKg : roundKg(n(item.kg_per_pc) * r.qtyPcs);
      const chk = openingValueCheck({
        ratePaisePerKg: r.ratePaisePerKg,
        qtyKg: kg,
        valuePaise: r.valuePaise || Math.round(kg * r.ratePaisePerKg),
      });
      if (r.valuePaise && !chk.ok) throw new Error(`JW value mismatch on ${r.originalChallanNo}`);
      const wh = await warehouseByCode(sql, "CUTOVER-JW-OUT");
      const lotNo = `CUT-JW-${r.originalChallanNo.replace(/[^A-Za-z0-9]/g, "").slice(-8)}`;
      const existing = (await sql.query<{ id: number }>(`select id from stock_lot where lot_no = $1`, [lotNo]))[0];
      if (existing) throw new Error(`Lot ${lotNo} already exists.`);
      const lot = await createLot(sql, {
        itemId: item.id,
        warehouseId: wh.id,
        alloyId: item.alloy_id,
        heatNo: r.originalChallanNo,
        status: "AVAILABLE",
        ownerType: "OWN",
        unitValuePaisePerKg: r.ratePaisePerKg,
        sourceType: "CUTOVER",
        sourceId: co.id,
        lotNo,
      });
      await postMove(sql, {
        moveType: "OPENING_STOCK",
        itemId: item.id,
        lotId: lot.id,
        warehouseId: wh.id,
        qtyKg: kg,
        qtyPcs: r.qtyPcs,
        refType: "CUTOVER",
        refId: co.id,
        userId: opts.userId,
        alloyId: item.alloy_id,
        itemAlloyId: item.alloy_id,
        unitValuePaisePerKg: r.ratePaisePerKg,
        notes: `Opening JW ${r.originalChallanNo}`,
        isoDate: openingDate,
        kgPerPc: n(item.kg_per_pc) > 0 ? n(item.kg_per_pc) : undefined,
        conversionKind: "FG",
      });
      const clash = (
        await sql.query<{ id: number }>(`select id from job_work_challan where doc_no = $1`, [r.originalChallanNo])
      )[0];
      if (clash) throw new Error(`Challan ${r.originalChallanNo} already exists.`);
      const ch = (
        await sql.query<{ id: number }>(
          `insert into job_work_challan (
             doc_no, partner_id, process_code, issued_at, expected_return_at, statutory_due,
             status, notes, created_by, loss_norm_pct
           ) values ($1,$2,$3,$4::date,$5,$6,'OPEN',$7,$8,1.5) returning id`,
          [
            r.originalChallanNo,
            partner.id,
            r.processCode || "NI_CR",
            r.originalChallanDate.slice(0, 10),
            due,
            due,
            "OPENING CONFIRMATION — not a delivery challan.",
            opts.userId,
          ],
        )
      )[0]!;
      await sql.query(
        `insert into job_work_challan_line (challan_id, item_id, lot_id, jw_lot_id, qty_pcs, qty_kg, hsn)
         values ($1,$2,$3,$3,$4,$5,$6)`,
        [ch.id, item.id, lot.id, r.qtyPcs, kg, item.hsn ?? ""],
      );
      confirmationNo = confirmationNo ?? (await nextDoc(sql, "OC"));
      const snap = {
        title: "OPENING CONFIRMATION",
        watermark: "OPENING CONFIRMATION — not a delivery challan.",
        notTaxInvoice: true,
        docNo: confirmationNo,
        originalChallanNo: r.originalChallanNo,
        originalChallanDate: r.originalChallanDate.slice(0, 10),
        statutoryDue: due,
        sku: r.sku,
        qtyPcs: r.qtyPcs,
        qtyKg: kg,
        partnerCode: r.partnerCode,
        heatNo: r.originalChallanNo,
      };
      await sql.query(
        `insert into cutover_opening_jw (
           company_id, original_challan_no, original_challan_date, statutory_due, partner_code,
           process_code, sku, qty_pcs, qty_kg, rate_paise_per_kg, value_paise, challan_id, lot_id,
           confirmation_no, snapshot_json
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          co.id,
          r.originalChallanNo,
          r.originalChallanDate.slice(0, 10),
          due,
          r.partnerCode,
          r.processCode || "NI_CR",
          r.sku,
          r.qtyPcs,
          kg,
          r.ratePaisePerKg,
          r.valuePaise || Math.round(kg * r.ratePaisePerKg),
          ch.id,
          lot.id,
          confirmationNo,
          JSON.stringify(snap),
        ],
      );
      challanIds.push(ch.id);
    }
    if (co.state === "COUNTED") await advance(sql, co, "JW_CONFIRMED", opts.userId);
    return { posted: rows.length, confirmationNo, challanIds };
  });
}

export async function loadOpeningTb(
  sql: Sql,
  opts: { userId: string; companyCode?: string; arPaise?: number; apPaise?: number },
): Promise<{
  ownInventoryPaise: number;
  customerInventoryPaise: number;
  inventoryLedgerPaise: number;
  tb: { debit: number; credit: number; balanced: boolean };
  reconciled: boolean;
  reasons: string[];
}> {
  const co = await getCutoverCompany(sql, opts.companyCode ?? DEMO_CUTOVER_CODE);
  if (co.state !== "JW_CONFIRMED" && co.state !== "TB_LOADED" && co.state !== "RECONCILED") {
    throw new Error(`Load TB after JW confirm (state ${co.state}).`);
  }
  const lots = await sql.query<{
    qty_kg: string;
    unit_value_paise_per_kg: number;
    owner_type: string;
    warehouse: string;
    kind: string;
  }>(
    `select l.qty_kg, l.unit_value_paise_per_kg, l.owner_type, w.code as warehouse, w.kind
       from stock_lot l join warehouse w on w.id = l.warehouse_id
      where l.source_type = 'CUTOVER' and l.source_id = $1`,
    [co.id],
  );
  let own = 0;
  let customer = 0;
  for (const l of lots) {
    const v = Math.round(n(l.qty_kg) * n(l.unit_value_paise_per_kg));
    if (l.owner_type === "CUSTOMER") customer += v;
    else own += v;
  }
  const invLedgers = await sql.query<{ d: string }>(
    `select coalesce(sum(jl.debit_paise - jl.credit_paise),0)::bigint as d
       from journal_line jl
       join journal j on j.id = jl.journal_id
      where j.source_type = 'CUTOVER' and j.source_id = $1
        and jl.account_code in ('1110','1120','1130','1135','1140','1150')`,
    [co.id],
  );
  const invPaise = n(invLedgers[0]?.d);
  const ar = opts.arPaise ?? 0;
  const ap = opts.apPaise ?? 0;
  if (ar || ap) {
    const lines = [];
    if (ar) lines.push({ account: "2200", debit: ar, credit: 0 }, { account: "3100", debit: 0, credit: ar });
    if (ap) lines.push({ account: "3100", debit: ap, credit: 0 }, { account: "2120", debit: 0, credit: ap });
    await postJournal(sql, {
      date: String(co.opening_date).slice(0, 10),
      narration: `CUTOVER ${co.code} opening AR/AP`,
      sourceType: "CUTOVER",
      sourceId: co.id,
      userId: opts.userId,
      lines,
    });
  }
  await sql.query(`delete from cutover_opening_subledger where company_id = $1`, [co.id]);
  await sql.query(
    `insert into cutover_opening_subledger (company_id, kind, partner_code, amount_paise, tally_code)
     values ($1,'AR','*',$2,'1100'), ($1,'AP','*',$3,'2000')`,
    [co.id, ar, ap],
  );
  const tb = await trialBalance(sql);
  const gate = reconcileGate({
    ownInventoryPaise: own,
    customerInventoryPaise: customer,
    inventoryLedgerPaise: invPaise,
    arPaise: ar,
    apPaise: ap,
    tallyArPaise: ar,
    tallyApPaise: ap,
    tbDebit: tb.debit,
    tbCredit: tb.credit,
  });
  await sql.query(`delete from cutover_opening_tb where company_id = $1`, [co.id]);
  const maps = await sql.query<{ tamba_code: string; tally_code: string }>(`select tamba_code, tally_code from tally_ledger_map`);
  for (const m of maps) {
    const ln = tb.rows.find((r) => r.code === m.tamba_code);
    await sql.query(
      `insert into cutover_opening_tb (company_id, tamba_code, tally_code, debit_paise, credit_paise)
       values ($1,$2,$3,$4,$5)`,
      [co.id, m.tamba_code, m.tally_code, ln?.debit ?? 0, ln?.credit ?? 0],
    );
  }
  const fresh = await getCutoverCompany(sql, co.code);
  if (fresh.state === "JW_CONFIRMED") await advance(sql, fresh, "TB_LOADED", opts.userId);
  const afterTb = await getCutoverCompany(sql, co.code);
  if (gate.ok && afterTb.state === "TB_LOADED") {
    await advance(sql, afterTb, "RECONCILED", opts.userId, gate.reasons.join("; ") || "squared");
  }
  return {
    ownInventoryPaise: own,
    customerInventoryPaise: customer,
    inventoryLedgerPaise: invPaise,
    tb: { debit: tb.debit, credit: tb.credit, balanced: tb.balanced },
    reconciled: gate.ok,
    reasons: gate.reasons,
  };
}

export async function goLive(
  sql: Sql,
  opts: { userId: string; role?: string; ownerOverride?: boolean; companyCode?: string },
): Promise<{ state: CutoverState }> {
  const co = await getCutoverCompany(sql, opts.companyCode ?? DEMO_CUTOVER_CODE);
  if (co.state === "LIVE" || co.state === "TALLY_SUNSET") return { state: co.state as CutoverState };
  if (co.state !== "RECONCILED") {
    if (!opts.ownerOverride) throw new Error("LIVE needs RECONCILED or audited Owner override.");
    if (opts.role && opts.role !== "OWNER" && opts.role !== "ADMIN") {
      throw new Error("Only Owner can override cutover LIVE.");
    }
    await sql.query(`update cutover_company set owner_override = true, state = 'RECONCILED' where id = $1`, [co.id]);
    const rec = await getCutoverCompany(sql, co.code);
    await advance(sql, rec, "LIVE", opts.userId, "owner override");
  } else {
    await advance(sql, co, "LIVE", opts.userId);
  }
  await sql.query(`update cutover_company set live_at = now() where id = $1`, [
    (await getCutoverCompany(sql, co.code)).id,
  ]);
  return { state: "LIVE" };
}

export async function postCutoverGrn(
  sql: Sql,
  opts: { userId: string; qtyKg: number; companyCode?: string },
): Promise<{ docNo: string; lotNo: string }> {
  const code = opts.companyCode ?? DEMO_CUTOVER_CODE;
  await assertLiveDocsAllowed(sql, code);
  const co = await getCutoverCompany(sql, code);
  const item = await itemBySku(sql, "ROD-C360-12MM");
  const wh = await warehouseByCode(sql, "CUTOVER-RM");
  const partner = (await sql.query<{ id: number }>(`select id from partner where code = 'V-RAJESH'`))[0];
  if (!partner) throw new Error("V-RAJESH missing");
  return withStockTx(sql, async () => {
    const docNo = await nextDoc(sql, "GRN");
    const grn = (
      await sql.query<{ id: number }>(
        `insert into grn (doc_no, partner_id, grn_date, status, created_by)
         values ($1,$2,$3,'QC_HOLD',$4) returning id`,
        [docNo, partner.id, todayISO(), opts.userId],
      )
    )[0]!;
    const lot = await createLot(sql, {
      itemId: item.id,
      warehouseId: wh.id,
      alloyId: item.alloy_id,
      heatNo: "H-CUT-LIVE",
      status: "QUARANTINE",
      ownerType: "OWN",
      unitValuePaisePerKg: 62000,
      sourceType: "CUTOVER",
      sourceId: co.id,
    });
    await postMove(sql, {
      moveType: "GRN_RECEIPT",
      itemId: item.id,
      lotId: lot.id,
      warehouseId: wh.id,
      qtyKg: opts.qtyKg,
      qtyPcs: 0,
      refType: "GRN",
      refId: grn.id,
      userId: opts.userId,
      alloyId: item.alloy_id,
      itemAlloyId: item.alloy_id,
      unitValuePaisePerKg: 62000,
      notes: `CUTOVERDEMO live GRN`,
    });
    await sql.query(
      `insert into grn_line (grn_id, item_id, heat_no, gross_kg, tare_kg, net_kg, lot_id, warehouse_id)
       values ($1,$2,$3,$4,0,$4,$5,$6)`,
      [grn.id, item.id, "H-CUT-LIVE", opts.qtyKg, lot.id, wh.id],
    );
    return { docNo, lotNo: lot.lot_no };
  });
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportTally(
  sql: Sql,
  opts: { userId: string; companyCode?: string },
): Promise<{ dir: string; files: string[] }> {
  const co = await getCutoverCompany(sql, opts.companyCode ?? DEMO_CUTOVER_CODE);
  if (co.state !== "LIVE" && co.state !== "TALLY_SUNSET") {
    throw new Error("Tally export only after LIVE.");
  }
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const header = TALLY_NOT_BOOK;
  const dir = join(process.cwd(), "artifacts", "tally-export", co.code);
  await mkdir(dir, { recursive: true });
  const journals = await sql.query<Row>(
    `select j.doc_no, j.jv_date, j.narration, jl.account_code, jl.debit_paise, jl.credit_paise
       from journal j join journal_line jl on jl.journal_id = j.id
      where j.source_type = 'CUTOVER' and j.source_id = $1
      order by j.id, jl.line_no`,
    [co.id],
  );
  const sales = await sql.query<Row>(
    `select doc_no, invoice_date, taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status
       from sales_invoice order by id`,
  );
  const purchase = await sql.query<Row>(
    `select doc_no, bill_date, taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status
       from vendor_bill order by id`,
  );
  const stock = await sql.query<Row>(
    `select l.lot_no, i.sku, w.code as warehouse, l.qty_kg, l.qty_pcs, l.owner_type, l.unit_value_paise_per_kg
       from stock_lot l join item i on i.id = l.item_id join warehouse w on w.id = l.warehouse_id
      where l.source_type = 'CUTOVER' and l.source_id = $1
      order by i.sku, l.lot_no`,
    [co.id],
  );
  const write = async (name: string, cols: string[], rows: Row[]) => {
    const body = [
      `# ${header}`,
      cols.join(","),
      ...rows.map((r) => cols.map((c) => csvEscape(r[c])).join(",")),
    ].join("\n");
    const path = join(dir, name);
    await writeFile(path, body, "utf8");
    await sql.query(`insert into cutover_export (company_id, kind, path, header) values ($1,$2,$3,$4)`, [
      co.id,
      name,
      path,
      header,
    ]);
    return path;
  };
  const files = [
    await write("journals.csv", ["doc_no", "jv_date", "narration", "account_code", "debit_paise", "credit_paise"], journals),
    await write(
      "sales_register.csv",
      ["doc_no", "invoice_date", "taxable_paise", "cgst_paise", "sgst_paise", "igst_paise", "total_paise", "status"],
      sales,
    ),
    await write(
      "purchase_register.csv",
      ["doc_no", "bill_date", "taxable_paise", "cgst_paise", "sgst_paise", "igst_paise", "total_paise", "status"],
      purchase,
    ),
    await write(
      "stock_summary.csv",
      ["lot_no", "sku", "warehouse", "qty_kg", "qty_pcs", "owner_type", "unit_value_paise_per_kg"],
      stock,
    ),
  ];
  const fresh = await getCutoverCompany(sql, co.code);
  if (fresh.state === "LIVE") {
    await advance(sql, fresh, "TALLY_SUNSET", opts.userId);
    await sql.query(`update cutover_company set tally_sunset_at = now() where id = $1`, [fresh.id]);
  }
  return { dir, files };
}

export async function importTallyTb(sql: Sql, companyCode = DEMO_CUTOVER_CODE): Promise<void> {
  const co = await getCutoverCompany(sql, companyCode);
  if (co.state === "LIVE" || co.state === "TALLY_SUNSET") {
    throw new Error(`Refuse Tally TB import after LIVE. ${TALLY_NOT_BOOK}`);
  }
  throw new Error("Tally TB import is not supported. Tamba is the book of record.");
}

export async function signOff(
  sql: Sql,
  opts: { gate: string; userId: string; notes?: string; companyCode?: string },
): Promise<void> {
  const co = await getCutoverCompany(sql, opts.companyCode ?? DEMO_CUTOVER_CODE);
  await sql.query(
    `insert into cutover_signoff (company_id, gate, signed_by, signed_at, notes)
     values ($1,$2,$3,now(),$4)
     on conflict (company_id, gate) do update set signed_by = excluded.signed_by, signed_at = now(), notes = excluded.notes`,
    [co.id, opts.gate, opts.userId, opts.notes ?? null],
  );
}

export async function listCutover(sql: Sql, companyCode = DEMO_CUTOVER_CODE) {
  const company = await ensureCutoverDemo(sql);
  const co = companyCode === DEMO_CUTOVER_CODE ? company : await getCutoverCompany(sql, companyCode);
  const freeze = await mastersFreeze(sql);
  const stock = await sql.query<Row>(`select * from cutover_opening_stock where company_id = $1 order by id`, [co.id]);
  const jw = await sql.query<Row>(`select * from cutover_opening_jw where company_id = $1 order by id`, [co.id]);
  const signoffs = await sql.query<Row>(`select * from cutover_signoff where company_id = $1 order by id`, [co.id]);
  const map = await sql.query<Row>(`select * from tally_ledger_map order by tamba_code`);
  const exports = await sql.query<Row>(`select * from cutover_export where company_id = $1 order by id desc limit 12`, [
    co.id,
  ]);
  const demoBlocks = (await setting(sql, "cutover_blocks_live_docs", "false")) === "true";
  return { company: co, freeze, stock, jw, signoffs, map, exports, demoBlocksLiveDocs: demoBlocks };
}

export async function getOpeningJwDoc(sql: Sql, id: number) {
  const row = (await sql.query<Row>(`select * from cutover_opening_jw where id = $1`, [id]))[0];
  if (!row) throw new Error("Opening JW confirmation not found");
  const company = (await sql.query<Row>(`select * from company limit 1`))[0];
  const partner = (await sql.query<Row>(`select * from partner where code = $1`, [String(row.partner_code)]))[0];
  return {
    title: "OPENING CONFIRMATION" as const,
    watermark: "OPENING CONFIRMATION — not a delivery challan.",
    notTaxInvoice: true as const,
    docNo: String(row.confirmation_no ?? row.original_challan_no),
    originalChallanNo: String(row.original_challan_no),
    originalChallanDate: String(row.original_challan_date).slice(0, 10),
    statutoryDue: String(row.statutory_due).slice(0, 10),
    sku: String(row.sku),
    qtyPcs: n(row.qty_pcs),
    qtyKg: n(row.qty_kg),
    partnerName: String(partner?.name ?? row.partner_code),
    processCode: String(row.process_code),
    company: companyFromRow(company),
  };
}
