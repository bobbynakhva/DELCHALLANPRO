import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import {
  addFoundryCharge,
  closeFoundryHeat,
  confirmFoundryCharge,
  createFoundryHeat,
  getHeat,
  listFoundry,
  pourFoundry,
  postFoundrySpectro,
} from "@/lib/erp/api-foundry";
import { formatKg, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/foundry")({ component: FoundryPage });

function heatTone(s: string): string {
  if (s === "CLOSED") return "CLOSED";
  if (s === "RELEASED_POUR") return "AVAILABLE";
  if (s === "HOLD_SPECTRO") return "HOLD";
  if (s === "POURED" || s === "CHARGED") return "ISSUED";
  return "DRAFT";
}

function FoundryPage() {
  const qc = useQueryClient();
  const board = useQuery({ queryKey: ["foundry"], queryFn: () => listFoundry() });
  const [heatId, setHeatId] = useState<number | null>(null);
  const heats = board.data?.heats ?? [];
  const selectedId = heatId ?? (heats[0] ? n(heats[0].id) : null);
  const detail = useQuery({
    queryKey: ["heat", selectedId],
    queryFn: () => getHeat({ data: { id: selectedId! } }),
    enabled: Boolean(selectedId),
  });

  const [alloyId, setAlloyId] = useState("");
  const [furnace, setFurnace] = useState("MELT-1");
  const [recipeId, setRecipeId] = useState("");
  const [lotId, setLotId] = useState("");
  const [qty, setQty] = useState("");
  const [cu, setCu] = useState("61.400");
  const [zn, setZn] = useState("35.500");
  const [pb, setPb] = useState("3.100");
  const [good, setGood] = useState("80");
  const [runner, setRunner] = useState("15");
  const [dross, setDross] = useState("3");
  const [reject, setReject] = useState("0");
  const [drossVar, setDrossVar] = useState(false);
  const [ownerOverride, setOwnerOverride] = useState(false);

  useEffect(() => {
    if (!alloyId && board.data?.alloys[0]) setAlloyId(String(board.data.alloys[0].id));
  }, [alloyId, board.data?.alloys]);

  const chargeLots = useMemo(() => {
    const all = board.data?.chargeLots ?? [];
    const heatAlloy = detail.data ? String(detail.data.heat.alloy ?? "") : "";
    return heatAlloy ? all.filter((l) => !l.alloy || l.alloy === heatAlloy) : all;
  }, [board.data?.chargeLots, detail.data]);

  const create = useMutation({
    mutationFn: () =>
      createFoundryHeat({
        data: {
          alloyId: Number(alloyId || board.data?.alloys[0]?.id),
          furnace,
          recipeId: recipeId ? Number(recipeId) : undefined,
        },
      }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} DRAFT`);
      setHeatId(r.id);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const addLine = useMutation({
    mutationFn: () =>
      addFoundryCharge({
        data: { heatId: selectedId!, lotId: Number(lotId), qtyKg: n(qty) },
      }),
    onSuccess: () => {
      toast.success("Charge line added");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const confirm = useMutation({
    mutationFn: () => confirmFoundryCharge({ data: { heatId: selectedId! } }),
    onSuccess: (r) => {
      toast.success(`Charged ${formatKg(r.chargedKg)} kg → ${r.wipLotNo}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const spectro = useMutation({
    mutationFn: () =>
      postFoundrySpectro({
        data: { heatId: selectedId!, cuPct: n(cu), znPct: n(zn), pbPct: n(pb) },
      }),
    onSuccess: (r) => {
      toast[r.passed ? "success" : "error"](r.passed ? "Spectro PASS — pour released" : `Spectro FAIL — ${r.reasons.join("; ")}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const pour = useMutation({
    mutationFn: () =>
      pourFoundry({
        data: {
          heatId: selectedId!,
          goodKg: n(good),
          runnerKg: n(runner),
          drossKg: n(dross),
          rejectKg: n(reject),
          drossToVariance: drossVar,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Poured ${r.pourNo} · KO ${r.knockoutNo} · ${r.castingLotNo}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const close = useMutation({
    mutationFn: () => closeFoundryHeat({ data: { heatId: selectedId!, ownerOverride } }),
    onSuccess: (r) => {
      toast.success(`Closed · loss ${formatKg(r.lossKg)} kg (${r.lossPct.toFixed(2)}%)`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (board.data && board.data.enabled === false) {
    return (
      <AppShell>
        <PageHeader kicker="Foundry" title="Foundry is switched off" />
        <p className="text-sm text-muted">foundry_enabled=false — melt nav is hidden. Journeys 1–21 stay green.</p>
      </AppShell>
    );
  }

  const heat = detail.data?.heat;
  const status = String(heat?.status ?? "");

  return (
    <AppShell>
      <PageHeader kicker="Foundry" title="Heat · charge by lot · spectro · pour">
        <span className="text-sm text-muted">One heat at a time. Spectro is not a BIS/NABL certificate.</span>
      </PageHeader>
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-3">
          <form
            className="space-y-2 rounded-md border border-line bg-paper p-3"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="font-display text-lg text-navy">Open a heat</div>
            <Field label="Alloy">
              <Select value={alloyId} onChange={(e) => setAlloyId(e.target.value)}>
                {(board.data?.alloys ?? []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Furnace">
              <Input value={furnace} onChange={(e) => setFurnace(e.target.value)} />
            </Field>
            <Field label="Recipe (snapshot on confirm)">
              <Select value={recipeId} onChange={(e) => setRecipeId(e.target.value)}>
                <option value="">Default for alloy</option>
                {(board.data?.recipes ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {r.alloy}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" className="w-full" disabled={create.isPending}>
              Create DRAFT heat
            </Button>
          </form>
          <Panel title="Heats">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Doc</th>
                  <th>Alloy</th>
                  <th>Charged</th>
                  <th>Good</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {heats.map((h) => (
                  <tr
                    key={h.id}
                    className={n(h.id) === selectedId ? "bg-cream-deep" : "cursor-pointer"}
                    onClick={() => setHeatId(n(h.id))}
                  >
                    <td className="font-mono">{h.doc_no}</td>
                    <td className="font-mono">{h.alloy}</td>
                    <td className="tabular">{formatKg(h.charged_kg)}</td>
                    <td className="tabular">{formatKg(h.good_kg)}</td>
                    <td>
                      <Badge tone={heatTone(h.status)}>{h.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
        <div className="space-y-3">
          {heat ? (
            <>
              <Panel
                title={`${String(heat.doc_no)} · ${String(heat.alloy)}`}
                actions={<Badge tone={heatTone(status)}>{status}</Badge>}
              >
                <dl className="grid grid-cols-2 gap-2 p-3 text-sm">
                  <dt className="text-muted">Furnace</dt>
                  <dd>{String(heat.furnace)}</dd>
                  <dt className="text-muted">Charged</dt>
                  <dd className="tabular">{formatKg(heat.charged_kg)} kg</dd>
                  <dt className="text-muted">Good / runner / dross</dt>
                  <dd className="tabular">
                    {formatKg(heat.good_kg)} / {formatKg(heat.runner_kg)} / {formatKg(heat.dross_kg)}
                  </dd>
                  <dt className="text-muted">Loss</dt>
                  <dd className="tabular">{formatKg(heat.loss_kg)} kg</dd>
                  {heat.recipe_snapshot_json ? (
                    <>
                      <dt className="text-muted">Recipe snapshot</dt>
                      <dd className="font-mono text-xs">{String(heat.recipe_snapshot_json)}</dd>
                    </>
                  ) : null}
                </dl>
              </Panel>
              {status === "DRAFT" ? (
                <form
                  className="space-y-2 rounded-md border border-line bg-paper p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addLine.mutate();
                  }}
                >
                  <div className="text-sm font-semibold text-navy">Charge by lot — not anonymous kg</div>
                  <Field label="Lot">
                    <Select
                      value={lotId}
                      onChange={(e) => {
                        setLotId(e.target.value);
                        const lot = chargeLots.find((l) => String(l.id) === e.target.value);
                        if (lot && !qty) setQty(String(n(lot.qty_kg)));
                      }}
                    >
                      <option value="">Select lot</option>
                      {chargeLots.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.lot_no} · {l.sku} · {formatKg(l.qty_kg)} kg · {l.alloy ?? "?"}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Charge kg">
                    <Input value={qty} onChange={(e) => setQty(e.target.value)} />
                  </Field>
                  <Button type="submit" className="w-full" disabled={!lotId || addLine.isPending}>
                    Add charge line
                  </Button>
                  <Button
                    type="button"
                    variant="navy"
                    className="w-full"
                    disabled={confirm.isPending || !(detail.data?.charges.length)}
                    onClick={() => confirm.mutate()}
                  >
                    Confirm charge → WIP-MELT
                  </Button>
                </form>
              ) : null}
              {status === "CHARGED" || status === "HOLD_SPECTRO" ? (
                <form
                  className="space-y-2 rounded-md border border-line bg-paper p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    spectro.mutate();
                  }}
                >
                  <div className="text-sm font-semibold text-navy">Spectro vs alloy min/max</div>
                  {status === "HOLD_SPECTRO" ? (
                    <p className="text-sm text-danger">FAIL holds pour. Post a PASS reading to release.</p>
                  ) : null}
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Cu %">
                      <Input value={cu} onChange={(e) => setCu(e.target.value)} />
                    </Field>
                    <Field label="Zn %">
                      <Input value={zn} onChange={(e) => setZn(e.target.value)} />
                    </Field>
                    <Field label="Pb %">
                      <Input value={pb} onChange={(e) => setPb(e.target.value)} />
                    </Field>
                  </div>
                  <Button type="submit" variant="navy" className="w-full" disabled={spectro.isPending}>
                    Post spectro
                  </Button>
                  <p className="text-micro text-muted">Not a BIS / NABL certificate.</p>
                </form>
              ) : null}
              {status === "RELEASED_POUR" ? (
                <form
                  className="space-y-2 rounded-md border border-line bg-paper p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    pour.mutate();
                  }}
                >
                  <div className="text-sm font-semibold text-navy">Pour + knockout</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Good kg">
                      <Input value={good} onChange={(e) => setGood(e.target.value)} />
                    </Field>
                    <Field label="Runner kg">
                      <Input value={runner} onChange={(e) => setRunner(e.target.value)} />
                    </Field>
                    <Field label="Dross kg">
                      <Input value={dross} onChange={(e) => setDross(e.target.value)} />
                    </Field>
                    <Field label="Reject kg">
                      <Input value={reject} onChange={(e) => setReject(e.target.value)} />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={drossVar} onChange={(e) => setDrossVar(e.target.checked)} />
                    Dross to variance (default: dross stock)
                  </label>
                  <Button type="submit" className="w-full" disabled={pour.isPending}>
                    Pour and knockout
                  </Button>
                </form>
              ) : null}
              {status === "POURED" ? (
                <form
                  className="space-y-2 rounded-md border border-line bg-paper p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    close.mutate();
                  }}
                >
                  <div className="text-sm font-semibold text-navy">Close heat</div>
                  <p className="text-sm text-muted">
                    Loss = charged − (good + runner + dross + reject). Over 3% needs Owner override.
                  </p>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={ownerOverride} onChange={(e) => setOwnerOverride(e.target.checked)} />
                    Owner override (loss {'>'} 3%)
                  </label>
                  <Button type="submit" variant="navy" className="w-full" disabled={close.isPending}>
                    Close heat
                  </Button>
                </form>
              ) : null}
              <Panel title="Charge lots">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Lot</th>
                      <th>SKU</th>
                      <th>kg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detail.data?.charges ?? []).map((c) => (
                      <tr key={String(c.id)}>
                        <td className="font-mono">
                          <Link to="/genealogy/$lotId" params={{ lotId: String(c.lot_id) }} className="underline">
                            {String(c.lot_no)}
                          </Link>
                        </td>
                        <td className="font-mono">{String(c.sku)}</td>
                        <td className="tabular">{formatKg(c.qty_kg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
              <Panel title="Pours / knockout">
                <ul className="space-y-1 p-3 text-sm">
                  {(detail.data?.pours ?? []).map((p) => (
                    <li key={String(p.id)}>
                      <Link to="/print/pour/$id" params={{ id: String(p.id) }} className="font-mono underline">
                        {String(p.doc_no)}
                      </Link>
                      <span className="text-muted"> · {formatKg(p.good_kg)} kg · </span>
                      {p.casting_lot_id ? (
                        <Link to="/genealogy/$lotId" params={{ lotId: String(p.casting_lot_id) }} className="underline">
                          {String(p.casting_lot_no)}
                        </Link>
                      ) : null}
                    </li>
                  ))}
                  {(detail.data?.knockouts ?? []).map((k) => (
                    <li key={String(k.id)}>
                      <Link to="/print/knockout/$id" params={{ id: String(k.id) }} className="font-mono underline">
                        {String(k.doc_no)}
                      </Link>
                      <span className="text-muted">
                        {" "}
                        · runner {formatKg(k.runner_kg)} · dross {formatKg(k.dross_kg)}
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </>
          ) : (
            <p className="text-sm text-muted">Create a heat, then charge known lots of the same alloy.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
