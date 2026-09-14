/** CGST Act s.31 tax invoice · CGST Rule 46 particulars. IRP QR is a Rule 46 particular. */
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
import { INVOICE_COPIES, type ConversionInvoiceDoc, type TaxInvoiceDoc } from "./types";

export function TaxInvoice({
  doc,
  citation = "CGST Act s.31 · CGST Rule 46",
}: {
  doc: TaxInvoiceDoc | ConversionInvoiceDoc;
  citation?: string;
}) {
  const [copy, setCopy] = useState<string>(INVOICE_COPIES[0]);
  const service = "service" in doc && doc.service;
  const issues = invoicePrintIssues({
    docNo: doc.docNo,
    kind: doc.kind,
    buyerRegistered: Boolean(doc.billTo.registered),
    buyerGstin: doc.billTo.gstin,
    buyerUnregisteredValuePaise: doc.totalPaise,
    buyerName: doc.billTo.name,
    buyerStateCode: doc.billTo.stateCode,
    lines: doc.lines,
    invoiceNetKg: doc.netKg,
    packingNetKg: doc.packingNetKg,
  });
  const intra = doc.kind === "INTRA";
  const showIgst = doc.kind === "INTER" || doc.kind === "EXPORT_IGST" || doc.kind === "EXPORT_LUT";
  const hsnDigits = doc.company.hsnDigits || (doc.company.turnoverAbove5Cr ? 6 : 4);
  const rateRows = groupRates(doc);
  const irnJson = doc.signedQr || irnPayload({
    sellerGstin: doc.company.gstin ?? "",
    buyerGstin: doc.billTo.gstin ?? "URP",
    docNo: doc.docNo,
    docTyp: "INV",
    docDt: formatDateIN(doc.docDate),
    totInvVal: n(doc.totalPaise) / 100,
    itemCnt: doc.lines.length,
    mainHsn: displayHsn(doc.lines[0]?.hsn, hsnDigits),
    irn: doc.irn ?? "IRN-NOT-GENERATED",
  });
  const b2c = !doc.billTo.registered && doc.company.b2cQr && !doc.export;

  return (
    <DocFrame
      citation={citation}
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
            {service ? (
              <div className="text-[9px] font-semibold">Job-work / conversion service (SAC 9988)</div>
            ) : null}
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
            {doc.soNo ? <div>SO {doc.soNo}</div> : null}
            {doc.ewayNo ? <div>e-way {doc.ewayNo}</div> : null}
            <div className="mt-1 text-[8px] uppercase tracking-wide">{copy}</div>
          </div>
        }
      />

      {doc.company.einvoiceApplicable ? (
        <div className="mt-2">
          <IrnQrBlock
            payload={irnJson}
            irn={doc.irn}
            ackNo={doc.irnAckNo}
            ackDt={doc.irnAckDt ? formatDateIN(doc.irnAckDt) : null}
          />
        </div>
      ) : null}
      {b2c ? (
        <div className="mt-2">
          <IrnQrBlock
            payload={irnJson}
            irn={null}
            label="B2C Dynamic QR (Rule 46A)"
          />
        </div>
      ) : null}

      <section className="mt-2 grid grid-cols-2 gap-3">
        <PartyBlock label="Bill to (recipient)" party={doc.billTo} />
        <PartyBlock label="Ship to (delivery)" party={doc.shipTo} />
      </section>

      <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px]">
        <div>
          <span className="text-muted">Place of supply: </span>
          {doc.placeOfSupply}
        </div>
        <div>
          <span className="text-muted">Supply: </span>
          {supplyLabel(doc.kind)}
        </div>
        <div>
          <span className="text-muted">Vehicle: </span>
          {doc.vehicleNo ?? "—"}
        </div>
      </dl>

      {doc.reverseCharge || doc.rcm ? (
        <p className="mt-1 text-[11px] font-bold uppercase">Tax is payable on reverse charge basis.</p>
      ) : null}

      {service ? (
        <p className="mt-1 border border-ink px-2 py-1 text-[10px]">
          GST is charged on conversion charges only (SAC {("sac" in doc && doc.sac) || "9988"}). Customer-owned
          metal is not a supply of goods on this invoice and is not valued here.
        </p>
      ) : null}

      {doc.export ? <ExportBand exp={doc.export} /> : null}

      <table className="doc-table mt-2">
        <thead>
          <tr>
            <th>Sl</th>
            <th>Description</th>
            <th>HSN</th>
            <th>UQC</th>
            <th>Qty NOS</th>
            <th>Qty KGS</th>
            <th>Lot/heat</th>
            <th>Taxable ₹</th>
            <th>Discount ₹</th>
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
              <td>
                {ln.description}
                {ln.sac ? <div>SAC {ln.sac}</div> : null}
              </td>
              <td className="font-mono">{displayHsn(ln.hsn, hsnDigits) || "—"}</td>
              <td>{ln.uqc}</td>
              <td className="tabular">
                {formatPcs(ln.qtyNos)}
                {ln.provisional ? " *" : ""}
              </td>
              <td className="tabular">{ln.qtyKgs ? formatKg(ln.qtyKgs) : "—"}</td>
              <td className="font-mono">{ln.lotHeat ?? "—"}</td>
              <td className="tabular">{formatInrGrouped(ln.taxablePaise)}</td>
              <td className="tabular">{formatInrGrouped(ln.discountPaise)}</td>
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
        kind={doc.kind}
        rows={rateRows}
        taxablePaise={doc.taxablePaise}
        cgstPaise={doc.cgstPaise}
        sgstPaise={doc.sgstPaise}
        igstPaise={doc.igstPaise}
        roundOffPaise={doc.roundOffPaise}
        totalPaise={doc.totalPaise}
      />

      <div className="mt-2">
        <AmountInWordsINR paise={doc.totalPaise} />
      </div>

      {doc.msmeDueDate && doc.billTo.registered && doc.billTo.country === "IN" ? (
        <p className="mt-2 text-[10px]">
          Payment due date under the MSMED Act, 2006: <strong>{formatDateIN(doc.msmeDueDate)}</strong> (invoice
          date + {doc.company.msmeCreditDays} days).
        </p>
      ) : null}

      {doc.company.bankName ? (
        <p className="mt-1 text-[9px]">
          Bank: {doc.company.bankName} · A/c {doc.company.bankAccount} · IFSC {doc.company.bankIfsc}
        </p>
      ) : null}

      {doc.netKg ? (
        <p className="mt-1 text-[9px]">
          Invoice net weight {formatKg(doc.netKg)} kg
          {doc.packingNetKg != null ? ` · packing list net ${formatKg(doc.packingNetKg)} kg` : ""}.
        </p>
      ) : null}

      <p className="mt-2 text-[8px] text-muted">
        IRN cannot be cancelled after 24 hours of acknowledgement — use a credit / debit note (s.34).
      </p>

      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}

