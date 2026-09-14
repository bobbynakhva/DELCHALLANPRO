/** CGST Rule 49 bill of supply — composition / exempt. No tax columns. */
import { formatDateIN } from "../gst/dates";
import { displayHsn } from "../gst/tax";
import { validateDocSerial } from "../gst/serial";
import { formatInrGrouped } from "../gst/words";
import { formatKg, formatPcs } from "@/lib/erp/format";
import { AmountInWordsINR } from "./components/amount-in-words";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { PartyBlock } from "./components/party-block";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import type { GstIssue } from "../gst/validate";
import type { BillOfSupplyDoc } from "./types";

export function BillOfSupply({ doc }: { doc: BillOfSupplyDoc }) {
  const issues: GstIssue[] = [];
  const serial = validateDocSerial(doc.docNo);
  if (!serial.ok) issues.push({ code: "SERIAL", message: serial.error, level: "block" });
  if (!doc.company.composition) {
    issues.push({
      code: "COMPOSITION",
      message: "Bill of supply is only for composition / exempt supplies (Rule 49). Company is not marked composition.",
      level: "warn",
    });
  }
  const hsnDigits = doc.company.hsnDigits || 6;

  return (
    <DocFrame citation="CGST Rule 49 — bill of supply" issues={issues}>
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
            <div className="text-[9px]">Composition dealer — not a tax invoice</div>
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
          </div>
        }
      />

      <p className="mt-2 text-[10px] font-semibold">
        Composition taxable person. Tax is not collected on this document. No CGST / SGST / IGST columns.
      </p>

      <section className="mt-2">
        <PartyBlock label="Recipient" party={doc.billTo} />
      </section>

      <table className="doc-table mt-2">
        <thead>
          <tr>
            <th>Sl</th>
            <th>Description</th>
            <th>HSN</th>
            <th>Qty NOS</th>
            <th>Qty KGS</th>
            <th>Amount ₹</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((ln) => (
            <tr key={ln.sl}>
              <td className="tabular">{ln.sl}</td>
              <td>{ln.description}</td>
              <td className="font-mono">{displayHsn(ln.hsn, hsnDigits)}</td>
              <td className="tabular">{formatPcs(ln.qtyNos)}</td>
              <td className="tabular">{formatKg(ln.qtyKgs)}</td>
              <td className="tabular">{formatInrGrouped(ln.amountPaise)}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={5} className="font-semibold">
              Total
            </td>
            <td className="tabular font-semibold">{formatInrGrouped(doc.totalPaise)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-2">
        <AmountInWordsINR paise={doc.totalPaise} />
      </div>
      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
