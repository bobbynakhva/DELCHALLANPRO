import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, audit, erpSql, nextDoc, requireStaff } from "./core.server";
import { n, todayISO } from "./format";
import { uid, type Row } from "./row";
import { companyFromRow, mapCoc, mapDeliveryChallan, mapEway, mapGrnSlip, mapNote, mapPackingList, mapQuote, mapTaxInvoice } from "@/modules/compliance/documents/map";
import { assertDocSerial } from "@/modules/compliance/gst/serial";
import { loadDocSnapshot } from "./stock.server";
import { overlayChallanEway, overlayInvoiceIrp, overlayNoteIrp, generateAndPersistEway } from "./irp-service";
import { resolveNicMode } from "@/modules/compliance/irp/mode";
import type { DeliveryChallanDoc, GrnSlipDoc, NoteDoc, PackingListDoc, TaxInvoiceDoc } from "@/modules/compliance/documents/types";

const auth = [authMiddleware];

export const getGstSettings = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const company = (await sql.query<Row>(`select * from company limit 1`))[0];
    const series = await sql.query<Row>(`select * from number_series order by doc_type`);
    const einvoiceSetting = (await sql.query<{ value: string }>(`select value from settings where key = 'einvoice_mode'`))[0]?.value;
    const ewaySetting = (await sql.query<{ value: string }>(`select value from settings where key = 'eway_mode'`))[0]?.value;
    return {
      company: companyFromRow(company),
      raw: company,
      series,
      nic: {
        einvoiceMode: resolveNicMode("EINVOICE", einvoiceSetting),
        ewayMode: resolveNicMode("EWAY", ewaySetting),
      },
    };
  });

export const saveGstSettings = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      legalName: z.string().min(2),
      tradeName: z.string().min(1),
      gstin: z.string().min(15).max(15),
      pan: z.string().optional(),
      cin: z.string().optional(),
      iec: z.string().optional(),
      lutArn: z.string().optional(),
      lutValidUntil: z.string().optional(),
      addressLine1: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      stateCode: z.string().min(2).max(2),
      pincode: z.string().min(4),
      registeredOffice: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      authorisedSignatory: z.string().min(1),
      authorisedDesignation: z.string().min(1),
      composition: z.boolean(),
      turnoverAbove5Cr: z.boolean(),
      einvoiceApplicable: z.boolean(),
      b2cQr: z.boolean(),
      ewayThresholdPaise: z.coerce.number().min(0),
      msmeCreditDays: z.coerce.number().min(0),
      bankName: z.string().optional(),
      bankAccount: z.string().optional(),
      bankIfsc: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const hsnDigits = data.turnoverAbove5Cr ? 6 : 4;
    await sql.query(
      `update company set
         name=$1, trade_name=$2, gstin=$3, pan=$4, cin=$5, iec=$6, lut_arn=$7, lut_valid_until=$8,
         address_line1=$9, city=$10, state=$11, state_code=$12, pincode=$13, registered_office=$14,
         phone=$15, email=$16, authorised_signatory=$17, authorised_designation=$18,
         composition=$19, turnover_above_5cr=$20, hsn_digits=$21, einvoice_applicable=$22, b2c_qr=$23,
         eway_threshold_paise=$24, msme_credit_days=$25, bank_name=$26, bank_account=$27, bank_ifsc=$28`,
      [
        data.legalName,
        data.tradeName,
        data.gstin.toUpperCase(),
        data.pan ?? null,
        data.cin ?? null,
        data.iec ?? null,
        data.lutArn ?? null,
        data.lutValidUntil || null,
        data.addressLine1,
        data.city,
        data.state,
        data.stateCode,
        data.pincode,
        data.registeredOffice ?? null,
        data.phone ?? null,
        data.email ?? null,
        data.authorisedSignatory,
        data.authorisedDesignation,
        data.composition,
        data.turnoverAbove5Cr,
        hsnDigits,
        data.einvoiceApplicable,
        data.b2cQr,
        data.ewayThresholdPaise,
        data.msmeCreditDays,
        data.bankName ?? null,
        data.bankAccount ?? null,
        data.bankIfsc ?? null,
      ],
    );
    await audit(sql, { userId: staff.user_id, action: "GST_SETTINGS", entity: "company", after: data });
    return { ok: true, hsnDigits };
  });

