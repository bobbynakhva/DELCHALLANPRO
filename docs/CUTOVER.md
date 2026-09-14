# Cutover kit — Prompt 06c

Tally sunset is a **one-way dump**. Tamba is the book of record.

Isolated company **CUTOVERDEMO**. Demo Tamba keeps `cutover_blocks_live_docs=false` so journeys 1–27 stay green. CUTOVERDEMO blocks live GRN until **LIVE**.

## State machine

`NOT_STARTED → COUNTED → JW_CONFIRMED → TB_LOADED → RECONCILED → LIVE → TALLY_SUNSET`

Cannot skip. Cannot load openings into a LOCKED month. LIVE needs RECONCILED or an audited Owner override.

## A. Masters freeze

Opening rows need alloy, dual UOM, HSN, kgPerPc (FG/SFG). Duplicate-code report on item / partner / warehouse / alloy.

## B. Opening stock

CSV: sku, lotNo, warehouseCode, alloyCode, qtyKg, qtyPcs, ratePaisePerKg, valuePaise, heatNo, owner OWN|CUSTOMER, customerCode, notes.

Dry-run then post `OPENING_STOCK` on `openingDate` through `postStockMove` only.

- OWN: Dr inventory Cr 3100 (opening equity).
- CUSTOMER: warehouse CUTOVER-JW-IN (JW_IN customer-owned), value 0, no journal.
- Reject if |rate × kg − value| > ₹1 (100 paise).

Lots land in CUTOVER-* warehouses so live JW-OUT **137.1000 kg** is untouched.

## C. Opening job work

CSV keeps original challanNo + challanDate. Statutory due = challanDate + 365 (inputs). Ageing uses challanDate, not import date. Metal posts to CUTOVER-JW-OUT (not the live JW-OUT bin).

Confirmation PDF watermark: **OPENING CONFIRMATION — not a delivery challan.** Not a tax invoice. No IRN.

## D. Opening AR/AP + TB

Subledgers must equal Tally 1100 / 2000. Inventory ledgers (Tamba 1110–1150 ↔ Tally 1200–1245) = OWN opening value. JW_IN value 0. Dr = Cr. Then RECONCILED.

## E. Tally one-way

After LIVE: export journals, sales register, purchase register, stock summary. Header on every file: **Tally is not the book of record.** Refuse Tally TB import after LIVE.

## F. Console

`/cutover` — freeze, CSV paste, dry-run, post, JW, TB, LIVE, Tally export/import, sign-offs, COA map. Print pack at `/print/cutover-pack`. T–21 … T+10 from [`CUTOVER_CHECKLIST.md`](CUTOVER_CHECKLIST.md).

## Journeys 28–32 (CUTOVERDEMO only)

28 OWN 50 kg rod + 10 pcs FG + 5 kg customer metal value 0  
29 JW challan dated 90 days before opening; ageing ~90; due = challanDate+365  
30 TB squares; inventory = OWN value; RECONCILED  
31 Blocks live GRN before LIVE; allows GRN after LIVE  
32 tally:export files exist; 1–27 still PASS including 10 and 27
