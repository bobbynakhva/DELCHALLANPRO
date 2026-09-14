export function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function roundKg(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export function roundPcs(v: number): number {
  return Math.round(v);
}

export function formatKg(v: unknown): string {
  return n(v).toLocaleString("en-IN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function formatPcs(v: unknown): string {
  return n(v).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function formatINR(paise: unknown): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(n(paise) / 100);
}

export function formatPaiseRate(paisePerKg: unknown): string {
  return `${formatINR(paisePerKg)}/kg`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string | Date, to: Date = new Date()): number {
  const a = typeof from === "string" ? new Date(from) : from;
  return Math.floor((to.getTime() - a.getTime()) / 86400000);
}
