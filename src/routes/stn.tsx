import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createStn, listStns, getStnMasters } from "@/lib/erp/api-stn";

export const Route = createFileRoute("/stn")({ component: StnPage });

function StnPage() {
  const qc = useQueryClient();
  const stnsQ = useQuery({ queryKey: ["stns"], queryFn: () => listStns() });
  const mastersQ = useQuery({ queryKey: ["stn-masters"], queryFn: () => getStnMasters() });

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [fromWh, setFromWh] = useState("");
  const [toWh, setToWh] = useState("");
  const [remarks, setRemarks] = useState("");
  
  const [lines, setLines] = useState<{item_id: string; qty: string; uom: string; rack_no: string; lot_no: string}[]>([
    {item_id: "", qty: "0", uom: "KG", rack_no: "", lot_no: ""}
  ]);

  const mut = useMutation({
    mutationFn: () => createStn({ data: {
      stn_date: date,
      from_warehouse_id: Number(fromWh),
      to_warehouse_id: Number(toWh),
      remarks: remarks || undefined,
      lines: lines.filter(l => l.item_id && Number(l.qty) > 0).map(l => ({
        item_id: Number(l.item_id),
        qty: Number(l.qty),
        uom: l.uom,
        rack_no: l.rack_no || undefined,
        lot_no: l.lot_no || undefined
      }))
    } }),
    onSuccess: () => {
      toast.success("STN Posted successfully");
      void qc.invalidateQueries({ queryKey: ["stns"] });
      setLines([{item_id: "", qty: "0", uom: "KG", rack_no: "", lot_no: ""}]);
      setRemarks("");
    },
    onError: (e: Error) => toast.error(e.message)
  });

  return (
    <AppShell>
      <PageHeader kicker="Inventory" title="Store Transfer Note (STN)" />
      
      <Panel title="New STN" className="mb-3">
        <div className="p-3">
          <div className="grid gap-2 md:grid-cols-4 mb-4">
            <Field label="Date">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </Field>
            <Field label="From Warehouse">
              <Select value={fromWh} onChange={e => setFromWh(e.target.value)}>
                <option value="">-- Select --</option>
                {mastersQ.data?.warehouses?.map(w => <option key={Number(w.id)} value={Number(w.id)}>{String(w.name)}</option>)}
              </Select>
            </Field>
            <Field label="To Warehouse">
              <Select value={toWh} onChange={e => setToWh(e.target.value)}>
                <option value="">-- Select --</option>
                {mastersQ.data?.warehouses?.map(w => <option key={Number(w.id)} value={Number(w.id)}>{String(w.name)}</option>)}
              </Select>
            </Field>
            <Field label="Remarks">
              <Input value={remarks} onChange={e => setRemarks(e.target.value)} />
            </Field>
          </div>
          
          <table className="app-table mb-2">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>UOM</th>
                <th>Lot No</th>
                <th>Rack No</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <Select value={line.item_id} onChange={e => {
                      const newLines = [...lines];
                      newLines[idx].item_id = e.target.value;
                      setLines(newLines);
                    }}>
                      <option value="">-- Item --</option>
                      {mastersQ.data?.items?.map(i => <option key={Number(i.id)} value={Number(i.id)}>{String(i.sku)}</option>)}
                    </Select>
                  </td>
                  <td>
                    <Input type="number" step="0.001" value={line.qty} onChange={e => {
                      const newLines = [...lines];
                      newLines[idx].qty = e.target.value;
                      setLines(newLines);
                    }} />
                  </td>
                  <td>
                    <Input value={line.uom} onChange={e => {
                      const newLines = [...lines];
                      newLines[idx].uom = e.target.value;
                      setLines(newLines);
                    }} />
                  </td>
                  <td>
                    <Input value={line.lot_no} onChange={e => {
                      const newLines = [...lines];
                      newLines[idx].lot_no = e.target.value;
                      setLines(newLines);
                    }} />
                  </td>
                  <td>
                    <Input value={line.rack_no} onChange={e => {
                      const newLines = [...lines];
                      newLines[idx].rack_no = e.target.value;
                      setLines(newLines);
                    }} />
                  </td>
                  <td>
                    <Button variant="danger" onClick={() => setLines(lines.filter((_, i) => i !== idx))}>
                      X
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-2">
            <Button onClick={() => setLines([...lines, {item_id: "", qty: "0", uom: "KG", rack_no: "", lot_no: ""}])}>
              Add Line
            </Button>
            <Button onClick={() => mut.mutate()} disabled={!fromWh || !toWh || lines.length === 0 || mut.isPending}>
              Post Transfer
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="STN History">
        <table className="app-table">
          <thead>
            <tr>
              <th>Doc No</th>
              <th>Date</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {(stnsQ.data ?? []).map(s => (
              <tr key={Number(s.id)}>
                <td className="font-mono text-brass-deep">{String(s.doc_no)}</td>
                <td className="tabular">{String(s.stn_date).substring(0, 10)}</td>
                <td>{String(s.from_warehouse_name)}</td>
                <td>{String(s.to_warehouse_name)}</td>
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
