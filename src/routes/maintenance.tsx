import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getMaintenanceDashboard, logPreventiveMaintenance, replaceCncTool } from "@/lib/erp/api-maintenance";

export const Route = createFileRoute("/maintenance")({ component: MaintenancePage });

function MaintenancePage() {
  const qc = useQueryClient();
  const dashQ = useQuery({ queryKey: ["maint-dash"], queryFn: () => getMaintenanceDashboard() });

  const [machineId, setMachineId] = useState("");
  const [toolName, setToolName] = useState("Carbide Turning Insert (DNMG)");
  const [toolSlot, setToolSlot] = useState("T1");
  const [ratedLife, setRatedLife] = useState("5000");

  const [checkMachineId, setCheckMachineId] = useState("");
  const [remarks, setRemarks] = useState("");

  const wcs = dashQ.data?.workCentres ?? [];

  const addToolMut = useMutation({
    mutationFn: () =>
      replaceCncTool({
        data: {
          machineId: Number(machineId || wcs[0]?.id),
          toolName,
          toolSlot,
          ratedLifeParts: Number(ratedLife),
        },
      }),
    onSuccess: () => {
      toast.success("Tool Insert logged / reset");
      void qc.invalidateQueries({ queryKey: ["maint-dash"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkMut = useMutation({
    mutationFn: () =>
      logPreventiveMaintenance({
        data: {
          machineId: Number(checkMachineId || wcs[0]?.id),
          coolantLevel: "OK",
          lubricationOk: true,
          spindleSoundOk: true,
          chipConveyorOk: true,
          remarks: remarks || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Preventive maintenance log recorded");
      void qc.invalidateQueries({ queryKey: ["maint-dash"] });
      setRemarks("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Shop Floor Maintenance" title="CNC Tooling & Preventive Machine Maintenance">
        <span className="text-sm text-muted">Track CNC insert stroke counts, rated tool life alerts, and daily lubrication/coolant checklists</span>
      </PageHeader>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Panel title="Replace / Register CNC Tool Insert">
          <form
            className="p-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              addToolMut.mutate();
            }}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Machine">
                <Select value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                  {wcs.map((w: any) => (
                    <option key={Number(w.id)} value={Number(w.id)}>
                      {String(w.name)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Tool Slot">
                <Input value={toolSlot} onChange={(e) => setToolSlot(e.target.value)} placeholder="T1 / T2..." />
              </Field>
            </div>
            <Field label="Tool Specification / Insert Code">
              <Input value={toolName} onChange={(e) => setToolName(e.target.value)} />
            </Field>
            <Field label="Rated Part Life (Pcs)">
              <Input value={ratedLife} onChange={(e) => setRatedLife(e.target.value)} />
            </Field>
            <Button type="submit" disabled={addToolMut.isPending}>
              Register New Insert
            </Button>
          </form>
        </Panel>

        <Panel title="Daily Machine Check Log">
          <form
            className="p-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              checkMut.mutate();
            }}
          >
            <Field label="Machine">
              <Select value={checkMachineId} onChange={(e) => setCheckMachineId(e.target.value)}>
                {wcs.map((w: any) => (
                  <option key={Number(w.id)} value={Number(w.id)}>
                    {String(w.name)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked disabled /> Coolant Concentration OK
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked disabled /> Lubrication Pressure OK
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked disabled /> Spindle Noise Normal
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked disabled /> Chip Conveyor Clean
              </label>
            </div>
            <Field label="Maintenance Remarks">
              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Coolant topped up 10L..." />
            </Field>
            <Button type="submit" disabled={checkMut.isPending}>
              Submit Daily Inspection
            </Button>
          </form>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="CNC Tool Life Tracking">
          <table className="app-table text-xs">
            <thead>
              <tr>
                <th>Machine</th>
                <th>Slot</th>
                <th>Tool Insert</th>
                <th>Used / Rated</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(dashQ.data?.tooling ?? []).map((t: any) => {
                const rem = Number(t.rated_life_parts || 5000) - Number(t.current_parts || 0);
                const warn = rem < 500;
                return (
                  <tr key={Number(t.id)}>
                    <td>{String(t.machine_name || "CNC Machine")}</td>
                    <td className="font-mono">{String(t.tool_slot || "T1")}</td>
                    <td className="font-mono">{String(t.tool_name)}</td>
                    <td className="tabular">{Number(t.current_parts)} / {Number(t.rated_life_parts)} pcs</td>
                    <td>
                      <Badge tone={warn ? "HOLD" : "AVAILABLE"}>{warn ? "REPLACE SOON" : "GOOD"}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        <Panel title="Recent Preventive Maintenance Logs">
          <table className="app-table text-xs">
            <thead>
              <tr>
                <th>Date</th>
                <th>Machine</th>
                <th>Inspector</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {(dashQ.data?.preventive ?? []).map((p: any) => (
                <tr key={Number(p.id)}>
                  <td className="tabular">{String(p.check_date).substring(0, 10)}</td>
                  <td>{String(p.machine_name || "Work Centre")}</td>
                  <td>{String(p.inspector_name || "Inspector")}</td>
                  <td>{String(p.remarks || "All parameters OK")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}
