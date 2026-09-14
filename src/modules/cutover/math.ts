/** Pure cutover maths — CSV, freeze, value check, state machine. No I/O. */

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function roundKg(v: number): number {
  return Math.round(n(v) * 1000) / 1000;
}

export const CUTOVER_STATES = [
  "NOT_STARTED",
  "COUNTED",
  "JW_CONFIRMED",
  "TB_LOADED",
  "RECONCILED",
  "LIVE",
  "TALLY_SUNSET",
] as const;
export type CutoverState = (typeof CUTOVER_STATES)[number];

const NEXT: Record<CutoverState, CutoverState | null> = {
  NOT_STARTED: "COUNTED",
  COUNTED: "JW_CONFIRMED",
  JW_CONFIRMED: "TB_LOADED",
  TB_LOADED: "RECONCILED",
  RECONCILED: "LIVE",
  LIVE: "TALLY_SUNSET",
  TALLY_SUNSET: null,
};

export function nextState(from: CutoverState): CutoverState | null {
  return NEXT[from] ?? null;
}

export function canTransition(from: string, to: string): boolean {
  return NEXT[from as CutoverState] === to;
}

export const VALUE_TOL_PAISE = 100; // ₹1
export const TALLY_NOT_BOOK = "Tally is not the book of record.";

export type OpeningStockRow = {
  sku: string;
  lotNo: string;
  warehouseCode: string;
  alloyCode: string;
  qtyKg: number;
  qtyPcs: number;
  ratePaisePerKg: number;
  valuePaise: number;
  heatNo: string;
  owner: "OWN" | "CUSTOMER";
  customerCode: string;
  notes: string;
};

export type FreezeIssue = { sku?: string; code?: string; message: string };

export function openingValueCheck(opts: {
  ratePaisePerKg: number;
  qtyKg: number;
  valuePaise: number;
}): { ok: boolean; expected: number; delta: number } {
  const expected = Math.round(Math.abs(n(opts.qtyKg) * n(opts.ratePaisePerKg)));
  const delta = Math.abs(expected - Math.abs(Math.round(n(opts.valuePaise))));
  return { ok: delta <= VALUE_TOL_PAISE, expected, delta };
}

export type ItemFreeze = {
  sku: string;
  type: string;
  alloyId?: number | null;
  alloyCode?: string | null;
  stockUom?: string | null;
  altUom?: string | null;
  hsn?: string | null;
  kgPerPc?: number | null;
};

export function freezeItemIssues(item: ItemFreeze): string[] {
  const issues: string[] = [];
  const metal = item.type === "RM" || item.type === "SFG" || item.type === "FG" || item.type === "SCRAP";
  if (metal && item.alloyId == null && !item.alloyCode) issues.push("missing alloy");
  if (!String(item.stockUom ?? "").trim()) issues.push("missing stock UOM");
  if (item.type === "FG" || item.type === "SFG") {
    if (!String(item.altUom ?? "").trim()) issues.push("missing dual UOM");
    if (!(n(item.kgPerPc) > 0)) issues.push("missing kgPerPc");
  }
  if (metal && !String(item.hsn ?? "").trim()) issues.push("missing HSN");
  return issues;
}

export function parseCsv(text: string): string[][] {
  const src = String(text ?? "").replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else if (ch !== "\r") cell += ch;
  }
  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

function col(header: string[], row: string[], name: string): string {
  const i = header.findIndex((h) => h.replace(/[\s_]/g, "").toLowerCase() === name.replace(/[\s_]/g, "").toLowerCase());
  return i >= 0 ? (row[i] ?? "") : "";
}

export function parseOpeningStockCsv(text: string): OpeningStockRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = table[0]!.map((h) => h.trim());
  return table.slice(1).map((row) => {
    const ownerRaw = col(header, row, "owner").toUpperCase();
    const owner: "OWN" | "CUSTOMER" = ownerRaw === "CUSTOMER" ? "CUSTOMER" : "OWN";
    return {
      sku: col(header, row, "sku"),
      lotNo: col(header, row, "lotNo") || col(header, row, "lotno"),
      warehouseCode: col(header, row, "warehouseCode") || col(header, row, "warehouse"),
      alloyCode: col(header, row, "alloyCode") || col(header, row, "alloy"),
      qtyKg: n(col(header, row, "qtyKg") || col(header, row, "qtykg")),
      qtyPcs: n(col(header, row, "qtyPcs") || col(header, row, "qtypcs")),
      ratePaisePerKg: Math.round(n(col(header, row, "ratePaisePerKg") || col(header, row, "rate"))),
      valuePaise: Math.round(n(col(header, row, "valuePaise") || col(header, row, "value"))),
      heatNo: col(header, row, "heatNo") || col(header, row, "heat"),
      owner,
      customerCode: col(header, row, "customerCode") || col(header, row, "customer"),
      notes: col(header, row, "notes"),
    };
  });
}

