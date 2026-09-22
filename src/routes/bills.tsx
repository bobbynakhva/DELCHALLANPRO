import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listArAp, postReceipt } from "@/lib/erp/api-finance";
import { postVendorBillEnhanced } from "@/lib/erp/api-bills";
import { formatINR, formatKg, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/bills")({ component: BillsPage });

function BillsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["arap"], queryFn: () => listArAp() });
  
  const [selectedGrnId, setSelectedGrnId] = useState<number | null>(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState("");
  const [gstPct, setGstPct] = useState("18");
  const [finalDiscPct, setFinalDiscPct] = useState("0");

  const selectedGrn = q.data?.grns?.find((g) => g.id === selectedGrnId);

  const bill = useMutation({
    mutationFn: () => postVendorBillEnhanced({ 
      data: { 
        grnId: selectedGrnId!,
        vendorInvoiceNo: vendorInvoiceNo || undefined,
        gstPct: Number(gstPct),
        finalDiscPct: Number(finalDiscPct),
      } 
    }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} · ${formatKg(r.qty)} kg`);
      setShowBillForm(false);
      setSelectedGrnId(null);
      setVendorInvoiceNo("");
      setGstPct("18");
      setFinalDiscPct("0");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rct = useMutation({
    mutationFn: (p: { partnerId: number; amountPaise: number; invoiceId: number }) => postReceipt({ data: p }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} allocated ${formatINR(r.applied)}`);
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Accounts" title="AR / AP · 3-way bills and FIFO receipts" />
      
      {showBillForm && selectedGrn && (
        <Panel title="Enter Vendor Bill" className="mb-3 border-primary/50">
          <form 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              bill.mutate();
            }}
          >
            <Field label="GRN No.">
              <Input value={selectedGrn.doc_no as string} readOnly className="bg-muted" />
            </Field>
            <Field label="Vendor">
              <Input value={selectedGrn.partner as string} readOnly className="bg-muted" />
            </Field>
            <Field label="Vendor Invoice No.">
              <Input 
                value={vendorInvoiceNo} 
                onChange={(e) => setVendorInvoiceNo(e.target.value)} 
                placeholder="Optional" 
              />
            </Field>
            <Field label="GST %">
              <Input 
                type="number" 
                min="0" max="28" 
                value={gstPct} 
                onChange={(e) => setGstPct(e.target.value)} 
              />
            </Field>
            <Field label="Final Discount %">
              <Input 
                type="number" 
                min="0" max="100" 
                value={finalDiscPct} 
                onChange={(e) => setFinalDiscPct(e.target.value)} 
              />
            </Field>
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-4">
              <Button type="submit" disabled={bill.isPending}>
                Post Vendor Bill
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowBillForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Panel>
      )}

      <Panel title="Unbilled GRNs">
        <table className="app-table">
          <thead>
            <tr>
              <th>GRN</th>
              <th>Vendor</th>
              <th>Net kg</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.grns ?? []).map((g) => (
              <tr key={g.id as number} className={selectedGrnId === g.id ? "bg-muted/50" : ""}>
                <td className="font-mono">{g.doc_no as string}</td>
                <td>{g.partner as string}</td>
                <td className="tabular">{formatKg(g.net_kg)}</td>
                <td>
                  {g.billed ? (
                    "Billed"
                  ) : (
                    <Button 
                      size="sm" 
                      variant={selectedGrnId === g.id ? "primary" : "ghost"}
                      onClick={() => {
                        setSelectedGrnId(g.id as number);
                        setShowBillForm(true);
                      }}
                    >
                      Enter Bill
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Vendor bills (MSME due = bill + 45d)" className="mt-3">
        {(q.data?.bills ?? []).length ? (
          <table className="app-table">
            <thead>
              <tr>
                <th>Bill</th>
                <th>Vendor Invoice No.</th>
                <th>Vendor</th>
                <th>Due</th>
                <th>Age</th>
                <th>Disc%</th>
                <th>GST%</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {q.data!.bills.map((b) => (
                <tr key={b.id as number}>
                  <td className="font-mono">{b.doc_no as string}</td>
                  <td className="font-mono">{b.vendor_invoice_no as string || "-"}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {b.partner_name as string}
                      {b.is_msme && <Badge tone="info">MSME</Badge>}
                      {b.vendor_type && (
                        <Badge tone={b.vendor_type === "MANUFACTURER" ? "primary" : "neutral"}>
                          {b.vendor_type as string}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td>{String(b.due_date).slice(0, 10)}</td>
                  <td className="font-mono">{b.age_band as string}</td>
                  <td className="tabular">{b.final_disc_pct ? `${Number(b.final_disc_pct)}%` : "-"}</td>
                  <td className="tabular">{b.gst_pct_override != null ? `${Number(b.gst_pct_override)}%` : "18%"}</td>
                  <td className="tabular">{formatINR(b.total_paise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty>No vendor bills</Empty>
        )}
      </Panel>
      <Panel title="Open invoices (FIFO receipt)" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Received</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(q.data?.invoices ?? []).map((inv) => {
              const open = n(inv.total_paise) - n(inv.received_paise);
              return (
                <tr key={inv.id as number}>
                  <td className="font-mono">{inv.doc_no as string}</td>
                  <td>{inv.partner_name as string}</td>
                  <td className="tabular">{formatINR(inv.total_paise)}</td>
                  <td className="tabular">{formatINR(inv.received_paise)}</td>
                  <td>
                    {open > 0 && inv.status === "POSTED" ? (
                      <Button
                        size="sm"
                        disabled={rct.isPending}
                        onClick={() =>
                          rct.mutate({
                            partnerId: inv.partner_id as number,
                            amountPaise: open,
                            invoiceId: inv.id as number,
                          })
                        }
                      >
                        Receipt
                      </Button>
                    ) : (
                      "Cleared"
                    )}
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
