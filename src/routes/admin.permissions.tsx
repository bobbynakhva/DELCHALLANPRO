import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPermissionsMatrix, updatePermissionsMatrix } from "@/lib/erp/api-finance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PERMS } from "@/lib/erp/constants";

export const Route = createFileRoute("/admin/permissions")({ component: PermsPage });

function PermsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["perms"], queryFn: () => getPermissionsMatrix() });
  const m = q.data;

  const [localPerms, setLocalPerms] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (m?.perms) {
      setLocalPerms(m.perms as Record<string, string[]>);
    }
  }, [m?.perms]);

  const saveMut = useMutation({
    mutationFn: (permsToSave: Record<string, string[]>) => updatePermissionsMatrix({ data: { perms: permsToSave } }),
    onSuccess: () => {
      toast.success("Permissions matrix updated successfully!");
      void qc.invalidateQueries({ queryKey: ["perms"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePermission = (permKey: string, role: string) => {
    if (!m?.isEditable) return;
    const current = localPerms[permKey] || [];
    const updated = current.includes(role)
      ? current.filter((r) => r !== role)
      : [...current, role];
    setLocalPerms({ ...localPerms, [permKey]: updated });
  };

  const handleReset = () => {
    const defaultPerms = PERMS as Record<string, string[]>;
    setLocalPerms(defaultPerms);
    saveMut.mutate(defaultPerms);
  };

  return (
    <AppShell>
      <PageHeader 
        kicker="Admin" 
        title={m?.isEditable ? "Permissions Matrix (Editable by Owner)" : "Permissions Matrix (Read-Only)"}
      >
        {m?.isEditable && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleReset} disabled={saveMut.isPending}>
              Reset to Defaults
            </Button>
            <Button onClick={() => saveMut.mutate(localPerms)} disabled={saveMut.isPending}>
              {saveMut.isPending ? "Saving..." : "Save Permissions Matrix"}
            </Button>
          </div>
        )}
      </PageHeader>
      <p className="mb-3 text-sm text-muted">
        {m?.isEditable
          ? "As Owner/Admin, check or uncheck boxes below to customize role-based access control across all modules."
          : "Shop cannot see Sales, COA or margin. Stores cannot change MetalPrice. Denials write to the audit log."}
      </p>

      {m ? (
        <Panel title="Who can do what">
          <table className="app-table">
            <thead>
              <tr>
                <th>Permission</th>
                {m.roles.map((r) => (
                  <th key={r} className="text-center">{m.labels[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(localPerms).map((k) => {
                const roles = localPerms[k] || [];
                return (
                  <tr key={k}>
                    <td className="font-mono font-medium">{k}</td>
                    {m.roles.map((r) => {
                      const isAllowed = roles.includes(r) || r === "OWNER" || r === "ADMIN";
                      const isCheckable = m.isEditable && r !== "OWNER" && r !== "ADMIN";
                      return (
                        <td key={r} className="text-center tabular">
                          {isCheckable ? (
                            <label className="inline-flex items-center justify-center p-1 cursor-pointer">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-line text-navy focus:ring-navy"
                                checked={isAllowed}
                                onChange={() => togglePermission(k, r)}
                              />
                            </label>
                          ) : isAllowed ? (
                            <Badge tone="PASS">yes</Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
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
                  <td className="font-mono">{String(d.at).slice(0, 19).replace("T", " ")}</td>
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
