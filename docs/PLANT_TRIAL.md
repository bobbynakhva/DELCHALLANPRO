# Plant trial — 5 days

Password for every seeded role: `Tamba@2026`. Owner: Kavita Mehta `owner@tambaerp.in`.

## Day 1 — Masters

1. Sign in as Owner. Confirm metal-outside-factory banner and role boards.
2. Masters: alloys C36000 / CW617N, items, warehouses, PartnerProcessRate vs process_tariff.
3. Quotations: live formula, **Freeze rates & save**. Print — metal rate date and “not a tax invoice”.
4. Change Cu. June SENT quote stays frozen.

## Day 2 — GRN + WO

1. Stores: GRN 1,250.500 kg C360 rod from Rajeshwar (gross − tare). Lot QUARANTINE.
2. QC release.
3. Sales: SO 10,000 pcs HEX-NIPPLE-1/2-NCR. ATP working. Override needs a reason.
4. PPC: explode rod kg = 10,000 × 0.048 × 1.08; create WO; issue rod; shop books **good / reject / scrap** only (9820 / 80 / 6.400).

## Day 3 — JW cycle

1. JW OUT 9820 pcs to Kiran Platers. Print s.143 challan (due = +365 days). JW-OUT is still our metal.
2. Return 9700 / 80 / 40. Live working. Excess vs 1.5% drafts a debit note.
3. QC FG to FG-DOM. Genealogy FG ← WO issue ← rod/GRN.

## Day 4 — Dispatch + GST pack

1. Dispatch 5,000. Packing kg = invoice kg. Credit limit / overdue blocks unless Owner override.
2. AR/AP: 3-way bill on GRN net kg. Receipt FIFO clears that invoice.
3. GST worksheets: download GSTR-1, GSTR-3B, ITC-04. Watermark “Worksheet only. Not a filed return.” Serial gaps in red.

## Day 5 — Variance + CA

1. Audit pack: yield / JW loss. Close period freezes CostVariance, not GL.
2. Books: trial balance Dr = Cr. Lock March — back-dated GRN is refused.
3. After March soft-close, invoice series rolls (`TI/yy-yy/`).
4. CA takes the three CSVs. Run `npm run journeys` — 17 PASS. `/healthz` shows last journey stamp.

Shop supervisor login is three fields only. Shop cannot open Sales, COA, or margin.
