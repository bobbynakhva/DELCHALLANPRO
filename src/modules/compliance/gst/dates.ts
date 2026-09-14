/** Dates on GST documents are DD/MM/YYYY in IST. FY = 1 April–31 March. */

const IST = "Asia/Kolkata";

export function parseIsoDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const s = String(input).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 6, 0, 0));
  const dmy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return new Date(Date.UTC(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]), 6, 0, 0));
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDateIN(input: string | Date | null | undefined): string {
  const d = parseIsoDate(input);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateTimeIST(input: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(input) + " IST";
}

export function toIsoDate(input: string | Date): string {
  const d = parseIsoDate(input);
  if (!d) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(d);
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function addYearsIso(isoDate: string, years: number): string {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y + years, m - 1, d));
  return dt.toISOString().slice(0, 10);
}

/** s.143 — inputs / semi-finished: 1 year; capital goods: 3 years. */
export function statutoryDueIso(challanIso: string, kind: "INPUTS" | "SEMI" | "CAPITAL" = "INPUTS"): string {
  if (kind === "CAPITAL") return addYearsIso(challanIso, 3);
  return addDaysIso(challanIso, 365);
}

export function financialYearLabel(input: string | Date = new Date()): string {
  const d = parseIsoDate(input) ?? new Date();
  const ymd = toIsoDate(d);
  const [y, m] = ymd.split("-").map(Number);
  const start = m >= 4 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

export function addDaysDateIN(isoDate: string, days: number): string {
  return formatDateIN(addDaysIso(isoDate, days));
}
