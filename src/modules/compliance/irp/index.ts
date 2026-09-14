export * from "./types.ts";
export * from "./map.ts";
export * from "./stub.ts";
export * from "./mode.ts";

import { resolveNicMode, assertModeAllows } from "./mode.ts";
import { stubGenerateIrn } from "./stub.ts";
import type { IrpPayload, IrpSimulate, NicMode, StubIrnResult } from "./types.ts";

export function generateIrnViaMode(
  payload: IrpPayload,
  opts?: { mode?: NicMode; setting?: string | null; simulate?: IrpSimulate; now?: Date },
): StubIrnResult {
  const mode = opts?.mode ?? resolveNicMode("EINVOICE", opts?.setting);
  assertModeAllows("EINVOICE", mode);
  return stubGenerateIrn(payload, { simulate: opts?.simulate, now: opts?.now });
}
