import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel, linesOf } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { createSalesOrder, createWorkOrder, explodeSo, listMasters, listOnHand, listOpenDocs } from "@/lib/erp/api";
import { getAtp, promiseSoLine } from "@/lib/erp/api-planning";
import { formatINR, formatKg, formatPcs, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/so")({ component: SoPage });

function SoPage() {
  const qc = useQueryClient();
  const masters = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const lots = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const customers = (masters.data?.partners ?? []).filter((p) => p.is_customer);
  const fgs = (masters.data?.items ?? []).filter((i) => i.type === "FG");
  const defC = customers.find((p) => p.code === "C-GS")?.id;
  const defI = fgs.find((i) => i.sku === "HEX-NIPPLE-1/2-NCR")?.id;
  const [partnerId, setPartnerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("10000");
  const [exp, setExp] = useState<Awaited<ReturnType<typeof explodeSo>> | null>(null);
  const [atpLine, setAtpLine] = useState<number | null>(null);
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [allocLot, setAllocLot] = useState("");

  const atp = useQuery({
    queryKey: ["atp", atpLine],
    queryFn: () => getAtp({ data: { soLineId: atpLine! } }),
    enabled: atpLine != null,
  });

  const create = useMutation({
    mutationFn: () =>
      createSalesOrder({
        data: {
          partnerId: Number(partnerId || defC),
          itemId: Number(itemId || defI),
          qtyPcs: n(qty),
        },
      }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} @ ${formatINR(r.unitPricePaise)}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const explode = useMutation({
    mutationFn: (p: { soId: number; lineId: number }) => explodeSo({ data: p }),
    onSuccess: (r) => setExp(r),
    onError: (e: Error) => toast.error(e.message),
  });
  const wo = useMutation({
    mutationFn: (p: { soId: number; lineId: number }) => createWorkOrder({ data: p }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} · required ${r.requiredKg} kg`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const promise = useMutation({
    mutationFn: () =>
      promiseSoLine({
        data: {
          soLineId: atpLine!,
          overrideDate: overrideDate || undefined,
          overrideReason: overrideReason || undefined,
          allocateLotId: allocLot ? Number(allocLot) : undefined,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Promised ${r.promiseDate}`);
      void qc.invalidateQueries({ queryKey: ["docs"] });
      void qc.invalidateQueries({ queryKey: ["atp"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fgLots = (lots.data ?? []).filter(
    (l) => l.status === "AVAILABLE" && n(l.qty_pcs) > 0 && (l.warehouse === "FG-DOM" || l.warehouse === "FG-EXP"),
  );

  return (
    <AppShell>
      <PageHeader kicker="Sales / PPC" title="Sales orders — capable-to-promise" />
      <div className="grid gap-3 lg:grid-cols-[18rem_1fr]">
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <Field label="Customer">
            <Select value={partnerId || String(defC ?? "")} onChange={(e) => setPartnerId(e.target.value)}>
              {customers.map((p) => (
                <option key={p.id as number} value={p.id as number}>
                  {p.name as string}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Item">
            <Select value={itemId || String(defI ?? "")} onChange={(e) => setItemId(e.target.value)}>
              {fgs.map((i) => (
                <option key={i.id as number} value={i.id as number}>
                  {i.sku as string}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Qty pcs">
            <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" />
          </Field>
          <Button type="submit" className="w-full" disabled={create.isPending}>
            Create SO
          </Button>
          <p className="text-micro text-muted">Journey 2: 10,000 pcs HEX-NIPPLE-1/2-NCR.</p>
        </form>
        <Panel title="Open / recent SOs">
          <table className="app-table">
            <thead>
              <tr>
                <th>Doc</th>
                <th>Customer</th>
                <th>Line</th>
                <th>Pcs</th>
                <th>Promise</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(docs.data?.sos ?? []).map((so) => {
                const lines = linesOf<{
                  id: number;
                  sku: string;
                  qty_pcs: string;
                  unit_price_paise: number;
                  kg_per_pc: string;
                  recovery_factor: string;
                  promise_date: string | null;
                }>(so.lines);
                const ln = lines[0];
                return (
                  <tr key={so.id as number}>
                    <td className="font-mono">{so.doc_no as string}</td>
                    <td>{so.partner_name as string}</td>
                    <td className="font-mono">{ln?.sku}</td>
                    <td className="tabular">{formatPcs(ln?.qty_pcs)}</td>
                    <td className="tabular">{ln?.promise_date ? String(ln.promise_date).slice(0, 10) : "—"}</td>
                    <td className="tabular">{formatINR(ln?.unit_price_paise)}</td>
                    <td className="space-x-1">
                      {ln ? (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => setAtpLine(ln.id)}>
                            ATP
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => explode.mutate({ soId: so.id as number, lineId: ln.id })}
                          >
                            Explode
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => wo.mutate({ soId: so.id as number, lineId: ln.id })}
                          >
                            Create WO
                          </Button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
      {atpLine != null ? (
        <Panel title="Capable-to-promise (honest, not APS)" className="mt-3">
          {atp.data ? (
            <div className="space-y-2 p-3" data-testid="atp-working">
              {atp.data.atp.working.map((w) => (
                <div key={w} className="font-mono text-sm text-navy">
                  {w}
                </div>
              ))}
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label="Computed promise">
                  <Input readOnly value={atp.data.atp.promiseDate} />
                </Field>
                <Field label="Override date">
                  <Input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} />
                </Field>
                <Field label="Override reason (required if date changes)">
                  <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                </Field>
              </div>
              <Field label="Allocate AVAILABLE FG lot (optional — reserved lots cannot dispatch elsewhere)">
                <Select value={allocLot} onChange={(e) => setAllocLot(e.target.value)}>
                  <option value="">— no allocation —</option>
                  {fgLots.map((l) => (
                    <option key={l.id as number} value={l.id as number}>
                      {l.lot_no as string} · {l.sku as string} · {formatPcs(l.qty_pcs)} pcs
                    </option>
                  ))}
                </Select>
              </Field>
              <Button onClick={() => promise.mutate()} disabled={promise.isPending}>
                Save promise
              </Button>
              {atp.data.savedDate ? (
                <p className="text-micro text-muted">
                  Saved {String(atp.data.savedDate).slice(0, 10)}
                  {atp.data.override ? ` · override ${atp.data.override}` : ""}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="p-3 text-sm text-muted">Loading ATP…</p>
          )}
        </Panel>
      ) : null}
      {exp ? (
        <Panel title={`Explosion ${exp.sku} × ${exp.qtyPcs} pcs`} className="mt-3">
          <p className="px-3 pt-2 font-mono text-sm text-navy">{exp.formula}</p>
          <table className="app-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Required kg</th>
                <th>On-hand kg</th>
                <th>Shortage kg</th>
              </tr>
            </thead>
            <tbody>
              {exp.rows.map((r) => (
                <tr key={r.sku}>
                  <td className="font-mono">
                    {r.sku}
                    {r.coProduct ? <Badge className="ml-2">co-product</Badge> : null}
                  </td>
                  <td className="tabular">{formatKg(r.requiredKg)}</td>
                  <td className="tabular">{r.coProduct ? "—" : formatKg(r.onHandKg)}</td>
                  <td className="tabular">{r.coProduct ? "—" : formatKg(r.shortageKg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
    </AppShell>
  );
}
