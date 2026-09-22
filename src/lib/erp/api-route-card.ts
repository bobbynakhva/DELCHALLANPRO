import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff } from "./core.server";
import { uid, type Row } from "./row";

const auth = [authMiddleware];

export const updateRouteCard = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      woId: z.coerce.number(),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
      leadTimeDays: z.coerce.number().optional(),
      rmHeatNo: z.string().optional(),
      testCertNo: z.string().optional(),
      woType: z.enum(["MANUFACTURING", "LABOUR"]).optional(),
    })
  )
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    await sql.query(
      `UPDATE work_order
       SET priority = COALESCE($1, priority),
           lead_time_days = COALESCE($2, lead_time_days),
           rm_heat_no = COALESCE($3, rm_heat_no),
           test_cert_no = COALESCE($4, test_cert_no),
           wo_type = COALESCE($5, wo_type)
       WHERE id = $6`,
      [data.priority || null, data.leadTimeDays || null, data.rmHeatNo || null, data.testCertNo || null, data.woType || null, data.woId]
    );

    return { success: true, woId: data.woId };
  });

export const addRoutingStep = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      woId: z.coerce.number(),
      seq: z.coerce.number(),
      stepName: z.string(),
      machineName: z.string().optional(),
      cncProgramNo: z.string().optional(),
      targetMin: z.coerce.number().optional(),
      actualMin: z.coerce.number().optional(),
      instructions: z.string().optional(),
    })
  )
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const result = await sql.query<Row>(
      `INSERT INTO routing_step (
        wo_id, seq, step_name, machine_name, cnc_program_no, target_min, actual_min, instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.woId,
        data.seq,
        data.stepName,
        data.machineName || null,
        data.cncProgramNo || null,
        data.targetMin || 0,
        data.actualMin || 0,
        data.instructions || null,
      ]
    );

    return result[0];
  });

export const getRouteCardDetail = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ woId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const wo = (
      await sql.query<Row>(
        `SELECT wo.*, i.sku, i.name as item_name, i.drawing_no
         FROM work_order wo
         LEFT JOIN item i ON i.id = wo.item_id
         WHERE wo.id = $1`,
        [data.woId]
      )
    )[0];

    if (!wo) throw new Error("Work Order not found");

    const steps = await sql.query<Row>(
      `SELECT * FROM routing_step WHERE wo_id = $1 ORDER BY seq ASC`,
      [data.woId]
    );

    return { ...wo, steps };
  });
