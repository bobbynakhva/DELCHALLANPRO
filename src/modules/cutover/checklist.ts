/** T–21 … T+10 gates from docs/CUTOVER_CHECKLIST.md */

export const CUTOVER_GATES: Array<{
  gate: string;
  when: string;
  items: string[];
}> = [
  {
    gate: "T-21",
    when: "T–21",
    items: [
      "Legal name, GSTIN, PAN, LUT, MSME days, turnover band in GST settings",
      "Chart of accounts mapped to Tally groups (RM, scrap, SFG, FG, JW-OUT, GRNI, GST, creditors, debtors)",
      "Number series FY prefix agreed (INV/TI 26-27)",
      "Partner master: GSTIN, MSME flag, credit days 45, credit limit",
      "Alloy chemistry on every RM/FG SKU",
    ],
  },
  {
    gate: "T-14",
    when: "T–14",
    items: [
      "Opening lots: kg, pcs, heat, warehouse, unit value paise/kg",
      "Opening journals Dr inventory Cr capital — trial balance squares",
      "Open SO / PO / JW challans (including aged 180/270/330)",
      "Process tariffs + partner JW rates",
      "Metal book instruments CU / ZN / scrap",
    ],
  },
  {
    gate: "T-7",
    when: "T–7",
    items: [
      "Parallel: one GRN, one WO book, one JW return, one dispatch on Tamba; compare Tally",
      "Packing kg = invoice kg on a live invoice",
      "GSTR-1 B2B worksheet vs Tally sales register",
      "Shop training (3 fields). Stores: GRN reverse. QC: debit-note on reject.",
    ],
  },
  {
    gate: "T-1",
    when: "T–1",
    items: [
      "Tally dump (masters + opening + open docs) frozen",
      "Soft-close the Tally month. Do not keep posting in both.",
      "Backup zip off-box",
    ],
  },
  {
    gate: "T+0",
    when: "T+0",
    items: [
      "Lock prior month in Tamba",
      "First live GRN",
      "/healthz green (db + migrations + last journey stamp)",
    ],
  },
  {
    gate: "T+10",
    when: "T+10",
    items: [
      "First GST worksheet pack given to CA",
      "JW ageing board vs physical metal outside factory",
      "Serial integrity — no red gaps on posted tax invoices",
      "Deemed-supply drafts only for overdue s.143 (no auto tax)",
    ],
  },
];
