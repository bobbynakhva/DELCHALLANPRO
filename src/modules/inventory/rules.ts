/**
 * Pure posting rules — no I/O. The stock writer (posting.ts) and the screens
 * share these so a kg never disappears and a test can fail the slice without a DB.
 */

export const MOVE_TYPES = [
  "GRN_RECEIPT",
  "QC_RELEASE",
  "QC_REJECT",
  "WO_ISSUE",
  "WO_BACKFLUSH",
  "WO_RECEIPT_SFG_FG",
  "WO_SCRAP",
  "ADJUST_PLUS",
  "ADJUST_MINUS",
  "TRANSFER",
  "JW_OUT",
  "JW_RETURN_GOOD",
  "JW_RETURN_REJECT",
  "JW_RETURN_SCRAP",
  "JW_EXCESS_LOSS",
  "JW_IN_RECEIVE",
  "JW_IN_CONSUME",
  "JW_IN_RETURN",
  "DISPATCH",
  "SALES_RETURN",
  "MELT_OUT",
  "MELT_CHARGE",
  "MELT_POUR",
  "MELT_RUNNER",
  "MELT_DROSS",
  "MELT_REJECT",
  "MELT_YIELD_LOSS",
  "OPENING",
  "OPENING_STOCK",
] as const;

export type MoveType = (typeof MOVE_TYPES)[number];

export const REASON_CODES = {
  SCRAP: [
    "SCRAP-TURN",
    "SCRAP-FLASH",
    "SCRAP-RUNNER",
    "SCRAP-DROSS",
    "SCRAP-PLATE-STRIP",
    "SCRAP-QC",
  ],
  REJ: [
    "REJ-DIM",
    "REJ-POROSITY",
    "REJ-THREAD",
    "REJ-PLATE-THK",
    "REJ-PLATE-ADH",
    "REJ-MIXED-ALLOY",
    "REJ-HANDLE",
  ],
  ADJ: ["ADJ-COUNT", "ADJ-UOM-ERROR", "ADJ-THEFT-INVESTIGATE"],
} as const;

export const ALL_REASON_CODES: string[] = [
  ...REASON_CODES.SCRAP,
  ...REASON_CODES.REJ,
  ...REASON_CODES.ADJ,
];

