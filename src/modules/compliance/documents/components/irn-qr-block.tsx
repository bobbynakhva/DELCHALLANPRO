/** Rule 46 — IRP QR is a particular of the tax invoice. Invoice number ≠ IRN. Never print QR on a slip. */
import { encode } from "uqr";

export function IrnQrBlock({
  payload,
  irn,
  ackNo,
  ackDt,
  label = "IRN QR (Rule 46)",
}: {
  payload: string;
  irn?: string | null;
  ackNo?: string | null;
  ackDt?: string | null;
  label?: string;
}) {
  const qr = encode(payload, { ecc: "M", border: 1 });
  const size = qr.size;
  const cells: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.data[y]?.[x]) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return (
    <div className="flex gap-2 border border-ink p-1.5">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={88}
        height={88}
        className="shrink-0 bg-white"
        role="img"
        aria-label={label}
      >
        <path d={cells.join("")} fill="#111" />
      </svg>
      <div className="min-w-0 text-[9px] leading-snug">
        <div className="font-semibold uppercase tracking-wide">{label}</div>
        <div className="break-all font-mono">
          IRN {irn ?? "— (not generated)"}
        </div>
        {ackNo ? (
          <div className="font-mono">
            Ack {ackNo} · {ackDt}
          </div>
        ) : null}
        <div className="mt-1 text-muted">Invoice number is not the IRN.</div>
      </div>
    </div>
  );
}

export function irnPayload(opts: {
  sellerGstin: string;
  buyerGstin: string;
  docNo: string;
  docTyp: string;
  docDt: string;
  totInvVal: number;
  itemCnt: number;
  mainHsn: string;
  irn: string;
}): string {
  return JSON.stringify({
    SellerGstin: opts.sellerGstin,
    BuyerGstin: opts.buyerGstin,
    DocNo: opts.docNo,
    DocTyp: opts.docTyp,
    DocDt: opts.docDt,
    TotInvVal: opts.totInvVal,
    ItemCnt: opts.itemCnt,
    MainHsnCode: opts.mainHsn,
    Irn: opts.irn,
  });
}
