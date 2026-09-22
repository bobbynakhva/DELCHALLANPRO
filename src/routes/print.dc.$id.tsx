import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getDcInvoice } from "@/lib/erp/api-dc";
import { n, formatKg, formatINR } from "@/lib/erp/format";

export const Route = createFileRoute("/print/dc/$id")({
  component: PrintDcInvoice,
});

function PrintDcInvoice() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["dcInvoice", id],
    queryFn: () => getDcInvoice({ data: { id: Number(id) } }),
  });

  if (q.isLoading) return <div className="p-8">Loading...</div>;
  if (q.isError || !q.data) return <div className="p-8 text-red-500">Error loading document</div>;

  const doc = q.data as any;
  const company = doc.company as any;
  const lines = (doc.lines || []) as any[];

  return (
    <div className="mx-auto max-w-4xl p-8 bg-white text-black text-sm font-sans" style={{ minHeight: '297mm' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase mb-1">{company?.name || "TAMBA BRASS WORKS"}</h1>
        <p className="text-sm">{company?.address_line1 || "Plot 123, GIDC Phase II, Dared, Jamnagar, Gujarat 361004"}</p>
        <p className="text-sm font-semibold mt-1">GSTIN: {company?.gstin || "24AAAAA0000A1Z5"}</p>
        <h2 className="text-xl font-bold uppercase mt-4 underline">DELIVERY CHALLAN CUM TAX INVOICE</h2>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-2 border border-black mb-4">
        <div className="p-2 border-r border-black flex flex-col justify-between">
          <div>
            <div className="font-semibold text-xs text-gray-600 mb-1">Details of Receiver (Billed To):</div>
            <div className="font-bold">{doc.bill_to_name as string}</div>
            <div className="text-xs whitespace-pre-line">{doc.bill_to_address as string}</div>
            <div className="font-semibold text-xs mt-2">GSTIN: {doc.bill_to_gstin as string}</div>
          </div>
          <div className="mt-4 pt-2 border-t border-gray-300">
            <div className="font-semibold text-xs text-gray-600 mb-1">Details of Consignee (Shipped To):</div>
            <div className="font-bold">{doc.ship_to_name as string}</div>
            <div className="text-xs whitespace-pre-line">{doc.ship_to_address as string}</div>
            <div className="font-semibold text-xs mt-2">GSTIN: {doc.ship_to_gstin as string}</div>
          </div>
        </div>

        <div className="p-0">
          <table className="w-full h-full text-xs">
            <tbody>
              <tr>
                <td className="border-b border-r border-black p-1.5 font-semibold bg-gray-50 w-1/3">DC No.</td>
                <td className="border-b border-black p-1.5 font-bold">{doc.dc_no as string}</td>
              </tr>
              <tr>
                <td className="border-b border-r border-black p-1.5 font-semibold bg-gray-50">Invoice No.</td>
                <td className="border-b border-black p-1.5 font-bold">{doc.doc_no as string}</td>
              </tr>
              <tr>
                <td className="border-b border-r border-black p-1.5 font-semibold bg-gray-50">Date</td>
                <td className="border-b border-black p-1.5">{doc.dispatch_date ? new Date(doc.dispatch_date as string).toLocaleDateString() : ""}</td>
              </tr>
              <tr>
                <td className="border-b border-r border-black p-1.5 font-semibold bg-gray-50">Buyer's PO No.</td>
                <td className="border-b border-black p-1.5">{doc.customer_po_no as string || "—"}</td>
              </tr>
              <tr>
                <td className="border-b border-r border-black p-1.5 font-semibold bg-gray-50">Transporter</td>
                <td className="border-b border-black p-1.5">{doc.transporter_name as string || "—"}</td>
              </tr>
              <tr>
                <td className="border-b border-r border-black p-1.5 font-semibold bg-gray-50">LR / Doc No.</td>
                <td className="border-b border-black p-1.5">{doc.transport_doc_no as string || "—"}</td>
              </tr>
              <tr>
                <td className="border-b border-r border-black p-1.5 font-semibold bg-gray-50">Vehicle No.</td>
                <td className="border-b border-black p-1.5 font-mono">{doc.vehicle_no as string || "—"}</td>
              </tr>
              <tr>
                <td className="border-r border-black p-1.5 font-semibold bg-gray-50">Destination</td>
                <td className="p-1.5">{doc.dispatch_to as string || "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full border border-black text-xs mb-4">
        <thead>
          <tr className="bg-gray-100 border-b border-black">
            <th className="border-r border-black p-2 text-center w-10">Sr.</th>
            <th className="border-r border-black p-2 text-left">Description of Goods</th>
            <th className="border-r border-black p-2 text-center w-20">HSN</th>
            <th className="border-r border-black p-2 text-center w-24">Lot / Heat</th>
            <th className="border-r border-black p-2 text-right w-20">Qty (Pcs)</th>
            <th className="border-r border-black p-2 text-right w-20">Pkts</th>
            <th className="p-2 text-right w-24">Gross Wt (kg)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, idx) => (
            <tr key={line.id as number} className="border-b border-gray-300">
              <td className="border-r border-black p-2 text-center">{idx + 1}</td>
              <td className="border-r border-black p-2">
                <div className="font-bold">{line.sku as string}</div>
                <div className="text-gray-600">{line.item_name as string}</div>
              </td>
              <td className="border-r border-black p-2 text-center">{line.hsn as string}</td>
              <td className="border-r border-black p-2 text-center font-mono">
                {line.lot_no as string}<br/>
                <span className="text-gray-500">{line.heat_no as string}</span>
              </td>
              <td className="border-r border-black p-2 text-right tabular-nums">{line.qty_pcs as number}</td>
              <td className="border-r border-black p-2 text-right tabular-nums">
                {n(line.qty_per_pkt) > 0 ? (n(line.qty_pcs) / n(line.qty_per_pkt)).toFixed(0) : "—"}
              </td>
              <td className="p-2 text-right tabular-nums">{formatKg(line.gross_wt_kg)}</td>
            </tr>
          ))}
          {lines.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500">No items</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-black font-bold">
            <td colSpan={4} className="border-r border-black p-2 text-right">TOTAL</td>
            <td className="border-r border-black p-2 text-right tabular-nums">
              {lines.reduce((sum, l) => sum + n(l.qty_pcs), 0)}
            </td>
            <td className="border-r border-black p-2 text-right tabular-nums">
              —
            </td>
            <td className="p-2 text-right tabular-nums">
              {formatKg(lines.reduce((sum, l) => sum + n(l.gross_wt_kg), 0) || doc.gross_wt_kg)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Footer Terms & Signatures */}
      <div className="grid grid-cols-2 border border-black mt-8 text-xs h-32">
        <div className="p-2 border-r border-black">
          <div className="font-bold mb-1">Terms & Conditions:</div>
          <ul className="list-disc list-inside text-gray-700 leading-tight">
            <li>Subject to Jamnagar jurisdiction only.</li>
            <li>Goods once sold will not be taken back.</li>
            <li>Interest @ 18% p.a. will be charged if payment is delayed.</li>
          </ul>
        </div>
        <div className="relative">
          <div className="absolute top-2 right-2 text-right font-bold">
            For {company?.name || "TAMBA BRASS WORKS"}
          </div>
          <div className="absolute bottom-2 right-2 text-right">
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
}
