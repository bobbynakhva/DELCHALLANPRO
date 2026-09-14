import { createFileRoute, Link } from "@tanstack/react-router";
import { DOC_INDEX } from "@/modules/compliance/documents/gallery";

export const Route = createFileRoute("/dev/docs/")({ component: DocsIndex });

function DocsIndex() {
  return (
    <div className="min-h-screen bg-cream px-4 py-6 text-ink">
      <div className="mx-auto max-w-3xl">
        <p className="text-micro font-semibold uppercase tracking-[0.14em] text-brass-deep">
          GST documents — seeded examples
        </p>
        <h1 className="font-display text-2xl font-semibold text-navy">Print previews (A4)</h1>
        <p className="mt-1 text-sm text-muted">
          One fixture each. Print / Save PDF from the document. Live books (when posted) print from the
          invoice, challan, GRN and quote screens.
        </p>
        <ul className="mt-4 divide-y divide-line rounded-md border border-line bg-paper">
          {DOC_INDEX.map((d) => (
            <li key={d.slug}>
              <Link
                to="/dev/docs/$slug"
                params={{ slug: d.slug }}
                className="flex items-baseline justify-between gap-3 px-3 py-2 hover:bg-cream"
              >
                <span className="text-sm text-navy">{d.title}</span>
                <span className="text-micro text-muted">{d.law}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
