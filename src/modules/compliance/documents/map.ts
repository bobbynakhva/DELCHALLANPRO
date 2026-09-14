/** Map live ERP rows onto GST document types. */
import { addDaysIso, statutoryDueIso } from "../gst/dates";
import { classifySupply, gstBreakupForKind, lineTotalPaise, roundOffToRupee, type SupplyKind } from "../gst/tax";
import { n } from "@/lib/erp/format";
import { TAMBA } from "./fixtures";
import type {
  CocDoc,
  DeliveryChallanDoc,
  EwayDoc,
  GrnSlipDoc,
  GstCompany,
  GstLine,
  GstParty,
  NoteDoc,
  PackingListDoc,
  QuoteDoc,
  TaxInvoiceDoc,
} from "./types";

function str(v: unknown, fallback = ""): string {
  if (v == null) return fallback;
  return String(v);
}

function bool(v: unknown, fallback = false): boolean {
  if (v == null) return fallback;
  if (typeof v === "boolean") return v;
  if (v === "t" || v === "true" || v === "1") return true;
  if (v === "f" || v === "false" || v === "0") return false;
  return fallback;
}

export function companyFromRow(c: Record<string, unknown> | null | undefined): GstCompany {
  if (!c) return TAMBA;
  const turnover = bool(c.turnover_above_5cr, true);
  return {
    legalName: str(c.name, TAMBA.legalName),
    tradeName: str(c.trade_name, TAMBA.tradeName),
    name: str(c.name, TAMBA.name),
    gstin: str(c.gstin, TAMBA.gstin ?? ""),
    pan: str(c.pan, TAMBA.pan ?? ""),
    cin: str(c.cin, TAMBA.cin ?? ""),
    iec: str(c.iec, TAMBA.iec ?? ""),
    lutArn: str(c.lut_arn, TAMBA.lutArn ?? ""),
    lutValidUntil: str(c.lut_valid_until, TAMBA.lutValidUntil ?? ""),
    addressLine1: str(c.address_line1, TAMBA.addressLine1),
    addressLine2: str(c.address_line2),
    city: str(c.city, TAMBA.city),
    state: str(c.state, TAMBA.state),
    stateCode: str(c.state_code, TAMBA.stateCode ?? "24"),
    pincode: str(c.pincode, TAMBA.pincode),
    country: "IN",
    registeredOffice: str(c.registered_office, TAMBA.registeredOffice ?? ""),
    phone: str(c.phone, TAMBA.phone ?? ""),
    email: str(c.email, TAMBA.email ?? ""),
    authorisedSignatory: str(c.authorised_signatory, TAMBA.authorisedSignatory),
    authorisedDesignation: str(c.authorised_designation, TAMBA.authorisedDesignation),
    composition: bool(c.composition, false),
    turnoverAbove5Cr: turnover,
    hsnDigits: n(c.hsn_digits) || (turnover ? 6 : 4),
    einvoiceApplicable: bool(c.einvoice_applicable, true),
    b2cQr: bool(c.b2c_qr, true),
    ewayThresholdPaise: n(c.eway_threshold_paise) || 5_000_000,
    msmeCreditDays: n(c.msme_credit_days) || 45,
    bankName: str(c.bank_name, TAMBA.bankName ?? ""),
    bankAccount: str(c.bank_account, TAMBA.bankAccount ?? ""),
    bankIfsc: str(c.bank_ifsc, TAMBA.bankIfsc ?? ""),
    registered: true,
  };
}

export function partyFromRow(p: {
  name?: unknown;
  gstin?: unknown;
  pan?: unknown;
  address_line1?: unknown;
  address_line2?: unknown;
  partner_name?: unknown;
  partner_gstin?: unknown;
  partner_addr?: unknown;
  partner_city?: unknown;
  partner_state?: unknown;
  partner_state_code?: unknown;
  partner_country?: unknown;
  city?: unknown;
  state?: unknown;
  state_code?: unknown;
  pincode?: unknown;
  country?: unknown;
}): GstParty {
  const name = str(p.partner_name ?? p.name);
  const gstin = str(p.partner_gstin ?? p.gstin) || null;
  const country = str(p.partner_country ?? p.country, "IN");
  return {
    name,
    gstin,
    pan: str(p.pan) || null,
    addressLine1: str(p.partner_addr ?? p.address_line1),
    addressLine2: str(p.address_line2) || null,
    city: str(p.partner_city ?? p.city),
    state: str(p.partner_state ?? p.state),
    stateCode: str(p.partner_state_code ?? p.state_code) || null,
    pincode: str(p.pincode),
    country,
    registered: Boolean(gstin) && country === "IN",
  };
}

