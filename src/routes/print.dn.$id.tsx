import { createFileRoute } from "@tanstack/react-router";
import { getNoteDoc } from "@/lib/erp/api-gst";
import { CreditDebitNote } from "@/modules/compliance/documents/credit-debit-note";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/dn/$id")({ component: NotePrint });

function NotePrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["notedoc", id],
    queryFn: () => getNoteDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading note…</p>;
  return <CreditDebitNote doc={q.data} />;
}
