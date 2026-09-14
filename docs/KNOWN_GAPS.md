# Known gaps

This plant close-out is finance **lite**. Explicitly not in Tamba:

- **No live IRP / NIC e-invoice** — NIC-shaped stub (and optional sandbox env) maps the posted snapshot. Cancel window 24h then credit note (s.34). Not a GSTN login.
- **No live e-way** to NIC — official-shaped Part A/B, 12-digit stub EWB, JW is Job Work (subSupplyType 3 / CHL) not Supply. E-way does not move stock.
- **No TDS / TCS** and **no GSTR-2B auto-ITC**.
- **No APS / finite scheduler** — ATP is honest lead-time arithmetic; MRP is weekly netting. No furnace APS.
- **No IIoT / MES / SCADA** — shop books three fields, not machine signals. Spectro is keyed, not imported.
- **No melt mix solver** — charge is chosen lots, not an optimisation of remelt vs virgin.
- **Spectro is not a NABL / BIS certificate** — it only holds or releases pour vs alloy min/max.
- **No deemed-supply interest** — overdue s.143 drafts a tax invoice dated the original challan; it does not compute interest.
- **No multi-company, no customer portal, no HR.** CUTOVERDEMO is isolated openings only — not a second GSTIN books.
- **Tally sunset is one-way.** Do not dual-post. Tally TB import is refused after LIVE.

Demo database is **PGLite (Postgres WASM)** in preview. Plant target is **Postgres**. Not SQLite.
