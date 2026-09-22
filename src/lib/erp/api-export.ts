import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { erpSql, requireStaff } from "./core.server";
import { uid, type Row } from "./row";

const auth = [authMiddleware];

export const updateExportDetails = createServerFn({ method: "POST" })
  .middleware(auth)
  .validator(
    z.object({
      dispatchId: z.coerce.number(),
      currency: z.string().default("USD"),
      exchangeRate: z.coerce.number().default(83.5),
      portLoading: z.string().optional(),
      portDischarge: z.string().optional(),
      vesselFlightNo: z.string().optional(),
      preCarriageBy: z.string().optional(),
      placeOfReceipt: z.string().optional(),
      finalDestination: z.string().optional(),
      packingType: z.string().optional(),
    })
  )
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    await sql.query(
      `UPDATE dispatch
       SET currency = $1,
           exchange_rate = $2,
           port_loading = COALESCE($3, port_loading),
           port_discharge = COALESCE($4, port_discharge),
           vessel_flight_no = COALESCE($5, vessel_flight_no),
           pre_carriage_by = COALESCE($6, pre_carriage_by),
           place_of_receipt = COALESCE($7, place_of_receipt),
           final_destination = COALESCE($8, final_destination),
           packing_type = COALESCE($9, packing_type)
       WHERE id = $10`,
      [
        data.currency,
        data.exchangeRate,
        data.portLoading || null,
        data.portDischarge || null,
        data.vesselFlightNo || null,
        data.preCarriageBy || null,
        data.placeOfReceipt || null,
        data.finalDestination || null,
        data.packingType || null,
        data.dispatchId,
      ]
    );

    return { success: true, dispatchId: data.dispatchId };
  });

export const getExportShippingDoc = createServerFn({ method: "GET" })
  .middleware(auth)
  .validator(z.object({ dispatchId: z.coerce.number() }))
  .handler(async ({ context, data }) => {
    await requireStaff(uid(context));
    const sql = await erpSql();

    const dispatch = (
      await sql.query<Row>(
        `SELECT d.*, p.name as customer_name, p.address as customer_address, p.gstin as customer_gstin,
                c.trade_name as company_name, c.gstin as company_gstin, c.iec_code, c.ad_code
         FROM dispatch d
         LEFT JOIN partner p ON p.id = d.partner_id
         JOIN company c ON 1=1
         WHERE d.id = $1
         LIMIT 1`,
        [data.dispatchId]
      )
    )[0];

    if (!dispatch) throw new Error("Dispatch document not found");

    const lines = await sql.query<Row>(
      `SELECT dl.*, i.sku, i.name as item_name, i.hsn
       FROM dispatch_line dl
       LEFT JOIN item i ON i.id = dl.item_id
       WHERE dl.dispatch_id = $1`,
      [data.dispatchId]
    );

    return { ...dispatch, lines };
  });
