# Statutory map — printable PDF → rule / section

| Document | Screen | Law |
|---|---|---|
| Tax invoice | `/print/invoice/$id` | CGST Act s.31, Rule 46 |
| Bill of supply | `/dev/docs/bill-of-supply` | Rule 49 (composition) |
| Job-work delivery challan | `/print/challan/$id` | s.143, Rules 45 + 55 |
| Return challan | `/print/return/$id` | s.143(5) scrap note |
| E-way | `/print/eway/$id` | s.68, Rule 138 Form GST EWB-01; JW challan = subSupplyType 3 / CHL (Job Work, not Supply); validity from Part B |
| IRN QR | `/print/invoice/$id` | Rule 46 particular; NIC JSON 1.1 from posted snapshot; cancel window 24h then s.34 credit note |
| Credit / debit note | `/print/cn/$id` `/print/dn/$id` | s.34, Rule 53 |
| Packing list | `/print/packing/$id` | Commercial; kg must equal invoice |
| GRN / weighment | `/print/grn/$id` | Gross − tare = net |
| Quotation | `/print/quote/$id` | Not a tax invoice; frozen metal rate date |
| Conversion invoice | `/dev/docs/conversion` | SAC 9988 |
| CoC | `/print/coc/$id` | Not a NABL / BIS licence |
| Pour slip | `/print/pour/$id` | Shop document. Not a tax invoice. No IRN. |
| Knockout slip | `/print/knockout/$id` | Shop document. Not a tax invoice. No IRN. |
| Opening JW confirmation | `/print/opening-jw/$id` | Cutover — **not** a delivery challan, **not** a tax invoice. Ageing from original challan date. Due = challan + 365 (inputs). |
| Cutover pack | `/print/cutover-pack` | T–21 … T+10 sign-off. Tally is not the book of record. |
| GSTR-1 worksheet | `/gst` | B2B, B2CL, CDNR, HSN Table 12, documents-issued |
| GSTR-3B worksheet | `/gst` | 3.1 outward; ITC from **POSTED** vendor bills only |
| ITC-04 | `/gst` | Tables 4 / 5A / 5B; H1 if turnover > ₹5 Cr else FY |
| Serial integrity | `/gst` | Rule 46 serial; FY gaps in red |

Watermark on worksheets: **Worksheet only. Not a filed return.**
