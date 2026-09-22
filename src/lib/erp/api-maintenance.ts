import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff } from "./core.server";
import { uid, type Row } from "./row";
import { todayISO } from "./format";

const auth = [authMiddleware];

export const getMaintenanceDashboard = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const tooling = await sql.query<Row>(
      `SELECT t.*, m.name as machine_name, m.code as machine_code
       FROM machine_tooling_log t
       LEFT JOIN work_center m ON m.id = t.machine_id
       ORDER BY (t.rated_life_parts - t.current_parts) ASC`
    );

    const preventive = await sql.query<Row>(
      `SELECT p.*, m.name as machine_name, s.name as inspector_name
       FROM preventive_maintenance p
       LEFT JOIN work_center m ON m.id = p.machine_id
       LEFT JOIN staff s ON s.id = p.inspected_by_id
       ORDER BY p.check_date DESC, p.id DESC
       LIMIT 50`
    );

    const workCentres = await sql.query<Row>(`SELECT id, name, code FROM work_center ORDER BY name`);

    return { tooling, preventive, workCentres };
  });

export const logPreventiveMaintenance = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      machineId: z.coerce.number(),
      coolantLevel: z.string().default("OK"),
      lubricationOk: z.boolean().default(true),
      spindleSoundOk: z.boolean().default(true),
      chipConveyorOk: z.boolean().default(true),
      remarks: z.string().optional(),
    })
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();

    const result = await sql.query<Row>(
      `INSERT INTO preventive_maintenance (
        machine_id, check_date, coolant_level, lubrication_ok, spindle_sound_ok, chip_conveyor_ok, inspected_by_id, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.machineId,
        todayISO(),
        data.coolantLevel,
        data.lubricationOk,
        data.spindleSoundOk,
        data.chipConveyorOk,
        staff.user_id || staff.id,
        data.remarks || null,
      ]
    );

    return result[0];
  });

export const replaceCncTool = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      machineId: z.coerce.number(),
      toolName: z.string(),
      toolSlot: z.string().optional(),
      ratedLifeParts: z.coerce.number().default(5000),
    })
  )
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const result = await sql.query<Row>(
      `INSERT INTO machine_tooling_log (
        machine_id, tool_name, tool_slot, rated_life_parts, current_parts, status, last_replaced_at
      ) VALUES ($1, $2, $3, $4, 0, 'OK', now())
      RETURNING *`,
      [data.machineId, data.toolName, data.toolSlot || "T1", data.ratedLifeParts]
    );

    return result[0];
  });
