/** Factory GRN / weighment slip. Gross − tare = net kg to 3 decimals. */
import { formatDateIN } from "../gst/dates";
import { formatKg } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { PartyBlock } from "./components/party-block";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import type { GstIssue } from "../gst/validate";
import type { GrnSlipDoc } from "./types";

export function GrnSlip({ doc }: { doc: GrnSlipDoc }) {
  const recomputed = Math.round((doc.grossKg - doc.tareKg) * 1000) / 1000;
  const issues: GstIssue[] =
    Math.abs(recomputed - doc.netKg) > 0.001
      ? [
          {
            code: "WEIGH",
            message: `Gross ${doc.grossKg.toFixed(3)} − tare ${doc.tareKg.toFixed(3)} = ${recomputed.toFixed(3)} ≠ net ${doc.netKg.toFixed(3)}.`,
            level: "block",
          },
        ]
      : [];

  return (
    <DocFrame citation="GRN / weighment slip" issues={issues}>
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
            <div className="mt-1 font-semibold">{doc.qcStatus}</div>
          </div>
        }
      />

      <section className="mt-2 grid grid-cols-2 gap-3">
        <PartyBlock label="Vendor" party={doc.vendor} />
        <div className="text-[10px]">
          <div>
            <span className="text-muted">Vehicle: </span>
            {doc.vehicleNo}
          </div>
          <div>
            <span className="text-muted">Alloy: </span>
            {doc.alloy}
          </div>
          <div>
            <span className="text-muted">SKU: </span>
            <span className="font-mono">{doc.sku}</span>
          </div>
          <div>
            <span className="text-muted">Heat: </span>
            <span className="font-mono">{doc.heatNo}</span>
          </div>
        </div>
      </section>

      <table className="doc-table mt-3">
        <thead>
          <tr>
            <th>Gross kg</th>
            <th>Tare kg</th>
            <th>Net kg (gross − tare)</th>
            <th>QC</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="tabular font-mono text-[12px]">{formatKg(doc.grossKg)}</td>
            <td className="tabular font-mono text-[12px]">{formatKg(doc.tareKg)}</td>
            <td className="tabular font-mono text-[12px] font-bold">{formatKg(doc.netKg)}</td>
            <td className="font-semibold">{doc.qcStatus}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-[10px]">
        Weighment to 3 decimal kg. Lot lands QUARANTINE until QC {doc.qcStatus === "RELEASED" ? "released" : "holds"} it.
      </p>
      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
