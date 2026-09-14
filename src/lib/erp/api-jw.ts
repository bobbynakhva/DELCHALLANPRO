import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, audit, erpSql, nextDoc, requireStaff, setting } from "./core.server";
import { n, roundKg, todayISO } from "./format";
import { uid, type Row } from "./row";
import {
  createLot,
  getLot,
  linkGenealogy,
  postMove,
  saveDocSnapshot,
  warehouseByCode,
  withStockTx,
} from "./stock.server";
import { assertJwVendorAllowed, jwLossWorking } from "@/modules/inventory/rules";
import { mapDeliveryChallan } from "@/modules/compliance/documents/map";
import { postExcessLossJournal } from "./api-finance";

export const issueJobWork = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      partnerId: z.coerce.number(),
      processCode: z.string().min(1),
      lotId: z.coerce.number(),
      qtyPcs: z.coerce.number().positive(),
      vehicleNo: z.string().optional(),
      expectedDays: z.coerce.number().min(1).default(14),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "jw");
    const sql = await erpSql();
    const blockDays = n(await setting(sql, "jw_block_days", "330"));
    const settingOn = (await setting(sql, "jw_block_aged", "1")) !== "0";
    const aged = await sql.query<{ doc_no: string; age: number }>(
      `select doc_no, floor(extract(epoch from (now() - issued_at)) / 86400)::int as age
         from job_work_challan
        where partner_id = $1 and status <> 'CLOSED'
          and issued_at < now() - ($2::text || ' days')::interval`,
      [data.partnerId, blockDays],
    );
    if (aged[0]) {
      assertJwVendorAllowed({
        ageDays: aged[0].age,
        blockDays,
        settingOn,
        docNo: aged[0].doc_no,
      });
    }
    const lot = await getLot(sql, data.lotId);
    if (lot.status !== "AVAILABLE") throw new Error("Source lot must be AVAILABLE");
    const item = (
      await sql.query<{
        id: number;
        kg_per_pc: string;
        hsn: string | null;
        alloy_id: number | null;
        family: string | null;
        sku: string;
        name: string;
      }>(`select * from item where id = $1`, [lot.item_id])
    )[0]!;
    const kgPer = n(item.kg_per_pc) || n(lot.qty_kg) / Math.max(1, n(lot.qty_pcs));
    const qtyKg = roundKg(data.qtyPcs * kgPer);
    if (n(lot.qty_pcs) + 0.0005 < data.qtyPcs) throw new Error("Not enough pcs on the source lot");
    const rate = (
      await sql.query<{ loss_norm_pct: string; rate_paise_per_pc: number }>(
        `select loss_norm_pct, rate_paise_per_pc from partner_process_rate
          where partner_id = $1 and process_code = $2
            and (item_family = $3 or item_family = '')
          order by case when item_family = $3 then 0 else 1 end
          limit 1`,
        [data.partnerId, data.processCode, item.family],
      )
    )[0];
    const lossNorm = n(rate?.loss_norm_pct ?? 0);
    const jwWh = await warehouseByCode(sql, "JW-OUT");
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const partner = (await sql.query<Row>(`select * from partner where id = $1`, [data.partnerId]))[0];
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
        itemAlloyId: lot.alloy_id,
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
        sourceType: "JW",
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
        itemAlloyId: lot.alloy_id,
      });
      await linkGenealogy(sql, jwLot.id, lot.id, qtyKg, data.qtyPcs);
      const docNo = await nextDoc(sql, "JW");
      const issued = new Date();
      const statutory = new Date(issued.getTime() + 365 * 86400000);
      const expected = new Date(issued.getTime() + data.expectedDays * 86400000);
      const ch = (
        await sql.query<{ id: number }>(
          `insert into job_work_challan (
             doc_no, partner_id, process_code, issued_at, expected_return_at, statutory_due,
             status, vehicle_no, created_by, loss_norm_pct
           ) values ($1,$2,$3,$4,$5,$6,'OPEN',$7,$8,$9) returning id`,
          [
            docNo,
            data.partnerId,
            data.processCode,
            issued,
            expected.toISOString().slice(0, 10),
            statutory.toISOString().slice(0, 10),
            data.vehicleNo ?? null,
            staff.user_id,
            lossNorm,
          ],
        )
      )[0]!;
      await sql.query<Row>(
        `insert into job_work_challan_line (challan_id, item_id, lot_id, jw_lot_id, qty_pcs, qty_kg, hsn)
         values ($1,$2,$3,$4,$5,$6,$7)`,
        [ch.id, item.id, lot.id, jwLot.id, data.qtyPcs, qtyKg, item.hsn],
      );
      await sql.query<Row>(`update stock_lot set source_id = $1 where id = $2`, [ch.id, jwLot.id]);
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
          vehicle_no: data.vehicleNo ?? "",
        },
        lines: [{ sku: item.sku, item_name: item.name, qty_pcs: data.qtyPcs, qty_kg: qtyKg, hsn: item.hsn, lot_no: jwLot.lot_no }],
        variant: "JW_OUT",
      });
      await saveDocSnapshot(sql, { userId: staff.user_id, entity: "job_work_challan", entityId: ch.id, doc: snap });
      await audit(sql, {
        userId: staff.user_id,
        action: "JW_OUT",
        entity: "job_work_challan",
        entityId: ch.id,
        after: { docNo, qtyPcs: data.qtyPcs, qtyKg, statutoryDue: statutory.toISOString().slice(0, 10) },
      });
      return { docNo, id: ch.id, jwLotNo: jwLot.lot_no, qtyKg, statutoryDue: statutory.toISOString().slice(0, 10) };
    });
  });

