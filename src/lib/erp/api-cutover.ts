import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, erpSql, requireStaff } from "./core.server";
import { uid } from "./row";
import { CUTOVER_GATES } from "@/modules/cutover/checklist";
import { SAMPLE_JW_CSV, SAMPLE_STOCK_CSV } from "@/modules/cutover/math";
import {
  dryRunOpeningStock,
  exportTally,
  getOpeningJwDoc,
  goLive,
  importTallyTb,
  listCutover,
  loadOpeningTb,
  postOpeningJw,
  postOpeningStock,
  signOff,
} from "./cutover-service";

const auth = [authMiddleware];

export const getCutover = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const data = await listCutover(sql);
    return { ...data, gates: CUTOVER_GATES, sampleStock: SAMPLE_STOCK_CSV, sampleJw: SAMPLE_JW_CSV };
  });

export const freezeMasters = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const data = await listCutover(sql);
    return data.freeze;
  });

export const dryRunCutoverStock = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ csv: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return dryRunOpeningStock(sql, data.csv);
  });

export const postCutoverStock = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ csv: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return postOpeningStock(sql, { csv: data.csv, userId: staff.user_id });
  });

export const postCutoverJw = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ csv: z.string().min(1) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "jw");
    const sql = await erpSql();
    return postOpeningJw(sql, { csv: data.csv, userId: staff.user_id });
  });

export const postCutoverTb = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ arPaise: z.coerce.number().default(0), apPaise: z.coerce.number().default(0) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return loadOpeningTb(sql, { userId: staff.user_id, arPaise: data.arPaise, apPaise: data.apPaise });
  });

export const postCutoverLive = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ ownerOverride: z.boolean().default(false) }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return goLive(sql, { userId: staff.user_id, role: staff.role, ownerOverride: data.ownerOverride });
  });

export const postTallyExport = createServerFn({ method: "POST" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return exportTally(sql, { userId: staff.user_id });
  });

export const postTallyImport = createServerFn({ method: "POST" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return importTallyTb(sql);
  });

export const postCutoverSignoff = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ gate: z.string().min(1), notes: z.string().optional() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    await signOff(sql, { gate: data.gate, userId: staff.user_id, notes: data.notes });
    return { ok: true };
  });

export const getOpeningConfirmation = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    return getOpeningJwDoc(sql, data.id);
  });
