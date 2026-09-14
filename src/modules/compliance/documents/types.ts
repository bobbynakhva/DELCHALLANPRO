import type { SupplyKind } from "../gst/tax.ts";

export type GstParty = {
  name: string;
  gstin?: string | null;
  pan?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  stateCode?: string | null;
  pincode: string;
  country: string;
  registered?: boolean;
};

export type GstCompany = GstParty & {
  legalName: string;
  tradeName: string;
  cin?: string | null;
  iec?: string | null;
  lutArn?: string | null;
  lutValidUntil?: string | null;
  registeredOffice?: string | null;
  phone?: string | null;
  email?: string | null;
  authorisedSignatory: string;
  authorisedDesignation: string;
  composition: boolean;
  turnoverAbove5Cr: boolean;
  hsnDigits: number;
  einvoiceApplicable: boolean;
  b2cQr: boolean;
  ewayThresholdPaise: number;
  msmeCreditDays: number;
  bankName?: string | null;
  bankAccount?: string | null;
  bankIfsc?: string | null;
};

export type GstLine = {
  sl: number;
  description: string;
  hsn: string;
  uqc: string;
  qtyNos: number;
  qtyKgs: number;
  lotHeat?: string | null;
  taxablePaise: number;
  discountPaise: number;
  gstPct: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  lineTotalPaise: number;
  sac?: string | null;
  provisional?: boolean;
};

export type TaxInvoiceDoc = {
  title: "TAX INVOICE";
  docNo: string;
  docDate: string;
  kind: SupplyKind;
  company: GstCompany;
  billTo: GstParty;
  shipTo: GstParty;
  placeOfSupply: string;
  rcm: boolean;
  lines: GstLine[];
  taxablePaise: number;
  discountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  roundOffPaise: number;
  totalPaise: number;
  netKg: number;
  packingNetKg?: number | null;
  irn?: string | null;
  irnAckNo?: string | null;
  irnAckDt?: string | null;
  signedQr?: string | null;
  irnStatus?: "ACT" | "CNL" | null;
  soNo?: string | null;
  ewayNo?: string | null;
  reverseCharge: boolean;
  msmeDueDate?: string | null;
  export?: {
    mode: "LUT" | "IGST";
    currency: string;
    forexRate: number;
    inrTaxablePaise: number;
    country: string;
    port: string;
    incoterm: string;
    iec: string;
    lutArn?: string | null;
  } | null;
  vehicleNo?: string | null;
};

export type ChallanGoodsKind = "INPUTS" | "SEMI" | "CAPITAL";

export type DeliveryChallanDoc = {
  title: "DELIVERY CHALLAN";
  variant: "JW_OUT" | "JW_RETURN";
  docNo: string;
  docDate: string;
  company: GstCompany;
  consigner: GstParty;
  consignee: GstParty;
  processName: string;
  goodsKind: ChallanGoodsKind;
  expectedReturn: string;
  statutoryDue: string;
  placeOfSupply?: string | null;
  interState: boolean;
  vehicleNo?: string | null;
  ewayNo?: string | null;
  reasonCode: "3";
  lines: Array<
    GstLine & {
      sentNos?: number;
      sentKgs?: number;
      goodReceived?: number;
      reject?: number;
      scrapReturned?: number;
      scrapKeptByJw?: number;
      loss?: number;
    }
  >;
  taxablePaise: number;
  gstPct: number;
  taxPaise: number;
  originalChallanNo?: string | null;
  originalChallanDate?: string | null;
  ageDays?: number;
};

export type EwayDoc = {
  title: "FORM GST EWB-01";
  stubNo: string;
  docDate: string;
  company: GstCompany;
  partA: {
    recipientGstin: string;
    deliveryPin: string;
    docNo: string;
    docDate: string;
    valuePaise: number;
    hsn: string;
    reasonCode: string;
    reasonLabel: string;
    documentType: string;
    billToGstin: string;
    shipToGstin: string;
  };
  partB: {
    vehicle: string;
    mode: "Road" | "Rail" | "Air" | "Ship";
    transDoc: string;
    distanceKm: number;
    skippedVehicle: boolean;
  };
  nicSigned: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  ewbNo?: string | null;
  subSupplyType?: string | null;
};