export function mapTaxInvoice(opts: {
  company: Record<string, unknown>;
  invoice: Record<string, unknown>;
  lines: Array<Record<string, unknown>>;
  packing?: Record<string, unknown> | null;
}): TaxInvoiceDoc {
  const company = companyFromRow(opts.company);
  const inv = opts.invoice;
  const billTo = partyFromRow(inv);
  const isExport = bool(inv.is_export) || billTo.country !== "IN";
  const exportMode = (str(inv.export_mode) as "LUT" | "IGST") || (isExport ? "LUT" : null);
  const kind: SupplyKind = classifySupply({
    fromState: company.stateCode,
    toState: billTo.stateCode,
    isExport,
    exportMode,
  });
  const lines: GstLine[] = opts.lines.map((l, i) => {
    const taxable = n(l.taxable_paise);
    const tax = {
      cgstPaise: n(l.cgst_paise),
      sgstPaise: n(l.sgst_paise),
      igstPaise: n(l.igst_paise),
    };
    return {
      sl: i + 1,
      description: `${str(l.item_name)} (${str(l.sku)})`,
      hsn: str(l.hsn),
      uqc: n(l.qty_kg) > 0 ? "NOS / KGS" : "NOS",
      qtyNos: n(l.qty_pcs),
      qtyKgs: n(l.qty_kg),
      lotHeat: [str(l.lot_no), str(l.heat_no)].filter(Boolean).join(" / ") || null,
      taxablePaise: taxable,
      discountPaise: n(l.discount_paise),
      gstPct: n(l.gst_pct) || 18,
      ...tax,
      lineTotalPaise: lineTotalPaise(taxable, n(l.discount_paise), {
        cgst: tax.cgstPaise,
        sgst: tax.sgstPaise,
        igst: tax.igstPaise,
      }),
    };
  });
  const taxable = n(inv.taxable_paise) || lines.reduce((s, l) => s + l.taxablePaise, 0);
  const cgst = n(inv.cgst_paise);
  const sgst = n(inv.sgst_paise);
  const igst = n(inv.igst_paise);
  const exact = n(inv.total_paise) || taxable + cgst + sgst + igst;
  const { rounded, roundOff } = roundOffToRupee(exact);
  const date = str(inv.invoice_date).slice(0, 10);
  const msme = addDaysIso(date, company.msmeCreditDays);
  return {
    title: "TAX INVOICE",
    docNo: str(inv.doc_no),
    docDate: date,
    kind,
    company,
    billTo,
    shipTo: billTo,
    placeOfSupply: str(inv.place_of_supply) || `${billTo.stateCode}-${billTo.state}`,
    rcm: bool(inv.reverse_charge),
    reverseCharge: bool(inv.reverse_charge),
    lines,
    taxablePaise: taxable,
    discountPaise: 0,
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    roundOffPaise: n(inv.round_off_paise) || roundOff,
    totalPaise: n(inv.total_paise) || rounded,
    netKg: n(inv.net_kg),
    packingNetKg: opts.packing ? n(opts.packing.net_kg) : n(inv.net_kg),
    irn: str(inv.irn) || null,
    irnAckNo: str(inv.irn_ack_no) || null,
    irnAckDt: str(inv.irn_ack_dt) || null,
    signedQr: str(inv.irn_signed_qr) || null,
    irnStatus: str(inv.irn_status) === "CNL" || str(inv.irn_status) === "ACT" ? (str(inv.irn_status) as "ACT" | "CNL") : null,
    soNo: str(inv.so_no) || null,
    ewayNo: str(inv.eway_no) || null,
    msmeDueDate: msme,
    vehicleNo: str(inv.vehicle_no) || null,
    export: isExport
      ? {
          mode: exportMode === "IGST" ? "IGST" : "LUT",
          currency: str(inv.currency, "USD"),
          forexRate: n(inv.forex_rate) || 83.5,
          inrTaxablePaise: taxable,
          country: billTo.country === "AE" ? "United Arab Emirates" : billTo.country,
          port: str(inv.port, "INAMD4 — Ahmedabad ICD"),
          incoterm: str(inv.incoterm, "FOB Mundra"),
          iec: company.iec ?? "",
          lutArn: company.lutArn,
        }
      : null,
  };
}

