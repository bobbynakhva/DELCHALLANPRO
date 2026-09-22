import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { assertPerm, erpSql, nextDoc, requireStaff } from "./core.server";
import { n, todayISO, roundKg } from "./format";
import { uid, type Row } from "./row";
import { postMove, getLot, withStockTx } from "./stock.server";

const auth = [authMiddleware];

export const listWoIssues = createServerFn({ method: "GET" })
  .middleware(auth)
  .handler(async ({ context }) => {
    const staff = await requireStaff(uid(context));
    const sql = await erpSql();
    return await sql.query<any>(
      `select wi.*, wo.doc_no as wo_doc_no, i.sku, i.name as item_name, l.lot_no
       from wo_issue wi
       join work_order wo on wo.id = wi.wo_id
       join item i on i.id = wi.item_id
       join stock_lot l on l.id = wi.lot_id
       order by wi.id desc
       limit 100`
    );
  });

export const issueToWoWithMin = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      woId: z.coerce.number(),
      lotId: z.coerce.number(),
      qtyKg: z.coerce.number().positive(),
      remarks: z.string().optional(),
    }),
  )
  .handler(async ({ context, data }) => {
    const staff = await requireStaff(uid(context));
    assertPerm(staff, "purchase");
    const sql = await erpSql();
    
    const wo = (
      await sql.query<{ id: number; status: string; item_id: number }>(
        `select * from work_order where id = $1`,
        [data.woId],
      )
    )[0];
    if (!wo) throw new Error("WO not found");
    const lot = await getLot(sql, data.lotId);
    if (lot.status !== "AVAILABLE") throw new Error("Lot is not AVAILABLE");
    if (lot.owner_type !== "OWN") throw new Error("Cannot issue customer-owned metal into our WO value stream this way");
    const component = (
      await sql.query<{ component_item_id: number; alloy_id: number | null; alloy_code: string | null; sku: string }>(
        `select bl.component_item_id, i.alloy_id, a.code as alloy_code, i.sku
           from work_order wo
           join bom_line bl on bl.bom_id = wo.bom_id and bl.is_co_product = false
           join item i on i.id = bl.component_item_id
           left join alloy a on a.id = i.alloy_id
          where wo.id = $1
          order by bl.line_no
          limit 1`,
        [wo.id],
      )
    )[0];
    
    if (component) {
      if (lot.item_id !== component.component_item_id && lot.alloy_id !== component.alloy_id) {
        throw new Error(`Lot item does not match frozen BOM component ${component.sku}`);
      }
    }
    const kgPer = n(
      (
        await sql.query<{ kg_per_pc: string | null }>(`select kg_per_pc from item where id = $1`, [lot.item_id])
      )[0]?.kg_per_pc,
    );
    
    const docNo = await nextDoc(sql, "MIN");

    return withStockTx(sql, async () => {
      await postMove(sql, {
        moveType: "WO_ISSUE",
        itemId: lot.item_id,
        lotId: lot.id,
        warehouseId: lot.warehouse_id,
        qtyKg: -data.qtyKg,
        qtyPcs: 0,
        refType: "WO",
        refId: wo.id,
        notes: data.remarks || "Issue to work order",
        userId: staff.user_id,
        alloyId: lot.alloy_id,
        unitValuePaisePerKg: lot.unit_value_paise_per_kg,
        kgPerPc: kgPer || null,
        conversionKind: "ROD",
        itemAlloyId: component?.alloy_id ?? lot.alloy_id,
      });
      await sql.query<Row>(
        `insert into wo_issue (wo_id, lot_id, item_id, qty_kg, doc_no, remarks, issued_date) values ($1,$2,$3,$4,$5,$6,current_date)`,
        [wo.id, lot.id, lot.item_id, data.qtyKg, docNo, data.remarks || null],
      );
      await sql.query<Row>(
        `update work_order set issued_kg = issued_kg + $1, status = 'ISSUED' where id = $2`,
        [data.qtyKg, wo.id],
      );
      return { docNo, issuedKg: data.qtyKg, lotNo: lot.lot_no };
    });
  });
