import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff, nextDoc } from "./core.server";
import { uid, type Row } from "./row";
import { todayISO } from "./format";

const auth = [authMiddleware];

export const createSubcontractOrder = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      partnerId: z.coerce.number(),
      processType: z.enum(["PLATING", "HEAT_TREATMENT", "POLISHING", "ANNEALING"]).default("PLATING"),
      expectedReturnDate: z.string().optional(),
      remarks: z.string().optional(),
      lines: z.array(
        z.object({
          lotId: z.coerce.number(),
          itemId: z.coerce.number(),
          sentQtyPcs: z.coerce.number(),
          sentQtyKg: z.coerce.number(),
          ratePaisePerKg: z.coerce.number().default(0),
        })
      ).min(1),
    })
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();

    let docNo = "SUB/" + Date.now();
    try {
      docNo = await nextDoc(sql, "SUB");
    } catch {
      // fallback
    }

    const sub = (
      await sql.query<Row>(
        `INSERT INTO subcontract_order (
          doc_no, partner_id, process_type, sent_date, expected_return_date, status, remarks, created_by
        ) VALUES ($1, $2, $3, $4, $5, 'SENT', $6, $7)
        RETURNING *`,
        [
          docNo,
          data.partnerId,
          data.processType,
          todayISO(),
          data.expectedReturnDate || null,
          data.remarks || null,
          staff.user_id || staff.id,
        ]
      )
    )[0];

    for (const l of data.lines) {
      await sql.query(
        `INSERT INTO subcontract_line (
          subcontract_id, lot_id, item_id, sent_qty_pcs, sent_qty_kg, rate_paise_per_kg
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [sub.id, l.lotId, l.itemId, l.sentQtyPcs, l.sentQtyKg, l.ratePaisePerKg]
      );
    }

    return sub;
  });

export const receiveSubcontractOrder = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      subcontractId: z.coerce.number(),
      lineId: z.coerce.number(),
      receivedQtyPcs: z.coerce.number(),
      receivedQtyKg: z.coerce.number(),
      processLossKg: z.coerce.number().default(0),
    })
  )
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    await sql.query(
      `UPDATE subcontract_line
       SET received_qty_pcs = $1,
           received_qty_kg = $2,
           process_loss_kg = $3
       WHERE id = $4`,
      [data.receivedQtyPcs, data.receivedQtyKg, data.processLossKg, data.lineId]
    );

    await sql.query(`UPDATE subcontract_order SET status = 'RECEIVED' WHERE id = $1`, [data.subcontractId]);

    return { success: true };
  });

export const listSubcontractOrders = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const rows = await sql.query<Row>(
      `SELECT s.*, p.name as vendor_name
       FROM subcontract_order s
       LEFT JOIN partner p ON p.id = s.partner_id
       ORDER BY s.id DESC
       LIMIT 100`
    );

    return rows;
  });
