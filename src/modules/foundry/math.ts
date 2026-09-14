/** Pure foundry maths — spectro vs alloy min/max, melt yield. No I/O. */

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function roundKg(v: number): number {
  return Math.round(n(v) * 1000) / 1000;
}

export type AlloyBand = {
  code?: string;
  cu_min_pct?: number | string | null;
  cu_max_pct?: number | string | null;
  zn_min_pct?: number | string | null;
  zn_max_pct?: number | string | null;
  pb_min_pct?: number | string | null;
  pb_max_pct?: number | string | null;
  cu_pct?: number | string | null;
  zn_pct?: number | string | null;
  pb_pct?: number | string | null;
};

export type SpectroReading = { cuPct: number; znPct: number; pbPct: number };

function band(minV: unknown, maxV: unknown, target: unknown, spread: number): { min: number; max: number } {
  const t = n(target);
  const min = minV == null || minV === "" ? t - spread : n(minV);
  const max = maxV == null || maxV === "" ? t + spread : n(maxV);
  return { min, max };
}

export function spectroVsAlloy(
  reading: SpectroReading,
  alloy: AlloyBand,
): { passed: boolean; reasons: string[] } {
  const cu = band(alloy.cu_min_pct, alloy.cu_max_pct, alloy.cu_pct, 1.5);
  const zn = band(alloy.zn_min_pct, alloy.zn_max_pct, alloy.zn_pct, 2);
  const pb = band(alloy.pb_min_pct, alloy.pb_max_pct, alloy.pb_pct, 0.5);
  const reasons: string[] = [];
  if (n(reading.cuPct) < cu.min - 1e-9 || n(reading.cuPct) > cu.max + 1e-9) {
    reasons.push(`Cu ${n(reading.cuPct).toFixed(3)}% outside ${cu.min.toFixed(3)}–${cu.max.toFixed(3)}`);
  }
  if (n(reading.znPct) < zn.min - 1e-9 || n(reading.znPct) > zn.max + 1e-9) {
    reasons.push(`Zn ${n(reading.znPct).toFixed(3)}% outside ${zn.min.toFixed(3)}–${zn.max.toFixed(3)}`);
  }
  if (n(reading.pbPct) < pb.min - 1e-9 || n(reading.pbPct) > pb.max + 1e-9) {
    reasons.push(`Pb ${n(reading.pbPct).toFixed(3)}% outside ${pb.min.toFixed(3)}–${pb.max.toFixed(3)}`);
  }
  return { passed: reasons.length === 0, reasons };
}

export const MELT_LOSS_CAP_PCT = 3;

export function meltYieldWorking(opts: {
  chargedKg: number;
  goodKg: number;
  runnerKg: number;
  drossKg: number;
  rejectKg: number;
}): {
  chargedKg: number;
  accountedKg: number;
  lossKg: number;
  lossPct: number;
  needsOwnerOverride: boolean;
} {
  const chargedKg = roundKg(opts.chargedKg);
  const accountedKg = roundKg(n(opts.goodKg) + n(opts.runnerKg) + n(opts.drossKg) + n(opts.rejectKg));
  const lossKg = roundKg(Math.max(0, chargedKg - accountedKg));
  const lossPct = chargedKg > 0 ? (lossKg / chargedKg) * 100 : 0;
  return {
    chargedKg,
    accountedKg,
    lossKg,
    lossPct,
    needsOwnerOverride: lossPct > MELT_LOSS_CAP_PCT + 1e-9,
  };
}
