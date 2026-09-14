/**
 * Quotation engine — alloy chemistry from the master, never a hardcoded 61.5/35.5.
 * A SENT quote is a snapshot; changing MetalPrice must not rewrite it.
 */

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : 0;
}

export const INSTRUMENTS = ["CU_INR_KG", "ZN_INR_KG", "PB_INR_KG", "BRASS_SCRAP_C360_KG"] as const;
export type Instrument = (typeof INSTRUMENTS)[number];

export const METAL_BASIS = ["CU_ZN_BLEND", "ALLOY_DEALER_RATE"] as const;
export type MetalBasis = (typeof METAL_BASIS)[number];

export type AlloyChem = { code: string; cuPct: number; znPct: number; pbPct: number };

export type MetalBook = {
  asOfDate: string;
  source: string;
  cuPaisePerKg: number;
  znPaisePerKg: number;
  pbPaisePerKg: number;
  brassScrapPaisePerKg: number;
};

export type TariffBite = {
  processCode: string;
  source: "OWN_TARIFF" | "PARTNER_RATE" | "NO_ROUTING";
  paisePerPc: number;
  isSubcontract: boolean;
};

export type QuoteBuildInput = {
  kgPerPc: number;
  recoveryFactor: number;
  alloy: AlloyChem;
  book: MetalBook;
  basis: MetalBasis;
  conversionPaise: number;
  jwPaise: number;
  packingPaise: number;
  overheadPaise: number;
  marginPaise?: number;
  marginPct?: number;
  hsn?: string | null;
  gstRatePct?: number;
  conversionReason?: string | null;
  tariffs?: TariffBite[];
};

export type QuoteSnapshot = {
  formula: string;
  alloy: string;
  cu_pct: number;
  zn_pct: number;
  pb_pct: number;
  kg_per_pc: number;
  recovery_factor: number;
  metal_rate_date: string;
  metal_basis: MetalBasis;
  metal_source: string;
  cu_paise_per_kg: number;
  zn_paise_per_kg: number;
  pb_paise_per_kg: number;
  brass_scrap_paise_per_kg: number;
  blended_paise_per_kg: number;
  metal_paise: number;
  conversion_paise: number;
  jw_paise: number;
  packing_paise: number;
  overhead_paise: number;
  margin_paise: number;
  margin_pct: number;
  unit_price_paise: number;
  hsn: string;
  gst_rate_pct: number;
  conversion_reason: string | null;
  working: string[];
  tariffs: TariffBite[];
};

const FORMULA_BLEND =
  "metal = kgPerPc × recoveryFactor × blended(alloy Cu/Zn/Pb × book); unit = metal + conversion + jw + packing + overhead + margin";
const FORMULA_DEALER =
  "metal = kgPerPc × recoveryFactor × dealer(BRASS_SCRAP_C360_KG); unit = metal + conversion + jw + packing + overhead + margin";

export function blendFromAlloy(alloy: AlloyChem, book: MetalBook): number {
  return Math.round(
    (n(alloy.cuPct) / 100) * n(book.cuPaisePerKg) +
      (n(alloy.znPct) / 100) * n(book.znPaisePerKg) +
      (n(alloy.pbPct) / 100) * n(book.pbPaisePerKg),
  );
}

export function metalRatePaisePerKg(opts: { alloy: AlloyChem; book: MetalBook; basis: MetalBasis }): number {
  if (opts.basis === "ALLOY_DEALER_RATE") return n(opts.book.brassScrapPaisePerKg);
  return blendFromAlloy(opts.alloy, opts.book);
}

export function splitTariffs(tariffs: TariffBite[] | undefined): { conversionPaise: number; jwPaise: number; reason: string | null } {
  if (!tariffs || tariffs.length === 0) {
    return { conversionPaise: 0, jwPaise: 0, reason: "NO_ROUTING" };
  }
  let conversionPaise = 0;
  let jwPaise = 0;
  let reason: string | null = null;
  for (const t of tariffs) {
    if (t.source === "NO_ROUTING") reason = "NO_ROUTING";
    if (t.isSubcontract || t.source === "PARTNER_RATE") jwPaise += t.paisePerPc;
    else conversionPaise += t.paisePerPc;
  }
  return { conversionPaise, jwPaise, reason };
}

