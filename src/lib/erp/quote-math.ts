import { n } from "./format";
export { gstBreakup, classifySupply, type SupplyKind } from "@/modules/compliance/gst/tax";

export type QuoteInputs = {
  kgPerPc: number;
  recoveryFactor: number;
  cuPct: number;
  znPct: number;
  pbPct: number;
  cuPaisePerKg: number;
  znPaisePerKg: number;
  pbPaisePerKg: number;
  conversionPaise: number;
  jwPaise: number;
  packingPaise: number;
  overheadPaise: number;
  marginPaise: number;
};

export type QuoteBreakdown = {
  blendedPaisePerKg: number;
  metalPaise: number;
  conversionPaise: number;
  jwPaise: number;
  packingPaise: number;
  overheadPaise: number;
  marginPaise: number;
  unitPricePaise: number;
  formula: string;
};

const FORMULA =
  "metal = kgPerPc * recoveryFactor * blended(Cu,Zn,Pb); unitPrice = metal + conversion + jw + packing + overhead + margin";

export function blendMetalPaisePerKg(input: {
  cuPct: number;
  znPct: number;
  pbPct: number;
  cuPaisePerKg: number;
  znPaisePerKg: number;
  pbPaisePerKg: number;
}): number {
  return Math.round(
    (n(input.cuPct) / 100) * n(input.cuPaisePerKg) +
      (n(input.znPct) / 100) * n(input.znPaisePerKg) +
      (n(input.pbPct) / 100) * n(input.pbPaisePerKg),
  );
}

export function priceQuote(input: QuoteInputs): QuoteBreakdown {
  const blendedPaisePerKg = blendMetalPaisePerKg(input);
  const metalPaise = Math.round(n(input.kgPerPc) * n(input.recoveryFactor) * blendedPaisePerKg);
  const unitPricePaise =
    metalPaise +
    n(input.conversionPaise) +
    n(input.jwPaise) +
    n(input.packingPaise) +
    n(input.overheadPaise) +
    n(input.marginPaise);
  return {
    blendedPaisePerKg,
    metalPaise,
    conversionPaise: n(input.conversionPaise),
    jwPaise: n(input.jwPaise),
    packingPaise: n(input.packingPaise),
    overheadPaise: n(input.overheadPaise),
    marginPaise: n(input.marginPaise),
    unitPricePaise,
    formula: FORMULA,
  };
}
