/** CGST Act s.68 goods in movement · Rule 138 Form GST EWB-01. No NIC API this slice. */
import { useState } from "react";
import { formatDateIN } from "../gst/dates";
import { formatInrGrouped } from "../gst/words";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { GstinLine } from "./components/gstin-line";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import { EWAY_REASONS, type EwayDoc } from "./types";

export function EwayForm({ doc }: { doc: EwayDoc }) {
  const [skip, setSkip] = useState(doc.partB.skippedVehicle);
  const sameStateShort = doc.partB.distanceKm <= 50;
  const belowThreshold = doc.partA.valuePaise < doc.company.ewayThresholdPaise;
  const forceJw = doc.partA.reasonCode === "3";

  return (
    <DocFrame citation="CGST Act s.68 · Rule 138 Form GST EWB-01">
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
            <div className="font-mono text-[13px]">{doc.stubNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
            <div className="mt-1 text-[9px] font-semibold">
              {doc.nicSigned ? "NIC-signed" : "STUB — not a NIC-signed e-way bill until submitted"}
            </div>
          </div>
        }
      />

      <p className="mt-2 text-[10px]">
        Threshold {formatInrGrouped(doc.company.ewayThresholdPaise)}
        {belowThreshold
          ? forceJw
            ? " — value is below threshold; generated because reason is Job Work (force allowed)."
            : " — value is below threshold."
          : "."}{" "}
        Validity of e-way bill starts from Part B, not Part A.
      </p>

      <h2 className="mt-3 text-[11px] font-bold uppercase tracking-wide">Part A</h2>
      <table className="doc-table">
        <tbody>
          <Kv k="A.1 Recipient GSTIN / URP" v={doc.partA.recipientGstin} />
          <Kv k="A.2 Delivery PIN" v={doc.partA.deliveryPin} />
          <Kv k="A.3 Document no." v={doc.partA.docNo} />
          <Kv k="A.4 Document date" v={formatDateIN(doc.partA.docDate)} />
          <Kv k="A.5 Value" v={formatInrGrouped(doc.partA.valuePaise)} />
          <Kv k="A.6 HSN" v={doc.partA.hsn} />
          <Kv
            k="A.7 Reason"
            v={`${doc.partA.reasonCode} ${doc.partA.reasonLabel || EWAY_REASONS[doc.partA.reasonCode] || ""}`}
          />
          <Kv k="Document type" v={doc.partA.documentType} />
          <Kv k="Bill-to GSTIN" v={doc.partA.billToGstin} />
          <Kv k="Ship-to GSTIN" v={doc.partA.shipToGstin} />
        </tbody>
      </table>
      <div className="mt-1 text-[10px]">
        Reasons:{" "}
        {Object.entries(EWAY_REASONS)
          .map(([c, l]) => `${c} ${l}`)
          .join(" / ")}
        .
      </div>

      <h2 className="mt-3 text-[11px] font-bold uppercase tracking-wide">Part B</h2>
      <table className="doc-table">
        <tbody>
          <Kv k="Vehicle" v={skip ? "— (skipped ≤ 50 km same State/UT)" : doc.partB.vehicle} />
          <Kv k="Mode" v={doc.partB.mode} />
          <Kv k="GR / RR / AWB / BL" v={doc.partB.transDoc || "—"} />
          <Kv k="Distance (km)" v={String(doc.partB.distanceKm)} />
          <Kv k="Valid from" v={doc.validFrom ? formatDateIN(doc.validFrom) : "— (starts at Part B)"} />
          <Kv k="Valid until" v={doc.validUntil ? formatDateIN(doc.validUntil) : "—"} />
          <Kv k="EWB no." v={doc.ewbNo || doc.stubNo} />
          <Kv k="Sub-supply" v={doc.subSupplyType ? `${doc.subSupplyType} ${doc.partA.reasonLabel}` : doc.partA.reasonLabel} />
        </tbody>
      </table>

      <label className="no-print mt-2 flex items-start gap-2 text-[10px]">
        <input
          type="checkbox"
          checked={skip}
          onChange={(e) => setSkip(e.target.checked)}
          disabled={!sameStateShort}
        />
        <span>
          Skip vehicle number only if movement is ≤ 50 km inside the same State/UT.
          {!sameStateShort ? " Disabled — distance exceeds 50 km or not intra-state." : " Warning: Part B still starts validity."}
        </span>
      </label>

      <p className="mt-2 text-[10px] font-semibold">
        Validity of e-way bill starts from Part B, not Part A.
      </p>
      <p className="text-[9px]">
        Driver copy — carry with the goods. Consigner GSTIN{" "}
        <span className="font-mono">{doc.company.gstin}</span>.
      </p>
      <div className="mt-1 text-[10px]">
        <GstinLine gstin={doc.company.gstin} stateCode={doc.company.stateCode} stateName={doc.company.state} />
      </div>

      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <th className="w-48 text-left">{k}</th>
      <td className="font-mono">{v}</td>
    </tr>
  );
}
