import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createProductionLog, listProductionLogs, getProdLogMasters } from "@/lib/erp/api-prod-log";

export const Route = createFileRoute("/prod-log")({ component: ProdLogPage });

function ProdLogPage() {
  const qc = useQueryClient();
  const logsQ = useQuery({ queryKey: ["prod-logs"], queryFn: () => listProductionLogs() });
  const mastersQ = useQuery({ queryKey: ["prod-masters"], queryFn: () => getProdLogMasters() });

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [logFrom, setLogFrom] = useState("09:00");
  const [logTo, setLogTo] = useState("18:00");
  const [machineId, setMachineId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [itemId, setItemId] = useState("");
  const [goodPcs, setGoodPcs] = useState("0");
  const [goodKg, setGoodKg] = useState("0");
  const [rejectPcs, setRejectPcs] = useState("0");
  const [idleReason, setIdleReason] = useState("");
  const [remarks, setRemarks] = useState("");
  
  const IDLE_REASONS = ["", "POWER_LOSS", "NOT_LOADED", "NO_OPERATOR", "BREAKDOWN", "JOB_SETTING", "MC_CLEANING"];

  const mut = useMutation({
    mutationFn: () => createProductionLog({ data: {
      log_date: date,
      log_from: logFrom,
      log_to: logTo,
      machine_id: machineId ? Number(machineId) : undefined,
      operator_id: operatorId ? Number(operatorId) : undefined,
      item_id: itemId ? Number(itemId) : undefined,
      good_pcs: Number(goodPcs),
      good_kg: Number(goodKg),
      reject_pcs: Number(rejectPcs),
      idle_reason: idleReason || undefined,
      remarks: remarks || undefined
    } }),
    onSuccess: () => {
      toast.success("Production log saved");
      void qc.invalidateQueries({ queryKey: ["prod-logs"] });
      setGoodPcs("0");
      setGoodKg("0");
      setRejectPcs("0");
    },
    onError: (e: Error) => toast.error(e.message)
  });

  return (
    <AppShell>
      <PageHeader kicker="Production" title="OEE & Production Log">
      </PageHeader>
      
      <form 
        className="mb-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-4"
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      >
        <Field label="Date">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </Field>
        <Field label="From Time">
          <Input type="time" value={logFrom} onChange={e => setLogFrom(e.target.value)} />
        </Field>
        <Field label="To Time">
          <Input type="time" value={logTo} onChange={e => setLogTo(e.target.value)} />
        </Field>
        <Field label="Machine">
          <Select value={machineId} onChange={e => setMachineId(e.target.value)}>
            <option value="">-- Select --</option>
            {mastersQ.data?.workCentres?.map(w => <option key={Number(w.id)} value={Number(w.id)}>{String(w.name)}</option>)}
          </Select>
        </Field>
        
        <Field label="Operator">
          <Select value={operatorId} onChange={e => setOperatorId(e.target.value)}>
            <option value="">-- Select --</option>
            {mastersQ.data?.staffList?.map(s => <option key={Number(s.id)} value={Number(s.id)}>{String(s.name)}</option>)}
          </Select>
        </Field>
        <Field label="Item">
          <Select value={itemId} onChange={e => setItemId(e.target.value)}>
            <option value="">-- Select --</option>
            {mastersQ.data?.items?.map(i => <option key={Number(i.id)} value={Number(i.id)}>{String(i.sku)}</option>)}
          </Select>
        </Field>
        
        <Field label="Good Pcs">
          <Input type="number" value={goodPcs} onChange={e => setGoodPcs(e.target.value)} />
        </Field>
        <Field label="Good Kg">
          <Input type="number" step="0.001" value={goodKg} onChange={e => setGoodKg(e.target.value)} />
        </Field>
        
        <Field label="Reject Pcs">
          <Input type="number" value={rejectPcs} onChange={e => setRejectPcs(e.target.value)} />
        </Field>
        <Field label="Idle Reason">
          <Select value={idleReason} onChange={e => setIdleReason(e.target.value)}>
            {IDLE_REASONS.map(r => <option key={r} value={r}>{r || "-- None --"}</option>)}
          </Select>
        </Field>
        <Field label="Remarks" className="md:col-span-2">
          <Input value={remarks} onChange={e => setRemarks(e.target.value)} />
        </Field>
        
        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={mut.isPending}>
            Log Production
          </Button>
        </div>
      </form>

      <Panel title="Recent Logs">
        <table className="app-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Machine</th>
              <th>Operator</th>
              <th>Item</th>
              <th>Good</th>
              <th>Reject</th>
              <th>Idle</th>
            </tr>
          </thead>
          <tbody>
            {(logsQ.data ?? []).map(l => (
              <tr key={Number(l.id)}>
                <td className="tabular">{String(l.log_date).substring(0, 10)}</td>
                <td className="tabular">{String(l.log_from)} - {String(l.log_to)}</td>
                <td>{String(l.machine_name || "-")}</td>
                <td>{String(l.operator_name || "-")}</td>
                <td>{String(l.item_name || "-")}</td>
                <td className="tabular">{String(l.good_pcs)} pcs / {String(l.good_kg)} kg</td>
                <td className="tabular">{String(l.reject_pcs)} pcs</td>
                <td>{l.idle_reason ? <Badge>{String(l.idle_reason)}</Badge> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
