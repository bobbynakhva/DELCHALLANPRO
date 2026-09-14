import type { Sql } from "@/lib/db";
import { n } from "@/lib/erp/format";
import { setting } from "@/lib/erp/core.server";
import {
  buildQuote,
  type MetalBasis,
  type MetalBook,
  type QuoteSnapshot,
  type TariffBite,
} from "./engine";

export async function loadMetalBook(sql: Sql, asOf: string): Promise<MetalBook> {
  const header = (
    await sql.query<{
      as_of_date: string;
      cu_paise_per_kg: number;
      zn_paise_per_kg: number;
      pb_paise_per_kg: number;
      source: string | null;
    }>(
      `select as_of_date, cu_paise_per_kg, zn_paise_per_kg, pb_paise_per_kg, source
         from metal_price where as_of_date <= $1 order by as_of_date desc limit 1`,
      [asOf],
    )
  )[0];
  if (!header) throw new Error(`No metal price book on or before ${asOf}`);
  const lines = await sql.query<{ instrument: string; rate_paise_per_kg: number; source: string }>(
    `select instrument, rate_paise_per_kg, source from metal_price_line where as_of_date = $1`,
    [header.as_of_date],
  );
  const pick = (inst: string, fallback: number) =>
    n(lines.find((l) => l.instrument === inst)?.rate_paise_per_kg) || fallback;
  return {
    asOfDate: String(header.as_of_date).slice(0, 10),
    source: header.source || lines[0]?.source || "manual",
    cuPaisePerKg: pick("CU_INR_KG", header.cu_paise_per_kg),
    znPaisePerKg: pick("ZN_INR_KG", header.zn_paise_per_kg),
    pbPaisePerKg: pick("PB_INR_KG", header.pb_paise_per_kg),
    brassScrapPaisePerKg: pick("BRASS_SCRAP_C360_KG", 41000),
  };
}

function mapProcess(code: string): string {
  const c = code.toUpperCase();
  if (c === "MACHINE" || c === "TURN" || c === "TURN_AUTO") return "TURN_AUTO";
  if (c === "NI_CR" || c === "PLATE" || c === "PLATE_NICR") return "PLATE_NICR";
  if (c === "POLISH") return "POLISH";
  if (c === "PACK" || c === "PACK_EXPORT") return "PACK_EXPORT";
  return c;
}

export async function loadTariffs(
  sql: Sql,
  opts: { itemId: number; family: string | null; partnerId?: number | null },
): Promise<{ bites: TariffBite[]; hasRouting: boolean }> {
  const ops = await sql.query<{
    process_code: string;
    is_subcontract: boolean;
    default_jw_partner_id: number | null;
  }>(
    `select ro.process_code, ro.is_subcontract, ro.default_jw_partner_id
       from routing r join routing_op ro on ro.routing_id = r.id
      where r.item_id = $1 and r.status = 'APPROVED'
      order by ro.seq`,
    [opts.itemId],
  );
  if (!ops[0]) return { bites: [], hasRouting: false };
  const bites: TariffBite[] = [];
  for (const op of ops) {
    const code = mapProcess(op.process_code);
    if (op.is_subcontract) {
      const rate = (
        await sql.query<{ rate_paise_per_pc: number }>(
          `select rate_paise_per_pc from partner_process_rate
            where process_code = $1
              and (item_family = $2 or item_family = '')
              and ($3::int is null or partner_id = $3)
            order by case when item_family = $2 then 0 else 1 end, id
            limit 1`,
          [op.process_code, opts.family ?? "", op.default_jw_partner_id ?? opts.partnerId ?? null],
        )
      )[0];
      bites.push({
        processCode: op.process_code,
        source: "PARTNER_RATE",
        paisePerPc: rate?.rate_paise_per_pc ?? 0,
        isSubcontract: true,
      });
    } else {
      const t = (
        await sql.query<{ rate_paise_per_pc: number }>(
          `select rate_paise_per_pc from process_tariff
            where process_code = $1 and (item_family = $2 or item_family = '' or item_id = $3)
              and effective_from <= current_date
              and (effective_to is null or effective_to >= current_date)
            order by case when item_id = $3 then 0 when item_family = $2 then 1 else 2 end
            limit 1`,
          [code, opts.family ?? "", opts.itemId],
        )
      )[0];
      bites.push({
        processCode: op.process_code,
        source: "OWN_TARIFF",
        paisePerPc: t?.rate_paise_per_pc ?? 0,
        isSubcontract: false,
      });
    }
  }
  return { bites, hasRouting: true };
}

export async function quoteItem(sql: Sql, opts: {
  itemId: number;
  asOf: string;
  basis?: MetalBasis;
  marginPct?: number;
  conversionOverride?: number;
  conversionReason?: string;
}): Promise<QuoteSnapshot> {
  const item = (
    await sql.query<{
      id: number;
      sku: string;
      kg_per_pc: string;
      recovery_factor: string;
      conversion_paise: number;
      packing_paise: number;
      overhead_paise: number;
      default_margin_paise: number;
      family: string | null;
      alloy_id: number | null;
      hsn: string | null;
    }>(`select * from item where id = $1`, [opts.itemId])
  )[0];
  if (!item) throw new Error("Item not found");
  const alloy = (
    await sql.query<{ code: string; cu_pct: string; zn_pct: string; pb_pct: string }>(
      `select code, cu_pct, zn_pct, pb_pct from alloy where id = $1`,
      [item.alloy_id],
    )
  )[0];
  if (!alloy) throw new Error("Item has no alloy — cannot quote anonymous brass");
  const book = await loadMetalBook(sql, opts.asOf);
  const basis = (opts.basis ?? (await setting(sql, "quote_metal_basis", "CU_ZN_BLEND"))) as MetalBasis;
  const recovery =
    n(item.recovery_factor) || n(await setting(sql, "default_recovery_factor", "1.08"));
  const { bites, hasRouting } = await loadTariffs(sql, { itemId: item.id, family: item.family });
  const marginPct = opts.marginPct ?? n(await setting(sql, "default_margin_pct", "3.9"));
  return buildQuote({
    kgPerPc: n(item.kg_per_pc),
    recoveryFactor: recovery,
    alloy: { code: alloy.code, cuPct: n(alloy.cu_pct), znPct: n(alloy.zn_pct), pbPct: n(alloy.pb_pct) },
    book,
    basis: basis === "ALLOY_DEALER_RATE" ? "ALLOY_DEALER_RATE" : "CU_ZN_BLEND",
    conversionPaise: opts.conversionOverride ?? item.conversion_paise,
    jwPaise: 0,
    packingPaise: item.packing_paise,
    overheadPaise: item.overhead_paise,
    marginPaise: item.default_margin_paise,
    marginPct,
    hsn: item.hsn,
    gstRatePct: 18,
    conversionReason: hasRouting ? null : opts.conversionReason ?? "NO_ROUTING",
    tariffs: hasRouting
      ? bites
      : [
          {
            processCode: "TURN_AUTO",
            source: "NO_ROUTING",
            paisePerPc: opts.conversionOverride ?? item.conversion_paise,
            isSubcontract: false,
          },
        ],
  });
}