export const getRegistersData = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const company = companyFromRow((await sql.query<Row>(`select * from company limit 1`))[0]);
    const invoices = await sql.query<Row>(
      `select inv.doc_no, inv.invoice_date as date, p.gstin, p.name,
              inv.place_of_supply as place, inv.taxable_paise, inv.cgst_paise, inv.sgst_paise,
              inv.igst_paise, inv.total_paise,
              coalesce((select hsn from sales_invoice_line where invoice_id = inv.id limit 1),'') as hsn
         from sales_invoice inv join partner p on p.id = inv.partner_id
        order by inv.doc_no`,
    );
    const notes = await sql.query<Row>(
      `select n.kind, n.doc_no, n.note_date as date, n.original_invoice_no as original_no,
              p.gstin, n.taxable_paise, n.cgst_paise, n.sgst_paise, n.igst_paise
         from credit_debit_note n
         left join partner p on p.id = n.partner_id
        order by n.doc_no`,
    );
    const challans = await sql.query<Row>(
      `select c.doc_no, c.issued_at as date, p.name as partner, p.gstin,
              coalesce((select hsn from job_work_challan_line where challan_id = c.id limit 1),'741220') as hsn,
              coalesce((select sum(qty_pcs) from job_work_challan_line where challan_id = c.id),0) as qty_nos,
              coalesce((select sum(qty_kg) from job_work_challan_line where challan_id = c.id),0) as qty_kgs,
              c.statutory_due as due, c.status,
              coalesce((select sum(good_pcs) from job_work_return where challan_id = c.id),0) as received_nos,
              coalesce((select sum(short_pcs) from job_work_return where challan_id = c.id),0) as loss_nos
         from job_work_challan c join partner p on p.id = c.partner_id
        order by c.issued_at`,
    );
    const eways = await sql.query<Row>(
      `select stub_no, doc_no, doc_date as date, value_paise, part_b_at, vehicle,
              coalesce(reason_label, reason_code) as reason, ewb_no, sub_supply_type
         from eway_bill order by id`,
    );
    return {
      company,
      invoices: invoices.map((r) => ({
        docNo: String(r.doc_no),
        date: String(r.date),
        gstin: r.gstin ? String(r.gstin) : null,
        name: String(r.name),
        place: String(r.place ?? ""),
        taxablePaise: n(r.taxable_paise),
        cgstPaise: n(r.cgst_paise),
        sgstPaise: n(r.sgst_paise),
        igstPaise: n(r.igst_paise),
        totalPaise: n(r.total_paise),
        hsn: String(r.hsn ?? ""),
      })),
      notes: notes.map((r) => ({
        kind: r.kind === "DN" ? ("DN" as const) : ("CN" as const),
        docNo: String(r.doc_no),
        date: String(r.date),
        originalNo: String(r.original_no),
        gstin: r.gstin ? String(r.gstin) : null,
        taxablePaise: n(r.taxable_paise),
        cgstPaise: n(r.cgst_paise),
        sgstPaise: n(r.sgst_paise),
        igstPaise: n(r.igst_paise),
      })),
      challans: challans.map((r) => ({
        docNo: String(r.doc_no),
        date: String(r.date),
        partner: String(r.partner),
        gstin: r.gstin ? String(r.gstin) : null,
        hsn: String(r.hsn),
        qtyNos: n(r.qty_nos),
        qtyKgs: n(r.qty_kgs),
        due: String(r.due),
        status: String(r.status),
        receivedNos: n(r.received_nos),
        lossNos: n(r.loss_nos),
      })),
      eways: eways.map((r) => ({
        stubNo: String(r.ewb_no || r.stub_no),
        docNo: String(r.doc_no ?? ""),
        date: String(r.date ?? ""),
        valuePaise: n(r.value_paise),
        partBAt: r.part_b_at ? String(r.part_b_at) : null,
        vehicle: String(r.vehicle ?? ""),
        reason: String(r.reason ?? ""),
      })),
    };
  });

