import { formatInrGrouped } from "../../gst/words";
import type { SupplyKind } from "../../gst/tax";

export function TaxSummary({
  kind,
  rows,
  taxablePaise,
  cgstPaise,
  sgstPaise,
  igstPaise,
  roundOffPaise,
  totalPaise,
}: {
  kind: SupplyKind;
  rows: Array<{ rate: number; taxablePaise: number; cgstPaise: number; sgstPaise: number; igstPaise: number }>;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  roundOffPaise: number;
  totalPaise: number;
}) {
  const intra = kind === "INTRA";
  return (
    <div className="mt-2">
      <div className="text-[9px] font-semibold uppercase tracking-wide">Tax summary (rate-wise)</div>
      <table className="doc-table">
        <thead>
          <tr>
            <th>Rate %</th>
            <th>Taxable ₹</th>
            {intra ? (
              <>
                <th>CGST ₹</th>
                <th>SGST ₹</th>
              </>
            ) : (
              <th>IGST ₹</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rate}>
              <td className="tabular">{r.rate.toFixed(2)}</td>
              <td className="tabular">{formatInrGrouped(r.taxablePaise)}</td>
              {intra ? (
                <>
                  <td className="tabular">{formatInrGrouped(r.cgstPaise)}</td>
                  <td className="tabular">{formatInrGrouped(r.sgstPaise)}</td>
                </>
              ) : (
                <td className="tabular">{formatInrGrouped(r.igstPaise)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-1 w-56 text-[10px]">
        <div className="flex justify-between">
          <dt>Taxable after discount</dt>
          <dd className="tabular">{formatInrGrouped(taxablePaise)}</dd>
        </div>
        {intra ? (
          <>
            <div className="flex justify-between">
              <dt>CGST</dt>
              <dd className="tabular">{formatInrGrouped(cgstPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>SGST</dt>
              <dd className="tabular">{formatInrGrouped(sgstPaise)}</dd>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <dt>IGST</dt>
            <dd className="tabular">{formatInrGrouped(igstPaise)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Round off</dt>
          <dd className="tabular">{formatInrGrouped(roundOffPaise)}</dd>
        </div>
        <div className="flex justify-between border-t border-ink font-semibold">
          <dt>Grand total</dt>
          <dd className="tabular">{formatInrGrouped(totalPaise)}</dd>
        </div>
      </dl>
    </div>
  );
}
