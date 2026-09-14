import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { listMasters, listOpenDocs } from "@/lib/erp/api";
import { createNcr } from "@/lib/erp/api-sales";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/ncr")({ component: NcrPage });

function NcrPage() {
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const masters = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });
  const [itemId, setItemId] = useState("");
  const [desc, setDesc] = useState("Dimensional drift on hex across-flats");
  const mut = useMutation({
    mutationFn: () =>
      createNcr({
        data: {
          itemId: itemId ? Number(itemId) : undefined,
          description: desc,
          source: "MANUAL",
        },
      }),
    onSuccess: (r) => {
      toast.success(r.docNo);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell>
      <PageHeader kicker="QC" title="Non-conformance" />
      <form
        className="mb-3 flex flex-wrap items-end gap-2 rounded-md border border-line bg-paper p-3"
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
      >
        <Field label="Item" className="w-56">
          <Select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">—</option>
            {(masters.data?.items ?? []).map((i) => (
              <option key={i.id as number} value={i.id as number}>
                {i.sku as string}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description" className="min-w-64 flex-1">
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>
        <Button type="submit">Raise NCR</Button>
      </form>
      <Panel>
        <table className="app-table">
          <thead>
            <tr>
              <th>Doc</th>
              <th>Item</th>
              <th>Lot</th>
              <th>Source</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {(docs.data?.ncrs ?? []).map((n) => (
              <tr key={n.id as number}>
                <td className="font-mono">{n.doc_no as string}</td>
                <td className="font-mono">{n.sku as string}</td>
                <td className="font-mono">{n.lot_no as string}</td>
                <td>{n.source as string}</td>
                <td>{n.description as string}</td>
                <td>
                  <Badge tone={n.status as string}>{n.status as string}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
