import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, audit, erpSql, nextDoc, requireStaff } from "./core.server";
import { quoteItem } from "@/modules/quote/load";
import { assertRateDateNotFuture, type MetalBasis } from "@/modules/quote/engine";
import { n, roundKg, todayISO, addDaysISO } from "./format";
import { uid, type Row } from "./row";
import { gstBreakup } from "./quote-math";
import { getLot, postMove, saveDocSnapshot, withStockTx } from "./stock.server";
import { assertPackingMatch } from "@/modules/inventory/rules";
import { classifySupply } from "@/modules/compliance/gst/tax";
import { invoicePrintIssues } from "@/modules/compliance/gst/validate";
import { mapPackingList, mapTaxInvoice, mapQuote } from "@/modules/compliance/documents/map";
import { assertCreditAllows, postInvoiceJournal } from "./api-finance";
import { assertPeriodAllows } from "@/modules/finance/journal";
import { generateAndPersistIrn } from "./irp-service";

export const postMetalPrice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      asOfDate: z.string(),
      cuPaisePerKg: z.coerce.number().positive(),
      znPaisePerKg: z.coerce.number().positive(),
      pbPaisePerKg: z.coerce.number().min(0).default(0),
      scrapPaisePerKg: z.coerce.number().min(0).optional(),
      source: z.enum(["MCX", "dealer", "manual"]).default("manual"),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "price_edit");
    const sql = await erpSql();
    assertRateDateNotFuture(data.asOfDate, todayISO());
    const before = (
      await sql.query<Row>(`select * from metal_price order by as_of_date desc limit 1`)
    )[0];
    await sql.query<Row>(
      `insert into metal_price (as_of_date, cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, posted_by, source)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (as_of_date) do update set
         cu_paise_per_kg = excluded.cu_paise_per_kg,
         zn_paise_per_kg = excluded.zn_paise_per_kg,
         pb_paise_per_kg = excluded.pb_paise_per_kg,
         posted_by = excluded.posted_by,
         source = excluded.source`,
      [data.asOfDate, data.cuPaisePerKg, data.znPaisePerKg, data.pbPaisePerKg, staff.user_id, data.source],
    );
    const scrap = data.scrapPaisePerKg ?? 41000;
    const lines: Array<[string, number]> = [
      ["CU_INR_KG", data.cuPaisePerKg],
      ["ZN_INR_KG", data.znPaisePerKg],
      ["PB_INR_KG", data.pbPaisePerKg],
      ["BRASS_SCRAP_C360_KG", scrap],
    ];
    for (const [inst, rate] of lines) {
      await sql.query(
        `insert into metal_price_line (as_of_date, instrument, rate_paise_per_kg, source)
         values ($1,$2,$3,$4)
         on conflict (as_of_date, instrument) do update set rate_paise_per_kg = excluded.rate_paise_per_kg, source = excluded.source`,
        [data.asOfDate, inst, rate, data.source],
      );
    }
    await audit(sql, {
      userId: staff.user_id,
      action: "METAL_PRICE",
      entity: "metal_price",
      entityId: data.asOfDate,
      before,
      after: data,
    });
    return { ok: true, asOfDate: data.asOfDate };
  });

