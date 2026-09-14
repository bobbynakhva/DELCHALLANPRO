import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDaysIso, formatDateIN, statutoryDueIso } from "./gst/dates.ts";
import { classifySupply, gstBreakup } from "./gst/tax.ts";
import { invoicePrintIssues, packingGenerateBlocked } from "./gst/validate.ts";
import { validateDocSerial } from "./gst/serial.ts";
import { amountInWordsINR } from "./gst/words.ts";
import {
  FIX_EXPORT_IGST,
  FIX_EXPORT_LUT,
  FIX_INVOICE_GJ,
  FIX_INVOICE_MH,
  FIX_PACKING,
  FIX_SERIAL_BLOCK,
} from "./documents/fixtures.ts";

describe("GST serial (Rule 46)", () => {
  it("accepts a 16-char legal serial", () => {
    assert.equal(validateDocSerial("TI/26-27/000184").ok, true);
    assert.equal(validateDocSerial("JW/26-27/000041").ok, true);
    assert.equal(validateDocSerial("CN/26-27/000012").ok, true);
  });
  it("rejects serial with # or 17 chars", () => {
    const hash = validateDocSerial("INV/26-27/#001");
    assert.equal(hash.ok, false);
    const long = validateDocSerial("DC-JW/25-26/000041"); // 18 chars
    assert.equal(long.ok, false);
    assert.match((long as { error: string }).error, /16 characters/);
  });
});

describe("GST tax heads", () => {
  const taxable = 20695000; // ₹2,06,950 in paise
  it("GJ→GJ = CGST+SGST, no IGST", () => {
    const k = classifySupply({ fromState: "24", toState: "24", isExport: false });
    assert.equal(k, "INTRA");
    const t = gstBreakup({ taxablePaise: taxable, gstPct: 18, fromState: "24", toState: "24", isExport: false });
    assert.equal(t.igst, 0);
    assert.equal(t.cgst + t.sgst, Math.round(taxable * 0.18));
    assert.ok(t.cgst > 0 && t.sgst > 0);
  });
  it("GJ→MH = IGST only", () => {
    const k = classifySupply({ fromState: "24", toState: "27", isExport: false });
    assert.equal(k, "INTER");
    const t = gstBreakup({ taxablePaise: taxable, gstPct: 18, fromState: "24", toState: "27", isExport: false });
    assert.equal(t.cgst, 0);
    assert.equal(t.sgst, 0);
    assert.equal(t.igst, Math.round(taxable * 0.18));
  });
  it("export LUT = 0 tax", () => {
    const k = classifySupply({ fromState: "24", toState: null, isExport: true, exportMode: "LUT" });
    assert.equal(k, "EXPORT_LUT");
    const t = gstBreakup({
      taxablePaise: taxable,
      gstPct: 18,
      fromState: "24",
      isExport: true,
      exportMode: "LUT",
    });
    assert.deepEqual(t, { cgst: 0, sgst: 0, igst: 0 });
  });
  it("export IGST-paid = IGST only", () => {
    const k = classifySupply({ fromState: "24", isExport: true, exportMode: "IGST" });
    assert.equal(k, "EXPORT_IGST");
    const t = gstBreakup({
      taxablePaise: taxable,
      gstPct: 18,
      fromState: "24",
      isExport: true,
      exportMode: "IGST",
    });
    assert.equal(t.cgst, 0);
    assert.equal(t.sgst, 0);
    assert.equal(t.igst, Math.round(taxable * 0.18));
  });
});

describe("s.143 statutory due", () => {
  it("challan 13/09/2026 inputs due 13/09/2027", () => {
    assert.equal(addDaysIso("2026-09-13", 365), "2027-09-13");
    assert.equal(statutoryDueIso("2026-09-13", "INPUTS"), "2027-09-13");
    assert.equal(formatDateIN("2026-09-13"), "13/09/2026");
    assert.equal(formatDateIN("2027-09-13"), "13/09/2027");
  });
  it("capital goods due +3 years", () => {
    assert.equal(statutoryDueIso("2026-09-13", "CAPITAL"), "2029-09-13");
  });
});

