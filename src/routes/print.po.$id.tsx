import { createFileRoute } from "@tanstack/react-router";
import { getPurchaseOrderDetail } from "@/lib/erp/api-po";
import { formatINR, formatKg, n } from "@/lib/erp/format";
import { linesOf } from "@/components/data-table";
import { useQuery } from "@tanstack/react-query";
import type { Row } from "@/lib/erp/row";

export const Route = createFileRoute("/print/po/$id")({ component: PoPrint });

function PoPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["po-detail", id],
    queryFn: () => getPurchaseOrderDetail({ data: { id: Number(id) } }),
  });

  if (q.isError) return <p className="p-8 text-red-600">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-gray-400">Loading PO…</p>;

  const { po, lines: rawLines, company } = q.data;
  const lines = rawLines as Row[];

  // ── Compute PO value ─────────────────────────────────────────────────────
  const activeLines = lines.filter((l) => !l.cancelled);
  const subtotalPaise = activeLines.reduce((s, l) => {
    const qty = (l.uom as string) === "KG" ? n(l.qty_kg) : n(l.qty_pcs);
    const rate = (l.uom as string) === "KG" ? n(l.rate_paise_per_kg) : n(l.rate_paise_per_pc);
    const disc = n(l.discount_pct);
    return s + Math.round(qty * rate * (1 - disc / 100));
  }, 0);
  const discPct = n(po.discount_pct);
  const headerDiscPaise = Math.round(subtotalPaise * discPct / 100);
  const addsPaise = n(po.freight_paise) + n(po.pnf_paise) + n(po.insurance_paise) + n(po.other_charges_paise);
  const netBeforeTax = subtotalPaise - headerDiscPaise + addsPaise;
  const cgstPaise = Math.round(netBeforeTax * n(po.cgst_pct) / 100);
  const sgstPaise = Math.round(netBeforeTax * n(po.sgst_pct) / 100);
  const totalPaise = netBeforeTax + cgstPaise + sgstPaise;

  const co = company as Row;

  return (
    <div className="min-h-screen bg-white p-0 print:p-0">
      <style>{`
        @page { size: A4; margin: 12mm 15mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; color: #1a1a1a; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #bbb; padding: 4px 6px; }
        th { background: #1e3a5f; color: #fff; font-weight: 600; text-align: left; }
        .no-border td, .no-border th { border: none; }
        .section-label { color: #b8860b; font-weight: 700; font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ borderBottom: "2px solid #1e3a5f", marginBottom: 10, paddingBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#1e3a5f", letterSpacing: -0.5 }}>
              {co?.name as string ?? "Tamba Brass Works Pvt Ltd"}
            </div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>
              {co?.address_line1 as string}, {co?.city as string}, {co?.state as string} — {co?.pincode as string}
            </div>
            <div style={{ fontSize: 9, color: "#555" }}>
              GSTIN: <strong>{co?.gstin as string}</strong>
              {co?.phone ? ` | Ph: ${co.phone as string}` : ""}
              {co?.email ? ` | ${co.email as string}` : ""}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1e3a5f" }}>PURCHASE ORDER</div>
            <div style={{ fontSize: 9, marginTop: 4 }}>
              <div><strong>PO No.:</strong> <span style={{ fontFamily: "monospace" }}>{po.doc_no as string}</span></div>
              <div><strong>Date:</strong> {String(po.order_date).slice(0, 10)}</div>
              {po.expected_date && (
                <div><strong>Due Date:</strong> {String(po.expected_date).slice(0, 10)}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Vendor block ────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <div style={{ flex: 1, border: "1px solid #bbb", borderRadius: 3, padding: "6px 8px" }}>
          <div className="section-label">To Vendor</div>
          <div style={{ fontWeight: 700, fontSize: 11, marginTop: 3 }}>{po.partner_name as string}</div>
          {po.attn_name ? <div style={{ fontSize: 9 }}>Attn: {po.attn_name as string}</div> : null}
          {po.address_line1 ? <div style={{ fontSize: 9, color: "#444" }}>{po.address_line1 as string}{po.city ? `, ${po.city as string}` : ""}</div> : null}
          {po.partner_gstin ? <div style={{ fontSize: 9, fontFamily: "monospace" }}>GSTIN: {po.partner_gstin as string}</div> : null}
        </div>
        <div style={{ minWidth: 240, border: "1px solid #bbb", borderRadius: 3, padding: "6px 8px" }}>
          <div className="section-label">PO Details</div>
          <table style={{ fontSize: 9, marginTop: 4, width: "100%" }}>
            <tbody>
              {po.ref_quote ? (
                <tr><td style={{ border: "none", padding: "1px 0", color: "#555" }}>Ref Quote</td><td style={{ border: "none", fontFamily: "monospace" }}>{po.ref_quote as string}</td></tr>
              ) : null}
              {po.remarks_internal ? (
                <tr><td style={{ border: "none", padding: "1px 0", color: "#555" }}>Remarks</td><td style={{ border: "none" }}>{po.remarks_internal as string}</td></tr>
              ) : null}
            </tbody>
          </table>
          <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
            {po.rejection_tracking ? (
              <div style={{ background: "#fff3cd", border: "1px solid #f0ad4e", borderRadius: 2, padding: "2px 6px", fontSize: 8, fontWeight: 700 }}>
                ✓ REJECTION RE-TRACKING REQUIRED
              </div>
            ) : null}
            {po.test_cert_required ? (
              <div style={{ background: "#d1ecf1", border: "1px solid #bee5eb", borderRadius: 2, padding: "2px 6px", fontSize: 8, fontWeight: 700 }}>
                ✓ TEST CERTIFICATE REQUIRED
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Line Items ──────────────────────────────────────────────────── */}
      <table style={{ marginBottom: 10, fontSize: 9 }}>
        <thead>
          <tr>
            <th style={{ width: 30, textAlign: "center" }}>Sl.</th>
            <th style={{ width: 90 }}>Item Code</th>
            <th>Item / Part Name</th>
            <th style={{ width: 60 }}>Drg. No.</th>
            <th style={{ width: 35, textAlign: "center" }}>UOM</th>
            <th style={{ width: 55, textAlign: "right" }}>Qty</th>
            <th style={{ width: 70, textAlign: "right" }}>Rate ₹</th>
            <th style={{ width: 40, textAlign: "center" }}>Disc %</th>
            <th style={{ width: 80, textAlign: "right" }}>Amount ₹</th>
            <th style={{ width: 55, textAlign: "center" }}>HSN</th>
            <th style={{ width: 35, textAlign: "center" }}>Cancl?</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => {
            const qty = (l.uom as string) === "KG" ? n(l.qty_kg) : n(l.qty_pcs);
            const rate = (l.uom as string) === "KG" ? n(l.rate_paise_per_kg) : n(l.rate_paise_per_pc);
            const disc = n(l.discount_pct);
            const amtPaise = Math.round(qty * rate * (1 - disc / 100));

            return (
              <tr key={l.id as number} style={{ background: i % 2 === 0 ? "#fff" : "#f8f8f8", textDecoration: l.cancelled ? "line-through" : "none", color: l.cancelled ? "#999" : "inherit" }}>
                <td style={{ textAlign: "center" }}>{i + 1}</td>
                <td style={{ fontFamily: "monospace" }}>{l.sku as string}</td>
                <td>{l.item_name as string}</td>
                <td style={{ fontFamily: "monospace", fontSize: 8 }}>{(l.drawing_no as string) || "—"}</td>
                <td style={{ textAlign: "center" }}>{l.uom as string}</td>
                <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                  {(l.uom as string) === "KG" ? formatKg(l.qty_kg).replace(" ", "") : n(l.qty_pcs).toLocaleString("en-IN")}
                </td>
                <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                  {((l.uom as string) === "KG" ? n(l.rate_paise_per_kg) : n(l.rate_paise_per_pc)) > 0
                    ? `₹ ${(((l.uom as string) === "KG" ? n(l.rate_paise_per_kg) : n(l.rate_paise_per_pc)) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                    : "—"}
                </td>
                <td style={{ textAlign: "center" }}>{disc > 0 ? `${disc}%` : "—"}</td>
                <td style={{ textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                  {amtPaise > 0 ? `₹ ${(amtPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                </td>
                <td style={{ textAlign: "center", fontFamily: "monospace", fontSize: 8 }}>{(l.hsn as string) || "—"}</td>
                <td style={{ textAlign: "center" }}>{l.cancelled ? "YES" : "—"}</td>
              </tr>
            );
          })}
          {/* Empty rows to minimum 8 lines */}
          {Array.from({ length: Math.max(0, 8 - lines.length) }).map((_, i) => (
            <tr key={`empty-${i}`} style={{ height: 20 }}>
              {Array.from({ length: 11 }).map((_, j) => (
                <td key={j} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Summary ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
        <table style={{ width: 300, fontSize: 9 }}>
          <tbody>
            <tr>
              <td style={{ border: "none", padding: "2px 0", color: "#555" }}>Subtotal</td>
              <td style={{ border: "none", textAlign: "right", fontFamily: "monospace" }}>{formatINR(subtotalPaise)}</td>
            </tr>
            {discPct > 0 && (
              <tr>
                <td style={{ border: "none", padding: "2px 0", color: "#555" }}>Less: Discount ({discPct}%)</td>
                <td style={{ border: "none", textAlign: "right", fontFamily: "monospace", color: "#c00" }}>−{formatINR(headerDiscPaise)}</td>
              </tr>
            )}
            {n(po.freight_paise) > 0 && (
              <tr>
                <td style={{ border: "none", padding: "2px 0", color: "#555" }}>Freight</td>
                <td style={{ border: "none", textAlign: "right", fontFamily: "monospace" }}>{formatINR(n(po.freight_paise))}</td>
              </tr>
            )}
            {n(po.pnf_paise) > 0 && (
              <tr>
                <td style={{ border: "none", padding: "2px 0", color: "#555" }}>P&F</td>
                <td style={{ border: "none", textAlign: "right", fontFamily: "monospace" }}>{formatINR(n(po.pnf_paise))}</td>
              </tr>
            )}
            {n(po.insurance_paise) > 0 && (
              <tr>
                <td style={{ border: "none", padding: "2px 0", color: "#555" }}>Insurance</td>
                <td style={{ border: "none", textAlign: "right", fontFamily: "monospace" }}>{formatINR(n(po.insurance_paise))}</td>
              </tr>
            )}
            {n(po.other_charges_paise) > 0 && (
              <tr>
                <td style={{ border: "none", padding: "2px 0", color: "#555" }}>Other Charges</td>
                <td style={{ border: "none", textAlign: "right", fontFamily: "monospace" }}>{formatINR(n(po.other_charges_paise))}</td>
              </tr>
            )}
            <tr style={{ borderTop: "1px solid #bbb" }}>
              <td style={{ border: "none", padding: "3px 0", color: "#555" }}>Net Before Tax</td>
              <td style={{ border: "none", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{formatINR(netBeforeTax)}</td>
            </tr>
            {cgstPaise > 0 && (
              <tr>
                <td style={{ border: "none", padding: "2px 0", color: "#555" }}>CGST {n(po.cgst_pct)}%</td>
                <td style={{ border: "none", textAlign: "right", fontFamily: "monospace" }}>{formatINR(cgstPaise)}</td>
              </tr>
            )}
            {sgstPaise > 0 && (
              <tr>
                <td style={{ border: "none", padding: "2px 0", color: "#555" }}>SGST {n(po.sgst_pct)}%</td>
                <td style={{ border: "none", textAlign: "right", fontFamily: "monospace" }}>{formatINR(sgstPaise)}</td>
              </tr>
            )}
            <tr style={{ background: "#1e3a5f" }}>
              <td style={{ border: "none", padding: "5px 6px", color: "#fff", fontWeight: 700, fontSize: 11 }}>P.O. VALUE</td>
              <td style={{ border: "none", textAlign: "right", color: "#f5c842", fontFamily: "monospace", fontWeight: 800, fontSize: 13 }}>{formatINR(totalPaise)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Terms & Conditions ───────────────────────────────────────────── */}
      {po.terms_text ? (
        <div style={{ border: "1px solid #bbb", borderRadius: 3, padding: "6px 8px", marginBottom: 10, fontSize: 9 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Terms & Conditions</div>
          <div style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{po.terms_text as string}</div>
        </div>
      ) : null}

      {/* ── Signature block ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <div style={{ width: "45%", borderTop: "1px solid #bbb", paddingTop: 6, textAlign: "center", fontSize: 9, color: "#555" }}>
          Vendor Signature & Stamp
        </div>
        <div style={{ width: "45%", borderTop: "1px solid #bbb", paddingTop: 6, textAlign: "center", fontSize: 9, color: "#555" }}>
          For {co?.trade_name as string ?? co?.name as string}<br />
          <span style={{ fontSize: 8 }}>Authorised Signatory</span>
        </div>
      </div>

      {/* ── Print button ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex justify-center print:hidden">
        <button
          onClick={() => window.print()}
          style={{ background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 4, padding: "8px 24px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
        >
          🖨 Print / Save PDF
        </button>
      </div>
    </div>
  );
}