export const deemedSupply = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ challanId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const existing = (
      await sql.query<{ invoice_id: number; status: string }>(`select id, invoice_id, status from deemed_supply where challan_id = $1`, [
        data.challanId,
      ])
    )[0];
    if (existing?.invoice_id) {
      const inv = (
        await sql.query<{ doc_no: string; status: string }>(`select doc_no, status from sales_invoice where id = $1`, [existing.invoice_id])
      )[0];
      return { invoiceId: existing.invoice_id, docNo: inv?.doc_no, status: inv?.status ?? "DRAFT", already: true };
    }
    const ch = (
      await sql.query<Row>(
        `select c.*, p.name as partner_name, p.state_code as partner_state_code
           from job_work_challan c join partner p on p.id = c.partner_id where c.id = $1`,
        [data.challanId],
      )
    )[0];
    if (!ch) throw new Error("Challan not found");
    const lines = await sql.query<Row>(
      `select l.*, i.sku, i.name as item_name, i.hsn as item_hsn
         from job_work_challan_line l join item i on i.id = l.item_id where l.challan_id = $1`,
      [data.challanId],
    );
    const taxable = lines.reduce((s, l) => s + Math.round(n(l.qty_pcs) * 2107), 0);
    const tax = Math.round(taxable * 0.18);
    const half = Math.round(tax / 2);
    const intra = str(ch.partner_state_code) === "24";
    const docNo = assertDocSerial(await nextDoc(sql, "INV"));
    const invoiceDate = String(ch.issued_at).slice(0, 10);
    const inv = (
      await sql.query<{ id: number }>(
        `insert into sales_invoice (
           doc_no, partner_id, invoice_date, place_of_supply, is_export,
           taxable_paise, cgst_paise, sgst_paise, igst_paise, total_paise, net_kg, status, created_by
         ) values ($1,$2,$3,$4,false,$5,$6,$7,$8,$9,$10,'DRAFT',$11) returning id`,
        [
          docNo,
          ch.partner_id,
          invoiceDate,
          intra ? "24-Gujarat" : `${ch.partner_state_code}`,
          taxable,
          intra ? half : 0,
          intra ? tax - half : 0,
          intra ? 0 : tax,
          taxable + tax,
          lines.reduce((s, l) => s + n(l.qty_kg), 0),
          staff.user_id,
        ],
      )
    )[0]!;
    for (const l of lines) {
      const lineTaxable = Math.round(n(l.qty_pcs) * 2107);
      const lineTax = Math.round(lineTaxable * 0.18);
      const h = Math.round(lineTax / 2);
      await sql.query(
        `insert into sales_invoice_line (
           invoice_id, item_id, lot_id, hsn, qty_pcs, qty_kg, unit_price_paise, taxable_paise,
           gst_pct, cgst_paise, sgst_paise, igst_paise
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,18,$9,$10,$11)`,
        [
          inv.id,
          l.item_id,
          l.lot_id,
          l.hsn ?? l.item_hsn ?? "741220",
          l.qty_pcs,
          l.qty_kg,
          2107,
          lineTaxable,
          intra ? h : 0,
          intra ? lineTax - h : 0,
          intra ? 0 : lineTax,
        ],
      );
    }
    await sql.query(
      `insert into deemed_supply (challan_id, invoice_id, invoice_date, status, created_by)
       values ($1,$2,$3,'DRAFT',$4)`,
      [data.challanId, inv.id, invoiceDate, staff.user_id],
    );
    await audit(sql, {
      userId: staff.user_id,
      action: "DEEMED_SUPPLY_DRAFT",
      entity: "sales_invoice",
      entityId: inv.id,
      after: { challan: ch.doc_no, invoice: docNo, date: invoiceDate },
    });
    return { invoiceId: inv.id, docNo, status: "DRAFT", already: false };
  });

export const stubEway = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      docType: z.enum(["CHALLAN", "INVOICE"]),
      docId: z.coerce.number(),
      reasonCode: z.string().default("3"),
      vehicle: z.string().optional(),
      distanceKm: z.coerce.number().min(0).default(18),
      force: z.boolean().default(false),
      skipSameState50km: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const skip = data.skipSameState50km ?? false;
    const r = await generateAndPersistEway(sql, {
      docType: data.docType,
      docId: data.docId,
      userId: staff.user_id,
      vehicle: skip ? undefined : data.vehicle,
      distanceKm: data.distanceKm,
      skipSameState50km: skip,
      force: data.force || data.reasonCode === "3",
    });
    return { id: r.id, stubNo: r.stubNo, ewbNo: r.ewbNo, nicSigned: false, subSupplyType: r.partA.subSupplyType };
  });

export const getInvoiceDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const snap = await loadDocSnapshot<TaxInvoiceDoc>(sql, "sales_invoice", data.id);
    if (snap?.docNo) return overlayInvoiceIrp(sql, data.id, snap);
    const packed = await loadInvoice(sql, data.id);
    return overlayInvoiceIrp(sql, data.id, mapTaxInvoice(packed));
  });

