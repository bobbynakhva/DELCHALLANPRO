import { createFileRoute } from "@tanstack/react-router";
import { getHealthz } from "@/lib/erp/api-finance";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/healthz")({ component: HealthzPage });

function HealthzPage() {
  const q = useQuery({ queryKey: ["healthz"], queryFn: () => getHealthz() });
  return (
    <main className="min-h-screen bg-cream p-6 font-mono text-sm text-navy">
      <h1 className="font-display text-2xl">healthz</h1>
      <pre className="mt-3 rounded-md border border-line bg-paper p-3">{JSON.stringify(q.data ?? q.error ?? "…", null, 2)}</pre>
    </main>
  );
}
