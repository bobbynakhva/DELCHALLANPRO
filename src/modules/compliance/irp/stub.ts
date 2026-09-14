/** Deterministic stub IRP — same payload → same IRN. Offline. */
import { createHash } from "node:crypto";
import type { IrpPayload, IrpSimulate, StubIrnResult } from "./types.ts";

export const CANCEL_CREDIT_NOTE_MSG = "Cancel window closed. Issue a credit note (s.34).";

export function irnKey(payload: IrpPayload): string {
  return `${payload.SellerDtls.Gstin}|${payload.DocDtls.No}|${payload.DocDtls.Dt}|${payload.ValDtls.TotInvVal}`;
}

export function signedQrJson(payload: IrpPayload, irn: string): string {
  return JSON.stringify({
    SellerGstin: payload.SellerDtls.Gstin,
    BuyerGstin: payload.BuyerDtls.Gstin,
    DocNo: payload.DocDtls.No,
    DocTyp: payload.DocDtls.Typ,
    DocDt: payload.DocDtls.Dt,
    TotInvVal: payload.ValDtls.TotInvVal,
    ItemCnt: payload.ItemList.length,
    MainHsnCode: payload.ItemList[0]?.HsnCd ?? "",
    Irn: irn,
  });
}

export function stubGenerateIrn(payload: IrpPayload, opts?: { simulate?: IrpSimulate; now?: Date }): StubIrnResult {
  if (opts?.simulate === "invalidGstin") {
    throw new Error("Invalid GSTIN — IRP rejected (stub).");
  }
  if (opts?.simulate === "duplicate") {
    throw new Error("Duplicate IRN — document already reported (stub).");
  }
  const hex = createHash("sha256").update(irnKey(payload)).digest("hex");
  const ackNo = String(parseInt(hex.slice(0, 13), 16) % 1e13).padStart(13, "0");
  const ackDt = (opts?.now ?? new Date()).toISOString();
  return { Irn: hex, AckNo: ackNo, AckDt: ackDt, SignedQR: signedQrJson(payload, hex), Status: "ACT" };
}

export function cancelWindowOpen(ackDtIso: string, now: Date = new Date()): boolean {
  const ack = new Date(ackDtIso);
  if (Number.isNaN(ack.getTime())) return false;
  return now.getTime() < ack.getTime() + 24 * 3600 * 1000;
}

export function assertCancelWindow(ackDtIso: string, now: Date = new Date()): void {
  if (!cancelWindowOpen(ackDtIso, now)) throw new Error(CANCEL_CREDIT_NOTE_MSG);
}
