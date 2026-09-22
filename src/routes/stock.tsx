import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel, Empty } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listStockBrowser, getLotsByItem } from "@/lib/erp/api-browser";
import { formatINR, formatKg, n } from "@/lib/erp/format";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

export const Route = createFileRoute("/stock")({ component: StockBrowser });

function StockBrowser() {
  const q = useQuery({ queryKey: ["stockBrowser"], queryFn: () => listStockBrowser() });
  const [selectedCat, setSelectedCat] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL_ITEMS" | "IN_STOCK" | "ZERO_STOCK" | "REORDER_ALERT">("ALL_ITEMS");
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const items = q.data ?? [];

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    items.forEach((it) => {
      const type = String(it.type || "Other");
      cats.set(type, (cats.get(type) || 0) + 1);
    });
    return Array.from(cats.entries()).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (selectedCat !== "ALL" && it.type !== selectedCat) return false;
      if (filter === "IN_STOCK" && n(it.qty_kg) <= 0 && n(it.qty_pcs) <= 0) return false;
      if (filter === "ZERO_STOCK" && (n(it.qty_kg) > 0 || n(it.qty_pcs) > 0)) return false;
      if (filter === "REORDER_ALERT" && n(it.qty_kg) >= n(it.min_qty)) return false;
      
      if (search) {
        const qStr = search.toLowerCase();
        const match =
          String(it.code || "").toLowerCase().includes(qStr) ||
          String(it.name || "").toLowerCase().includes(qStr) ||
          String(it.hsn_code || "").toLowerCase().includes(qStr) ||
          String(it.rack_no || "").toLowerCase().includes(qStr);
        if (!match) return false;
      }
      return true;
    });
  }, [items, selectedCat, filter, search]);

  const stats = useMemo(() => {
    let skuCount = items.length;
    let inStockSkus = 0;
    let reorderAlerts = 0;
    let totalValuation = 0;
    items.forEach((it) => {
      const qty = n(it.qty_kg);
      if (qty > 0 || n(it.qty_pcs) > 0) inStockSkus++;
      if (qty < n(it.min_qty)) reorderAlerts++;
      totalValuation += qty * n(it.rate_paise);
    });
    return { skuCount, inStockSkus, reorderAlerts, totalValuation };
  }, [items]);

  const selectedItem = items.find((i) => i.id === selectedItemId);

  const lotQ = useQuery({
    queryKey: ["lots", selectedItemId],
    queryFn: () => getLotsByItem({ data: { itemId: selectedItemId! } }),
    enabled: !!selectedItemId,
  });

  return (
    <AppShell>
      <PageHeader kicker="Stores" title="Category Inventory Browser" />
      
      {/* Top Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <Panel className="p-4 flex flex-col justify-center">
          <div className="text-sm text-muted">Total SKU Count</div>
          <div className="text-2xl font-semibold">{stats.skuCount}</div>
        </Panel>
        <Panel className="p-4 flex flex-col justify-center">
          <div className="text-sm text-muted">In-Stock SKUs</div>
          <div className="text-2xl font-semibold">{stats.inStockSkus}</div>
        </Panel>
        <Panel className="p-4 flex flex-col justify-center">
          <div className="text-sm text-muted">Items Below ROL</div>
          <div className="text-2xl font-semibold text-red-600">{stats.reorderAlerts}</div>
        </Panel>
        <Panel className="p-4 flex flex-col justify-center">
          <div className="text-sm text-muted">Total Stock Valuation</div>
          <div className="text-2xl font-semibold">{formatINR(stats.totalValuation)}</div>
        </Panel>
      </div>

      {/* Filter Chips & Search */}
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
          {(["ALL_ITEMS", "IN_STOCK", "ZERO_STOCK", "REORDER_ALERT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm rounded-sm font-medium ${filter === f ? "bg-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            className="pl-9"
            placeholder="Search code, name, HSN, rack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* 3-Panel Layout */}
      <div className="flex gap-4 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Left Panel: Category Hierarchy */}
        <Panel className="w-64 overflow-y-auto p-4 flex flex-col gap-2">
          <div className="font-semibold mb-2">Categories</div>
          <button
            onClick={() => setSelectedCat("ALL")}
            className={`text-left px-2 py-1.5 rounded-md text-sm ${selectedCat === "ALL" ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"}`}
          >
            All Categories
            <span className="float-right text-gray-500">{items.length}</span>
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`text-left px-2 py-1.5 rounded-md text-sm ${selectedCat === cat ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-100"}`}
            >
              {cat}
              <span className="float-right text-gray-500">{count}</span>
            </button>
          ))}
        </Panel>

        {/* Middle Panel: Items Table */}
        <Panel className="flex-1 overflow-y-auto">
          <table className="app-table w-full">
            <thead className="sticky top-0 bg-white">
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Type</th>
                <th>Rack</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Rate/kg</th>
                <th className="text-right">Valuation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted">
                    No items found.
                  </td>
                </tr>
              )}
              {filteredItems.map((it) => {
                const qty = n(it.qty_kg);
                const rate = n(it.rate_paise);
                const isLow = qty < n(it.min_qty);
                const isSelected = it.id === selectedItemId;
                return (
                  <tr
                    key={it.id as number}
                    className={`cursor-pointer ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                    onClick={() => setSelectedItemId(it.id as number)}
                  >
                    <td className="font-mono text-sm">{it.code as string}</td>
                    <td className="text-sm font-medium">{it.name as string}</td>
                    <td className="text-sm">{it.type as string}</td>
                    <td className="text-sm text-gray-500">{it.rack_no as string || "—"}</td>
                    <td className="text-right tabular-nums">{formatKg(qty)}</td>
                    <td className="text-right tabular-nums text-gray-500">{formatINR(rate)}</td>
                    <td className="text-right tabular-nums">{formatINR(qty * rate)}</td>
                    <td>
                      {isLow ? (
                        <Badge tone="FAIL">LOW_STOCK</Badge>
                      ) : (
                        <Badge tone="PASS">NORMAL</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>

        {/* Right Panel: Lot Breakdown */}
        <Panel className="w-80 overflow-y-auto p-4">
          <div className="font-semibold mb-4">Lot Breakdown</div>
          {!selectedItem ? (
            <Empty>Select an item to view its lots</Empty>
          ) : lotQ.isLoading ? (
            <div className="text-sm text-muted">Loading lots...</div>
          ) : (lotQ.data ?? []).length === 0 ? (
            <div className="text-sm text-muted">No lots found for this item.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {(lotQ.data ?? []).map((lot) => (
                <div key={lot.id as number} className="border rounded-md p-3 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <div className="font-mono font-medium">{lot.lot_no as string}</div>
                    <Badge tone={lot.status as string}>{lot.status as string}</Badge>
                  </div>
                  <div className="text-gray-500 mb-2">{lot.warehouse_name as string}</div>
                  <div className="flex justify-between font-medium">
                    <span>{formatKg(n(lot.qty_kg))}</span>
                    <span>{formatINR(n(lot.qty_kg) * n(lot.unit_value_paise_per_kg))}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
