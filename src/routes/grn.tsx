import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel, linesOf } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listMasters, listOpenDocs, postGrn, reverseGrn } from "@/lib/erp/api";
import { formatKg, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/grn")({ component: GrnPage });

function GrnPage() {
  const qc = useQueryClient();
  const masters = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const rods = (masters.data?.items ?? []).filter((i) => i.type === "RM");
  const vendors = (masters.data?.partners ?? []).filter((p) => p.is_vendor);
  const defaultItem = rods.find((i) => i.sku === "ROD-C360-12MM")?.id ?? rods[0]?.id ?? "";
  const defaultPartner = vendors.find((p) => p.code === "V-RAJESH")?.id ?? vendors[0]?.id ?? "";
  const [partnerId, setPartnerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [poId, setPoId] = useState("");
  const [heatNo, setHeatNo] = useState("H26-0913");
  const [gross, setGross] = useState("1262.800");
  const [tare, setTare] = useState("12.300");
  const [vehicle, setVehicle] = useState("GJ-01-AB-4421");
  const net = useMemo(() => n(gross) - n(tare), [gross, tare]);
  const mut = useMutation({
    mutationFn: () =>
      postGrn({
        data: {
          partnerId: Number(partnerId || defaultPartner),
          itemId: Number(itemId || defaultItem),
          poId: poId ? Number(poId) : undefined,
          heatNo,
          grossKg: n(gross),
          tareKg: n(tare),
          vehicleNo: vehicle,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Posted ${r.docNo} · lot ${r.lotNo} · ${r.netKg} kg on QC hold`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const rev = useMutation({
    mutationFn: (grnId: number) => reverseGrn({ data: { grnId } }),
    onSuccess: (r) => {
      toast.success(`Reversed ${r.docNo} — original GRN_RECEIPT remains, opposite posted`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Stores / purchase" title="Goods receipt — gross / tare / net kg" />
      <div className="grid gap-3 lg:grid-cols-[20rem_1fr]">
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <Field label="Vendor">
            <Select value={partnerId || String(defaultPartner)} onChange={(e) => setPartnerId(e.target.value)}>
              {vendors.map((p) => (
                <option key={p.id as number} value={p.id as number}>
                  {p.name as string}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Against PO (optional)">
            <Select value={poId} onChange={(e) => setPoId(e.target.value)}>
              <option value="">— none —</option>
              {(docs.data?.pos ?? []).map((p) => (
                <option key={p.id as number} value={p.id as number}>
                  {p.doc_no as string}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Item">
            <Select value={itemId || String(defaultItem)} onChange={(e) => setItemId(e.target.value)}>
              {rods.map((i) => (
                <option key={i.id as number} value={i.id as number}>
                  {i.sku as string}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Heat no.">
            <Input value={heatNo} onChange={(e) => setHeatNo(e.target.value)} />
          </Field>
          <Field label="Gross kg">
            <Input value={gross} onChange={(e) => setGross(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Tare kg">
            <Input value={tare} onChange={(e) => setTare(e.target.value)} inputMode="decimal" />
          </Field>
          <Field label="Vehicle">
            <Input value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
          </Field>
          <div className="rounded-sm bg-cream px-2 py-2 font-mono text-sm">
            Net {formatKg(net)} kg · posts to QUARANTINE
          </div>
          <Button type="submit" className="w-full" disabled={mut.isPending}>
            Post GRN
          </Button>
          <p className="text-micro text-muted">Journey 1: 1250.500 net of C360 12 mm rod.</p>
        </form>
        <Panel title="GRNs">
          <table className="app-table">
            <thead>
              <tr>
                <th>Doc</th>
                <th>Vendor</th>
                <th>Net kg</th>
                <th>Heat</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(docs.data?.grns ?? []).map((g) => {
                const lines = linesOf<{ net_kg: string; heat_no: string }>(g.lines);
                return (
                  <tr key={g.id as number}>
                    <td className="font-mono">{g.doc_no as string}</td>
                    <td>{g.partner_name as string}</td>
                    <td className="tabular">{formatKg(lines[0]?.net_kg)}</td>
                    <td className="font-mono">{lines[0]?.heat_no}</td>
                    <td>
                      <Badge tone={g.status as string}>{g.status as string}</Badge>
                    </td>
                    <td>
                      <Link to="/print/grn/$id" params={{ id: String(g.id) }} className="text-sm text-navy underline">
                        Weighment
                      </Link>
                      {g.status !== "REVERSED" ? (
                        <button
                          type="button"
                          className="ml-2 text-sm text-danger underline"
                          onClick={() => rev.mutate(g.id as number)}
                        >
                          Reverse
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </AppShell>
  );
}
