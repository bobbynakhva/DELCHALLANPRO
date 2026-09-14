import { createFileRoute } from "@tanstack/react-router";
import { getPourDoc } from "@/lib/erp/api-foundry";
import { PourSlip } from "@/modules/compliance/documents/pour-slip";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/pour/$id")({ component: PourPrint });

function PourPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["pourdoc", id],
    queryFn: () => getPourDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading pour slip…</p>;
  return <PourSlip doc={q.data} />;
}
