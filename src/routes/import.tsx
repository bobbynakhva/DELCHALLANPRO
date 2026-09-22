import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { importItemsCsv, importStockLotsCsv } from "@/lib/erp/api-csv-import";

export const Route = createFileRoute("/import")({ component: ImportWizardPage });

function ImportWizardPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"ITEMS" | "LOTS">("ITEMS");
  const [csvText, setCsvText] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);

  const handleParse = (text: string) => {
    setCsvText(text);
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setParsedRows([]);
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.length === headers.length) {
        const rowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx];
        });
        rows.push(rowObj);
      }
    }
    setParsedRows(rows);
  };

  const importItems = useMutation({
    mutationFn: () => importItemsCsv({ data: { rows: parsedRows } }),
    onSuccess: (r) => {
      toast.success(`Successfully imported ${r.importedCount} items`);
      void qc.invalidateQueries();
      setCsvText("");
      setParsedRows([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const importLots = useMutation({
    mutationFn: () => importStockLotsCsv({ data: { rows: parsedRows } }),
    onSuccess: (r) => {
      toast.success(`Successfully imported ${r.importedCount} stock lots`);
      void qc.invalidateQueries();
      setCsvText("");
      setParsedRows([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const SAMPLE_ITEMS = `sku,name,type,hsn_code,drawing_no,rack_no,cgst_pct,sgst_pct,mrp_rate_paise,purchase_rate_paise,min_qty
HEX-NIPPLE-1/2,Hex Nipple 1/2 Inch,FG,8481,DRG-1001,RACK-A1,9,9,12000,6500,500
BUSH-3/4-1/2,Reducer Bush 3/4 to 1/2,FG,8481,DRG-1002,RACK-A2,9,9,15000,8000,300
ROD-BRASS-12MM,Brass Hex Rod 12mm,RM,7407,DRG-RM,RACK-B1,9,9,0,62000,1000`;

  const SAMPLE_LOTS = `lot_no,sku,warehouse_code,qty_kg,qty_pcs,unit_value_paise
LOT-26-001,ROD-BRASS-12MM,RM-MAIN,1250.5,0,62000
LOT-26-002,HEX-NIPPLE-1/2,FG-DOM,450.0,4500,8500`;

  return (
    <AppShell>
      <PageHeader kicker="System Onboarding" title="CSV / Excel Data Migration Wizard" />
      <p className="mb-3 text-sm text-muted">
        1-Click bulk migration wizard for plant setup. Copy/paste CSV data or download sample templates to populate items, BOMs, and opening stock.
      </p>

      <div className="mb-4 flex gap-2">
        <Button variant={mode === "ITEMS" ? "primary" : "ghost"} onClick={() => { setMode("ITEMS"); handleParse(SAMPLE_ITEMS); }}>
          Import Item Masters
        </Button>
        <Button variant={mode === "LOTS" ? "primary" : "ghost"} onClick={() => { setMode("LOTS"); handleParse(SAMPLE_LOTS); }}>
          Import Opening Stock Lots
        </Button>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <Panel title={`CSV Data Input (${mode})`}>
          <div className="p-3">
            <textarea
              className="w-full h-48 rounded border border-line bg-paper p-2 font-mono text-xs text-navy focus:outline-none focus:ring-1 focus:ring-brass"
              value={csvText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder="Paste CSV contents here..."
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-micro text-muted">{parsedRows.length} valid rows detected</span>
              <Button
                onClick={() => (mode === "ITEMS" ? importItems.mutate() : importLots.mutate())}
                disabled={parsedRows.length === 0 || importItems.isPending || importLots.isPending}
              >
                Start Bulk Migration
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Parsed Rows Preview">
          <div className="max-h-64 overflow-y-auto p-2">
            {parsedRows.length > 0 ? (
              <table className="app-table text-xs">
                <thead>
                  <tr>
                    {Object.keys(parsedRows[0] || {}).map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((r, i) => (
                    <tr key={i}>
                      {Object.values(r).map((v: any, idx) => (
                        <td key={idx} className="font-mono">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-4 text-center text-sm text-muted">Paste CSV data on the left to preview validation rows</div>
            )}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
