/** Factory / export packing list. Net kg must equal invoice net kg (Δ ≤ 0.001 kg). */
import { formatDateIN } from "../gst/dates";
import { packingGenerateBlocked } from "../gst/validate";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { PartyBlock } from "./components/party-block";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import type { GstIssue } from "../gst/validate";
import type { PackingListDoc } from "./types";

export function PackingList({ doc }: { doc: PackingListDoc }) {
  const blocked = packingGenerateBlocked(doc.invoiceNetKg, doc.packingNetKg);
  const issues: GstIssue[] = blocked
    ? [
        {
          code: "WEIGHT",
          message: `Packing-list net kg ${doc.packingNetKg.toFixed(3)} ≠ invoice net kg ${doc.invoiceNetKg.toFixed(3)}.`,
          level: "block",
        },
      ]
    : [];
  const match = !blocked;

  return (
    <DocFrame citation="Packing list — factory / export practice" issues={issues}>
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
            <div>
              Invoice {doc.invoiceNo} dated {formatDateIN(doc.invoiceDate)}
            </div>
          </div>
        }
      />

      <section className="mt-2 grid grid-cols-2 gap-3">
        <PartyBlock label="Consignee" party={doc.consignee} />
        <div className="text-[10px]">
          <div>
            <span className="text-muted">Country of origin: </span>
            {doc.countryOfOrigin}
          </div>
          <div>
            <span className="text-muted">Carton marks: </span>
            {doc.cartonMarks}
          </div>
          <div>
            <span className="text-muted">Cartons: </span>
            {doc.cartons.length}
          </div>
        </div>
      </section>

      <table className="doc-table mt-2">
        <thead>
          <tr>
            <th>Carton</th>
            <th>Description</th>
            <th>Lot / heat</th>
            <th>Qty NOS</th>
            <th>Net kg</th>
            <th>Gross kg</th>
          </tr>
        </thead>
        <tbody>
          {doc.cartons.map((c) => (
            <tr key={c.cartonNo}>
              <td className="font-mono">{c.cartonNo}</td>
              <td>{c.description}</td>
              <td className="font-mono">{c.lotHeat}</td>
              <td className="tabular">{formatPcs(c.qtyNos)}</td>
              <td className="tabular">{formatKg(c.netKg)}</td>
              <td className="tabular">{formatKg(c.grossKg)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} className="font-semibold">
              Total
            </td>
            <td className="tabular font-semibold">
              {formatPcs(doc.cartons.reduce((s, c) => s + c.qtyNos, 0))}
            </td>
            <td className="tabular font-semibold">{formatKg(doc.packingNetKg)}</td>
            <td className="tabular font-semibold">{formatKg(doc.packingGrossKg)}</td>
          </tr>
        </tbody>
      </table>

      <p className={`mt-3 text-[11px] font-bold ${match ? "" : "uppercase"}`}>
        Net weight on this packing list equals net weight on Invoice {doc.invoiceNo}: {formatKg(doc.packingNetKg)} kg
        = {formatKg(doc.invoiceNetKg)} kg — {match ? "MATCH" : "MISMATCH — DO NOT GENERATE"}.
      </p>

      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
