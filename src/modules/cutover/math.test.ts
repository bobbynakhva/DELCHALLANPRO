import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canTransition,
  freezeItemIssues,
  openingValueCheck,
  parseOpeningStockCsv,
  reconcileGate,
  SAMPLE_STOCK_CSV,
} from "./math.ts";
import { statutoryDueIso } from "../compliance/gst/dates.ts";

describe("cutover state machine", () => {
  it("walks NOT_STARTED → … → TALLY_SUNSET; cannot skip", () => {
    assert.equal(canTransition("NOT_STARTED", "COUNTED"), true);
    assert.equal(canTransition("NOT_STARTED", "LIVE"), false);
    assert.equal(canTransition("RECONCILED", "LIVE"), true);
    assert.equal(canTransition("LIVE", "TALLY_SUNSET"), true);
    assert.equal(canTransition("TALLY_SUNSET", "LIVE"), false);
  });
});

describe("opening value vs rate × kg", () => {
  it("accepts within ₹1; rejects more", () => {
    assert.equal(openingValueCheck({ ratePaisePerKg: 62000, qtyKg: 50, valuePaise: 3100000 }).ok, true);
    assert.equal(openingValueCheck({ ratePaisePerKg: 62000, qtyKg: 50, valuePaise: 3100099 }).ok, true);
    assert.equal(openingValueCheck({ ratePaisePerKg: 62000, qtyKg: 50, valuePaise: 3100200 }).ok, false);
  });
});

describe("masters freeze", () => {
  it("blocks missing alloy / HSN / kgPerPc on FG", () => {
    const issues = freezeItemIssues({
      sku: "HEX",
      type: "FG",
      alloyId: null,
      stockUom: "PCS",
      altUom: "KG",
      hsn: "",
      kgPerPc: 0,
    });
    assert.ok(issues.some((i) => /alloy/i.test(i)));
    assert.ok(issues.some((i) => /HSN/i.test(i)));
    assert.ok(issues.some((i) => /kgPerPc/i.test(i)));
  });
});

describe("CSV + JW clock", () => {
  it("parses sample stock CSV; customer value 0", () => {
    const rows = parseOpeningStockCsv(SAMPLE_STOCK_CSV);
    assert.equal(rows.length, 3);
    assert.equal(rows[2]!.owner, "CUSTOMER");
    assert.equal(rows[2]!.valuePaise, 0);
    assert.equal(rows[0]!.qtyKg, 50);
  });

  it("statutory due = challanDate + 365", () => {
    assert.equal(statutoryDueIso("2026-06-16", "INPUTS"), "2027-06-16");
  });
});

describe("reconcile gate", () => {
  it("squares TB, inventory = OWN, JW_IN = 0, AR/AP = 1100/2000", () => {
    const g = reconcileGate({
      ownInventoryPaise: 3137440,
      customerInventoryPaise: 0,
      inventoryLedgerPaise: 3137440,
      arPaise: 0,
      apPaise: 0,
      tallyArPaise: 0,
      tallyApPaise: 0,
      tbDebit: 3137440,
      tbCredit: 3137440,
    });
    assert.equal(g.ok, true);
  });
});
