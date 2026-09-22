import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { listMasters } from "@/lib/erp/api";
import { approveBom } from "@/lib/erp/api-sales";
import { formatINR, n } from "@/lib/erp/format";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { listItemStock, updateItemExt, createItem } from "@/lib/erp/api-masters";
import { updateItemMaster } from "@/lib/erp/api-finance";
import { Input, Select, Textarea, Field, Label } from "@/components/ui/input";
import { Search, Check, X, Pencil } from "lucide-react";

export const Route = createFileRoute("/masters")({ component: MastersPage });

const TABS = ["Items", "Alloys", "Warehouses", "Partners", "BOM", "Rates", "Tariffs"] as const;

function ItemsTab() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["items-stock"], queryFn: () => listItemStock() });
  const items = q.data ?? [];
  
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState<any>({
    sku: "", name: "", type: "RM", stockUom: "KG", hsn: "", drawingNo: "",
    category: "", rackNo: "", cgstPct: 9, sgstPct: 9, purchaseRateRs: "0", mrpRateRs: "0", minQty: 0
  });

  const upd = useMutation({
    mutationFn: updateItemExt,
    onSuccess: () => {
      toast.success("Item updated");
      setEditingId(null);
      void qc.invalidateQueries({ queryKey: ["items-stock"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cre = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      toast.success("Item created");
      setShowNew(false);
      void qc.invalidateQueries({ queryKey: ["items-stock"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = items.filter(i => {
    if (typeFilter !== "All" && i.type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!(i.sku as string)?.toLowerCase().includes(s) &&
          !(i.name as string)?.toLowerCase().includes(s) &&
          !(i.drawing_no as string)?.toLowerCase().includes(s) &&
          !(i.category as string)?.toLowerCase().includes(s)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted" />
          <Input 
            placeholder="Search SKU, name, drawing..." 
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {["All", "RM", "FG", "SFG", "SCRAP"].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`rounded-sm border px-3 py-1.5 text-sm ${typeFilter === t ? 'bg-navy text-cream border-navy' : 'bg-paper text-ink border-line'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowNew(!showNew)}>New Item</Button>
        </div>
      </div>

      {showNew && (
        <Panel className="bg-sand/30 p-4 border border-line">
          <h3 className="text-sm font-medium mb-4">Create New Item</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Field label="SKU">
              <Input value={newForm.sku} onChange={e => setNewForm({...newForm, sku: e.target.value})} />
            </Field>
            <Field label="Name">
              <Input value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} />
            </Field>
            <Field label="Type">
              <Select value={newForm.type} onChange={e => setNewForm({...newForm, type: e.target.value})}>
                {["RM", "FG", "SFG", "SCRAP", "TOOL", "CONSUMABLE"].map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
            </Field>
            <Field label="UOM">
              <Select value={newForm.stockUom} onChange={e => setNewForm({...newForm, stockUom: e.target.value})}>
                <option value="KG">KG</option>
                <option value="PCS">PCS</option>
              </Select>
            </Field>
            <Field label="Category">
              <Input value={newForm.category} onChange={e => setNewForm({...newForm, category: e.target.value})} />
            </Field>
            <Field label="Drawing No.">
              <Input value={newForm.drawingNo} onChange={e => setNewForm({...newForm, drawingNo: e.target.value})} />
            </Field>
            <Field label="Rack No.">
              <Input value={newForm.rackNo} onChange={e => setNewForm({...newForm, rackNo: e.target.value})} />
            </Field>
            <Field label="HSN">
              <Input value={newForm.hsn} onChange={e => setNewForm({...newForm, hsn: e.target.value})} />
            </Field>
            <Field label="Purchase Rate (₹)">
              <Input type="number" step="any" value={newForm.purchaseRateRs} onChange={e => setNewForm({...newForm, purchaseRateRs: e.target.value})} />
            </Field>
            <Field label="MRP Rate (₹)">
              <Input type="number" step="any" value={newForm.mrpRateRs} onChange={e => setNewForm({...newForm, mrpRateRs: e.target.value})} />
            </Field>
            <Field label="CGST %">
              <Input type="number" step="any" value={newForm.cgstPct} onChange={e => setNewForm({...newForm, cgstPct: parseFloat(e.target.value) || 0})} />
            </Field>
            <Field label="SGST %">
              <Input type="number" step="any" value={newForm.sgstPct} onChange={e => setNewForm({...newForm, sgstPct: parseFloat(e.target.value) || 0})} />
            </Field>
            <Field label="ROL (Min Qty)">
              <Input type="number" step="any" value={newForm.minQty} onChange={e => setNewForm({...newForm, minQty: parseFloat(e.target.value) || 0})} />
            </Field>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              cre.mutate({
                data: {
                  ...newForm,
                  mrpRatePaise: Math.round((parseFloat(newForm.mrpRateRs) || 0) * 100),
                  purchaseRatePaise: Math.round((parseFloat(newForm.purchaseRateRs) || 0) * 100),
                }
              })
            }}>Save New Item</Button>
            <Button variant="ghost" onClick={() => setShowNew(false)}>Cancel</Button>
          </div>
        </Panel>
      )}

      <Panel>
        <table className="app-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Drawing No.</th>
              <th>UOM</th>
              <th>Alloy</th>
              <th>CGST%</th>
              <th>SGST%</th>
              <th>Purch. ₹</th>
              <th>MRP ₹</th>
              <th>ROL Qty</th>
              <th>Rack No.</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id as number}>
                <td className="font-mono">{i.sku as string}</td>
                <td>{i.name as string}</td>
                <td>{(i.category as string) || "—"}</td>
                <td className="font-mono">{(i.drawing_no as string) || "—"}</td>
                <td>{i.stock_uom as string}</td>
                <td className="font-mono">{(i.alloy_code as string) || "—"}</td>
                <td className="tabular">{i.cgst_pct as number}</td>
                <td className="tabular">{i.sgst_pct as number}</td>
                <td className="tabular">{i.purchase_rate_paise ? formatINR(i.purchase_rate_paise as number) : '—'}</td>
                <td className="tabular">{i.mrp_rate_paise ? formatINR(i.mrp_rate_paise as number) : '—'}</td>
                <td className="tabular">{n(i.min_qty)}</td>
                <td>{(i.rack_no as string) || "—"}</td>
                <td>
                  {i.active !== false ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                </td>
                <td>
                  <button 
                    onClick={() => {
                      setEditingId(i.id as number);
                      setEditForm({
                        rackNo: (i.rack_no as string) || "",
                        category: (i.category as string) || "",
                        cgstPct: i.cgst_pct,
                        sgstPct: i.sgst_pct,
                        purchaseRateRs: ((i.purchase_rate_paise as number || 0) / 100).toString(),
                        mrpRateRs: ((i.mrp_rate_paise as number || 0) / 100).toString(),
                        minQty: i.min_qty,
                        active: i.active !== false
                      });
                    }}
                    className="p-1 hover:bg-black/5 rounded text-muted hover:text-ink"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {editingId && (
        <Panel className="bg-sand/30 p-4 border border-line">
          <h3 className="text-sm font-medium mb-4">Edit Item: {items.find(x => x.id === editingId)?.sku as string}</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Field label="SKU">
              <Input readOnly value={items.find(x => x.id === editingId)?.sku as string || ""} className="bg-black/5" />
            </Field>
            <Field label="Name">
              <Input readOnly value={items.find(x => x.id === editingId)?.name as string || ""} className="bg-black/5" />
            </Field>
            <Field label="Drawing No.">
              <Input readOnly value={items.find(x => x.id === editingId)?.drawing_no as string || ""} className="bg-black/5" />
            </Field>
            <Field label="Rack No.">
              <Input value={editForm.rackNo} onChange={e => setEditForm({...editForm, rackNo: e.target.value})} />
            </Field>
            <Field label="Category">
              <Input value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} />
            </Field>
            <Field label="CGST %">
              <Input type="number" step="any" value={editForm.cgstPct} onChange={e => setEditForm({...editForm, cgstPct: parseFloat(e.target.value) || 0})} />
            </Field>
            <Field label="SGST %">
              <Input type="number" step="any" value={editForm.sgstPct} onChange={e => setEditForm({...editForm, sgstPct: parseFloat(e.target.value) || 0})} />
            </Field>
            <Field label="Purchase Rate (₹)">
              <Input type="number" step="any" value={editForm.purchaseRateRs} onChange={e => setEditForm({...editForm, purchaseRateRs: e.target.value})} />
            </Field>
            <Field label="MRP Rate (₹)">
              <Input type="number" step="any" value={editForm.mrpRateRs} onChange={e => setEditForm({...editForm, mrpRateRs: e.target.value})} />
            </Field>
            <Field label="ROL Qty">
              <Input type="number" step="any" value={editForm.minQty} onChange={e => setEditForm({...editForm, minQty: parseFloat(e.target.value) || 0})} />
            </Field>
            <div className="flex items-center gap-2 mt-6">
              <input 
                type="checkbox" 
                id="active-check"
                checked={editForm.active} 
                onChange={e => setEditForm({...editForm, active: e.target.checked})} 
              />
              <Label className="mb-0" htmlFor="active-check">Active</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              upd.mutate({
                data: {
                  itemId: editingId,
                  rackNo: editForm.rackNo || undefined,
                  category: editForm.category || undefined,
                  cgstPct: editForm.cgstPct,
                  sgstPct: editForm.sgstPct,
                  purchaseRatePaise: Math.round((parseFloat(editForm.purchaseRateRs) || 0) * 100),
                  mrpRatePaise: Math.round((parseFloat(editForm.mrpRateRs) || 0) * 100),
                  minQty: editForm.minQty,
                  active: editForm.active
                }
              })
            }}>Save Changes</Button>
            <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

function MastersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Items");
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["masters"], queryFn: () => listMasters() });
  const m = q.data;
  const appr = useMutation({
    mutationFn: (bomId: number) => approveBom({ data: { bomId } }),
    onSuccess: () => {
      toast.success("BOM approved");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell>
      <PageHeader kicker="Masters" title="Items, alloys, warehouses, partners" />
      <div className="mb-3 flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={
              tab === t
                ? "rounded-sm bg-navy px-3 py-1.5 text-sm text-cream"
                : "rounded-sm border border-line bg-paper px-3 py-1.5 text-sm"
            }
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Items" ? (
        <ItemsTab />
      ) : null}
      {tab === "Alloys" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Cu %</th>
                <th>Zn %</th>
                <th>Pb %</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(m?.alloys ?? []).map((a) => (
                <tr key={a.id as number}>
                  <td className="font-mono">{a.code as string}</td>
                  <td>{a.name as string}</td>
                  <td className="tabular">{a.cu_pct as string}</td>
                  <td className="tabular">{a.zn_pct as string}</td>
                  <td className="tabular">{a.pb_pct as string}</td>
                  <td>{a.is_scrap ? <Badge>scrap family</Badge> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Warehouses" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Kind</th>
                <th>Outside</th>
                <th>Customer</th>
                <th>Valued</th>
              </tr>
            </thead>
            <tbody>
              {(m?.warehouses ?? []).map((w) => (
                <tr key={w.id as number}>
                  <td className="font-mono">{w.code as string}</td>
                  <td>{w.name as string}</td>
                  <td>{w.kind as string}</td>
                  <td>{w.is_outside_factory ? "yes" : ""}</td>
                  <td>{w.is_customer_owned ? "yes" : ""}</td>
                  <td>{w.valuation_eligible ? "yes" : "no"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Partners" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Flags</th>
                <th>GSTIN</th>
                <th>Place</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {(m?.partners ?? []).map((p) => (
                <tr key={p.id as number}>
                  <td className="font-mono">{p.code as string}</td>
                  <td>{p.name as string}</td>
                  <td className="space-x-1">
                    {p.is_customer ? <Badge>cust</Badge> : null}
                    {p.is_vendor ? <Badge>vend</Badge> : null}
                    {p.is_job_worker ? <Badge tone="HOLD">JW</Badge> : null}
                  </td>
                  <td className="font-mono">{(p.gstin as string) ?? "—"}</td>
                  <td>
                    {p.city as string}, {p.state as string}
                  </td>
                  <td className="tabular">{p.credit_limit_paise ? formatINR(p.credit_limit_paise) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "BOM" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>FG</th>
                <th>Rev</th>
                <th>Status</th>
                <th>Lines</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(m?.boms ?? []).map((b) => {
                const lines = (m?.bomLines ?? []).filter((l) => l.bom_id === b.id);
                return (
                  <tr key={b.id as number}>
                    <td className="font-mono">{b.sku as string}</td>
                    <td>{b.drawing_rev as string}</td>
                    <td>
                      <Badge tone={b.status as string}>{b.status as string}</Badge>
                    </td>
                    <td className="text-micro">
                      {lines.map((l) => (
                        <div key={l.id as number}>
                          {l.is_co_product ? "↗" : "↙"} {l.component_sku as string} {n(l.qty_per)} {l.qty_uom as string}
                        </div>
                      ))}
                    </td>
                    <td>
                      {b.status !== "APPROVED" ? (
                        <Button size="sm" onClick={() => appr.mutate(b.id as number)}>
                          Approve
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Rates" ? (
        <Panel>
          <table className="app-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Process</th>
                <th>Family</th>
                <th>₹/pc</th>
                <th>Loss norm</th>
              </tr>
            </thead>
            <tbody>
              {(m?.rates ?? []).map((r) => (
                <tr key={r.id as number}>
                  <td>{r.partner_name as string}</td>
                  <td className="font-mono">{r.process_code as string}</td>
                  <td>{r.item_family as string}</td>
                  <td className="tabular">{formatINR(r.rate_paise_per_pc)}</td>
                  <td className="tabular">{n(r.loss_norm_pct).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
      {tab === "Tariffs" ? (
        <Panel title="Own-shop process_tariff (PartnerProcessRate remains JW source of truth)">
          <table className="app-table">
            <thead>
              <tr>
                <th>Process</th>
                <th>Family</th>
                <th>₹/pc</th>
                <th>From</th>
              </tr>
            </thead>
            <tbody>
              {(m?.tariffs ?? []).map((t) => (
                <tr key={t.id as number}>
                  <td className="font-mono">{t.process_code as string}</td>
                  <td>{t.item_family as string}</td>
                  <td className="tabular">{formatINR(t.rate_paise_per_pc)}</td>
                  <td className="tabular">{String(t.effective_from).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : null}
    </AppShell>
  );
}
