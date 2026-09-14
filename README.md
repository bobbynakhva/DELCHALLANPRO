# Tamba ERP — Brass Parts

Book of record for a Gujarat brass / copper-alloy shop: fittings, nipples, inserts, forged unions, machined and plated hardware. Hybrid discrete + process. Make-to-stock, make-to-order, inward job work (customer metal) and outward job work (our metal at a vendor).

This is a working ERP, not a slide deck. Money is integer paise. Quantities are numeric. Dual UOM is first-class: **kg** for mass, melt, scrap and valuation; **pcs** for customers, routing and packing. Conversion lives on the item / BOM line and is drawing-revision specific. Every mass-changing move posts kg.

## How to run

The live preview already boots the app. Locally (this repo):

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Schema is SQL migrations (`migrations/0002_erp.sql` + `0003_seed.sql`), not Prisma — the platform applies them to Postgres on deploy and to the embedded database in preview. Seeded shop users are created on first authenticated request.

## Seeded logins

Password for every role: **`Tamba@2026`**

| Role | Email |
|---|---|
| Owner / GM | owner@tambaerp.in |
| PPC | ppc@tambaerp.in |
| Stores | stores@tambaerp.in |
| Purchase | purchase@tambaerp.in |
| Sales | sales@tambaerp.in |
| QC | qc@tambaerp.in |
| Accounts | accounts@tambaerp.in |
| Shop supervisor | shop@tambaerp.in |
| Admin | admin@tambaerp.in |

Google / X sign-in is also available. A first-time federated user is provisioned as Owner so the books are usable.

RBAC: Stores cannot post metal prices. Sales cannot issue / adjust stock. QC releases lots. Shop booking is good pcs / reject pcs / scrap kg only.

## Ten journeys (all post real stock)

Walk them from **10 journeys** on the board, or by hand:

1. **GRN** 1250.500 kg C360 12 mm rod (gross − tare) from Rajeshwar Metals → lot lands **QUARANTINE** → **QC release**.
2. **SO** 10,000 pcs `HEX-NIPPLE-1/2-NCR` to Gujarat Sanitary.
3. **Explode** rod kg = `10000 × 0.048 × 1.08` minus on-hand; **create WO**.
4. **Issue** rod; shop **book** 9820 good, 80 reject, 6.400 kg turning to `SC-C360-TURN` (remainder of issued kg posts to runner scrap — mass is conserved).
5. **JW challan** 9820 pcs to Kiran Platers (Ni-Cr, 1.5% loss norm). Stock moves to **JW-OUT** (still our metal). Print the GST job-work challan.
6. **Return** 9700 good, 80 reject, 40 short. Excess loss vs 1.5% drafts a **debit note**. Good pcs land **FG-HOLD** for QC.
7. **Dispatch** 5000 pcs. Packing list Σ net kg equals invoice Σ net kg. Print both.
8. **Change Cu** on the metal price book. A **new quote** uses the live book. The June quote stays frozen (snapshot of formula + Cu/Zn).
9. Open an FG lot → **genealogy** walks carton → FG lot → issues → rod lot / heat.
10. Owner board shows **metal kg outside the factory** = sum of JW-OUT, and the **280-day** Amit Polishers challan on the ageing board (180 / 270 / 330 day bands). New issue to a vendor is blocked if they have a challan older than 330 days.

## Prompt 04 verified after crash

Recovered 13 Sep 2026 after a machine shutdown mid-slice. No git in this sandbox; no Prisma (SQL migrations `0001`–`0005`). Prompt 01–04 left untouched. `npx tsc --noEmit` exit 0. `npm run journeys` on a fresh seed: **10/10 PASS**. SENT quotes stay frozen when Cu moves. MRP drafts spawn without posting stock. Genealogy walks FG ← WO issue ← rod. Last CLI pack is listed at `/dev/journeys`.

## Prompt 05 — finance lite

Value-changing stock moves write Journal + JournalLine in the **same transaction** as `postStockMove`. GRNI 3-way bills, FIFO receipts, period OPEN/SOFT_CLOSE/LOCKED, GST worksheets (GSTR-1 / 3B / ITC-04 CSV) watermarked “Worksheet only. Not a filed return.” Shop cannot see Sales, COA, or margin.

`npm run journeys` prints **17 PASS**. `npm run backup` writes a timestamped zip (IST) under `artifacts/`. `/healthz` reports db + migrations + last journey stamp.

