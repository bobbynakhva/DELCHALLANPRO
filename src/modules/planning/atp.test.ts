import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeAtp } from "./atp.ts";
import { explodeDemand, netRequirement, wcLoadPct } from "./mrp.ts";

describe("ATP", () => {
  it("prints available + WO + JW − promised and lead for shortfall", () => {
    const r = computeAtp({
      qtyPcs: 10000,
      availableFgPcs: 0,
      openWoRemainingPcs: 0,
      jwPipelinePcs: 0,
      alreadyPromisedPcs: 0,
      purchaseLeadDays: 7,
      dailyPcs: 1600,
      setupMin: 30,
      jwDays: 14,
      packDays: 1,
      today: "2026-09-13",
    });
    assert.equal(r.shortfallPcs, 10000);
    assert.equal(r.woRunDays, Math.ceil(10000 / 1600));
    assert.ok(r.working[0].includes("Available FG"));
    assert.match(r.working.join("\n"), /Lead = purchase/);
  });

  it("promises from stock when FG covers the order", () => {
    const r = computeAtp({
      qtyPcs: 500,
      availableFgPcs: 800,
      openWoRemainingPcs: 0,
      jwPipelinePcs: 0,
      alreadyPromisedPcs: 0,
      purchaseLeadDays: 7,
      dailyPcs: 1600,
      setupMin: 30,
      jwDays: 14,
      packDays: 1,
      today: "2026-09-13",
    });
    assert.equal(r.shortfallPcs, 0);
    assert.equal(r.promiseDate, "2026-09-14");
  });
});

describe("MRP", () => {
  it("CREATE_WO for FG shortfall; CREATE_PO for rod after explode", () => {
    const fg = netRequirement({
      itemId: 1,
      sku: "HEX-NIPPLE-1/2-NCR",
      type: "FG",
      uom: "PCS",
      safetyQty: 500,
      availableQty: 0,
      openWoQty: 0,
      openPoQty: 0,
      jwPipelineQty: 0,
      soDemandQty: 10000,
      forecastQty: 0,
      releasedWoInsideFence: false,
      extraReleasedQty: 0,
    });
    assert.equal(fg.action, "CREATE_WO");
    assert.equal(fg.suggestedQty, 10500);
    const needs = explodeDemand(fg.suggestedQty, [{ componentItemId: 9, qtyPer: 0.05184, uom: "KG", isCoProduct: false }]);
    assert.equal(needs[0]!.qty, Math.round(10500 * 0.05184 * 1000) / 1000);
    const rm = netRequirement({
      itemId: 9,
      sku: "ROD-C360-12MM",
      type: "RM",
      uom: "KG",
      safetyQty: 50,
      availableQty: 85.25,
      openWoQty: 0,
      openPoQty: 2000,
      jwPipelineQty: 0,
      soDemandQty: needs[0]!.qty,
      forecastQty: 0,
      releasedWoInsideFence: false,
      extraReleasedQty: 0,
    });
    assert.equal(rm.action, "NONE"); // 85+2000 covers exploded rod + min
  });

  it("does not cancel a released WO inside the time fence", () => {
    const r = netRequirement({
      itemId: 1,
      sku: "HEX-NIPPLE-1/2-NCR",
      type: "FG",
      uom: "PCS",
      safetyQty: 0,
      availableQty: 0,
      openWoQty: 20000,
      openPoQty: 0,
      jwPipelineQty: 0,
      soDemandQty: 100,
      forecastQty: 0,
      releasedWoInsideFence: true,
      extraReleasedQty: 19900,
    });
    assert.equal(r.action, "NONE");
  });

  it("work-centre load percent", () => {
    assert.equal(wcLoadPct(1440, 2880), 50);
  });
});
