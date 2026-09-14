import { createFileRoute } from "@tanstack/react-router";
import { getCocDoc } from "@/lib/erp/api-gst";
import { CertificateOfConformance } from "@/modules/compliance/documents/coc";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/coc/$id")({ component: CocPrint });

function CocPrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["cocdoc", id],
    queryFn: () => getCocDoc({ data: { lotId: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading CoC…</p>;
  return <CertificateOfConformance doc={q.data} />;
}
