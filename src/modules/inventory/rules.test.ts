import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertAlloyMatch,
  assertConversion,
  assertJwVendorAllowed,
  assertPackingMatch,
  assertSufficient,
  encodeMoveNotes,
  jwLossWorking,
  jwVendorBlocked,
  moveValuePaise,
  packingKgMatch,
  parseReverseOf,
  runningKg,
  runningPcs,
  woCompleteCheck,
  yieldGap,
} from "./rules.ts";

describe("1. Cannot dispatch more pcs than lot has", () => {
  it("refuses over-dispatch", () => {
    assert.throws(
      () => assertSufficient({ havePcs: 5000, takePcs: 5001, what: "dispatch" }),
      /Cannot dispatch 5001 pcs — lot has 5000 pcs/,
    );
    assert.doesNotThrow(() => assertSufficient({ havePcs: 5000, takePcs: 5000, what: "dispatch" }));
  });
});

describe("2. Cannot issue CW617N lot to a C360 component", () => {
  it("refuses alloy mismatch by code and id", () => {
    assert.throws(
      () =>
        assertAlloyMatch({
          lotAlloyCode: "CW617N",
          itemAlloyCode: "C36000",
          lotAlloyId: 2,
          itemAlloyId: 1,
        }),
      /CW617N/,
    );
    assert.doesNotThrow(() =>
      assertAlloyMatch({ lotAlloyCode: "C36000", itemAlloyCode: "C36000", lotAlloyId: 1, itemAlloyId: 1 }),
    );
  });
});

describe("3. GRN 1250.500 minus two 100.000 issues = 1050.500", () => {
  it("running kg is the sum of moves", () => {
    assert.equal(runningKg([1250.5, -100, -100]), 1050.5);
    assert.equal(runningPcs([0, 0, 0]), 0);
  });
});

describe("4. WO scrap 6.400 kg increases same-alloy scrap only", () => {
  it("turning scrap must match parent alloy", () => {
    assert.throws(
      () =>
        assertAlloyMatch({
          lotAlloyCode: "C36000",
          itemAlloyCode: "CW617N",
          context: "WO turning scrap",
        }),
      /WO turning scrap/,
    );
    const gap = yieldGap({
      issuedKg: 509.069,
      goodKg: 471.36,
      rejectKg: 3.84,
      scrapKg: 6.4,
    });
    assert.equal(gap.accountedKg, 481.6);
    assert.ok(gap.remainderKg > 0);
  });
});

describe("5. JW_OUT stays on company valuation", () => {
  it("OWN + valuation_eligible warehouse keeps value", () => {
    const v = moveValuePaise({
      qtyKg: 471.36,
      ratePaisePerKg: 78000,
      ownerType: "OWN",
      warehouseValuationEligible: true,
    });
    assert.equal(v, Math.round(471.36 * 78000));
    assert.ok(v > 0);
  });
});

describe("6. JW_IN 100 kg does not change inventory value", () => {
  it("CUSTOMER owner is always 0 even at a priced rate", () => {
    assert.equal(
      moveValuePaise({
        qtyKg: 100,
        ratePaisePerKg: 62000,
        ownerType: "CUSTOMER",
        warehouseValuationEligible: false,
      }),
      0,
    );
    assert.equal(
      moveValuePaise({
        qtyKg: 100,
        ratePaisePerKg: 62000,
        ownerType: "CUSTOMER",
        warehouseValuationEligible: true,
      }),
      0,
    );
  });
});

describe("7. JW return working (9820 / 9700 / 80 / 40 vs 1.5%)", () => {
  it("prints sent, accounted, actualLoss, norm, excess", () => {
    const kgPer = 0.048;
    const w = jwLossWorking({
      sentKg: 9820 * kgPer,
      goodKg: 9700 * kgPer,
      rejectKg: 80 * kgPer,
      scrapReturnedKg: 0,
      scrapRetainedKg: 0,
      lossNormPct: 1.5,
    });
    assert.equal(w.sentKg, 471.36);
    assert.equal(w.accountedKg, 469.44);
    assert.equal(w.actualLossKg, 1.92);
    assert.equal(w.normKg, 7.07);
    assert.equal(w.excessLossKg, 0);
  });
});

describe("8. Packing vs invoice mismatch > 0.001 kg blocks post", () => {
  it("240.001 vs 240.000 refuses generate", () => {
    const r = packingKgMatch(240, 240.001);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.delta, 0.001);
    assert.throws(() => assertPackingMatch(240, 240.001), /Dispatch blocked/);
    assert.doesNotThrow(() => assertPackingMatch(240, 240));
  });
});

describe("9. Challan > 330 days blocks new JW_OUT when setting on", () => {
  it("331d + setting on is blocked; setting off is not", () => {
    assert.equal(jwVendorBlocked({ ageDays: 331, blockDays: 330, settingOn: true }), true);
    assert.equal(jwVendorBlocked({ ageDays: 330, blockDays: 330, settingOn: true }), false);
    assert.equal(jwVendorBlocked({ ageDays: 400, blockDays: 330, settingOn: false }), false);
    assert.throws(
      () =>
        assertJwVendorAllowed({
          ageDays: 331,
          blockDays: 330,
          settingOn: true,
          docNo: "JW/26-27/000001",
        }),
      /330d/,
    );
  });
});

describe("10. GRN reversal posts opposite; original row remains", () => {
  it("notes encode REVERSES and original is not mutated", () => {
    const notes = encodeMoveNotes({
      reverseOf: 44,
      text: "Reversal of move #44 — original row remains",
    });
    assert.match(String(notes), /REVERSES:44/);
    assert.equal(parseReverseOf(notes), 44);
    assert.equal(parseReverseOf("Heat H26-0913 gross 1262.8"), null);
  });
});

describe("conversion + shop complete gates", () => {
  it("0.1% FG conversion refuses 240.300 vs 240 pcs × 1 kg", () => {
    assert.throws(
      () => assertConversion({ qtyKg: 240.3, qtyPcs: 240, kgPerPc: 1, kind: "FG" }),
      /0.1%/,
    );
  });
  it("blocks complete when issued + 0.5% < theoretical", () => {
    const g = woCompleteCheck({ issuedKg: 10, goodPcs: 1000, rejectPcs: 0, kgPerPc: 0.048, tolerancePct: 0.5 });
    assert.equal(g.ok, false);
    const ok = woCompleteCheck({ issuedKg: 509, goodPcs: 9820, rejectPcs: 80, kgPerPc: 0.048, tolerancePct: 0.5 });
    assert.equal(ok.ok, true);
    assert.equal(ok.theoreticalKg, 475.2);
  });
});
