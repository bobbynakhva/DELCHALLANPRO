import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff, audit } from "./core.server";
import { uid, type Row } from "./row";

const auth = [authMiddleware];

export const importItemsCsv = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      rows: z.array(
        z.object({
          sku: z.string(),
          name: z.string(),
          type: z.string().default("FG"),
          hsn_code: z.string().optional(),
          drawing_no: z.string().optional(),
          rack_no: z.string().optional(),
          cgst_pct: z.coerce.number().default(9),
          sgst_pct: z.coerce.number().default(9),
          mrp_rate_paise: z.coerce.number().default(0),
          purchase_rate_paise: z.coerce.number().default(0),
          min_qty: z.coerce.number().default(0),
        })
      ),
    })
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();

    let importedCount = 0;
    for (const r of data.rows) {
      if (!r.sku || !r.name) continue;
      await sql.query(
        `INSERT INTO item (
          sku, name, type, hsn_code, drawing_no, rack_no,
          cgst_pct, sgst_pct, mrp_rate_paise, purchase_rate_paise, min_qty, active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
        ON CONFLICT (sku) DO UPDATE SET
          name = EXCLUDED.name,
          drawing_no = COALESCE(EXCLUDED.drawing_no, item.drawing_no),
          rack_no = COALESCE(EXCLUDED.rack_no, item.rack_no)`,
        [
          r.sku.trim(),
          r.name.trim(),
          r.type.trim(),
          r.hsn_code || "8481",
          r.drawing_no || null,
          r.rack_no || null,
          r.cgst_pct,
          r.sgst_pct,
          r.mrp_rate_paise,
          r.purchase_rate_paise,
          r.min_qty,
        ]
      );
      importedCount++;
    }

    await audit(sql, {
      userId: staff.user_id,
      action: "IMPORT_ITEMS",
      entity: "item",
      entityId: 0,
      after: { count: importedCount },
    });

    return { importedCount };
  });

export const importStockLotsCsv = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      rows: z.array(
        z.object({
          lot_no: z.string(),
          sku: z.string(),
          warehouse_code: z.string().default("RM-MAIN"),
          qty_kg: z.coerce.number(),
          qty_pcs: z.coerce.number().default(0),
          unit_value_paise: z.coerce.number().default(0),
        })
      ),
    })
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();

    let importedCount = 0;
    for (const r of data.rows) {
      if (!r.lot_no || !r.sku || r.qty_kg <= 0) continue;

      const item = (await sql.query<Row>(`SELECT id FROM item WHERE sku = $1`, [r.sku.trim()]))[0];
      if (!item) continue;

      const wh = (await sql.query<Row>(`SELECT id FROM warehouse WHERE code = $1`, [r.warehouse_code.trim()]))[0];
      const whId = wh ? (wh.id as number) : 1;

      await sql.query(
        `INSERT INTO stock_lot (
          lot_no, item_id, warehouse_id, qty_kg, qty_pcs, unit_value_paise_per_kg, owner_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'OWN', 'AVAILABLE')
        ON CONFLICT (lot_no) DO NOTHING`,
        [r.lot_no.trim(), item.id, whId, r.qty_kg, r.qty_pcs, r.unit_value_paise]
      );
      importedCount++;
    }

    return { importedCount };
  });