export const CONV_TOL = { ROD: 0.005, FG: 0.001 } as const;

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function roundKg(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function runningKg(deltas: number[]): number {
  return roundKg(deltas.reduce((s, d) => s + d, 0));
}

export function runningPcs(deltas: number[]): number {
  return Math.round(deltas.reduce((s, d) => s + d, 0));
}

/** Lot-tracked metal/SFG/FG/scrap always carries a lot. */
export function assertLotRequired(lotId: number | null | undefined, itemType?: string): void {
  if (lotId == null || !Number.isFinite(Number(lotId)) || Number(lotId) <= 0) {
    throw new Error("Lot-tracked item requires a lot — no silent any-lot pick");
  }
  void itemType;
}

export function assertAlloyMatch(opts: {
  lotAlloyId?: number | null;
  itemAlloyId?: number | null;
  lotAlloyCode?: string | null;
  itemAlloyCode?: string | null;
  context?: string;
}): void {
  const a = opts.lotAlloyId ?? null;
  const b = opts.itemAlloyId ?? null;
  if (a != null && b != null && Number(a) !== Number(b)) {
    throw new Error(
      `Alloy mismatch${opts.context ? ` (${opts.context})` : ""}: lot alloy #${a} ≠ item alloy #${b}. Cannot issue a ${opts.lotAlloyCode ?? "foreign"} lot onto a ${opts.itemAlloyCode ?? "different"} component.`,
    );
  }
  const ca = (opts.lotAlloyCode ?? "").trim();
  const cb = (opts.itemAlloyCode ?? "").trim();
  if (ca && cb && ca !== cb) {
    throw new Error(
      `Cannot issue ${ca} lot to a ${cb} component${opts.context ? ` (${opts.context})` : ""}.`,
    );
  }
}

/**
 * qtyKg vs qtyPcs must agree with the item/BOM conversion.
 * Skip when the unused UOM is 0 (rod issued by kg only).
 */
export function assertConversion(opts: {
  qtyKg: number;
  qtyPcs: number;
  kgPerPc: number;
  kind: keyof typeof CONV_TOL;
  context?: string;
}): void {
  const kg = Math.abs(n(opts.qtyKg));
  const pcs = Math.abs(n(opts.qtyPcs));
  const per = n(opts.kgPerPc);
  if (pcs === 0 || per <= 0 || kg === 0) return;
  const theoretical = pcs * per;
  const tol = CONV_TOL[opts.kind];
  const denom = Math.max(theoretical, kg);
  const rel = Math.abs(kg - theoretical) / denom;
  if (rel > tol) {
    throw new Error(
      `Qty kg ${kg.toFixed(3)} vs ${pcs} pcs × ${per} kg/pc = ${theoretical.toFixed(3)} kg exceeds ${opts.kind === "ROD" ? "0.5%" : "0.1%"} conversion tolerance${opts.context ? ` (${opts.context})` : ""}.`,
    );
  }
}

export function assertSufficient(opts: {
  haveKg?: number;
  takeKg?: number;
  havePcs?: number;
  takePcs?: number;
  what?: string;
}): void {
  const haveKg = n(opts.haveKg);
  const takeKg = n(opts.takeKg);
  if (takeKg > 0 && haveKg + 0.0005 < takeKg) {
    throw new Error(`Cannot ${opts.what ?? "issue"} ${takeKg.toFixed(3)} kg — lot has ${haveKg.toFixed(3)} kg`);
  }
  const havePcs = n(opts.havePcs);
  const takePcs = n(opts.takePcs);
  if (takePcs > 0 && havePcs + 0.0005 < takePcs) {
    throw new Error(`Cannot ${opts.what ?? "dispatch"} ${takePcs} pcs — lot has ${havePcs} pcs`);
  }
}

export function packingKgMatch(invoiceNetKg: number, packingNetKg: number): { ok: true } | { ok: false; delta: number } {
  const d = Math.abs(n(invoiceNetKg) - n(packingNetKg));
  if (d > 0.001) return { ok: false, delta: roundKg(d) };
  return { ok: true };
}

export function assertPackingMatch(invoiceNetKg: number, packingNetKg: number): void {
  const r = packingKgMatch(invoiceNetKg, packingNetKg);
  if (!r.ok) {
    throw new Error(
      `Packing-list net kg ${n(packingNetKg).toFixed(3)} ≠ invoice net kg ${n(invoiceNetKg).toFixed(3)} (Δ ${r.delta.toFixed(3)} kg). Dispatch blocked.`,
    );
  }
}

/** Section C — JW return working. All kg. */
export function jwLossWorking(opts: {
  sentKg: number;
  goodKg: number;
  rejectKg: number;
  scrapReturnedKg: number;
  scrapRetainedKg: number;
  lossNormPct: number;
}): {
  sentKg: number;
  accountedKg: number;
  actualLossKg: number;
  normKg: number;
  excessLossKg: number;
  actualLossPct: number;
} {
  const sentKg = roundKg(n(opts.sentKg));
  const accountedKg = roundKg(
    n(opts.goodKg) + n(opts.rejectKg) + n(opts.scrapReturnedKg) + n(opts.scrapRetainedKg),
  );
  const actualLossKg = roundKg(Math.max(0, sentKg - accountedKg));
  const normKg = roundKg(sentKg * (n(opts.lossNormPct) / 100));
  const excessLossKg = roundKg(Math.max(0, actualLossKg - normKg));
  const actualLossPct = sentKg > 0 ? (actualLossKg / sentKg) * 100 : 0;
  return { sentKg, accountedKg, actualLossKg, normKg, excessLossKg, actualLossPct };
}

export function woCompleteCheck(opts: {
  issuedKg: number;
  goodPcs: number;
  rejectPcs: number;
  kgPerPc: number;
  tolerancePct?: number;
}): { theoreticalKg: number; ok: boolean; message?: string } {
  const theoreticalKg = roundKg((n(opts.goodPcs) + n(opts.rejectPcs)) * n(opts.kgPerPc));
  const issued = n(opts.issuedKg);
  const tol = n(opts.tolerancePct ?? 0.5) / 100;
  if (issued + issued * tol + 0.0005 < theoreticalKg) {
    return {
      theoreticalKg,
      ok: false,
      message: `Issued ${issued.toFixed(3)} kg + ${((tol) * 100).toFixed(1)}% < theoretical ${(opts.goodPcs + opts.rejectPcs)} pcs × ${opts.kgPerPc} = ${theoreticalKg.toFixed(3)} kg. Issue more rod before booking.`,
    };
  }
  return { theoreticalKg, ok: true };
}

export function jwVendorBlocked(opts: { ageDays: number; blockDays: number; settingOn: boolean }): boolean {
  if (!opts.settingOn) return false;
  return n(opts.ageDays) > n(opts.blockDays);
}

export function assertJwVendorAllowed(opts: {
  ageDays: number;
  blockDays: number;
  settingOn: boolean;
  docNo?: string;
}): void {
  if (jwVendorBlocked(opts)) {
    throw new Error(
      `Blocked: challan ${opts.docNo ?? ""} is ${opts.ageDays} days old (>${opts.blockDays}d statutory clock). Return it before issuing more to this vendor.`,
    );
  }
}

/** JW-OUT (own metal at vendor) stays on valuation. JW-IN customer metal does not. */
export function moveValuePaise(opts: {
  qtyKg: number;
  ratePaisePerKg: number;
  ownerType?: string | null;
  warehouseValuationEligible?: boolean | null;
}): number {
  if ((opts.ownerType ?? "OWN") === "CUSTOMER") return 0;
  if (opts.warehouseValuationEligible === false) return 0;
  const kg = n(opts.qtyKg);
  if (kg === 0) return 0;
  const mag = Math.round(Math.abs(kg) * n(opts.ratePaisePerKg));
  return kg < 0 ? -mag : mag;
}

export function yieldGap(opts: {
  issuedKg: number;
  goodKg: number;
  rejectKg: number;
  scrapKg: number;
}): { accountedKg: number; remainderKg: number } {
  const accountedKg = roundKg(n(opts.goodKg) + n(opts.rejectKg) + n(opts.scrapKg));
  const remainderKg = roundKg(Math.max(0, n(opts.issuedKg) - accountedKg));
  return { accountedKg, remainderKg };
}

export function isReasonCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return ALL_REASON_CODES.includes(code);
}

