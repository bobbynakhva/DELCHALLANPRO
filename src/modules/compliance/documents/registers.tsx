/** Printable GST registers: invoice serial, ITC-04, GSTR-1 lite, e-way. Thresholds from company settings. */
import { formatDateIN, financialYearLabel } from "../gst/dates";
import { serialGaps } from "../gst/serial";
import { formatInrGrouped } from "../gst/words";
import { formatKg, formatPcs, n } from "@/lib/erp/format";
import { DocFrame } from "./components/doc-frame";
import { GstLetterhead } from "./components/gst-letterhead";
import { DocFooter } from "./components/signature-block";
import { TAMBA } from "./fixtures";
import type { GstCompany } from "./types";

export type RegisterBundle = {
  company: GstCompany;
  invoices: Array<{
    docNo: string;
    date: string;
    gstin: string | null;
    name: string;
    place: string;
    taxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
    totalPaise: number;
    hsn: string;
  }>;
  notes: Array<{
    kind: "CN" | "DN";
    docNo: string;
    date: string;
    originalNo: string;
    gstin: string | null;
    taxablePaise: number;
    cgstPaise: number;
    sgstPaise: number;
    igstPaise: number;
  }>;
  challans: Array<{
    docNo: string;
    date: string;
    partner: string;
    gstin: string | null;
    hsn: string;
    qtyNos: number;
    qtyKgs: number;
    due: string;
    status: string;
    receivedNos?: number;
    lossNos?: number;
    sentToAnotherJw?: boolean;
  }>;
  eways: Array<{
    stubNo: string;
    docNo: string;
    date: string;
    valuePaise: number;
    partBAt: string | null;
    vehicle: string;
    reason: string;
  }>;
};

export const FIX_REGISTERS: RegisterBundle = {
  company: TAMBA,
  invoices: [
    {
      docNo: "INV/26-27/0001",
      date: "2026-09-13",
      gstin: "24AAGCG5520F1Z6",
      name: "Gujarat Sanitary",
      place: "24-Gujarat",
      taxablePaise: 20695000,
      cgstPaise: 1862550,
      sgstPaise: 1862550,
      igstPaise: 0,
      totalPaise: 24420100,
      hsn: "741220",
    },
  ],
  notes: [
    {
      kind: "CN",
      docNo: "CN/26-27/0001",
      date: "2026-09-13",
      originalNo: "INV/26-27/0001",
      gstin: "24AAGCG5520F1Z6",
      taxablePaise: 2450,
      cgstPaise: 221,
      sgstPaise: 220,
      igstPaise: 0,
    },
  ],
  challans: [
    {
      docNo: "JW/26-27/0001",
      date: "2025-12-07",
      partner: "Amit Polishers",
      gstin: "24AABPA8821E1Z2",
      hsn: "741220",
      qtyNos: 800,
      qtyKgs: 48,
      due: "2026-12-07",
      status: "OPEN",
      receivedNos: 0,
      lossNos: 0,
    },
    {
      docNo: "JW/26-27/0003",
      date: "2026-09-13",
      partner: "Kiran Platers",
      gstin: "24AAKPK4410D1Z8",
      hsn: "741220",
      qtyNos: 9820,
      qtyKgs: 471.36,
      due: "2027-09-13",
      status: "PARTIAL",
      receivedNos: 9700,
      lossNos: 40,
    },
  ],
  eways: [
    {
      stubNo: "EWB/26-27/0001",
      docNo: "JW/26-27/0003",
      date: "2026-09-13",
      valuePaise: 20695000,
      partBAt: "2026-09-13T08:40:00+05:30",
      vehicle: "GJ01AB4421",
      reason: "3 Job Work",
    },
  ],
};