export type OpeningJwRow = {
  originalChallanNo: string;
  originalChallanDate: string;
  partnerCode: string;
  processCode: string;
  sku: string;
  qtyPcs: number;
  qtyKg: number;
  ratePaisePerKg: number;
  valuePaise: number;
};

export function parseOpeningJwCsv(text: string): OpeningJwRow[] {
  const table = parseCsv(text);
  if (table.length < 2) return [];
  const header = table[0]!.map((h) => h.trim());
  return table.slice(1).map((row) => ({
    originalChallanNo: col(header, row, "challanNo") || col(header, row, "originalChallanNo"),
    originalChallanDate: col(header, row, "challanDate") || col(header, row, "originalChallanDate"),
    partnerCode: col(header, row, "partnerCode") || col(header, row, "vendor"),
    processCode: col(header, row, "processCode") || "NI_CR",
    sku: col(header, row, "sku"),
    qtyPcs: n(col(header, row, "qtyPcs")),
    qtyKg: n(col(header, row, "qtyKg")),
    ratePaisePerKg: Math.round(n(col(header, row, "ratePaisePerKg"))),
    valuePaise: Math.round(n(col(header, row, "valuePaise"))),
  }));
}

export function inventoryTallyCodes(): string[] {
  return ["1200", "1210", "1220", "1230", "1240", "1245"];
}

export function reconcileGate(opts: {
  ownInventoryPaise: number;
  customerInventoryPaise: number;
  inventoryLedgerPaise: number;
  arPaise: number;
  apPaise: number;
  tallyArPaise: number;
  tallyApPaise: number;
  tbDebit: number;
  tbCredit: number;
}): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (opts.tbDebit !== opts.tbCredit) reasons.push(`TB Dr ${opts.tbDebit} ≠ Cr ${opts.tbCredit}`);
  if (opts.customerInventoryPaise !== 0) reasons.push("JW_IN customer value must be 0");
  if (Math.abs(opts.ownInventoryPaise - opts.inventoryLedgerPaise) > 0) {
    reasons.push(`Inventory ledgers ${opts.inventoryLedgerPaise} ≠ OWN opening ${opts.ownInventoryPaise}`);
  }
  if (opts.arPaise !== opts.tallyArPaise) reasons.push(`AR ${opts.arPaise} ≠ Tally 1100 ${opts.tallyArPaise}`);
  if (opts.apPaise !== opts.tallyApPaise) reasons.push(`AP ${opts.apPaise} ≠ Tally 2000 ${opts.tallyApPaise}`);
  return { ok: reasons.length === 0, reasons };
}

export const SAMPLE_STOCK_CSV = `sku,lotNo,warehouseCode,alloyCode,qtyKg,qtyPcs,ratePaisePerKg,valuePaise,heatNo,owner,customerCode,notes
ROD-C360-12MM,CUT-ROD-50,CUTOVER-RM,C36000,50.000,0,62000,3100000,H-CUT-01,OWN,,opening rod
HEX-NIPPLE-1/2-NCR,CUT-FG-10,CUTOVER-FG,C36000,0.480,10,78000,37440,H-CUT-FG,OWN,,opening FG
ROD-C360-12MM,CUT-CUST-5,CUTOVER-JW-IN,C36000,5.000,0,0,0,GS-HEAT-CUT,CUSTOMER,C-GS,customer metal`;

export const SAMPLE_JW_CSV = `challanNo,challanDate,partnerCode,processCode,sku,qtyPcs,qtyKg,ratePaisePerKg,valuePaise
JW/25-26/C-0001,2026-06-16,V-KIRAN,NI_CR,HEX-NIPPLE-1/2-NCR,15,0.720,78000,56160`;
