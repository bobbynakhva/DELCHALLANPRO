import { gstBreakupForKind, lineTotalPaise, roundOffToRupee } from "../gst/tax.ts";
import { statutoryDueIso } from "../gst/dates.ts";
import type {
  BillOfSupplyDoc,
  CocDoc,
  ConversionInvoiceDoc,
  DeliveryChallanDoc,
  EwayDoc,
  GrnSlipDoc,
  GstCompany,
  GstParty,
  NoteDoc,
  PackingListDoc,
  QuoteDoc,
  TaxInvoiceDoc,
} from "./types";

export const TAMBA: GstCompany = {
  legalName: "Tamba Brass Works Private Limited",
  tradeName: "Tamba Brass",
  name: "Tamba Brass Works Private Limited",
  gstin: "24AABCT4821M1Z5",
  pan: "AABCT4821M",
  cin: "U27320GJ2014PTC081234",
  iec: "0812345678",
  lutArn: "AD2403250123456",
  lutValidUntil: "2027-03-31",
  addressLine1: "Plot 41, GIDC Odhav",
  city: "Ahmedabad",
  state: "Gujarat",
  stateCode: "24",
  pincode: "382415",
  country: "IN",
  registeredOffice: "Plot 41, GIDC Odhav, Ahmedabad, Gujarat 382415",
  phone: "+91 79 2287 4400",
  email: "accounts@tambaerp.in",
  authorisedSignatory: "Kavita Mehta",
  authorisedDesignation: "Director",
  composition: false,
  turnoverAbove5Cr: true,
  hsnDigits: 6,
  einvoiceApplicable: true,
  b2cQr: true,
  ewayThresholdPaise: 5_000_000,
  msmeCreditDays: 45,
  bankName: "HDFC Bank, Odhav",
  bankAccount: "50200011223344",
  bankIfsc: "HDFC0000482",
  registered: true,
};

const GS: GstParty = {
  name: "Gujarat Sanitary",
  gstin: "24AAGCG5520F1Z6",
  pan: "AAGCG5520F",
  addressLine1: "Narol-Naroda Highway",
  city: "Ahmedabad",
  state: "Gujarat",
  stateCode: "24",
  pincode: "382405",
  country: "IN",
  registered: true,
};

const MH: GstParty = {
  name: "Pune Sanitary Works",
  gstin: "27AABCP4410Q1Z2",
  pan: "AABCP4410Q",
  addressLine1: "Bhosari MIDC",
  city: "Pune",
  state: "Maharashtra",
  stateCode: "27",
  pincode: "411026",
  country: "IN",
  registered: true,
};

const GULF: GstParty = {
  name: "Gulf Fittings LLC",
  gstin: null,
  addressLine1: "Jebel Ali Industrial 1",
  city: "Dubai",
  state: "Dubai",
  stateCode: null,
  pincode: "00000",
  country: "AE",
  registered: false,
};

const KIRAN: GstParty = {
  name: "Kiran Platers",
  gstin: "24AAKPK4410D1Z8",
  addressLine1: "Vatva GIDC, Phase II",
  city: "Ahmedabad",
  state: "Gujarat",
  stateCode: "24",
  pincode: "382445",
  country: "IN",
  registered: true,
};

function nippleLine(kind: TaxInvoiceDoc["kind"], qty = 5000, ratePaise = 4139) {
  const kg = Math.round(qty * 0.048 * 1000) / 1000;
  const taxable = qty * ratePaise;
  const tax = gstBreakupForKind(taxable, 18, kind);
  return {
    sl: 1,
    description: 'Hex nipple 1/2" NPT, Ni-Cr plated (HEX-NIPPLE-1/2-NCR)',
    hsn: "741220",
    uqc: "NOS / KGS",
    qtyNos: qty,
    qtyKgs: kg,
    lotHeat: "LOT-26-00012 / H26-0913",
    taxablePaise: taxable,
    discountPaise: 0,
    gstPct: 18,
    cgstPaise: tax.cgst,
    sgstPaise: tax.sgst,
    igstPaise: tax.igst,
    lineTotalPaise: lineTotalPaise(taxable, 0, tax),
  };
}

