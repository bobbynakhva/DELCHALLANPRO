/**
 * Weekly MRP — explode approved BOM for new demand; frozen WO BOM for released WOs.
 * Forecast only if demand_forecast has rows. Time fence: do not cancel released WOs inside it.
 */

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function roundKg(v: number): number {
  return Math.round(v * 1000) / 1000;
}

export const MRP_ACTIONS = [
  "NONE",
  "CREATE_WO",
  "CREATE_PO",
  "CREATE_JW",
  "CREATE_MELT",
  "EXPEDITE_WO",
  "EXPEDITE_PO",
  "EXPEDITE_JW",
] as const;
export type MrpAction = (typeof MRP_ACTIONS)[number];

export type MrpItemSupply = {
  itemId: number;
  sku: string;
  type: string; // RM | FG | SCRAP
  uom: string;
  safetyQty: number;
  availableQty: number;
  openWoQty: number;
  openPoQty: number;
  jwPipelineQty: number;
  soDemandQty: number;
  forecastQty: number;
  releasedWoInsideFence: boolean;
  extraReleasedQty: number;
};

export type BomNeed = { componentItemId: number; qtyPer: number; uom: string; isCoProduct: boolean };

export type MrpLineOut = {
  itemId: number;
  sku: string;
  type: string;
  qtyUom: string;
  demandQty: number;
  supplyQty: number;
  availableQty: number;
  openWoQty: number;
  openPoQty: number;
  jwPipelineQty: number;
  shortfallQty: number;
  action: MrpAction;
  suggestedQty: number;
  pegging: string;
};

export function netRequirement(item: MrpItemSupply): MrpLineOut {
  const demand = n(item.soDemandQty) + n(item.forecastQty) + n(item.safetyQty);
  const supply = n(item.availableQty) + n(item.openWoQty) + n(item.openPoQty) + n(item.jwPipelineQty);
  const shortfall = roundKg(Math.max(0, demand - supply));
  let action: MrpAction = "NONE";
  let suggested = 0;
  if (shortfall > 0.0005) {
    if (item.type === "RM") action = "CREATE_PO";
    else if (item.type === "FG" || item.type === "SFG") action = "CREATE_WO";
    else action = "NONE";
    suggested = shortfall;
  } else if (item.releasedWoInsideFence) {
    action = "NONE"; // time fence: do not suggest cancel of released WOs
  } else if (n(item.extraReleasedQty) > 0 && n(item.openWoQty) > demand) {
    action = "NONE";
  }
  if (shortfall > 0.0005 && item.releasedWoInsideFence && item.type !== "RM") {
    action = "EXPEDITE_WO";
    suggested = shortfall;
  }
  return {
    itemId: item.itemId,
    sku: item.sku,
    type: item.type,
    qtyUom: item.uom,
    demandQty: roundKg(demand),
    supplyQty: roundKg(supply),
    availableQty: roundKg(n(item.availableQty)),
    openWoQty: roundKg(n(item.openWoQty)),
    openPoQty: roundKg(n(item.openPoQty)),
    jwPipelineQty: roundKg(n(item.jwPipelineQty)),
    shortfallQty: shortfall,
    action,
    suggestedQty: suggested,
    pegging: `SO ${n(item.soDemandQty)} + safety ${n(item.safetyQty)} + forecast ${n(item.forecastQty)} vs avail ${n(item.availableQty)} + WO ${n(item.openWoQty)} + PO ${n(item.openPoQty)} + JW ${n(item.jwPipelineQty)}`,
  };
}

export function explodeDemand(parentQty: number, bom: BomNeed[]): Array<{ itemId: number; qty: number; uom: string }> {
  return bom
    .filter((b) => !b.isCoProduct)
    .map((b) => ({ itemId: b.componentItemId, qty: roundKg(parentQty * n(b.qtyPer)), uom: b.uom }));
}

export function wcLoadPct(openWoMinutes: number, weeklyMinutes: number): number {
  const cap = n(weeklyMinutes);
  if (cap <= 0) return 0;
  return Math.round((n(openWoMinutes) / cap) * 1000) / 10;
}