function supplyLabel(kind: TaxInvoiceDoc["kind"]): string {
  if (kind === "INTRA") return "Intra-state (CGST + SGST)";
  if (kind === "INTER") return "Inter-state (IGST)";
  if (kind === "EXPORT_LUT") return "Export of goods under LUT/Bond";
  return "Export of goods on payment of IGST";
}

function ExportBand({ exp }: { exp: NonNullable<TaxInvoiceDoc["export"]> }) {
  const sentence =
    exp.mode === "LUT"
      ? "Supply meant for export under LUT/Bond without payment of IGST"
      : "Supply meant for export on payment of IGST";
  return (
    <div className="mt-2 border-2 border-ink px-2 py-1.5 text-[10px]">
      <div className="font-bold uppercase">{sentence}.</div>
      <div className="mt-1 grid grid-cols-3 gap-x-3">
        <div>IEC {exp.iec}</div>
        <div>LUT ARN {exp.lutArn ?? "—"}</div>
        <div>
          Currency {exp.currency} · forex {exp.forexRate.toFixed(2)}
        </div>
        <div>Country {exp.country}</div>
        <div>Port {exp.port}</div>
        <div>Incoterm {exp.incoterm}</div>
        <div>INR taxable {formatInrGrouped(exp.inrTaxablePaise)}</div>
      </div>
      <div className="mt-1">No CGST/SGST on export of goods.</div>
    </div>
  );
}

function groupRates(doc: TaxInvoiceDoc) {
  const map = new Map<number, { rate: number; taxablePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number }>();
  for (const ln of doc.lines) {
    const cur = map.get(ln.gstPct) ?? {
      rate: ln.gstPct,
      taxablePaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
    };
    cur.taxablePaise += n(ln.taxablePaise) - n(ln.discountPaise);
    cur.cgstPaise += n(ln.cgstPaise);
    cur.sgstPaise += n(ln.sgstPaise);
    cur.igstPaise += n(ln.igstPaise);
    map.set(ln.gstPct, cur);
  }
  return [...map.values()];
}
