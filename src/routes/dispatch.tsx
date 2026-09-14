import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel, linesOf } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { listOnHand, listOpenDocs, getBootstrap } from "@/lib/erp/api";
import { dispatchSo } from "@/lib/erp/api-sales";
import { cancelIrn, gateOut, generateEway, generateIrn, previewEway } from "@/lib/erp/api-irp";
import { formatINR, formatKg, formatPcs, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dispatch")({ component: DispatchPage });

function DispatchPage() {
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const lots = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const boot = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap() });
  const [soId, setSoId] = useState("");
  const [lotId, setLotId] = useState("");
  const [qty, setQty] = useState("5000");
  const [ownerOverride, setOwnerOverride] = useState(false);
  const [vehicle, setVehicle] = useState("GJ01AB1234");
  const [distanceKm, setDistanceKm] = useState("18");
  const [skip50, setSkip50] = useState(false);
  const [simulate, setSimulate] = useState("");
  const [partAText, setPartAText] = useState("");
  const sos = docs.data?.sos ?? [];
  const nippleSo = sos.find((s) => linesOf<{ sku: string }>(s.lines)[0]?.sku === "HEX-NIPPLE-1/2-NCR");
  const selectedSo = sos.find((s) => String(s.id) === (soId || String(nippleSo?.id ?? sos[0]?.id))) ?? sos[0];
  const soSku = linesOf<{ sku: string }>(selectedSo?.lines)[0]?.sku;
  const fgLots = (lots.data ?? []).filter(
    (l) =>
      l.status === "AVAILABLE" &&
      n(l.qty_pcs) > 0 &&
      (l.warehouse === "FG-DOM" || l.warehouse === "FG-EXP") &&
      (!soSku || l.sku === soSku),
  );
  const mut = useMutation({
    mutationFn: () =>
      dispatchSo({
        data: {
          soId: Number(soId || selectedSo?.id),
          lotId: Number(lotId || fgLots[0]?.id),
          qtyPcs: n(qty),
          ownerOverride,
        },
      }),
    onSuccess: (r) => {
      toast.success(`${r.invoiceNo} net ${r.netKg} kg = packing ${r.packingNetKg} kg`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const irn = useMutation({
    mutationFn: (invoiceId: number) =>
      generateIrn({
        data: {
          docType: "INVOICE",
          docId: invoiceId,
          simulate: simulate === "duplicate" || simulate === "invalidGstin" ? simulate : undefined,
        },
      }),
    onSuccess: (r) => {
      toast.success(r.already ? `IRN already ${r.Irn.slice(0, 12)}…` : `IRN ${r.Irn.slice(0, 12)}…`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: (invoiceId: number) =>
      cancelIrn({
        data: {
          docType: "INVOICE",
          docId: invoiceId,
          simulate: simulate === "cancelWindow" ? "cancelWindow" : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("IRN cancelled");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const eway = useMutation({
    mutationFn: (invoiceId: number) =>
      generateEway({
        data: {
          docType: "INVOICE",
          docId: invoiceId,
          vehicle: skip50 ? undefined : vehicle,
          distanceKm: n(distanceKm),
          skipSameState50km: skip50,
        },
      }),
    onSuccess: (r) => {
      toast.success(`e-way ${r.ewbNo} · ${r.partA.subSupplyDesc}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const out = useMutation({
    mutationFn: (invoiceId: number) => gateOut({ data: { docType: "INVOICE", docId: invoiceId } }),
    onSuccess: () => {
      toast.success("Gate-out recorded (stock already moved on dispatch)");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const preview = useMutation({
    mutationFn: (invoiceId: number) => previewEway({ data: { docType: "INVOICE", docId: invoiceId } }),
    onSuccess: (r) => {
      setPartAText(
        `${r.docType} · ${r.subSupplyDesc} (subSupplyType ${r.subSupplyType}) · ${r.docNo} · bill ${r.billToGstin} ship ${r.shipToGstin}`,
      );
      toast.message(`Part A ${r.docType} · ${r.subSupplyDesc}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Sales / accounts" title="Dispatch — tax invoice + packing list" />
      <p className="mb-2 text-micro text-muted">
        Generate IRN from the posted snapshot (invoice number ≠ IRN). Cancel only within 24 hours of ack; after that
        issue a credit note (s.34). e-way does not move stock. Stub mode is the default — not a live NIC login.
      </p>
      <form
        className="mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <Field label="Sales order">
          <Select value={soId || String(selectedSo?.id ?? "")} onChange={(e) => setSoId(e.target.value)}>
            {sos.map((s) => {
              const ln = linesOf<{ sku: string }>(s.lines)[0];
              return (
                <option key={s.id as number} value={s.id as number}>
                  {s.doc_no as string} · {ln?.sku}
                </option>
              );
            })}
          </Select>
        </Field>
        <Field label="FG lot (AVAILABLE)">
          <Select value={lotId || String(fgLots[0]?.id ?? "")} onChange={(e) => setLotId(e.target.value)}>
            {fgLots.map((l) => (
              <option key={l.id as number} value={l.id as number}>
                {l.lot_no as string} · {l.sku as string} · {formatPcs(l.qty_pcs)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Pcs">
          <Input value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        {boot.data?.staff.role === "OWNER" ? (
          <label className="flex items-end gap-2 pb-2 text-sm text-navy">
            <input type="checkbox" checked={ownerOverride} onChange={(e) => setOwnerOverride(e.target.checked)} />
            Override credit / overdue
          </label>
        ) : (
          <p className="self-end pb-2 text-micro text-muted">Credit / overdue blocks dispatch unless Owner overrides.</p>
        )}
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={mut.isPending}>
            Dispatch + invoice
          </Button>
        </div>
      </form>
      <div className="mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-5">
        <Field label="Vehicle (Part B)">
          <Input value={vehicle} onChange={(e) => setVehicle(e.target.value.toUpperCase())} disabled={skip50} />
        </Field>
        <Field label="Distance km">
          <Input value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm text-navy">
          <input type="checkbox" checked={skip50} onChange={(e) => setSkip50(e.target.checked)} />
          ≤ 50 km same State/UT
        </label>
        <Field label="Stub simulate">
          <Select value={simulate} onChange={(e) => setSimulate(e.target.value)}>
            <option value="">none</option>
            <option value="duplicate">duplicate IRN</option>
            <option value="invalidGstin">invalid GSTIN</option>
            <option value="cancelWindow">cancel window closed</option>
          </Select>
        </Field>
      </div>
      {partAText ? <p className="mb-3 font-mono text-micro text-navy">Part A preview: {partAText}</p> : null}
      <Panel title="Invoices">
        <table className="app-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Taxable</th>
              <th>GST</th>
              <th>Total</th>
              <th>Net kg</th>
              <th>Packing kg</th>
              <th>IRN</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(docs.data?.invoices ?? []).map((inv) => {
              const gst = n(inv.cgst_paise) + n(inv.sgst_paise) + n(inv.igst_paise);
              const match = n(inv.net_kg) === n(inv.packing_net_kg);
              const posted = String(inv.status) === "POSTED";
              const irnAct = Boolean(inv.irn) && String(inv.irn_status ?? "ACT") !== "CNL";
              return (
                <tr key={inv.id as number}>
                  <td className="font-mono">{inv.doc_no as string}</td>
                  <td>{inv.partner_name as string}</td>
                  <td className="tabular">{formatINR(inv.taxable_paise)}</td>
                  <td className="tabular">{formatINR(gst)}</td>
                  <td className="tabular">{formatINR(inv.total_paise)}</td>
                  <td className="tabular">{formatKg(inv.net_kg)}</td>
                  <td className="tabular">
                    {formatKg(inv.packing_net_kg)} {match ? "✓" : "≠"}
                  </td>
                  <td className="max-w-32 truncate font-mono text-micro">{(inv.irn as string) ?? "—"}</td>
                  <td className="space-x-2 whitespace-nowrap">
                    <Link to="/print/invoice/$id" params={{ id: String(inv.id) }} className="text-navy underline">
                      Invoice
                    </Link>
                    <Link to="/print/packing/$id" params={{ id: String(inv.id) }} className="text-navy underline">
                      Packing
                    </Link>
                    {posted && !irnAct ? (
                      <Button size="sm" variant="ghost" onClick={() => irn.mutate(inv.id as number)}>
                        Generate IRN
                      </Button>
                    ) : null}
                    {posted && irnAct ? (
                      <Button size="sm" variant="ghost" onClick={() => cancel.mutate(inv.id as number)}>
                        Cancel IRN
                      </Button>
                    ) : null}
                    {posted ? (
                      <Button size="sm" variant="ghost" onClick={() => preview.mutate(inv.id as number)}>
                        Part A
                      </Button>
                    ) : null}
                    {posted ? (
                      <Button size="sm" variant="ghost" onClick={() => eway.mutate(inv.id as number)}>
                        e-way
                      </Button>
                    ) : null}
                    {inv.eway_id ? (
                      <Link to="/print/eway/$id" params={{ id: String(inv.eway_id) }} className="text-navy underline">
                        Print e-way
                      </Link>
                    ) : null}
                    {posted && !inv.gate_out_at ? (
                      <Button size="sm" variant="ghost" onClick={() => out.mutate(inv.id as number)}>
                        Gate-out
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
