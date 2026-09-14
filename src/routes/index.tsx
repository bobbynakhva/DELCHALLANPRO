import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel, Stat } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { getDashboard, getJourneys, getBootstrap } from "@/lib/erp/api";
import { deemedSupply } from "@/lib/erp/api-gst";
import { getRoleBoard } from "@/lib/erp/api-planning";
import { formatINR, formatKg, formatPcs, n } from "@/lib/erp/format";
import type { Row } from "@/lib/erp/row";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: Dashboard });

function Dashboard() {
  const qc = useQueryClient();
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => getDashboard() });
  const journeys = useQuery({ queryKey: ["journeys"], queryFn: () => getJourneys() });
  const board = useQuery({ queryKey: ["role-board"], queryFn: () => getRoleBoard() });
  const boot = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap() });
  const hideSales = boot.data?.staff.role === "SHOP";
  const d = dash.data;
  const done = journeys.data?.steps.filter((s) => s.done).length ?? 0;
  const deemed = useMutation({
    mutationFn: (id: number) => deemedSupply({ data: { challanId: id } }),
    onSuccess: (r) => {
      toast.success(`Deemed-supply DRAFT ${r.docNo} — dated original challan, not posted`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const b = board.data;

  return (
    <AppShell>
      <PageHeader kicker="Owner / GM board" title="Metal, lots, and metal outside the factory">
        <span className="text-sm text-muted">{done}/10 live · CLI pack 27 at Journey pack</span>
      </PageHeader>
      {n(d?.onhand.outside_kg) > 0 ? (
        <div className="mb-3 rounded-md border border-warn bg-paper px-3 py-2 font-mono text-sm text-navy" data-testid="metal-outside">
          Metal outside factory: {formatKg(d?.onhand.outside_kg)} kg
        </div>
      ) : null}
      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Own metal on books" value={`${formatKg(d?.onhand.kg)} kg`} hint="Customer metal excluded from value" />
        <Stat label="Inventory value" value={formatINR(d?.onhand.value_paise)} hint="Weighted avg · own lots only" />
        <Stat
          label="Metal outside factory"
          value={`${formatKg(d?.onhand.outside_kg)} kg`}
          hint="Sum of JW-OUT — still our metal"
          warn={n(d?.onhand.outside_kg) > 0}
        />
        <Stat label="Customer-owned metal" value={`${formatKg(d?.onhand.customer_kg)} kg`} hint="Qty-tracked · value = ₹0" />
      </div>
      {d?.foundry ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Kg in melt (WIP-MELT)" value={`${formatKg(d.foundry.meltKg)} kg`} hint="Does not replace kg-outside-factory" />
          <Stat label="Heats open" value={String(d.foundry.heatsOpen)} hint="Charged through poured" />
          <Stat
            label="7-day melt yield"
            value={d.foundry.yield7dPct == null ? "—" : `${d.foundry.yield7dPct.toFixed(1)}%`}
            hint="Closed heats · last 7 days"
          />
          <Stat
            label="Spectro HOLD"
            value={String(d.foundry.spectroHold)}
            hint="FAIL blocks pour"
            warn={d.foundry.spectroHold > 0}
          />
        </div>
      ) : null}
      {b?.owner ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">Owner / GM</h2>
          <OwnerCards owner={b.owner} />
        </section>
      ) : null}
      {b?.ppc ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">PPC</h2>
          <PpcCards ppc={b.ppc} />
        </section>
      ) : null}
      {b?.stores ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">Stores</h2>
          <StoresCards stores={b.stores} />
        </section>
      ) : null}
      {b?.qc ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">QC</h2>
          <QcCards qc={b.qc} />
        </section>
      ) : null}
      {b?.purchase ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">Purchase</h2>
          <PurchaseCards purchase={b.purchase} />
        </section>
      ) : null}
      {b?.sales && !hideSales ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">Sales</h2>
          <SalesCards sales={b.sales} />
        </section>
      ) : null}
      {b?.accounts && !hideSales ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">Accounts</h2>
          <AccountsCards accounts={b.accounts} />
        </section>
      ) : null}
      {b?.shop ? (
        <section className="mb-4">
          <h2 className="mb-2 font-display text-lg text-navy">Shop</h2>
          <ShopCards shop={b.shop} />
        </section>
      ) : null}
      <div className="mt-3 grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
        <Panel title="Job-work ageing (180 / 270 / 330 day clock)">
          <table className="app-table">
            <thead>
              <tr>
                <th>Challan</th>
                <th>Vendor</th>
                <th>Age</th>
                <th>Open pcs</th>
                <th>kg at vendor</th>
                <th>Statutory due</th>
                <th>Band</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(d?.ageing ?? []).map((c) => {
                const age = n(c.age_days);
                const band = age >= 330 ? "BLOCK" : age >= 270 ? "330d" : age >= 180 ? "270d" : "OK";
                return (
                  <tr key={c.id as number}>
                    <td className="font-mono">{c.doc_no as string}</td>
                    <td>{c.partner as string}</td>
                    <td className="tabular">{age} d</td>
                    <td className="tabular">{c.open_pcs as string}</td>
                    <td className="tabular">{formatKg(c.kg)}</td>
                    <td className="tabular">{String(c.statutory_due).slice(0, 10)}</td>
                    <td>
                      <Badge tone={age >= 270 ? "HOLD" : "AVAILABLE"}>{band}</Badge>
                    </td>
                    <td className="whitespace-nowrap">
                      <Link to="/print/challan/$id" params={{ id: String(c.id) }} className="text-sm text-navy underline">
                        Challan
                      </Link>
                      {age >= 330 ? (
                        <button type="button" className="ml-2 text-sm text-danger underline" onClick={() => deemed.mutate(c.id as number)}>
                          Deemed supply
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
        <div className="space-y-3">
          <Panel title="Metal price book (latest)">
            {d?.price ? (
              <div className="grid grid-cols-3 gap-2 p-3 font-mono text-sm">
                <div>
                  <div className="text-micro text-muted">Cu</div>
                  {formatINR((d.price as { cu_paise_per_kg: number }).cu_paise_per_kg)}
                </div>
                <div>
                  <div className="text-micro text-muted">Zn</div>
                  {formatINR((d.price as { zn_paise_per_kg: number }).zn_paise_per_kg)}
                </div>
                <div>
                  <div className="text-micro text-muted">As of</div>
                  {String((d.price as { as_of_date: string }).as_of_date).slice(0, 10)}
                </div>
              </div>
            ) : (
              <p className="p-3 text-sm text-muted">No price book</p>
            )}
          </Panel>
          <Panel title="Alloy kg on hand">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Alloy</th>
                  <th>kg</th>
                </tr>
              </thead>
              <tbody>
                {(d?.alloys ?? []).map((a) => (
                  <tr key={a.code as string}>
                    <td className="font-mono">{a.code as string}</td>
                    <td className="tabular">{formatKg(a.kg)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
      <Panel title="Warehouse kg / pcs" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>kg</th>
              <th>pcs</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(d?.byWh ?? []).map((w) => (
              <tr key={w.code as string}>
                <td>
                  <span className="font-mono">{w.code as string}</span>
                  <span className="ml-2 text-muted">{w.name as string}</span>
                </td>
                <td className="tabular">{formatKg(w.kg)}</td>
                <td className="tabular">{n(w.pcs).toLocaleString("en-IN")}</td>
                <td>{w.is_outside_factory ? <Badge tone="HOLD">outside factory</Badge> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <p className="mt-3 text-sm text-muted">
        Walk the seeded books on the{" "}
        <Link to="/journeys" className="text-navy underline">
          10 journeys
        </Link>{" "}
        board — each step posts real stock. Last CLI pack:{" "}
        <Link to="/dev/journeys" className="text-navy underline">
          /dev/journeys
        </Link>
        .
      </p>
    </AppShell>
  );
}

function DocTable({ rows, empty, cols }: { rows: Row[]; empty: string; cols: Array<{ k: string; h: string; fmt?: (v: unknown) => string; href?: (r: Row) => { to: string; params?: Record<string, string> } | null }> }) {
  if (!rows.length) return <Empty>{empty}</Empty>;
  return (
    <table className="app-table">
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.k}>{c.h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={(r.id as number) ?? i}>
            {cols.map((c) => {
              const href = c.href?.(r);
              const text = c.fmt ? c.fmt(r[c.k]) : String(r[c.k] ?? "—");
              return (
                <td key={c.k} className="font-mono">
                  {href ? (
                    <a href={href.to.replace("$id", href.params?.id ?? "").replace("$lotId", href.params?.lotId ?? "")} className="underline">
                      {text}
                    </a>
                  ) : (
                    text
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OwnerCards({ owner }: { owner: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["owner"]> }) {
  return (
    <div className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Stat label="Booked 30d" value={formatINR(owner.bookedPaise)} hint="Open SO value" />
      <Stat label="Invoiced 30d" value={formatINR(owner.invoicedPaise)} />
      <Stat label="OTIF 30d" value={owner.otif == null ? "—" : `${owner.otif}%`} hint={owner.otifN ? `${owner.otifN} lines` : "No SO in window"} />
      <Stat label="Open AR" value={formatINR(owner.openArPaise)} />
      <Stat label="JW-OUT kg" value={`${formatKg(owner.jwKg)} kg`} />
      <Stat label="Inventory (ex JW-IN-CUSTOMER)" value={formatINR(owner.inventoryPaise)} />
      <Stat
        label="Latest yield"
        value={owner.yield ? n(owner.yield.variance).toFixed(3) : "—"}
        hint={owner.yield ? String(owner.yield.notes) : "No yield pack yet"}
      />
      <Stat label="JW loss ₹ (draft DN)" value={formatINR(owner.jwLossPaise)} />
      <Stat label="Kg in melt" value={`${formatKg(owner.meltKg)} kg`} hint="WIP-MELT" />
      <Stat
        label="7-day melt yield"
        value={owner.meltYield7dPct == null ? "—" : `${owner.meltYield7dPct.toFixed(1)}%`}
      />
      <Stat label="Spectro HOLD" value={String(owner.spectroHold)} warn={owner.spectroHold > 0} />
      {owner.aged270.length ? (
        <div className="sm:col-span-2">
          <Panel title="Challans >270d">
            <DocTable
              rows={owner.aged270}
              empty="No challans over 270 days"
              cols={[
                { k: "doc_no", h: "Challan", href: (r) => ({ to: "/print/challan/$id", params: { id: String(r.id) } }) },
                { k: "partner", h: "Vendor" },
                { k: "age_days", h: "Age" },
              ]}
            />
          </Panel>
        </div>
      ) : null}
    </div>
  );
}

function PpcCards({ ppc }: { ppc: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["ppc"]> }) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-2">
      <Panel title="Latest MRP shortages" actions={<Link to="/planning" className="text-sm text-navy underline">Planning</Link>}>
        {ppc.emptyMrp ? (
          <Empty>{ppc.emptyMrp}</Empty>
        ) : (
          <DocTable
            rows={ppc.shortages}
            empty="No shortages"
            cols={[
              { k: "sku", h: "SKU" },
              { k: "action", h: "Action" },
              { k: "shortfall_qty", h: "Short", fmt: (v) => String(v) },
            ]}
          />
        )}
      </Panel>
      <Panel title="WOs due this week" actions={<Link to="/wo" className="text-sm text-navy underline">WOs</Link>}>
        <DocTable
          rows={ppc.wosThisWeek}
          empty="No WOs due this week"
          cols={[
            { k: "doc_no", h: "WO" },
            { k: "sku", h: "SKU" },
            { k: "due_date", h: "Due", fmt: (v) => (v ? String(v).slice(0, 10) : "—") },
          ]}
        />
      </Panel>
      <Panel title="SO with no promise date" actions={<Link to="/so" className="text-sm text-navy underline">ATP</Link>}>
        <DocTable
          rows={ppc.noPromise}
          empty="All open SO have a promise date"
          cols={[
            { k: "doc_no", h: "SO" },
            { k: "sku", h: "SKU" },
          ]}
        />
      </Panel>
      <Panel title="Bottleneck %">
        <DocTable
          rows={ppc.bottleneck}
          empty="No work centres"
          cols={[
            { k: "code", h: "WC" },
            { k: "load_pct", h: "Load %", fmt: (v) => `${n(v).toFixed(1)}%` },
            { k: "queue_days", h: "Queue d" },
          ]}
        />
      </Panel>
      <Panel title="Foundry">
        <div className="grid grid-cols-2 gap-2 p-3 font-mono text-sm">
          <div>WIP-MELT {formatKg(ppc.meltKg)} kg</div>
          <div>Heats open {ppc.heatsOpen}</div>
          <div>Yield 7d {ppc.meltYield7dPct == null ? "—" : `${ppc.meltYield7dPct.toFixed(1)}%`}</div>
          <div>Spectro HOLD {ppc.spectroHold}</div>
        </div>
      </Panel>
    </div>
  );
}

function StoresCards({ stores }: { stores: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["stores"]> }) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-2">
      <Panel title="GRN pending QC" actions={<Link to="/qc" className="text-sm underline">QC</Link>}>
        {stores.emptyQc ? <Empty>{stores.emptyQc}</Empty> : <DocTable rows={stores.grnQc} empty={stores.emptyQc ?? ""} cols={[{ k: "doc_no", h: "QI" }, { k: "lot_no", h: "Lot" }, { k: "sku", h: "SKU" }]} />}
      </Panel>
      <Panel title="HOLD / QUARANTINE lots" actions={<Link to="/stock" className="text-sm underline">Lots</Link>}>
        {stores.emptyHold ? <Empty>{stores.emptyHold}</Empty> : <DocTable rows={stores.hold} empty={stores.emptyHold ?? ""} cols={[{ k: "lot_no", h: "Lot" }, { k: "sku", h: "SKU" }, { k: "warehouse", h: "Whs" }]} />}
      </Panel>
      <Panel title="Below min kg">
        <DocTable rows={stores.belowMin} empty="No RM below min" cols={[{ k: "sku", h: "SKU" }, { k: "kg", h: "On hand", fmt: (v) => formatKg(v) }, { k: "min_qty_kg", h: "Min", fmt: (v) => formatKg(v) }]} />
      </Panel>
      <Panel title="JW returns due">
        <DocTable rows={stores.jwDue} empty="No JW returns due" cols={[{ k: "doc_no", h: "Challan" }, { k: "partner", h: "Vendor" }, { k: "expected_return_at", h: "Due", fmt: (v) => String(v).slice(0, 10) }]} />
      </Panel>
    </div>
  );
}

function QcCards({ qc }: { qc: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["qc"]> }) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-2">
      <Panel title="QUARANTINE" actions={<Link to="/qc" className="text-sm underline">QC</Link>}>
        {qc.emptyQ ? <Empty>{qc.emptyQ}</Empty> : <DocTable rows={qc.quarantine} empty={qc.emptyQ ?? ""} cols={[{ k: "lot_no", h: "Lot" }, { k: "sku", h: "SKU" }, { k: "warehouse", h: "Whs" }]} />}
      </Panel>
      <Panel title="Open NCR" actions={<Link to="/ncr" className="text-sm underline">NCR</Link>}>
        {qc.emptyNcr ? <Empty>{qc.emptyNcr}</Empty> : <DocTable rows={qc.ncr} empty={qc.emptyNcr ?? ""} cols={[{ k: "doc_no", h: "NCR" }, { k: "description", h: "Desc" }]} />}
      </Panel>
    </div>
  );
}

function PurchaseCards({ purchase }: { purchase: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["purchase"]> }) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-2">
      <Panel title="CREATE_PO lines" actions={<Link to="/planning" className="text-sm underline">MRP</Link>}>
        {purchase.emptyPo ? <Empty>{purchase.emptyPo}</Empty> : <DocTable rows={purchase.createPo} empty={purchase.emptyPo ?? ""} cols={[{ k: "sku", h: "SKU" }, { k: "suggested_qty", h: "Qty", fmt: (v) => formatKg(v) }]} />}
      </Panel>
      <Panel title="Last GRN" actions={<Link to="/grn" className="text-sm underline">GRN</Link>}>
        <DocTable rows={purchase.lastGrn} empty="No GRN yet" cols={[{ k: "doc_no", h: "GRN" }, { k: "sku", h: "SKU" }, { k: "partner", h: "Vendor" }, { k: "net_kg", h: "kg", fmt: (v) => formatKg(v) }]} />
      </Panel>
    </div>
  );
}

function SalesCards({ sales }: { sales: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["sales"]> }) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-3">
      <Panel title="Quotes expiring 7d" actions={<Link to="/quotes" className="text-sm underline">Quotes</Link>}>
        {sales.emptyExp ? <Empty>{sales.emptyExp}</Empty> : <DocTable rows={sales.expiring} empty={sales.emptyExp ?? ""} cols={[{ k: "doc_no", h: "QTN" }, { k: "partner", h: "Customer" }, { k: "valid_until", h: "Until", fmt: (v) => String(v).slice(0, 10) }]} />}
      </Panel>
      <Panel title="Credit-blocked SO">
        {sales.emptyBlocked ? <Empty>{sales.emptyBlocked}</Empty> : <DocTable rows={sales.blocked} empty={sales.emptyBlocked ?? ""} cols={[{ k: "doc_no", h: "SO" }, { k: "partner", h: "Customer" }]} />}
      </Panel>
      <Panel title="Late SO" actions={<Link to="/so" className="text-sm underline">SO</Link>}>
        {sales.emptyLate ? <Empty>{sales.emptyLate}</Empty> : <DocTable rows={sales.late} empty={sales.emptyLate ?? ""} cols={[{ k: "doc_no", h: "SO" }, { k: "sku", h: "SKU" }, { k: "promise_date", h: "Promise", fmt: (v) => String(v).slice(0, 10) }]} />}
      </Panel>
    </div>
  );
}

function AccountsCards({ accounts }: { accounts: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["accounts"]> }) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-2">
      <Panel
        title="Unbilled FG receipts"
        actions={
          <Link to="/bills" className="text-sm underline">
            AR / AP
          </Link>
        }
      >
        {accounts.emptyUnbilled ? <Empty>{accounts.emptyUnbilled}</Empty> : <DocTable rows={accounts.unbilled} empty={accounts.emptyUnbilled ?? ""} cols={[{ k: "lot_no", h: "Lot" }, { k: "sku", h: "SKU" }, { k: "qty_pcs", h: "Pcs", fmt: (v) => formatPcs(v) }]} />}
      </Panel>
      <Panel
        title="Unmatched GRN"
        actions={
          <span className="space-x-2">
            <Link to="/books" className="text-sm underline">
              Books
            </Link>
            <Link to="/gst" className="text-sm underline">
              GST worksheets
            </Link>
          </span>
        }
      >
        <DocTable rows={accounts.unmatchedGrn} empty="No unmatched GRN" cols={[{ k: "doc_no", h: "GRN" }, { k: "partner", h: "Vendor" }]} />
      </Panel>
      <Panel title="Challans >270d">
        <DocTable
          rows={accounts.aged270}
          empty="No challans over 270 days"
          cols={[
            { k: "doc_no", h: "Challan", href: (r) => ({ to: "/print/challan/$id", params: { id: String(r.id) } }) },
            { k: "age_days", h: "Age" },
          ]}
        />
      </Panel>
      <Panel title="Draft debit notes">
        {accounts.emptyDn ? <Empty>{accounts.emptyDn}</Empty> : <DocTable rows={accounts.draftDn} empty={accounts.emptyDn ?? ""} cols={[{ k: "doc_no", h: "DN" }, { k: "original_invoice_no", h: "Against" }, { k: "total_paise", h: "₹", fmt: (v) => formatINR(v) }]} />}
      </Panel>
    </div>
  );
}

function ShopCards({ shop }: { shop: NonNullable<Awaited<ReturnType<typeof getRoleBoard>>["shop"]> }) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-2">
      <Panel title="My open WOs" actions={<Link to="/shop" className="text-sm underline">Shop</Link>}>
        {shop.emptyWo ? <Empty>{shop.emptyWo}</Empty> : <DocTable rows={shop.openWos} empty={shop.emptyWo ?? ""} cols={[{ k: "doc_no", h: "WO" }, { k: "sku", h: "SKU" }, { k: "qty_pcs", h: "Pcs", fmt: (v) => formatPcs(v) }]} />}
      </Panel>
      <Stat label="Yesterday scrap vs issued" value={`${formatKg(shop.yesterdayScrapKg)} kg`} hint={`issued ${formatKg(shop.yesterdayIssuedKg)} kg`} />
      {shop.openHeat?.length ? (
        <Panel title="Open heat" actions={<Link to="/foundry" className="text-sm underline">Foundry</Link>}>
          <DocTable
            rows={shop.openHeat}
            empty="No open heat"
            cols={[
              { k: "doc_no", h: "Heat" },
              { k: "alloy", h: "Alloy" },
              { k: "status", h: "Status" },
              { k: "charged_kg", h: "kg", fmt: (v) => formatKg(v) },
            ]}
          />
        </Panel>
      ) : null}
    </div>
  );
}
