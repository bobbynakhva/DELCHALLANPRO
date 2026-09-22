import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createSubcontractOrder, listSubcontractOrders, receiveSubcontractOrder } from "@/lib/erp/api-subcontract";
import { listOnHand, listMasters } from "@/lib/erp/api";
import { formatKg, formatPcs } from "@/lib/erp/format";

export const Route = createFileRoute("/subcontract")({ component: SubcontractPage });

function SubcontractPage() {
  const qc = useQueryClient();
  const subQ = useQuery({ queryKey: ["subcontracts"], queryFn: () => listSubcontractOrders() });
  const lotsQ = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const mastersQ = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });

  const [partnerId, setPartnerId] = useState("");
  const [processType, setProcessType] = useState<"PLATING" | "HEAT_TREATMENT" | "POLISHING" | "ANNEALING">("PLATING");
  const [lotId, setLotId] = useState("");
  const [sentKg, setSentKg] = useState("50");
  const [sentPcs, setSentPcs] = useState("500");
  const [remarks, setRemarks] = useState("");

  const partners = mastersQ.data?.partners ?? [];
  const fgLots = (lotsQ.data ?? []).filter((l) => l.status === "AVAILABLE");

  const createMut = useMutation({
    mutationFn: () => {
      const selectedLot = fgLots.find((l) => String(l.id) === lotId);
      return createSubcontractOrder({
        data: {
          partnerId: Number(partnerId || partners[0]?.id),
          processType,
          remarks: remarks || undefined,
          lines: [
            {
              lotId: Number(lotId || fgLots[0]?.id),
              itemId: Number(selectedLot?.item_id || 1),
              sentQtyPcs: Number(sentPcs),
              sentQtyKg: Number(sentKg),
            },
          ],
        },
      });
    },
    onSuccess: () => {
      toast.success("Subcontract Process Order issued");
      void qc.invalidateQueries({ queryKey: ["subcontracts"] });
      setRemarks("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Outsourcing" title="Process Subcontracting (Plating / Heat Treatment)">
        <span className="text-sm text-muted">Issue semi-finished parts for external Nickel/Chrome Plating, Heat Treatment, and track process loss %</span>
      </PageHeader>

      <form
        className="mb-4 grid gap-3 rounded-md border border-line bg-paper p-3 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          createMut.mutate();
        }}
      >
        <Field label="Job Worker / Plater">
          <Select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
            {partners.map((p) => (
              <option key={Number(p.id)} value={Number(p.id)}>
                {String(p.name)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Process Type">
          <Select value={processType} onChange={(e) => setProcessType(e.target.value as any)}>
            <option value="PLATING">Nickel / Chrome Plating</option>
            <option value="HEAT_TREATMENT">Heat Treatment / Tempering</option>
            <option value="POLISHING">Buffing / Polishing</option>
            <option value="ANNEALING">Annealing</option>
          </Select>
        </Field>
        <Field label="Source Lot">
          <Select value={lotId} onChange={(e) => setLotId(e.target.value)}>
            {fgLots.map((l) => (
              <option key={Number(l.id)} value={Number(l.id)}>
                {String(l.lot_no)} · {String(l.sku)} ({formatPcs(l.qty_pcs)} pcs)
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sent Pcs">
          <Input value={sentPcs} onChange={(e) => setSentPcs(e.target.value)} />
        </Field>
        <Field label="Sent Weight (Kg)">
          <Input value={sentKg} onChange={(e) => setSentKg(e.target.value)} />
        </Field>
        <Field label="Remarks" className="md:col-span-2">
          <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Process notes e.g., 5-micron nickel coating..." />
        </Field>
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={createMut.isPending}>
            Issue Subcontract Order
          </Button>
        </div>
      </form>

      <Panel title="Subcontract Orders History">
        <table className="app-table">
          <thead>
            <tr>
              <th>Doc No</th>
              <th>Vendor</th>
              <th>Process</th>
              <th>Date</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(subQ.data ?? []).map((s: any) => (
              <tr key={Number(s.id)}>
                <td className="font-mono text-brass-soft font-bold">{String(s.doc_no)}</td>
                <td>{String(s.vendor_name || "Plater Vendor")}</td>
                <td><Badge tone="AVAILABLE">{String(s.process_type)}</Badge></td>
                <td className="tabular">{String(s.sent_date).substring(0, 10)}</td>
                <td><Badge>{String(s.status)}</Badge></td>
                <td>{String(s.remarks || "-")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
