import { createFileRoute } from "@tanstack/react-router";
import { getExportShippingDoc } from "@/lib/erp/api-export";
import { formatINR, formatKg, formatPcs } from "@/lib/erp/format";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/print/shipping-bill/$id")({ component: PrintShippingBillPage });

function PrintShippingBillPage() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["shipping-bill", id],
    queryFn: () => getExportShippingDoc({ data: { dispatchId: Number(id) } }),
  });

  if (q.isLoading) return <div className="p-8 font-mono text-sm">Loading Shipping Bill…</div>;
  if (!q.data) return <div className="p-8 font-mono text-sm text-red-600">Export Document not found</div>;

  const doc = q.data as any;
  const curr = String(doc.currency || "USD");
  const exRate = Number(doc.exchange_rate || 83.5);

  return (
    <div className="mx-auto max-w-[210mm] bg-white p-8 text-black font-sans text-xs print:p-0">
      {/* Customs Header */}
      <div className="border-b-2 border-black pb-3 text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Indian Customs Export Declaration</div>
        <h1 className="font-serif text-xl font-bold uppercase tracking-wider">Shipping Bill for Export of Goods</h1>
        <p className="text-xs font-mono">IEC No: {String(doc.iec_code || "0312009876")} | AD Code: {String(doc.ad_code || "6390001")}</p>
      </div>

      {/* Grid metadata */}
      <div className="mt-4 grid grid-cols-2 gap-4 border border-black p-3">
        <div>
          <div className="font-bold">Exporter: <span className="font-semibold">{String(doc.company_name)}</span></div>
          <div>GSTIN: <span className="font-mono">{String(doc.company_gstin)}</span></div>
          <div>Exporter Ref / Invoice No: <span className="font-mono font-bold">{String(doc.doc_no)}</span></div>
          <div>Pre-Carriage By: <span className="font-medium">{String(doc.pre_carriage_by || "Road")}</span></div>
          <div>Place of Receipt: <span className="font-medium">{String(doc.place_of_receipt || "Jamnagar ICD")}</span></div>
        </div>
        <div className="text-right">
          <div>Port of Loading: <span className="font-bold">{String(doc.port_loading || "Mundra Port (INMUN1)")}</span></div>
          <div>Port of Discharge: <span className="font-bold">{String(doc.port_discharge || "Jebel Ali (AEJEA)")}</span></div>
          <div>Vessel / Flight No: <span className="font-mono font-semibold">{String(doc.vessel_flight_no || "MSC VALENCIA v.2401")}</span></div>
          <div>Final Destination: <span className="font-bold">{String(doc.final_destination || "UAE")}</span></div>
          <div>Currency / Ex Rate: <span className="font-mono font-bold">{curr} @ ₹{exRate}</span></div>
        </div>
      </div>

      {/* Foreign Buyer / Consignee */}
      <div className="mt-3 border border-black p-3">
        <div className="font-bold text-gray-700 uppercase text-[10px] tracking-wider mb-1">Consignee (Foreign Buyer)</div>
        <div className="font-bold text-sm">{String(doc.customer_name || "Al Brass FZE")}</div>
        <div className="whitespace-pre-line text-xs">{String(doc.customer_address || "PO Box 45000, Jebel Ali Free Zone, Dubai, UAE")}</div>
      </div>

      {/* Table */}
      <table className="mt-4 w-full border-collapse border border-black text-left text-xs">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-1.5 w-8 text-center">#</th>
            <th className="border border-black p-1.5">Description of Export Items</th>
            <th className="border border-black p-1.5 w-16 text-center">HSN Code</th>
            <th className="border border-black p-1.5 w-16 text-right">Qty (Pcs)</th>
            <th className="border border-black p-1.5 w-20 text-right">Net Wt (Kg)</th>
            <th className="border border-black p-1.5 w-20 text-right">Rate ({curr})</th>
            <th className="border border-black p-1.5 w-24 text-right">FOB Value ({curr})</th>
          </tr>
        </thead>
        <tbody>
          {(doc.lines || []).map((l: any, i: number) => {
            const fobVal = (Number(l.taxable_paise || 0) / 100) / exRate;
            return (
              <tr key={i}>
                <td className="border border-black p-1.5 text-center font-mono">{i + 1}</td>
                <td className="border border-black p-1.5">
                  <div className="font-bold">{String(l.sku || "Brass Precision Component")}</div>
                  <div className="text-[10px] text-gray-600">{String(l.item_name || "")}</div>
                </td>
                <td className="border border-black p-1.5 text-center font-mono">{String(l.hsn || "84819090")}</td>
                <td className="border border-black p-1.5 text-right font-mono">{formatPcs(l.qty_pcs)}</td>
                <td className="border border-black p-1.5 text-right font-mono">{formatKg(l.qty_kg)}</td>
                <td className="border border-black p-1.5 text-right font-mono">{curr} {(fobVal / Math.max(1, Number(l.qty_pcs))).toFixed(3)}</td>
                <td className="border border-black p-1.5 text-right font-mono">{curr} {fobVal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Customs Declaration & Signature */}
      <div className="mt-8 border-t border-black pt-4 grid grid-cols-2 gap-4">
        <div>
          <div className="font-bold uppercase text-[10px]">Customs Declaration (LUT)</div>
          <p className="text-[10px] leading-tight text-gray-600">
            Exported under Letter of Undertaking (LUT) without payment of integrated tax as per Section 16 of IGST Act.
            LUT Ref No: AD240326001234L.
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold">For {String(doc.company_name)}</div>
          <div className="h-12"></div>
          <div className="font-semibold text-xs border-t border-dashed border-gray-400 inline-block pt-1 px-4">Customs / Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
}
