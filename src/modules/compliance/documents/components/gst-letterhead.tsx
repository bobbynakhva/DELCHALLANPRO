/** Legal name first, trade name second. Address of issuing place. GSTIN. */
import type { GstCompany } from "../types";
import { GstinLine } from "./gstin-line";

export function GstLetterhead({
  company,
  right,
}: {
  company: GstCompany;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex justify-between gap-4 border-b-2 border-ink pb-2">
      <div className="min-w-0">
        <div className="text-[15px] font-bold leading-tight text-ink">{company.legalName}</div>
        {company.tradeName && company.tradeName !== company.legalName ? (
          <div className="text-[11px]">Trade name: {company.tradeName}</div>
        ) : null}
        <div>
          {company.addressLine1}
          {company.addressLine2 ? `, ${company.addressLine2}` : ""}
        </div>
        <div>
          {company.city}, {company.state} {company.pincode}
        </div>
        <GstinLine gstin={company.gstin} stateCode={company.stateCode} stateName={company.state} />
        <div>
          PAN {company.pan}
          {company.cin ? ` · CIN ${company.cin}` : ""}
        </div>
        {company.phone || company.email ? (
          <div>
            {company.phone} {company.email}
          </div>
        ) : null}
      </div>
      <div className="shrink-0 text-right">{right}</div>
    </header>
  );
}
