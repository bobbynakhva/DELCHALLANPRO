import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, erpSql, requireStaff } from "./core.server";
import { uid } from "./row";
import {
  cancelPersistedEway,
  cancelPersistedIrn,
  confirmGateOut,
  generateAndPersistEway,
  generateAndPersistIrn,
  previewEwayPartA,
  updatePersistedPartB,
} from "./irp-service";

const auth = [authMiddleware];
const simulateIrn = z.enum(["duplicate", "invalidGstin"]).optional();
const simulateEway = z.enum(["duplicate", "invalidGstin"]).optional();

export const generateIrn = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      docType: z.enum(["INVOICE", "CN", "DN"]).default("INVOICE"),
      docId: z.coerce.number(),
      simulate: simulateIrn,
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return generateAndPersistIrn(sql, {
      docType: data.docType,
      docId: data.docId,
      userId: staff.user_id,
      simulate: data.simulate,
    });
  });

export const cancelIrn = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      docType: z.enum(["INVOICE", "CN", "DN"]).default("INVOICE"),
      docId: z.coerce.number(),
      simulate: z.enum(["cancelWindow"]).optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    const now =
      data.simulate === "cancelWindow" ? new Date(Date.now() + 25 * 3600 * 1000) : undefined;
    return cancelPersistedIrn(sql, { docType: data.docType, docId: data.docId, userId: staff.user_id, now });
  });

export const previewEway = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ docType: z.enum(["INVOICE", "CHALLAN"]), docId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    return previewEwayPartA(sql, data);
  });

export const generateEway = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      docType: z.enum(["INVOICE", "CHALLAN"]),
      docId: z.coerce.number(),
      vehicle: z.string().optional(),
      distanceKm: z.coerce.number().min(0).default(18),
      skipSameState50km: z.boolean().default(false),
      force: z.boolean().default(false),
      simulate: simulateEway,
      transDoc: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return generateAndPersistEway(sql, { ...data, userId: staff.user_id });
  });

export const updateEwayPartB = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      ewayId: z.coerce.number(),
      vehicle: z.string().optional(),
      distanceKm: z.coerce.number().min(0),
      skipSameState50km: z.boolean().default(false),
      transDoc: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return updatePersistedPartB(sql, { ...data, userId: staff.user_id });
  });

export const cancelEway = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ ewayId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return cancelPersistedEway(sql, { ewayId: data.ewayId, userId: staff.user_id });
  });

export const gateOut = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(z.object({ docType: z.enum(["INVOICE", "CHALLAN"]), docId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "invoice");
    const sql = await erpSql();
    return confirmGateOut(sql, { ...data, userId: staff.user_id });
  });
