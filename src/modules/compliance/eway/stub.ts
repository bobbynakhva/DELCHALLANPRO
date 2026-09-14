/** 12-digit stub EWB. Does not post stock. */
import { createHash } from "node:crypto";
import { ewayValidity } from "./map.ts";
import type { EwayPartA, EwayPartB, EwaySimulate, StubEwayResult } from "./types.ts";

export function stubEwbNo(partA: EwayPartA): string {
  const key = `${partA.fromGstin}|${partA.docType}|${partA.docNo}|${partA.docDate}|${partA.totalValue}`;
  const hex = createHash("sha256").update(key).digest("hex");
  const n = BigInt("0x" + hex.slice(0, 15)) % 10n ** 12n;
  return n.toString().padStart(12, "0");
}

export function stubGenerateEway(
  partA: EwayPartA,
  partB: EwayPartB | null,
  opts?: { simulate?: EwaySimulate; now?: Date },
): StubEwayResult {
  if (opts?.simulate === "invalidGstin") throw new Error("Invalid GSTIN — e-way rejected (stub).");
  if (opts?.simulate === "duplicate") throw new Error("Duplicate e-way — document already reported (stub).");
  const ewbNo = stubEwbNo(partA);
  let validFrom: string | null = null;
  let validUntil: string | null = null;
  if (partB) {
    const v = ewayValidity(opts?.now ?? new Date(), partB.transDistance);
    validFrom = v.validFrom.toISOString();
    validUntil = v.validUntil.toISOString();
  }
  return { ewbNo, validFrom, validUntil, partA, partB, status: "ACT" };
}
