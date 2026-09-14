import { createFileRoute } from "@tanstack/react-router";
import { getOpeningConfirmation } from "@/lib/erp/api-cutover";
import { OpeningConfirmation } from "@/modules/compliance/documents/opening-confirmation";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/opening-jw/$id")({ component: OpeningJwPrint });

function OpeningJwPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["opening-jw", id],
    queryFn: () => getOpeningConfirmation({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading opening confirmation…</p>;
  return <OpeningConfirmation doc={q.data} />;
}