export function mapDeliveryChallan(opts: {
  company: Record<string, unknown>;
  challan: Record<string, unknown>;
  lines: Array<Record<string, unknown>>;
  variant?: "JW_OUT" | "JW_RETURN";
  ret?: Record<string, unknown> | null;
}): DeliveryChallanDoc {
  const company = companyFromRow(opts.company);
  const ch = opts.challan;
  const consignee = partyFromRow(ch);
  const issued = str(ch.issued_at).slice(0, 10);
  const goodsKind = "INPUTS" as const;
  const lines = opts.lines.map((l, i) => {
    const taxable = Math.round(n(l.qty_pcs) * 2107);
    return {
      sl: i + 1,
      description: `${str(l.item_name)} (${str(l.sku)})`,
      hsn: str(l.hsn) || "741220",
      uqc: "NOS / KGS",
      qtyNos: n(l.qty_pcs),
      qtyKgs: n(l.qty_kg),
      lotHeat: [str(l.lot_no), str(l.heat_no)].filter(Boolean).join(" / ") || null,
      taxablePaise: taxable,
      discountPaise: 0,
      gstPct: 18,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      lineTotalPaise: taxable,
      sentNos: n(l.qty_pcs),
      sentKgs: n(l.qty_kg),
      goodReceived: n(opts.ret?.good_pcs),
      reject: n(opts.ret?.reject_pcs),
      scrapReturned: 0,
      scrapKeptByJw: 0,
      loss: n(opts.ret?.short_pcs),
    };
  });
  const taxable = lines.reduce((s, l) => s + l.taxablePaise, 0);
  return {
    title: "DELIVERY CHALLAN",
    variant: opts.variant ?? "JW_OUT",
    docNo: str(opts.ret?.doc_no ?? ch.doc_no),
    docDate: str(opts.ret?.returned_at ?? issued).slice(0, 10),
    company,
    consigner: company,
    consignee,
    processName: str(ch.process_code),
    goodsKind,
    expectedReturn: str(ch.expected_return_at).slice(0, 10),
    statutoryDue: str(ch.statutory_due).slice(0, 10) || statutoryDueIso(issued, goodsKind),
    placeOfSupply: `${consignee.stateCode}-${consignee.state}`,
    interState: consignee.stateCode !== company.stateCode,
    vehicleNo: str(ch.vehicle_no) || null,
    ewayNo: str(ch.eway_no) || null,
    reasonCode: "3",
    lines,
    taxablePaise: taxable,
    gstPct: 18,
    taxPaise: Math.round(taxable * 0.18),
    originalChallanNo: opts.variant === "JW_RETURN" ? str(ch.doc_no) : null,
    originalChallanDate: opts.variant === "JW_RETURN" ? issued : null,
    ageDays: n(ch.age_days),
  };
}

