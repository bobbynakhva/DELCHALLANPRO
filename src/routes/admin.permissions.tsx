import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { getPermissionsMatrix } from "@/lib/erp/api-finance";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/permissions")({ component: PermsPage });

function PermsPage() {
  const q = useQuery({ queryKey: ["perms"], queryFn: () => getPermissionsMatrix() });
  const m = q.data;
  return (
    <AppShell>
      <PageHeader kicker="Admin" title="Permissions matrix (read-only)" />
      <p className="mb-3 text-sm text-muted">
        Shop cannot see Sales, COA or margin. Stores cannot change MetalPrice. Denials write to the audit log.
      </p>
      {m ? (
        <Panel title="Who can do what">
          <table className="app-table">
            <thead>
              <tr>
                <th>Permission</th>
                {m.roles.map((r) => (
                  <th key={r}>{m.labels[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(m.perms).map(([k, roles]) => (
                <tr key={k}>
                  <td className="font-mono">{k}</td>
                  {m.roles.map((r) => (
                    <td key={r} className="tabular">
                      {(roles as string[]).includes(r) ? "yes" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      <Panel title="Recent denials" className="mt-3">
        {(m?.denials ?? []).length ? (
          <table className="app-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Perm</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {m!.denials.map((d, i) => (
                <tr key={i}>
                  <td className="font-mono">{String(d.at)}</td>
                  <td className="font-mono">{d.entity as string}</td>
                  <td className="font-mono text-micro">{String(d.after_json)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>No permission denials logged</Empty>
        )}
      </Panel>
    </AppShell>
  );
}
