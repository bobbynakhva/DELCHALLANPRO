# IRP / e-way adapter (Prompt 06a)

Tamba maps a **posted document snapshot** onto official-shaped NIC JSON. It does not log in to GSTN. Default mode is **stub** so journeys stay green offline.

## Modes

`EINVOICE_MODE` and `EWAY_MODE` = `stub` | `sandbox` | `off`

Resolution: env, then `settings.einvoice_mode` / `settings.eway_mode`, then **stub**.

| Mode | Behaviour |
|---|---|
| `stub` (default) | Deterministic IRN (SHA-256 of gstin\|docNo\|docDate\|totInvVal) and 12-digit EWB. Same payload → same IRN. |
| `sandbox` | Requires `GST_IRP_GSTIN` + `GST_IRP_USERNAME` + `GST_IRP_PASSWORD` (e-invoice) or `GST_EWB_*` (e-way). Missing env → readable error, no crash. This slice still does **not** call NIC. |
| `off` | Generate is refused. |

Never commit secrets. Persisted request/response JSON is redacted (`password`, `clientSecret`, `authToken`, …).

## E-invoice

- Source: frozen invoice / CN / DN snapshot — **not** live `Item.hsn`.
- Payload Version 1.1: TranDtls / DocDtls / SellerDtls / BuyerDtls / ShipDtls (only if ship-to differs) / ItemList / ValDtls.
- Doc No ≤ 16. FG GST UQC is **NOS** when pcs exist; one line stays one line (not kg + pcs).
- Intra CGST+SGST, inter IGST, export LUT = EXPWOP, export IGST-paid = EXPWP.
- ValDtls must match the posted snapshot to 2 decimals or IRN is blocked.
- Persist: irn, ackNo, ackDt, signedQR, status ACT/CNL, redacted request/response.
- QR JSON (Rule 46): supplier GSTIN, recipient GSTIN, doc no, date, value, item count, main HSN, IRN. Invoice number ≠ IRN.
- Cancel only if ackDt + 24h > now. Else: **Cancel window closed. Issue a credit note (s.34).**

Stub errors you can simulate: `duplicate`, `invalidGstin`.

## E-way

- Part A from invoice (Supply / INV) or JW challan (**Job Work / subSupplyType 3 / docType CHL**).
- Part B: vehicle `GJ01AB1234`, mode, distance. Validity starts at Part B (one day per 200 km).
- Skip vehicle only with the persisted “≤ 50 km same State/UT” checkbox.
- Required when over threshold, inter-state, force, or JW force flag. Gate-out is blocked if required and Part B is missing.
- **E-way does not move stock.**

## UI

POSTED invoice / CN / DN: Generate / Cancel IRN (stub simulate: duplicate, invalid GSTIN, cancel window). Part A preview, Part B vehicle, gate-out, print. JW challan: e-way is labelled Job Work, not Supply.
