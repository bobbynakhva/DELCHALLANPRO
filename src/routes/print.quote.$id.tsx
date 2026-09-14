import { createFileRoute } from "@tanstack/react-router";
import { getQuoteDoc } from "@/lib/erp/api-gst";
import { QuotationDocView } from "@/modules/compliance/documents/quotation";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/quote/$id")({ component: QuotePrint });

function QuotePrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["qtdoc", id],
    queryFn: () => getQuoteDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading quotation…</p>;
  return <QuotationDocView doc={q.data} />;
}
