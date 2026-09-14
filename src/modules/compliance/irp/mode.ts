import type { NicMode } from "./types.ts";

const REDACT = /("?(?:password|clientSecret|client_secret|secret|pwd|authToken|AuthToken)"?\s*[:=]\s*")[^"]*/gi;

export function redactJson(v: unknown): string {
  try {
    return JSON.stringify(v).replace(REDACT, "$1***");
  } catch {
    return "";
  }
}

export function resolveNicMode(kind: "EINVOICE" | "EWAY", settingValue?: string | null): NicMode {
  const envName = kind === "EINVOICE" ? "EINVOICE_MODE" : "EWAY_MODE";
  const raw = (typeof process !== "undefined" ? process.env[envName] : undefined) ?? settingValue ?? "stub";
  const v = String(raw).trim().toLowerCase();
  if (v === "sandbox" || v === "off" || v === "stub") return v;
  return "stub";
}

export function sandboxCredentials(kind: "EINVOICE" | "EWAY"): {
  gstin: string;
  username: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
} {
  const prefix = kind === "EINVOICE" ? "GST_IRP" : "GST_EWB";
  const gstin = process.env[`${prefix}_GSTIN`]?.trim();
  const username = process.env[`${prefix}_USERNAME`]?.trim();
  const password = process.env[`${prefix}_PASSWORD`]?.trim();
  if (!gstin || !username || !password) {
    throw new Error(
      kind === "EINVOICE"
        ? "E-invoice sandbox is not configured. Set GST_IRP_GSTIN, GST_IRP_USERNAME and GST_IRP_PASSWORD. Never commit secrets."
        : "E-way sandbox is not configured. Set GST_EWB_GSTIN, GST_EWB_USERNAME and GST_EWB_PASSWORD. Never commit secrets.",
    );
  }
  return {
    gstin,
    username,
    password,
    clientId: process.env[`${prefix}_CLIENT_ID`]?.trim(),
    clientSecret: process.env[`${prefix}_CLIENT_SECRET`]?.trim(),
    baseUrl: process.env[`${prefix}_BASE_URL`]?.trim(),
  };
}

export function assertModeAllows(kind: "EINVOICE" | "EWAY", mode: NicMode): void {
  const label = kind === "EINVOICE" ? "E-invoice" : "E-way";
  const env = kind === "EINVOICE" ? "EINVOICE_MODE" : "EWAY_MODE";
  if (mode === "off") throw new Error(`${label} is switched off (${env}=off).`);
  if (mode === "sandbox") sandboxCredentials(kind);
}
