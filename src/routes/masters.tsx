import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { listMasters } from "@/lib/erp/api";
import { approveBom } from "@/lib/erp/api-sales";
import { formatINR, n } from "@/lib/erp/format";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/masters")({ component: MastersPage });

const TABS = ["Items", "Alloys", "Warehouses", "Partners", "BOM", "Rates", "Tariffs"] as const;

function MastersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Items");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });
  const m = q.data;
  const appr = useMutation({
    mutationFn: (bomId: number) => approveBom({ data: { bomId } }),
    onSuccess: () => {
      toast.success("BOM approved");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell>
      <PageHeader kicker="Masters" title="Items, alloys, warehouses, partners" />
      <div className="mb-3 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "rounded-sm bg-navy px-3 py-1.5 text-sm text-cream"
                : "rounded-sm border border-line bg-paper px-3 py-1.5 text-sm"
            }
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Items" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Type</th>
                <th>Alloy</th>
                <th>kg/pc</th>
                <th>Recovery</th>
                <th>HSN</th>
                <th>Drg</th>
                <th>M/B</th>
              </tr>
            </thead>
            <tbody>
              {(m?.items ?? []).map((i) => (
                <tr key={i.id as number}>
                  <td className="font-mono">{i.sku as string}</td>
                  <td>{i.type as string}</td>
                  <td className="font-mono">{i.alloy_code as string}</td>
                  <td className="tabular">{i.kg_per_pc ? n(i.kg_per_pc).toFixed(3) : "—"}</td>
                  <td className="tabular">{n(i.recovery_factor).toFixed(2)}</td>
                  <td className="font-mono">{i.hsn as string}</td>
                  <td className="font-mono">
                    {i.drawing_no as string} {i.drawing_rev as string}
                  </td>
                  <td>{i.make_or_buy as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Alloys" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Cu %</th>
                <th>Zn %</th>
                <th>Pb %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(m?.alloys ?? []).map((a) => (
                <tr key={a.id as number}>
                  <td className="font-mono">{a.code as string}</td>
                  <td>{a.name as string}</td>
                  <td className="tabular">{a.cu_pct as string}</td>
                  <td className="tabular">{a.zn_pct as string}</td>
                  <td className="tabular">{a.pb_pct as string}</td>
                  <td>{a.is_scrap ? <Badge>scrap family</Badge> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Warehouses" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Kind</th>
                <th>Outside</th>
                <th>Customer</th>
                <th>Valued</th>
              </tr>
            </thead>
            <tbody>
              {(m?.warehouses ?? []).map((w) => (
                <tr key={w.id as number}>
                  <td className="font-mono">{w.code as string}</td>
                  <td>{w.name as string}</td>
                  <td>{w.kind as string}</td>
                  <td>{w.is_outside_factory ? "yes" : ""}</td>
                  <td>{w.is_customer_owned ? "yes" : ""}</td>
                  <td>{w.valuation_eligible ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Partners" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Flags</th>
                <th>GSTIN</th>
                <th>Place</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {(m?.partners ?? []).map((p) => (
                <tr key={p.id as number}>
                  <td className="font-mono">{p.code as string}</td>
                  <td>{p.name as string}</td>
                  <td className="space-x-1">
                    {p.is_customer ? <Badge>cust</Badge> : null}
                    {p.is_vendor ? <Badge>vend</Badge> : null}
                    {p.is_job_worker ? <Badge tone="HOLD">JW</Badge> : null}
                  </td>
                  <td className="font-mono">{(p.gstin as string) ?? "—"}</td>
                  <td>
                    {p.city as string}, {p.state as string}
                  </td>
                  <td className="tabular">{p.credit_limit_paise ? formatINR(p.credit_limit_paise) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "BOM" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>FG</th>
                <th>Rev</th>
                <th>Status</th>
                <th>Lines</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(m?.boms ?? []).map((b) => {
                const lines = (m?.bomLines ?? []).filter((l) => l.bom_id === b.id);
                return (
                  <tr key={b.id as number}>
                    <td className="font-mono">{b.sku as string}</td>
                    <td>{b.drawing_rev as string}</td>
                    <td>
                      <Badge tone={b.status as string}>{b.status as string}</Badge>
                    </td>
                    <td className="text-micro">
                      {lines.map((l) => (
                        <div key={l.id as number}>
                          {l.is_co_product ? "↗" : "↙"} {l.component_sku as string} {n(l.qty_per)} {l.qty_uom as string}
                        </div>
                      ))}
                    </td>
                    <td>
                      {b.status !== "APPROVED" ? (
                        <Button size="sm" onClick={() => appr.mutate(b.id as number)}>
                          Approve
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Rates" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Process</th>
                <th>Family</th>
                <th>₹/pc</th>
                <th>Loss norm</th>
              </tr>
            </thead>
            <tbody>
              {(m?.rates ?? []).map((r) => (
                <tr key={r.id as number}>
                  <td>{r.partner_name as string}</td>
                  <td className="font-mono">{r.process_code as string}</td>
                  <td>{r.item_family as string}</td>
                  <td className="tabular">{formatINR(r.rate_paise_per_pc)}</td>
                  <td className="tabular">{n(r.loss_norm_pct).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Tariffs" ? (
        <Panel title="Own-shop process_tariff (PartnerProcessRate remains JW source of truth)">
          <table className="app-table">
            <thead>
              <tr>
                <th>Process</th>
                <th>Family</th>
                <th>₹/pc</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {(m?.tariffs ?? []).map((t) => (
                <tr key={t.id as number}>
                  <td className="font-mono">{t.process_code as string}</td>
                  <td>{t.item_family as string}</td>
                  <td className="tabular">{formatINR(t.rate_paise_per_pc)}</td>
                  <td className="tabular">{String(t.effective_from).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
    </AppShell>
  );
}
