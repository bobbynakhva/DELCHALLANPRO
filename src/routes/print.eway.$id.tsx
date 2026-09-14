import { createFileRoute } from "@tanstack/react-router";
import { getEwayDoc } from "@/lib/erp/api-gst";
import { EwayForm } from "@/modules/compliance/documents/eway";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/eway/$id")({ component: EwayPrint });

function EwayPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["ewbdoc", id],
    queryFn: () => getEwayDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading e-way…</p>;
  return <EwayForm doc={q.data} />;
}
