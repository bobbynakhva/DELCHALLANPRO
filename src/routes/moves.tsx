import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { approveStockAdjust, getBootstrap, getLotLedger, listOnHand, listMoves, listOpenDocs, requestStockAdjust } from "@/lib/erp/api";
import { formatINR, formatKg, formatPcs, n } from "@/lib/erp/format";
import { REASON_CODES } from "@/modules/inventory/rules";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/moves")({ component: MovesPage });

function MovesPage() {
  const qc = useQueryClient();
  const lots = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const boot = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap() });
  const role = boot.data?.staff.role;
  const canAdjust = role === "OWNER" || role === "STORES" || role === "ADMIN";
  const canApprove = role === "OWNER" || role === "ADMIN";
  const [lotId, setLotId] = useState("");
  const [qtyKg, setQtyKg] = useState("1.000");
  const [reason, setReason] = useState("Cycle count");
  const [reasonCode, setReasonCode] = useState("ADJ-COUNT");
  const [filterLot, setFilterLot] = useState("");
  const [filterReason, setFilterReason] = useState("");
  const ownLots = (lots.data ?? []).filter((l) => l.owner_type === "OWN" && n(l.qty_kg) + n(l.qty_pcs) > 0);
  const q = useQuery({
    queryKey: ["moves", filterLot, filterReason],
    queryFn: () =>
      listMoves({
        data: {
          lotId: filterLot ? Number(filterLot) : undefined,
          reasonCode: filterReason || undefined,
        },
      }),
  });
  const ledger = useQuery({
    queryKey: ["ledger", filterLot],
    queryFn: () => getLotLedger({ data: { lotId: Number(filterLot) } }),
    enabled: Boolean(filterLot),
  });
  const mut = useMutation({
    mutationFn: () =>
      requestStockAdjust({
        data: {
          lotId: Number(lotId || ownLots[0]?.id),
          qtyKg: n(qtyKg),
          qtyPcs: 0,
          reason,
          reasonCode: reasonCode as "ADJ-COUNT" | "ADJ-UOM-ERROR" | "ADJ-THEFT-INVESTIGATE",
        },
      }),
    onSuccess: (r) => {
      toast.success(
        r.status === "PENDING"
          ? `Queued for dual approval (${formatINR(r.absValue)} > ${formatINR(r.threshold)})`
          : `Posted adjustment ${formatINR(r.absValue)}`,
      );
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const decide = useMutation({
    mutationFn: (p: { id: number; decision: "APPROVE" | "REJECT" }) => approveStockAdjust({ data: p }),
    onSuccess: (r) => {
      toast.success(r.status);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Stores" title="Stock ledger">
        <span className="text-sm text-muted">Sales cannot adjust. Above ₹5,000 needs Owner dual approval.</span>
      </PageHeader>
      {canAdjust ? (
        <form
          className="mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <Field label="Lot">
            <Select value={lotId || String(ownLots[0]?.id ?? "")} onChange={(e) => setLotId(e.target.value)}>
              {ownLots.map((l) => (
                <option key={l.id as number} value={l.id as number}>
                  {l.lot_no as string} · {l.sku as string} · {formatKg(l.qty_kg)} kg
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Δ kg (signed)">
            <Input value={qtyKg} onChange={(e) => setQtyKg(e.target.value)} />
          </Field>
          <Field label="Reason code">
            <Select value={reasonCode} onChange={(e) => setReasonCode(e.target.value)}>
              {REASON_CODES.ADJ.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Reason">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={mut.isPending}>
              Adjust / request
            </Button>
          </div>
        </form>
      ) : (
        <p className="mb-3 text-sm text-muted">Your role cannot post stock adjustments.</p>
      )}
      <div className="mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-3">
        <Field label="Lot filter (running kg / pcs)">
          <Select value={filterLot} onChange={(e) => setFilterLot(e.target.value)}>
            <option value="">All lots</option>
            {(lots.data ?? []).map((l) => (
              <option key={l.id as number} value={l.id as number}>
                {l.lot_no as string} · {l.sku as string}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reason code filter">
          <Select value={filterReason} onChange={(e) => setFilterReason(e.target.value)}>
            <option value="">All</option>
            {[...REASON_CODES.SCRAP, ...REASON_CODES.REJ, ...REASON_CODES.ADJ].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        {ledger.data ? (
          <div className="flex items-end font-mono text-sm">
            {String(ledger.data.sku ?? "")} · on-hand {formatKg(ledger.data.lot.qty_kg)} kg / {formatPcs(ledger.data.lot.qty_pcs)} pcs
          </div>
        ) : null}
      </div>
      {(docs.data?.approvals ?? []).length ? (
        <Panel title="Dual-approval queue" className="mb-3">
          <table className="app-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Kind</th>
                <th>Value</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(docs.data?.approvals ?? []).map((a) => (
                <tr key={a.id as number}>
                  <td className="font-mono">{a.id as number}</td>
                  <td className="font-mono">{a.kind as string}</td>
                  <td className="tabular">{formatINR(a.threshold_paise)}</td>
                  <td>
                    <Badge tone={a.status as string}>{a.status as string}</Badge>
                  </td>
                  <td className="space-x-1">
                    {canApprove && a.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => decide.mutate({ id: a.id as number, decision: "APPROVE" })}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => decide.mutate({ id: a.id as number, decision: "REJECT" })}
                        >
                          Reject
                        </Button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      <Panel>
        <table className="app-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Type</th>
              <th>Item</th>
              <th>Lot</th>
              <th>Whs</th>
              <th>kg</th>
              <th>pcs</th>
              <th>Run kg</th>
              <th>Run pcs</th>
              <th>Alloy</th>
              <th>Reason</th>
              <th>Ref</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((m) => (
              <tr key={m.id as number}>
                <td className="whitespace-nowrap tabular">{String(m.posted_at).replace("T", " ").slice(0, 19)}</td>
                <td className="font-mono">{m.move_type as string}</td>
                <td className="font-mono">{m.sku as string}</td>
                <td className="font-mono">{m.lot_no as string}</td>
                <td className="font-mono">{m.warehouse as string}</td>
                <td className="tabular">{formatKg(m.qty_kg)}</td>
                <td className="tabular">{formatPcs(m.qty_pcs)}</td>
                <td className="tabular">{m.running_kg != null ? formatKg(m.running_kg) : "—"}</td>
                <td className="tabular">{m.running_pcs != null ? formatPcs(m.running_pcs) : "—"}</td>
                <td className="font-mono">{(m.alloy as string) ?? "—"}</td>
                <td className="font-mono">{(m.reason_code as string) ?? "—"}</td>
                <td className="font-mono">
                  {m.ref_type as string}/{m.ref_id as number}
                </td>
                <td className="max-w-48 truncate text-muted">{(m.notes as string) ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
