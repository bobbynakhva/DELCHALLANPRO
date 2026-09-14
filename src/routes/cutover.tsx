import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  dryRunCutoverStock,
  getCutover,
  postCutoverJw,
  postCutoverLive,
  postCutoverSignoff,
  postCutoverStock,
  postCutoverTb,
  postTallyExport,
  postTallyImport,
} from "@/lib/erp/api-cutover";
import { formatINR, n } from "@/lib/erp/format";
import { CUTOVER_STATES } from "@/modules/cutover/math";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/cutover")({ component: CutoverPage });

function CutoverPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["cutover"], queryFn: () => getCutover() });
  const [stockCsv, setStockCsv] = useState("");
  const [jwCsv, setJwCsv] = useState("");
  const co = q.data?.company;
  const dry = useMutation({
    mutationFn: () => dryRunCutoverStock({ data: { csv: stockCsv || q.data?.sampleStock || "" } }),
    onSuccess: (r) => toast[r.ok ? "success" : "error"](r.ok ? `${r.rows.length} rows ready` : r.rows.find((x) => !x.ok)?.error ?? "fail"),
    onError: (e: Error) => toast.error(e.message),
  });
  const postStock = useMutation({
    mutationFn: () => postCutoverStock({ data: { csv: stockCsv || q.data?.sampleStock || "" } }),
    onSuccess: (r) => {
      toast.success(`Posted ${r.posted} lots · OWN ${formatINR(r.ownValuePaise)}`);
      void qc.invalidateQueries({ queryKey: ["cutover"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const postJw = useMutation({
    mutationFn: () => postCutoverJw({ data: { csv: jwCsv || q.data?.sampleJw || "" } }),
    onSuccess: (r) => {
      toast.success(`Opening JW ${r.posted} · ${r.confirmationNo ?? ""}`);
      void qc.invalidateQueries({ queryKey: ["cutover"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const tb = useMutation({
    mutationFn: () => postCutoverTb({ data: { arPaise: 0, apPaise: 0 } }),
    onSuccess: (r) => {
      toast[r.reconciled ? "success" : "error"](
        r.reconciled ? `RECONCILED · OWN ${formatINR(r.ownInventoryPaise)}` : r.reasons.join("; "),
      );
      void qc.invalidateQueries({ queryKey: ["cutover"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const live = useMutation({
    mutationFn: () => postCutoverLive({ data: { ownerOverride: false } }),
    onSuccess: (r) => {
      toast.success(`State ${r.state}`);
      void qc.invalidateQueries({ queryKey: ["cutover"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const exp = useMutation({
    mutationFn: () => postTallyExport(),
    onSuccess: (r) => {
      toast.success(`${r.files.length} Tally files · not the book of record`);
      void qc.invalidateQueries({ queryKey: ["cutover"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const imp = useMutation({
    mutationFn: () => postTallyImport(),
    onError: (e: Error) => toast.error(e.message),
  });
  const sign = useMutation({
    mutationFn: (gate: string) => postCutoverSignoff({ data: { gate } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["cutover"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Cutover kit" title="Openings, JW clocks, Tally sunset">
        <Link to="/print/cutover-pack" className="text-sm text-navy underline">
          Print pack
        </Link>
      </PageHeader>
      <p className="mb-3 text-sm text-muted">
        Isolated company <span className="font-mono">CUTOVERDEMO</span>. Live Tamba has cutoverBlocksLiveDocs=false so
        journeys 1–27 stay green. Tally is not the book of record.
      </p>
      <div className="mb-3 flex flex-wrap gap-1">
        {CUTOVER_STATES.map((s) => (
          <Badge key={s} tone={co?.state === s ? "OPEN" : "DRAFT"}>
            {s}
          </Badge>
        ))}
      </div>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-line bg-paper px-3 py-2">
          <div className="text-micro uppercase text-muted">Company</div>
          <div className="font-mono">{co?.code ?? "…"}</div>
          <div className="text-sm">Opening {co ? String(co.opening_date).slice(0, 10) : "—"}</div>
        </div>
        <div className="rounded-md border border-line bg-paper px-3 py-2">
          <div className="text-micro uppercase text-muted">Blocks live docs</div>
          <div className="font-mono">{co?.cutover_blocks_live_docs ? "true (CUTOVERDEMO)" : "false"}</div>
          <div className="text-sm">Demo Tamba: {q.data?.demoBlocksLiveDocs ? "true" : "false"}</div>
        </div>
        <div className="rounded-md border border-line bg-paper px-3 py-2">
          <div className="text-micro uppercase text-muted">Freeze issues</div>
          <div className="font-mono">{q.data?.freeze.issues.length ?? 0}</div>
          <div className="text-sm">Duplicate codes {q.data?.freeze.duplicates.length ?? 0}</div>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            postStock.mutate();
          }}
        >
          <div className="text-sm font-semibold text-navy">A / B · Masters freeze + opening stock</div>
          <textarea
            className="h-36 w-full rounded-sm border border-line bg-cream p-2 font-mono text-xs"
            value={stockCsv || q.data?.sampleStock || ""}
            onChange={(e) => setStockCsv(e.target.value)}
          />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => dry.mutate()}>
              Dry-run
            </Button>
            <Button type="submit" disabled={postStock.isPending}>
              Post OPENING_STOCK
            </Button>
          </div>
          {dry.data ? (
            <ul className="font-mono text-xs">
              {dry.data.rows.map((r) => (
                <li key={r.lotNo} className={r.ok ? "text-ok" : "text-danger"}>
                  {r.lotNo} {r.sku} {r.ok ? "OK" : r.error}
                </li>
              ))}
            </ul>
          ) : null}
        </form>
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            postJw.mutate();
          }}
        >
          <div className="text-sm font-semibold text-navy">C · Opening job work</div>
          <p className="text-xs text-muted">Original challan no + date kept. Due = challan + 365. Ageing from challan date.</p>
          <textarea
            className="h-28 w-full rounded-sm border border-line bg-cream p-2 font-mono text-xs"
            value={jwCsv || q.data?.sampleJw || ""}
            onChange={(e) => setJwCsv(e.target.value)}
          />
          <Button type="submit" disabled={postJw.isPending}>
            Post opening JW
          </Button>
          <ul className="text-sm">
            {(q.data?.jw ?? []).map((j) => (
              <li key={j.id as number}>
                <Link to="/print/opening-jw/$id" params={{ id: String(j.id) }} className="font-mono underline">
                  {String(j.original_challan_no)}
                </Link>{" "}
                due {String(j.statutory_due).slice(0, 10)}
              </li>
            ))}
          </ul>
        </form>
      </div>
      <Panel title="D · Opening AR/AP + TB gate" className="mt-3">
        <p className="p-3 text-sm text-muted">
          Subledgers must equal Tally 1100 / 2000. Inventory 1200–1240 = OWN opening. JW_IN value 0. Then RECONCILED.
          LIVE needs RECONCILED or Owner override.
        </p>
        <div className="flex flex-wrap gap-2 p-3">
          <Button type="button" onClick={() => tb.mutate()} disabled={tb.isPending}>
            Load TB + reconcile
          </Button>
          <Button type="button" variant="navy" onClick={() => live.mutate()} disabled={live.isPending}>
            Go LIVE
          </Button>
        </div>
      </Panel>
      <Panel title="E · Tally one-way dump" className="mt-3">
        <p className="p-3 text-sm text-muted">After LIVE: journals, sales register, purchase register, stock summary. Header: Tally is not the book of record. Import after LIVE is refused.</p>
        <div className="flex gap-2 p-3">
          <Button type="button" onClick={() => exp.mutate()} disabled={exp.isPending}>
            Export Tally files
          </Button>
          <Button type="button" variant="danger" onClick={() => imp.mutate()}>
            Import Tally TB
          </Button>
        </div>
        <ul className="px-3 pb-3 font-mono text-xs">
          {(q.data?.exports ?? []).map((e) => (
            <li key={e.id as number}>{String(e.kind)}</li>
          ))}
        </ul>
      </Panel>
      <Panel title="F · Sign-off timestamps" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Gate</th>
              <th>When</th>
              <th>Signed</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.gates ?? []).map((g) => {
              const s = (q.data?.signoffs ?? []).find((x) => String(x.gate) === g.gate);
              return (
                <tr key={g.gate}>
                  <td className="font-mono">{g.gate}</td>
                  <td>{g.when}</td>
                  <td className="tabular">{s?.signed_at ? String(s.signed_at).slice(0, 19) : "—"}</td>
                  <td>
                    <Button type="button" size="sm" variant="ghost" onClick={() => sign.mutate(g.gate)}>
                      Sign
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <Panel title="Tamba ↔ Tally COA map" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Tamba</th>
              <th>Tally</th>
              <th>Ledger</th>
              <th>Group</th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.map ?? []).map((m) => (
              <tr key={String(m.tamba_code)}>
                <td className="font-mono">{String(m.tamba_code)}</td>
                <td className="font-mono">{String(m.tally_code)}</td>
                <td>{String(m.tally_ledger)}</td>
                <td>{String(m.tally_group)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      {q.data?.freeze.issues.length ? (
        <Panel title="Freeze — items missing alloy / dual UOM / HSN / kgPerPc" className="mt-3">
          <ul className="max-h-40 overflow-auto p-3 font-mono text-xs">
            {q.data.freeze.issues.slice(0, 40).map((i, idx) => (
              <li key={`${i.sku}-${idx}`}>
                {i.sku}: {i.message}
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
      <p className="mt-2 text-micro text-muted">{n(0) === 0 ? "Cannot load openings into a LOCKED month." : null}</p>
    </AppShell>
  );
}