export function RegistersView({ data = FIX_REGISTERS }: { data?: RegisterBundle }) {
  const company = data.company;
  const fy = financialYearLabel(new Date());
  const halfYear = company.turnoverAbove5Cr;
  const period = halfYear ? "April 2026 – September 2026 (half-year — turnover > ₹5 Cr)" : `FY 20${fy} (annual — turnover ≤ ₹5 Cr)`;
  const docs = data.invoices.map((i) => i.docNo);
  const gaps = serialGaps(docs);

  return (
    <DocFrame citation="GSTR-1 lite · ITC-04 · e-way register · invoice serial">
      <GstLetterhead
        company={company}
        right={
          <div>
            <div className="text-[13px] font-bold uppercase tracking-wide">GST registers</div>
            <div>FY {fy}</div>
            <div className="text-[9px]">{period}</div>
          </div>
        }
      />

      <h2 className="mt-3 text-[11px] font-bold uppercase">Invoice register (serial-gap check)</h2>
      {gaps.length ? (
        <p className="text-[10px] font-semibold">
          Gap after {gaps.map((g) => `${g.missingAfter} (expected ${g.expected})`).join("; ")}.
        </p>
      ) : (
        <p className="text-[10px]">No serial gaps in this list.</p>
      )}
      <table className="doc-table mt-1">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Date</th>
            <th>GSTIN</th>
            <th>Name</th>
            <th>POS</th>
            <th>Taxable</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.invoices.map((r) => (
            <tr key={r.docNo} className={gaps.some((g) => g.missingAfter === r.docNo) ? "bg-cream-deep" : undefined}>
              <td className="font-mono">{r.docNo}</td>
              <td>{formatDateIN(r.date)}</td>
              <td className="font-mono">{r.gstin ?? "URP"}</td>
              <td>{r.name}</td>
              <td>{r.place}</td>
              <td className="tabular">{formatInrGrouped(r.taxablePaise)}</td>
              <td className="tabular">{formatInrGrouped(r.cgstPaise)}</td>
              <td className="tabular">{formatInrGrouped(r.sgstPaise)}</td>
              <td className="tabular">{formatInrGrouped(r.igstPaise)}</td>
              <td className="tabular">{formatInrGrouped(r.totalPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">GSTR-1 lite — B2B</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>GSTIN</th>
            <th>Invoice</th>
            <th>Date</th>
            <th>Value</th>
            <th>POS</th>
            <th>Taxable</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
          </tr>
        </thead>
        <tbody>
          {data.invoices
            .filter((i) => i.gstin)
            .map((r) => (
              <tr key={r.docNo}>
                <td className="font-mono">{r.gstin}</td>
                <td className="font-mono">{r.docNo}</td>
                <td>{formatDateIN(r.date)}</td>
                <td className="tabular">{formatInrGrouped(r.totalPaise)}</td>
                <td>{r.place}</td>
                <td className="tabular">{formatInrGrouped(r.taxablePaise)}</td>
                <td className="tabular">{formatInrGrouped(r.cgstPaise)}</td>
                <td className="tabular">{formatInrGrouped(r.sgstPaise)}</td>
                <td className="tabular">{formatInrGrouped(r.igstPaise)}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">GSTR-1 lite — CDNR</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Note</th>
            <th>Date</th>
            <th>Original invoice</th>
            <th>GSTIN</th>
            <th>Taxable</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
          </tr>
        </thead>
        <tbody>
          {data.notes.map((r) => (
            <tr key={r.docNo}>
              <td className="font-mono">
                {r.kind} {r.docNo}
              </td>
              <td>{formatDateIN(r.date)}</td>
              <td className="font-mono">{r.originalNo}</td>
              <td className="font-mono">{r.gstin ?? "URP"}</td>
              <td className="tabular">{formatInrGrouped(r.taxablePaise)}</td>
              <td className="tabular">{formatInrGrouped(r.cgstPaise)}</td>
              <td className="tabular">{formatInrGrouped(r.sgstPaise)}</td>
              <td className="tabular">{formatInrGrouped(r.igstPaise)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">GSTR-1 lite — HSN summary (Table 12 style)</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>HSN</th>
            <th>UQC</th>
            <th>Taxable</th>
            <th>CGST</th>
            <th>SGST</th>
            <th>IGST</th>
          </tr>
        </thead>
        <tbody>
          {hsnRollup(data).map((h) => (
            <tr key={h.hsn}>
              <td className="font-mono">{h.hsn}</td>
              <td>NOS / KGS</td>
              <td className="tabular">{formatInrGrouped(h.taxable)}</td>
              <td className="tabular">{formatInrGrouped(h.cgst)}</td>
              <td className="tabular">{formatInrGrouped(h.sgst)}</td>
              <td className="tabular">{formatInrGrouped(h.igst)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">Job-work / delivery challan register (feeds ITC-04)</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Challan</th>
            <th>Date</th>
            <th>Job worker</th>
            <th>GSTIN</th>
            <th>HSN</th>
            <th>NOS</th>
            <th>KGS</th>
            <th>Due (s.143)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {data.challans.map((c) => (
            <tr key={c.docNo}>
              <td className="font-mono">{c.docNo}</td>
              <td>{formatDateIN(c.date)}</td>
              <td>{c.partner}</td>
              <td className="font-mono">{c.gstin ?? "URP"}</td>
              <td className="font-mono">{c.hsn}</td>
              <td className="tabular">{formatPcs(c.qtyNos)}</td>
              <td className="tabular">{formatKg(c.qtyKgs)}</td>
              <td>{formatDateIN(c.due)}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">ITC-04 worksheet — Table 4 (inputs / capital goods sent)</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Challan</th>
            <th>Date</th>
            <th>JW GSTIN</th>
            <th>HSN</th>
            <th>Qty NOS</th>
            <th>Qty KGS</th>
          </tr>
        </thead>
        <tbody>
          {data.challans.map((c) => (
            <tr key={`t4-${c.docNo}`}>
              <td className="font-mono">{c.docNo}</td>
              <td>{formatDateIN(c.date)}</td>
              <td className="font-mono">{c.gstin ?? "URP"}</td>
              <td className="font-mono">{c.hsn}</td>
              <td className="tabular">{formatPcs(c.qtyNos)}</td>
              <td className="tabular">{formatKg(c.qtyKgs)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">
        ITC-04 worksheet — Table 5A (received back + losses)
      </h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Original challan</th>
            <th>Received NOS</th>
            <th>Loss NOS</th>
          </tr>
        </thead>
        <tbody>
          {data.challans
            .filter((c) => n(c.receivedNos) > 0 || n(c.lossNos) > 0)
            .map((c) => (
              <tr key={`t5a-${c.docNo}`}>
                <td className="font-mono">{c.docNo}</td>
                <td className="tabular">{formatPcs(c.receivedNos ?? 0)}</td>
                <td className="tabular">{formatPcs(c.lossNos ?? 0)}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">
        ITC-04 worksheet — Table 5B (sent to another job worker)
      </h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Original challan</th>
            <th>Sent to another JW</th>
          </tr>
        </thead>
        <tbody>
          {data.challans.filter((c) => c.sentToAnotherJw).length === 0 ? (
            <tr>
              <td colSpan={2}>None in this period.</td>
            </tr>
          ) : (
            data.challans
              .filter((c) => c.sentToAnotherJw)
              .map((c) => (
                <tr key={`t5b-${c.docNo}`}>
                  <td className="font-mono">{c.docNo}</td>
                  <td>Yes</td>
                </tr>
              ))
          )}
        </tbody>
      </table>

      <h2 className="mt-4 text-[11px] font-bold uppercase">E-way register (Part B time = validity start)</h2>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Stub / e-way</th>
            <th>Document</th>
            <th>Date</th>
            <th>Value</th>
            <th>Reason</th>
            <th>Vehicle</th>
            <th>Part B (validity start)</th>
          </tr>
        </thead>
        <tbody>
          {data.eways.map((e) => (
            <tr key={e.stubNo}>
              <td className="font-mono">{e.stubNo}</td>
              <td className="font-mono">{e.docNo}</td>
              <td>{formatDateIN(e.date)}</td>
              <td className="tabular">{formatInrGrouped(e.valuePaise)}</td>
              <td>{e.reason}</td>
              <td className="font-mono">{e.vehicle}</td>
              <td>{e.partBAt ? e.partBAt.replace("T", " ").slice(0, 19) : "Part A only — validity not started"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-3 text-[9px]">
        These worksheets are books of the factory. They are not a GSTN filing. ITC-04 frequency follows the
        turnover setting (half-year if {'>'} ₹5 Cr, else annual).
      </p>
      <DocFooter company={company} />
    </DocFrame>
  );
}

function hsnRollup(data: RegisterBundle) {
  const m = new Map<string, { hsn: string; taxable: number; cgst: number; sgst: number; igst: number }>();
  for (const r of data.invoices) {
    const cur = m.get(r.hsn) ?? { hsn: r.hsn, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    cur.taxable += r.taxablePaise;
    cur.cgst += r.cgstPaise;
    cur.sgst += r.sgstPaise;
    cur.igst += r.igstPaise;
    m.set(r.hsn, cur);
  }
  return [...m.values()];
}
