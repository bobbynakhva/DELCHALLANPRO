/**
 * Capable-to-promise — honest, not APS. No drag-and-drop scheduler.
 */

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export type AtpInput = {
  qtyPcs: number;
  availableFgPcs: number;
  openWoRemainingPcs: number;
  jwPipelinePcs: number;
  alreadyPromisedPcs: number;
  purchaseLeadDays: number;
  dailyPcs: number;
  setupMin: number;
  jwDays: number;
  packDays: number;
  today?: string;
};

export type AtpResult = {
  availablePcs: number;
  shortfallPcs: number;
  woRunDays: number;
  setupDays: number;
  leadDays: number;
  promiseDate: string;
  working: string[];
  canPromiseFromStock: boolean;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function computeAtp(input: AtpInput): AtpResult {
  const qty = n(input.qtyPcs);
  const available = n(input.availableFgPcs) + n(input.openWoRemainingPcs) + n(input.jwPipelinePcs) - n(input.alreadyPromisedPcs);
  const availablePcs = Math.max(0, Math.round(available));
  const shortfallPcs = Math.max(0, Math.round(qty - availablePcs));
  const daily = Math.max(1, n(input.dailyPcs) || 1);
  const woRunDays = shortfallPcs > 0 ? Math.ceil(shortfallPcs / daily) : 0;
  const setupDays = shortfallPcs > 0 && n(input.setupMin) > 0 ? Math.max(1, Math.ceil(n(input.setupMin) / (8 * 60))) : 0;
  const leadDays =
    shortfallPcs <= 0
      ? n(input.packDays)
      : n(input.purchaseLeadDays) + woRunDays + setupDays + n(input.jwDays) + n(input.packDays);
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const promiseDate = addDays(today, leadDays);
  const working = [
    `Available FG ${n(input.availableFgPcs)} pcs + open WO remaining ${n(input.openWoRemainingPcs)} + JW pipeline ${n(input.jwPipelinePcs)} − already promised ${n(input.alreadyPromisedPcs)} = ${availablePcs} pcs`,
    `Order ${qty} pcs → shortfall ${shortfallPcs} pcs`,
  ];
  if (shortfallPcs <= 0) {
    working.push(`Covered from stock/WIP. Pack ${n(input.packDays)} d → promise ${promiseDate}`);
  } else {
    working.push(
      `Lead = purchase ${n(input.purchaseLeadDays)} d + WO run ${shortfallPcs}/${daily} = ${woRunDays} d + setup ${setupDays} d + JW ${n(input.jwDays)} d + pack ${n(input.packDays)} d = ${leadDays} d`,
    );
    working.push(`Promise ${promiseDate}`);
  }
  return {
    availablePcs,
    shortfallPcs,
    woRunDays,
    setupDays,
    leadDays,
    promiseDate,
    working,
    canPromiseFromStock: shortfallPcs <= 0,
  };
}

export function assertOverrideReason(dateChanged: boolean, reason: string | null | undefined): void {
  if (dateChanged && !String(reason ?? "").trim()) {
    throw new Error("Overriding the computed promise date needs a reason");
  }
}