export function mapPackingList(opts: {
  company: Record<string, unknown>;
  invoice: Record<string, unknown>;
  packing: Record<string, unknown>;
  packingLines: Array<Record<string, unknown>>;
}): PackingListDoc {
  const company = companyFromRow(opts.company);
  return {
    title: "PACKING LIST",
    docNo: str(opts.packing.doc_no),
    docDate: str(opts.packing.packed_at).slice(0, 10),
    invoiceNo: str(opts.invoice.doc_no),
    invoiceDate: str(opts.invoice.invoice_date).slice(0, 10),
    invoiceNetKg: n(opts.invoice.net_kg),
    packingNetKg: n(opts.packing.net_kg),
    packingGrossKg: n(opts.packing.gross_kg),
    company,
    consignee: partyFromRow(opts.invoice),
    countryOfOrigin: "India",
    cartonMarks: `TAMBA / ${str(opts.invoice.partner_name)}`,
    cartons: opts.packingLines.map((l) => ({
      cartonNo: str(l.carton_no),
      description: str(l.sku || l.item_name || "FG"),
      lotHeat: [str(l.lot_no), str(l.heat_no)].filter(Boolean).join(" / "),
      qtyNos: n(l.qty_pcs),
      netKg: n(l.net_kg),
      grossKg: n(l.gross_kg) || Math.round(n(l.net_kg) * 1.02 * 1000) / 1000,
    })),
  };
}

export function mapGrnSlip(opts: {
  company: Record<string, unknown>;
  grn: Record<string, unknown>;
  line: Record<string, unknown>;
}): GrnSlipDoc {
  return {
    title: "GRN / WEIGHMENT SLIP",
    docNo: str(opts.grn.doc_no),
    docDate: str(opts.grn.grn_date).slice(0, 10),
    company: companyFromRow(opts.company),
    vendor: partyFromRow(opts.grn),
    vehicleNo: str(opts.grn.vehicle_no),
    alloy: str(opts.line.alloy || opts.line.alloy_code),
    sku: str(opts.line.sku),
    heatNo: str(opts.line.heat_no),
    grossKg: n(opts.line.gross_kg),
    tareKg: n(opts.line.tare_kg),
    netKg: n(opts.line.net_kg),
    qcStatus: str(opts.line.lot_status) === "AVAILABLE" ? "RELEASED" : "QC HOLD",
  };
}

export function mapQuote(opts: {
  company: Record<string, unknown>;
  quote: Record<string, unknown>;
  lines: Array<Record<string, unknown>>;
}): QuoteDoc {
  return {
    title: "QUOTATION",
    docNo: str(opts.quote.doc_no),
    docDate: str(opts.quote.quote_date).slice(0, 10),
    validUntil: str(opts.quote.valid_until).slice(0, 10),
    company: companyFromRow(opts.company),
    customer: partyFromRow(opts.quote),
    metalRateDate: str(opts.quote.metal_rate_date).slice(0, 10),
    cuPaisePerKg: n(opts.quote.cu_paise_per_kg),
    znPaisePerKg: n(opts.quote.zn_paise_per_kg),
    lines: opts.lines.map((l, i) => ({
      sl: i + 1,
      sku: str(l.sku),
      description: str(l.item_name || l.sku),
      qtyNos: n(l.qty_pcs),
      metalPaise: n(l.metal_paise),
      conversionPaise: n(l.conversion_paise),
      jwPaise: n(l.jw_paise),
      packingPaise: n(l.packing_paise),
      overheadPaise: n(l.overhead_paise),
      marginPaise: n(l.margin_paise),
      unitPricePaise: n(l.unit_price_paise),
    })),
  };
}