describe("amount in words", () => {
  it("formats Indian grouping words", () => {
    assert.equal(amountInWordsINR(24420100), "Rupees Two Lakh Forty Four Thousand Two Hundred One Only");
  });
});

describe("invoice print blocks", () => {
  it("blocks intra-state line carrying IGST", () => {
    const issues = invoicePrintIssues({
      docNo: "INV/26-27/0001",
      kind: "INTRA",
      buyerRegistered: true,
      buyerGstin: "24AAGCG5520F1Z6",
      lines: [{ sl: 1, hsn: "741220", cgstPaise: 0, sgstPaise: 0, igstPaise: 100 }],
    });
    assert.ok(issues.some((i) => i.code === "INTRA_IGST" && i.level === "block"));
  });
  it("blocks packing weight mismatch > 0.001 kg", () => {
    const issues = invoicePrintIssues({
      docNo: "INV/26-27/0001",
      kind: "INTRA",
      buyerRegistered: true,
      buyerGstin: "24AAGCG5520F1Z6",
      lines: [{ sl: 1, hsn: "741220", cgstPaise: 1, sgstPaise: 1, igstPaise: 0 }],
      invoiceNetKg: 240,
      packingNetKg: 241,
    });
    assert.ok(issues.some((i) => i.code === "WEIGHT" && i.level === "block"));
  });
});

describe("fixture documents", () => {
  it("GJ invoice has no print blocks", () => {
    const issues = invoicePrintIssues({
      docNo: FIX_INVOICE_GJ.docNo,
      kind: FIX_INVOICE_GJ.kind,
      buyerRegistered: true,
      buyerGstin: FIX_INVOICE_GJ.billTo.gstin,
      lines: FIX_INVOICE_GJ.lines,
      invoiceNetKg: FIX_INVOICE_GJ.netKg,
      packingNetKg: FIX_INVOICE_GJ.packingNetKg,
    });
    assert.equal(issues.filter((i) => i.level === "block").length, 0);
    assert.equal(FIX_INVOICE_GJ.kind, "INTRA");
    assert.ok(FIX_INVOICE_GJ.cgstPaise > 0 && FIX_INVOICE_GJ.sgstPaise > 0);
    assert.equal(FIX_INVOICE_GJ.igstPaise, 0);
  });
  it("MH invoice is IGST only", () => {
    assert.equal(FIX_INVOICE_MH.kind, "INTER");
    assert.equal(FIX_INVOICE_MH.cgstPaise, 0);
    assert.ok(FIX_INVOICE_MH.igstPaise > 0);
  });
  it("export LUT is zero tax + declaration", () => {
    assert.equal(FIX_EXPORT_LUT.kind, "EXPORT_LUT");
    assert.equal(FIX_EXPORT_LUT.cgstPaise + FIX_EXPORT_LUT.sgstPaise + FIX_EXPORT_LUT.igstPaise, 0);
    assert.equal(FIX_EXPORT_LUT.export?.mode, "LUT");
  });
  it("export IGST-paid is IGST only", () => {
    assert.equal(FIX_EXPORT_IGST.kind, "EXPORT_IGST");
    assert.equal(FIX_EXPORT_IGST.cgstPaise, 0);
    assert.ok(FIX_EXPORT_IGST.igstPaise > 0);
  });
  it("illegal serial fixture is blocked", () => {
    const issues = invoicePrintIssues({
      docNo: FIX_SERIAL_BLOCK.docNo,
      kind: FIX_SERIAL_BLOCK.kind,
      buyerRegistered: true,
      buyerGstin: FIX_SERIAL_BLOCK.billTo.gstin,
      lines: FIX_SERIAL_BLOCK.lines,
    });
    assert.ok(issues.some((i) => i.code === "SERIAL" && i.level === "block"));
  });
  it("packing list matches invoice net kg", () => {
    assert.equal(packingGenerateBlocked(FIX_PACKING.invoiceNetKg, FIX_PACKING.packingNetKg), false);
    assert.equal(FIX_PACKING.packingNetKg, 240);
  });
});
