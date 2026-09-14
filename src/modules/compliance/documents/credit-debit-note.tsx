/** CGST Act s.34 · Rule 53 credit / debit note. Must print original invoice no. + date. */
import { useState } from "react";
import { formatDateIN } from "../gst/dates";
import { displayHsn } from "../gst/tax";
import { invoicePrintIssues } from "../gst/validate";
import { formatInrGrouped } from "../gst/words";
import { formatKg, formatPcs, n } from "@/lib/erp/format";
import { AmountInWordsINR } from "./components/amount-in-words";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { IrnQrBlock, irnPayload } from "./components/irn-qr-block";
import { PartyBlock } from "./components/party-block";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import { TaxSummary } from "./components/tax-summary";
import { INVOICE_COPIES, type NoteDoc } from "./types";

export function CreditDebitNote({ doc }: { doc: NoteDoc }) {
  const [copy, setCopy] = useState<string>(INVOICE_COPIES[0]);
  const issues = invoicePrintIssues({
    docNo: doc.docNo,
    kind: doc.kindSupply,
    buyerRegistered: Boolean(doc.billTo.registered),
    buyerGstin: doc.billTo.gstin,
    lines: doc.lines,
  });
  const intra = doc.kindSupply === "INTRA";
  const showIgst = !intra;
  const hsnDigits = doc.company.hsnDigits || 6;
  const payload = doc.signedQr || irnPayload({
    sellerGstin: doc.company.gstin ?? "",
    buyerGstin: doc.billTo.gstin ?? "URP",
    docNo: doc.docNo,
    docTyp: doc.kind,
    docDt: formatDateIN(doc.docDate),
    totInvVal: n(doc.totalPaise) / 100,
    itemCnt: doc.lines.length,
    mainHsn: displayHsn(doc.lines[0]?.hsn, hsnDigits),
    irn: doc.irn ?? "IRN-NOT-GENERATED",
  });
  const rateRows = doc.lines.map((ln) => ({
    rate: ln.gstPct,
    taxablePaise: ln.taxablePaise,
    cgstPaise: ln.cgstPaise,
    sgstPaise: ln.sgstPaise,
    igstPaise: ln.igstPaise,
  }));

  return (
    <DocFrame
      citation="CGST Act s.34 · Rule 53"
      copies={INVOICE_COPIES}
      copy={copy}
      onCopy={setCopy}
      issues={issues}
    >
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
            <div className="mt-1 text-[8px] uppercase tracking-wide">{copy}</div>
          </div>
        }
      />

      {doc.company.einvoiceApplicable ? (
        <div className="mt-2">
          <IrnQrBlock payload={payload} irn={doc.irn} />
        </div>
      ) : null}

      <p className="mt-2 border border-ink px-2 py-1 text-[10px]">
        Against original tax invoice <strong className="font-mono">{doc.originalInvoiceNo}</strong> dated{" "}
        <strong>{formatDateIN(doc.originalInvoiceDate)}</strong>. Same tax head as the original invoice.
      </p>
      <p className="mt-1 text-[10px]">
        Reason: {doc.reason}
      </p>
      <p className="text-[9px] text-muted">
        An IRN cannot be cancelled after 24 hours of acknowledgement — use this {doc.kind === "CN" ? "credit" : "debit"}{" "}
        note.
      </p>

      <section className="mt-2 grid grid-cols-2 gap-3">
        <PartyBlock label="Recipient" party={doc.billTo} />
        <div className="text-[10px]">
          <div>
            <span className="text-muted">Place of supply: </span>
            {doc.placeOfSupply}
          </div>
          <div>
            <span className="text-muted">Tax head: </span>
            {intra ? "CGST + SGST (intra-state)" : "IGST (inter-state / export)"}
          </div>
        </div>
      </section>

      <table className="doc-table mt-2">
        <thead>
          <tr>
            <th>Sl</th>
            <th>Description</th>
            <th>HSN</th>
            <th>UQC</th>
            <th>Qty NOS</th>
            <th>Qty KGS</th>
            <th>Taxable ₹</th>
            <th>Rate %</th>
            {intra ? (
              <>
                <th>CGST ₹</th>
                <th>SGST ₹</th>
              </>
            ) : null}
            {showIgst ? <th>IGST ₹</th> : null}
            <th>Line total ₹</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((ln) => (
            <tr key={ln.sl}>
              <td className="tabular">{ln.sl}</td>
              <td>{ln.description}</td>
              <td className="font-mono">{displayHsn(ln.hsn, hsnDigits)}</td>
              <td>{ln.uqc}</td>
              <td className="tabular">{formatPcs(ln.qtyNos)}</td>
              <td className="tabular">{ln.qtyKgs ? formatKg(ln.qtyKgs) : "—"}</td>
              <td className="tabular">{formatInrGrouped(ln.taxablePaise)}</td>
              <td className="tabular">{n(ln.gstPct).toFixed(2)}</td>
              {intra ? (
                <>
                  <td className="tabular">{formatInrGrouped(ln.cgstPaise)}</td>
                  <td className="tabular">{formatInrGrouped(ln.sgstPaise)}</td>
                </>
              ) : null}
              {showIgst ? <td className="tabular">{formatInrGrouped(ln.igstPaise)}</td> : null}
              <td className="tabular">{formatInrGrouped(ln.lineTotalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <TaxSummary
        kind={doc.kindSupply}
        rows={rateRows}
        taxablePaise={doc.taxablePaise}
        cgstPaise={doc.cgstPaise}
        sgstPaise={doc.sgstPaise}
        igstPaise={doc.igstPaise}
        roundOffPaise={0}
        totalPaise={doc.totalPaise}
      />
      <div className="mt-2">
        <AmountInWordsINR paise={doc.totalPaise} />
      </div>
      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
