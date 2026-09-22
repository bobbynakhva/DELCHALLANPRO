import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff } from "./core.server";
import { uid, type Row } from "./row";

const auth = [authMiddleware];

export const listStockBrowser = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    
    const items = await sql.query<Row>(`
      SELECT 
        i.id, i.sku as code, i.name, i.type, i.rack_no, i.hsn_code,
        COALESCE(i.min_qty_kg, 0) as min_qty,
        COALESCE(SUM(l.qty_kg), 0) as qty_kg,
        COALESCE(SUM(l.qty_pcs), 0) as qty_pcs,
        COALESCE(MAX(l.unit_value_paise_per_kg), 0) as rate_paise
      FROM item i
      LEFT JOIN stock_lot l ON l.item_id = i.id AND (l.qty_kg > 0 OR l.qty_pcs > 0)
      GROUP BY i.id
    `);

    return items;
  });

export const getLotsByItem = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ itemId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    
    const lots = await sql.query<Row>(`
      SELECT 
        l.id, l.lot_no, l.qty_kg, l.qty_pcs, l.status, l.unit_value_paise_per_kg,
        w.name as warehouse_name
      FROM stock_lot l
      JOIN warehouse w ON w.id = l.warehouse_id
      WHERE l.item_id = $1 AND (l.qty_kg > 0 OR l.qty_pcs > 0)
      ORDER BY l.id DESC
    `, [data.itemId]);

    return lots;
  });
