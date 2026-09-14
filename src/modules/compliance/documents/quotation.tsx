/** Quotation — not a tax invoice. Must not look like TAX INVOICE. Metal rate date printed. */
import { formatDateIN } from "../gst/dates";
import { formatInrGrouped } from "../gst/words";
import { formatPcs } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { PartyBlock } from "./components/party-block";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import type { QuoteDoc } from "./types";

export function QuotationDocView({ doc }: { doc: QuoteDoc }) {
  return (
    <DocFrame citation="Quotation — not a tax invoice">
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">{doc.title}</div>
            <div className="text-[9px]">This is not a tax invoice</div>
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
            <div>Valid until {formatDateIN(doc.validUntil)}</div>
          </div>
        }
      />

      <p className="mt-2 border-2 border-ink px-2 py-1 text-[10px] font-semibold">
        This quotation is not a tax invoice and does not create a tax liability. GST extra as applicable.
      </p>

      <section className="mt-2 grid grid-cols-2 gap-3">
        <PartyBlock label="Customer" party={doc.customer} />
        <div className="text-[10px]">
          <div>
            <span className="text-muted">Metal rate date (frozen on this quote): </span>
            {formatDateIN(doc.metalRateDate)}
          </div>
          <div>
            Cu {formatInrGrouped(doc.cuPaisePerKg)}/kg · Zn {formatInrGrouped(doc.znPaisePerKg)}/kg
          </div>
          <div className="mt-1 text-[9px]">
            Formula snapshot: metal = kg/pc × recovery × blended(Cu,Zn,Pb); unit = metal + conversion + JW + packing
            + overhead + margin.
          </div>
        </div>
      </section>

      <table className="doc-table mt-2">
        <thead>
          <tr>
            <th>Sl</th>
            <th>SKU</th>
            <th>Description</th>
            <th>Qty NOS</th>
            <th>Metal ₹</th>
            <th>Conv. ₹</th>
            <th>JW ₹</th>
            <th>Pack ₹</th>
            <th>OH ₹</th>
            <th>Margin ₹</th>
            <th>Unit ₹</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((ln) => (
            <tr key={ln.sl}>
              <td className="tabular">{ln.sl}</td>
              <td className="font-mono">{ln.sku}</td>
              <td>{ln.description}</td>
              <td className="tabular">{formatPcs(ln.qtyNos)}</td>
              <td className="tabular">{formatInrGrouped(ln.metalPaise)}</td>
              <td className="tabular">{formatInrGrouped(ln.conversionPaise)}</td>
              <td className="tabular">{formatInrGrouped(ln.jwPaise)}</td>
              <td className="tabular">{formatInrGrouped(ln.packingPaise)}</td>
              <td className="tabular">{formatInrGrouped(ln.overheadPaise)}</td>
              <td className="tabular">{formatInrGrouped(ln.marginPaise)}</td>
              <td className="tabular font-semibold">{formatInrGrouped(ln.unitPricePaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[10px] font-semibold">GST extra as applicable.</p>
      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
