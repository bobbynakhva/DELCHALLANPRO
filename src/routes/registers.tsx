import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader } from "@/components/data-table";
import { getRegistersData } from "@/lib/erp/api-gst";
import { FIX_REGISTERS, RegistersView } from "@/modules/compliance/documents/registers";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/registers")({ component: RegistersPage });

function RegistersPage() {
  const q = useQuery({ queryKey: ["gst-registers"], queryFn: () => getRegistersData() });
  const live = q.data;
  const empty =
    live && live.invoices.length === 0 && live.challans.length === 0 && live.notes.length === 0 && live.eways.length === 0;
  const data = !live || empty ? FIX_REGISTERS : live;

  return (
    <AppShell>
      <PageHeader kicker="Compliance" title="GST registers">
        <Link to="/dev/docs/$slug" params={{ slug: "registers" }} className="text-sm text-navy underline">
          Printable A4
        </Link>
      </PageHeader>
      <p className="mb-3 text-sm text-muted">
        Invoice serial-gap, GSTR-1 lite (B2B / CDNR / HSN Table 12), ITC-04 Tables 4 / 5A / 5B, e-way (Part B =
        validity start).{" "}
        {empty ? "No live rows yet — showing seeded worksheet. Post journeys, then refresh." : "Live books."}
      </p>
      <RegistersView data={data} />
    </AppShell>
  );
}