export function encodeMoveNotes(opts: {
  reasonCode?: string | null;
  lineId?: number | null;
  reverseOf?: number | null;
  fromWh?: number | null;
  toWh?: number | null;
  text?: string | null;
}): string | null {
  const tags: string[] = [];
  if (opts.reasonCode) tags.push(`REASON:${opts.reasonCode}`);
  if (opts.lineId != null) tags.push(`LINE:${opts.lineId}`);
  if (opts.reverseOf != null) tags.push(`REVERSES:${opts.reverseOf}`);
  if (opts.fromWh != null) tags.push(`FROM:${opts.fromWh}`);
  if (opts.toWh != null) tags.push(`TO:${opts.toWh}`);
  const head = tags.join(" ");
  const text = (opts.text ?? "").trim();
  const out = [head, text].filter(Boolean).join(" | ");
  return out || null;
}

export function parseReverseOf(notes: string | null | undefined): number | null {
  const m = String(notes ?? "").match(/REVERSES:(\d+)/);
  return m ? Number(m[1]) : null;
}

export function parseReasonCode(notes: string | null | undefined): string | null {
  const m = String(notes ?? "").match(/REASON:([A-Z0-9-]+)/);
  return m ? m[1] : null;
}

const LEGACY: Record<string, MoveType> = {
  GRN: "GRN_RECEIPT",
  ISSUE: "WO_ISSUE",
  RECEIPT: "WO_RECEIPT_SFG_FG",
  SCRAP: "WO_SCRAP",
  ADJUST: "ADJUST_PLUS",
  JW_RETURN: "JW_RETURN_GOOD",
  MELT_OUT: "MELT_OUT",
  OPENING: "OPENING",
};

export function toMoveType(raw: string, qtyKg?: number): MoveType {
  if ((MOVE_TYPES as readonly string[]).includes(raw)) return raw as MoveType;
  if (raw === "ADJUST") return n(qtyKg) < 0 ? "ADJUST_MINUS" : "ADJUST_PLUS";
  return LEGACY[raw] ?? (raw as MoveType);
}

export function assertNegativeStockKind(warehouseKind: string | null | undefined, nextKg: number, nextPcs: number): void {
  const k = (warehouseKind ?? "").toUpperCase();
  const blocked = k === "RM" || k === "SCRAP" || k === "SFG" || k === "FG" || k === "HOLD" || k === "REJECT" || k === "JW_OUT" || k === "JW_IN" || k === "WIP";
  if (!blocked) return;
  if (nextKg < -0.0005 || nextPcs < -0.0005) {
    throw new Error(`Negative stock blocked on ${k || "this"} warehouse (would be ${nextKg.toFixed(3)} kg / ${nextPcs} pcs)`);
  }
}
