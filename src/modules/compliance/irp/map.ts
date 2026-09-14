/** mapInvoiceToIrpPayload — snapshot only. Do not read live Item.hsn. */
import { formatDateIN } from "../gst/dates.ts";
import type { NoteDoc, TaxInvoiceDoc } from "../documents/types.ts";
import type { IrpDocTyp, IrpItem, IrpPayload, IrpSupTyp, IrpValDtls } from "./types.ts";

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function rupees2(paise: unknown): number {
  return Math.round(n(paise)) / 100;
}

export function round2(v: number): number {
  return Math.round(n(v) * 100) / 100;
}

function pinOf(p: string | null | undefined): number {
  const d = String(p ?? "").replace(/\D/g, "").slice(0, 6);
  const n0 = Number(d);
  return Number.isFinite(n0) ? n0 : 0;
}

function party(
  src: {
    gstin?: string | null;
    legalName?: string;
    tradeName?: string;
    name: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    pincode: string;
    stateCode?: string | null;
    phone?: string | null;
    email?: string | null;
  },
  pos?: string | null,
) {
  return {
    Gstin: src.gstin || "URP",
    LglNm: src.legalName || src.name,
    TrdNm: src.tradeName || src.name,
    Addr1: src.addressLine1,
    Addr2: src.addressLine2 ?? null,
    Loc: src.city,
    Pin: pinOf(src.pincode),
    Stcd: (src.stateCode ?? "96").padStart(2, "0"),
    Ph: src.phone ?? null,
    Em: src.email ?? null,
    ...(pos ? { Pos: pos } : {}),
  };
}

export function supTypOf(kind: TaxInvoiceDoc["kind"]): IrpSupTyp {
  if (kind === "EXPORT_LUT") return "EXPWOP";
  if (kind === "EXPORT_IGST") return "EXPWP";
  return "B2B";
}

export function valDtlsFromSnapshot(doc: Pick<TaxInvoiceDoc, "taxablePaise" | "cgstPaise" | "sgstPaise" | "igstPaise" | "discountPaise" | "roundOffPaise" | "totalPaise">): IrpValDtls {
  return {
    AssVal: rupees2(doc.taxablePaise),
    CgstVal: rupees2(doc.cgstPaise),
    SgstVal: rupees2(doc.sgstPaise),
    IgstVal: rupees2(doc.igstPaise),
    Discount: rupees2(doc.discountPaise),
    OthChrg: 0,
    RndOffAmt: rupees2(doc.roundOffPaise),
    TotInvVal: rupees2(doc.totalPaise),
  };
}

export function assertValDtlsMatch(payload: IrpPayload, snapshot: Parameters<typeof valDtlsFromSnapshot>[0]): void {
  const expected = valDtlsFromSnapshot(snapshot);
  const keys: Array<keyof IrpValDtls> = ["AssVal", "CgstVal", "SgstVal", "IgstVal", "TotInvVal"];
  for (const k of keys) {
    if (round2(payload.ValDtls[k]) !== round2(expected[k])) {
      throw new Error(
        `IRN blocked — ValDtls.${k} ${payload.ValDtls[k]} ≠ posted snapshot ${expected[k]} (2 decimals)`,
      );
    }
  }
  const lineAss = round2(payload.ItemList.reduce((s, l) => s + l.AssAmt, 0));
  if (lineAss !== round2(payload.ValDtls.AssVal)) {
    throw new Error(`IRN blocked — ItemList AssAmt ${lineAss} ≠ ValDtls.AssVal ${payload.ValDtls.AssVal}`);
  }
}

function itemFromLine(l: TaxInvoiceDoc["lines"][number], i: number): IrpItem {
  const nos = n(l.qtyNos) > 0;
  const qty = nos ? n(l.qtyNos) : n(l.qtyKgs);
  const ass = rupees2(l.taxablePaise);
  const unitPrice = qty > 0 ? round2(ass / qty) : ass;
  return {
    SlNo: String(l.sl || i + 1),
    PrdDesc: l.description,
    IsServc: l.sac ? "Y" : "N",
    HsnCd: l.hsn,
    Qty: qty,
    Unit: nos ? "NOS" : "KGS",
    UnitPrice: unitPrice,
    TotAmt: ass + rupees2(l.discountPaise),
    Discount: rupees2(l.discountPaise),
    PreTaxVal: ass,
    AssAmt: ass,
    GstRt: n(l.gstPct),
    IgstAmt: rupees2(l.igstPaise),
    CgstAmt: rupees2(l.cgstPaise),
    SgstAmt: rupees2(l.sgstPaise),
    TotItemVal: rupees2(l.lineTotalPaise),
  };
}

function assertDocNo(no: string): string {
  const s = no.trim();
  if (s.length > 16) throw new Error(`IRN blocked — DocDtls.No exceeds 16 characters: ${s}`);
  if (!/^[A-Za-z0-9/-]+$/.test(s)) throw new Error(`IRN blocked — DocDtls.No has illegal characters: ${s}`);
  return s;
}

function shipDiffers(bill: TaxInvoiceDoc["billTo"], ship: TaxInvoiceDoc["shipTo"]): boolean {
  if (!ship) return false;
  return (
    (ship.gstin || "") !== (bill.gstin || "") ||
    ship.addressLine1 !== bill.addressLine1 ||
    (ship.pincode || "") !== (bill.pincode || "")
  );
}

export function mapInvoiceToIrpPayload(snapshot: TaxInvoiceDoc, typ: IrpDocTyp = "INV"): IrpPayload {
  const sup = supTypOf(snapshot.kind);
  const pos =
    snapshot.kind.startsWith("EXPORT") ? "96" : (snapshot.billTo.stateCode ?? snapshot.company.stateCode ?? "24");
  const items = snapshot.lines.map(itemFromLine);
  const payload: IrpPayload = {
    Version: "1.1",
    TranDtls: {
      TaxSch: "GST",
      SupTyp: sup,
      RegRev: snapshot.rcm || snapshot.reverseCharge ? "Y" : "N",
      IgstOnIntra: "N",
    },
    DocDtls: {
      Typ: typ,
      No: assertDocNo(snapshot.docNo),
      Dt: formatDateIN(snapshot.docDate),
    },
    SellerDtls: party(snapshot.company),
    BuyerDtls: party(snapshot.billTo, pos),
    ItemList: items,
    ValDtls: valDtlsFromSnapshot(snapshot),
  };
  if (shipDiffers(snapshot.billTo, snapshot.shipTo)) {
    payload.ShipDtls = party(snapshot.shipTo);
  }
  assertValDtlsMatch(payload, snapshot);
  return payload;
}

export function mapNoteToIrpPayload(note: NoteDoc): IrpPayload {
  const fake: TaxInvoiceDoc = {
    title: "TAX INVOICE",
    docNo: note.docNo,
    docDate: note.docDate,
    kind: note.kindSupply,
    company: note.company,
    billTo: note.billTo,
    shipTo: note.billTo,
    placeOfSupply: note.placeOfSupply,
    rcm: false,
    reverseCharge: false,
    lines: note.lines,
    taxablePaise: note.taxablePaise,
    discountPaise: 0,
    cgstPaise: note.cgstPaise,
    sgstPaise: note.sgstPaise,
    igstPaise: note.igstPaise,
    roundOffPaise: 0,
    totalPaise: note.totalPaise,
    netKg: 0,
  };
  return mapInvoiceToIrpPayload(fake, note.kind === "DN" ? "DBN" : "CRN");
}
