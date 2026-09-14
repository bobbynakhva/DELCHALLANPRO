/** Part A from invoice snapshot or JW challan. JW MUST be subSupplyType 3 / docType CHL. */
import { formatDateIN } from "../gst/dates.ts";
import { EWAY_REASONS } from "../documents/types.ts";
import type { DeliveryChallanDoc, TaxInvoiceDoc } from "../documents/types.ts";
import type { EwayPartA, EwayPartB } from "./types.ts";

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function pin(p: string | null | undefined): number {
  const d = String(p ?? "").replace(/\D/g, "").slice(0, 6);
  const x = Number(d);
  return Number.isFinite(x) ? x : 0;
}

function stcd(s: string | null | undefined): number {
  return Number(String(s ?? "24").padStart(2, "0")) || 24;
}

export function ewayRequired(opts: {
  valuePaise: number;
  thresholdPaise: number;
  interState: boolean;
  force?: boolean;
  jwForce?: boolean;
}): boolean {
  if (opts.force || opts.jwForce) return true;
  if (opts.interState) return true;
  return n(opts.valuePaise) >= n(opts.thresholdPaise);
}

export function mapInvoiceToEwayPartA(snapshot: TaxInvoiceDoc): EwayPartA {
  const line = snapshot.lines[0];
  const inter = snapshot.kind === "INTER" || snapshot.kind.startsWith("EXPORT");
  const reason = snapshot.kind.startsWith("EXPORT") ? "2" : "1";
  const shipGstin = snapshot.shipTo.gstin || snapshot.billTo.gstin || "URP";
  return {
    supplyType: "O",
    subSupplyType: "1",
    subSupplyDesc: EWAY_REASONS[reason] ?? "Supply",
    docType: "INV",
    docNo: snapshot.docNo,
    docDate: formatDateIN(snapshot.docDate),
    fromGstin: snapshot.company.gstin ?? "",
    fromTrdName: snapshot.company.tradeName || snapshot.company.legalName,
    fromAddr1: snapshot.company.addressLine1,
    fromPlace: snapshot.company.city,
    fromPincode: pin(snapshot.company.pincode),
    fromStateCode: stcd(snapshot.company.stateCode),
    toGstin: snapshot.billTo.gstin || "URP",
    toTrdName: snapshot.billTo.name,
    toAddr1: snapshot.billTo.addressLine1,
    toPlace: snapshot.billTo.city,
    toPincode: pin(snapshot.billTo.pincode),
    toStateCode: stcd(snapshot.billTo.stateCode),
    billToGstin: snapshot.billTo.gstin || "URP",
    shipToGstin: shipGstin,
    transType: reason,
    transTypeDesc: EWAY_REASONS[reason] ?? "Supply",
    totalValue: Math.round(n(snapshot.totalPaise)) / 100,
    cgstValue: Math.round(n(snapshot.cgstPaise)) / 100,
    sgstValue: Math.round(n(snapshot.sgstPaise)) / 100,
    igstValue: Math.round(n(snapshot.igstPaise)) / 100,
    hsnCode: line?.hsn ?? "",
    quantity: n(line?.qtyNos) || n(line?.qtyKgs),
    qtyUnit: n(line?.qtyNos) > 0 ? "NOS" : "KGS",
  };
  void inter;
}

export function mapChallanToEwayPartA(challan: DeliveryChallanDoc): EwayPartA {
  const line = challan.lines[0];
  const toGstin = challan.consignee.gstin || "URP";
  return {
    supplyType: "O",
    subSupplyType: "3",
    subSupplyDesc: "Job Work",
    docType: "CHL",
    docNo: challan.docNo,
    docDate: formatDateIN(challan.docDate),
    fromGstin: challan.company.gstin ?? "",
    fromTrdName: challan.company.tradeName || challan.company.legalName,
    fromAddr1: challan.company.addressLine1,
    fromPlace: challan.company.city,
    fromPincode: pin(challan.company.pincode),
    fromStateCode: stcd(challan.company.stateCode),
    toGstin,
    toTrdName: challan.consignee.name,
    toAddr1: challan.consignee.addressLine1,
    toPlace: challan.consignee.city,
    toPincode: pin(challan.consignee.pincode),
    toStateCode: stcd(challan.consignee.stateCode),
    billToGstin: toGstin,
    shipToGstin: toGstin,
    transType: "3",
    transTypeDesc: "Job Work",
    totalValue: Math.round(n(challan.taxablePaise)) / 100,
    cgstValue: 0,
    sgstValue: 0,
    igstValue: 0,
    hsnCode: line?.hsn ?? "741220",
    quantity: n(line?.qtyNos) || n(line?.qtyKgs),
    qtyUnit: n(line?.qtyNos) > 0 ? "NOS" : "KGS",
  };
}

export const VEHICLE_RE = /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{4}$/;

export function mapPartB(opts: {
  vehicle?: string;
  distanceKm: number;
  mode?: EwayPartB["transModeLabel"];
  transDoc?: string;
  skipSameState50km?: boolean;
  sameState?: boolean;
}): EwayPartB {
  const skip = Boolean(opts.skipSameState50km);
  if (skip) {
    if (!opts.sameState || n(opts.distanceKm) > 50) {
      throw new Error("Skip vehicle is only allowed for ≤ 50 km same State/UT.");
    }
  } else {
    const v = (opts.vehicle ?? "").toUpperCase().replace(/\s/g, "");
    if (!VEHICLE_RE.test(v)) {
      throw new Error("Part B needs a vehicle in the form GJ01AB1234 (or tick ≤ 50 km same State/UT).");
    }
  }
  const mode = opts.mode ?? "Road";
  const transMode = mode === "Rail" ? "2" : mode === "Air" ? "3" : mode === "Ship" ? "4" : "1";
  return {
    vehicleNo: skip ? "" : (opts.vehicle ?? "").toUpperCase().replace(/\s/g, ""),
    transMode,
    transModeLabel: mode,
    transDistance: n(opts.distanceKm),
    transDocNo: opts.transDoc,
    skipSameState50km: skip,
  };
}

/** Rule 138 — validity starts at Part B. One day per 200 km, minimum one day. */
export function ewayValidity(validFrom: Date, distanceKm: number): { validFrom: Date; validUntil: Date } {
  const days = Math.max(1, Math.ceil(Math.max(0, n(distanceKm)) / 200));
  return { validFrom, validUntil: new Date(validFrom.getTime() + days * 24 * 3600 * 1000) };
}
