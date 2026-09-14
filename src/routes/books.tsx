import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getTrialBalance, listJournals, listPeriods, setPeriodStatus } from "@/lib/erp/api-finance";
import { formatINR } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/books")({ component: BooksPage });

function BooksPage() {
  const qc = useQueryClient();
  const tb = useQuery({ queryKey: ["tb"], queryFn: () => getTrialBalance() });
  const jv = useQuery({ queryKey: ["journals"], queryFn: () => listJournals() });
  const periods = useQuery({ queryKey: ["periods"], queryFn: () => listPeriods() });
  const lock = useMutation({
    mutationFn: (p: { yearMonth: string; status: "OPEN" | "SOFT_CLOSE" | "LOCKED" }) => setPeriodStatus({ data: p }),
    onSuccess: (r) => {
      toast.success(`${r.yearMonth} → ${r.status}`);
      void qc.invalidateQueries({ queryKey: ["periods"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell>
      <PageHeader kicker="Accounts" title="Chart of accounts and journals">
        <span className="text-sm text-muted">
          {tb.data?.balanced ? "Trial balance in square" : "Trial balance out of square"}
        </span>
      </PageHeader>
      <Panel title="Trial balance (paise)">
        {!tb.data?.rows.length ? (
          <Empty>No journals yet</Empty>
        ) : (
          <table className="app-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Account</th>
                <th>Dr</th>
                <th>Cr</th>
              </tr>
            </thead>
            <tbody>
              {tb.data.rows.map((r) => (
                <tr key={r.code}>
                  <td className="font-mono">{r.code}</td>
                  <td>{r.name}</td>
                  <td className="tabular">{formatINR(r.debit)}</td>
                  <td className="tabular">{formatINR(r.credit)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="font-semibold">
                  Total
                </td>
                <td className="tabular font-semibold">{formatINR(tb.data.debit)}</td>
                <td className="tabular font-semibold">{formatINR(tb.data.credit)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </Panel>
      <Panel title="Period lock" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(periods.data ?? []).map((p) => (
              <tr key={String(p.year_month)}>
                <td className="font-mono">{String(p.year_month)}</td>
                <td>{String(p.status)}</td>
                <td className="space-x-1">
                  {(["OPEN", "SOFT_CLOSE", "LOCKED"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant="ghost"
                      disabled={lock.isPending}
                      onClick={() => lock.mutate({ yearMonth: String(p.year_month), status: s })}
                    >
                      {s}
                    </Button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="Recent journals" className="mt-3">
        <table className="app-table">
          <thead>
            <tr>
              <th>JV</th>
              <th>Date</th>
              <th>Narration</th>
            </tr>
          </thead>
          <tbody>
            {(jv.data?.headers ?? []).map((h) => (
              <tr key={h.id as number}>
                <td className="font-mono">{h.doc_no as string}</td>
                <td>{String(h.jv_date).slice(0, 10)}</td>
                <td>{h.narration as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
