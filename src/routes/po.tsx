import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel, linesOf } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { listMasters } from "@/lib/erp/api";
import {
  cancelPoLine,
  closePurchaseOrder,
  createPurchaseOrder,
  listPurchaseOrders,
} from "@/lib/erp/api-po";
import { formatINR, formatKg, n } from "@/lib/erp/format";
import type { Row } from "@/lib/erp/row";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Printer, Trash2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/po")({ component: PoPage });

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULT_TERMS =
  "1. Payments: AGAINST PROFORMA INVOICE\n2. Taxes: GST EXTRA AS APPLICABLE\n3. TEST CERTIFICATE — 3.1 CERTIFICATE REQUIRED WITH MATERIAL";

type PoLineState = {
  key: number;
  itemId: string;
  sku: string;
  itemName: string;
  drawingNo: string;
  hsn: string;
  uom: "KG" | "PCS";
  qty: string;
  rateRs: string;        // rate in ₹ (converted to paise on save)
  discountPct: string;
  cancelled: boolean;
};

let _lineKey = 0;
const newLine = (): PoLineState => ({
  key: ++_lineKey,
  itemId: "",
  sku: "",
  itemName: "",
  drawingNo: "",
  hsn: "",
  uom: "KG",
  qty: "",
  rateRs: "",
  discountPct: "0",
  cancelled: false,
});

/** Compute line amount in paise */
function lineAmtPaise(l: PoLineState): number {
  const qty = parseFloat(l.qty) || 0;
  const rate = parseFloat(l.rateRs) || 0; // ₹
  const disc = parseFloat(l.discountPct) || 0;
  return Math.round(qty * rate * 100 * (1 - disc / 100));
}

interface PoSummary {
  subtotalPaise: number;
  headerDiscPaise: number;
  netBeforeTaxPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
}

function computeSummary(
  lines: PoLineState[],
  discPct: number,
  freightRs: number,
  pnfRs: number,
  insurRs: number,
  otherRs: number,
  cgstPct: number,
  sgstPct: number,
): PoSummary {
  const subtotalPaise = lines.filter((l) => !l.cancelled).reduce((s, l) => s + lineAmtPaise(l), 0);
  const headerDiscPaise = Math.round(subtotalPaise * discPct / 100);
  const addsPaise =
    Math.round(freightRs * 100) +
    Math.round(pnfRs * 100) +
    Math.round(insurRs * 100) +
    Math.round(otherRs * 100);
  const netBeforeTaxPaise = subtotalPaise - headerDiscPaise + addsPaise;
  const cgstPaise = Math.round(netBeforeTaxPaise * cgstPct / 100);
  const sgstPaise = Math.round(netBeforeTaxPaise * sgstPct / 100);
  const igstPaise = 0; // IGST on PO is rare — shown but 0 for now
  const totalPaise = netBeforeTaxPaise + cgstPaise + sgstPaise + igstPaise;
  return { subtotalPaise, headerDiscPaise, netBeforeTaxPaise, cgstPaise, sgstPaise, igstPaise, totalPaise };
}

