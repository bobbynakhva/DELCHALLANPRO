import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff, assertPerm, audit } from "./core.server";
import { uid, type Row } from "./row";

const auth = [authMiddleware];

export const updateItemExt = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      itemId: z.coerce.number(),
      rackNo: z.string().optional(),
      cgstPct: z.coerce.number().optional(),
      sgstPct: z.coerce.number().optional(),
      mrpRatePaise: z.coerce.number().optional(),
      purchaseRatePaise: z.coerce.number().optional(),
      minQty: z.coerce.number().optional(),
      category: z.string().optional(),
      active: z.boolean().optional(),
    })
  )
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "masters");
    const sql = await erpSql();
    
    const rows = await sql.query<{ sku: string }>(
      `update item set 
        rack_no = coalesce($1, rack_no), 
        cgst_pct = coalesce($2, cgst_pct), 
        sgst_pct = coalesce($3, sgst_pct), 
        mrp_rate_paise = coalesce($4, mrp_rate_paise), 
        purchase_rate_paise = coalesce($5, purchase_rate_paise), 
        min_qty = coalesce($6, min_qty), 
        category = coalesce($7, category), 
        active = coalesce($8, active) 
       where id = $9
       returning sku`,
      [
        data.rackNo ?? null,
        data.cgstPct ?? null,
        data.sgstPct ?? null,
        data.mrpRatePaise ?? null,
        data.purchaseRatePaise ?? null,
        data.minQty ?? null,
        data.category ?? null,
        data.active ?? null,
        data.itemId,
      ]
    );

    if (rows.length === 0) throw new Error("Item not found");

    await audit(sql, {
      userId: uid(context),
      action: "UPDATE",
      entity: "ITEM",
      entityId: data.itemId,
      after: data,
    });

    return { sku: rows[0].sku };
  });

export const createItem = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      sku: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(["RM", "FG", "SFG", "SCRAP", "TOOL", "CONSUMABLE"]),
      stockUom: z.enum(["KG", "PCS"]),
      hsn: z.string().optional(),
      drawingNo: z.string().optional(),
      category: z.string().optional(),
      rackNo: z.string().optional(),
      cgstPct: z.coerce.number().default(9),
      sgstPct: z.coerce.number().default(9),
      mrpRatePaise: z.coerce.number().default(0),
      purchaseRatePaise: z.coerce.number().default(0),
      minQty: z.coerce.number().default(0),
    })
  )
  .handler(async ({ data, context }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "masters");
    const sql = await erpSql();

    const rows = await sql.query<{ id: number; sku: string }>(
      `insert into item (
         sku, name, type, stock_uom, hsn, drawing_no, category, rack_no,
         cgst_pct, sgst_pct, mrp_rate_paise, purchase_rate_paise, min_qty,
         make_or_buy, inspection_required, valuation_method, recovery_factor
       ) values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
         'BUY', false, 'WAVG', 1
       ) returning id, sku`,
      [
        data.sku,
        data.name,
        data.type,
        data.stockUom,
        data.hsn ?? null,
        data.drawingNo ?? null,
        data.category ?? null,
        data.rackNo ?? null,
        data.cgstPct,
        data.sgstPct,
        data.mrpRatePaise,
        data.purchaseRatePaise,
        data.minQty,
      ]
    );

    await audit(sql, {
      userId: uid(context),
      action: "CREATE",
      entity: "ITEM",
      entityId: rows[0].id,
      after: data,
    });

    return rows[0];
  });

export const listItemStock = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();
    
    const rows = await sql.query<Row>(`
      select i.*,
             coalesce(sum(l.qty_kg),0)::numeric as onhand_kg,
             coalesce(sum(l.qty_pcs),0)::numeric as onhand_pcs
      from item i
      left join stock_lot l on l.item_id = i.id and l.status = 'AVAILABLE'
      group by i.id
      order by i.sku
    `);
    return rows;
  });
