import type { GstParty } from "../types";
import { GstinLine } from "./gstin-line";

export function PartyBlock({ label, party }: { label: string; party: GstParty }) {
  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-wide">{label}</div>
      <div className="font-semibold">{party.name}</div>
      <div>{party.addressLine1}</div>
      {party.addressLine2 ? <div>{party.addressLine2}</div> : null}
      <div>
        {party.city}, {party.state} {party.pincode}
        {party.country && party.country !== "IN" ? ` · ${party.country}` : ""}
      </div>
      <GstinLine
        gstin={party.gstin}
        stateCode={party.stateCode}
        stateName={party.state}
        unregistered={!party.registered}
      />
      {party.pan ? <div>PAN {party.pan}</div> : null}
    </div>
  );
}
