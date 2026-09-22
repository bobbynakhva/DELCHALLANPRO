import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff, nextDoc } from "./core.server";
import { type Row, uid } from "./row";

const auth = [authMiddleware];

export const getStnMasters = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const warehouses = await sql.query<Row>(`SELECT id, name, code FROM warehouse ORDER BY name`);
    const items = await sql.query<Row>(`SELECT id, sku, name FROM item ORDER BY sku LIMIT 200`);

    return { warehouses, items };
  });

export const createStn = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      stn_date: z.string(),
      from_warehouse_id: z.number(),
      to_warehouse_id: z.number(),
      item_type: z.string().default("FINISHED_GOODS"),
      remarks: z.string().optional(),
      lines: z.array(
        z.object({
          item_id: z.number(),
          qty: z.number(),
          uom: z.string().default("KG"),
          rate_paise: z.number().default(0),
          lot_no: z.string().optional(),
          rack_no: z.string().optional(),
        })
      ).min(1),
    })
  )
  .handler(async ({ data, context }) => {
    const sql = await erpSql();
    const staff = await requireStaff(uid(context));
    
    let docNo = "STN/" + Date.now();
    try {
      docNo = await nextDoc(sql, "STN");
    } catch {
      // ignore
    }
    
    const stn = (await sql.query<Row>(
      `INSERT INTO stn (
        doc_no, stn_date, from_warehouse_id, to_warehouse_id,
        item_type, prepared_by_id, status, remarks
      ) VALUES ($1, $2, $3, $4, $5, $6, 'POSTED', $7) RETURNING *`,
      [
        docNo, data.stn_date, data.from_warehouse_id, data.to_warehouse_id,
        data.item_type, staff.user_id || staff.id, data.remarks || null
      ]
    ))[0];
    
    for (const line of data.lines) {
      await sql.query(
        `INSERT INTO stn_line (
          stn_id, item_id, qty, uom, rate_paise, lot_no, rack_no
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [stn.id, line.item_id, line.qty, line.uom, line.rate_paise, line.lot_no || null, line.rack_no || null]
      );
    }
    
    return stn;
  });

export const listStns = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    return sql.query<Row>(
      `SELECT 
        s.*,
        w1.name as from_warehouse_name,
        w2.name as to_warehouse_name,
        u.name as prepared_by_name
      FROM stn s
      LEFT JOIN warehouse w1 ON w1.id = s.from_warehouse_id
      LEFT JOIN warehouse w2 ON w2.id = s.to_warehouse_id
      LEFT JOIN staff u ON u.id = s.prepared_by_id
      ORDER BY s.stn_date DESC, s.id DESC
      LIMIT 100`
    );
  });

export const getStnDetail = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ id: z.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    const stn = (await sql.query<Row>(
      `SELECT 
        s.*,
        w1.name as from_warehouse_name,
        w2.name as to_warehouse_name
      FROM stn s
      LEFT JOIN warehouse w1 ON w1.id = s.from_warehouse_id
      LEFT JOIN warehouse w2 ON w2.id = s.to_warehouse_id
      WHERE s.id = $1`,
      [data.id]
    ))[0];
    
    const lines = await sql.query<Row>(
      `SELECT 
        sl.*,
        i.name as item_name
      FROM stn_line sl
      LEFT JOIN item i ON i.id = sl.item_id
      WHERE sl.stn_id = $1`,
      [data.id]
    );
    
    return { ...stn, lines };
  });
