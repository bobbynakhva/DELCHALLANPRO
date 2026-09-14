import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel, linesOf } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { listMasters, listOpenDocs, getBootstrap } from "@/lib/erp/api";
import { createQuote, postMetalPrice } from "@/lib/erp/api-sales";
import { previewQuote } from "@/lib/erp/api-planning";
import { formatINR, n, todayISO } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/quotes")({ component: QuotesPage });

function QuotesPage() {
  const qc = useQueryClient();
  const masters = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const boot = useQuery({ queryKey: ["bootstrap"], queryFn: () => getBootstrap() });
  const hideMargin = boot.data?.staff.role === "SHOP";
  const latest = masters.data?.prices[0];
  const customers = (masters.data?.partners ?? []).filter((p) => p.is_customer);
  const fgs = (masters.data?.items ?? []).filter((i) => i.type === "FG");
  const [cu, setCu] = useState("");
  const [zn, setZn] = useState("");
  const [scrap, setScrap] = useState("");
  const [source, setSource] = useState<"MCX" | "dealer" | "manual">("manual");
  const [partnerId, setPartnerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [qty, setQty] = useState("10000");
  const [asOf, setAsOf] = useState(todayISO());
  const [basis, setBasis] = useState<"CU_ZN_BLEND" | "ALLOY_DEALER_RATE">("CU_ZN_BLEND");
  const [marginPct, setMarginPct] = useState("3.9");

  const defItem = fgs.find((i) => i.sku === "HEX-NIPPLE-1/2-NCR")?.id;
  const resolvedItem = Number(itemId || defItem || 0);

  const preview = useQuery({
    queryKey: ["preview-quote", resolvedItem, asOf, basis, marginPct],
    queryFn: () =>
      previewQuote({
        data: { itemId: resolvedItem, asOf, basis, marginPct: n(marginPct) },
      }),
    enabled: resolvedItem > 0,
  });

  const instruments = useMemo(() => {
    const date = latest ? String(latest.as_of_date).slice(0, 10) : "";
    return (masters.data?.priceLines ?? []).filter((l) => String(l.as_of_date).slice(0, 10) === date);
  }, [masters.data, latest]);

  const priceMut = useMutation({
    mutationFn: () =>
      postMetalPrice({
        data: {
          asOfDate: todayISO(),
          cuPaisePerKg: Math.round(n(cu || n(latest?.cu_paise_per_kg) / 100 + 20) * 100),
          znPaisePerKg: Math.round(n(zn || n(latest?.zn_paise_per_kg) / 100) * 100),
          pbPaisePerKg: n(latest?.pb_paise_per_kg),
          scrapPaisePerKg: Math.round(n(scrap || 410) * 100),
          source,
        },
      }),
    onSuccess: () => {
      toast.success("Price book posted — SENT quotes stay frozen");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const qmut = useMutation({
    mutationFn: () =>
      createQuote({
        data: {
          partnerId: Number(partnerId || customers.find((c) => c.code === "C-GS")?.id),
          itemId: resolvedItem,
          qtyPcs: n(qty),
          asOf,
          basis,
          marginPct: n(marginPct),
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `${r.docNo} frozen ${formatINR(r.unitPricePaise)} on ${r.snapshot.metal_rate_date} — SENT`,
      );
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const snap = preview.data;
  const firstQuote = [...(docs.data?.quotes ?? [])].sort((a, b) => n(a.id) - n(b.id))[0];

  return (
    <AppShell>
      <PageHeader kicker="Sales / accounts" title="Quotations — freeze metal rates">
        <span className="text-sm text-muted">Not a tax invoice. SENT snapshot never rewrites.</span>
      </PageHeader>
      <div className="grid gap-3 lg:grid-cols-2">
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            priceMut.mutate();
          }}
        >
          <h2 className="text-sm font-semibold text-navy">Metal book — instruments ₹/kg</h2>
          <p className="text-micro text-muted">
            Live {latest ? `Cu ${formatINR(latest.cu_paise_per_kg)} · Zn ${formatINR(latest.zn_paise_per_kg)} as of ${String(latest.as_of_date).slice(0, 10)}` : "—"}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="Cu ₹/kg (CU_INR_KG)">
              <Input
                value={cu}
                placeholder={latest ? String(n(latest.cu_paise_per_kg) / 100 + 20) : "870"}
                onChange={(e) => setCu(e.target.value)}
              />
            </Field>
            <Field label="Zn ₹/kg (ZN_INR_KG)">
              <Input
                value={zn}
                placeholder={latest ? String(n(latest.zn_paise_per_kg) / 100) : "272"}
                onChange={(e) => setZn(e.target.value)}
              />
            </Field>
            <Field label="Scrap ₹/kg (BRASS_SCRAP_C360_KG)">
              <Input value={scrap} placeholder="410" onChange={(e) => setScrap(e.target.value)} />
            </Field>
            <Field label="Source">
              <Select value={source} onChange={(e) => setSource(e.target.value as "MCX" | "dealer" | "manual")}>
                <option value="manual">manual</option>
                <option value="MCX">MCX</option>
                <option value="dealer">dealer</option>
              </Select>
            </Field>
          </div>
          {instruments.length ? (
            <p className="font-mono text-micro text-muted">
              {instruments.map((i) => `${i.instrument} ${formatINR(i.rate_paise_per_kg)}`).join(" · ")}
            </p>
          ) : null}
          <Button type="submit" variant="navy" className="w-full" disabled={priceMut.isPending}>
            Post new metal rate
          </Button>
        </form>
        <form
          className="space-y-2 rounded-md border border-line bg-paper p-3"
          onSubmit={(e) => {
            e.preventDefault();
            qmut.mutate();
          }}
        >
          <h2 className="text-sm font-semibold text-navy">Live formula — then freeze</h2>
          <Field label="Customer">
            <Select value={partnerId || String(customers.find((c) => c.code === "C-GS")?.id ?? "")} onChange={(e) => setPartnerId(e.target.value)}>
              {customers.map((p) => (
                <option key={p.id as number} value={p.id as number}>
                  {p.name as string}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Item">
            <Select value={itemId || String(defItem ?? "")} onChange={(e) => setItemId(e.target.value)}>
              {fgs.map((i) => (
                <option key={i.id as number} value={i.id as number}>
                  {i.sku as string}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Qty pcs">
              <Input value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
            <Field label="Metal rate date (≤ today)">
              <Input type="date" value={asOf} max={todayISO()} onChange={(e) => setAsOf(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quote metal basis">
              <Select value={basis} onChange={(e) => setBasis(e.target.value as "CU_ZN_BLEND" | "ALLOY_DEALER_RATE")}>
                <option value="CU_ZN_BLEND">CU_ZN_BLEND (alloy chemistry)</option>
                <option value="ALLOY_DEALER_RATE">ALLOY_DEALER_RATE (scrap)</option>
              </Select>
            </Field>
            {hideMargin ? null : (
              <Field label="Margin %">
                <Input value={marginPct} onChange={(e) => setMarginPct(e.target.value)} />
              </Field>
            )}
          </div>
          {preview.isError ? (
            <p className="text-sm text-danger">{(preview.error as Error).message}</p>
          ) : snap ? (
            <div className="rounded-sm border border-line bg-cream px-2 py-2 font-mono text-micro text-navy" data-testid="quote-working">
              {(hideMargin ? snap.working.filter((w) => !/margin/i.test(w)) : snap.working).map((w) => (
                <div key={w}>{w}</div>
              ))}
              <div className="mt-1 font-semibold">
                {hideMargin ? "Unit price hidden for shop" : `Unit ex-GST ${formatINR(snap.unit_price_paise)}`}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Pick an item to see the live formula.</p>
          )}
          <Button type="submit" className="w-full" disabled={qmut.isPending}>
            Freeze rates & save
          </Button>
        </form>
      </div>
      {firstQuote && latest ? (
        <p className="mt-3 rounded-md border border-line bg-paper px-3 py-2 font-mono text-sm text-navy">
          Frozen quote {(firstQuote as { doc_no: string }).doc_no} Cu {formatINR(firstQuote.cu_paise_per_kg)} vs live {formatINR(latest.cu_paise_per_kg)}
          {n(firstQuote.cu_paise_per_kg) !== n(latest.cu_paise_per_kg) ? " — SENT snapshot unchanged" : ""}
        </p>
      ) : null}
      <Panel title="Quote register (frozen Cu never rewrites)" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Doc</th>
              <th>Status</th>
              <th>Customer</th>
              <th>Rate date</th>
              <th>Cu snapshot</th>
              <th>Item</th>
              {hideMargin ? null : (
                <>
                  <th>Metal</th>
                  <th>Unit</th>
                </>
              )}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(docs.data?.quotes ?? []).map((q) => {
              const ln = linesOf<{ sku: string; metal_paise: number; unit_price_paise: number }>(q.lines)[0];
              return (
                <tr key={q.id as number}>
                  <td className="font-mono">{q.doc_no as string}</td>
                  <td className="font-mono">{q.status as string}</td>
                  <td>{q.partner_name as string}</td>
                  <td className="tabular">{String(q.metal_rate_date).slice(0, 10)}</td>
                  <td className="tabular">{formatINR(q.cu_paise_per_kg)}</td>
                  <td className="font-mono">{ln?.sku}</td>
                  {hideMargin ? null : (
                    <>
                      <td className="tabular">{formatINR(ln?.metal_paise)}</td>
                      <td className="tabular font-medium">{formatINR(ln?.unit_price_paise)}</td>
                    </>
                  )}
                  <td>
                    <Link to="/print/quote/$id" params={{ id: String(q.id) }} className="text-sm text-navy underline">
                      Print
                    </Link>
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