Verified 13 Sep 2026: CLI pack **17/17 PASS**. Trial balance Dr = Cr. GRNI cleared by 3-way bill. Snapshot HSN survives Item.hsn mutation. Preview database is PGLite (Postgres WASM); plant target is Postgres.

**Plant target is Postgres.** Preview/demo uses **PGLite (Postgres WASM)** — not SQLite.

Trial kit: [`docs/PLANT_TRIAL.md`](docs/PLANT_TRIAL.md), [`docs/CUTOVER_CHECKLIST.md`](docs/CUTOVER_CHECKLIST.md), [`docs/TRAINING.md`](docs/TRAINING.md), [`docs/KNOWN_GAPS.md`](docs/KNOWN_GAPS.md), [`docs/STATUTORY_MAP.md`](docs/STATUTORY_MAP.md). Tally sunset is a one-way dump, not dual books.

## What is GST-real vs stub

**Real (printable GST documents)** — A4 HTML, browser Print / Save PDF. Preview every template at **GST documents**.

- **Tax invoice** (CGST Act s.31, Rule 46): legal name then trade name, serial ≤16 chars `[A-Za-z0-9/-]`, date DD/MM/YYYY, bill-to + ship-to, HSN (4 or 6 from turnover setting), NOS + KGS, CGST+SGST intra / IGST inter, place of supply, IRN QR on the invoice face (invoice number ≠ IRN), MSME due date +45 days, amount in words, ORIGINAL / DUPLICATE / TRIPLICATE watermarks. Export LUT or IGST-paid full-sentence declaration, IEC, LUT, country, port, Incoterm, forex.
- **Job-work delivery challan** (s.143, Rules 45+55): not an invoice. Consigner/consignee GSTIN, HSN, NOS+KGS, value+GST as reference, “GST not payable — not a supply”, statutory due = challan + 365 days (inputs) or +3 years (capital), s.143 warning, ORIGINAL FOR CONSIGNEE / DUPLICATE FOR TRANSPORTER / TRIPLICATE FOR CONSIGNER.
- **Return challan**: original challan no.+date, sent / good / reject / scrap / loss. s.143(5) scrap note.
- **Conversion invoice** (SAC 9988): GST on conversion charges only.
- **Credit / debit note** (s.34, Rule 53): own series, original invoice no.+date, same tax head.
- **Bill of supply** (Rule 49): composition only, no tax columns.
- **E-way Form GST EWB-01** (s.68, Rule 138): Part A + Part B, reason codes 0–9, skip vehicle only ≤50 km same state. Validity starts from Part B.
- **Packing list**: country of origin India; blocked if |packing net − invoice net| > 0.001 kg.
- **GRN / weighment**: gross − tare = net to 3 decimals.
- **Certificate of conformance**: alloy, drawing rev, lot/heat. Footer: not a NABL / BIS licence.
- **Quotation**: must not look like a tax invoice. Frozen metal rate date. “GST extra as applicable.”
- **Registers**: invoice serial-gap, GSTR-1 lite (B2B, CDNR, HSN Table 12), ITC-04 Tables 4 / 5A / 5B (half-year if turnover > ₹5 Cr else annual), e-way register.

Print is **blocked** if: serial illegal, HSN blank, intra-state with IGST, inter-state with CGST, registered buyer without GSTIN, packing kg mismatch.

**Deemed supply (s.143 overdue):** on the JW ageing board, “Deemed supply draft” creates a **DRAFT** tax invoice dated the original challan. It does not auto-post stock or tax.

Company settings (legal name, GSTIN, composition, turnover band, e-invoice, B2C QR, e-way threshold, MSME days, number series) are under **GST settings**.

**Stub (Prompt 06a adapter)**

- **IRP / NIC e-invoice**: NIC-shaped JSON 1.1 from the **posted snapshot**. Deterministic stub IRN (same payload → same IRN). QR on the existing invoice face. Cancel only within 24h of ack; else “Cancel window closed. Issue a credit note (s.34).” Modes: `EINVOICE_MODE=stub|sandbox|off` (default stub). Sandbox needs `GST_IRP_*` env — never commit secrets. Not a GSTN login.
- **e-way bill**: official-shaped Part A/B, 12-digit EWB. JW challan is **Job Work** (subSupplyType 3 / CHL), not Supply. Validity starts at Part B. Skip vehicle only with the persisted ≤ 50 km same-state checkbox. E-way does **not** move stock. Modes: `EWAY_MODE=stub|sandbox|off`.
- No GST portal return filing, no GSTR-1/3B payment.