// ─────────────────────────────────────────────────────────────────────────────
function PoPage() {
  const qc = useQueryClient();
  const pos = useQuery({ queryKey: ["pos"], queryFn: () => listPurchaseOrders() });
  const masters = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [partnerId, setPartnerId] = useState("");
  const [attnName, setAttnName] = useState("");
  const [orderDate, setOrderDate] = useState(TODAY);
  const [dueDate, setDueDate] = useState("");
  const [remarksInternal, setRemarksInternal] = useState("");
  const [refQuote, setRefQuote] = useState("");
  const [rejTracking, setRejTracking] = useState(false);
  const [testCert, setTestCert] = useState(false);
  const [discPct, setDiscPct] = useState("0");
  const [freightRs, setFreightRs] = useState("0");
  const [pnfRs, setPnfRs] = useState("0");
  const [insurRs, setInsurRs] = useState("0");
  const [cgstPct, setCgstPct] = useState("0");
  const [sgstPct, setSgstPct] = useState("0");
  const [otherRs, setOtherRs] = useState("0");
  const [termsText, setTermsText] = useState(DEFAULT_TERMS);
  const [lines, setLines] = useState<PoLineState[]>([newLine()]);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const vendors = (masters.data?.partners ?? []).filter((p) => p.is_vendor);
  const items = masters.data?.items ?? [];
  const selVendor = vendors.find((v) => String(v.id) === partnerId);

  const summary = useMemo(
    () =>
      computeSummary(
        lines,
        parseFloat(discPct) || 0,
        parseFloat(freightRs) || 0,
        parseFloat(pnfRs) || 0,
        parseFloat(insurRs) || 0,
        parseFloat(otherRs) || 0,
        parseFloat(cgstPct) || 0,
        parseFloat(sgstPct) || 0,
      ),
    [lines, discPct, freightRs, pnfRs, insurRs, otherRs, cgstPct, sgstPct],
  );

  // ── Mutations ───────────────────────────────────────────────────────────────
  const create = useMutation({
    mutationFn: () =>
      createPurchaseOrder({
        data: {
          partnerId: Number(partnerId),
          orderDate,
          expectedDate: dueDate || undefined,
          attnName: attnName || undefined,
          remarksInternal: remarksInternal || undefined,
          refQuote: refQuote || undefined,
          rejectionTracking: rejTracking,
          testCertRequired: testCert,
          discountPct: parseFloat(discPct) || 0,
          freightPaise: Math.round((parseFloat(freightRs) || 0) * 100),
          pnfPaise: Math.round((parseFloat(pnfRs) || 0) * 100),
          insurancePaise: Math.round((parseFloat(insurRs) || 0) * 100),
          cgstPct: parseFloat(cgstPct) || 0,
          sgstPct: parseFloat(sgstPct) || 0,
          otherChargesPaise: Math.round((parseFloat(otherRs) || 0) * 100),
          termsText: termsText || undefined,
          lines: lines
            .filter((l) => l.itemId)
            .map((l, i) => ({
              itemId: Number(l.itemId),
              uom: l.uom,
              qtyKg: l.uom === "KG" ? parseFloat(l.qty) || 0 : 0,
              qtyPcs: l.uom === "PCS" ? parseFloat(l.qty) || 0 : 0,
              ratePaisePerKg: l.uom === "KG" ? Math.round((parseFloat(l.rateRs) || 0) * 100) : 0,
              ratePaisePerPc: l.uom === "PCS" ? Math.round((parseFloat(l.rateRs) || 0) * 100) : 0,
              discountPct: parseFloat(l.discountPct) || 0,
              seq: (i + 1) * 10,
            })),
        },
      }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} created successfully`);
      setShowForm(false);
      setCreatedId(r.id);
      resetForm();
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelLine = useMutation({
    mutationFn: (lineId: number) => cancelPoLine({ data: { lineId } }),
    onSuccess: () => {
      toast.success("Line cancelled");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const closePo = useMutation({
    mutationFn: (id: number) => closePurchaseOrder({ data: { id, reason: "Manual cancel" } }),
    onSuccess: () => {
      toast.success("PO cancelled");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function resetForm() {
    setPartnerId("");
    setAttnName("");
    setOrderDate(TODAY);
    setDueDate("");
    setRemarksInternal("");
    setRefQuote("");
    setRejTracking(false);
    setTestCert(false);
    setDiscPct("0");
    setFreightRs("0");
    setPnfRs("0");
    setInsurRs("0");
    setCgstPct("0");
    setSgstPct("0");
    setOtherRs("0");
    setTermsText(DEFAULT_TERMS);
    setLines([newLine()]);
  }

  function updateLine(key: number, patch: Partial<PoLineState>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((prev) => [...prev, newLine()]);
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function pickItem(key: number, itemId: string) {
    const item = items.find((i) => String(i.id) === itemId);
    updateLine(key, {
      itemId,
      sku: (item?.sku as string) ?? "",
      itemName: (item?.name as string) ?? "",
      drawingNo: (item?.drawing_no as string) ?? "",
      hsn: (item?.hsn as string) ?? "",
      uom: item?.stock_uom === "PCS" ? "PCS" : "KG",
      rateRs: item?.purchase_rate_paise
        ? String(n(item.purchase_rate_paise) / 100)
        : "",
    });
  }

  const filtered = (pos.data ?? []).filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (p.doc_no as string).toLowerCase().includes(s) ||
      (p.partner_name as string).toLowerCase().includes(s)
    );
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <PageHeader kicker="Purchase" title="Purchase Orders">
        {!showForm && (
          <Button
            id="new-po-btn"
            onClick={() => {
              setShowForm(true);
              setCreatedId(null);
            }}
          >
            <Plus className="mr-1.5 size-4" /> New PO
          </Button>
        )}
      </PageHeader>

      {/* ── New PO Form ───────────────────────────────────────────────────── */}
      {showForm && (
        <Panel
          title="Purchase Order — (Outgoing)"
          actions={
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-muted hover:text-danger"
              aria-label="Close form"
            >
              <X className="size-4" />
            </button>
          }
          className="mb-4"
        >
          <form
            className="p-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            {/* ── Section 1: Vendor + PO Details ─────────────────────────── */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Left: Vendor Details */}
              <fieldset className="space-y-2">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-brass-deep">
                  Vendor Details
                </legend>
                <Field label="To Vendor *">
                  <Select
                    id="po-vendor"
                    value={partnerId}
                    onChange={(e) => setPartnerId(e.target.value)}
                    required
                  >
                    <option value="">— Select vendor —</option>
                    {vendors.map((v) => (
                      <option key={v.id as number} value={v.id as number}>
                        {v.name as string}
                      </option>
                    ))}
                  </Select>
                </Field>
                {selVendor && (
                  <div className="rounded-sm border border-line bg-cream px-2.5 py-1.5 text-xs text-muted">
                    {selVendor.address_line1 as string}
                    {selVendor.city ? `, ${selVendor.city as string}` : ""}
                    {selVendor.gstin ? (
                      <span className="ml-2 font-mono">{selVendor.gstin as string}</span>
                    ) : null}
                  </div>
                )}
                <Field label="Kind Attn">
                  <Input
                    id="po-attn"
                    value={attnName}
                    onChange={(e) => setAttnName(e.target.value)}
                    placeholder="Attention person"
                  />
                </Field>
                <Field label="Remarks (Internal Use)">
                  <Textarea
                    id="po-remarks"
                    value={remarksInternal}
                    onChange={(e) => setRemarksInternal(e.target.value)}
                    rows={2}
                    placeholder="Internal notes, not printed"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Ref Quote">
                    <Input
                      id="po-ref-quote"
                      value={refQuote}
                      onChange={(e) => setRefQuote(e.target.value)}
                      placeholder="QTN/26-27/…"
                    />
                  </Field>
                </div>
              </fieldset>

              {/* Right: Our P.O. Details */}
              <fieldset className="space-y-2">
                <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-brass-deep">
                  Our P.O. Details
                </legend>
                <div className="rounded-sm border border-brass/30 bg-brass/5 px-3 py-2 font-mono text-sm text-navy">
                  PO No. will be auto-assigned on save (PO/26-27/…)
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="PO Date *">
                    <Input
                      id="po-date"
                      type="date"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Due Date">
                    <Input
                      id="po-due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </Field>
                </div>
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                    <input
                      id="po-rej-tracking"
                      type="checkbox"
                      checked={rejTracking}
                      onChange={(e) => setRejTracking(e.target.checked)}
                      className="h-4 w-4 accent-navy"
                    />
                    Rejection Re-Tracking with this PO Required
                  </label>
                  <label className="flex items-center gap-2 text-sm text-navy cursor-pointer">
                    <input
                      id="po-test-cert"
                      type="checkbox"
                      checked={testCert}
                      onChange={(e) => setTestCert(e.target.checked)}
                      className="h-4 w-4 accent-navy"
                    />
                    Test Certificate Required (if YES tick this button)
                  </label>
                </div>
              </fieldset>
            </div>

            {/* ── Section 2: Line Items ────────────────────────────────────── */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brass-deep">
                  Item Lines
                </h3>
                <button
                  type="button"
                  onClick={addLine}
                  className="flex items-center gap-1 text-xs text-navy underline"
                >
                  <Plus className="size-3" /> Add line
                </button>
              </div>
              <div className="overflow-x-auto rounded-sm border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-navy text-cream">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium">Sl.</th>
                      <th className="px-2 py-1.5 text-left font-medium">Item / Part No.</th>
                      <th className="px-2 py-1.5 text-left font-medium">Part Name</th>
                      <th className="px-2 py-1.5 text-left font-medium">Drg. No.</th>
                      <th className="px-2 py-1.5 text-left font-medium">UOM</th>
                      <th className="px-2 py-1.5 text-left font-medium">Qty</th>
                      <th className="px-2 py-1.5 text-left font-medium">Rate ₹</th>
                      <th className="px-2 py-1.5 text-left font-medium">Disc %</th>
                      <th className="px-2 py-1.5 text-right font-medium">Amount ₹</th>
                      <th className="px-2 py-1.5 text-left font-medium">HSN</th>
                      <th className="px-2 py-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, idx) => (
                      <tr
                        key={l.key}
                        className={`border-t border-line ${l.cancelled ? "opacity-50 line-through" : ""}`}
                      >
                        <td className="px-2 py-1 tabular text-muted">{idx + 1}</td>
                        <td className="px-2 py-1 min-w-44">
                          <Select
                            value={l.itemId}
                            onChange={(e) => pickItem(l.key, e.target.value)}
                          >
                            <option value="">— Pick item —</option>
                            {items.map((i) => (
                              <option key={i.id as number} value={i.id as number}>
                                {i.sku as string}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-2 py-1 min-w-36 text-xs text-muted">{l.itemName}</td>
                        <td className="px-2 py-1 font-mono text-xs text-muted">{l.drawingNo}</td>
                        <td className="px-2 py-1 min-w-20">
                          <Select
                            value={l.uom}
                            onChange={(e) => updateLine(l.key, { uom: e.target.value as "KG" | "PCS" })}
                          >
                            <option value="KG">KG</option>
                            <option value="PCS">PCS</option>
                          </Select>
                        </td>
                        <td className="px-2 py-1 min-w-24">
                          <Input
                            type="number"
                            min="0"
                            step="0.001"
                            value={l.qty}
                            onChange={(e) => updateLine(l.key, { qty: e.target.value })}
                            placeholder="0.000"
                          />
                        </td>
                        <td className="px-2 py-1 min-w-28">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={l.rateRs}
                            onChange={(e) => updateLine(l.key, { rateRs: e.target.value })}
                            placeholder="₹/unit"
                          />
                        </td>
                        <td className="px-2 py-1 min-w-20">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={l.discountPct}
                            onChange={(e) => updateLine(l.key, { discountPct: e.target.value })}
                          />
                        </td>
                        <td className="px-2 py-1 tabular text-right font-mono text-navy">
                          {lineAmtPaise(l) > 0
                            ? `₹ ${(lineAmtPaise(l) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                            : "—"}
                        </td>
                        <td className="px-2 py-1 font-mono text-xs">{l.hsn || "—"}</td>
                        <td className="px-2 py-1">
                          {lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(l.key)}
                              className="text-muted hover:text-danger"
                              aria-label="Remove line"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Section 3: Terms & Conditions + Charges ──────────────────── */}
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
              <Field label="Terms & Conditions">
                <Textarea
                  id="po-terms"
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                  rows={4}
                />
              </Field>

              {/* Charges panel */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-brass-deep">
                  Charges & Taxes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Discount %">
                    <Input
                      id="po-disc-pct"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={discPct}
                      onChange={(e) => setDiscPct(e.target.value)}
                    />
                  </Field>
                  <Field label="Freight ₹">
                    <Input
                      id="po-freight"
                      type="number"
                      min="0"
                      step="0.01"
                      value={freightRs}
                      onChange={(e) => setFreightRs(e.target.value)}
                    />
                  </Field>
                  <Field label="P&F ₹">
                    <Input
                      id="po-pnf"
                      type="number"
                      min="0"
                      step="0.01"
                      value={pnfRs}
                      onChange={(e) => setPnfRs(e.target.value)}
                    />
                  </Field>
                  <Field label="Insurance ₹">
                    <Input
                      id="po-insur"
                      type="number"
                      min="0"
                      step="0.01"
                      value={insurRs}
                      onChange={(e) => setInsurRs(e.target.value)}
                    />
                  </Field>
                  <Field label="CGST %">
                    <Input
                      id="po-cgst"
                      type="number"
                      min="0"
                      max="28"
                      step="0.01"
                      value={cgstPct}
                      onChange={(e) => setCgstPct(e.target.value)}
                    />
                  </Field>
                  <Field label="SGST %">
                    <Input
                      id="po-sgst"
                      type="number"
                      min="0"
                      max="28"
                      step="0.01"
                      value={sgstPct}
                      onChange={(e) => setSgstPct(e.target.value)}
                    />
                  </Field>
                  <Field label="Other Charges ₹" className="col-span-2">
                    <Input
                      id="po-other"
                      type="number"
                      min="0"
                      step="0.01"
                      value={otherRs}
                      onChange={(e) => setOtherRs(e.target.value)}
                    />
                  </Field>
                </div>
                {/* PO Value box — highlighted like Bhargavi */}
                <div className="rounded-sm border-2 border-brass bg-brass/10 px-3 py-2.5">
                  <div className="text-micro uppercase tracking-wider text-muted">PO Value</div>
                  <div className="mt-0.5 font-mono text-xl font-bold tabular text-navy">
                    {formatINR(summary.totalPaise)}
                  </div>
                  {(parseFloat(cgstPct) > 0 || parseFloat(sgstPct) > 0) && (
                    <div className="mt-1 space-y-0.5 text-xs text-muted">
                      <div>Subtotal: {formatINR(summary.subtotalPaise)}</div>
                      {parseFloat(discPct) > 0 && (
                        <div>Disc: −{formatINR(summary.headerDiscPaise)}</div>
                      )}
                      <div>Net before tax: {formatINR(summary.netBeforeTaxPaise)}</div>
                      {parseFloat(cgstPct) > 0 && (
                        <div>CGST {cgstPct}%: {formatINR(summary.cgstPaise)}</div>
                      )}
                      {parseFloat(sgstPct) > 0 && (
                        <div>SGST {sgstPct}%: {formatINR(summary.sgstPaise)}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Footer Actions ────────────────────────────────────────────── */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div className="flex gap-2">
                <Button
                  id="po-save-btn"
                  type="submit"
                  disabled={create.isPending || !partnerId || lines.filter((l) => l.itemId).length === 0}
                >
                  {create.isPending ? "Saving…" : "Save PO"}
                </Button>
                {createdId && (
                  <Link
                    to="/print/po/$id"
                    params={{ id: String(createdId) }}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-sm border border-navy px-3 py-1.5 text-sm text-navy hover:bg-navy hover:text-cream"
                  >
                    <Printer className="size-4" /> Print with Tax
                  </Link>
                )}
              </div>
              <button
                type="button"
                className="text-sm text-muted underline"
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* ── PO List ────────────────────────────────────────────────────────── */}
      <Panel
        title={`Purchase Orders (${(pos.data ?? []).length})`}
        actions={
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO No. or vendor…"
            className="h-7 w-48 text-xs"
          />
        }
      >
        {pos.isLoading ? (
          <Empty>Loading…</Empty>
        ) : (filtered.length === 0) ? (
          <Empty>No purchase orders{search ? " matching your search" : " yet"}</Empty>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th>PO No.</th>
                <th>Vendor</th>
                <th>Date</th>
                <th>Due</th>
                <th>Lines</th>
                <th>Qty / UOM</th>
                <th>PO Value</th>
                <th>TC</th>
                <th>Rej</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const plines = linesOf<{
                  id: number;
                  sku: string;
                  uom: string;
                  qty_kg: string;
                  qty_pcs: string;
                  rate_paise_per_kg: number;
                  rate_paise_per_pc: number;
                  discount_pct: string;
                  cancelled: boolean;
                }>(p.lines);
                const activeLines = plines.filter((l) => !l.cancelled);
                const firstLine = activeLines[0];

                // Compute total paise from line data
                const totalPaise = activeLines.reduce((s, l) => {
                  const qty = l.uom === "KG" ? n(l.qty_kg) : n(l.qty_pcs);
                  const rate = l.uom === "KG" ? n(l.rate_paise_per_kg) : n(l.rate_paise_per_pc);
                  const disc = n(l.discount_pct);
                  return s + Math.round(qty * rate * (1 - disc / 100));
                }, 0);

                const addsPaise =
                  n(p.freight_paise) + n(p.pnf_paise) + n(p.insurance_paise) + n(p.other_charges_paise);
                const discAmt = Math.round(totalPaise * n(p.discount_pct) / 100);
                const net = totalPaise - discAmt + addsPaise;
                const tax = Math.round(net * (n(p.cgst_pct) + n(p.sgst_pct)) / 100);
                const grandTotal = net + tax;

                return (
                  <tr key={p.id as number}>
                    <td className="font-mono">{p.doc_no as string}</td>
                    <td>{p.partner_name as string}</td>
                    <td className="tabular">{String(p.order_date).slice(0, 10)}</td>
                    <td className="tabular text-muted">
                      {p.expected_date ? String(p.expected_date).slice(0, 10) : "—"}
                    </td>
                    <td className="tabular">{activeLines.length}</td>
                    <td className="font-mono text-xs">
                      {firstLine
                        ? `${firstLine.sku} · ${firstLine.uom === "KG" ? formatKg(firstLine.qty_kg) + " kg" : n(firstLine.qty_pcs).toLocaleString("en-IN") + " pcs"}`
                        : "—"}
                      {activeLines.length > 1 ? ` +${activeLines.length - 1}` : ""}
                    </td>
                    <td className="tabular font-mono text-navy">
                      {grandTotal > 0 ? formatINR(grandTotal) : "—"}
                    </td>
                    <td>
                      {p.test_cert_required ? (
                        <span className="text-xs font-semibold text-warn" title="Test Cert Required">TC✓</span>
                      ) : null}
                    </td>
                    <td>
                      {p.rejection_tracking ? (
                        <span className="text-xs font-semibold text-warn" title="Rejection Re-Tracking">RJ✓</span>
                      ) : null}
                    </td>
                    <td>
                      <Badge tone={p.status as string}>{p.status as string}</Badge>
                    </td>
                    <td className="whitespace-nowrap">
                      <Link
                        to="/print/po/$id"
                        params={{ id: String(p.id) }}
                        target="_blank"
                        className="text-sm text-navy underline"
                      >
                        Print
                      </Link>
                      {(p.status as string) === "OPEN" || (p.status as string) === "PARTIAL" ? (
                        <button
                          type="button"
                          className="ml-2 text-sm text-danger underline"
                          onClick={() => {
                            if (confirm(`Cancel PO ${p.doc_no as string}?`)) {
                              closePo.mutate(p.id as number);
                            }
                          }}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </AppShell>
  );
}
