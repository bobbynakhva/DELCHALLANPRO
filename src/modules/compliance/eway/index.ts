export * from "./types.ts";
export * from "./map.ts";
export * from "./stub.ts";

import { assertModeAllows, resolveNicMode } from "../irp/mode.ts";
import { stubGenerateEway } from "./stub.ts";
import type { EwayPartA, EwayPartB, EwaySimulate, StubEwayResult } from "./types.ts";
import type { NicMode } from "../irp/types.ts";

export function generateEwayViaMode(
  partA: EwayPartA,
  partB: EwayPartB | null,
  opts?: { mode?: NicMode; setting?: string | null; simulate?: EwaySimulate; now?: Date },
): StubEwayResult {
  const mode = opts?.mode ?? resolveNicMode("EWAY", opts?.setting);
  assertModeAllows("EWAY", mode);
  return stubGenerateEway(partA, partB, { simulate: opts?.simulate, now: opts?.now });
}
