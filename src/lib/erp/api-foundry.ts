import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, erpSql, requireStaff } from "./core.server";
import { uid } from "./row";
import { companyFromRow } from "@/modules/compliance/documents/map";
import {
  addChargeLine,
  closeHeat,
  confirmCharge,
  createHeat,
  foundryEnabled,
  getHeatDetail,
  listHeats,
  pourAndKnockout,
  postSpectro,
} from "./foundry-service";
import { n } from "./format";

const auth = [authMiddleware];

export const listFoundry = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const enabled = await foundryEnabled(sql);
    const heats = enabled ? await listHeats(sql) : [];
    const recipes = enabled
      ? await sql.query<{ id: number; name: string; alloy_id: number; alloy: string }>(
          `select r.id, r.name, r.alloy_id, a.code as alloy from melt_recipe r join alloy a on a.id = r.alloy_id where r.status = 'ACTIVE'`,
        )
      : [];
    const alloys = enabled
      ? await sql.query<{ id: number; code: string; name: string }>(`select id, code, name from alloy order by id`)
      : [];
    const chargeLots = enabled
      ? await sql.query<{
          id: number;
          lot_no: string;
          qty_kg: string;
          sku: string;
          alloy: string | null;
          warehouse: string;
          alloy_id: number | null;
        }>(
          `select l.id, l.lot_no, l.qty_kg, i.sku, a.code as alloy, w.code as warehouse, l.alloy_id
             from stock_lot l
             join item i on i.id = l.item_id
             join warehouse w on w.id = l.warehouse_id
             left join alloy a on a.id = l.alloy_id
            where l.owner_type = 'OWN'
              and not w.is_outside_factory
              and not w.is_customer_owned
              and w.code <> 'WIP-MELT'
              and l.status = 'AVAILABLE'
              and l.qty_kg > 0.0005
              and i.type in ('RM','SCRAP')
            order by i.sku, l.lot_no`,
        )
      : [];
    return { enabled, heats, recipes, alloys, chargeLots };
  });

export const getHeat = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    return getHeatDetail(sql, data.id);
  });

export const createFoundryHeat = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      alloyId: z.coerce.number(),
      furnace: z.string().default("MELT-1"),
      recipeId: z.coerce.number().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "booking");
    const sql = await erpSql();
    return createHeat(sql, {
      alloyId: data.alloyId,
      furnace: data.furnace,
      recipeId: data.recipeId,
      userId: staff.user_id,
    });
  });

export const addFoundryCharge = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ heatId: z.coerce.number(), lotId: z.coerce.number(), qtyKg: z.coerce.number().positive() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "booking");
    const sql = await erpSql();
    return addChargeLine(sql, { ...data, userId: staff.user_id });
  });

export const confirmFoundryCharge = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ heatId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "booking");
    const sql = await erpSql();
    return confirmCharge(sql, { heatId: data.heatId, userId: staff.user_id });
  });

export const postFoundrySpectro = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      heatId: z.coerce.number(),
      cuPct: z.coerce.number(),
      znPct: z.coerce.number(),
      pbPct: z.coerce.number(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "qc_release");
    const sql = await erpSql();
    return postSpectro(sql, { ...data, userId: staff.user_id });
  });

export const pourFoundry = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      heatId: z.coerce.number(),
      goodKg: z.coerce.number().positive(),
      runnerKg: z.coerce.number().min(0).default(0),
      drossKg: z.coerce.number().min(0).default(0),
      rejectKg: z.coerce.number().min(0).default(0),
      drossToVariance: z.boolean().default(false),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "booking");
    const sql = await erpSql();
    return pourAndKnockout(sql, { ...data, userId: staff.user_id });
  });

export const closeFoundryHeat = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ heatId: z.coerce.number(), ownerOverride: z.boolean().default(false) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "booking");
    const sql = await erpSql();
    return closeHeat(sql, {
      heatId: data.heatId,
      userId: staff.user_id,
      ownerOverride: data.ownerOverride,
      role: staff.role,
    });
  });

export const getPourDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const pour = (
      await sql.query<{
        id: number;
        doc_no: string;
        good_kg: string;
        poured_at: string;
        heat_id: number;
        casting_lot_id: number | null;
      }>(`select * from melt_pour where id = $1`, [data.id])
    )[0];
    if (!pour) throw new Error("Pour slip not found");
    const detail = await getHeatDetail(sql, pour.heat_id);
    const company = (await sql.query<Record<string, unknown>>(`select * from company limit 1`))[0];
    const casting = pour.casting_lot_id
      ? (await sql.query<{ lot_no: string; heat_no: string | null }>(`select lot_no, heat_no from stock_lot where id = $1`, [
          pour.casting_lot_id,
        ]))[0]
      : null;
    return {
      title: "POUR SLIP" as const,
      docNo: pour.doc_no,
      docDate: pour.poured_at,
      heatNo: String(detail.heat.doc_no),
      furnace: String(detail.heat.furnace),
      alloy: String(detail.heat.alloy),
      goodKg: n(pour.good_kg),
      castingLotNo: casting?.lot_no ?? null,
      castingHeatNo: casting?.heat_no ?? String(detail.heat.doc_no),
      charges: detail.charges.map((c) => ({
        lotNo: String(c.lot_no ?? ""),
        sku: String(c.sku ?? ""),
        qtyKg: n(c.qty_kg),
      })),
      company: companyFromRow(company),
      notTaxInvoice: true as const,
    };
  });

export const getKnockoutDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const ko = (
      await sql.query<{
        id: number;
        doc_no: string;
        runner_kg: string;
        dross_kg: string;
        reject_kg: string;
        heat_id: number;
        created_at: string;
        runner_lot_id: number | null;
        dross_lot_id: number | null;
        dross_to_variance: boolean;
      }>(`select * from melt_knockout where id = $1`, [data.id])
    )[0];
    if (!ko) throw new Error("Knockout slip not found");
    const detail = await getHeatDetail(sql, ko.heat_id);
    const company = (await sql.query<Record<string, unknown>>(`select * from company limit 1`))[0];
    return {
      title: "KNOCKOUT SLIP" as const,
      docNo: ko.doc_no,
      docDate: ko.created_at,
      heatNo: String(detail.heat.doc_no),
      furnace: String(detail.heat.furnace),
      alloy: String(detail.heat.alloy),
      runnerKg: n(ko.runner_kg),
      drossKg: n(ko.dross_kg),
      rejectKg: n(ko.reject_kg),
      runnerLotNo: (detail.knockouts.find((k) => n(k.id) === ko.id)?.runner_lot_no as string | null) ?? null,
      drossLotNo: (detail.knockouts.find((k) => n(k.id) === ko.id)?.dross_lot_no as string | null) ?? null,
      drossToVariance: Boolean(ko.dross_to_variance),
      company: companyFromRow(company),
      notTaxInvoice: true as const,
    };
  });