function invoice(kind: TaxInvoiceDoc["kind"], billTo: GstParty, extras: Partial<TaxInvoiceDoc> = {}): TaxInvoiceDoc {
  const line = nippleLine(kind);
  const tax = { cgst: line.cgstPaise, sgst: line.sgstPaise, igst: line.igstPaise };
  const exact = line.taxablePaise + tax.cgst + tax.sgst + tax.igst;
  const { rounded, roundOff } = roundOffToRupee(exact);
  return {
    title: "TAX INVOICE",
    docNo: "INV/26-27/0001",
    docDate: "2026-09-13",
    kind,
    company: TAMBA,
    billTo,
    shipTo: billTo,
    placeOfSupply: kind.startsWith("EXPORT") ? billTo.country : `${billTo.stateCode}-${billTo.state}`,
    rcm: false,
    reverseCharge: false,
    lines: [line],
    taxablePaise: line.taxablePaise,
    discountPaise: 0,
    cgstPaise: tax.cgst,
    sgstPaise: tax.sgst,
    igstPaise: tax.igst,
    roundOffPaise: roundOff,
    totalPaise: rounded,
    netKg: line.qtyKgs,
    packingNetKg: line.qtyKgs,
    irn: "a1b2c3d4e5f6789012345678901234567890abcd1234567890abcdef12345678",
    irnAckNo: "112610012345678",
    irnAckDt: "2026-09-13",
    soNo: "SO/26-27/0002",
    msmeDueDate: "2026-10-28",
    export: null,
    ...extras,
  };
}

export const FIX_INVOICE_GJ: TaxInvoiceDoc = invoice("INTRA", GS);

export const FIX_INVOICE_MH: TaxInvoiceDoc = invoice("INTER", MH, {
  docNo: "INV/26-27/0002",
  placeOfSupply: "27-Maharashtra",
});

export const FIX_EXPORT_LUT: TaxInvoiceDoc = invoice("EXPORT_LUT", GULF, {
  docNo: "INV/26-27/0003",
  placeOfSupply: "AE — export",
  export: {
    mode: "LUT",
    currency: "USD",
    forexRate: 83.5,
    inrTaxablePaise: 20695000,
    country: "United Arab Emirates",
    port: "INAMD4 — Ahmedabad ICD",
    incoterm: "FOB Mundra",
    iec: TAMBA.iec!,
    lutArn: TAMBA.lutArn,
  },
  irn: null,
  irnAckNo: null,
  irnAckDt: null,
});

export const FIX_EXPORT_IGST: TaxInvoiceDoc = invoice("EXPORT_IGST", GULF, {
  docNo: "INV/26-27/0004",
  placeOfSupply: "AE — export",
  export: {
    mode: "IGST",
    currency: "USD",
    forexRate: 83.5,
    inrTaxablePaise: 20695000,
    country: "United Arab Emirates",
    port: "INAMD4 — Ahmedabad ICD",
    incoterm: "CIF Jebel Ali",
    iec: TAMBA.iec!,
  },
});

export const FIX_CHALLAN_OUT: DeliveryChallanDoc = {
  title: "DELIVERY CHALLAN",
  variant: "JW_OUT",
  docNo: "JW/26-27/0003",
  docDate: "2026-09-13",
  company: TAMBA,
  consigner: TAMBA,
  consignee: KIRAN,
  processName: "Nickel-chromium electroplating (Ni-Cr)",
  goodsKind: "INPUTS",
  expectedReturn: "2026-09-27",
  statutoryDue: statutoryDueIso("2026-09-13", "INPUTS"),
  placeOfSupply: "24-Gujarat",
  interState: false,
  vehicleNo: "GJ01AB4421",
  ewayNo: "EWB-STUB-000041",
  reasonCode: "3",
  taxablePaise: 20695000,
  gstPct: 18,
  taxPaise: 3725100,
  lines: [
    {
      sl: 1,
      description: 'Hex nipple 1/2" NPT, unplated SFG (HEX-NIPPLE-1/2-NCR)',
      hsn: "741220",
      uqc: "NOS / KGS",
      qtyNos: 9820,
      qtyKgs: 471.36,
      lotHeat: "LOT-26-00009 / H26-0913",
      taxablePaise: 20695000,
      discountPaise: 0,
      gstPct: 18,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      lineTotalPaise: 20695000,
    },
  ],
};

