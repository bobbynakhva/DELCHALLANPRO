import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listOnHand } from "@/lib/erp/api";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export const Route = createFileRoute("/qr-labels")({ component: QrLabelsPage });

function QrLabelsPage() {
  const lotsQ = useQuery({ queryKey: ["onhand"], queryFn: () => listOnHand() });
  const [search, setSearch] = useState("");

  const filteredLots = (lotsQ.data ?? []).filter((l) => {
    const s = search.toLowerCase();
    return (
      !search ||
      String(l.lot_no || "").toLowerCase().includes(s) ||
      String(l.sku || "").toLowerCase().includes(s) ||
      String(l.item_name || "").toLowerCase().includes(s)
    );
  });

  return (
    <AppShell>
      <PageHeader kicker="Shop Floor Hardware" title="Thermal Barcode & QR Code Sticker Generator">
        <span className="text-sm text-muted">Generate 2"×1" and 4"×2" thermal barcode/QR labels for Raw Material rods, Bins, and FG Boxes</span>
      </PageHeader>

      <div className="mb-3 max-w-md">
        <Input
          placeholder="Search by Lot No, SKU, or Description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Panel title="Stock Lots Ready for QR Label Printing">
        <table className="app-table">
          <thead>
            <tr>
              <th>Lot Number</th>
              <th>SKU / Part Code</th>
              <th>Alloy</th>
              <th>Warehouse</th>
              <th>Qty (Kg)</th>
              <th>Qty (Pcs)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredLots.map((r: any) => (
              <tr key={r.id as number}>
                <td className="font-mono text-brass-soft font-bold">{r.lot_no as string}</td>
                <td>
                  <div className="font-mono">{r.sku as string}</div>
                  <div className="text-micro text-muted">{r.item_name as string}</div>
                </td>
                <td className="font-mono">{r.alloy as string}</td>
                <td className="font-mono">{r.warehouse as string}</td>
                <td className="tabular">{formatKg(r.qty_kg)}</td>
                <td className="tabular">{formatPcs(r.qty_pcs)}</td>
                <td>
                  <Link
                    to="/print/qr/$lotId"
                    params={{ lotId: String(r.id) }}
                    className="inline-flex items-center rounded border border-brass/50 bg-brass/10 px-2 py-1 font-mono text-xs text-navy hover:bg-brass/20"
                  >
                    Print QR Sticker
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
