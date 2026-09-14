import { createFileRoute } from "@tanstack/react-router";
import { getInvoiceDoc } from "@/lib/erp/api-gst";
import { BillOfSupply } from "@/modules/compliance/documents/bill-of-supply";
import { TaxInvoice } from "@/modules/compliance/documents/tax-invoice";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/invoice/$id")({ component: InvoicePrint });

function InvoicePrint() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["invdoc", id],
    queryFn: () => getInvoiceDoc({ data: { id: Number(id) } }),
  });
  if (q.isError) return <p className="p-8 text-danger">{(q.error as Error).message}</p>;
  if (!q.data) return <p className="p-8 text-muted">Loading tax invoice…</p>;
  const doc = q.data;
  if (doc.company.composition) {
    return (
      <BillOfSupply
        doc={{
          title: "BILL OF SUPPLY",
          docNo: doc.docNo,
          docDate: doc.docDate,
          company: doc.company,
          billTo: doc.billTo,
          lines: doc.lines.map((l) => ({
            sl: l.sl,
            description: l.description,
            hsn: l.hsn,
            qtyNos: l.qtyNos,
            qtyKgs: l.qtyKgs,
            amountPaise: l.taxablePaise,
          })),
          totalPaise: doc.taxablePaise,
        }}
      />
    );
  }
  return <TaxInvoice doc={doc} />;
}
