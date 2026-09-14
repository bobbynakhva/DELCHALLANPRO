import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel, linesOf } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { listJobWork, listMasters, listOnHand } from "@/lib/erp/api";
import { consumeCustomerMetal, issueJobWork, receiveCustomerMetal, returnCustomerFg, returnJobWork } from "@/lib/erp/api-jw";
import { deemedSupply } from "@/lib/erp/api-gst";
import { generateEway, gateOut, generateIrn, cancelIrn, previewEway } from "@/lib/erp/api-irp";
import { formatINR, formatKg, formatPcs, n, roundKg } from "@/lib/erp/format";
import { jwLossWorking } from "@/modules/inventory/rules";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/jw")({ component: JwPage });

function JwPage() {
  const qc = useQueryClient();
  const jw = useQuery({ queryKey: ["jw"], queryFn: () => listJobWork() });
  const masters = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });
  const lots = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const workers = (masters.data?.partners ?? []).filter((p) => p.is_job_worker);
  const kiran = workers.find((p) => p.code === "V-KIRAN");
  const sourceLots = (lots.data ?? []).filter(
    (l) => l.status === "AVAILABLE" && l.owner_type === "OWN" && n(l.qty_pcs) > 0 && l.warehouse !== "JW-OUT",
  );
  const openChallans = (jw.data?.challans ?? []).filter((c) => c.status !== "CLOSED");
  const nippleChallan = openChallans.find((c) => {
    const ln = linesOf<{ sku: string; qty_pcs: string }>(c.lines)[0];
    return ln?.sku === "HEX-NIPPLE-1/2-NCR";
  });
  const defaultReturn = nippleChallan ?? openChallans[0];
  const [partnerId, setPartnerId] = useState("");
  const [lotId, setLotId] = useState("");
  const [pcs, setPcs] = useState("9820");
  const [process, setProcess] = useState("NI_CR");
  const [challanId, setChallanId] = useState("");
  const [good, setGood] = useState("9700");
  const [rej, setRej] = useState("80");
  const [short, setShort] = useState("40");
  const [scrapReturned, setScrapReturned] = useState("0");
  const [scrapRetained, setScrapRetained] = useState("0");
  const [inPartner, setInPartner] = useState("");
  const [inItem, setInItem] = useState("");
  const [inHeat, setInHeat] = useState("GS-HEAT-NEW");
  const [inKg, setInKg] = useState("100.000");
  const [custLot, setCustLot] = useState("");
  const [custKg, setCustKg] = useState("10.000");
  const [jwVehicle, setJwVehicle] = useState("GJ01AB1234");
  const [jwDistance, setJwDistance] = useState("18");
  const [jwSkip50, setJwSkip50] = useState(false);
  const [jwPartA, setJwPartA] = useState("");

  const selectedChallan = openChallans.find((c) => String(c.id) === (challanId || String(defaultReturn?.id))) ?? defaultReturn;
  const chLine = selectedChallan ? linesOf<{ sku: string; qty_pcs: string; qty_kg: string }>(selectedChallan.lines)[0] : undefined;
  const sentKg = n(chLine?.qty_kg);
  const sentPcs = n(chLine?.qty_pcs);
  const kgPer = sentPcs > 0 ? sentKg / sentPcs : 0.048;
  const liveWorking = jwLossWorking({
    sentKg,
    goodKg: roundKg(n(good) * kgPer),
    rejectKg: roundKg(n(rej) * kgPer),
    scrapReturnedKg: n(scrapReturned),
    scrapRetainedKg: n(scrapRetained),
    lossNormPct: n(selectedChallan?.loss_norm_pct ?? 1.5),
  });
  const customers = (masters.data?.partners ?? []).filter((p) => p.is_customer);
  const rods = (masters.data?.items ?? []).filter((i) => i.type === "RM");
  const gs = customers.find((p) => p.code === "C-GS");
  const rod12 = rods.find((i) => i.sku === "ROD-C360-12MM");
  const customerLots = (lots.data ?? []).filter((l) => l.owner_type === "CUSTOMER" && n(l.qty_kg) > 0);

  const out = useMutation({
    mutationFn: () =>
      issueJobWork({
        data: {
          partnerId: Number(partnerId || kiran?.id),
          lotId: Number(lotId || sourceLots[0]?.id),
          qtyPcs: n(pcs),
          processCode: process,
        },
      }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} · ${r.qtyKg} kg in JW-OUT · due ${r.statutoryDue}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const ret = useMutation({
    mutationFn: () =>
      returnJobWork({
        data: {
          challanId: Number(challanId || defaultReturn?.id),
          goodPcs: n(good),
          rejectPcs: n(rej),
          shortPcs: n(short),
          scrapReturnedKg: n(scrapReturned),
          scrapRetainedKg: n(scrapRetained),
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `${r.docNo} · sent ${r.working.sentKg} accounted ${r.working.accountedKg} loss ${r.working.actualLossKg} excess ${r.working.excessLossKg} · DN ${r.debitNoteNo}`,
      );
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const receiveIn = useMutation({
    mutationFn: () =>
      receiveCustomerMetal({
        data: {
          partnerId: Number(inPartner || gs?.id),
          itemId: Number(inItem || rod12?.id),
          heatNo: inHeat,
          qtyKg: n(inKg),
        },
      }),
    onSuccess: (r) => {
      toast.success(`JW-IN ${r.lotNo} · ${r.qtyKg} kg · value ₹0`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const consumeIn = useMutation({
    mutationFn: () =>
      consumeCustomerMetal({
        data: { lotId: Number(custLot || customerLots[0]?.id), qtyKg: n(custKg) },
      }),
    onSuccess: (r) => {
      toast.success(`Consumed ${r.qtyKg} kg from ${r.lotNo} · value ₹0`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const returnIn = useMutation({
    mutationFn: () =>
      returnCustomerFg({
        data: { lotId: Number(custLot || customerLots[0]?.id), qtyKg: n(custKg) },
      }),
    onSuccess: (r) => {
      toast.success(`Returned ${r.qtyKg} kg from ${r.lotNo} to customer`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const deemed = useMutation({
    mutationFn: (id: number) => deemedSupply({ data: { challanId: id } }),
    onSuccess: (r) => {
      toast.success(`Deemed-supply DRAFT ${r.docNo} dated original challan — not posted`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const eway = useMutation({
    mutationFn: (id: number) =>
      generateEway({
        data: {
          docType: "CHALLAN",
          docId: id,
          vehicle: jwSkip50 ? undefined : jwVehicle,
          distanceKm: n(jwDistance),
          skipSameState50km: jwSkip50,
          force: true,
        },
      }),
    onSuccess: (r) => {
      toast.success(`e-way ${r.ewbNo} · ${r.partA.subSupplyDesc} (${r.partA.docType})`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const jwGate = useMutation({
    mutationFn: (id: number) => gateOut({ data: { docType: "CHALLAN", docId: id } }),
    onSuccess: () => {
      toast.success("Gate-out recorded — e-way did not move stock");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const jwPreview = useMutation({
    mutationFn: (id: number) => previewEway({ data: { docType: "CHALLAN", docId: id } }),
    onSuccess: (r) => {
      setJwPartA(
        `${r.docType} · ${r.subSupplyDesc} (subSupplyType ${r.subSupplyType}) · ${r.docNo} · ${r.toGstin}`,
      );
      toast.message(`Part A ${r.docType} · ${r.subSupplyDesc} — not Supply`);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const dnIrn = useMutation({
    mutationFn: (noteId: number) => generateIrn({ data: { docType: "DN", docId: noteId } }),
    onSuccess: (r) => {
      toast.success(r.already ? `IRN already ${r.Irn.slice(0, 12)}…` : `IRN ${r.Irn.slice(0, 12)}…`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const dnCancel = useMutation({
    mutationFn: (noteId: number) => cancelIrn({ data: { docType: "DN", docId: noteId } }),
    onSuccess: () => {
      toast.success("IRN cancelled");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Job work is manufacturing" title="Outward challans, 365-day clock, returns" />
      <div className="grid gap-3 lg:grid-cols-2">
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            out.mutate();
          }}
        >
          <h2 className="text-sm font-semibold text-navy">Issue JW OUT</h2>
          <Field label="Job worker">
            <Select value={partnerId || String(kiran?.id ?? "")} onChange={(e) => setPartnerId(e.target.value)}>
              {workers.map((p) => (
                <option key={p.id as number} value={p.id as number}>
                  {p.name as string}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Process">
            <Select value={process} onChange={(e) => setProcess(e.target.value)}>
              <option value="NI_CR">Ni-Cr plate</option>
              <option value="POLISH">Polish</option>
            </Select>
          </Field>
          <Field label="Source lot (AVAILABLE, in factory)">
            <Select value={lotId || String(sourceLots[0]?.id ?? "")} onChange={(e) => setLotId(e.target.value)}>
              {sourceLots.map((l) => (
                <option key={l.id as number} value={l.id as number}>
                  {l.lot_no as string} · {l.sku as string} · {formatPcs(l.qty_pcs)} pcs
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Pcs">
            <Input value={pcs} onChange={(e) => setPcs(e.target.value)} />
          </Field>
          <Button type="submit" className="w-full" disabled={out.isPending}>
            Issue challan
          </Button>
        </form>
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            ret.mutate();
          }}
        >
          <h2 className="text-sm font-semibold text-navy">Return from vendor</h2>
          <Field label="Open challan">
            <Select
              value={challanId || String(defaultReturn?.id ?? "")}
              onChange={(e) => setChallanId(e.target.value)}
            >
              {openChallans.map((c) => (
                  <option key={c.id as number} value={c.id as number}>
                    {c.doc_no as string} · {c.partner_name as string} · {c.age_days as number}d
                  </option>
                ))}
            </Select>
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Good pcs">
              <Input value={good} onChange={(e) => setGood(e.target.value)} />
            </Field>
            <Field label="Reject pcs">
              <Input value={rej} onChange={(e) => setRej(e.target.value)} />
            </Field>
            <Field label="Short pcs">
              <Input value={short} onChange={(e) => setShort(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Scrap returned kg">
              <Input value={scrapReturned} onChange={(e) => setScrapReturned(e.target.value)} />
            </Field>
            <Field label="Scrap retained kg">
              <Input value={scrapRetained} onChange={(e) => setScrapRetained(e.target.value)} />
            </Field>
          </div>
          <div className="rounded-md border border-line bg-cream px-3 py-2 font-mono text-xs leading-5" data-testid="jw-working">
            <div>sent {formatKg(liveWorking.sentKg)} kg</div>
            <div>accounted {formatKg(liveWorking.accountedKg)} kg = good + reject + scrap returned + scrap retained</div>
            <div>actualLoss {formatKg(liveWorking.actualLossKg)} kg = sent − accounted</div>
            <div>norm {formatKg(liveWorking.normKg)} kg ({n(selectedChallan?.loss_norm_pct ?? 1.5).toFixed(1)}%)</div>
            <div>excess {formatKg(liveWorking.excessLossKg)} kg = max(0, actualLoss − norm)</div>
          </div>
          <Button type="submit" className="w-full" disabled={ret.isPending}>
            Post return + debit draft
          </Button>
          <p className="text-micro text-muted">
            Excess vs vendor loss-norm drafts a debit note. Scrap retained stays on books until invoiced (s.143(5)).
          </p>
        </form>
      </div>
      <Panel title="Job work IN — customer metal (value ₹0)" className="mt-3">
        <div className="grid gap-3 p-3 md:grid-cols-2">
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              receiveIn.mutate();
            }}
          >
            <h3 className="text-sm font-semibold text-navy">Receive customer metal</h3>
            <Field label="Customer">
              <Select value={inPartner || String(gs?.id ?? "")} onChange={(e) => setInPartner(e.target.value)}>
                {customers.map((p) => (
                  <option key={p.id as number} value={p.id as number}>
                    {p.name as string}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Item">
              <Select value={inItem || String(rod12?.id ?? "")} onChange={(e) => setInItem(e.target.value)}>
                {rods.map((i) => (
                  <option key={i.id as number} value={i.id as number}>
                    {i.sku as string}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Heat">
              <Input value={inHeat} onChange={(e) => setInHeat(e.target.value)} />
            </Field>
            <Field label="kg">
              <Input value={inKg} onChange={(e) => setInKg(e.target.value)} />
            </Field>
            <Button type="submit" disabled={receiveIn.isPending}>
              Receive to JW-IN-CUSTOMER
            </Button>
          </form>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <h3 className="text-sm font-semibold text-navy">Consume / return leftover</h3>
            <Field label="Customer lot">
              <Select value={custLot || String(customerLots[0]?.id ?? "")} onChange={(e) => setCustLot(e.target.value)}>
                {customerLots.map((l) => (
                  <option key={l.id as number} value={l.id as number}>
                    {l.lot_no as string} · {l.sku as string} · {formatKg(l.qty_kg)} kg
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="kg">
              <Input value={custKg} onChange={(e) => setCustKg(e.target.value)} />
            </Field>
            <div className="flex gap-2">
              <Button type="button" disabled={consumeIn.isPending || !customerLots.length} onClick={() => consumeIn.mutate()}>
                Consume
              </Button>
              <Button type="button" variant="ghost" disabled={returnIn.isPending || !customerLots.length} onClick={() => returnIn.mutate()}>
                Return leftover
              </Button>
            </div>
            <p className="text-micro text-muted">Valuation reports exclude JW-IN-CUSTOMER. Bill conversion as SAC 9988, not the metal.</p>
          </form>
        </div>
      </Panel>
      <div className="mt-3 grid gap-2 rounded-md border border-line bg-paper p-3 md:grid-cols-4">
        <Field label="JW vehicle">
          <Input value={jwVehicle} onChange={(e) => setJwVehicle(e.target.value.toUpperCase())} disabled={jwSkip50} />
        </Field>
        <Field label="Distance km">
          <Input value={jwDistance} onChange={(e) => setJwDistance(e.target.value)} />
        </Field>
        <label className="flex items-end gap-2 pb-2 text-sm text-navy">
          <input type="checkbox" checked={jwSkip50} onChange={(e) => setJwSkip50(e.target.checked)} />
          ≤ 50 km same State/UT
        </label>
      </div>
      {jwPartA ? <p className="mt-2 font-mono text-micro text-navy">Part A preview: {jwPartA}</p> : null}
      <Panel title="Challans" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Doc</th>
              <th>Vendor</th>
              <th>Process</th>
              <th>Age</th>
              <th>Line</th>
              <th>kg</th>
              <th>Due +365d</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(jw.data?.challans ?? []).map((c) => {
              const lines = linesOf<{ sku: string; qty_pcs: string; qty_kg: string }>(c.lines);
              const age = n(c.age_days);
              return (
                <tr key={c.id as number}>
                  <td className="font-mono">{c.doc_no as string}</td>
                  <td>{c.partner_name as string}</td>
                  <td>{c.process_code as string}</td>
                  <td className="tabular">
                    {age} d <Badge tone={age >= 270 ? "HOLD" : "AVAILABLE"}>{age >= 330 ? "BLOCK" : age >= 180 ? "watch" : "ok"}</Badge>
                  </td>
                  <td className="font-mono">
                    {lines[0]?.sku} × {formatPcs(lines[0]?.qty_pcs)}
                  </td>
                  <td className="tabular">{formatKg(lines[0]?.qty_kg)}</td>
                  <td className="tabular">{String(c.statutory_due).slice(0, 10)}</td>
                  <td>
                    <Link
                      to="/print/challan/$id"
                      params={{ id: String(c.id) }}
                      className="text-sm text-navy underline"
                    >
                      GST challan
                    </Link>
                    {age >= 330 ? (
                      <button
                        type="button"
                        className="ml-2 text-sm text-danger underline"
                        onClick={() => deemed.mutate(c.id as number)}
                      >
                        Deemed supply draft
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="ml-2 text-sm text-navy underline"
                      onClick={() => jwPreview.mutate(c.id as number)}
                    >
                      Part A
                    </button>
                    <button
                      type="button"
                      className="ml-2 text-sm text-navy underline"
                      onClick={() => eway.mutate(c.id as number)}
                    >
                      e-way (Job Work)
                    </button>
                    {c.eway_id ? (
                      <Link to="/print/eway/$id" params={{ id: String(c.eway_id) }} className="ml-2 text-sm text-navy underline">
                        Print e-way
                      </Link>
                    ) : null}
                    {!c.gate_out_at ? (
                      <button type="button" className="ml-2 text-sm text-navy underline" onClick={() => jwGate.mutate(c.id as number)}>
                        Gate-out
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <Panel title="Returns / debit drafts" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Doc</th>
              <th>Challan</th>
              <th>Good</th>
              <th>Reject</th>
              <th>Short</th>
              <th>Loss % / norm</th>
              <th>DN</th>
              <th>Debit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(jw.data?.returns ?? []).map((r) => {
              const loss = r.loss as {
                actual_loss_pct?: string;
                norm_pct?: string;
                debit_note_no?: string;
                debit_paise?: number;
                debit_status?: string;
                debit_note_id?: number | null;
                debit_irn?: string | null;
                debit_irn_status?: string | null;
              } | null;
              const dnId = n(loss?.debit_note_id);
              const dnPosted = loss?.debit_status === "POSTED" && dnId > 0;
              const dnIrnAct = Boolean(loss?.debit_irn) && loss?.debit_irn_status !== "CNL";
              return (
                <tr key={r.id as number}>
                  <td className="font-mono">{r.doc_no as string}</td>
                  <td className="font-mono">{r.challan_no as string}</td>
                  <td className="tabular">{formatPcs(r.good_pcs)}</td>
                  <td className="tabular">{formatPcs(r.reject_pcs)}</td>
                  <td className="tabular">{formatPcs(r.short_pcs)}</td>
                  <td className="tabular">
                    {n(loss?.actual_loss_pct).toFixed(2)}% / {n(loss?.norm_pct).toFixed(2)}%
                  </td>
                  <td className="font-mono">
                    {loss?.debit_note_no} <Badge tone={loss?.debit_status}>{loss?.debit_status}</Badge>
                  </td>
                  <td className="tabular">{formatINR(loss?.debit_paise)}</td>
                  <td>
                    <Link
                      to="/print/return/$id"
                      params={{ id: String(r.id) }}
                      className="text-sm text-navy underline"
                    >
                      Return challan
                    </Link>
                    {dnId > 0 ? (
                      <Link to="/print/dn/$id" params={{ id: String(dnId) }} className="ml-2 text-sm text-navy underline">
                        DN
                      </Link>
                    ) : null}
                    {dnPosted && !dnIrnAct ? (
                      <button type="button" className="ml-2 text-sm text-navy underline" onClick={() => dnIrn.mutate(dnId)}>
                        Generate IRN
                      </button>
                    ) : null}
                    {dnPosted && dnIrnAct ? (
                      <button type="button" className="ml-2 text-sm text-navy underline" onClick={() => dnCancel.mutate(dnId)}>
                        Cancel IRN
                      </button>
                    ) : null}
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
