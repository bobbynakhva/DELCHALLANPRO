import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { meltYieldWorking, spectroVsAlloy } from "./math.ts";

const C360 = {
  code: "C36000",
  cu_pct: 61.5,
  zn_pct: 35.4,
  pb_pct: 3.1,
  cu_min_pct: 60,
  cu_max_pct: 63,
  zn_min_pct: 33.4,
  zn_max_pct: 37.4,
  pb_min_pct: 2.6,
  pb_max_pct: 3.6,
};

describe("spectro vs alloy min/max", () => {
  it("PASS inside band; FAIL outside blocks pour", () => {
    assert.equal(spectroVsAlloy({ cuPct: 61.4, znPct: 35.5, pbPct: 3.1 }, C360).passed, true);
    const fail = spectroVsAlloy({ cuPct: 50, znPct: 35.5, pbPct: 3.1 }, C360);
    assert.equal(fail.passed, false);
    assert.match(fail.reasons.join(" "), /Cu/);
  });
});

describe("melt yield", () => {
  it("100 charged − 80 good − 15 runner − 3 dross = 2.000 loss (2%, no override)", () => {
    const w = meltYieldWorking({ chargedKg: 100, goodKg: 80, runnerKg: 15, drossKg: 3, rejectKg: 0 });
    assert.equal(w.lossKg, 2);
    assert.equal(w.lossPct, 2);
    assert.equal(w.needsOwnerOverride, false);
  });

  it("loss over 3% needs Owner override", () => {
    const w = meltYieldWorking({ chargedKg: 100, goodKg: 90, runnerKg: 0, drossKg: 0, rejectKg: 0 });
    assert.equal(w.lossKg, 10);
    assert.equal(w.needsOwnerOverride, true);
  });
});