export const FIX_CHALLAN_RETURN: DeliveryChallanDoc = {
  ...FIX_CHALLAN_OUT,
  variant: "JW_RETURN",
  docNo: "JWR/26-27/0001",
  originalChallanNo: "JW/26-27/0003",
  originalChallanDate: "2026-09-13",
  lines: [
    {
      ...FIX_CHALLAN_OUT.lines[0]!,
      sentNos: 9820,
      sentKgs: 471.36,
      goodReceived: 9700,
      reject: 80,
      scrapReturned: 0,
      scrapKeptByJw: 0,
      loss: 40,
      qtyNos: 9700,
      qtyKgs: 465.6,
    },
  ],
};

export const FIX_EWAY: EwayDoc = {
  title: "FORM GST EWB-01",
  stubNo: "EWB-STUB-000041",
  docDate: "2026-09-13",
  company: TAMBA,
  partA: {
    recipientGstin: "24AAKPK4410D1Z8",
    deliveryPin: "382445",
    docNo: "JW/26-27/0003",
    docDate: "2026-09-13",
    valuePaise: 20695000,
    hsn: "741220",
    reasonCode: "3",
    reasonLabel: "Job Work",
    documentType: "Delivery Challan",
    billToGstin: "24AAKPK4410D1Z8",
    shipToGstin: "24AAKPK4410D1Z8",
  },
  partB: {
    vehicle: "GJ01AB4421",
    mode: "Road",
    transDoc: "",
    distanceKm: 18,
    skippedVehicle: false,
  },
  nicSigned: false,
};

export const FIX_CN: NoteDoc = {
  title: "CREDIT NOTE",
  kind: "CN",
  docNo: "CN/26-27/0001",
  docDate: "2026-09-13",
  originalInvoiceNo: "INV/26-27/0001",
  originalInvoiceDate: "2026-09-13",
  reason: "Rate difference — billed ₹41.39, agreed ₹40.90 (50 pcs short-shipped already invoiced).",
  company: TAMBA,
  billTo: GS,
  placeOfSupply: "24-Gujarat",
  kindSupply: "INTRA",
  lines: [nippleLine("INTRA", 50, 49)],
  taxablePaise: 50 * 49,
  cgstPaise: gstBreakupForKind(50 * 49, 18, "INTRA").cgst,
  sgstPaise: gstBreakupForKind(50 * 49, 18, "INTRA").sgst,
  igstPaise: 0,
  totalPaise: lineTotalPaise(50 * 49, 0, gstBreakupForKind(50 * 49, 18, "INTRA")),
};

export const FIX_DN: NoteDoc = {
  ...FIX_CN,
  title: "DEBIT NOTE",
  kind: "DN",
  docNo: "DN/26-27/0001",
  reason: "Excess process loss at job worker vs 1.5% norm — metal debit (draft).",
};

export const FIX_PACKING: PackingListDoc = {
  title: "PACKING LIST",
  docNo: "PL/26-27/0001",
  docDate: "2026-09-13",
  invoiceNo: "INV/26-27/0001",
  invoiceDate: "2026-09-13",
  invoiceNetKg: 240,
  packingNetKg: 240,
  packingGrossKg: 244.8,
  company: TAMBA,
  consignee: GS,
  countryOfOrigin: "India",
  cartonMarks: "TAMBA / GS / HEX-NIPPLE-1/2-NCR / C001–C010",
  cartons: Array.from({ length: 10 }, (_, i) => ({
    cartonNo: `C${String(i + 1).padStart(3, "0")}`,
    description: 'Hex nipple 1/2" NPT Ni-Cr',
    lotHeat: "LOT-26-00012 / H26-0913",
    qtyNos: 500,
    netKg: 24,
    grossKg: 24.48,
  })),
};