export const getPackingDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const packed = await loadInvoice(sql, data.id);
    if (!packed.packing) throw new Error("No packing list for this invoice");
    const snap = await loadDocSnapshot<PackingListDoc>(sql, "packing_list", (packed.packing as { id: number }).id);
    if (snap?.docNo) return snap;
    return mapPackingList({
      company: packed.company,
      invoice: packed.invoice,
      packing: packed.packing,
      packingLines: packed.packingLines,
    });
  });

export const getChallanDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const snap = await loadDocSnapshot<DeliveryChallanDoc>(sql, "job_work_challan", data.id);
    if (snap?.docNo) return overlayChallanEway(sql, data.id, snap);
    return overlayChallanEway(sql, data.id, mapDeliveryChallan(await loadChallan(sql, data.id)));
  });

export const getReturnDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const snap = await loadDocSnapshot<DeliveryChallanDoc>(sql, "job_work_return", data.id);
    if (snap?.docNo) return snap;
    const ret = (await sql.query<Row>(`select * from job_work_return where id = $1`, [data.id]))[0];
    if (!ret) throw new Error("Return not found");
    const base = await loadChallan(sql, n(ret.challan_id));
    return mapDeliveryChallan({ ...base, variant: "JW_RETURN", ret });
  });

export const getGrnDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const snap = await loadDocSnapshot<GrnSlipDoc>(sql, "grn", data.id);
    if (snap?.docNo) return snap;
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const grn = (
      await sql.query<Row>(
        `select g.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
                p.pincode, p.country as partner_country
           from grn g join partner p on p.id = g.partner_id where g.id = $1`,
        [data.id],
      )
    )[0];
    if (!grn) throw new Error("GRN not found");
    const line = (
      await sql.query<Row>(
        `select l.*, i.sku, a.code as alloy, sl.status as lot_status
           from grn_line l
           join item i on i.id = l.item_id
           left join alloy a on a.id = i.alloy_id
           left join stock_lot sl on sl.id = l.lot_id
          where l.grn_id = $1
          order by l.id limit 1`,
        [data.id],
      )
    )[0];
    if (!line) throw new Error("GRN has no lines");
    return mapGrnSlip({ company, grn, line });
  });

export const getQuoteDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const quote = (
      await sql.query<Row>(
        `select q.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
                p.pincode, p.country as partner_country, p.pan
           from quotation q join partner p on p.id = q.partner_id where q.id = $1`,
        [data.id],
      )
    )[0];
    if (!quote) throw new Error("Quote not found");
    const lines = await sql.query<Row>(
      `select l.*, i.sku, i.name as item_name from quotation_line l join item i on i.id = l.item_id where l.quotation_id = $1`,
      [data.id],
    );
    return mapQuote({ company, quote, lines });
  });

export const getNoteDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const note = (
      await sql.query<Row>(
        `select n.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
                p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
                p.pincode, p.country as partner_country
           from credit_debit_note n
           left join partner p on p.id = n.partner_id
          where n.id = $1`,
        [data.id],
      )
    )[0];
    if (!note) throw new Error("Note not found");
    const lines = await sql.query<Row>(`select * from credit_debit_note_line where note_id = $1`, [data.id]);
    const mapped = mapNote({ company, note, lines });
    const snap = await loadDocSnapshot<NoteDoc>(sql, "credit_debit_note", data.id);
    return overlayNoteIrp(sql, data.id, snap?.docNo ? snap : mapped);
  });

export const getEwayDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const eway = (await sql.query<Row>(`select * from eway_bill where id = $1`, [data.id]))[0];
    if (!eway) throw new Error("e-way not found");
    return mapEway({ company, eway });
  });

