import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { bookWo, listOpenDocs } from "@/lib/erp/api";
import { listFoundry, pourFoundry } from "@/lib/erp/api-foundry";
import { formatKg, formatPcs, n } from "@/lib/erp/format";
import { woCompleteCheck, yieldGap } from "@/modules/inventory/rules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop")({ component: ShopPage });

function ShopPage() {
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const foundry = useQuery({ queryKey: ["foundry"], queryFn: () => listFoundry() });
  const open = (docs.data?.wos ?? []).filter((w) => w.status === "ISSUED" || w.status === "OPEN");
  const [woId, setWoId] = useState("");
  const [good, setGood] = useState("9820");
  const [rej, setRej] = useState("80");
  const [scrap, setScrap] = useState("6.400");
  const wo = open.find((w) => String(w.id) === (woId || String(open[0]?.id)));
  const kgPer = n(wo?.kg_per_pc);
  const issued = n(wo?.issued_kg);
  const gate = useMemo(
    () =>
      woCompleteCheck({
        issuedKg: issued,
        goodPcs: n(good),
        rejectPcs: n(rej),
        kgPerPc: kgPer,
        tolerancePct: 0.5,
      }),
    [issued, good, rej, kgPer],
  );
  const gap = useMemo(
    () =>
      yieldGap({
        issuedKg: issued,
        goodKg: n(good) * kgPer,
        rejectKg: n(rej) * kgPer,
        scrapKg: n(scrap),
      }),
    [issued, good, rej, scrap, kgPer],
  );
  const mut = useMutation({
    mutationFn: () =>
      bookWo({
        data: {
          woId: Number(woId || wo?.id),
          goodPcs: n(good),
          rejectPcs: n(rej),
          scrapKg: n(scrap),
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `Booked · FG ${r.fgLotNo ?? "—"} · turning ${r.scrapLotNo ?? "—"} · runner ${r.runnerKg} kg · gap ${r.yieldGapKg} kg`,
      );
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <div className="mb-4 text-micro font-medium uppercase tracking-[0.16em] text-brass-deep">
          Shop supervisor
        </div>
        <h1 className="font-display text-3xl text-navy">Booking</h1>
        <p className="mb-5 text-sm text-muted">Only good pcs, reject pcs, scrap kg. Nothing else.</p>
        <form
          className="space-y-4 rounded-lg border border-line bg-paper p-5"
          onSubmit={(e) => {
            e.preventDefault();
            mut.mutate();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-micro uppercase tracking-wide text-muted">Work order</span>
            <select
              className="h-14 w-full rounded-md border border-line bg-cream px-3 text-lg"
              value={woId || String(wo?.id ?? "")}
              onChange={(e) => setWoId(e.target.value)}
            >
              {open.map((w) => (
                <option key={w.id as number} value={w.id as number}>
                  {w.doc_no as string} · {w.sku as string}
                </option>
              ))}
            </select>
          </label>
          {wo ? (
            <div className="grid grid-cols-2 gap-2 rounded-md bg-cream px-3 py-2 font-mono text-sm">
              <div>Issued {formatKg(wo.issued_kg)} kg</div>
              <div>Plan {formatPcs(wo.qty_pcs)} pcs</div>
              <div>Theoretical {formatKg(gate.theoreticalKg)} kg</div>
              <div>kg/pc {kgPer.toFixed(3)}</div>
            </div>
          ) : (
            <p className="text-sm text-muted">Issue rod to a WO first.</p>
          )}
          <label className="block">
            <span className="mb-1 block text-micro uppercase tracking-wide text-muted">Good pcs</span>
            <input
              className="h-16 w-full rounded-md border border-line bg-cream px-3 font-mono text-3xl tabular"
              value={good}
              onChange={(e) => setGood(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-micro uppercase tracking-wide text-muted">Reject pcs</span>
            <input
              className="h-16 w-full rounded-md border border-line bg-cream px-3 font-mono text-3xl tabular"
              value={rej}
              onChange={(e) => setRej(e.target.value)}
              inputMode="numeric"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-micro uppercase tracking-wide text-muted">Scrap kg (turning)</span>
            <input
              className="h-16 w-full rounded-md border border-line bg-cream px-3 font-mono text-3xl tabular"
              value={scrap}
              onChange={(e) => setScrap(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <div className="rounded-md border border-line bg-cream px-3 py-2 font-mono text-sm">
            <div>Accounted {formatKg(gap.accountedKg)} kg</div>
            <div>
              Yield gap {formatKg(gap.remainderKg)} kg
              {gap.remainderKg > 0.0005 ? " → runner if backflush on" : ""}
            </div>
            {!gate.ok ? <div className="mt-1 text-danger">{gate.message}</div> : null}
          </div>
          <Button type="submit" size="shop" className="w-full" disabled={mut.isPending || !wo || !gate.ok}>
            Post booking
          </Button>
        </form>
        {foundry.data?.enabled !== false ? <ShopHeatPanel foundry={foundry.data} onPosted={() => void qc.invalidateQueries()} /> : null}
      </div>
    </AppShell>
  );
}

function ShopHeatPanel({
  foundry,
  onPosted,
}: {
  foundry: Awaited<ReturnType<typeof listFoundry>> | undefined;
  onPosted: () => void;
}) {
  const heat = (foundry?.heats ?? []).find((h) =>
    ["CHARGED", "HOLD_SPECTRO", "RELEASED_POUR", "POURED"].includes(h.status),
  );
  const [good, setGood] = useState("80");
  const [runner, setRunner] = useState("15");
  const [dross, setDross] = useState("3");
  const pour = useMutation({
    mutationFn: () =>
      pourFoundry({
        data: {
          heatId: n(heat?.id),
          goodKg: n(good),
          runnerKg: n(runner),
          drossKg: n(dross),
          rejectKg: 0,
          drossToVariance: false,
        },
      }),
    onSuccess: (r) => {
      toast.success(`Poured ${r.pourNo} · ${r.castingLotNo}`);
      onPosted();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!heat) {
    return (
      <p className="mt-6 text-sm text-muted">
        No open heat. Open one on{" "}
        <Link to="/foundry" className="text-navy underline">
          Foundry
        </Link>
        . Shop runs one heat at a time.
      </p>
    );
  }
  return (
    <div className="mt-8 rounded-lg border border-line bg-paper p-5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-micro font-medium uppercase tracking-[0.16em] text-brass-deep">One heat</div>
          <div className="font-display text-2xl text-navy">{heat.doc_no}</div>
        </div>
        <Badge tone={heat.status === "RELEASED_POUR" ? "AVAILABLE" : heat.status === "HOLD_SPECTRO" ? "HOLD" : "ISSUED"}>
          {heat.status}
        </Badge>
      </div>
      <p className="mb-3 font-mono text-sm">
        {heat.alloy} · charged {formatKg(heat.charged_kg)} kg
      </p>
      {heat.status === "HOLD_SPECTRO" ? (
        <p className="text-sm text-danger">Spectro FAIL blocks pour. Post a PASS on Foundry.</p>
      ) : null}
      {heat.status === "CHARGED" ? <p className="text-sm text-muted">Waiting spectro PASS.</p> : null}
      {heat.status === "POURED" ? (
        <p className="text-sm text-muted">
          Poured. Close the heat on{" "}
          <Link to="/foundry" className="underline">
            Foundry
          </Link>
          .
        </p>
      ) : null}
      {heat.status === "RELEASED_POUR" ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            pour.mutate();
          }}
        >
          <label className="block">
            <span className="mb-1 block text-micro uppercase tracking-wide text-muted">Good kg</span>
            <input
              className="h-16 w-full rounded-md border border-line bg-cream px-3 font-mono text-3xl tabular"
              value={good}
              onChange={(e) => setGood(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-micro uppercase tracking-wide text-muted">Runner kg</span>
            <input
              className="h-14 w-full rounded-md border border-line bg-cream px-3 font-mono text-2xl tabular"
              value={runner}
              onChange={(e) => setRunner(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-micro uppercase tracking-wide text-muted">Dross kg</span>
            <input
              className="h-14 w-full rounded-md border border-line bg-cream px-3 font-mono text-2xl tabular"
              value={dross}
              onChange={(e) => setDross(e.target.value)}
              inputMode="decimal"
            />
          </label>
          <Button type="submit" size="shop" className="w-full" disabled={pour.isPending}>
            Pour + knockout
          </Button>
        </form>
      ) : null}
    </div>
  );
}
