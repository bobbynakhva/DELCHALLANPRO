import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FIX_INVOICE_GJ, FIX_INVOICE_MH } from "../documents/fixtures.ts";
import { mapChallanToEwayPartA, mapInvoiceToEwayPartA, mapPartB, ewayRequired, ewayValidity } from "./map.ts";
import { stubGenerateEway } from "./stub.ts";
import type { DeliveryChallanDoc } from "../documents/types.ts";
import { TAMBA } from "../documents/fixtures.ts";

function challan(): DeliveryChallanDoc {
  return {
    title: "DELIVERY CHALLAN",
    variant: "JW_OUT",
    docNo: "JW/26-27/0003",
    docDate: "2026-09-13",
    company: TAMBA,
    consigner: TAMBA,
    consignee: {
      name: "Kiran Platers",
      gstin: "24AAKPK4410D1Z8",
      addressLine1: "Vatva GIDC",
      city: "Ahmedabad",
      state: "Gujarat",
      stateCode: "24",
      pincode: "382445",
      country: "IN",
      registered: true,
    },
    processName: "Ni-Cr",
    goodsKind: "INPUTS",
    expectedReturn: "2026-09-27",
    statutoryDue: "2027-09-13",
    interState: false,
    reasonCode: "3",
    lines: [
      {
        sl: 1,
        description: "Hex nipple",
        hsn: "74122019",
        uqc: "NOS",
        qtyNos: 9820,
        qtyKgs: 471.36,
        taxablePaise: 20690740,
        discountPaise: 0,
        gstPct: 18,
        cgstPaise: 0,
        sgstPaise: 0,
        igstPaise: 0,
        lineTotalPaise: 20690740,
      },
    ],
    taxablePaise: 20690740,
    gstPct: 18,
    taxPaise: 0,
  };
}

describe("e-way Part A", () => {
  it("JW challan is Job Work not Supply — subSupplyType 3 / CHL", () => {
    const a = mapChallanToEwayPartA(challan());
    assert.equal(a.subSupplyType, "3");
    assert.equal(a.docType, "CHL");
    assert.equal(a.transType, "3");
    assert.equal(a.subSupplyDesc, "Job Work");
    assert.notEqual(a.docType, "INV");
  });

  it("invoice is Supply / INV", () => {
    const a = mapInvoiceToEwayPartA(FIX_INVOICE_GJ);
    assert.equal(a.subSupplyType, "1");
    assert.equal(a.docType, "INV");
    assert.equal(a.billToGstin, FIX_INVOICE_GJ.billTo.gstin);
  });

  it("required when inter-state or over threshold or JW force", () => {
    assert.equal(ewayRequired({ valuePaise: 100, thresholdPaise: 5_000_000, interState: true }), true);
    assert.equal(ewayRequired({ valuePaise: 100, thresholdPaise: 5_000_000, interState: false }), false);
    assert.equal(ewayRequired({ valuePaise: 6_000_000, thresholdPaise: 5_000_000, interState: false }), true);
    assert.equal(ewayRequired({ valuePaise: 100, thresholdPaise: 5_000_000, interState: false, jwForce: true }), true);
  });
});

describe("e-way Part B", () => {
  it("sets validFrom; skip vehicle only ≤50 km same state", () => {
    const b = mapPartB({ vehicle: "GJ01AB1234", distanceKm: 18, sameState: true });
    assert.equal(b.vehicleNo, "GJ01AB1234");
    const v = ewayValidity(new Date("2026-09-14T06:00:00Z"), 18);
    assert.equal(v.validFrom.toISOString(), "2026-09-14T06:00:00.000Z");
    assert.ok(v.validUntil > v.validFrom);
    assert.throws(() => mapPartB({ skipSameState50km: true, distanceKm: 80, sameState: true }), /50 km/);
    const skip = mapPartB({ skipSameState50km: true, distanceKm: 18, sameState: true });
    assert.equal(skip.vehicleNo, "");
  });

  it("12-digit EWB; generating e-way does not mention stock", () => {
    const a = mapChallanToEwayPartA(challan());
    const b = mapPartB({ vehicle: "GJ01AB1234", distanceKm: 18, sameState: true });
    const r = stubGenerateEway(a, b, { now: new Date("2026-09-14T06:00:00Z") });
    assert.equal(r.ewbNo.length, 12);
    assert.match(r.ewbNo, /^\d{12}$/);
    assert.ok(r.validFrom);
    const src = `${JSON.stringify(r)}`;
    assert.equal(/stock_move|postMove|qty_kg/i.test(src), false);
  });

  it("inter-state invoice is required", () => {
    const a = mapInvoiceToEwayPartA(FIX_INVOICE_MH);
    assert.equal(a.toStateCode, 27);
    assert.equal(
      ewayRequired({ valuePaise: FIX_INVOICE_MH.totalPaise, thresholdPaise: 5_000_000, interState: true }),
      true,
    );
  });
});
