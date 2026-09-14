import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { listOpenDocs } from "@/lib/erp/api";
import { variancePack } from "@/lib/erp/api-planning";
import { n, todayISO } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/audit")({ component: AuditPage });

function AuditPage() {
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const [from, setFrom] = useState("2026-04-01");
  const [to, setTo] = useState(todayISO());
  const pack = useMutation({
    mutationFn: (freeze: boolean) => variancePack({ data: { from, to, freeze } }),
    onSuccess: (r) => {
      toast.success(r.frozen ? "Period frozen — GL not closed" : "Pack computed");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const live = pack.data?.pack;

  return (
    <AppShell>
      <PageHeader kicker="Accounts" title="Yield / JW-loss variance and audit log">
        <span className="text-sm text-muted">Close period freezes CostVariance. Does not close the general ledger.</span>
      </PageHeader>
      <form
        className="mb-3 flex flex-wrap items-end gap-2 rounded-md border border-line bg-paper p-3"
        onSubmit={(e) => {
          e.preventDefault();
          pack.mutate(false);
        }}
      >
        <Field label="From">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Button type="submit" variant="ghost" disabled={pack.isPending}>
          Pack variances
        </Button>
        <Button type="button" variant="navy" disabled={pack.isPending} onClick={() => pack.mutate(true)}>
          Close period
        </Button>
      </form>
      {live ? (
        <Panel title="This pack (not GL)" className="mb-3">
          <table className="app-table">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Notes</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Var</th>
              </tr>
            </thead>
            <tbody>
              {[...live.yield, ...live.jwLoss, ...live.metal].map((r, i) => (
                <tr key={i}>
                  <td className="font-mono">{r.kind}</td>
                  <td className="text-muted">{r.notes}</td>
                  <td className="tabular">{n(r.expected).toFixed(3)}</td>
                  <td className="tabular">{n(r.actual).toFixed(3)}</td>
                  <td className="tabular">{n(r.variance).toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      <Panel title="Frozen variances" className="mb-3">
        {(docs.data?.variances ?? []).length ? (
          <table className="app-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Kind</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Var</th>
                <th>Frozen</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(docs.data?.variances ?? []).map((v) => (
                <tr key={v.id as number}>
                  <td className="tabular">{String(v.created_at).replace("T", " ").slice(0, 19)}</td>
                  <td className="font-mono">{v.kind as string}</td>
                  <td className="tabular">{n(v.expected).toFixed(3)}</td>
                  <td className="tabular">{n(v.actual).toFixed(3)}</td>
                  <td className="tabular">{n(v.variance).toFixed(3)}</td>
                  <td>{v.frozen ? "yes" : "—"}</td>
                  <td className="text-muted">{v.notes as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>No variance rows yet</Empty>
        )}
      </Panel>
      <Panel title="Stock & price audit">
        <table className="app-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Id</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {(docs.data?.auditRows ?? []).map((a) => (
              <tr key={a.id as number}>
                <td className="tabular">{String(a.at).replace("T", " ").slice(0, 19)}</td>
                <td className="font-mono">{a.action as string}</td>
                <td>{a.entity as string}</td>
                <td className="font-mono">{a.entity_id as string}</td>
                <td className="max-w-md truncate font-mono text-micro text-muted">{a.after_json as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
