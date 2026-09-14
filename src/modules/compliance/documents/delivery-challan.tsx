/** CGST Act s.143 job work · Rules 45 + 55 delivery challan. Rule 55(2) copies. */
import { useState } from "react";
import { formatDateIN } from "../gst/dates";
import { displayHsn } from "../gst/tax";
import { validateDocSerial } from "../gst/serial";
import { formatInrGrouped } from "../gst/words";
import { formatKg, formatPcs, n } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { PartyBlock } from "./components/party-block";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import { CHALLAN_COPIES, type DeliveryChallanDoc } from "./types";
import type { GstIssue } from "../gst/validate";

export function DeliveryChallan({ doc }: { doc: DeliveryChallanDoc }) {
  const [copy, setCopy] = useState<string>(CHALLAN_COPIES[0]);
  const issues: GstIssue[] = [];
  const serial = validateDocSerial(doc.docNo);
  if (!serial.ok) issues.push({ code: "SERIAL", message: serial.error, level: "block" });
  for (const ln of doc.lines) {
    if (!String(ln.hsn ?? "").trim()) {
      issues.push({ code: "HSN", message: `HSN blank on line ${ln.sl}`, level: "block" });
    }
  }
  const isReturn = doc.variant === "JW_RETURN";
  const hsnDigits = doc.company.hsnDigits || 6;
  const due = formatDateIN(doc.statutoryDue);
  const goodsLabel =
    doc.goodsKind === "CAPITAL" ? "Capital goods" : doc.goodsKind === "SEMI" ? "Semi-finished goods" : "Inputs";

  return (
    <DocFrame
      citation="CGST Act s.143 · Rules 45 + 55"
      copies={CHALLAN_COPIES}
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
            <div className="mt-1 text-[9px]">Not a tax invoice. Not a supply.</div>
          </div>
        }
      />

      <p className="mt-2 text-[11px] font-bold">
        {isReturn
          ? "Return of goods from job worker to principal"
          : "Goods sent for job work without payment of tax under Section 143 of the CGST Act, 2017"}
      </p>

      <section className="mt-2 grid grid-cols-2 gap-3">
        <PartyBlock label="Consigner (principal)" party={doc.consigner} />
        <PartyBlock label="Consignee (job worker)" party={doc.consignee} />
      </section>

      <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-0.5 text-[10px]">
        <div>
          <span className="text-muted">Process: </span>
          {doc.processName}
        </div>
        <div>
          <span className="text-muted">Goods: </span>
          {goodsLabel}
        </div>
        <div>
          <span className="text-muted">Expected return: </span>
          {formatDateIN(doc.expectedReturn)}
        </div>
        <div>
          <span className="text-muted">Statutory due (s.143): </span>
          <strong>{due}</strong>
        </div>
        <div>
          <span className="text-muted">E-way reason: </span>3 Job Work
        </div>
        <div>
          <span className="text-muted">e-way: </span>
          {doc.ewayNo ?? "—"}
        </div>
        <div>
          <span className="text-muted">Vehicle: </span>
          {doc.vehicleNo ?? "—"}
        </div>
        {doc.interState ? (
          <div>
            <span className="text-muted">Place of supply: </span>
            {doc.placeOfSupply}
          </div>
        ) : (
          <div>
            <span className="text-muted">Place of supply: </span>
            {doc.placeOfSupply ?? "Intra-state"}
          </div>
        )}
        {isReturn ? (
          <div>
            <span className="text-muted">Original challan: </span>
            {doc.originalChallanNo} dated {formatDateIN(doc.originalChallanDate)}
          </div>
        ) : null}
      </dl>

      <p className="mt-2 border border-ink px-2 py-1 text-[10px]">
        Goods must be received back on or before <strong>{due}</strong> failing which the movement shall be treated
        as a deemed supply on the challan date (s.143). Inputs / semi-finished: 1 year. Capital goods: 3 years.
      </p>

      {isReturn ? <ReturnTable doc={doc} hsnDigits={hsnDigits} /> : <OutTable doc={doc} hsnDigits={hsnDigits} />}

      <p className="mt-2 text-[10px] font-semibold">
        GST not payable on this challan — not a supply.
      </p>
      <p className="text-[9px]">
        Taxable value (reference, not a supply) {formatInrGrouped(doc.taxablePaise)} · GST {n(doc.gstPct).toFixed(2)}%
        · tax amount (reference) {formatInrGrouped(doc.taxPaise)}.
      </p>

      {isReturn ? (
        <p className="mt-2 text-[9px]">
          s.143(5): waste and scrap generated during job work, if supplied from the job worker's premises, is
          invoiced by the job worker if registered, otherwise by the principal.
        </p>
      ) : null}

      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}

function OutTable({ doc, hsnDigits }: { doc: DeliveryChallanDoc; hsnDigits: number }) {
  return (
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
          <th>Taxable ₹ (ref.)</th>
          <th>Rate %</th>
          <th>Tax ₹ (ref.)</th>
        </tr>
      </thead>
      <tbody>
        {doc.lines.map((ln) => (
          <tr key={ln.sl}>
            <td className="tabular">{ln.sl}</td>
            <td>{ln.description}</td>
            <td className="font-mono">{displayHsn(ln.hsn, hsnDigits)}</td>
            <td>{ln.uqc}</td>
            <td className="tabular">
              {formatPcs(ln.qtyNos)}
              {ln.provisional ? " (Provisional)" : ""}
            </td>
            <td className="tabular">
              {formatKg(ln.qtyKgs)}
              {ln.provisional ? " (Provisional)" : ""}
            </td>
            <td className="font-mono">{ln.lotHeat ?? "—"}</td>
            <td className="tabular">{formatInrGrouped(ln.taxablePaise)}</td>
            <td className="tabular">{n(ln.gstPct).toFixed(2)}</td>
            <td className="tabular">{formatInrGrouped(n(ln.cgstPaise) + n(ln.sgstPaise) + n(ln.igstPaise) || doc.taxPaise)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReturnTable({ doc, hsnDigits }: { doc: DeliveryChallanDoc; hsnDigits: number }) {
  return (
    <table className="doc-table mt-2">
      <thead>
        <tr>
          <th>Sl</th>
          <th>Description</th>
          <th>HSN</th>
          <th>Sent NOS</th>
          <th>Sent KGS</th>
          <th>Good recd</th>
          <th>Reject</th>
          <th>Scrap returned</th>
          <th>Scrap kept by JW</th>
          <th>Loss</th>
          <th>Lot/heat</th>
        </tr>
      </thead>
      <tbody>
        {doc.lines.map((ln) => (
          <tr key={ln.sl}>
            <td className="tabular">{ln.sl}</td>
            <td>{ln.description}</td>
            <td className="font-mono">{displayHsn(ln.hsn, hsnDigits)}</td>
            <td className="tabular">{formatPcs(ln.sentNos ?? ln.qtyNos)}</td>
            <td className="tabular">{formatKg(ln.sentKgs ?? ln.qtyKgs)}</td>
            <td className="tabular">{formatPcs(ln.goodReceived ?? 0)}</td>
            <td className="tabular">{formatPcs(ln.reject ?? 0)}</td>
            <td className="tabular">{formatPcs(ln.scrapReturned ?? 0)}</td>
            <td className="tabular">{formatPcs(ln.scrapKeptByJw ?? 0)}</td>
            <td className="tabular">{formatPcs(ln.loss ?? 0)}</td>
            <td className="font-mono">{ln.lotHeat ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
