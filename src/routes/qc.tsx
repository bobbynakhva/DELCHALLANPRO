import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listOpenDocs, releaseLot } from "@/lib/erp/api";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const Route = createFileRoute("/qc")({ component: QcPage });

function QcPage() {
  const qc = useQueryClient();
  const docs = useQuery({ queryKey: ["docs"], queryFn: () => listOpenDocs() });
  const mut = useMutation({
    mutationFn: (p: { inspectionId: number; result: "PASS" | "FAIL" }) => releaseLot({ data: p }),
    onSuccess: (r) => {
      toast.success(
        r.debitNoteNo
          ? `${r.lotNo} → ${r.status} · purchase DN draft ${r.debitNoteNo}`
          : `${r.lotNo} → ${r.status}`,
      );
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <AppShell>
      <PageHeader kicker="QC" title="Inspections — only QC releases lots" />
      <Panel>
        <table className="app-table">
          <thead>
            <tr>
              <th>QI</th>
              <th>Lot</th>
              <th>Item</th>
              <th>Whs</th>
              <th>kg</th>
              <th>pcs</th>
              <th>Lot status</th>
              <th>Result</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(docs.data?.qis ?? []).map((q) => (
              <tr key={q.id as number}>
                <td className="font-mono">{q.doc_no as string}</td>
                <td className="font-mono">{q.lot_no as string}</td>
                <td className="font-mono">{q.sku as string}</td>
                <td className="font-mono">{q.warehouse as string}</td>
                <td className="tabular">{formatKg(q.qty_kg)}</td>
                <td className="tabular">{formatPcs(q.qty_pcs)}</td>
                <td>
                  <Badge tone={q.lot_status as string}>{q.lot_status as string}</Badge>
                </td>
                <td>
                  <Badge tone={q.result as string}>{q.result as string}</Badge>
                </td>
                <td className="space-x-1">
                  {q.result === "PENDING" ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => mut.mutate({ inspectionId: q.id as number, result: "PASS" })}
                      >
                        Release
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => mut.mutate({ inspectionId: q.id as number, result: "FAIL" })}
                      >
                        Reject
                      </Button>
                    </>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppShell>
  );
}
