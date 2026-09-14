import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { Empty, PageHeader, Panel } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { listJourneyRuns } from "@/lib/erp/api-planning";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/dev/journeys")({ component: DevJourneys });

type Step = { n: number; title: string; pass: boolean; note?: string };

type FileReport = {
  runAt?: string;
  passed?: number;
  failed?: number;
  steps?: Step[];
};

function DevJourneys() {
  const q = useQuery({ queryKey: ["journey-runs"], queryFn: () => listJourneyRuns() });
  let file: FileReport | null = null;
  const raw = q.data && "reportJson" in q.data ? (q.data as { reportJson: string | null }).reportJson : null;
  if (raw) {
    try {
      file = JSON.parse(raw) as FileReport;
    } catch {
      file = null;
    }
  }
  const steps = file?.steps ?? [];
  return (
    <AppShell>
      <PageHeader kicker="Acceptance" title="Last journey pack">
        <span className="font-mono text-sm text-navy">
          {file ? `${file.passed ?? 0} PASS · ${file.failed ?? 0} FAIL` : "no pack on disk"}
        </span>
      </PageHeader>
      <p className="mb-3 text-sm text-muted">
        The CLI pack runs on a freshly seeded PGLite via posting.ts and writes{" "}
        <span className="font-mono">artifacts/journeys-last.json</span>. Live shop stock is a different
        process — walk it on{" "}
        <Link to="/journeys" className="text-navy underline">
          10 journeys
        </Link>
        .
      </p>
      {!file ? (
        <Empty>No planning run yet — no journey pack on disk</Empty>
      ) : (
        <Panel title={`Pack ${file.runAt ?? ""}`}>
          <ol>
            {steps.map((s) => (
              <li key={s.n} className="flex items-start gap-3 border-b border-line px-3 py-3 last:border-0">
                <Badge tone={s.pass ? "AVAILABLE" : "HOLD"}>{s.pass ? "PASS" : "FAIL"}</Badge>
                <div>
                  <div className="font-medium text-navy">
                    {s.n}. {s.title}
                  </div>
                  {s.note ? <div className="font-mono text-micro text-muted">{s.note}</div> : null}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </AppShell>
  );
}
