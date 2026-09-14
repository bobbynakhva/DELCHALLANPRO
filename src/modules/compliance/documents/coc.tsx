/** Certificate of conformance — factory QA. Not a BIS / ISI / NABL licence document. */
import { formatDateIN } from "../gst/dates";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { PartyBlock } from "./components/party-block";
import { DocFooter } from "./components/signature-block";
import type { CocDoc } from "./types";

export function CertificateOfConformance({ doc }: { doc: CocDoc }) {
  return (
    <DocFrame citation="Certificate of conformance — not BIS / NABL">
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
          </div>
        }
      />

      <section className="mt-2 grid grid-cols-2 gap-3">
        <PartyBlock label="Customer" party={doc.customer} />
        <div className="text-[10px]">
          <div>
            <span className="text-muted">SKU: </span>
            <span className="font-mono">{doc.sku}</span>
          </div>
          <div>{doc.description}</div>
        </div>
      </section>

      <table className="doc-table mt-3">
        <tbody>
          <tr>
            <th className="text-left">Alloy specification</th>
            <td>{doc.alloySpec}</td>
          </tr>
          <tr>
            <th className="text-left">Drawing</th>
            <td className="font-mono">
              {doc.drawingNo} rev {doc.drawingRev}
            </td>
          </tr>
          <tr>
            <th className="text-left">Lot</th>
            <td className="font-mono">{doc.lotNo}</td>
          </tr>
          <tr>
            <th className="text-left">Heat</th>
            <td className="font-mono">{doc.heatNo}</td>
          </tr>
          <tr>
            <th className="text-left">Quantity</th>
            <td>
              {formatPcs(doc.qtyNos)} NOS · {formatKg(doc.qtyKgs)} KGS
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-3 text-[10px]">
        We certify that the goods described above conform to the alloy specification and drawing revision stated,
        and were produced from the lot / heat identified.
      </p>

      <div className="mt-8 text-right text-[10px]">
        <div>QA signatory</div>
        <div className="mt-8 font-semibold">{doc.qaSignatory}</div>
        <div>{doc.company.legalName}</div>
      </div>

      <p className="mt-6 border-t border-ink pt-1 text-[9px] font-semibold">
        This is not a NABL / BIS licence document.
      </p>
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
