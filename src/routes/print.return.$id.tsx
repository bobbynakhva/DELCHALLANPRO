import { createFileRoute } from "@tanstack/react-router";
import { getReturnDoc } from "@/lib/erp/api-gst";
import { DeliveryChallan } from "@/modules/compliance/documents/delivery-challan";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/return/$id")({ component: ReturnPrint });

function ReturnPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["retdoc", id],
    queryFn: () => getReturnDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading return challan…</p>;
  return <DeliveryChallan doc={q.data} />;
}
