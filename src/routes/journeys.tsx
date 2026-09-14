import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { getJourneys } from "@/lib/erp/api";
import { useQuery } from "@tanstack/react-query";
import { Check, Circle } from "lucide-react";

export const Route = createFileRoute("/journeys")({ component: Journeys });

function Journeys() {
  const q = useQuery({ queryKey: ["journeys"], queryFn: () => getJourneys() });
  const steps = q.data?.steps ?? [];
  const done = steps.filter((s) => s.done).length;
  return (
    <AppShell>
      <PageHeader kicker="Acceptance" title="Journeys — the books must move">
        <span className="font-mono text-sm text-navy">{done} / 10 posted on this board</span>
      </PageHeader>
      <p className="mb-3 text-sm text-muted">
        Interactive 1–10 live here. CLI pack 1–32 (finance, IRP, foundry, cutover) at{" "}
        <Link to="/dev/journeys" className="text-navy underline">
          /dev/journeys
        </Link>
        .
      </p>
      <Panel>
        <ol>
          {steps.map((s) => (
            <li key={s.n} className="flex items-start gap-3 border-b border-line px-3 py-3 last:border-0">
              <span className={s.done ? "text-ok" : "text-muted"}>
                {s.done ? <Check className="size-4" /> : <Circle className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-medium text-navy">
                    {s.n}. {s.title}
                  </div>
                  <Link to={s.href} className="text-sm text-brass-deep hover:underline">
                    Open
                  </Link>
                </div>
                <div className="font-mono text-micro text-muted">{s.note}</div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>
      <div className="mt-3 max-w-3xl text-sm text-muted">
        Suggested path: GRN 1250.500 kg of C360 12 mm from Rajeshwar → QC release as QC → SO 10,000
        HEX-NIPPLE-1/2-NCR to Gujarat Sanitary → explode & WO → issue rod → shop booking 9820 / 80 /
        6.400 → JW OUT to Kiran → return 9700 / 80 / 40 → QC the FG lot → dispatch 5000 → change Cu
        and cut a new quote against the frozen June quote.
      </div>
    </AppShell>
  );
}