export const createQuote = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      partnerId: z.coerce.number(),
      itemId: z.coerce.number(),
      qtyPcs: z.coerce.number().positive(),
      asOf: z.string().optional(),
      basis: z.enum(["CU_ZN_BLEND", "ALLOY_DEALER_RATE"]).optional(),
      marginPct: z.coerce.number().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "sales");
    const sql = await erpSql();
    const asOf = data.asOf || todayISO();
    assertRateDateNotFuture(asOf, todayISO());
    const snap = await quoteItem(sql, {
      itemId: data.itemId,
      asOf,
      basis: data.basis as MetalBasis | undefined,
      marginPct: data.marginPct,
    });
    const partner = (
      await sql.query<Row>(`select * from partner where id = $1`, [data.partnerId])
    )[0];
    if (!partner) throw new Error("Customer not found");
    const item = (
      await sql.query<Row>(`select sku, name, hsn from item where id = $1`, [data.itemId])
    )[0]!;
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const docNo = await nextDoc(sql, "QTN");
    const validUntil = addDaysISO(todayISO(), 14);
    const q = (
      await sql.query<{ id: number }>(
        `insert into quotation (
           doc_no, partner_id, quote_date, valid_until, status, metal_rate_date,
           cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, formula_snapshot, created_by,
           currency, fx_rate, metal_basis
         ) values ($1,$2,$3,$4,'SENT',$5,$6,$7,$8,$9,$10,'INR',1,$11) returning id`,
        [
          docNo,
          data.partnerId,
          todayISO(),
          validUntil,
          snap.metal_rate_date,
          snap.cu_paise_per_kg,
          snap.zn_paise_per_kg,
          snap.pb_paise_per_kg,
          JSON.stringify(snap),
          staff.user_id,
          snap.metal_basis,
        ],
      )
    )[0]!;
    await sql.query<Row>(
      `insert into quotation_line (
         quotation_id, item_id, qty_pcs, kg_per_pc, recovery_factor, metal_paise, conversion_paise,
         jw_paise, packing_paise, overhead_paise, margin_paise, unit_price_paise, gst_pct,
         cu_pct, zn_pct, pb_pct, cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg,
         metal_rate_date, blended_paise_per_kg, hsn, gst_rate_pct, margin_pct, alloy_code,
         conversion_reason, formula_text
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)`,
      [
        q.id,
        data.itemId,
        data.qtyPcs,
        snap.kg_per_pc,
        snap.recovery_factor,
        snap.metal_paise,
        snap.conversion_paise,
        snap.jw_paise,
        snap.packing_paise,
        snap.overhead_paise,
        snap.margin_paise,
        snap.unit_price_paise,
        snap.gst_rate_pct,
        snap.cu_pct,
        snap.zn_pct,
        snap.pb_pct,
        snap.cu_paise_per_kg,
        snap.zn_paise_per_kg,
        snap.pb_paise_per_kg,
        snap.metal_rate_date,
        snap.blended_paise_per_kg,
        snap.hsn,
        snap.gst_rate_pct,
        snap.margin_pct,
        snap.alloy,
        snap.conversion_reason,
        snap.formula,
      ],
    );
    const taxDoc = mapQuote({
      company,
      quote: {
        ...partner,
        doc_no: docNo,
        quote_date: todayISO(),
        valid_until: validUntil,
        metal_rate_date: snap.metal_rate_date,
        cu_paise_per_kg: snap.cu_paise_per_kg,
        zn_paise_per_kg: snap.zn_paise_per_kg,
        partner_name: partner.name,
        partner_gstin: partner.gstin,
        partner_addr: partner.address_line1,
        partner_city: partner.city,
        partner_state: partner.state,
        partner_state_code: partner.state_code,
        partner_country: partner.country,
        pincode: partner.pincode,
        pan: partner.pan,
      },
      lines: [
        {
          sku: item.sku,
          item_name: item.name,
          qty_pcs: data.qtyPcs,
          metal_paise: snap.metal_paise,
          conversion_paise: snap.conversion_paise,
          jw_paise: snap.jw_paise,
          packing_paise: snap.packing_paise,
          overhead_paise: snap.overhead_paise,
          margin_paise: snap.margin_paise,
          unit_price_paise: snap.unit_price_paise,
        },
      ],
    });
    await saveDocSnapshot(sql, { userId: staff.user_id, entity: "quotation", entityId: q.id, doc: taxDoc });
    await audit(sql, {
      userId: staff.user_id,
      action: "QUOTE_FREEZE",
      entity: "quotation",
      entityId: q.id,
      after: { docNo, metalRateDate: snap.metal_rate_date, cu: snap.cu_paise_per_kg, unit: snap.unit_price_paise },
    });
    return { docNo, id: q.id, snapshot: snap, unitPricePaise: snap.unit_price_paise, validUntil };
  });

