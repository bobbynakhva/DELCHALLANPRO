import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertRateDateNotFuture,
  blendFromAlloy,
  buildQuote,
  quoteIsFrozen,
} from "./engine.ts";

const C360: { code: string; cuPct: number; znPct: number; pbPct: number } = {
  code: "C36000",
  cuPct: 61.5,
  znPct: 35.4,
  pbPct: 3.1,
};

const june = {
  asOfDate: "2026-06-01",
  source: "manual",
  cuPaisePerKg: 81000,
  znPaisePerKg: 26500,
  pbPaisePerKg: 18500,
  brassScrapPaisePerKg: 41000,
};

const sept = {
  asOfDate: "2026-09-01",
  source: "MCX",
  cuPaisePerKg: 85000,
  znPaisePerKg: 27200,
  pbPaisePerKg: 18800,
  brassScrapPaisePerKg: 41000,
};

describe("quote freeze", () => {
  it("blends from alloy chemistry, not a hardcoded 61.5/35.5", () => {
    const a = blendFromAlloy(C360, june);
    const other = blendFromAlloy({ code: "CW617N", cuPct: 58, znPct: 39.5, pbPct: 2.5 }, june);
    assert.notEqual(a, other);
    const expected = Math.round(0.615 * 81000 + 0.354 * 26500 + 0.031 * 18500);
    assert.equal(a, expected);
  });

  it("SENT snapshot does not move when Cu book changes (journey 8)", () => {
    const frozen = buildQuote({
      kgPerPc: 0.048,
      recoveryFactor: 1.08,
      alloy: C360,
      book: june,
      basis: "CU_ZN_BLEND",
      conversionPaise: 450,
      jwPaise: 180,
      packingPaise: 40,
      overheadPaise: 80,
      marginPaise: 150,
    });
    const live = buildQuote({
      kgPerPc: 0.048,
      recoveryFactor: 1.08,
      alloy: C360,
      book: sept,
      basis: "CU_ZN_BLEND",
      conversionPaise: 450,
      jwPaise: 180,
      packingPaise: 40,
      overheadPaise: 80,
      marginPaise: 150,
    });
    assert.equal(frozen.cu_paise_per_kg, 81000);
    assert.equal(frozen.metal_rate_date, "2026-06-01");
    assert.equal(live.cu_paise_per_kg, 85000);
    assert.notEqual(frozen.unit_price_paise, live.unit_price_paise);
    assert.equal(quoteIsFrozen("SENT"), true);
    assert.equal(quoteIsFrozen("DRAFT"), false);
  });

  it("ALLOY_DEALER_RATE uses brass scrap instrument, not Cu/Zn mix", () => {
    const q = buildQuote({
      kgPerPc: 0.048,
      recoveryFactor: 1.08,
      alloy: C360,
      book: sept,
      basis: "ALLOY_DEALER_RATE",
      conversionPaise: 450,
      jwPaise: 180,
      packingPaise: 40,
      overheadPaise: 80,
      marginPct: 3.9,
    });
    assert.equal(q.blended_paise_per_kg, 41000);
    assert.equal(q.metal_paise, Math.round(0.048 * 1.08 * 41000));
  });

  it("refuses a future metal rate date", () => {
    assert.throws(() => assertRateDateNotFuture("2026-12-01", "2026-09-13"), /future/);
    assert.doesNotThrow(() => assertRateDateNotFuture("2026-09-01", "2026-09-13"));
  });
});
