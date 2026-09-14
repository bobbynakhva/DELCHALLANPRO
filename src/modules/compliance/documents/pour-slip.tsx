/** Shop pour slip — A4. Must not look like a tax invoice. No IRN. */
import { formatDateIN } from "../gst/dates";
import { formatKg } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import type { GstCompany } from "./types";

export type PourSlipDoc = {
  title: "POUR SLIP";
  docNo: string;
  docDate: string;
  heatNo: string;
  furnace: string;
  alloy: string;
  goodKg: number;
  castingLotNo: string | null;
  castingHeatNo?: string | null;
  charges?: Array<{ lotNo: string; sku: string; qtyKg: number }>;
  company: GstCompany;
  notTaxInvoice: true;
};

export function PourSlip({ doc }: { doc: PourSlipDoc }) {
  return (
    <DocFrame citation="Shop pour slip — not a tax invoice">
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">POUR SLIP</div>
            <div className="font-mono text-[13px]">{doc.docNo}</div>
            <div>Date {formatDateIN(doc.docDate)}</div>
            <div className="mt-1 text-[10px] font-semibold uppercase">Not a tax invoice · No IRN</div>
          </div>
        }
      />
      <section className="mt-3 grid grid-cols-2 gap-3 text-[11px]">
        <div>
          <div>
            <span className="text-muted">Heat: </span>
            <span className="font-mono font-semibold">{doc.heatNo}</span>
          </div>
          <div>
            <span className="text-muted">Furnace: </span>
            {doc.furnace}
          </div>
          <div>
            <span className="text-muted">Alloy: </span>
            <span className="font-mono">{doc.alloy}</span>
          </div>
        </div>
        <div>
          <div>
            <span className="text-muted">Casting lot: </span>
            <span className="font-mono">{doc.castingLotNo ?? "—"}</span>
          </div>
          <div>
            <span className="text-muted">Heat on lot: </span>
            <span className="font-mono">{doc.castingHeatNo ?? doc.heatNo}</span>
          </div>
        </div>
      </section>
      <table className="doc-table mt-3">
        <thead>
          <tr>
            <th>Good kg poured</th>
            <th>Alloy</th>
            <th>Heat</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="tabular font-mono text-[12px] font-bold">{formatKg(doc.goodKg)}</td>
            <td className="font-mono">{doc.alloy}</td>
            <td className="font-mono">{doc.heatNo}</td>
          </tr>
        </tbody>
      </table>
      {doc.charges?.length ? (
        <table className="doc-table mt-3">
          <thead>
            <tr>
              <th>Charge lot</th>
              <th>SKU</th>
              <th>kg</th>
            </tr>
          </thead>
          <tbody>
            {doc.charges.map((c) => (
              <tr key={c.lotNo}>
                <td className="font-mono">{c.lotNo}</td>
                <td className="font-mono">{c.sku}</td>
                <td className="tabular font-mono">{formatKg(c.qtyKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <p className="mt-3 border border-ink px-2 py-1 text-[10px] font-semibold uppercase">
        Shop pour slip. Not a tax invoice. No IRN. Genealogy: casting lot → heat → charge lots.
      </p>
      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