export const returnJobWork = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      challanId: z.coerce.number(),
      goodPcs: z.coerce.number().min(0),
      rejectPcs: z.coerce.number().min(0),
      shortPcs: z.coerce.number().min(0),
      scrapReturnedKg: z.coerce.number().min(0).default(0),
      scrapRetainedKg: z.coerce.number().min(0).default(0),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "jw");
    const sql = await erpSql();
    const ch = (
      await sql.query<{
        id: number;
        partner_id: number;
        process_code: string;
        loss_norm_pct: string;
        status: string;
        doc_no: string;
        issued_at: string;
      }>(`select * from job_work_challan where id = $1`, [data.challanId])
    )[0];
    if (!ch) throw new Error("Challan not found");
    const line = (
      await sql.query<{
        id: number;
        item_id: number;
        jw_lot_id: number | null;
        qty_pcs: string;
        qty_kg: string;
        returned_pcs: string;
        hsn: string | null;
      }>(`select * from job_work_challan_line where challan_id = $1 limit 1`, [ch.id])
    )[0];
    if (!line || !line.jw_lot_id) throw new Error("Challan line missing JW lot");
    const sentPcs = n(line.qty_pcs);
    const already = n(line.returned_pcs);
    const taking = data.goodPcs + data.rejectPcs + data.shortPcs;
    if (already + taking - sentPcs > 0.0005) throw new Error("Return exceeds issued pcs");
    const item = (
      await sql.query<{
        id: number;
        kg_per_pc: string;
        alloy_id: number | null;
        inspection_required: boolean;
        family: string | null;
        sku: string;
        name: string;
        hsn: string | null;
      }>(`select * from item where id = $1`, [line.item_id])
    )[0]!;
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
      lossNormPct: n(ch.loss_norm_pct),
    });
    const jwLot = await getLot(sql, line.jw_lot_id);
    const hold = await warehouseByCode(sql, "FG-HOLD");
    const rejWh = await warehouseByCode(sql, "FG-REJECT");
    const scrapWh = await warehouseByCode(sql, "RM-SCRAP");
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const partner = (await sql.query<Row>(`select * from partner where id = $1`, [ch.partner_id]))[0]!;
    const turnItem = (
      await sql.query<{ id: number; alloy_id: number | null }>(
        `select id, alloy_id from item where sku = 'SC-C360-TURN'`,
      )
    )[0];

    return withStockTx(sql, async () => {
      let fgLot = null;
      let rejectLot = null;
      let scrapLot = null;

      const outOfJw = roundKg(goodKg + rejectKg + scrapReturnedKg + working.actualLossKg + scrapRetainedKg);
      const outPcs = data.goodPcs + data.rejectPcs + data.shortPcs;
      if (outOfJw > 0.0005 || outPcs > 0) {
        await postMove(sql, {
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
          notes: `Return working sent ${working.sentKg} accounted ${working.accountedKg} loss ${working.actualLossKg} excess ${working.excessLossKg}`,
        });
      }

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
          sourceId: ch.id,
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
          itemAlloyId: item.alloy_id,
        });
        await linkGenealogy(sql, fgLot.id, jwLot.id, goodKg, data.goodPcs);
        const qiNo = await nextDoc(sql, "QI");
        await sql.query<Row>(
          `insert into quality_inspection (doc_no, lot_id, result) values ($1,$2,'PENDING')`,
          [qiNo, fgLot.id],
        );
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
          sourceId: ch.id,
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
          reasonCode: "REJ-PLATE-THK",
        });
      }
      if (scrapReturnedKg > 0.0005 && turnItem) {
        const existing = (
          await sql.query<{ id: number }>(
            `select id from stock_lot where item_id = $1 and warehouse_id = $2 and status = 'AVAILABLE' limit 1`,
            [turnItem.id, scrapWh.id],
          )
        )[0];
        scrapLot = existing
          ? await getLot(sql, existing.id)
          : await createLot(sql, {
              itemId: turnItem.id,
              warehouseId: scrapWh.id,
              alloyId: turnItem.alloy_id,
              qtyKg: 0,
              qtyPcs: 0,
              status: "AVAILABLE",
              unitValuePaisePerKg: 41000,
              sourceType: "JW",
              sourceId: ch.id,
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
          unitValuePaisePerKg: 41000,
          reasonCode: "SCRAP-PLATE-STRIP",
        });
      }
      if (working.excessLossKg > 0.0005) {
        await postMove(sql, {
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
          notes: `Excess ${working.excessLossKg} kg vs norm ${working.normKg} kg`,
        });
      }

      const scrapRate = 41000;
      const metal = jwLot.unit_value_paise_per_kg;
      const rate = (
        await sql.query<{ rate_paise_per_pc: number }>(
          `select rate_paise_per_pc from partner_process_rate
            where partner_id = $1 and process_code = $2
            order by id limit 1`,
          [ch.partner_id, ch.process_code],
        )
      )[0];
      const excessPcs = kgPer > 0 ? Math.round(working.excessLossKg / kgPer) : 0;
      const retainedDebit = Math.round(scrapRetainedKg * scrapRate);
      const excessDebit = Math.round(working.excessLossKg * metal + excessPcs * (rate?.rate_paise_per_pc ?? 0));
      const debitPaise = retainedDebit + excessDebit;

      const docNo = await nextDoc(sql, "JWR");
      const ret = (
        await sql.query<{ id: number }>(
          `insert into job_work_return (doc_no, challan_id, good_pcs, reject_pcs, short_pcs, scrap_kg, fg_lot_id, reject_lot_id, created_by)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id`,
          [
            docNo,
            ch.id,
            data.goodPcs,
            data.rejectPcs,
            data.shortPcs,
            roundKg(scrapReturnedKg + scrapRetainedKg),
            fgLot?.id ?? null,
            rejectLot?.id ?? null,
            staff.user_id,
          ],
        )
      )[0]!;
      const dn = await nextDoc(sql, "DN");
      await sql.query<Row>(
        `insert into job_work_loss (return_id, challan_id, actual_loss_pct, norm_pct, excess_pcs, excess_kg, debit_paise, debit_note_no, debit_status)
         values ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT')`,
        [ret.id, ch.id, working.actualLossPct, n(ch.loss_norm_pct), excessPcs, working.excessLossKg, debitPaise, dn],
      );
      await postExcessLossJournal(sql, {
        paise: Math.round(working.excessLossKg * metal),
        returnId: ret.id,
        userId: staff.user_id,
      });
      if (scrapRetainedKg > 0.0005 || working.excessLossKg > 0.0005 || debitPaise > 0) {
        await sql.query(
          `insert into credit_debit_note (
             kind, doc_no, note_date, original_invoice_no, partner_id, reason,
             taxable_paise, total_paise, status, created_by
           ) values ('DN',$1,$2,$3,$4,$5,$6,$6,'DRAFT',$7)`,
          [
            dn,
            todayISO(),
            ch.doc_no,
            ch.partner_id,
            scrapRetainedKg > 0
              ? `s.143(5) scrap retained ${scrapRetainedKg.toFixed(3)} kg — kg stays on books until invoiced`
              : `JW excess loss ${working.excessLossKg.toFixed(3)} kg vs ${n(ch.loss_norm_pct)}% norm`,
            debitPaise,
            staff.user_id,
          ],
        );
      }
      await sql.query<Row>(
        `update job_work_challan_line set returned_pcs = returned_pcs + $1 where id = $2`,
        [taking, line.id],
      );
      const remaining = sentPcs - already - taking;
      await sql.query<Row>(`update job_work_challan set status = $1 where id = $2`, [
        remaining <= 0.0005 ? "CLOSED" : "PARTIAL",
        ch.id,
      ]);
      await sql.query<Row>(
        `insert into cost_variance (jw_return_id, kind, expected, actual, variance, notes)
         values ($1,'JW_LOSS',$2,$3,$4,$5)`,
        [
          ret.id,
          n(ch.loss_norm_pct),
          working.actualLossPct,
          working.actualLossPct - n(ch.loss_norm_pct),
          `excess ${working.excessLossKg} kg · DN ${dn}`,
        ],
      );
      const snap = mapDeliveryChallan({
        company,
        challan: {
          ...partner,
          ...ch,
          partner_name: partner.name,
          partner_gstin: partner.gstin,
          partner_addr: partner.address_line1,
        },
        lines: [
          {
            sku: item.sku,
            item_name: item.name,
            qty_pcs: data.goodPcs + data.rejectPcs,
            qty_kg: roundKg(goodKg + rejectKg),
            hsn: line.hsn ?? item.hsn,
          },
        ],
        variant: "JW_RETURN",
        ret: { doc_no: docNo, good_pcs: data.goodPcs, reject_pcs: data.rejectPcs, short_pcs: data.shortPcs },
      });
      await saveDocSnapshot(sql, { userId: staff.user_id, entity: "job_work_return", entityId: ret.id, doc: snap });
      await audit(sql, {
        userId: staff.user_id,
        action: "JW_RETURN",
        entity: "job_work_return",
        entityId: ret.id,
        after: { working, good: data.goodPcs, reject: data.rejectPcs, short: data.shortPcs, dn },
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
        openKg: remaining <= 0.0005 ? 0 : roundKg((remaining / sentPcs) * sentKg),
      };
    });
  });

