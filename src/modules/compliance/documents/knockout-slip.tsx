/** Shop knockout slip — A4. Must not look like a tax invoice. No IRN. */
import { formatDateIN } from "../gst/dates";
import { formatKg } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { DocFooter, SignatureBlock } from "./components/signature-block";
import type { GstCompany } from "./types";

export type KnockoutSlipDoc = {
  title: "KNOCKOUT SLIP";
  docNo: string;
  docDate: string;
  heatNo: string;
  furnace: string;
  alloy: string;
  runnerKg: number;
  drossKg: number;
  rejectKg: number;
  runnerLotNo?: string | null;
  drossLotNo?: string | null;
  drossToVariance?: boolean;
  company: GstCompany;
  notTaxInvoice: true;
};

export function KnockoutSlip({ doc }: { doc: KnockoutSlipDoc }) {
  return (
    <DocFrame citation="Shop knockout slip — not a tax invoice">
      <GstLetterhead
        company={doc.company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">KNOCKOUT SLIP</div>
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
        </div>
        <div>
          <div>
            <span className="text-muted">Alloy: </span>
            <span className="font-mono">{doc.alloy}</span>
          </div>
          <div>
            <span className="text-muted">Dross: </span>
            {doc.drossToVariance ? "to variance" : "to stock"}
          </div>
        </div>
      </section>
      <table className="doc-table mt-3">
        <thead>
          <tr>
            <th>Runner kg → same alloy scrap</th>
            <th>Dross kg</th>
            <th>Reject kg</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="tabular font-mono text-[12px] font-bold">{formatKg(doc.runnerKg)}</td>
            <td className="tabular font-mono text-[12px]">{formatKg(doc.drossKg)}</td>
            <td className="tabular font-mono text-[12px]">{formatKg(doc.rejectKg)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2 text-[10px]">
        Runner lot {doc.runnerLotNo ?? "—"} carries heat {doc.heatNo} on SC-{"{ALLOY}"}-RUNNER. Dross lot{" "}
        {doc.drossLotNo ?? (doc.drossToVariance ? "(variance)" : "—")}.
      </p>
      <p className="mt-3 border border-ink px-2 py-1 text-[10px] font-semibold uppercase">
        Shop knockout slip. Not a tax invoice. No IRN.
      </p>
      <SignatureBlock company={doc.company} />
      <DocFooter company={doc.company} />
    </DocFrame>
  );
}
