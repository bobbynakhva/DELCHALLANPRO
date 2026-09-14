import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { listArAp, postReceipt, postVendorBill } from "@/lib/erp/api-finance";
import { formatINR, formatKg, n } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/bills")({ component: BillsPage });

function BillsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["arap"], queryFn: () => listArAp() });
  const bill = useMutation({
    mutationFn: (grnId: number) => postVendorBill({ data: { grnId } }),
    onSuccess: (r) => {
      toast.success(`${r.docNo} · ${formatKg(r.qty)} kg`);
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
      <PageHeader kicker="Accounts" title="AR / AP — 3-way bills and FIFO receipts" />
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
              <tr key={g.id as number}>
                <td className="font-mono">{g.doc_no as string}</td>
                <td>{g.partner as string}</td>
                <td className="tabular">{formatKg(g.net_kg)}</td>
                <td>
                  {g.billed ? (
                    "Billed"
                  ) : (
                    <Button size="sm" disabled={bill.isPending} onClick={() => bill.mutate(g.id as number)}>
                      3-way bill
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
                <th>Vendor</th>
                <th>Due</th>
                <th>Age</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {q.data!.bills.map((b) => (
                <tr key={b.id as number}>
                  <td className="font-mono">{b.doc_no as string}</td>
                  <td>
                    {b.partner_name as string}
                    {b.is_msme ? " · MSME" : ""}
                  </td>
                  <td>{String(b.due_date).slice(0, 10)}</td>
                  <td className="font-mono">{b.age_band as string}</td>
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