export type NoteDoc = {
  title: "CREDIT NOTE" | "DEBIT NOTE";
  kind: "CN" | "DN";
  docNo: string;
  docDate: string;
  originalInvoiceNo: string;
  originalInvoiceDate: string;
  reason: string;
  company: GstCompany;
  billTo: GstParty;
  placeOfSupply: string;
  kindSupply: SupplyKind;
  lines: GstLine[];
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  irn?: string | null;
  irnAckNo?: string | null;
  irnAckDt?: string | null;
  signedQr?: string | null;
};

export type PackingListDoc = {
  title: "PACKING LIST";
  docNo: string;
  docDate: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceNetKg: number;
  packingNetKg: number;
  packingGrossKg: number;
  company: GstCompany;
  consignee: GstParty;
  countryOfOrigin: "India";
  cartonMarks: string;
  cartons: Array<{
    cartonNo: string;
    description: string;
    lotHeat: string;
    qtyNos: number;
    netKg: number;
    grossKg: number;
  }>;
};

export type GrnSlipDoc = {
  title: "GRN / WEIGHMENT SLIP";
  docNo: string;
  docDate: string;
  company: GstCompany;
  vendor: GstParty;
  vehicleNo: string;
  alloy: string;
  sku: string;
  heatNo: string;
  grossKg: number;
  tareKg: number;
  netKg: number;
  qcStatus: "QC HOLD" | "RELEASED";
};

export type CocDoc = {
  title: "CERTIFICATE OF CONFORMANCE";
  docNo: string;
  docDate: string;
  company: GstCompany;
  customer: GstParty;
  sku: string;
  description: string;
  alloySpec: string;
  drawingNo: string;
  drawingRev: string;
  lotNo: string;
  heatNo: string;
  qtyNos: number;
  qtyKgs: number;
  qaSignatory: string;
};

export type QuoteDoc = {
  title: "QUOTATION";
  docNo: string;
  docDate: string;
  validUntil: string;
  company: GstCompany;
  customer: GstParty;
  metalRateDate: string;
  cuPaisePerKg: number;
  znPaisePerKg: number;
  lines: Array<{
    sl: number;
    sku: string;
    description: string;
    qtyNos: number;
    metalPaise: number;
    conversionPaise: number;
    jwPaise: number;
    packingPaise: number;
    overheadPaise: number;
    marginPaise: number;
    unitPricePaise: number;
  }>;
};

export type ConversionInvoiceDoc = TaxInvoiceDoc & {
  title: "TAX INVOICE";
  service: true;
  sac: string;
};

export type BillOfSupplyDoc = {
  title: "BILL OF SUPPLY";
  docNo: string;
  docDate: string;
  company: GstCompany;
  billTo: GstParty;
  lines: Array<{ sl: number; description: string; hsn: string; qtyNos: number; qtyKgs: number; amountPaise: number }>;
  totalPaise: number;
};

export const INVOICE_COPIES = [
  "ORIGINAL FOR RECIPIENT",
  "DUPLICATE FOR TRANSPORTER",
  "TRIPLICATE FOR SUPPLIER",
] as const;

export const CHALLAN_COPIES = [
  "ORIGINAL FOR CONSIGNEE",
  "DUPLICATE FOR TRANSPORTER",
  "TRIPLICATE FOR CONSIGNER",
] as const;

export const EWAY_REASONS: Record<string, string> = {
  "1": "Supply",
  "2": "Export or Import",
  "3": "Job Work",
  "4": "SKD or CKD",
  "5": "Recipient not known",
  "6": "Line Sales",
  "7": "Sales Return",
  "8": "Exhibition or fairs",
  "9": "For own use",
  "0": "Others",
};
