import { createFileRoute } from "@tanstack/react-router";
import { getGrnDoc } from "@/lib/erp/api-gst";
import { GrnSlip } from "@/modules/compliance/documents/grn-slip";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/grn/$id")({ component: GrnPrint });

function GrnPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["grndoc", id],
    queryFn: () => getGrnDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading GRN…</p>;
  return <GrnSlip doc={q.data} />;
}
