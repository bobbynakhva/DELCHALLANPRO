import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel, linesOf } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { listOpenDocs } from "@/lib/erp/api";
import { formatINR, formatKg } from "@/lib/erp/format";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/po")({ component: PoPage });

function PoPage() {
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  return (
    <AppShell>
      <PageHeader kicker="Purchase" title="Purchase orders" />
      <Panel>
        <table className="app-table">
          <thead>
            <tr>
              <th>Doc</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Line</th>
              <th>Qty kg</th>
              <th>Rate</th>
              <th>Received</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(docs.data?.pos ?? []).map((p) => {
              const ln = linesOf<{ sku: string; qty_kg: string; rate_paise_per_kg: number; received_kg: string }>(
                p.lines,
              )[0];
              return (
                <tr key={p.id as number}>
                  <td className="font-mono">{p.doc_no as string}</td>
                  <td>{p.partner_name as string}</td>
                  <td>{String(p.order_date).slice(0, 10)}</td>
                  <td className="font-mono">{ln?.sku}</td>
                  <td className="tabular">{formatKg(ln?.qty_kg)}</td>
                  <td className="tabular">{formatINR(ln?.rate_paise_per_kg)}/kg</td>
                  <td className="tabular">{formatKg(ln?.received_kg)}</td>
                  <td>
                    <Badge tone={p.status as string}>{p.status as string}</Badge>
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
