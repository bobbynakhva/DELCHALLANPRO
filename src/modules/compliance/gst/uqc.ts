/** GSTN UQC list (subset used by a brass shop). Default KGS + NOS on metal/FG lines. */

export const UQC = {
  KGS: { code: "KGS", name: "KILOGRAMS" },
  NOS: { code: "NOS", name: "NUMBERS" },
  MTS: { code: "MTS", name: "METRIC TON" },
  BOX: { code: "BOX", name: "BOX" },
  SET: { code: "SET", name: "SET" },
  SAC: { code: "SAC", name: "SERVICE" },
} as const;

export type UqcCode = keyof typeof UQC;

export function uqcFromItem(stockUom: string | null | undefined, altUom?: string | null): {
  primary: UqcCode;
  secondary?: UqcCode;
} {
  const a = (stockUom ?? "").toUpperCase();
  const b = (altUom ?? "").toUpperCase();
  const map = (u: string): UqcCode | null => {
    if (u === "KG" || u === "KGS") return "KGS";
    if (u === "PCS" || u === "NOS" || u === "PC") return "NOS";
    if (u === "MT" || u === "MTS") return "MTS";
    return null;
  };
  const p = map(a) ?? "NOS";
  const s = map(b);
  return { primary: p, secondary: s && s !== p ? s : p === "NOS" ? "KGS" : "NOS" };
}