export const FIX_GRN: GrnSlipDoc = {
  title: "GRN / WEIGHMENT SLIP",
  docNo: "GRN/26-27/0001",
  docDate: "2026-09-13",
  company: TAMBA,
  vendor: {
    name: "Rajeshwar Metals",
    gstin: "24AARFR2291C1Z3",
    addressLine1: "Jamalpur Metal Market",
    city: "Ahmedabad",
    state: "Gujarat",
    stateCode: "24",
    pincode: "380001",
    country: "IN",
    registered: true,
  },
  vehicleNo: "GJ01AB4421",
  alloy: "C36000",
  sku: "ROD-C360-12MM",
  heatNo: "H26-0913",
  grossKg: 1262.8,
  tareKg: 12.3,
  netKg: 1250.5,
  qcStatus: "RELEASED",
};

export const FIX_COC: CocDoc = {
  title: "CERTIFICATE OF CONFORMANCE",
  docNo: "COC/26-27/0001",
  docDate: "2026-09-13",
  company: TAMBA,
  customer: GS,
  sku: "HEX-NIPPLE-1/2-NCR",
  description: 'Hex nipple 1/2" NPT, Ni-Cr plated',
  alloySpec: "C36000 / ASTM B16 — Cu 61.5% Zn 35.4% Pb 3.1%",
  drawingNo: "TBW-NIP-012",
  drawingRev: "C",
  lotNo: "LOT-26-00012",
  heatNo: "H26-0913",
  qtyNos: 5000,
  qtyKgs: 240,
  qaSignatory: "Anjali Trivedi, QC",
};

export const FIX_QUOTE: QuoteDoc = {
  title: "QUOTATION",
  docNo: "QTN/26-27/0001",
  docDate: "2026-06-04",
  validUntil: "2026-07-04",
  company: TAMBA,
  customer: GS,
  metalRateDate: "2026-06-01",
  cuPaisePerKg: 81000,
  znPaisePerKg: 26500,
  lines: [
    {
      sl: 1,
      sku: "HEX-NIPPLE-1/2-NCR",
      description: 'Hex nipple 1/2" NPT, Ni-Cr plated',
      qtyNos: 10000,
      metalPaise: 3069,
      conversionPaise: 450,
      jwPaise: 180,
      packingPaise: 40,
      overheadPaise: 80,
      marginPaise: 150,
      unitPricePaise: 3969,
    },
  ],
};

export const FIX_CONVERSION: ConversionInvoiceDoc = {
  ...invoice("INTRA", GS, { docNo: "SI/26-27/0001" }),
  service: true,
  sac: "9988",
  lines: [
    {
      sl: 1,
      description: "Job-work conversion — machining & inspection on customer-owned C360 rod (SAC 9988)",
      hsn: "9988",
      sac: "9988",
      uqc: "NOS",
      qtyNos: 2000,
      qtyKgs: 0,
      taxablePaise: 3600000,
      discountPaise: 0,
      gstPct: 18,
      cgstPaise: gstBreakupForKind(3600000, 18, "INTRA").cgst,
      sgstPaise: gstBreakupForKind(3600000, 18, "INTRA").sgst,
      igstPaise: gstBreakupForKind(3600000, 18, "INTRA").igst,
      lineTotalPaise: lineTotalPaise(3600000, 0, gstBreakupForKind(3600000, 18, "INTRA")),
    },
  ],
  taxablePaise: 3600000,
  cgstPaise: gstBreakupForKind(3600000, 18, "INTRA").cgst,
  sgstPaise: gstBreakupForKind(3600000, 18, "INTRA").sgst,
  igstPaise: 0,
  totalPaise: lineTotalPaise(3600000, 0, gstBreakupForKind(3600000, 18, "INTRA")),
  netKg: 0,
  packingNetKg: 0,
  irn: null,
};

