import { createFileRoute } from "@tanstack/react-router";
import { getChallanDoc } from "@/lib/erp/api-gst";
import { DeliveryChallan } from "@/modules/compliance/documents/delivery-challan";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/challan/$id")({ component: ChallanPrint });

function ChallanPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["chdoc", id],
    queryFn: () => getChallanDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading job-work challan…</p>;
  return <DeliveryChallan doc={q.data} />;
}