export const receiveCustomerMetal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      partnerId: z.coerce.number(),
      itemId: z.coerce.number(),
      heatNo: z.string().min(1),
      qtyKg: z.coerce.number().positive(),
      qtyPcs: z.coerce.number().min(0).default(0),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "jw");
    const sql = await erpSql();
    const item = (
      await sql.query<{ id: number; alloy_id: number | null; sku: string }>(`select * from item where id = $1`, [
        data.itemId,
      ])
    )[0];
    if (!item) throw new Error("Item not found");
    const partner = (await sql.query<{ id: number; is_customer: boolean }>(`select * from partner where id = $1`, [
      data.partnerId,
    ]))[0];
    if (!partner?.is_customer) throw new Error("JW-IN receive is customer metal only");
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
        sourceType: "JW_IN",
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
        notes: "Customer metal — value 0",
      });
      await audit(sql, {
        userId: staff.user_id,
        action: "JW_IN_RECEIVE",
        entity: "stock_lot",
        entityId: lot.id,
        after: { lotNo: lot.lot_no, qtyKg: data.qtyKg, partnerId: data.partnerId },
      });
      return { lotNo: lot.lot_no, lotId: lot.id, qtyKg: roundKg(data.qtyKg), valuePaise: 0 };
    });
  });

export const consumeCustomerMetal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      lotId: z.coerce.number(),
      qtyKg: z.coerce.number().positive(),
      qtyPcs: z.coerce.number().min(0).default(0),
    }),
  )
  .handler(async ({ context, data }) => {
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
        notes: "Consume customer metal — value stays 0",
      });
      return { lotNo: lot.lot_no, qtyKg: roundKg(data.qtyKg), valuePaise: 0 };
    });
  });

export const returnCustomerFg = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      lotId: z.coerce.number(),
      qtyKg: z.coerce.number().positive(),
      qtyPcs: z.coerce.number().min(0).default(0),
    }),
  )
  .handler(async ({ context, data }) => {
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
        notes: "Return leftover / FG to customer — value 0",
      });
      return { lotNo: lot.lot_no, qtyKg: roundKg(data.qtyKg), valuePaise: 0 };
    });
  });

export const getChallanPrint = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const company = (await sql.query<Row>(`select * from company limit 1`))[0];
    const challan = (
      await sql.query<Row>(
        `select c.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code
           from job_work_challan c join partner p on p.id = c.partner_id where c.id = $1`,
        [data.id],
      )
    )[0];
    if (!challan) throw new Error("Challan not found");
    const lines = await sql.query<Row>(
      `select l.*, i.sku, i.name as item_name from job_work_challan_line l join item i on i.id = l.item_id where l.challan_id = $1`,
      [data.id],
    );
    return { company, challan, lines };
  });
