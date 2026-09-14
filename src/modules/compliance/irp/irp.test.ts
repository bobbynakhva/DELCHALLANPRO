import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FIX_EXPORT_IGST, FIX_EXPORT_LUT, FIX_INVOICE_GJ, FIX_INVOICE_MH } from "../documents/fixtures.ts";
import { assertValDtlsMatch, mapInvoiceToIrpPayload, rupees2 } from "./map.ts";
import { assertCancelWindow, CANCEL_CREDIT_NOTE_MSG, stubGenerateIrn } from "./stub.ts";
import { resolveNicMode } from "./mode.ts";
import { generateIrnViaMode } from "./index.ts";

describe("mapInvoiceToIrpPayload", () => {
  it("intra → B2B CGST+SGST, FG line is one NOS row", () => {
    const p = mapInvoiceToIrpPayload(FIX_INVOICE_GJ);
    assert.equal(p.TranDtls.SupTyp, "B2B");
    assert.equal(p.DocDtls.Typ, "INV");
    assert.ok(p.DocDtls.No.length <= 16);
    assert.match(p.DocDtls.Dt, /^\d{2}\/\d{2}\/\d{4}$/);
    assert.equal(p.ItemList.length, 1);
    assert.equal(p.ItemList[0]!.Unit, "NOS");
    assert.equal(p.ItemList[0]!.Qty, 5000);
    assert.equal(p.ItemList[0]!.HsnCd, "741220");
    assert.ok(p.ValDtls.CgstVal > 0 && p.ValDtls.SgstVal > 0);
    assert.equal(p.ValDtls.IgstVal, 0);
    assert.equal(p.ValDtls.TotInvVal, rupees2(FIX_INVOICE_GJ.totalPaise));
    assert.equal(p.ShipDtls, undefined);
  });

  it("inter → IGST only", () => {
    const p = mapInvoiceToIrpPayload(FIX_INVOICE_MH);
    assert.equal(p.ValDtls.CgstVal, 0);
    assert.equal(p.ValDtls.SgstVal, 0);
    assert.ok(p.ValDtls.IgstVal > 0);
  });

  it("export LUT = EXPWOP zero tax; IGST-paid = EXPWP", () => {
    const lut = mapInvoiceToIrpPayload(FIX_EXPORT_LUT);
    assert.equal(lut.TranDtls.SupTyp, "EXPWOP");
    assert.equal(lut.ValDtls.IgstVal, 0);
    const igst = mapInvoiceToIrpPayload(FIX_EXPORT_IGST);
    assert.equal(igst.TranDtls.SupTyp, "EXPWP");
    assert.ok(igst.ValDtls.IgstVal > 0);
  });

  it("blocks IRN when ValDtls drifts from snapshot", () => {
    const p = mapInvoiceToIrpPayload(FIX_INVOICE_GJ);
    p.ValDtls.TotInvVal = roundShift(p.ValDtls.TotInvVal);
    assert.throws(() => assertValDtlsMatch(p, FIX_INVOICE_GJ), /IRN blocked/);
  });
});

function roundShift(v: number): number {
  return v + 1;
}

describe("stub IRN", () => {
  it("same payload → same IRN", () => {
    const p = mapInvoiceToIrpPayload(FIX_INVOICE_GJ);
    const a = stubGenerateIrn(p, { now: new Date("2026-09-14T06:00:00Z") });
    const b = stubGenerateIrn(p, { now: new Date("2026-09-14T09:00:00Z") });
    assert.equal(a.Irn, b.Irn);
    assert.equal(a.Irn.length, 64);
    assert.ok(a.SignedQR.includes(a.Irn));
    assert.ok(a.SignedQR.includes(FIX_INVOICE_GJ.company.gstin!));
  });

  it("cancel now OK; 25h later credit-note message", () => {
    const ack = "2026-09-14T06:00:00.000Z";
    assert.doesNotThrow(() => assertCancelWindow(ack, new Date("2026-09-14T06:30:00.000Z")));
    assert.throws(
      () => assertCancelWindow(ack, new Date("2026-09-15T07:00:00.000Z")),
      (e: Error) => e.message === CANCEL_CREDIT_NOTE_MSG,
    );
  });

  it("stub simulate invalid GSTIN / duplicate", () => {
    const p = mapInvoiceToIrpPayload(FIX_INVOICE_GJ);
    assert.throws(() => stubGenerateIrn(p, { simulate: "invalidGstin" }), /Invalid GSTIN/);
    assert.throws(() => stubGenerateIrn(p, { simulate: "duplicate" }), /Duplicate IRN/);
  });
});

describe("mode", () => {
  it("defaults to stub", () => {
    assert.equal(resolveNicMode("EINVOICE"), "stub");
    assert.equal(resolveNicMode("EWAY", "SANDBOX"), "sandbox");
  });

  it("sandbox without env is a readable error, not a crash", () => {
    const prev = process.env.EINVOICE_MODE;
    process.env.EINVOICE_MODE = "sandbox";
    delete process.env.GST_IRP_GSTIN;
    delete process.env.GST_IRP_USERNAME;
    delete process.env.GST_IRP_PASSWORD;
    try {
      const p0 = mapInvoiceToIrpPayload(FIX_INVOICE_GJ);
      assert.throws(() => generateIrnViaMode(p0), /GST_IRP_GSTIN/);
    } finally {
      if (prev === undefined) delete process.env.EINVOICE_MODE;
      else process.env.EINVOICE_MODE = prev;
    }
  });
});
