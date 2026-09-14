import { formatDateTimeIST } from "../../gst/dates";
import type { GstCompany } from "../types";

export function SignatureBlock({ company }: { company: GstCompany }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-6 text-[10px]">
      <div>
        <p>Certified that the particulars given above are true and correct.</p>
      </div>
      <div className="text-right">
        <div>For {company.legalName}</div>
        <div className="mt-10 font-semibold">{company.authorisedSignatory}</div>
        <div>{company.authorisedDesignation} · Authorised signatory</div>
      </div>
    </div>
  );
}

export function DocFooter({ company }: { company: GstCompany }) {
  return (
    <footer className="mt-4 border-t border-ink pt-1 text-[8px] leading-snug text-ink">
      {company.cin ? `CIN ${company.cin} · ` : ""}
      Registered office: {company.registeredOffice ?? `${company.addressLine1}, ${company.city}`}
      <br />
      This is a computer-generated document. Printed {formatDateTimeIST()}.
    </footer>
  );
}
