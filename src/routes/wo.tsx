import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { listOnHand, listOpenDocs } from "@/lib/erp/api";
import { listWoIssues, issueToWoWithMin } from "@/lib/erp/api-min";
import { formatKg, formatPcs, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/wo")({ component: WoPage });

function WoPage() {
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const lots = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const minHistory = useQuery({ queryKey: ["wois"], queryFn: () => listWoIssues() });
  
  const rods = (lots.data ?? []).filter(
    (l) => l.item_type === "RM" && l.status === "AVAILABLE" && l.owner_type === "OWN",
  );
  
  const [woId, setWoId] = useState("");
  const [lotId, setLotId] = useState("");
  const [qtyKg, setQtyKg] = useState("");
  const [remarks, setRemarks] = useState("");
  
  const selectedWo = (docs.data?.wos ?? []).find((w) => String(w.id) === (woId || String(docs.data?.wos[0]?.id)));
  const neededKg = n(qtyKg || selectedWo?.required_kg);
  const sourceLot =
    rods.find((l) => String(l.id) === lotId) ??
    rods.find((l) => n(l.qty_kg) + 0.0005 >= neededKg) ??
    rods[0];
    
  const mut = useMutation({
    mutationFn: () =>
      issueToWoWithMin({
        data: {
          woId: Number(woId || selectedWo?.id),
          lotId: Number(lotId || sourceLot?.id),
          qtyKg: n(qtyKg || selectedWo?.required_kg),
          remarks: remarks || undefined,
        },
      }),
    onSuccess: (r) => {
      toast.success(`MIN ${r.docNo} · Issued ${r.issuedKg} kg from ${r.lotNo}`);
      setRemarks("");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="PPC / stores" title="Work Orders / Material Issue Note (MIN)" />
      <div className="grid gap-3 lg:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <form
            className="space-y-2 rounded-md border border-line bg-paper p-3"
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
          >
            <h3 className="font-semibold text-sm">Material Issue Note</h3>
            <Field label="Work order">
              <Select value={woId || String(selectedWo?.id ?? "")} onChange={(e) => setWoId(e.target.value)}>
                {(docs.data?.wos ?? []).map((w) => (
                  <option key={w.id as number} value={w.id as number}>
                    {w.doc_no as string} · {w.sku as string}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Rod lot">
              <Select value={lotId || String(sourceLot?.id ?? "")} onChange={(e) => setLotId(e.target.value)}>
                {rods.map((l) => (
                  <option key={l.id as number} value={l.id as number}>
                    {l.lot_no as string} · {l.sku as string} · {formatKg(l.qty_kg)} kg
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Remarks">
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes"
                rows={2}
              />
            </Field>
            <Field label="Issue kg">
              <Input
                value={qtyKg}
                placeholder={selectedWo ? String(selectedWo.required_kg) : ""}
                onChange={(e) => setQtyKg(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full" disabled={mut.isPending}>
              Issue to WO
            </Button>
          </form>
        </div>
        
        <div className="space-y-4">
          <Panel title="Work orders">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Doc</th>
                  <th>Item</th>
                  <th>Pcs</th>
                  <th>Req kg</th>
                  <th>Issued kg</th>
                  <th>Good</th>
                  <th>Reject</th>
                  <th>Scrap kg</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(docs.data?.wos ?? []).map((w) => (
                  <tr key={w.id as number}>
                    <td className="font-mono">{w.doc_no as string}</td>
                    <td className="font-mono">{w.sku as string}</td>
                    <td className="tabular">{formatPcs(w.qty_pcs)}</td>
                    <td className="tabular">{formatKg(w.required_kg)}</td>
                    <td className="tabular">{formatKg(w.issued_kg)}</td>
                    <td className="tabular">{formatPcs(w.good_pcs)}</td>
                    <td className="tabular">{formatPcs(w.reject_pcs)}</td>
                    <td className="tabular">{formatKg(w.scrap_kg)}</td>
                    <td>
                      <Badge tone={w.status as string}>{w.status as string}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="MIN History">
            <table className="app-table">
              <thead>
                <tr>
                  <th>MIN No.</th>
                  <th>WO No.</th>
                  <th>Item SKU</th>
                  <th>Lot No.</th>
                  <th className="text-right">Qty Kg</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(minHistory.data ?? []).map((wi) => (
                  <tr key={wi.id as number}>
                    <td className="font-mono">{wi.doc_no as string || "-"}</td>
                    <td className="font-mono">{wi.wo_doc_no as string}</td>
                    <td className="font-mono">{wi.sku as string}</td>
                    <td className="font-mono">{wi.lot_no as string}</td>
                    <td className="tabular text-right">{formatKg(wi.qty_kg)}</td>
                    <td className="text-muted-foreground">
                      {wi.issued_date ? (wi.issued_date as string).split("T")[0] : "-"}
                    </td>
                  </tr>
                ))}
                {(minHistory.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      No MIN history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
