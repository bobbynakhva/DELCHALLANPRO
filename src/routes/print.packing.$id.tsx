import { createFileRoute } from "@tanstack/react-router";
import { getPackingDoc } from "@/lib/erp/api-gst";
import { PackingList } from "@/modules/compliance/documents/packing-list";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/packing/$id")({ component: PackingPrint });

function PackingPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["pldoc", id],
    queryFn: () => getPackingDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading packing list…</p>;
  return <PackingList doc={q.data} />;
}
