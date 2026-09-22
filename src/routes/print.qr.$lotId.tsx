import { createFileRoute } from "@tanstack/react-router";
import { getLotLedger } from "@/lib/erp/api";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { useQuery } from "@tanstack/react-query";
import { renderSVG } from "uqr";

export const Route = createFileRoute("/print/qr/$lotId")({ component: PrintQrStickerPage });

function PrintQrStickerPage() {
  const { lotId } = Route.useParams();
  const q = useQuery({ queryKey: ["lot-qr", lotId], queryFn: () => getLotLedger({ data: { lotId: Number(lotId) } }) });

  if (q.isLoading) return <div className="p-4 font-mono text-xs">Loading QR Sticker…</div>;
  if (!q.data) return <div className="p-4 font-mono text-xs text-red-600">Lot not found</div>;

  const lot = (q.data.lot || {}) as any;
  const sku = q.data.sku || "";
  const itemName = q.data.itemName || "";
  const qrData = JSON.stringify({ lotNo: lot.lot_no, sku: lot.sku, alloy: lot.alloy });
  const qrSvg = renderSVG(qrData);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-200 print:bg-white print:p-0">
      {/* 4" x 2" Thermal Label Box */}
      <div className="w-[101.6mm] h-[50.8mm] border border-black bg-white p-3 shadow-md flex items-center justify-between font-sans text-black print:border-0 print:shadow-none">
        <div className="flex-1 pr-2">
          <div className="font-bold text-xs uppercase text-gray-700">Tamba Brass Works</div>
          <div className="font-mono text-base font-bold tracking-tight text-black">{String(lot.lot_no)}</div>
          <div className="mt-1 font-mono text-xs font-semibold">{String(lot.sku)}</div>
          <div className="text-[10px] text-gray-600 truncate">{String(lot.item_name || "")}</div>
          <div className="mt-2 grid grid-cols-2 text-[10px] font-mono border-t border-gray-300 pt-1">
            <div>Alloy: <span className="font-bold">{String(lot.alloy || "CW617N")}</span></div>
            <div>Heat: <span className="font-bold">{String(lot.heat_no || "H-102")}</span></div>
            <div>Net Kg: <span className="font-bold">{formatKg(lot.qty_kg)}</span></div>
            <div>Pcs: <span className="font-bold">{formatPcs(lot.qty_pcs)}</span></div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center border-l border-gray-300 pl-2">
          <div className="size-24" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="mt-1 font-mono text-[9px] font-bold">SCAN ME</div>
        </div>
      </div>
    </div>
  );
}