export function buildQuote(input: QuoteBuildInput): QuoteSnapshot {
  const recovery = n(input.recoveryFactor) || 1.08;
  const kgPer = n(input.kgPerPc);
  const blended = metalRatePaisePerKg({ alloy: input.alloy, book: input.book, basis: input.basis });
  const metalPaise = Math.round(kgPer * recovery * blended);
  const split = input.tariffs ? splitTariffs(input.tariffs) : { conversionPaise: 0, jwPaise: 0, reason: null };
  const conversionPaise = input.tariffs ? split.conversionPaise : n(input.conversionPaise);
  const jwPaise = input.tariffs ? split.jwPaise : n(input.jwPaise);
  const packingPaise = n(input.packingPaise);
  const overheadPaise = n(input.overheadPaise);
  const subtotal = metalPaise + conversionPaise + jwPaise + packingPaise + overheadPaise;
  const marginPct = n(input.marginPct);
  const marginPaise =
    marginPct > 0 ? Math.round(subtotal * (marginPct / 100)) : n(input.marginPaise);
  const unitPricePaise = subtotal + marginPaise;
  const effectivePct = subtotal > 0 ? (marginPaise / subtotal) * 100 : 0;
  const working: string[] = [];
  working.push(
    `Alloy ${input.alloy.code}: Cu ${n(input.alloy.cuPct).toFixed(3)}% · Zn ${n(input.alloy.znPct).toFixed(3)}% · Pb ${n(input.alloy.pbPct).toFixed(3)}% (master, not hardcoded)`,
  );
  working.push(
    `Book ${input.book.asOfDate} (${input.book.source}): Cu ₹${(n(input.book.cuPaisePerKg) / 100).toFixed(2)}/kg · Zn ₹${(n(input.book.znPaisePerKg) / 100).toFixed(2)}/kg · Pb ₹${(n(input.book.pbPaisePerKg) / 100).toFixed(2)}/kg`,
  );
  if (input.basis === "CU_ZN_BLEND") {
    working.push(
      `Blended = ${n(input.alloy.cuPct).toFixed(3)}%×Cu + ${n(input.alloy.znPct).toFixed(3)}%×Zn + ${n(input.alloy.pbPct).toFixed(3)}%×Pb = ₹${(blended / 100).toFixed(2)}/kg`,
    );
  } else {
    working.push(`Dealer brass scrap C360 = ₹${(n(input.book.brassScrapPaisePerKg) / 100).toFixed(2)}/kg`);
  }
  working.push(
    `Metal = ${kgPer} kg/pc × ${recovery} recovery × ₹${(blended / 100).toFixed(2)} = ₹${(metalPaise / 100).toFixed(2)}`,
  );
  working.push(`Conversion ₹${(conversionPaise / 100).toFixed(2)} · JW/plating ₹${(jwPaise / 100).toFixed(2)} · packing ₹${(packingPaise / 100).toFixed(2)} · overhead ₹${(overheadPaise / 100).toFixed(2)}`);
  working.push(
    `Margin ${effectivePct.toFixed(2)}% = ₹${(marginPaise / 100).toFixed(2)} → unit ex-GST ₹${(unitPricePaise / 100).toFixed(2)}`,
  );
  return {
    formula: input.basis === "ALLOY_DEALER_RATE" ? FORMULA_DEALER : FORMULA_BLEND,
    alloy: input.alloy.code,
    cu_pct: n(input.alloy.cuPct),
    zn_pct: n(input.alloy.znPct),
    pb_pct: n(input.alloy.pbPct),
    kg_per_pc: kgPer,
    recovery_factor: recovery,
    metal_rate_date: input.book.asOfDate,
    metal_basis: input.basis,
    metal_source: input.book.source,
    cu_paise_per_kg: n(input.book.cuPaisePerKg),
    zn_paise_per_kg: n(input.book.znPaisePerKg),
    pb_paise_per_kg: n(input.book.pbPaisePerKg),
    brass_scrap_paise_per_kg: n(input.book.brassScrapPaisePerKg),
    blended_paise_per_kg: blended,
    metal_paise: metalPaise,
    conversion_paise: conversionPaise,
    jw_paise: jwPaise,
    packing_paise: packingPaise,
    overhead_paise: overheadPaise,
    margin_paise: marginPaise,
    margin_pct: Math.round(effectivePct * 1000) / 1000,
    unit_price_paise: unitPricePaise,
    hsn: input.hsn ?? "",
    gst_rate_pct: n(input.gstRatePct) || 18,
    conversion_reason: input.conversionReason ?? split.reason,
    working,
    tariffs: input.tariffs ?? [],
  };
}

/** A later MetalPrice post must not mutate these fields on a SENT quote. */
export function quoteIsFrozen(status: string | null | undefined): boolean {
  const s = (status ?? "").toUpperCase();
  return s === "SENT" || s === "ACCEPTED" || s === "EXPIRED";
}

export function assertRateDateNotFuture(rateDate: string, today: string): void {
  if (rateDate > today) throw new Error(`Metal rate date ${rateDate} is in the future — pick today or earlier`);
}