export const dispatchSo = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      soId: z.coerce.number(),
      lotId: z.coerce.number(),
      qtyPcs: z.coerce.number().positive(),
      ownerOverride: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const so = (
      await sql.query<{ id: number; partner_id: number; doc_no: string }>(
        `select * from sales_order where id = $1`,
        [data.soId],
      )
    )[0];
    if (!so) throw new Error("SO not found");
    const line = (
      await sql.query<{
        id: number;
        item_id: number;
        qty_pcs: string;
        qty_dispatched: string;
        unit_price_paise: number;
        gst_pct: string;
      }>(`select * from so_line where so_id = $1 limit 1`, [so.id])
    )[0];
    if (!line) throw new Error("SO has no lines");
    const lot = await getLot(sql, data.lotId);
    if (lot.item_id !== line.item_id) throw new Error("Lot item does not match SO line");
    if (lot.status !== "AVAILABLE") throw new Error("Lot is not AVAILABLE — QC must release first");
    if (n(lot.qty_pcs) < data.qtyPcs) throw new Error("Not enough pcs on lot");
    const reserved = (
      await sql.query<{ reserved_so_line_id: number | null }>(
        `select reserved_so_line_id from stock_lot where id = $1`,
        [lot.id],
      )
    )[0];
    if (reserved?.reserved_so_line_id && reserved.reserved_so_line_id !== line.id) {
      throw new Error("Lot is reserved to another SO — cannot dispatch");
    }
    const item = (
      await sql.query<{ kg_per_pc: string; hsn: string | null; sku: string; name: string }>(
        `select * from item where id = $1`,
        [line.item_id],
      )
    )[0]!;
    const partner = (
      await sql.query<{
        name: string;
        country: string;
        state_code: string | null;
        gstin: string | null;
        address_line1: string | null;
        city: string | null;
        state: string | null;
        pincode: string | null;
        pan: string | null;
      }>(`select * from partner where id = $1`, [so.partner_id])
    )[0]!;
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const isExport = partner.country !== "IN";
    const kg = roundKg(data.qtyPcs * n(item.kg_per_pc));
    const taxable = Math.round(data.qtyPcs * line.unit_price_paise);
    const gst = gstBreakup({
      taxablePaise: taxable,
      gstPct: n(line.gst_pct),
      fromState: String(company.state_code),
      toState: partner.state_code,
      isExport,
    });
    const cartonCount = Math.max(1, Math.ceil(data.qtyPcs / 500));
    let packingNet = 0;
    {
      let remaining = data.qtyPcs;
      for (let c = 1; c <= cartonCount; c++) {
        const pcs = c === cartonCount ? remaining : Math.min(500, remaining);
        remaining -= pcs;
        packingNet = roundKg(packingNet + pcs * n(item.kg_per_pc));
      }
    }
    assertPackingMatch(kg, packingNet);
    const kind = classifySupply({
      fromState: String(company.state_code),
      toState: partner.state_code,
      isExport,
    });
    const gstIssues = invoicePrintIssues({
      docNo: "INV/26-27/000001",
      kind,
      buyerRegistered: Boolean(partner.gstin) && partner.country === "IN",
      buyerGstin: partner.gstin,
      buyerName: partner.name,
      buyerStateCode: partner.state_code,
      lines: [{ sl: 1, hsn: item.hsn, cgstPaise: gst.cgst, sgstPaise: gst.sgst, igstPaise: gst.igst }],
      invoiceNetKg: kg,
      packingNetKg: packingNet,
    }).filter((i) => i.code !== "SERIAL");
    const blocked = gstIssues.filter((i) => i.level === "block");
    if (blocked[0]) throw new Error(blocked[0].message);

    await assertPeriodAllows(sql, todayISO(), "INVOICE");
    await assertCreditAllows(sql, so.partner_id, taxable + gst.cgst + gst.sgst + gst.igst, {
      ownerOverride: data.ownerOverride && staff.role === "OWNER",
      role: staff.role,
    });

    return withStockTx(sql, async () => {
      await postMove(sql, {
        moveType: "DISPATCH",
        itemId: lot.item_id,
        lotId: lot.id,
        warehouseId: lot.warehouse_id,
        qtyKg: -kg,
        qtyPcs: -data.qtyPcs,
        refType: "INV",
        userId: staff.user_id,
        alloyId: lot.alloy_id,
        unitValuePaisePerKg: lot.unit_value_paise_per_kg,
        kgPerPc: n(item.kg_per_pc),
        conversionKind: "FG",
        itemAlloyId: lot.alloy_id,
      });
      const invNo = await nextDoc(sql, "INV");
      const serialIssues = invoicePrintIssues({
        docNo: invNo,
        kind,
        buyerRegistered: Boolean(partner.gstin) && partner.country === "IN",
        buyerGstin: partner.gstin,
        buyerName: partner.name,
        buyerStateCode: partner.state_code,
        lines: [{ sl: 1, hsn: item.hsn, cgstPaise: gst.cgst, sgstPaise: gst.sgst, igstPaise: gst.igst }],
        invoiceNetKg: kg,
        packingNetKg: packingNet,
      }).filter((i) => i.level === "block");
      if (serialIssues[0]) throw new Error(serialIssues[0].message);
      const inv = (
        await sql.query<{ id: number }>(
          `insert into sales_invoice (
             doc_no, partner_id, so_id, invoice_date, place_of_supply, is_export,
             taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, net_kg, status, created_by, due_date
           ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'POSTED',$13, current_date + 30) returning id`,
          [
            invNo,
            so.partner_id,
            so.id,
            todayISO(),
            isExport ? partner.country : partner.state_code,
            isExport,
            taxable,
            gst.cgst,
            gst.sgst,
            gst.igst,
            taxable + gst.cgst + gst.sgst + gst.igst,
            kg,
            staff.user_id,
          ],
        )
      )[0]!;
      await sql.query<Row>(
        `insert into sales_invoice_line (
           invoice_id, item_id, lot_id, hsn, qty_pcs, qty_kg, unit_price_paise, taxable_paise,
           gst_pct, cgst_paise, sgst_paise, igst_paise
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          inv.id,
          line.item_id,
          lot.id,
          item.hsn,
          data.qtyPcs,
          kg,
          line.unit_price_paise,
          taxable,
          n(line.gst_pct),
          gst.cgst,
          gst.sgst,
          gst.igst,
        ],
      );
      await postInvoiceJournal(sql, {
        invoiceId: inv.id,
        isExport,
        taxablePaise: taxable,
        cgstPaise: gst.cgst,
        sgstPaise: gst.sgst,
        igstPaise: gst.igst,
        totalPaise: taxable + gst.cgst + gst.sgst + gst.igst,
        userId: staff.user_id,
        date: todayISO(),
      });
      const plNo = await nextDoc(sql, "PL");
      const pl = (
        await sql.query<{ id: number }>(
          `insert into packing_list (doc_no, invoice_id, carton_count, net_kg, gross_kg)
           values ($1,$2,$3,$4,$5) returning id`,
          [plNo, inv.id, cartonCount, packingNet, roundKg(packingNet * 1.02)],
        )
      )[0]!;
      let remaining = data.qtyPcs;
      const packingLines: Array<{ carton_no: string; lot_id: number; item_id: number; qty_pcs: number; net_kg: number; sku: string; lot_no: string; heat_no: string | null; item_name: string }> = [];
      for (let c = 1; c <= cartonCount; c++) {
        const pcs = c === cartonCount ? remaining : Math.min(500, remaining);
        remaining -= pcs;
        const net = roundKg(pcs * n(item.kg_per_pc));
        await sql.query<Row>(
          `insert into packing_list_line (packing_list_id, carton_no, lot_id, item_id, qty_pcs, net_kg)
           values ($1,$2,$3,$4,$5,$6)`,
          [pl.id, `C${String(c).padStart(3, "0")}`, lot.id, line.item_id, pcs, net],
        );
        packingLines.push({
          carton_no: `C${String(c).padStart(3, "0")}`,
          lot_id: lot.id,
          item_id: line.item_id,
          qty_pcs: pcs,
          net_kg: net,
          sku: item.sku,
          lot_no: lot.lot_no,
          heat_no: lot.heat_no,
          item_name: item.name,
        });
      }
      await sql.query<Row>(`update so_line set qty_dispatched = qty_dispatched + $1 where id = $2`, [
        data.qtyPcs,
        line.id,
      ]);
      const newDisp = n(line.qty_dispatched) + data.qtyPcs;
      await sql.query<Row>(`update sales_order set status = $1 where id = $2`, [
        newDisp >= n(line.qty_pcs) ? "CLOSED" : "PARTIAL",
        so.id,
      ]);
      const invRow = {
        ...partner,
        doc_no: invNo,
        invoice_date: todayISO(),
        place_of_supply: isExport ? partner.country : partner.state_code,
        is_export: isExport,
        taxable_paise: taxable,
        cgst_paise: gst.cgst,
        sgst_paise: gst.sgst,
        igst_paise: gst.igst,
        total_paise: taxable + gst.cgst + gst.sgst + gst.igst,
        net_kg: kg,
        partner_name: partner.name,
        partner_gstin: partner.gstin,
        partner_addr: partner.address_line1,
        partner_city: partner.city,
        partner_state: partner.state,
        partner_country: partner.country,
        partner_state_code: partner.state_code,
        so_no: so.doc_no,
      };
      const lineRow = {
        sku: item.sku,
        item_name: item.name,
        hsn: item.hsn,
        qty_pcs: data.qtyPcs,
        qty_kg: kg,
        unit_price_paise: line.unit_price_paise,
        taxable_paise: taxable,
        gst_pct: n(line.gst_pct),
        cgst_paise: gst.cgst,
        sgst_paise: gst.sgst,
        igst_paise: gst.igst,
        lot_no: lot.lot_no,
        heat_no: lot.heat_no,
      };
      const taxDoc = mapTaxInvoice({
        company,
        invoice: invRow,
        lines: [lineRow],
        packing: { net_kg: packingNet, doc_no: plNo },
      });
      const packDoc = mapPackingList({
        company,
        invoice: invRow,
        packing: { doc_no: plNo, carton_count: cartonCount, net_kg: packingNet, gross_kg: roundKg(packingNet * 1.02) },
        packingLines,
      });
      await saveDocSnapshot(sql, { userId: staff.user_id, entity: "sales_invoice", entityId: inv.id, doc: taxDoc });
      await saveDocSnapshot(sql, { userId: staff.user_id, entity: "packing_list", entityId: pl.id, doc: packDoc });
      await audit(sql, {
        userId: staff.user_id,
        action: "DISPATCH",
        entity: "sales_invoice",
        entityId: inv.id,
        after: { invNo, plNo, qtyPcs: data.qtyPcs, netKg: kg, packingNetKg: packingNet },
      });
      return {
        invoiceNo: invNo,
        packingNo: plNo,
        invoiceId: inv.id,
        packingId: pl.id,
        netKg: kg,
        packingNetKg: packingNet,
        totalPaise: taxable + gst.cgst + gst.sgst + gst.igst,
      };
    });
  });

export const stubIrn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ invoiceId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const r = await generateAndPersistIrn(sql, { docType: "INVOICE", docId: data.invoiceId, userId: staff.user_id });
    return { irn: r.Irn, ack: r.AckNo };
  });

export const getInvoicePrint = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const company = (await sql.query<Row>(`select * from company limit 1`))[0];
    const invoice = (
      await sql.query<Row>(
        `select inv.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.country as partner_country,
                p.state_code as partner_state_code, so.doc_no as so_no
           from sales_invoice inv
           join partner p on p.id = inv.partner_id
           left join sales_order so on so.id = inv.so_id
          where inv.id = $1`,
        [data.id],
      )
    )[0];
    if (!invoice) throw new Error("Invoice not found");
    const lines = await sql.query<Row>(
      `select l.*, i.sku, i.name as item_name from sales_invoice_line l join item i on i.id = l.item_id where l.invoice_id = $1`,
      [data.id],
    );
    const packing = (
      await sql.query<Row>(`select * from packing_list where invoice_id = $1`, [data.id])
    )[0];
    const packingLines = packing
      ? await sql.query<Row>(
          `select * from packing_list_line where packing_list_id = $1 order by id`,
          [(packing as { id: number }).id],
        )
      : [];
    return { company, invoice, lines, packing, packingLines };
  });

export const createNcr = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      lotId: z.coerce.number().optional(),
      itemId: z.coerce.number().optional(),
      source: z.string().default("MANUAL"),
      description: z.string().min(3),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();
    const docNo = await nextDoc(sql, "NCR");
    await sql.query<Row>(
      `insert into ncr (doc_no, lot_id, item_id, source, description, created_by)
       values ($1,$2,$3,$4,$5,$6)`,
      [docNo, data.lotId ?? null, data.itemId ?? null, data.source, data.description, staff.user_id],
    );
    return { docNo };
  });

export const createMelt = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      alloyId: z.coerce.number(),
      lotId: z.coerce.number(),
      qtyKg: z.coerce.number().positive(),
      furnace: z.string().default("MELT-1"),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();
    const lot = await getLot(sql, data.lotId);
    if (lot.owner_type === "CUSTOMER") throw new Error("Customer metal cannot be remelted into our heat");
    const docNo = await nextDoc(sql, "MEL");
    const heatNo = `H26-${docNo.slice(-4)}`;
    const melt = (
      await sql.query<{ id: number }>(
        `insert into melt_order (doc_no, alloy_id, furnace, status, heat_no) values ($1,$2,$3,'OPEN',$4) returning id`,
        [docNo, data.alloyId, data.furnace, heatNo],
      )
    )[0]!;
    await postMove(sql, {
      moveType: "MELT_OUT",
      itemId: lot.item_id,
      lotId: lot.id,
      warehouseId: lot.warehouse_id,
      qtyKg: -data.qtyKg,
      qtyPcs: 0,
      refType: "MELT",
      refId: melt.id,
      userId: staff.user_id,
      alloyId: lot.alloy_id,
      unitValuePaisePerKg: lot.unit_value_paise_per_kg,
    });
    await sql.query<Row>(`insert into melt_charge (melt_id, lot_id, item_id, qty_kg) values ($1,$2,$3,$4)`, [
      melt.id,
      lot.id,
      lot.item_id,
      data.qtyKg,
    ]);
    return { docNo, heatNo };
  });

export const postSpectro = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      meltId: z.coerce.number(),
      cuPct: z.coerce.number(),
      znPct: z.coerce.number(),
      pbPct: z.coerce.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const alloy = (
      await sql.query<{ cu_pct: string; zn_pct: string; pb_pct: string }>(
        `select a.cu_pct, a.zn_pct, a.pb_pct from melt_order m join alloy a on a.id = m.alloy_id where m.id = $1`,
        [data.meltId],
      )
    )[0];
    const passed =
      Math.abs(data.cuPct - n(alloy?.cu_pct)) <= 1.5 &&
      Math.abs(data.znPct - n(alloy?.zn_pct)) <= 2 &&
      Math.abs(data.pbPct - n(alloy?.pb_pct)) <= 0.5;
    await sql.query<Row>(
      `insert into melt_spectro (melt_id, cu_pct, zn_pct, pb_pct, passed) values ($1,$2,$3,$4,$5)`,
      [data.meltId, data.cuPct, data.znPct, data.pbPct, passed],
    );
    await sql.query<Row>(`update melt_order set status = $1 where id = $2`, [
      passed ? "PASSED" : "HOLD",
      data.meltId,
    ]);
    return { passed };
  });

export const approveBom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ bomId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "masters");
    const sql = await erpSql();
    await sql.query<Row>(
      `update bom set status = 'APPROVED', approved_by = $1, approved_at = now() where id = $2`,
      [staff.user_id, data.bomId],
    );
    return { ok: true };
  });
