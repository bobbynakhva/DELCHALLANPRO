import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff } from "./core.server";
import { uid, type Row } from "./row";

const auth = [authMiddleware];

export const getProdLogMasters = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const workCentres = await sql.query<Row>(`SELECT id, name, code FROM work_center ORDER BY name`);
    const staffList = await sql.query<Row>(`SELECT id, name, role FROM staff ORDER BY name`);
    const items = await sql.query<Row>(`SELECT id, sku, name FROM item ORDER BY sku LIMIT 200`);

    return { workCentres, staffList, items };
  });

export const createProductionLog = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      log_date: z.string(),
      log_from: z.string().optional(),
      log_to: z.string().optional(),
      is_daily_log: z.boolean().default(false),
      partner_id: z.number().optional(),
      operator_id: z.number().optional(),
      machine_id: z.number().optional(),
      item_id: z.number().optional(),
      utility_ratio: z.number().default(1.0),
      rm_item_id: z.number().optional(),
      fixture: z.string().optional(),
      good_pcs: z.number().default(0),
      good_kg: z.number().default(0),
      reject_pcs: z.number().default(0),
      reject_kg: z.number().default(0),
      rm_qty_kg: z.number().default(0),
      idle_reason: z.string().optional(),
      rejection_reason: z.string().optional(),
      remarks: z.string().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();

    const result = await sql.query<Row>(
      `INSERT INTO production_log (
        log_date, log_from, log_to, is_daily_log,
        partner_id, operator_id, machine_id, item_id,
        utility_ratio, rm_item_id, fixture,
        good_pcs, good_kg, reject_pcs, reject_kg,
        rm_qty_kg, idle_reason, rejection_reason, remarks,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        data.log_date,
        data.log_from || null,
        data.log_to || null,
        data.is_daily_log,
        data.partner_id || null,
        data.operator_id || null,
        data.machine_id || null,
        data.item_id || null,
        data.utility_ratio,
        data.rm_item_id || null,
        data.fixture || null,
        data.good_pcs,
        data.good_kg,
        data.reject_pcs,
        data.reject_kg,
        data.rm_qty_kg,
        data.idle_reason || null,
        data.rejection_reason || null,
        data.remarks || null,
        staff.user_id || staff.id,
      ]
    );

    return result[0];
  });

export const listProductionLogs = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const logs = await sql.query<Row>(
      `SELECT 
        l.*,
        p.name as partner_name,
        o.name as operator_name,
        m.name as machine_name,
        i.name as item_name
      FROM production_log l
      LEFT JOIN partner p ON p.id = l.partner_id
      LEFT JOIN staff o ON o.id = l.operator_id
      LEFT JOIN work_center m ON m.id = l.machine_id
      LEFT JOIN item i ON i.id = l.item_id
      ORDER BY l.log_date DESC, l.id DESC
      LIMIT 100`
    );

    return logs;
  });

export const getProductionLogSummary = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ start_date: z.string(), end_date: z.string() }))
  .handler(async ({ data, context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const stats = await sql.query<Row>(
      `SELECT 
        COUNT(id) as total_logs,
        AVG(utility_ratio) as avg_utility,
        SUM(good_pcs) as total_good_pcs,
        SUM(reject_pcs) as total_reject_pcs,
        SUM(good_kg) as total_good_kg,
        SUM(reject_kg) as total_reject_kg
      FROM production_log
      WHERE log_date >= $1 AND log_date <= $2`,
      [data.start_date, data.end_date]
    );

    const idleBreakdown = await sql.query<Row>(
      `SELECT idle_reason, COUNT(*) as count
      FROM production_log
      WHERE idle_reason IS NOT NULL AND log_date >= $1 AND log_date <= $2
      GROUP BY idle_reason
      ORDER BY count DESC`,
      [data.start_date, data.end_date]
    );

    return {
      stats: stats[0] || {},
      idleBreakdown,
    };
  });