export function mapNote(opts: {
  company: Record<string, unknown>;
  note: Record<string, unknown>;
  lines?: Array<Record<string, unknown>>;
}): NoteDoc {
  const company = companyFromRow(opts.company);
  const billTo = partyFromRow(opts.note);
  const kindSupply = classifySupply({
    fromState: company.stateCode,
    toState: billTo.stateCode,
    isExport: false,
  });
  const lines: GstLine[] = (opts.lines ?? []).map((l, i) => {
    const taxable = n(l.taxable_paise);
    const tax = gstBreakupForKind(taxable, n(l.gst_pct) || 18, kindSupply);
    return {
      sl: i + 1,
      description: str(l.description || l.item_name),
      hsn: str(l.hsn),
      uqc: "NOS / KGS",
      qtyNos: n(l.qty_pcs),
      qtyKgs: n(l.qty_kg),
      taxablePaise: taxable,
      discountPaise: 0,
      gstPct: n(l.gst_pct) || 18,
      cgstPaise: n(l.cgst_paise) || tax.cgst,
      sgstPaise: n(l.sgst_paise) || tax.sgst,
      igstPaise: n(l.igst_paise) || tax.igst,
      lineTotalPaise: lineTotalPaise(taxable, 0, tax),
    };
  });
  return {
    title: str(opts.note.kind) === "DN" ? "DEBIT NOTE" : "CREDIT NOTE",
    kind: str(opts.note.kind) === "DN" ? "DN" : "CN",
    docNo: str(opts.note.doc_no),
    docDate: str(opts.note.note_date).slice(0, 10),
    originalInvoiceNo: str(opts.note.original_invoice_no),
    originalInvoiceDate: str(opts.note.original_invoice_date).slice(0, 10),
    reason: str(opts.note.reason),
    company,
    billTo,
    placeOfSupply: `${billTo.stateCode}-${billTo.state}`,
    kindSupply,
    lines,
    taxablePaise: n(opts.note.taxable_paise),
    cgstPaise: n(opts.note.cgst_paise),
    sgstPaise: n(opts.note.sgst_paise),
    igstPaise: n(opts.note.igst_paise),
    totalPaise: n(opts.note.total_paise),
    irn: str(opts.note.irn) || null,
    irnAckNo: str(opts.note.irn_ack_no) || null,
    irnAckDt: str(opts.note.irn_ack_dt) || null,
    signedQr: str(opts.note.irn_signed_qr) || null,
  };
}

export function mapEway(opts: {
  company: Record<string, unknown>;
  eway: Record<string, unknown>;
}): EwayDoc {
  const company = companyFromRow(opts.company);
  const e = opts.eway;
  return {
    title: "FORM GST EWB-01",
    stubNo: str(e.ewb_no) || str(e.stub_no),
    docDate: str(e.doc_date).slice(0, 10),
    company,
    partA: {
      recipientGstin: str(e.recipient_gstin, "URP"),
      deliveryPin: str(e.delivery_pin),
      docNo: str(e.doc_no),
      docDate: str(e.doc_date).slice(0, 10),
      valuePaise: n(e.value_paise),
      hsn: str(e.hsn),
      reasonCode: str(e.reason_code, "3"),
      reasonLabel: str(e.reason_label, "Job Work"),
      documentType: str(e.document_type, "Delivery Challan"),
      billToGstin: str(e.bill_to_gstin, str(e.recipient_gstin)),
      shipToGstin: str(e.ship_to_gstin, str(e.recipient_gstin)),
    },
    partB: {
      vehicle: str(e.vehicle),
      mode: (str(e.mode, "Road") as EwayDoc["partB"]["mode"]) || "Road",
      transDoc: str(e.trans_doc),
      distanceKm: n(e.distance_km),
      skippedVehicle: bool(e.skipped_vehicle),
    },
    nicSigned: bool(e.nic_signed),
    validFrom: str(e.valid_from) || null,
    validUntil: str(e.valid_until) || null,
    ewbNo: str(e.ewb_no) || null,
    subSupplyType: str(e.sub_supply_type) || null,
  };
}

export function mapCoc(opts: {
  company: Record<string, unknown>;
  coc: Record<string, unknown>;
}): CocDoc {
  return {
    title: "CERTIFICATE OF CONFORMANCE",
    docNo: str(opts.coc.doc_no),
    docDate: str(opts.coc.doc_date).slice(0, 10),
    company: companyFromRow(opts.company),
    customer: partyFromRow(opts.coc),
    sku: str(opts.coc.sku),
    description: str(opts.coc.description),
    alloySpec: str(opts.coc.alloy_spec),
    drawingNo: str(opts.coc.drawing_no),
    drawingRev: str(opts.coc.drawing_rev),
    lotNo: str(opts.coc.lot_no),
    heatNo: str(opts.coc.heat_no),
    qtyNos: n(opts.coc.qty_nos),
    qtyKgs: n(opts.coc.qty_kgs),
    qaSignatory: str(opts.coc.qa_signatory, "Anjali Trivedi, QC"),
  };
}
