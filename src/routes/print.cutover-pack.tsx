import { createFileRoute } from "@tanstack/react-router";
import { getCutover } from "@/lib/erp/api-cutover";
import { CUTOVER_GATES } from "@/modules/cutover/checklist";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/cutover-pack")({ component: CutoverPackPrint });

function CutoverPackPrint() {
  const q = useQuery({ queryKey: ["cutover"], queryFn: () => getCutover() });
  const co = q.data?.company;
  const signs = q.data?.signoffs ?? [];
  return (
    <div className="bg-cream p-6 print:bg-white">
      <div className="no-print mb-3 flex gap-2">
        <button type="button" className="rounded-sm border border-line bg-paper px-3 py-1 text-sm" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <button type="button" className="rounded-sm border border-line px-3 py-1 text-sm" onClick={() => history.back()}>
          Back
        </button>
      </div>
      <h1 className="font-display text-2xl text-navy">Cutover pack — T–21 to T+10</h1>
      <p className="text-sm text-muted">
        {co ? `${co.code} · ${co.state}` : "CUTOVERDEMO"} · Tally is not the book of record.
      </p>
      {CUTOVER_GATES.map((g) => {
        const s = signs.find((x) => String(x.gate) === g.gate);
        return (
          <section key={g.gate} className="mt-4 border-b border-line pb-3">
            <h2 className="font-display text-lg text-navy">
              {g.when} {s?.signed_at ? `· signed ${String(s.signed_at).slice(0, 16)}` : "· unsigned"}
            </h2>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {g.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
            {s?.signed_by ? <p className="mt-1 font-mono text-xs">By {String(s.signed_by)}</p> : null}
          </section>
        );
      })}
    </div>
  );
}
