import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { getGenealogy } from "@/lib/erp/api";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/genealogy/$lotId")({ component: GenePage });

function GenePage() {
  const { lotId } = Route.useParams();
  return <GenealogyView lotId={lotId} />;
}

export function GenealogyView({ lotId }: { lotId: string }) {
  const q = useQuery({
    queryKey: ["gene", lotId],
    queryFn: () => getGenealogy({ data: { id: Number(lotId) } }),
  });
  const g = q.data;
  return (
    <AppShell>
      <PageHeader kicker="Genealogy" title={g ? String(g.lot.lot_no) : `Lot ${lotId}`}>
        {g ? (
          <span className="font-mono text-sm">
            {g.lot.sku as string} · heat {(g.lot.heat_no as string) ?? "—"} · {g.lot.alloy as string}{" "}
            <Link to="/print/coc/$id" params={{ id: lotId }} className="ml-2 text-navy underline">
              CoC
            </Link>
          </span>
        ) : null}
      </PageHeader>
      {q.isError ? (
        <p className="text-sm text-danger">{(q.error as Error).message}</p>
      ) : g ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Panel title="This lot">
            <dl className="grid grid-cols-2 gap-2 p-3 text-sm">
              <dt className="text-muted">Warehouse</dt>
              <dd className="font-mono">{g.lot.warehouse as string}</dd>
              <dt className="text-muted">kg / pcs</dt>
              <dd className="tabular">
                {formatKg(g.lot.qty_kg)} / {formatPcs(g.lot.qty_pcs)}
              </dd>
              <dt className="text-muted">Status</dt>
              <dd>
                <Badge tone={g.lot.status as string}>{g.lot.status as string}</Badge>
              </dd>
              <dt className="text-muted">Heat / GRN</dt>
              <dd className="font-mono">{(g.lot.heat_no as string) ?? "—"}</dd>
            </dl>
          </Panel>
          <Panel title="Moves on this lot">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>kg</th>
                  <th>pcs</th>
                  <th>Whs</th>
                  <th>Consumed</th>
                </tr>
              </thead>
              <tbody>
                {(g.moves ?? []).map((m) => (
                  <tr key={m.id as number}>
                    <td className="font-mono">{m.move_type as string}</td>
                    <td className="tabular">{formatKg(m.qty_kg)}</td>
                    <td className="tabular">{formatPcs(m.qty_pcs)}</td>
                    <td className="font-mono">{m.warehouse as string}</td>
                    <td className="font-mono">
                      {m.consumed_lot_id ? (
                        <Link
                          to="/stock/lots/$lotId/genealogy"
                          params={{ lotId: String(m.consumed_lot_id) }}
                          className="underline"
                        >
                          lot {m.consumed_lot_id as number}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Cartons (if packed)">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Carton</th>
                  <th>Pcs</th>
                  <th>Net kg</th>
                  <th>Packing</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {g.cartons.map((c) => (
                  <tr key={c.carton_no as string}>
                    <td className="font-mono">{c.carton_no as string}</td>
                    <td className="tabular">{formatPcs(c.qty_pcs)}</td>
                    <td className="tabular">{formatKg(c.net_kg)}</td>
                    <td className="font-mono">{c.packing_no as string}</td>
                    <td className="font-mono">{c.invoice_no as string}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Parents (what went into this lot)">
            {g.parents.length ? (
            <table className="app-table">
              <thead>
                <tr>
                  <th>Lot</th>
                  <th>SKU</th>
                  <th>Heat</th>
                  <th>kg</th>
                </tr>
              </thead>
              <tbody>
                {g.parents.map((p) => (
                  <tr key={p.id as number}>
                    <td className="font-mono">
                      <Link to="/stock/lots/$lotId/genealogy" params={{ lotId: String(p.id) }} className="underline">
                        {p.lot_no as string}
                      </Link>
                    </td>
                    <td className="font-mono">{p.sku as string}</td>
                    <td className="font-mono">{p.heat_no as string}</td>
                    <td className="tabular">{formatKg(p.qty_kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            ) : (
              <p className="p-3 text-sm text-muted">No parent lots — opening lot or not yet issued through a WO.</p>
            )}
          </Panel>
          <Panel title="Walk back to rod / heat / GRN / JW">
            {g.ancestors.length ? (
            <ol className="space-y-1 p-3 font-mono text-sm">
              {g.ancestors.map((a, i) => (
                <li key={`${a.id}-${i}`}>
                  {"—".repeat(nDepth(a.depth))}{" "}
                  <Link to="/stock/lots/$lotId/genealogy" params={{ lotId: String(a.id) }} className="underline">
                    {a.sku as string} {a.lot_no as string}
                  </Link>{" "}
                  heat {a.heat_no as string} {formatKg(a.qty_kg)} kg
                </li>
              ))}
            </ol>
            ) : (
              <p className="p-3 text-sm text-muted">No upstream chain on this lot yet. FG receipts after a WO issue walk back to the rod / heat.</p>
            )}
          </Panel>
        </div>
      ) : (
        <p className="text-muted">Loading genealogy…</p>
      )}
    </AppShell>
  );
}

function nDepth(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 1;
}