export const getCocDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ lotId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();
    const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
    const lot = (
      await sql.query<Row>(
        `select l.*, i.sku, i.name as item_name, i.drawing_no, i.drawing_rev,
                a.code as alloy, a.cu_pct, a.zn_pct, a.pb_pct
           from stock_lot l
           join item i on i.id = l.item_id
           left join alloy a on a.id = l.alloy_id
          where l.id = $1`,
        [data.lotId],
      )
    )[0];
    if (!lot) throw new Error("Lot not found");
    const existing = (
      await sql.query<Row>(`select * from certificate_of_conformance where lot_id = $1 order by id desc limit 1`, [data.lotId])
    )[0];
    if (existing) {
      return mapCoc({
        company,
        coc: {
          ...existing,
          partner_name: "Gujarat Sanitary",
          partner_gstin: "24AAGCG5520F1Z6",
          partner_addr: "Narol-Naroda Highway",
          partner_city: "Ahmedabad",
          partner_state: "Gujarat",
          partner_state_code: "24",
          pincode: "382405",
          partner_country: "IN",
        },
      });
    }
    const docNo = assertDocSerial(await nextDoc(sql, "COC"));
    const alloySpec = lot.alloy ? `${lot.alloy} — Cu ${lot.cu_pct}% Zn ${lot.zn_pct}% Pb ${lot.pb_pct}%` : "As specified";
    await sql.query(
      `insert into certificate_of_conformance (
         doc_no, doc_date, lot_id, sku, description, alloy_spec, drawing_no, drawing_rev,
         lot_no, heat_no, qty_nos, qty_kgs, qa_signatory, created_by
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [
        docNo,
        todayISO(),
        data.lotId,
        lot.sku,
        lot.item_name,
        alloySpec,
        lot.drawing_no,
        lot.drawing_rev,
        lot.lot_no,
        lot.heat_no,
        lot.qty_pcs,
        lot.qty_kg,
        "Anjali Trivedi, QC",
        staff.user_id,
      ],
    );
    return mapCoc({
      company,
      coc: {
        doc_no: docNo,
        doc_date: todayISO(),
        sku: lot.sku,
        description: lot.item_name,
        alloy_spec: alloySpec,
        drawing_no: lot.drawing_no,
        drawing_rev: lot.drawing_rev,
        lot_no: lot.lot_no,
        heat_no: lot.heat_no,
        qty_nos: lot.qty_pcs,
        qty_kgs: lot.qty_kg,
        qa_signatory: "Anjali Trivedi, QC",
        partner_name: "Gujarat Sanitary",
        partner_gstin: "24AAGCG5520F1Z6",
        partner_addr: "Narol-Naroda Highway",
        partner_city: "Ahmedabad",
        partner_state: "Gujarat",
        partner_state_code: "24",
        pincode: "382405",
        partner_country: "IN",
      },
    });
  });

async function loadInvoice(sql: Awaited<ReturnType<typeof erpSql>>, id: number) {
  const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
  const invoice = (
    await sql.query<Row>(
      `select inv.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
              p.city as partner_city, p.state as partner_state, p.country as partner_country,
              p.state_code as partner_state_code, p.pan, p.pincode, so.doc_no as so_no
         from sales_invoice inv
         join partner p on p.id = inv.partner_id
         left join sales_order so on so.id = inv.so_id
        where inv.id = $1`,
      [id],
    )
  )[0];
  if (!invoice) throw new Error("Invoice not found");
  const lines = await sql.query<Row>(
    `select l.*, i.sku, i.name as item_name, sl.lot_no, sl.heat_no
       from sales_invoice_line l
       join item i on i.id = l.item_id
       left join stock_lot sl on sl.id = l.lot_id
      where l.invoice_id = $1`,
    [id],
  );
  const packing = (await sql.query<Row>(`select * from packing_list where invoice_id = $1`, [id]))[0] ?? null;
  const packingLines = packing
    ? await sql.query<Row>(
        `select pl.*, i.sku, i.name as item_name, sl.lot_no, sl.heat_no
           from packing_list_line pl
           join item i on i.id = pl.item_id
           left join stock_lot sl on sl.id = pl.lot_id
          where pl.packing_list_id = $1 order by pl.id`,
        [(packing as { id: number }).id],
      )
    : [];
  return { company, invoice, lines, packing, packingLines };
}

async function loadChallan(sql: Awaited<ReturnType<typeof erpSql>>, id: number) {
  const company = (await sql.query<Row>(`select * from company limit 1`))[0]!;
  const challan = (
    await sql.query<Row>(
      `select c.*, p.name as partner_name, p.gstin as partner_gstin, p.address_line1 as partner_addr,
              p.city as partner_city, p.state as partner_state, p.state_code as partner_state_code,
              p.pincode, p.country as partner_country,
              floor(extract(epoch from (now() - c.issued_at)) / 86400)::int as age_days
         from job_work_challan c join partner p on p.id = c.partner_id where c.id = $1`,
      [id],
    )
  )[0];
  if (!challan) throw new Error("Challan not found");
  const lines = await sql.query<Row>(
    `select l.*, i.sku, i.name as item_name, sl.lot_no, sl.heat_no
       from job_work_challan_line l
       join item i on i.id = l.item_id
       left join stock_lot sl on sl.id = coalesce(l.jw_lot_id, l.lot_id)
      where l.challan_id = $1`,
    [id],
  );
  return { company, challan, lines };
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}