See [`docs/IRP_SANDBOX.md`](docs/IRP_SANDBOX.md).

## Prompt 06a — NIC-shaped IRP / e-way adapter

Prompt 06a verified.

`npm run journeys` prints **21 PASS**. Journeys 1–17 stay green in stub. 18: intra invoice IRN + QR, second generate same IRN. 19: Item.hsn mutation does not change payload or PDF. 20: cancel now OK; +25h blocked with the credit-note message. 21: JW e-way is Job Work not Supply; Part B sets validFrom; kg-outside-factory unchanged.

## Prompt 06b — Foundry first-class

Heat, charge-by-lot, spectro hold, pour, knockout, runners back to same-alloy scrap. `foundry_enabled` defaults true. Stock only through `postStockMove` (`MELT_CHARGE` / `POUR` / `RUNNER` / `DROSS` / `REJECT` / `YIELD_LOSS`). Spectro FAIL blocks pour (not a BIS/NABL certificate). Pour + knockout slips are shop A4 — not tax invoices, no IRN. Close loss > 3% needs Owner override.

`npm run journeys` prints **27 PASS**. 22: charge 100.000 kg dedicated C360 lot → WIP-MELT. 23: spectro FAIL blocks pour; PASS releases. 24: 80 good + 15 runner + 3 dross; close; 2.000 kg to variance. 25: CW617N into C360 refused. 26: genealogy casting → heat → charge lot. 27: trial balance still Dr = Cr. Journeys 1–21 stay green. Journey-1 rod and 137.1000 kg JW-OUT are not consumed.

See [`docs/FOUNDRY.md`](docs/FOUNDRY.md).

Prompt 06b verified.

## Prompt 06c — Cutover kit

Isolated **CUTOVERDEMO** openings. Demo Tamba `cutoverBlocksLiveDocs=false`. State machine `NOT_STARTED → COUNTED → JW_CONFIRMED → TB_LOADED → RECONCILED → LIVE → TALLY_SUNSET` — cannot skip. Opening stock posts `OPENING_STOCK` through `postStockMove` on `openingDate`. CUSTOMER metal value 0, no journal. Opening JW keeps original challan no+date; due = challanDate+365; confirmation watermark **OPENING CONFIRMATION — not a delivery challan.** LIVE after RECONCILED (or Owner override). After LIVE: Tally dump (journals, sales register, purchase register, stock summary) headed **Tally is not the book of record.** Import after LIVE is refused.

`npm run journeys` prints **32 PASS**. 28: OWN 50 kg rod + 10 pcs FG + 5 kg customer metal value 0. 29: JW challan 90 days before opening; ageing ~90; due = challan+365. 30: TB squares; inventory = OWN; RECONCILED. 31: live GRN blocked until LIVE. 32: four Tally files; 1–27 still green including journey 10 (**137.1000 kg** JW-OUT) and 27.

See [`docs/CUTOVER.md`](docs/CUTOVER.md).

Prompt 06c verified.

Use Print / Save PDF in the browser. These are the books — there is no Tally twin.

## Domain rules this v1 actually enforces

- Alloy is first-class (C36000, CW617N, IS 319 Gr I). Scrap inherits alloy. No anonymous brass in a bin.
- Lot / batch on metal, SFG, FG, plated parts. Heat number from GRN.
- Scrap is inventory (`SC-C360-TURN`, `SC-C360-RUNNER`), not an expense.
- Job work is manufacturing, not purchasing. Our material at a vendor stays on our books in JW-OUT.
- Customer-owned metal (`JW-IN-CUSTOMER`) is qty-tracked and does not inflate inventory value.
- Quote formula (snapshotted, never rewritten):
  `metal = kgPerPc × recoveryFactor × blended Cu/Zn/Pb`
  `unitPrice = metal + conversion + jw/plating + packing + overhead + margin`

## Company seed

Tamba Brass Works Pvt Ltd, GIDC Odhav, Ahmedabad, GSTIN `24AABCT4821M1Z5`. Vendors: Rajeshwar Metals, Kiran Platers, Amit Polishers. Customers: Gujarat Sanitary, Gulf Fittings LLC. Opening lots include 12 mm / 19 mm C360 rod, customer-owned rod (value ₹0), two open JW challans (one aged 280 days), one open SO, one open PO, a frozen June quote.

v1 is not MES, WMS, PLM or payroll.
