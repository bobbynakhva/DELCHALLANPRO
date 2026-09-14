import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  billMatchLines,
  excessLossLines,
  invoiceJournalLines,
  linesBalance,
  linesForStockMove,
} from "./journal-math.ts";

describe("stock move journals", () => {
  it("GRN → Dr RM Cr GRNI", () => {
    const lines = linesForStockMove({
      type: "GRN_RECEIPT",
      qtyKg: 1250.5,
      valuePaise: Math.round(1250.5 * 62000),
      warehouseKind: "RM",
      warehouseCode: "RM-ROD",
      ownerType: "OWN",
    });
    assert.equal(lines[0]!.account, "1110");
    assert.equal(lines[1]!.account, "2110");
    assert.ok(linesBalance(lines));
  });

  it("WO issue → Dr WIP Cr RM", () => {
    const lines = linesForStockMove({
      type: "WO_ISSUE",
      qtyKg: -518.4,
      valuePaise: -Math.round(518.4 * 62000),
      warehouseKind: "RM",
      warehouseCode: "RM-ROD",
      ownerType: "OWN",
    });
    assert.equal(lines[0]!.account, "1130");
    assert.equal(lines[1]!.account, "1110");
    assert.ok(linesBalance(lines));
  });

  it("JW_OUT destination leg is skipped; source leg books JW-OUT", () => {
    const src = linesForStockMove({
      type: "JW_OUT",
      qtyKg: -471.36,
      valuePaise: -Math.round(471.36 * 78000),
      warehouseKind: "SFG",
      warehouseCode: "SFG",
      ownerType: "OWN",
    });
    assert.equal(src[0]!.account, "1150");
    const dest = linesForStockMove({
      type: "JW_OUT",
      qtyKg: 471.36,
      valuePaise: Math.round(471.36 * 78000),
      warehouseKind: "JW_OUT",
      warehouseCode: "JW-OUT",
      ownerType: "OWN",
    });
    assert.equal(dest.length, 0);
  });

  it("customer JW_IN is silent", () => {
    assert.equal(
      linesForStockMove({
        type: "JW_IN_RECEIVE",
        qtyKg: 100,
        valuePaise: 0,
        warehouseKind: "JW_IN",
        warehouseCode: "JW-IN-CUSTOMER",
        ownerType: "CUSTOMER",
      }).length,
      0,
    );
  });

  it("excess loss → Dr 5130 Cr JW-OUT", () => {
    const lines = excessLossLines(150000);
    assert.equal(lines[0]!.account, "5130");
    assert.equal(lines[1]!.account, "1150");
    assert.ok(linesBalance(lines));
  });

  it("MELT_CHARGE dest is silent; source Dr 1130 Cr inv", () => {
    const src = linesForStockMove({
      type: "MELT_CHARGE",
      qtyKg: -100,
      valuePaise: -Math.round(100 * 58000),
      warehouseKind: "SCRAP",
      warehouseCode: "RM-SCRAP",
      ownerType: "OWN",
    });
    assert.equal(src[0]!.account, "1130");
    assert.equal(src[1]!.account, "1120");
    assert.ok(linesBalance(src));
    const dest = linesForStockMove({
      type: "MELT_CHARGE",
      qtyKg: 100,
      valuePaise: Math.round(100 * 58000),
      warehouseKind: "WIP",
      warehouseCode: "WIP-MELT",
      ownerType: "OWN",
    });
    assert.equal(dest.length, 0);
  });

  it("MELT_YIELD_LOSS Dr 5120 Cr 1130", () => {
    const lines = linesForStockMove({
      type: "MELT_YIELD_LOSS",
      qtyKg: -2,
      valuePaise: -Math.round(2 * 58000),
      warehouseKind: "WIP",
      warehouseCode: "WIP-MELT",
      ownerType: "OWN",
    });
    assert.equal(lines[0]!.account, "5120");
    assert.equal(lines[1]!.account, "1130");
    assert.ok(linesBalance(lines));
  });

  it("OPENING_STOCK OWN Dr inventory Cr 3100; CUSTOMER silent", () => {
    const own = linesForStockMove({
      type: "OPENING_STOCK",
      qtyKg: 50,
      valuePaise: 3100000,
      warehouseKind: "RM",
      warehouseCode: "CUTOVER-RM",
      ownerType: "OWN",
    });
    assert.equal(own[0]!.account, "1110");
    assert.equal(own[1]!.account, "3100");
    assert.ok(linesBalance(own));
    assert.equal(
      linesForStockMove({
        type: "OPENING_STOCK",
        qtyKg: 5,
        valuePaise: 0,
        warehouseKind: "JW_IN",
        warehouseCode: "CUTOVER-JW-IN",
        ownerType: "CUSTOMER",
      }).length,
      0,
    );
  });

  it("invoice Dr debtors Cr sales + output GST", () => {
    const lines = invoiceJournalLines({
      isExport: false,
      taxablePaise: 100000,
      cgstPaise: 9000,
      sgstPaise: 9000,
      igstPaise: 0,
      totalPaise: 118000,
    });
    assert.ok(linesBalance(lines));
    assert.equal(lines.find((l) => l.account === "2200")?.debit, 118000);
    assert.equal(lines.find((l) => l.account === "4110")?.credit, 100000);
  });

  it("3-way bill Dr GRNI + ITC Cr creditors", () => {
    const lines = billMatchLines({ taxablePaise: 100000, cgstPaise: 9000, sgstPaise: 9000, igstPaise: 0 });
    assert.ok(linesBalance(lines));
    assert.equal(lines.find((l) => l.account === "2110")?.debit, 100000);
    assert.equal(lines.find((l) => l.account === "2120")?.credit, 118000);
  });
});
