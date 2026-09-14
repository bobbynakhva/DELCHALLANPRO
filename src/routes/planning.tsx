import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { applyMrpDrafts, listMrp, runMrp } from "@/lib/erp/api-planning";
import { formatKg, formatPcs, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/planning")({ component: PlanningPage });

function PlanningPage() {
  const qc = useQueryClient();
  const [horizon, setHorizon] = useState<14 | 42>(14);
  const [picked, setPicked] = useState<number[]>([]);
  const q = useQuery({ queryKey: ["mrp"], queryFn: () => listMrp() });

  const run = useMutation({
    mutationFn: () => runMrp({ data: { horizonDays: horizon } }),
    onSuccess: (r) => {
      toast.success(`${r.runNo} · ${r.lines.length} lines · ${horizon}d`);
      setPicked([]);
      void qc.invalidateQueries({ queryKey: ["mrp"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const apply = useMutation({
    mutationFn: () => applyMrpDrafts({ data: { runId: n(q.data?.latest?.id), lineIds: picked } }),
    onSuccess: (r) => {
      toast.success(r.created.map((c) => `${c.kind} ${c.docNo}`).join(", ") || "No drafts");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const lines = q.data?.lines ?? [];
  const latest = q.data?.latest;

  return (
    <AppShell>
      <PageHeader kicker="PPC" title="Weekly MRP">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={horizon === 14 ? "rounded-sm bg-navy px-3 py-1.5 text-sm text-cream" : "rounded-sm border border-line px-3 py-1.5 text-sm"}
            onClick={() => setHorizon(14)}
          >
            14 days
          </button>
          <button
            type="button"
            className={horizon === 42 ? "rounded-sm bg-navy px-3 py-1.5 text-sm text-cream" : "rounded-sm border border-line px-3 py-1.5 text-sm"}
            onClick={() => setHorizon(42)}
          >
            42 days
          </button>
          <Button onClick={() => run.mutate()} disabled={run.isPending}>
            Run MRP
          </Button>
        </div>
      </PageHeader>
      <p className="mb-3 text-sm text-muted">
        Demand = open unshipped SO + safety stock. Forecast only if the table has rows (seeded empty).
        Time fence 3 days — released WOs inside the fence are never cancelled. Checked lines spawn DRAFT
        WO / PO / JW — no stock post.
      </p>
      {!latest ? (
        <Empty>No planning run yet</Empty>
      ) : (
        <>
          <p className="mb-2 font-mono text-sm text-navy">
            {latest.run_no as string} · horizon {latest.horizon_days as number}d · fence {latest.time_fence_days as number}d
          </p>
          <Panel
            title="MRP lines"
            actions={
              <Button size="sm" disabled={!picked.length || apply.isPending} onClick={() => apply.mutate()}>
                Create drafts ({picked.length})
              </Button>
            }
          >
            <table className="app-table">
              <thead>
                <tr>
                  <th></th>
                  <th>SKU</th>
                  <th>UOM</th>
                  <th>Demand</th>
                  <th>Supply</th>
                  <th>Avail</th>
                  <th>WO</th>
                  <th>PO</th>
                  <th>JW</th>
                  <th>Short</th>
                  <th>Action</th>
                  <th>Suggest</th>
                  <th>Draft</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((ln) => {
                  const id = ln.id as number;
                  const action = ln.action as string;
                  const fmt = (ln.qty_uom as string) === "KG" ? formatKg : formatPcs;
                  const can =
                    action === "CREATE_WO" ||
                    action === "CREATE_PO" ||
                    action === "CREATE_JW" ||
                    action === "CREATE_MELT";
                  return (
                    <tr key={id}>
                      <td>
                        {can && !ln.draft_doc_id ? (
                          <input
                            type="checkbox"
                            checked={picked.includes(id)}
                            onChange={(e) =>
                              setPicked((p) => (e.target.checked ? [...p, id] : p.filter((x) => x !== id)))
                            }
                          />
                        ) : null}
                      </td>
                      <td className="font-mono">{ln.sku as string}</td>
                      <td className="font-mono">{ln.qty_uom as string}</td>
                      <td className="tabular">{fmt(ln.demand_qty)}</td>
                      <td className="tabular">{fmt(ln.supply_qty)}</td>
                      <td className="tabular">{fmt(ln.available_qty)}</td>
                      <td className="tabular">{fmt(ln.open_wo_qty)}</td>
                      <td className="tabular">{fmt(ln.open_po_qty)}</td>
                      <td className="tabular">{fmt(ln.jw_pipeline_qty)}</td>
                      <td className="tabular">{fmt(ln.shortfall_qty)}</td>
                      <td>
                        <Badge tone={action === "NONE" ? "AVAILABLE" : "HOLD"}>{action}</Badge>
                      </td>
                      <td className="tabular">{n(ln.suggested_qty) ? fmt(ln.suggested_qty) : "—"}</td>
                      <td className="font-mono">
                        {ln.draft_doc_type ? (
                          <Link
                            to={
                              ln.draft_doc_type === "WO"
                                ? "/wo"
                                : ln.draft_doc_type === "PO"
                                  ? "/po"
                                  : ln.draft_doc_type === "HT"
                                    ? "/foundry"
                                    : "/jw"
                            }
                            className="underline"
                          >
                            {ln.draft_doc_type as string} #{ln.draft_doc_id as number}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
          <Panel title="Work-centre load (open WO minutes / weekly capacity)" className="mt-3">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Centre</th>
                  <th>Weekly min</th>
                  <th>Open min</th>
                  <th>Load %</th>
                  <th>Queue d</th>
                </tr>
              </thead>
              <tbody>
                {(q.data?.load ?? []).map((w) => (
                  <tr key={w.code as string}>
                    <td className="font-mono">{w.code as string}</td>
                    <td className="tabular">{w.weekly_minutes as number}</td>
                    <td className="tabular">{n(w.open_minutes).toFixed(0)}</td>
                    <td className="tabular">{n(w.load_pct).toFixed(1)}%</td>
                    <td className="tabular">{w.queue_days as number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </>
      )}
    </AppShell>
  );
}
