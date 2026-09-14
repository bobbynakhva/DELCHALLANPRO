# Cutover checklist

Tally sunset is a **one-way dump**, not dual books.

## T–21

- [ ] Legal name, GSTIN, PAN, LUT, MSME days, turnover band in GST settings
- [ ] Chart of accounts mapped to Tally groups (RM, scrap, SFG, FG, JW-OUT, GRNI, GST, creditors, debtors)
- [ ] Number series FY prefix agreed (INV/TI `26-27`)
- [ ] Partner master: GSTIN, MSME flag, credit days 45, credit limit
- [ ] Alloy chemistry on every RM/FG SKU

## T–14

- [ ] Opening lots: kg, pcs, heat, warehouse, unit value paise/kg
- [ ] Opening journals Dr inventory Cr capital — trial balance squares
- [ ] Open SO / PO / JW challans (including aged 180/270/330)
- [ ] Process tariffs + partner JW rates
- [ ] Metal book instruments CU / ZN / scrap

## T–7

- [ ] Parallel: one GRN, one WO book, one JW return, one dispatch on Tamba; compare Tally
- [ ] Packing kg = invoice kg on a live invoice
- [ ] GSTR-1 B2B worksheet vs Tally sales register
- [ ] Shop training (3 fields). Stores: GRN reverse. QC: debit-note on reject.

## T–1

- [ ] Tally dump (masters + opening + open docs) frozen
- [ ] Soft-close the Tally month. Do not keep posting in both.
- [ ] Backup zip (`npm run backup`) off-box

## T+0

- [ ] Lock prior month in Tamba
- [ ] First live GRN
- [ ] `/healthz` green (db + migrations + last journey stamp)

## T+10

- [ ] First GST worksheet pack given to CA
- [ ] JW ageing board vs physical metal outside factory
- [ ] Serial integrity — no red gaps on posted tax invoices
- [ ] Deemed-supply drafts only for overdue s.143 (no auto tax)