export const FIX_BOS: BillOfSupplyDoc = {
  title: "BILL OF SUPPLY",
  docNo: "BOS/26-27/0001",
  docDate: "2026-09-13",
  company: { ...TAMBA, composition: true },
  billTo: GS,
  lines: [
    {
      sl: 1,
      description: 'Hex nipple 1/2" NPT Ni-Cr',
      hsn: "741220",
      qtyNos: 100,
      qtyKgs: 4.8,
      amountPaise: 413900,
    },
  ],
  totalPaise: 413900,
};

/** Illegal serial (#) — BLOCK PRINT demo. */
export const FIX_SERIAL_BLOCK: TaxInvoiceDoc = {
  ...FIX_INVOICE_GJ,
  docNo: "INV/26-27/#001",
};

export const FIX_POUR = {
  title: "POUR SLIP" as const,
  docNo: "POUR/26-27/0001",
  docDate: "2026-09-14",
  heatNo: "HT/26-27/0001",
  furnace: "MELT-1",
  alloy: "C36000",
  goodKg: 80,
  castingLotNo: "LOT/26-27/FOUNDRY-1",
  castingHeatNo: "HT/26-27/0001",
  charges: [{ lotNo: "LOT/26-27/ISO-C360", sku: "SC-C360-TURN", qtyKg: 100 }],
  company: TAMBA,
  notTaxInvoice: true as const,
};

export const FIX_KNOCKOUT = {
  title: "KNOCKOUT SLIP" as const,
  docNo: "KO/26-27/0001",
  docDate: "2026-09-14",
  heatNo: "HT/26-27/0001",
  furnace: "MELT-1",
  alloy: "C36000",
  runnerKg: 15,
  drossKg: 3,
  rejectKg: 0,
  runnerLotNo: "LOT/26-27/RUNNER-1",
  drossLotNo: "LOT/26-27/DROSS-1",
  drossToVariance: false,
  company: TAMBA,
  notTaxInvoice: true as const,
};

export const DOC_INDEX: { slug: string; title: string; law: string }[] = [
  { slug: "invoice", title: "Tax invoice — GJ→GJ (CGST+SGST)", law: "CGST Act s.31 · Rule 46" },
  { slug: "invoice-mh", title: "Tax invoice — GJ→MH (IGST)", law: "IGST Act s.5 · Rule 46" },
  { slug: "export-lut", title: "Export invoice — LUT (0 tax)", law: "Rule 46 · LUT/Bond" },
  { slug: "export-igst", title: "Export invoice — IGST paid", law: "Rule 46 · IGST on export" },
  { slug: "challan", title: "Job-work delivery challan (OUT)", law: "s.143 · Rules 45 + 55" },
  { slug: "challan-return", title: "Job-work return challan", law: "s.143 · Rule 55" },
  { slug: "eway", title: "E-way bill Form GST EWB-01", law: "s.68 · Rule 138" },
  { slug: "cn", title: "Credit note", law: "s.34 · Rule 53" },
  { slug: "dn", title: "Debit note", law: "s.34 · Rule 53" },
  { slug: "packing", title: "Packing list", law: "Export / factory practice" },
  { slug: "grn", title: "GRN / weighment slip", law: "Factory weighment" },
  { slug: "coc", title: "Certificate of conformance", law: "QA — not BIS/NABL" },
  { slug: "quote", title: "Quotation", law: "Not a tax invoice" },
  { slug: "conversion", title: "Job-work service invoice (SAC 9988)", law: "s.31 · Rule 46 (service)" },
  { slug: "bos", title: "Bill of supply (composition)", law: "Rule 49" },
  { slug: "registers", title: "Registers (GSTR-1 / ITC-04 / e-way)", law: "Returns worksheets" },
  { slug: "serial-block", title: "Blocked invoice (illegal serial #)", law: "Rule 46 serial" },
  { slug: "pour", title: "Pour slip (shop)", law: "Factory — not a tax invoice · no IRN" },
  { slug: "knockout", title: "Knockout slip (shop)", law: "Factory — not a tax invoice · no IRN" },
];
