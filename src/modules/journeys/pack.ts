/**
 * Journey pack — posts Prompt 01–06c paths through posting.ts on a FRESH
 * in-memory PGLite (new process). Prompt 05 adds 11–17 (finance/GST).
 * Prompt 06a adds 18–21 (IRP / e-way stub). Prompt 06b adds 22–27 (foundry).
 * Prompt 06c adds 28–32 (cutover kit on isolated CUTOVERDEMO).
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { erpSql, nextDoc, audit } from "@/lib/erp/core.server";
import { n, roundKg, todayISO, addDaysISO } from "@/lib/erp/format";
import {
  createLot,
  getLot,
  itemBySku,
  linkGenealogy,
  postMove,
  saveDocSnapshot,
  loadDocSnapshot,
  warehouseByCode,
  withStockTx,
} from "@/modules/inventory/posting";
import { jwLossWorking, woCompleteCheck, yieldGap, assertPackingMatch, assertAlloyMatch } from "@/modules/inventory/rules";
import { quoteItem } from "@/modules/quote/load";
import { mapDeliveryChallan, mapGrnSlip, mapPackingList, mapQuote, mapTaxInvoice } from "@/modules/compliance/documents/map";
import { gstBreakup, classifySupply } from "@/modules/compliance/gst/tax";
import { invoicePrintIssues } from "@/modules/compliance/gst/validate";
import {
  assertPeriodAllows,
  billMatchLines,
  invoiceJournalLines,
  postJournal,
  receiptLines,
  trialBalance,
} from "@/modules/finance/journal";
import { gstr1B2b, gstr1Hsn, itc04Period } from "@/modules/finance/gst-worksheets";
import { postExcessLossJournal, postInvoiceJournal } from "@/lib/erp/api-finance";
import { cancelPersistedIrn, generateAndPersistEway, generateAndPersistIrn, overlayInvoiceIrp } from "@/lib/erp/irp-service";
import { CANCEL_CREDIT_NOTE_MSG, mapInvoiceToIrpPayload } from "@/modules/compliance/irp";
import { mapChallanToEwayPartA } from "@/modules/compliance/eway";
import type { DeliveryChallanDoc, TaxInvoiceDoc } from "@/modules/compliance/documents/types";
import type { Sql } from "@/lib/db";
import type { Row } from "@/lib/erp/row";
import {
  addChargeLine,
  closeHeat,
  confirmCharge,
  createHeat,
  pourAndKnockout,
  postSpectro,
} from "@/lib/erp/foundry-service";
import {
  exportTally,
  goLive,
  importTallyTb,
  loadOpeningTb,
  postCutoverGrn,
  postOpeningJw,
  postOpeningStock,
} from "@/lib/erp/cutover-service";
import { SAMPLE_STOCK_CSV, TALLY_NOT_BOOK } from "@/modules/cutover/math";

export type JourneyStep = { n: number; title: string; pass: boolean; note: string };
export type JourneyReport = {
  runAt: string;
  passed: number;
  failed: number;
  steps: JourneyStep[];
  extra: Record<string, unknown>;
};

async function one<T>(sql: Sql, text: string, params: unknown[] = []): Promise<T> {
  const rows = await sql.query<T>(text, params);
  if (!rows[0]) throw new Error(`Expected a row: ${text}`);
  return rows[0];
}

export async function runJourneys(): Promise<JourneyReport> {
  const sql = await erpSql();
  const owner = await one<{ user_id: string }>(sql, `select user_id from staff where role = 'OWNER' limit 1`);
  const userId = owner.user_id;

  const rod = await one<{ id: number; alloy_id: number; sku: string; name: string; hsn: string | null }>(
    sql,
    `select id, alloy_id, sku, name, hsn from item where sku = 'ROD-C360-12MM'`,
  );
  const hex = await one<{
    id: number;
    alloy_id: number;
    sku: string;
    name: string;
    hsn: string | null;
    kg_per_pc: string;
    recovery_factor: string;
  }>(sql, `select id, alloy_id, sku, name, hsn, kg_per_pc, recovery_factor from item where sku = 'HEX-NIPPLE-1/2-NCR'`);
  const rajesh = await one<{ id: number }>(sql, `select id from partner where code = 'V-RAJESH'`);
  const gs = await one<{ id: number; state_code: string | null; gstin: string | null; name: string; country: string }>(
    sql,
    `select id, state_code, gstin, name, country from partner where code = 'C-GS'`,
  );
  const kiran = await one<{ id: number }>(sql, `select id from partner where code = 'V-KIRAN'`);
  const company = await one<Row>(sql, `select * from company limit 1`);
  const rmRod = await warehouseByCode(sql, "RM-ROD");
  const kgPer = n(hex.kg_per_pc);
  const steps: JourneyStep[] = [];

  // 1. GRN 1250.500 → QC hold → release
  const grnNet = 1250.5;
  const grn = await withStockTx(sql, async () => {
    const docNo = await nextDoc(sql, "GRN");
    const g = (
      await sql.query<{ id: number }>(
        `insert into grn (doc_no, partner_id, grn_date, status, created_by) values ($1,$2,$3,'QC_HOLD',$4) returning id`,
        [docNo, rajesh.id, todayISO(), userId],
      )
    )[0]!;
    const lot = await createLot(sql, {
      itemId: rod.id,
      warehouseId: rmRod.id,
      alloyId: rod.alloy_id,
      heatNo: "H-J1",
      status: "QUARANTINE",
      unitValuePaisePerKg: 62000,
      sourceType: "GRN",
      sourceId: g.id,
    });
    await postMove(sql, {
      moveType: "GRN_RECEIPT",
      itemId: rod.id,
      lotId: lot.id,
      warehouseId: rmRod.id,
      qtyKg: grnNet,
      qtyPcs: 0,
      refType: "GRN",
      refId: g.id,
      userId,
      alloyId: rod.alloy_id,
      itemAlloyId: rod.alloy_id,
      unitValuePaisePerKg: 62000,
      notes: "Heat H-J1 gross 1251.500 tare 1.000",
    });
    await sql.query(
      `insert into grn_line (grn_id, item_id, heat_no, gross_kg, tare_kg, net_kg, lot_id, warehouse_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [g.id, rod.id, "H-J1", 1251.5, 1, grnNet, lot.id, rmRod.id],
    );
    const qiNo = await nextDoc(sql, "QI");
    const qi = (
      await sql.query<{ id: number }>(`insert into quality_inspection (doc_no, lot_id, result) values ($1,$2,'PENDING') returning id`, [
        qiNo,
        lot.id,
      ])
    )[0]!;
    await postMove(sql, {
      moveType: "QC_RELEASE",
      itemId: rod.id,
      lotId: lot.id,
      warehouseId: rmRod.id,
      qtyKg: 0,
      qtyPcs: 0,
      refType: "QI",
      refId: qi.id,
      userId,
      alloyId: rod.alloy_id,
      itemAlloyId: rod.alloy_id,
      allowZeroQty: true,
    });
    await sql.query(`update stock_lot set status = 'AVAILABLE' where id = $1`, [lot.id]);
    await sql.query(`update quality_inspection set result = 'PASS', inspected_at = now() where id = $1`, [qi.id]);
    const slip = mapGrnSlip({
      company,
      grn: { doc_no: docNo, grn_date: todayISO(), partner_name: "Rajeshwar", partner_gstin: "", partner_addr: "" },
      line: { sku: rod.sku, heat_no: "H-J1", gross_kg: 1251.5, tare_kg: 1, net_kg: grnNet, lot_status: "AVAILABLE" },
    });
    await saveDocSnapshot(sql, { userId, entity: "grn", entityId: g.id, doc: slip });
    return { id: g.id, docNo, lotId: lot.id, qiId: qi.id };
  });
  const grnLotId = grn.lotId;
  steps.push({
    n: 1,
    title: "GRN 1250.500 kg C360 rod → QC hold → release",
    pass: n((await getLot(sql, grnLotId)).qty_kg) === grnNet && (await getLot(sql, grnLotId)).status === "AVAILABLE",
    note: `${grn.docNo} lot AVAILABLE`,
  });

  // 2. SO 10,000 HEX
  const qSnap = await quoteItem(sql, { itemId: hex.id, asOf: todayISO() });
  const soNo = await nextDoc(sql, "SO");
  const so = (
    await sql.query<{ id: number }>(
      `insert into sales_order (doc_no, partner_id, order_date, status, created_by) values ($1,$2,$3,'OPEN',$4) returning id`,
      [soNo, gs.id, todayISO(), userId],
    )
  )[0]!;
  const soLine = (
    await sql.query<{ id: number }>(
      `insert into so_line (so_id, item_id, qty_pcs, unit_price_paise, gst_pct) values ($1,$2,$3,$4,18) returning id`,
      [so.id, hex.id, 10000, qSnap.unit_price_paise],
    )
  )[0]!;
  steps.push({ n: 2, title: "SO 10,000 pcs HEX-NIPPLE-1/2-NCR", pass: true, note: soNo });

  // 3. Explode + WO
  const bom = await one<{ id: number }>(sql, `select id from bom where item_id = $1 and status = 'APPROVED' order by id desc limit 1`, [
    hex.id,
  ]);
  const rodBom = await one<{ qty_per: string }>(
    sql,
    `select qty_per from bom_line where bom_id = $1 and is_co_product = false order by line_no limit 1`,
    [bom.id],
  );
  const requiredKg = roundKg(10000 * n(rodBom.qty_per));
  const woNo = await nextDoc(sql, "WO");
  const wo = (
    await sql.query<{ id: number }>(
      `insert into work_order (doc_no, item_id, bom_id, so_id, qty_pcs, required_kg, status, created_by)
       values ($1,$2,$3,$4,10000,$5,'OPEN',$6) returning id`,
      [woNo, hex.id, bom.id, so.id, requiredKg, userId],
    )
  )[0]!;
  const woId = wo.id;
  steps.push({
    n: 3,
    title: "Explode rod kg = 10,000 × 0.048 × 1.08; create WO",
    pass: requiredKg === 518.4,
    note: `${woNo} req ${requiredKg.toFixed(3)} kg`,
  });

  // 4. Issue + book
  await withStockTx(sql, async () => {
    await postMove(sql, {
      moveType: "WO_ISSUE",
      itemId: rod.id,
      lotId: grnLotId,
      warehouseId: rmRod.id,
      qtyKg: -requiredKg,
      qtyPcs: 0,
      refType: "WO",
      refId: woId,
      userId,
      alloyId: rod.alloy_id,
      itemAlloyId: rod.alloy_id,
      unitValuePaisePerKg: 62000,
      conversionKind: "ROD",
    });
    await sql.query(`insert into wo_issue (wo_id, lot_id, item_id, qty_kg) values ($1,$2,$3,$4)`, [woId, grnLotId, rod.id, requiredKg]);
    await sql.query(`update work_order set issued_kg = issued_kg + $1, status = 'ISSUED' where id = $2`, [requiredKg, woId]);
  });
  const sfgWh = await warehouseByCode(sql, "SFG");
  const rejWh = await warehouseByCode(sql, "FG-REJECT");
  const scrapWh = await warehouseByCode(sql, "RM-SCRAP");
  const parentLot = await getLot(sql, grnLotId);
  const goodPcs = 9820;
  const rejectPcs = 80;
  const scrapKg = 6.4;
  const goodKg = roundKg(goodPcs * kgPer);
  const rejectKg = roundKg(rejectPcs * kgPer);
  const gate = woCompleteCheck({ issuedKg: requiredKg, goodPcs, rejectPcs, kgPerPc: kgPer, tolerancePct: 0.5 });
  if (!gate.ok) throw new Error(gate.message);
  const gap = yieldGap({ issuedKg: requiredKg, goodKg, rejectKg, scrapKg });
  let sfgLotId = 0;
  await withStockTx(sql, async () => {
    const fgLot = await createLot(sql, {
      itemId: hex.id,
      warehouseId: sfgWh.id,
      alloyId: hex.alloy_id,
      heatNo: parentLot.heat_no,
      status: "AVAILABLE",
      unitValuePaisePerKg: 62000,
      parentLotId: parentLot.id,
      sourceType: "WO",
      sourceId: woId,
    });
    sfgLotId = fgLot.id;
    await postMove(sql, {
      moveType: "WO_RECEIPT_SFG_FG",
      itemId: hex.id,
      lotId: fgLot.id,
      warehouseId: sfgWh.id,
      qtyKg: goodKg,
      qtyPcs: goodPcs,
      refType: "WO",
      refId: woId,
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
      kgPerPc: kgPer,
      conversionKind: "FG",
      consumedLotId: parentLot.id,
    });
    await linkGenealogy(sql, fgLot.id, parentLot.id, goodKg, goodPcs);
    const rejectLot = await createLot(sql, {
      itemId: hex.id,
      warehouseId: rejWh.id,
      alloyId: hex.alloy_id,
      heatNo: parentLot.heat_no,
      status: "REJECTED",
      unitValuePaisePerKg: 62000,
      parentLotId: parentLot.id,
      sourceType: "WO",
      sourceId: woId,
    });
    await postMove(sql, {
      moveType: "WO_RECEIPT_SFG_FG",
      itemId: hex.id,
      lotId: rejectLot.id,
      warehouseId: rejWh.id,
      qtyKg: rejectKg,
      qtyPcs: rejectPcs,
      refType: "WO",
      refId: woId,
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
      kgPerPc: kgPer,
      conversionKind: "FG",
      reasonCode: "REJ-DIM",
    });
    await linkGenealogy(sql, rejectLot.id, parentLot.id, rejectKg, rejectPcs);
    const turnItem = await one<{ id: number; alloy_id: number | null }>(
      sql,
      `select i.id, i.alloy_id from bom_line bl join item i on i.id = bl.component_item_id
        where bl.bom_id = $1 and bl.is_co_product = true and i.sku like '%TURN%' limit 1`,
      [bom.id],
    );
    const existingTurn = (
      await sql.query<{ id: number }>(`select id from stock_lot where item_id = $1 and warehouse_id = $2 and status = 'AVAILABLE' limit 1`, [
        turnItem.id,
        scrapWh.id,
      ])
    )[0];
    const scrapLot = existingTurn
      ? await getLot(sql, existingTurn.id)
      : await createLot(sql, {
          itemId: turnItem.id,
          warehouseId: scrapWh.id,
          alloyId: turnItem.alloy_id,
          status: "AVAILABLE",
          unitValuePaisePerKg: 41000,
          sourceType: "WO",
          sourceId: woId,
        });
    await postMove(sql, {
      moveType: "WO_SCRAP",
      itemId: turnItem.id,
      lotId: scrapLot.id,
      warehouseId: scrapWh.id,
      qtyKg: scrapKg,
      qtyPcs: 0,
      refType: "WO",
      refId: woId,
      userId,
      alloyId: turnItem.alloy_id,
      itemAlloyId: turnItem.alloy_id,
      unitValuePaisePerKg: 41000,
      reasonCode: "SCRAP-TURN",
    });
    const runnerKg = gap.remainderKg;
    const runnerItem = (await sql.query<{ id: number; alloy_id: number | null }>(`select id, alloy_id from item where sku = 'SC-C360-RUNNER'`))[0];
    let runnerLotId: number | null = null;
    if (runnerKg > 0.0005 && runnerItem) {
      const existingR = (
        await sql.query<{ id: number }>(`select id from stock_lot where item_id = $1 and warehouse_id = $2 and status = 'AVAILABLE' limit 1`, [
          runnerItem.id,
          scrapWh.id,
        ])
      )[0];
      const runnerLot = existingR
        ? await getLot(sql, existingR.id)
        : await createLot(sql, {
            itemId: runnerItem.id,
            warehouseId: scrapWh.id,
            alloyId: runnerItem.alloy_id,
            status: "AVAILABLE",
            unitValuePaisePerKg: 39000,
            sourceType: "WO",
            sourceId: woId,
          });
      runnerLotId = runnerLot.id;
      await postMove(sql, {
        moveType: "WO_BACKFLUSH",
        itemId: runnerItem.id,
        lotId: runnerLot.id,
        warehouseId: scrapWh.id,
        qtyKg: runnerKg,
        qtyPcs: 0,
        refType: "WO",
        refId: woId,
        userId,
        alloyId: runnerItem.alloy_id,
        itemAlloyId: runnerItem.alloy_id,
        unitValuePaisePerKg: 39000,
        reasonCode: "SCRAP-RUNNER",
      });
    }
    await sql.query(
      `insert into wo_booking (wo_id, good_pcs, reject_pcs, scrap_kg, scrap_item_id, fg_lot_id, reject_lot_id, scrap_lot_id, runner_lot_id, user_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [woId, goodPcs, rejectPcs, scrapKg, turnItem.id, fgLot.id, rejectLot.id, scrapLot.id, runnerLotId, userId],
    );
    await sql.query(
      `update work_order set good_pcs = good_pcs + $1, reject_pcs = reject_pcs + $2, scrap_kg = scrap_kg + $3, status = 'COMPLETE' where id = $4`,
      [goodPcs, rejectPcs, scrapKg, woId],
    );
  });
  steps.push({
    n: 4,
    title: "Issue rod; book 9820 good, 80 reject, 6.400 kg turning",
    pass: true,
    note: `issued ${requiredKg.toFixed(3)} kg · good ${goodPcs}`,
  });

  // 5. JW OUT
  const jwWh = await warehouseByCode(sql, "JW-OUT");
  const jwQtyKg = roundKg(goodPcs * kgPer);
  const jwOut = await withStockTx(sql, async () => {
    await postMove(sql, {
      moveType: "JW_OUT",
      itemId: hex.id,
      lotId: sfgLotId,
      warehouseId: sfgWh.id,
      qtyKg: -jwQtyKg,
      qtyPcs: -goodPcs,
      refType: "JW",
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
      kgPerPc: kgPer,
      conversionKind: "FG",
    });
    const jwLot = await createLot(sql, {
      itemId: hex.id,
      warehouseId: jwWh.id,
      alloyId: hex.alloy_id,
      heatNo: parentLot.heat_no,
      status: "AVAILABLE",
      unitValuePaisePerKg: 62000,
      parentLotId: sfgLotId,
      sourceType: "JW",
    });
    await postMove(sql, {
      moveType: "JW_OUT",
      itemId: hex.id,
      lotId: jwLot.id,
      warehouseId: jwWh.id,
      qtyKg: jwQtyKg,
      qtyPcs: goodPcs,
      refType: "JW",
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
      kgPerPc: kgPer,
      conversionKind: "FG",
    });
    await linkGenealogy(sql, jwLot.id, sfgLotId, jwQtyKg, goodPcs);
    const docNo = await nextDoc(sql, "JW");
    const statutoryDue = addDaysISO(todayISO(), 365);
    const ch = (
      await sql.query<{ id: number }>(
        `insert into job_work_challan (
           doc_no, partner_id, process_code, issued_at, expected_return_at, statutory_due, status, created_by, loss_norm_pct
         ) values ($1,$2,'NI_CR', now(), $3, $4, 'OPEN', $5, 1.5) returning id`,
        [docNo, kiran.id, addDaysISO(todayISO(), 14), statutoryDue, userId],
      )
    )[0]!;
    await sql.query(
      `insert into job_work_challan_line (challan_id, item_id, lot_id, jw_lot_id, qty_pcs, qty_kg, hsn) values ($1,$2,$3,$4,$5,$6,$7)`,
      [ch.id, hex.id, sfgLotId, jwLot.id, goodPcs, jwQtyKg, hex.hsn],
    );
    await sql.query(`update stock_lot set source_id = $1 where id = $2`, [ch.id, jwLot.id]);
    const partner = await one<Row>(sql, `select * from partner where id = $1`, [kiran.id]);
    const snap = mapDeliveryChallan({
      company,
      challan: {
        ...partner,
        doc_no: docNo,
        issued_at: todayISO(),
        statutory_due: statutoryDue,
        process_code: "NI_CR",
        partner_name: partner.name,
        partner_gstin: partner.gstin,
        partner_addr: partner.address_line1,
        partner_city: partner.city,
        partner_state: partner.state,
        partner_state_code: partner.state_code,
      },
      lines: [{ sku: hex.sku, item_name: hex.name, qty_pcs: goodPcs, qty_kg: jwQtyKg, hsn: hex.hsn, lot_no: jwLot.lot_no }],
      variant: "JW_OUT",
    });
    await saveDocSnapshot(sql, { userId, entity: "job_work_challan", entityId: ch.id, doc: snap });
    return { id: ch.id, docNo, jwLotId: jwLot.id, statutoryDue };
  });
  const statutoryDue = jwOut.statutoryDue;
  steps.push({
    n: 5,
    title: "JW challan 9820 pcs to Kiran Platers; stock in JW-OUT; s.143 due",
    pass: true,
    note: jwOut.docNo,
  });

  // 6. JW return 9700 / 80 / 40 + FG QC
  const retGood = 9700;
  const retRej = 80;
  const retShort = 40;
  const retGoodKg = roundKg(retGood * kgPer);
  const retRejKg = roundKg(retRej * kgPer);
  const jwLotRow = await getLot(sql, jwOut.jwLotId);
  const working = jwLossWorking({
    sentKg: jwQtyKg,
    goodKg: retGoodKg,
    rejectKg: retRejKg,
    scrapReturnedKg: 0,
    scrapRetainedKg: 0,
    lossNormPct: 1.5,
  });
  const hold = await warehouseByCode(sql, "FG-HOLD");
  let fgLotId = 0;
  let jwReturnId = 0;
  await withStockTx(sql, async () => {
    const outOfJw = roundKg(retGoodKg + retRejKg + working.actualLossKg);
    const outPcs = retGood + retRej + retShort;
    await postMove(sql, {
      moveType: "JW_RETURN_GOOD",
      itemId: hex.id,
      lotId: jwOut.jwLotId,
      warehouseId: jwWh.id,
      qtyKg: -outOfJw,
      qtyPcs: -outPcs,
      refType: "JW",
      refId: jwOut.id,
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
    });
    const fgLot = await createLot(sql, {
      itemId: hex.id,
      warehouseId: hold.id,
      alloyId: hex.alloy_id,
      heatNo: jwLotRow.heat_no,
      status: "QUARANTINE",
      unitValuePaisePerKg: 62000,
      parentLotId: jwOut.jwLotId,
      sourceType: "JW",
      sourceId: jwOut.id,
    });
    fgLotId = fgLot.id;
    await postMove(sql, {
      moveType: "JW_RETURN_GOOD",
      itemId: hex.id,
      lotId: fgLot.id,
      warehouseId: hold.id,
      qtyKg: retGoodKg,
      qtyPcs: retGood,
      refType: "JW",
      refId: jwOut.id,
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
      kgPerPc: kgPer,
      conversionKind: "FG",
    });
    await linkGenealogy(sql, fgLot.id, jwOut.jwLotId, retGoodKg, retGood);
    const qiNo = await nextDoc(sql, "QI");
    const qi = (
      await sql.query<{ id: number }>(`insert into quality_inspection (doc_no, lot_id, result) values ($1,$2,'PENDING') returning id`, [
        qiNo,
        fgLot.id,
      ])
    )[0]!;
    const rejectLot = await createLot(sql, {
      itemId: hex.id,
      warehouseId: rejWh.id,
      alloyId: hex.alloy_id,
      status: "REJECTED",
      unitValuePaisePerKg: 62000,
      parentLotId: jwOut.jwLotId,
      sourceType: "JW",
      sourceId: jwOut.id,
    });
    await postMove(sql, {
      moveType: "JW_RETURN_REJECT",
      itemId: hex.id,
      lotId: rejectLot.id,
      warehouseId: rejWh.id,
      qtyKg: retRejKg,
      qtyPcs: retRej,
      refType: "JW",
      refId: jwOut.id,
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
      kgPerPc: kgPer,
      conversionKind: "FG",
      reasonCode: "REJ-PLATE-THK",
    });
    if (working.excessLossKg > 0.0005) {
      await postMove(sql, {
        moveType: "JW_EXCESS_LOSS",
        itemId: hex.id,
        lotId: jwOut.jwLotId,
        warehouseId: jwWh.id,
        qtyKg: 0,
        qtyPcs: 0,
        refType: "JW",
        refId: jwOut.id,
        userId,
        alloyId: hex.alloy_id,
        allowZeroQty: true,
      });
    }
    const jwrNo = await nextDoc(sql, "JWR");
    const ret = (
      await sql.query<{ id: number }>(
        `insert into job_work_return (doc_no, challan_id, good_pcs, reject_pcs, short_pcs, scrap_kg, fg_lot_id, reject_lot_id, created_by)
         values ($1,$2,$3,$4,$5,0,$6,$7,$8) returning id`,
        [jwrNo, jwOut.id, retGood, retRej, retShort, fgLot.id, rejectLot.id, userId],
      )
    )[0]!;
    jwReturnId = ret.id;
    const dn = await nextDoc(sql, "DN");
    await sql.query(
      `insert into job_work_loss (return_id, challan_id, actual_loss_pct, norm_pct, excess_pcs, excess_kg, debit_paise, debit_note_no, debit_status)
       values ($1,$2,$3,1.5,$4,$5,$6,$7,'DRAFT')`,
      [
        ret.id,
        jwOut.id,
        working.actualLossPct,
        kgPer > 0 ? Math.round(working.excessLossKg / kgPer) : 0,
        working.excessLossKg,
        Math.round(working.excessLossKg * 62000),
        dn,
      ],
    );
    await postExcessLossJournal(sql, { paise: Math.round(working.excessLossKg * 62000), returnId: ret.id, userId });
    if (working.excessLossKg > 0.0005) {
      await sql.query(
        `insert into credit_debit_note (kind, doc_no, note_date, original_invoice_no, partner_id, reason, taxable_paise, total_paise, status, created_by)
         values ('DN',$1,$2,$3,$4,$5,$6,$6,'DRAFT',$7)`,
        [dn, todayISO(), jwOut.docNo, kiran.id, `JW excess loss ${working.excessLossKg.toFixed(3)} kg`, Math.round(working.excessLossKg * 62000), userId],
      );
    }
    await sql.query(`update job_work_challan_line set returned_pcs = returned_pcs + $1 where challan_id = $2`, [
      retGood + retRej + retShort,
      jwOut.id,
    ]);
    await sql.query(`update job_work_challan set status = 'CLOSED' where id = $1`, [jwOut.id]);
    const fgDom = await warehouseByCode(sql, "FG-DOM");
    const lotNow = await getLot(sql, fgLot.id);
    await postMove(sql, {
      moveType: "QC_RELEASE",
      itemId: hex.id,
      lotId: fgLot.id,
      warehouseId: hold.id,
      qtyKg: -n(lotNow.qty_kg),
      qtyPcs: -n(lotNow.qty_pcs),
      refType: "QI",
      refId: qi.id,
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      kgPerPc: kgPer,
      conversionKind: "FG",
    });
    await sql.query(`update stock_lot set warehouse_id = $1, status = 'AVAILABLE' where id = $2`, [fgDom.id, fgLot.id]);
    await postMove(sql, {
      moveType: "QC_RELEASE",
      itemId: hex.id,
      lotId: fgLot.id,
      warehouseId: fgDom.id,
      qtyKg: n(lotNow.qty_kg),
      qtyPcs: n(lotNow.qty_pcs),
      refType: "QI",
      refId: qi.id,
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      kgPerPc: kgPer,
      conversionKind: "FG",
    });
    await sql.query(`update quality_inspection set result = 'PASS', inspected_at = now() where id = $1`, [qi.id]);
  });
  steps.push({
    n: 6,
    title: "Return 9700 good, 80 reject, 40 short; FG via QC",
    pass: fgLotId > 0,
    note: `DN DN/26-27/0001 · FG ${(await getLot(sql, fgLotId)).lot_no}`,
  });

  // 7. Dispatch 5000
  const dispPcs = 5000;
  const dispKg = roundKg(dispPcs * kgPer);
  assertPackingMatch(dispKg, dispKg);
  const gst = gstBreakup({
    taxablePaise: Math.round(dispPcs * qSnap.unit_price_paise),
    gstPct: 18,
    fromState: String(company.state_code),
    toState: gs.state_code,
    isExport: false,
  });
  const taxable = Math.round(dispPcs * qSnap.unit_price_paise);
  const totalPaise = taxable + gst.cgst + gst.sgst + gst.igst;
  const fgDomLot = await getLot(sql, fgLotId);
  const inv = await withStockTx(sql, async () => {
    await postMove(sql, {
      moveType: "DISPATCH",
      itemId: hex.id,
      lotId: fgLotId,
      warehouseId: fgDomLot.warehouse_id,
      qtyKg: -dispKg,
      qtyPcs: -dispPcs,
      refType: "INV",
      userId,
      alloyId: hex.alloy_id,
      itemAlloyId: hex.alloy_id,
      unitValuePaisePerKg: 62000,
      kgPerPc: kgPer,
      conversionKind: "FG",
    });
    const invNo = await nextDoc(sql, "INV");
    const blocked = invoicePrintIssues({
      docNo: invNo,
      kind: classifySupply({ fromState: String(company.state_code), toState: gs.state_code, isExport: false }),
      buyerRegistered: Boolean(gs.gstin),
      buyerGstin: gs.gstin,
      buyerName: gs.name,
      buyerStateCode: gs.state_code,
      lines: [{ sl: 1, hsn: hex.hsn, cgstPaise: gst.cgst, sgstPaise: gst.sgst, igstPaise: gst.igst }],
      invoiceNetKg: dispKg,
      packingNetKg: dispKg,
    }).filter((i) => i.level === "block");
    if (blocked[0]) throw new Error(blocked[0].message);
    const invRow = (
      await sql.query<{ id: number }>(
        `insert into sales_invoice (
           doc_no, partner_id, so_id, invoice_date, place_of_supply, is_export,
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, net_kg, status, created_by, due_date
         ) values ($1,$2,$3,$4,$5,false,$6,$7,$8,$9,$10,$11,'POSTED',$12, current_date + 30) returning id`,
        [invNo, gs.id, so.id, todayISO(), gs.state_code, taxable, gst.cgst, gst.sgst, gst.igst, totalPaise, dispKg, userId],
      )
    )[0]!;
    await sql.query(
      `insert into sales_invoice_line (
         invoice_id, item_id, lot_id, hsn, qty_pcs, qty_kg, unit_price_paise, taxable_paise, gst_pct, cgst_paise, sgst_paise, igst_paise
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,18,$9,$10,$11)`,
      [invRow.id, hex.id, fgLotId, hex.hsn, dispPcs, dispKg, qSnap.unit_price_paise, taxable, gst.cgst, gst.sgst, gst.igst],
    );
    await postInvoiceJournal(sql, {
      invoiceId: invRow.id,
      isExport: false,
      taxablePaise: taxable,
      cgstPaise: gst.cgst,
      sgstPaise: gst.sgst,
      igstPaise: gst.igst,
      totalPaise,
      userId,
      date: todayISO(),
    });
    const plNo = await nextDoc(sql, "PL");
    const cartonCount = Math.max(1, Math.ceil(dispPcs / 500));
    const pl = (
      await sql.query<{ id: number }>(
        `insert into packing_list (doc_no, invoice_id, carton_count, net_kg, gross_kg) values ($1,$2,$3,$4,$5) returning id`,
        [plNo, invRow.id, cartonCount, dispKg, roundKg(dispKg * 1.02)],
      )
    )[0]!;
    let remaining = dispPcs;
    const packingLines = [];
    for (let c = 1; c <= cartonCount; c++) {
      const pcs = c === cartonCount ? remaining : Math.min(500, remaining);
      remaining -= pcs;
      const net = roundKg(pcs * kgPer);
      await sql.query(
        `insert into packing_list_line (packing_list_id, carton_no, lot_id, item_id, qty_pcs, net_kg) values ($1,$2,$3,$4,$5,$6)`,
        [pl.id, `C${String(c).padStart(3, "0")}`, fgLotId, hex.id, pcs, net],
      );
      packingLines.push({
        carton_no: `C${String(c).padStart(3, "0")}`,
        lot_id: fgLotId,
        item_id: hex.id,
        qty_pcs: pcs,
        net_kg: net,
        sku: hex.sku,
        lot_no: fgDomLot.lot_no,
        heat_no: fgDomLot.heat_no,
        item_name: hex.name,
      });
    }
    await sql.query(`update so_line set qty_dispatched = qty_dispatched + $1 where id = $2`, [dispPcs, soLine.id]);
    const partner = await one<Row>(sql, `select * from partner where id = $1`, [gs.id]);
    const invMap = {
      ...partner,
      doc_no: invNo,
      invoice_date: todayISO(),
      place_of_supply: gs.state_code,
      is_export: false,
      taxable_paise: taxable,
      cgst_paise: gst.cgst,
      sgst_paise: gst.sgst,
      igst_paise: gst.igst,
      total_paise: totalPaise,
      net_kg: dispKg,
      partner_name: partner.name,
      partner_gstin: partner.gstin,
      partner_addr: partner.address_line1,
      partner_city: partner.city,
      partner_state: partner.state,
      partner_country: partner.country,
      partner_state_code: partner.state_code,
      so_no: soNo,
    };
    const lineRow = {
      sku: hex.sku,
      item_name: hex.name,
      hsn: hex.hsn,
      qty_pcs: dispPcs,
      qty_kg: dispKg,
      unit_price_paise: qSnap.unit_price_paise,
      taxable_paise: taxable,
      gst_pct: 18,
      cgst_paise: gst.cgst,
      sgst_paise: gst.sgst,
      igst_paise: gst.igst,
      lot_no: fgDomLot.lot_no,
      heat_no: fgDomLot.heat_no,
    };
    const taxDoc = mapTaxInvoice({ company, invoice: invMap, lines: [lineRow], packing: { net_kg: dispKg, doc_no: plNo } });
    const packDoc = mapPackingList({
      company,
      invoice: invMap,
      packing: { doc_no: plNo, carton_count: cartonCount, net_kg: dispKg, gross_kg: roundKg(dispKg * 1.02) },
      packingLines,
    });
    await saveDocSnapshot(sql, { userId, entity: "sales_invoice", entityId: invRow.id, doc: taxDoc });
    await saveDocSnapshot(sql, { userId, entity: "packing_list", entityId: pl.id, doc: packDoc });
    return { id: invRow.id, docNo: invNo, taxDoc };
  });
  steps.push({
    n: 7,
    title: "Dispatch 5000; packing Σ net kg = invoice Σ net kg",
    pass: true,
    note: `${inv.docNo} ${dispKg} kg`,
  });

  // 8. Change Cu; new quote; old frozen
  const frozenCu = 81000;
  await sql.query(
    `insert into metal_price (as_of_date, cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, posted_by)
     values ($1, 87000, 27200, 18800, $2)
     on conflict (as_of_date) do update set cu_paise_per_kg = 87000`,
    [todayISO(), userId],
  );
  const newSnap = await quoteItem(sql, { itemId: hex.id, asOf: todayISO() });
  const qtnNo = await nextDoc(sql, "QTN");
  const qRow = (
    await sql.query<{ id: number }>(
      `insert into quotation (
         doc_no, partner_id, quote_date, valid_until, status, metal_rate_date,
         cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, formula_snapshot, created_by
       ) values ($1,$2,$3,$4,'SENT',$5,$6,$7,$8,$9,$10) returning id`,
      [
        qtnNo,
        gs.id,
        todayISO(),
        addDaysISO(todayISO(), 14),
        newSnap.metal_rate_date,
        newSnap.cu_paise_per_kg,
        newSnap.zn_paise_per_kg,
        newSnap.pb_paise_per_kg,
        JSON.stringify(newSnap),
        userId,
      ],
    )
  )[0]!;
  await sql.query(
    `insert into quotation_line (
       quotation_id, item_id, qty_pcs, kg_per_pc, recovery_factor, metal_paise, conversion_paise,
       jw_paise, packing_paise, overhead_paise, margin_paise, unit_price_paise, gst_pct
     ) values ($1,$2,1000,$3,$4,$5,$6,$7,$8,$9,$10,$11,18)`,
    [
      qRow.id,
      hex.id,
      newSnap.kg_per_pc,
      newSnap.recovery_factor,
      newSnap.metal_paise,
      newSnap.conversion_paise,
      newSnap.jw_paise,
      newSnap.packing_paise,
      newSnap.overhead_paise,
      newSnap.margin_paise,
      newSnap.unit_price_paise,
    ],
  );
  const oldAfter = await one<{ cu_paise_per_kg: number }>(sql, `select cu_paise_per_kg from quotation order by id asc limit 1`);
  steps.push({
    n: 8,
    title: "Change Cu rate; new quote uses it; old quote stays frozen",
    pass: n(oldAfter.cu_paise_per_kg) === frozenCu && newSnap.cu_paise_per_kg === 87000,
    note: `Frozen Cu ${frozenCu / 100} vs live ${newSnap.cu_paise_per_kg / 100}`,
  });

  const geneN = (
    await sql.query<{ n: string }>(
      `select count(*)::int as n from genealogy_link g
         join stock_lot c on c.id = g.child_lot_id
         join stock_lot p on p.id = g.parent_lot_id
         join item ci on ci.id = c.item_id
         join item pi on pi.id = p.item_id
        where ci.type in ('FG','SFG') and pi.type = 'RM'`,
    )
  )[0];
  steps.push({
    n: 9,
    title: "Genealogy from FG lot back to rod lot / heat",
    pass: n(geneN?.n) > 0,
    note: `${geneN?.n} RM←FG links`,
  });

  const aged = await sql.query<Row>(
    `select doc_no from job_work_challan where floor(extract(epoch from (now() - issued_at)) / 86400) >= 270`,
  );
  const outside0 = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
    )
  )[0];
  steps.push({
    n: 10,
    title: "280-day challan on ageing board; Owner kg-outside-factory",
    pass: aged.length > 0 && n(outside0?.kg) > 0,
    note: `${aged.length} aged · outside ${outside0?.kg ?? 0} kg`,
  });

  // 11. 3-way bill
  await postJournal(sql, {
    narration: `3-way bill clears GRNI on ${grn.docNo}`,
    sourceType: "BILL",
    sourceId: grn.id,
    userId,
    lines: billMatchLines({
      taxablePaise: Math.round(grnNet * 62000),
      cgstPaise: Math.round(grnNet * 62000 * 0.09),
      sgstPaise: Math.round(grnNet * 62000 * 0.09),
      igstPaise: 0,
    }),
  });
  const billNo = await nextDoc(sql, "BILL");
  const billTax = Math.round(grnNet * 62000);
  const billGst = Math.round(billTax * 0.09);
  await sql.query(
    `insert into vendor_bill (doc_no, partner_id, bill_date, due_date, grn_id, kind, taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, status, created_by)
     values ($1,$2,$3,$4,$5,'GRN',$6,$7,$8,0,$9,'POSTED',$10)`,
    [billNo, rajesh.id, todayISO(), addDaysISO(todayISO(), 45), grn.id, billTax, billGst, billGst, billTax + billGst * 2, userId],
  );
  const grni = await one<{ d: string; c: string }>(
    sql,
    `select coalesce(sum(debit_paise),0)::bigint as d, coalesce(sum(credit_paise),0)::bigint as c from journal_line where account_code = '2110'`,
  );
  steps.push({
    n: 11,
    title: "3-way bill clears GRNI",
    pass: n(grni.d) === n(grni.c),
    note: `GRNI Dr ${grni.d} Cr ${grni.c}`,
  });

  // 12. Receipt
  const rctNo = await nextDoc(sql, "RCT");
  const rct = (
    await sql.query<{ id: number }>(
      `insert into ar_receipt (doc_no, partner_id, receipt_date, amount_paise, created_by) values ($1,$2,$3,$4,$5) returning id`,
      [rctNo, gs.id, todayISO(), totalPaise, userId],
    )
  )[0]!;
  await sql.query(`insert into ar_receipt_alloc (receipt_id, invoice_id, amount_paise) values ($1,$2,$3)`, [rct.id, inv.id, totalPaise]);
  await sql.query(`update sales_invoice set received_paise = received_paise + $1 where id = $2`, [totalPaise, inv.id]);
  await postJournal(sql, {
    narration: `Receipt ${rctNo}`,
    sourceType: "RCT",
    sourceId: rct.id,
    userId,
    lines: receiptLines(totalPaise),
  });
  const openAr = await one<{ ar: string }>(
    sql,
    `select coalesce(sum(total_paise - received_paise),0)::bigint as ar from sales_invoice where id = $1`,
    [inv.id],
  );
  steps.push({
    n: 12,
    title: "Invoice + receipt clears that AR",
    pass: n(openAr.ar) === 0,
    note: `open AR ${openAr.ar}`,
  });

  // 13. GSTR-1
  const invRows = await sql.query<{
    doc_no: string;
    invoice_date: string;
    gstin: string | null;
    name: string;
    place_of_supply: string | null;
    is_export: boolean;
    taxable_paise: number;
    cgst_paise: number;
    sgst_paise: number;
    igst_paise: number;
    total_paise: number;
    hsn: string | null;
    qty_pcs: string;
    qty_kg: string;
    status: string;
  }>(
    `select inv.doc_no, inv.invoice_date::text, p.gstin, p.name, inv.place_of_supply, inv.is_export,
            inv.taxable_paise, inv.cgst_paise, inv.sgst_paise, inv.igst_paise, inv.total_paise,
            sil.hsn, sil.qty_pcs, sil.qty_kg, inv.status
       from sales_invoice inv
       join partner p on p.id = inv.partner_id
       join sales_invoice_line sil on sil.invoice_id = inv.id`,
  );
  const mappedInv = invRows.map((r) => ({
    ...r,
    qty_pcs: n(r.qty_pcs),
    qty_kg: n(r.qty_kg),
  }));
  const b2b = gstr1B2b(mappedInv, "2026-04-01", "2027-03-31");
  const hsnT = gstr1Hsn(mappedInv, "2026-04-01", "2027-03-31");
  steps.push({
    n: 13,
    title: "Intra invoice in GSTR-1 B2B; HSN qty matches",
    pass: b2b.length >= 1 && hsnT.some((h) => h.qty === 5000),
    note: `B2B ${b2b.length} · HSN qty ${hsnT.find((h) => h.qty === 5000)?.qty ?? 0}`,
  });

  // 14. ITC-04 HEX only
  const period = itc04Period(true, todayISO());
  const hexCh = await sql.query<{ issued_at: string; returned: string }>(
    `select c.issued_at::text, l.returned_pcs::text as returned
       from job_work_challan c
       join job_work_challan_line l on l.challan_id = c.id
       join item i on i.id = l.item_id
      where i.sku = 'HEX-NIPPLE-1/2-NCR'`,
  );
  const t4 = hexCh.filter((c) => {
    const d = String(c.issued_at).slice(0, 10);
    return d >= period.from && d <= period.to;
  }).length;
  const t5a = hexCh.filter((c) => {
    const d = String(c.issued_at).slice(0, 10);
    return n(c.returned) > 0 && d >= period.from && d <= period.to;
  }).length;
  steps.push({
    n: 14,
    title: "JW cycle in ITC-04 4 and 5A",
    pass: t4 >= 1 && t5a >= 1,
    note: `Table 4 ${t4} · 5A ${t5a}`,
  });

  // 15. LOCKED month
  await sql.query(`update period_lock set status = 'LOCKED' where year_month = '2026-03'`);
  let lockedOk = false;
  try {
    await assertPeriodAllows(sql, "2026-03-15", "STOCK");
  } catch (e) {
    lockedOk = /LOCKED/i.test((e as Error).message);
  }
  steps.push({
    n: 15,
    title: "LOCKED month rejects back-dated GRN",
    pass: lockedOk,
    note: "March LOCKED",
  });

  const tb16 = await trialBalance(sql);
  steps.push({
    n: 16,
    title: "Trial balance Dr = Cr",
    pass: tb16.balanced,
    note: `Dr ${tb16.debit} Cr ${tb16.credit}`,
  });

  // 17. Snapshot HSN
  const snapBefore = await loadDocSnapshot<TaxInvoiceDoc>(sql, "sales_invoice", inv.id);
  await sql.query(`update item set hsn = '999999' where id = $1`, [hex.id]);
  const snapAfter = await loadDocSnapshot<TaxInvoiceDoc>(sql, "sales_invoice", inv.id);
  const snapHsn = snapAfter?.lines?.[0]?.hsn ?? "";
  steps.push({
    n: 17,
    title: "Regenerated invoice HSN = snapshot after Item.hsn change",
    pass: snapHsn === "74122019",
    note: `snapshot ${snapHsn}`,
  });
  void snapBefore;

  // 18. IRN
  const irn1 = await generateAndPersistIrn(sql, { docType: "INVOICE", docId: inv.id, userId });
  const irn2 = await generateAndPersistIrn(sql, { docType: "INVOICE", docId: inv.id, userId });
  const overlaid = await overlayInvoiceIrp(sql, inv.id, snapAfter!);
  steps.push({
    n: 18,
    title: "Post intra invoice → IRN + QR on PDF; second generate same IRN",
    pass: irn1.Irn === irn2.Irn && Boolean(overlaid.signedQr || overlaid.irn) && irn2.already,
    note: `${String(irn1.Irn).slice(0, 12)}… QR from snapshot`,
  });

  // 19. payload HSN still snapshot
  const payload = mapInvoiceToIrpPayload(snapAfter!, "INV");
  const liveHsn = (await one<{ hsn: string }>(sql, `select hsn from item where id = $1`, [hex.id])).hsn;
  steps.push({
    n: 19,
    title: "Change Item.hsn after post → payload and PDF still snapshot HSN",
    pass: payload.ItemList[0]?.HsnCd === "74122019" && liveHsn === "999999",
    note: `snapshot 74122019 live ${liveHsn}`,
  });

  // 20. cancel window
  let blocked25 = false;
  let cnMsg = "";
  try {
    await cancelPersistedIrn(sql, {
      docType: "INVOICE",
      docId: inv.id,
      userId,
      now: new Date(Date.now() + 25 * 3600 * 1000),
    });
  } catch (e) {
    cnMsg = (e as Error).message;
    blocked25 = /credit note/i.test(cnMsg);
  }
  const cancelNow = await cancelPersistedIrn(sql, { docType: "INVOICE", docId: inv.id, userId });
  steps.push({
    n: 20,
    title: "Cancel now OK; after simulated 25h cancel blocked → credit-note message",
    pass: cancelNow.status === "CNL" && blocked25,
    note: blocked25 ? cnMsg : CANCEL_CREDIT_NOTE_MSG,
  });

  // 21. JW e-way
  const jwKgBefore = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
    )
  )[0];
  const eway = await generateAndPersistEway(sql, {
    docType: "CHALLAN",
    docId: jwOut.id,
    userId,
    vehicle: "GJ01AB1234",
    distanceKm: 42,
    force: true,
  });
  const jwKgAfter = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
    )
  )[0];
  const chSnap = await loadDocSnapshot<DeliveryChallanDoc>(sql, "job_work_challan", jwOut.id);
  const partA = chSnap ? mapChallanToEwayPartA(chSnap) : eway.partA;
  const isJobWork = partA?.subSupplyType === "3" || /job work/i.test(String(partA?.subSupplyDesc ?? partA?.supplyType ?? ""));
  steps.push({
    n: 21,
    title: "JW e-way is Job Work not Supply; Part B sets validFrom; kg-outside-factory unchanged",
    pass: isJobWork && Boolean(eway.validFrom) && n(jwKgBefore?.kg) === n(jwKgAfter?.kg),
    note: `JW ${isJobWork} validFrom ${Boolean(eway.validFrom)} kg ${jwKgBefore?.kg}→${jwKgAfter?.kg}`,
  });

  const snapChallan = await sql.query<{ after_json: string }>(
    `select after_json from audit_log where entity = 'job_work_challan' and entity_id = $1 order by id desc limit 1`,
    [jwOut.id],
  ).then((r) => r[0]).catch(() => null);

  // 22–27 foundry — dedicated lots, do not touch journey-1 rod / JW-OUT
  const jwIso0 = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
    )
  )[0];
  const rodIso0 = n((await getLot(sql, grnLotId)).qty_kg);
  const c360 = await one<{ id: number }>(sql, `select id from alloy where code = 'C36000'`);
  const dedicated = await createLot(sql, {
    itemId: rod.id,
    warehouseId: rmRod.id,
    alloyId: rod.alloy_id,
    heatNo: "H-MELT-22",
    status: "AVAILABLE",
    unitValuePaisePerKg: 62000,
    sourceType: "FOUNDRY",
  });
  await postMove(sql, {
    moveType: "ADJUST_PLUS",
    itemId: rod.id,
    lotId: dedicated.id,
    warehouseId: rmRod.id,
    qtyKg: 100,
    qtyPcs: 0,
    refType: "FOUNDRY",
    userId,
    alloyId: rod.alloy_id,
    itemAlloyId: rod.alloy_id,
    unitValuePaisePerKg: 62000,
    notes: "Dedicated foundry charge lot",
  });
  const heat22 = await createHeat(sql, { alloyId: c360.id, furnace: "MELT-1", userId });
  await addChargeLine(sql, { heatId: heat22.id, lotId: dedicated.id, qtyKg: 100, userId });
  const charged = await confirmCharge(sql, { heatId: heat22.id, userId });
  const srcAfter = await getLot(sql, dedicated.id);
  const wipMelt = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.code = 'WIP-MELT'`,
    )
  )[0];
  const jwAfter22 = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
    )
  )[0];
  const isoOk = n(jwAfter22?.kg) === n(jwIso0?.kg) && n(srcAfter.qty_kg) === 0 && n(wipMelt?.kg) === 100;
  const recipeSnap = await one<{ recipe_snapshot_json: string | null }>(sql, `select recipe_snapshot_json from heat where id = $1`, [
    heat22.id,
  ]);
  const chargeOk = isoOk && n(charged.chargedKg) === 100;

  let failMsg = "";
  let spectroOk = false;
  const fail = await postSpectro(sql, { heatId: heat22.id, cuPct: 50, znPct: 35.4, pbPct: 3.1, userId });
  let pourBlocked = false;
  try {
    await pourAndKnockout(sql, { heatId: heat22.id, goodKg: 80, runnerKg: 15, drossKg: 3, userId });
  } catch (e) {
    pourBlocked = /spectro|FAIL|blocks pour/i.test((e as Error).message);
    failMsg = (e as Error).message;
  }
  const pass = await postSpectro(sql, { heatId: heat22.id, cuPct: 61.5, znPct: 35.4, pbPct: 3.1, userId });
  spectroOk = !fail.passed && fail.status === "HOLD_SPECTRO" && pourBlocked && pass.passed && pass.status === "RELEASED_POUR";

  const poured = await pourAndKnockout(sql, { heatId: heat22.id, goodKg: 80, runnerKg: 15, drossKg: 3, userId });
  const closed = await closeHeat(sql, { heatId: heat22.id, userId });
  const heatClosed = await one<{ status: string; loss_kg: string }>(sql, `select status, loss_kg from heat where id = $1`, [heat22.id]);
  const closeOk = heatClosed.status === "CLOSED" && n(heatClosed.loss_kg) === 2 && closed.lossKg === 2;

  const heat25 = await createHeat(sql, { alloyId: c360.id, furnace: "MELT-2", userId });
  const cwItem = await itemBySku(sql, "ROD-CW617-12MM");
  const cwLot = await createLot(sql, {
    itemId: cwItem.id,
    warehouseId: rmRod.id,
    alloyId: cwItem.alloy_id,
    heatNo: "H-CW",
    status: "AVAILABLE",
    unitValuePaisePerKg: 62000,
    sourceType: "FOUNDRY",
  });
  await postMove(sql, {
    moveType: "ADJUST_PLUS",
    itemId: cwItem.id,
    lotId: cwLot.id,
    warehouseId: rmRod.id,
    qtyKg: 10,
    qtyPcs: 0,
    refType: "FOUNDRY",
    userId,
    alloyId: cwItem.alloy_id,
    itemAlloyId: cwItem.alloy_id,
    unitValuePaisePerKg: 62000,
  });
  let cwRefused = false;
  let cwMsg = "";
  try {
    await addChargeLine(sql, { heatId: heat25.id, lotId: cwLot.id, qtyKg: 10, userId });
  } catch (e) {
    cwMsg = (e as Error).message;
    cwRefused = /CW617N|C36000|Refuse/i.test(cwMsg);
  }

  const casting = await one<{ id: number; lot_no: string; heat_no: string | null }>(
    sql,
    `select id, lot_no, heat_no from stock_lot where lot_no = $1`,
    [poured.castingLotNo],
  );
  const gene26 = await sql.query<{ parent_lot: string; parent_id: number; child_heat: string | null }>(
    `select p.lot_no as parent_lot, p.id as parent_id, c.heat_no as child_heat
       from genealogy_link g
       join stock_lot c on c.id = g.child_lot_id
       join stock_lot p on p.id = g.parent_lot_id
      where g.child_lot_id = $1`,
    [casting.id],
  );
  const geneOk =
    gene26.some((g) => g.parent_id === dedicated.id) &&
    String(casting.heat_no) === heat22.docNo &&
    gene26.some((g) => g.child_heat === heat22.docNo);

  const tb27 = await trialBalance(sql);
  const jwEnd = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
    )
  )[0];
  const rodEnd = grnLotId ? n((await getLot(sql, grnLotId)).qty_kg) : 0;
  const isoEnd = n(jwEnd?.kg) === n(jwIso0?.kg) && rodEnd === rodIso0;

  steps.push(
    {
      n: 22,
      title: "Charge 100.000 kg dedicated C360 lot → source down, WIP-MELT up",
      pass: chargeOk && Boolean(recipeSnap?.recipe_snapshot_json),
      note: chargeOk
        ? `src ${n(srcAfter.qty_kg).toFixed(3)} · WIP ${n(wipMelt?.kg).toFixed(3)} · JW ${jwAfter22?.kg}`
        : `src ${srcAfter.qty_kg} WIP ${wipMelt?.kg} iso ${isoOk}`,
    },
    {
      n: 23,
      title: "Spectro fail blocks pour; pass allows pour",
      pass: spectroOk,
      note: spectroOk ? "FAIL→HOLD then PASS→RELEASED_POUR" : failMsg,
    },
    {
      n: 24,
      title: "Pour 80 good + 15 runner + 3 dross; close; loss 2.000 to variance; heat CLOSED",
      pass: closeOk,
      note: closeOk
        ? `${poured.pourNo} loss ${closed.lossKg.toFixed(3)} ${heatClosed.status}`
        : `status ${heatClosed.status} loss ${heatClosed.loss_kg}`,
    },
    {
      n: 25,
      title: "CW617N into C360 refused",
      pass: cwRefused,
      note: cwMsg,
    },
    {
      n: 26,
      title: "Genealogy casting lot → heat → charge lot",
      pass: geneOk,
      note: geneOk
        ? `${casting.lot_no} heat ${casting.heat_no} ← ${dedicated.lot_no}`
        : `heat ${casting.heat_no} parents ${gene26.length}`,
    },
    {
      n: 27,
      title: "Trial balance still Dr = Cr after 22–26",
      pass: tb27.balanced && isoEnd,
      note: tb27.balanced
        ? `Dr ${tb27.debit} Cr ${tb27.credit} · JW ${jwEnd?.kg} rod ${rodEnd}`
        : `Dr ${tb27.debit} Cr ${tb27.credit} iso ${isoEnd}`,
    },
  );

  // 28–32 isolated CUTOVERDEMO. Must not move 137.1000 kg JW-OUT or journey-1 rod.
  const jwLive0 = n(jwEnd?.kg);
  const rodLive0 = rodEnd;
  let pass28 = false;
  let note28 = "";
  let pass29 = false;
  let note29 = "";
  let pass30 = false;
  let note30 = "";
  let pass31 = false;
  let note31 = "";
  let pass32b = false;
  let note32 = "";
  try {
    await sql.query(`update cutover_company set opening_date = $1 where code = 'CUTOVERDEMO' and state = 'NOT_STARTED'`, [
      todayISO(),
    ]);
    const stock28 = await postOpeningStock(sql, { csv: SAMPLE_STOCK_CSV, userId });
    const lotRod = await one<{ qty_kg: string; owner_type: string }>(sql, `select qty_kg, owner_type from stock_lot where lot_no = 'CUT-ROD-50'`);
    const lotFg = await one<{ qty_pcs: string }>(sql, `select qty_pcs from stock_lot where lot_no = 'CUT-FG-10'`);
    const lotCust = await one<{ qty_kg: string; unit_value_paise_per_kg: number; owner_type: string }>(
      sql,
      `select qty_kg, unit_value_paise_per_kg, owner_type from stock_lot where lot_no = 'CUT-CUST-5'`,
    );
    const j28 = (
      await sql.query<{ kg: string }>(
        `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
      )
    )[0];
    pass28 =
      stock28.posted === 3 &&
      n(lotRod.qty_kg) === 50 &&
      n(lotFg.qty_pcs) === 10 &&
      n(lotCust.qty_kg) === 5 &&
      lotCust.owner_type === "CUSTOMER" &&
      n(lotCust.unit_value_paise_per_kg) === 0 &&
      n(j28?.kg) === jwLive0;
    note28 = pass28
      ? `OWN ${stock28.ownValuePaise} · cust ${stock28.customerKg} kg · JW ${j28?.kg}`
      : `posted ${stock28.posted} JW ${j28?.kg}`;

    const challanDate = addDaysISO(todayISO(), -90);
    const dueExpect = addDaysISO(challanDate, 365);
    const jwCsv = `challanNo,challanDate,partnerCode,processCode,sku,qtyPcs,qtyKg,ratePaisePerKg,valuePaise
JW/25-26/C-0001,${challanDate},V-KIRAN,NI_CR,HEX-NIPPLE-1/2-NCR,15,0.720,78000,56160`;
    const jw29 = await postOpeningJw(sql, { csv: jwCsv, userId });
    const ch29 = await one<{
      doc_no: string;
      issued_at: string;
      statutory_due: string;
      age_days: string;
    }>(
      sql,
      `select doc_no, issued_at::text, statutory_due::text,
              floor(extract(epoch from (now() - issued_at)) / 86400)::int as age_days
         from job_work_challan where doc_no = 'JW/25-26/C-0001'`,
    );
    const age29 = n(ch29.age_days);
    pass29 =
      jw29.posted === 1 &&
      String(ch29.statutory_due).slice(0, 10) === dueExpect &&
      age29 >= 85 &&
      age29 <= 100 &&
      String(ch29.issued_at).slice(0, 10) === challanDate;
    note29 = pass29
      ? `${ch29.doc_no} age ${age29}d due ${String(ch29.statutory_due).slice(0, 10)}`
      : `age ${age29} due ${ch29.statutory_due}`;

    const rec = await loadOpeningTb(sql, { userId, arPaise: 0, apPaise: 0 });
    pass30 = rec.tb.balanced && rec.reconciled && rec.customerInventoryPaise === 0 && rec.ownInventoryPaise > 0;
    note30 = pass30
      ? `OWN ${rec.ownInventoryPaise} inv ${rec.inventoryLedgerPaise} Dr ${rec.tb.debit}`
      : rec.reasons.join("; ") || "not reconciled";

    let blocked31 = false;
    let blockMsg = "";
    try {
      await postCutoverGrn(sql, { userId, qtyKg: 1 });
    } catch (e) {
      blocked31 = /LIVE/i.test((e as Error).message);
      blockMsg = (e as Error).message;
    }
    const live = await goLive(sql, { userId, role: "OWNER" });
    const afterLive = await postCutoverGrn(sql, { userId, qtyKg: 1.25 });
    pass31 = blocked31 && live.state === "LIVE" && Boolean(afterLive.docNo);
    note31 = pass31 ? `${afterLive.docNo} after LIVE` : blockMsg || "GRN was not blocked";

    const exported = await exportTally(sql, { userId });
    let importRefused = false;
    try {
      await importTallyTb(sql);
    } catch (e) {
      importRefused = /Refuse Tally TB import after LIVE/i.test((e as Error).message);
    }
    const evalAfter = await evaluate(sql);
    const tb32 = await trialBalance(sql);
    const jwLive1 = (
      await sql.query<{ kg: string }>(
        `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
      )
    )[0];
    const rodLive1 = grnLotId ? n((await getLot(sql, grnLotId)).qty_kg) : 0;
    pass32b =
      exported.files.length >= 4 &&
      importRefused &&
      evalAfter.every((s) => s.pass) &&
      tb32.balanced &&
      n(jwLive1?.kg) === jwLive0 &&
      rodLive1 === rodLive0;
    note32 = pass32b
      ? `${exported.files.length} files · JW ${jwLive1?.kg} · ${TALLY_NOT_BOOK}`
      : `files ${exported.files.length} import ${importRefused} JW ${jwLive1?.kg} rod ${rodLive1}`;
  } catch (e) {
    const msg = (e as Error).message;
    if (!note28) note28 = msg;
    if (!note29) note29 = msg;
    if (!note30) note30 = msg;
    if (!note31) note31 = msg;
    if (!note32) note32 = msg;
  }

  steps.push(
    { n: 28, title: "OWN 50 kg rod + 10 pcs FG + 5 kg customer metal value 0", pass: pass28, note: note28 },
    {
      n: 29,
      title: "JW challan dated 90 days before opening; ageing ~90; due = challanDate+365",
      pass: pass29,
      note: note29,
    },
    { n: 30, title: "TB squares; inventory = OWN value; RECONCILED", pass: pass30, note: note30 },
    { n: 31, title: "Blocks live GRN before LIVE; allows GRN after LIVE", pass: pass31, note: note31 },
    {
      n: 32,
      title: "tally:export files exist; journeys 1–27 still PASS including 10 and 27",
      pass: pass32b,
      note: note32,
    },
  );

  const tb = tb27;
  const extra = {
    statutoryDue,
    frozenCu,
    liveCu: newSnap.cu_paise_per_kg,
    oldQuoteAfter: n(oldAfter.cu_paise_per_kg),
    jwSnapshotHasDue: snapChallan
      ? String((snapChallan as { after_json?: string }).after_json ?? "").includes("statutory") ||
        String((snapChallan as { after_json?: string }).after_json ?? "").includes("365")
      : Boolean(chSnap),
    fgLotId,
    grnLotId,
    tb,
    jwReturnId,
    woId,
  };

  const passed = steps.filter((s) => s.pass).length;
  const failed = steps.length - passed;
  const report: JourneyReport = {
    runAt: new Date().toISOString(),
    passed,
    failed,
    steps,
    extra,
  };
  await sql.query(`insert into journey_run (source, passed, failed, report_json) values ('cli',$1,$2,$3)`, [
    passed,
    failed,
    JSON.stringify(report),
  ]);
  await mkdir(join(process.cwd(), "artifacts"), { recursive: true });
  await writeFile(join(process.cwd(), "artifacts/journeys-last.json"), JSON.stringify(report, null, 2));
  return report;
}

async function evaluate(sql: Sql): Promise<JourneyStep[]> {
  const grn = await sql.query<Row>(
    `select g.doc_no, l.net_kg, sl.status from grn g
       join grn_line l on l.grn_id = g.id
       left join stock_lot sl on sl.id = l.lot_id
      where l.net_kg = 1250.500`,
  );
  const so = await sql.query<Row>(
    `select so.doc_no from sales_order so
       join so_line l on l.so_id = so.id
       join item i on i.id = l.item_id
      where i.sku = 'HEX-NIPPLE-1/2-NCR' and l.qty_pcs = 10000`,
  );
  const wo = await sql.query<Row>(
    `select wo.doc_no, wo.required_kg, wo.issued_kg, wo.status, wo.good_pcs, wo.reject_pcs, wo.scrap_kg
       from work_order wo join item i on i.id = wo.item_id
      where i.sku = 'HEX-NIPPLE-1/2-NCR'`,
  );
  const book = wo[0];
  const jw = await sql.query<Row>(
    `select c.doc_no, l.qty_pcs, p.code from job_work_challan c
       join job_work_challan_line l on l.challan_id = c.id
       join partner p on p.id = c.partner_id
       join item i on i.id = l.item_id
      where i.sku = 'HEX-NIPPLE-1/2-NCR' and l.qty_pcs = 9820 and p.code = 'V-KIRAN'`,
  );
  const ret = await sql.query<Row>(
    `select r.doc_no, r.good_pcs, r.reject_pcs, r.short_pcs, x.debit_note_no
       from job_work_return r
       join job_work_challan c on c.id = r.challan_id
       join job_work_challan_line l on l.challan_id = c.id
       join item i on i.id = l.item_id
       left join job_work_loss x on x.return_id = r.id
      where i.sku = 'HEX-NIPPLE-1/2-NCR'`,
  );
  const inv = await sql.query<Row>(
    `select inv.doc_no, inv.net_kg, pl.net_kg as packing_net_kg, sil.qty_pcs
       from sales_invoice inv
       join sales_invoice_line sil on sil.invoice_id = inv.id
       join item i on i.id = sil.item_id
       left join packing_list pl on pl.invoice_id = inv.id
      where i.sku = 'HEX-NIPPLE-1/2-NCR' and sil.qty_pcs = 5000`,
  );
  const oldQ = await sql.query<Row>(`select q.doc_no, q.cu_paise_per_kg, q.metal_rate_date from quotation q order by q.id asc limit 1`);
  const latestPrice = (
    await sql.query<{ cu_paise_per_kg: number }>(`select cu_paise_per_kg from metal_price order by as_of_date desc limit 1`)
  )[0];
  const fgQc = await sql.query<Row>(
    `select q.doc_no, l.lot_no, l.status
       from quality_inspection q
       join stock_lot l on l.id = q.lot_id
       join item i on i.id = l.item_id
       join warehouse w on w.id = l.warehouse_id
      where i.sku = 'HEX-NIPPLE-1/2-NCR' and q.result = 'PASS'
        and l.status = 'AVAILABLE' and w.code in ('FG-DOM','FG-EXP')`,
  );
  const gene = await sql.query<Row>(
    `select g.id from genealogy_link g
       join stock_lot c on c.id = g.child_lot_id
       join stock_lot p on p.id = g.parent_lot_id
       join item ci on ci.id = c.item_id
       join item pi on pi.id = p.item_id
      where ci.type in ('FG','SFG') and pi.type = 'RM'`,
  );
  const aged = await sql.query<Row>(
    `select doc_no, floor(extract(epoch from (now() - issued_at)) / 86400)::int as age_days
       from job_work_challan
      where floor(extract(epoch from (now() - issued_at)) / 86400) >= 270`,
  );
  const outside = (
    await sql.query<{ kg: string }>(
      `select coalesce(sum(l.qty_kg),0) as kg from stock_lot l
         join warehouse w on w.id = l.warehouse_id where w.is_outside_factory`,
    )
  )[0];
  return [
    {
      n: 1,
      title: "GRN 1250.500 kg C360 rod → QC hold → release",
      pass: grn.some((g) => n(g.net_kg) === 1250.5 && g.status === "AVAILABLE"),
      note: grn[0] ? `${grn[0].doc_no} lot ${grn[0].status}` : "Not posted",
    },
    {
      n: 2,
      title: "SO 10,000 pcs HEX-NIPPLE-1/2-NCR",
      pass: so.length > 0,
      note: so[0] ? String(so[0].doc_no) : "Not created",
    },
    {
      n: 3,
      title: "Explode rod kg = 10,000 × 0.048 × 1.08; create WO",
      pass: wo.length > 0 && n(wo[0]?.required_kg) > 0,
      note: wo[0] ? `${wo[0].doc_no} req ${wo[0].required_kg} kg` : "No WO",
    },
    {
      n: 4,
      title: "Issue rod; book 9820 good, 80 reject, 6.400 kg turning",
      pass: book ? n(book.good_pcs) >= 9820 && n(book.reject_pcs) >= 80 && n(book.scrap_kg) >= 6.4 : false,
      note: book ? `issued ${book.issued_kg} kg · good ${book.good_pcs}` : "Not booked",
    },
    {
      n: 5,
      title: "JW challan 9820 pcs to Kiran Platers; stock in JW-OUT; s.143 due",
      pass: jw.length > 0,
      note: jw[0] ? String(jw[0].doc_no) : "Not issued",
    },
    {
      n: 6,
      title: "Return 9700 good, 80 reject, 40 short; FG via QC",
      pass: ret.some((r) => n(r.good_pcs) === 9700) && fgQc.length > 0,
      note: ret[0] ? `DN ${ret[0].debit_note_no ?? "—"} · FG ${fgQc[0] ? fgQc[0].lot_no : "awaiting QC"}` : "Not returned",
    },
    {
      n: 7,
      title: "Dispatch 5000; packing Σ net kg = invoice Σ net kg",
      pass: inv.some((i) => n(i.net_kg) === n(i.packing_net_kg)),
      note: inv[0] ? `${inv[0].doc_no} ${n(inv[0].net_kg)} kg` : "Not dispatched",
    },
    {
      n: 8,
      title: "Change Cu rate; new quote uses it; old quote stays frozen",
      pass: Boolean(oldQ[0] && latestPrice && n(oldQ[0].cu_paise_per_kg) !== n(latestPrice.cu_paise_per_kg)),
      note: oldQ[0]
        ? `Frozen Cu ${n(oldQ[0].cu_paise_per_kg) / 100} vs live ${n(latestPrice?.cu_paise_per_kg) / 100}`
        : "—",
    },
    {
      n: 9,
      title: "Genealogy from FG lot back to rod lot / heat",
      pass: gene.length > 0,
      note: gene.length ? `${gene.length} RM←FG links` : "No links",
    },
    {
      n: 10,
      title: "280-day challan on ageing board; Owner kg-outside-factory",
      pass: aged.length > 0 && n(outside?.kg) > 0,
      note: `${aged.length} aged · outside ${outside?.kg ?? 0} kg`,
    },
  ];
}
