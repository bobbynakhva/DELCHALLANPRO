/** Pure journal mapping — no server imports (node:test). */
function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export const INV_ACCOUNT: Record<string, string> = {
  RM: "1110",
  SCRAP: "1120",
  WIP: "1130",
  SFG: "1135",
  HOLD: "1135",
  FG: "1140",
  REJECT: "1140",
  JW_OUT: "1150",
  TOOL: "1110",
};

export type JLine = { account: string; debit: number; credit: number };

function absPaise(v: number): number {
  return Math.abs(Math.round(n(v)));
}

function pair(dr: string, cr: string, paise: number): JLine[] {
  const p = absPaise(paise);
  if (p === 0) return [];
  return [
    { account: dr, debit: p, credit: 0 },
    { account: cr, debit: 0, credit: p },
  ];
}

export function inventoryAccount(kind: string, code?: string): string {
  if (code === "JW-OUT") return "1150";
  if (code === "RM-SCRAP") return "1120";
  if (code === "SFG" || code === "FG-HOLD") return "1135";
  if (code === "WIP-MELT" || kind === "WIP") return "1130";
  return INV_ACCOUNT[kind] ?? "1110";
}

export type MoveJournalInput = {
  type: string;
  qtyKg: number;
  valuePaise: number;
  warehouseKind: string;
  warehouseCode: string;
  ownerType: string;
};

export function linesForStockMove(m: MoveJournalInput): JLine[] {
  if ((m.ownerType ?? "OWN") === "CUSTOMER") return [];
  if (m.type.startsWith("JW_IN")) return [];
  const t = m.type;
  const qty = n(m.qtyKg);
  const val = n(m.valuePaise);
  const inv = inventoryAccount(m.warehouseKind, m.warehouseCode);

  if (t === "QC_RELEASE" || t === "QC_REJECT" || t === "TRANSFER") return [];
  if (t === "JW_EXCESS_LOSS") return [];

  if ((t === "OPENING" || t === "OPENING_STOCK") && val !== 0) return pair(inv, "3100", val);
  if (t === "GRN_RECEIPT" && qty > 0) return pair("1110", "2110", val);
  if (t === "WO_ISSUE" && qty < 0) return pair("1130", inv, val);
  if (t === "WO_RECEIPT_SFG_FG" && qty > 0) return pair(inv, "1130", val);
  if ((t === "WO_SCRAP" || t === "WO_BACKFLUSH") && qty > 0) return pair("1120", "1130", val);
  if (t === "JW_OUT" && qty < 0) return pair("1150", inv, val);
  if (t === "JW_OUT" && qty > 0) return [];
  if (t === "JW_RETURN_GOOD" && qty > 0) return pair(inv, "1150", val);
  if (t === "JW_RETURN_REJECT" && qty > 0) return pair(inv, "1150", val);
  if (t === "JW_RETURN_SCRAP" && qty > 0) return pair("1120", "1150", val);
  if ((t === "JW_RETURN_GOOD" || t === "JW_RETURN_REJECT" || t === "JW_RETURN_SCRAP") && qty < 0) return [];
  if (t === "DISPATCH" && qty < 0) return pair("5110", inv, val);
  if (t === "SALES_RETURN" && qty > 0) return pair(inv, "5110", val);
  if ((t === "ADJUST_PLUS" || t === "ADJUST") && qty > 0) return pair(inv, "5120", val);
  if ((t === "ADJUST_MINUS" || t === "ADJUST") && qty < 0) return pair("5120", inv, val);
  if (t === "MELT_OUT" && qty < 0) return pair("1130", inv, val);
  if (t === "MELT_CHARGE" && qty < 0) return pair("1130", inv, val);
  if (t === "MELT_CHARGE" && qty > 0) return [];
  if (t === "MELT_POUR" && qty < 0) return [];
  if (t === "MELT_POUR" && qty > 0) return pair(inv, "1130", val);
  if (t === "MELT_RUNNER" && qty < 0) return [];
  if (t === "MELT_RUNNER" && qty > 0) return pair("1120", "1130", val);
  if (t === "MELT_DROSS" && qty < 0) return [];
  if (t === "MELT_DROSS" && qty > 0) return pair("1120", "1130", val);
  if (t === "MELT_REJECT" && qty < 0) return [];
  if (t === "MELT_REJECT" && qty > 0) return pair(inv, "1130", val);
  if (t === "MELT_YIELD_LOSS" && qty < 0) return pair("5120", "1130", val);
  if (val !== 0 && qty > 0) return pair(inv, "1199", val);
  if (val !== 0 && qty < 0) return pair("1199", inv, val);
  return [];
}

export function linesBalance(lines: JLine[]): boolean {
  const dr = lines.reduce((s, l) => s + l.debit, 0);
  const cr = lines.reduce((s, l) => s + l.credit, 0);
  return dr === cr;
}

export function invoiceJournalLines(opts: {
  isExport: boolean;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
}): JLine[] {
  const sales = opts.isExport ? "4120" : "4110";
  const lines: JLine[] = [
    { account: "2200", debit: absPaise(opts.totalPaise), credit: 0 },
    { account: sales, debit: 0, credit: absPaise(opts.taxablePaise) },
  ];
  if (opts.cgstPaise) lines.push({ account: "2140", debit: 0, credit: absPaise(opts.cgstPaise) });
  if (opts.sgstPaise) lines.push({ account: "2150", debit: 0, credit: absPaise(opts.sgstPaise) });
  if (opts.igstPaise) lines.push({ account: "2160", debit: 0, credit: absPaise(opts.igstPaise) });
  return lines;
}

export function billMatchLines(opts: {
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
}): JLine[] {
  const total = absPaise(opts.taxablePaise) + absPaise(opts.cgstPaise) + absPaise(opts.sgstPaise) + absPaise(opts.igstPaise);
  const lines: JLine[] = [
    { account: "2110", debit: absPaise(opts.taxablePaise), credit: 0 },
    { account: "2120", debit: 0, credit: total },
  ];
  if (opts.cgstPaise) lines.push({ account: "2170", debit: absPaise(opts.cgstPaise), credit: 0 });
  if (opts.sgstPaise) lines.push({ account: "2180", debit: absPaise(opts.sgstPaise), credit: 0 });
  if (opts.igstPaise) lines.push({ account: "2190", debit: absPaise(opts.igstPaise), credit: 0 });
  return lines;
}

export function jwVendorBillLines(opts: {
  chargesPaise: number;
  cgstPaise: number;
  sgstPaise: number;
}): JLine[] {
  const total = absPaise(opts.chargesPaise) + absPaise(opts.cgstPaise) + absPaise(opts.sgstPaise);
  const lines: JLine[] = [
    { account: "5140", debit: absPaise(opts.chargesPaise), credit: 0 },
    { account: "2120", debit: 0, credit: total },
  ];
  if (opts.cgstPaise) lines.push({ account: "2170", debit: absPaise(opts.cgstPaise), credit: 0 });
  if (opts.sgstPaise) lines.push({ account: "2180", debit: absPaise(opts.sgstPaise), credit: 0 });
  return lines;
}

export function receiptLines(amountPaise: number): JLine[] {
  return pair("2210", "2200", amountPaise);
}

export function excessLossLines(paise: number): JLine[] {
  return pair("5130", "1150", paise);
}

export function yearMonth(iso: string): string {
  return String(iso).slice(0, 7);
}

export function assertNotFuture(iso: string, today: string): void {
  const t = new Date(today + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + 1);
  const max = t.toISOString().slice(0, 10);
  if (iso > max) throw new Error(`Document date ${iso} is more than one day in the future`);
}
