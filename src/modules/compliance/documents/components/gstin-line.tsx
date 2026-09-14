/** GSTIN 15 chars; state name + code wherever required. */
import { gstinLooksValid, placeOfSupplyLabel } from "../../gst/states";

export function GstinLine({
  gstin,
  stateCode,
  stateName,
  unregistered,
}: {
  gstin?: string | null;
  stateCode?: string | null;
  stateName?: string | null;
  unregistered?: boolean;
}) {
  if (unregistered || !gstin) {
    return (
      <div>
        GSTIN: URP (unregistered)
        {stateCode ? ` · ${placeOfSupplyLabel(stateCode, stateName)}` : ""}
      </div>
    );
  }
  const ok = gstinLooksValid(gstin);
  return (
    <div>
      GSTIN: <span className="font-mono tracking-wide">{gstin}</span>
      {ok ? "" : " (check format)"} · {placeOfSupplyLabel(gstin.slice(0, 2), stateName)}
    </div>
  );
}
