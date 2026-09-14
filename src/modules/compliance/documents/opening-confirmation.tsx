/** Opening JW confirmation. Must not look like a tax invoice or delivery challan. */
import { formatDateIN } from "../gst/dates";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { CopyWatermark } from "./components/copy-watermark";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import type { GstCompany } from "./types";

export type OpeningConfirmationDoc = {
  title: "OPENING CONFIRMATION";
  watermark: string;
  notTaxInvoice: true;
  docNo: string;
  originalChallanNo: string;
  originalChallanDate: string;
  statutoryDue: string;
  sku: string;
  qtyPcs: number;
  qtyKg: number;
  partnerName: string;
  processCode: string;
  company: GstCompany;
};

export function OpeningConfirmation({ doc }: { doc: OpeningConfirmationDoc }) {
  return (
    <DocFrame citation="Cutover opening — not a delivery challan · not a tax invoice">
      <div className="relative">
        <CopyWatermark text={doc.watermark} />
        <GstLetterhead
          company={doc.company}
          right={
            <div>
              <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
              <div className="font-mono text-[13px]">{doc.docNo}</div>
              <div className="mt-1 font-semibold text-navy">Not a tax invoice. No IRN.</div>
            </div>
          }
        />
        <p className="mt-3 rounded-sm border border-navy bg-cream px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy">
          {doc.watermark}
        </p>
        <table className="doc-table mt-3">
          <tbody>
            <tr>
              <th>Original challan</th>
              <td className="font-mono">{doc.originalChallanNo}</td>
            </tr>
            <tr>
              <th>Original challan date</th>
              <td>{formatDateIN(doc.originalChallanDate)}</td>
            </tr>
            <tr>
              <th>Statutory due (challan + 365)</th>
              <td>{formatDateIN(doc.statutoryDue)}</td>
            </tr>
            <tr>
              <th>Job worker</th>
              <td>{doc.partnerName}</td>
            </tr>
            <tr>
              <th>Process</th>
              <td className="font-mono">{doc.processCode}</td>
            </tr>
            <tr>
              <th>SKU</th>
              <td className="font-mono">{doc.sku}</td>
            </tr>
            <tr>
              <th>Qty</th>
              <td className="tabular">
                {formatPcs(doc.qtyPcs)} pcs · {formatKg(doc.qtyKg)} kg
              </td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-[10px]">
          Ageing uses the original challan date, not the import date. Metal sits in cutover JW-OUT — still our metal.
          This document is not a GST delivery challan (s.143 / Rules 45+55).
        </p>
        <SignatureBlock company={doc.company} />
        <DocFooter company={doc.company} />
      </div>
    </DocFrame>
  );
}
