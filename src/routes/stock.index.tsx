import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { getBootstrap, listOnHand } from "@/lib/erp/api";
import { formatINR, formatKg, formatPcs } from "@/lib/erp/format";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/stock/")({ component: StockPage });

function StockPage() {
  const q = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const boot = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap() });
  const hidePrices = boot.data?.staff.role === "STORES";
  return (
    <AppShell>
      <PageHeader kicker="Stores" title="On-hand by lot — kg and pcs">
        <span className="text-sm text-muted">Anonymous brass is not allowed. Every lot carries an alloy.</span>
      </PageHeader>
      <Panel>
        <table className="app-table">
          <thead>
            <tr>
              <th>Lot</th>
              <th>Item</th>
              <th>Alloy</th>
              <th>Whs</th>
              <th>Heat</th>
              <th>kg</th>
              <th>pcs</th>
              <th>Owner</th>
              {hidePrices ? null : <th>₹/kg</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((r) => (
              <tr key={r.id as number}>
                <td className="font-mono">
                  <Link to="/stock/lots/$lotId/genealogy" params={{ lotId: String(r.id) }} className="text-navy hover:underline">
                    {r.lot_no as string}
                  </Link>
                </td>
                <td>
                  <div className="font-mono">{r.sku as string}</div>
                  <div className="text-micro text-muted">{r.item_name as string}</div>
                </td>
                <td className="font-mono">{r.alloy as string}</td>
                <td className="font-mono">{r.warehouse as string}</td>
                <td className="font-mono">{(r.heat_no as string) ?? "—"}</td>
                <td className="tabular">{formatKg(r.qty_kg)}</td>
                <td className="tabular">{formatPcs(r.qty_pcs)}</td>
                <td>
                  <Badge tone={r.owner_type as string}>{r.owner_type as string}</Badge>
                  {r.owner_name ? <div className="text-micro text-muted">{r.owner_name as string}</div> : null}
                </td>
                {hidePrices ? null : (
                  <td className="tabular">
                    {r.owner_type === "CUSTOMER" ? "₹0" : formatINR(r.unit_value_paise_per_kg)}
                  </td>
                )}
                <td>
                  <Badge tone={r.status as string}>{r.status as string}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
