import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/shell";
import { PageHeader, Panel } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { getGstWorksheets } from "@/lib/erp/api-finance";
import { todayISO } from "@/lib/erp/format";
import { toCsv } from "@/modules/finance/gst-worksheets";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/gst")({ component: GstPage });

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function GstPage() {
  const q = useQuery({
    queryKey: ["gst-ws"],
    queryFn: () => getGstWorksheets({ data: { from: "2026-04-01", to: todayISO() } }),
  });
  const d = q.data;
  return (
    <AppShell>
      <PageHeader kicker="Compliance" title="GST worksheets">
        <span className="text-sm text-muted">{d?.watermark}</span>
      </PageHeader>
      <p className="mb-3 text-sm text-muted">
        No GSTN login. Dates IST. FY 1 Apr–31 Mar. ITC-04 period is {d?.itc04Period.label ?? "—"}.
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button disabled={!d} onClick={() => d && download("gstr-1.csv", d.gstr1)}>
          GSTR-1 CSV
        </Button>
        <Button disabled={!d} onClick={() => d && download("gstr-3b.csv", d.gstr3b)}>
          GSTR-3B CSV
        </Button>
        <Button disabled={!d} onClick={() => d && download("itc-04.csv", d.itc04)}>
          ITC-04 CSV
        </Button>
        <Button
          disabled={!d}
          onClick={() =>
            d &&
            download(
              "eway-register.csv",
              toCsv(
                ["Stub", "Doc", "Date", "Vehicle"],
                (d.eway ?? []).map((e) => [e.stub_no, e.doc_no, e.doc_date, e.vehicle]),
              ),
            )
          }
        >
          E-way stub CSV
        </Button>
      </div>
      <Panel title="Serial integrity (FY gaps in red)">
        <table className="app-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Prefix</th>
              <th>Issued</th>
              <th>Next</th>
              <th>Gaps</th>
            </tr>
          </thead>
          <tbody>
            {(d?.serial ?? []).map((s) => (
              <tr key={s.doc_type}>
                <td className="font-mono">{s.doc_type}</td>
                <td className="font-mono">{s.prefix}</td>
                <td className="tabular">{s.issued}</td>
                <td className="tabular">{s.next}</td>
                <td className={s.gaps.length ? "font-mono text-danger" : "font-mono"}>
                  {s.gaps.length ? s.gaps.join(", ") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="E-way stub register" className="mt-3">
        <pre className="overflow-auto p-3 font-mono text-micro">{JSON.stringify(d?.eway ?? [], null, 2)}</pre>
      </Panel>
    </AppShell>
  );
}
