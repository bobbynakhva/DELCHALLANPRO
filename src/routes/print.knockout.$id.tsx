import { createFileRoute } from "@tanstack/react-router";
import { getKnockoutDoc } from "@/lib/erp/api-foundry";
import { KnockoutSlip } from "@/modules/compliance/documents/knockout-slip";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/knockout/$id")({ component: KnockoutPrint });

function KnockoutPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["kodoc", id],
    queryFn: () => getKnockoutDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading knockout slip…</p>;
  return <KnockoutSlip doc={q.data} />;
}
