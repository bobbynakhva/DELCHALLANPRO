/** Persist NIC-shaped IRN / e-way. Does not post stock. Snapshot is the source of truth. */
import type { Sql } from "@/lib/db";
import { audit, nextDoc, setting } from "./core.server";
import { n } from "./format";
import { loadDocSnapshot } from "./stock.server";
import { assertDocSerial } from "@/modules/compliance/gst/serial";
import type { DeliveryChallanDoc, NoteDoc, TaxInvoiceDoc } from "@/modules/compliance/documents/types";
import {
  generateIrnViaMode,
  mapInvoiceToIrpPayload,
  mapNoteToIrpPayload,
  redactJson,
  resolveNicMode,
  assertCancelWindow,
  CANCEL_CREDIT_NOTE_MSG,
  type IrpSimulate,
  type StubIrnResult,
} from "@/modules/compliance/irp";
import {
  ewayRequired,
  generateEwayViaMode,
  mapChallanToEwayPartA,
  mapInvoiceToEwayPartA,
  mapPartB,
  type EwayPartA,
  type EwayPartB,
  type EwaySimulate,
  type StubEwayResult,
} from "@/modules/compliance/eway";

export { CANCEL_CREDIT_NOTE_MSG };

function ackIso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  const s = String(v ?? "").trim();
  return s;
}

/** NIC payload dates are DD/MM/YYYY; PG date columns want ISO. */
function nicDateToIso(d: string): string {
  const m = String(d).trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return String(d).slice(0, 10);
}

async function logCall(
  sql: Sql,
  opts: {
    kind: string;
    mode: string;
    docType: string;
    docId: number;
    request: unknown;
    response: unknown;
    status: string;
  },
) {
  await sql.query(
    `insert into irp_call (kind, mode, doc_type, doc_id, request_json, response_json, status)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [opts.kind, opts.mode, opts.docType, opts.docId, redactJson(opts.request), redactJson(opts.response), opts.status],
  );
}

async function loadInvoiceSnapshot(sql: Sql, invoiceId: number): Promise<TaxInvoiceDoc> {
  const snap = await loadDocSnapshot<TaxInvoiceDoc>(sql, "sales_invoice", invoiceId);
  if (!snap?.docNo) throw new Error("Posted snapshot missing — IRN is mapped from the frozen invoice, not live Item.hsn.");
  return snap;
}

export async function overlayInvoiceIrp(sql: Sql, invoiceId: number, snap: TaxInvoiceDoc): Promise<TaxInvoiceDoc> {
  const live = (
    await sql.query<{
      irn: string | null;
      irn_ack_no: string | null;
      irn_ack_dt: string | null;
      irn_signed_qr: string | null;
      irn_status: string | null;
      eway_no: string | null;
    }>(
      `select irn, irn_ack_no, irn_ack_dt::text as irn_ack_dt, irn_signed_qr, irn_status, eway_no
         from sales_invoice where id = $1`,
      [invoiceId],
    )
  )[0];
  if (!live) return snap;
  return {
    ...snap,
    irn: live.irn ?? snap.irn ?? null,
    irnAckNo: live.irn_ack_no ?? snap.irnAckNo ?? null,
    irnAckDt: live.irn_ack_dt ?? snap.irnAckDt ?? null,
    signedQr: live.irn_signed_qr ?? snap.signedQr ?? null,
    irnStatus: (live.irn_status as TaxInvoiceDoc["irnStatus"]) ?? snap.irnStatus ?? null,
    ewayNo: live.eway_no ?? snap.ewayNo ?? null,
  };
}

export async function overlayNoteIrp(sql: Sql, noteId: number, snap: NoteDoc): Promise<NoteDoc> {
  const live = (
    await sql.query<{
      irn: string | null;
      irn_ack_no: string | null;
      irn_ack_dt: string | null;
      irn_signed_qr: string | null;
      irn_status: string | null;
    }>(
      `select irn, irn_ack_no, irn_ack_dt::text as irn_ack_dt, irn_signed_qr, irn_status
         from credit_debit_note where id = $1`,
      [noteId],
    )
  )[0];
  if (!live) return snap;
  return {
    ...snap,
    irn: live.irn ?? snap.irn ?? null,
    irnAckNo: live.irn_ack_no ?? snap.irnAckNo ?? null,
    irnAckDt: live.irn_ack_dt ?? snap.irnAckDt ?? null,
    signedQr: live.irn_signed_qr ?? snap.signedQr ?? null,
  };
}

export async function overlayChallanEway(
  sql: Sql,
  challanId: number,
  snap: DeliveryChallanDoc,
): Promise<DeliveryChallanDoc> {
  const live = (
    await sql.query<{ eway_no: string | null }>(`select eway_no from job_work_challan where id = $1`, [challanId])
  )[0];
  if (!live) return snap;
  return { ...snap, ewayNo: live.eway_no ?? snap.ewayNo ?? null };
}

export async function generateAndPersistIrn(
  sql: Sql,
  opts: {
    docType: "INVOICE" | "CN" | "DN";
    docId: number;
    userId: string;
    simulate?: IrpSimulate;
    now?: Date;
  },
): Promise<StubIrnResult & { already: boolean; mode: string }> {
  const mode = resolveNicMode("EINVOICE", await setting(sql, "einvoice_mode", "stub"));
  if (opts.docType === "INVOICE") {
    const inv = (
      await sql.query<{
        id: number;
        status: string;
        irn: string | null;
        irn_ack_no: string | null;
        irn_ack_dt: string | null;
        irn_signed_qr: string | null;
        irn_status: string | null;
      }>(`select id, status, irn, irn_ack_no, irn_ack_dt::text as irn_ack_dt, irn_signed_qr, irn_status from sales_invoice where id = $1`, [
        opts.docId,
      ])
    )[0];
    if (!inv) throw new Error("Invoice not found");
    if (inv.status !== "POSTED") throw new Error("IRN only on a POSTED invoice.");
    if (inv.irn_status === "CNL") throw new Error("IRN cancelled. Issue a credit note (s.34).");
    if (inv.irn && inv.irn_status === "ACT") {
      return {
        Irn: inv.irn,
        AckNo: inv.irn_ack_no ?? "",
        AckDt: ackIso(inv.irn_ack_dt),
        SignedQR: inv.irn_signed_qr ?? "",
        Status: "ACT",
        already: true,
        mode,
      };
    }
    const snap = await loadInvoiceSnapshot(sql, opts.docId);
    const payload = mapInvoiceToIrpPayload(snap, "INV");
    let result: StubIrnResult;
    try {
      result = generateIrnViaMode(payload, { setting: mode, simulate: opts.simulate, now: opts.now, mode });
    } catch (e) {
      await logCall(sql, {
        kind: "IRN",
        mode,
        docType: opts.docType,
        docId: opts.docId,
        request: payload,
        response: { error: e instanceof Error ? e.message : String(e) },
        status: "ERR",
      });
      throw e;
    }
    await sql.query(
      `update sales_invoice set
         irn = $1, irn_ack_no = $2, irn_ack_dt = $3, irn_status = 'ACT', irn_signed_qr = $4,
         irn_request_json = $5, irn_response_json = $6
       where id = $7`,
      [
        result.Irn,
        result.AckNo,
        result.AckDt,
        result.SignedQR,
        redactJson(payload),
        redactJson(result),
        opts.docId,
      ],
    );
    await logCall(sql, {
      kind: "IRN",
      mode,
      docType: opts.docType,
      docId: opts.docId,
      request: payload,
      response: result,
      status: "ACT",
    });
    await audit(sql, {
      userId: opts.userId,
      action: "IRN_GENERATE",
      entity: "sales_invoice",
      entityId: opts.docId,
      after: { irn: result.Irn, ackNo: result.AckNo, mode },
    });
    return { ...result, already: false, mode };
  }

  const note = (
    await sql.query<{
      id: number;
      kind: string;
      status: string;
      irn: string | null;
      irn_ack_no: string | null;
      irn_ack_dt: string | null;
      irn_signed_qr: string | null;
      irn_status: string | null;
    }>(
      `select id, kind, status, irn, irn_ack_no, irn_ack_dt::text as irn_ack_dt, irn_signed_qr, irn_status
         from credit_debit_note where id = $1`,
      [opts.docId],
    )
  )[0];
  if (!note) throw new Error("Note not found");
  if (note.status !== "POSTED") throw new Error("IRN only on a POSTED credit / debit note.");
  if (note.irn_status === "CNL") throw new Error("IRN cancelled. Issue a credit note (s.34).");
  if (note.irn && note.irn_status === "ACT") {
    return {
      Irn: note.irn,
      AckNo: note.irn_ack_no ?? "",
      AckDt: ackIso(note.irn_ack_dt),
      SignedQR: note.irn_signed_qr ?? "",
      Status: "ACT",
      already: true,
      mode,
    };
  }
  const snap =
    (await loadDocSnapshot<NoteDoc>(sql, "credit_debit_note", opts.docId)) ??
    null;
  if (!snap?.docNo) throw new Error("Posted snapshot missing — IRN is mapped from the frozen note.");
  const payload = mapNoteToIrpPayload(snap);
  let result: StubIrnResult;
  try {
    result = generateIrnViaMode(payload, { setting: mode, simulate: opts.simulate, now: opts.now, mode });
  } catch (e) {
    await logCall(sql, {
      kind: "IRN",
      mode,
      docType: opts.docType,
      docId: opts.docId,
      request: payload,
      response: { error: e instanceof Error ? e.message : String(e) },
      status: "ERR",
    });
    throw e;
  }
  await sql.query(
    `update credit_debit_note set
       irn = $1, irn_ack_no = $2, irn_ack_dt = $3, irn_status = 'ACT', irn_signed_qr = $4,
       irn_request_json = $5, irn_response_json = $6
     where id = $7`,
    [result.Irn, result.AckNo, result.AckDt, result.SignedQR, redactJson(payload), redactJson(result), opts.docId],
  );
  await logCall(sql, {
    kind: "IRN",
    mode,
    docType: opts.docType,
    docId: opts.docId,
    request: payload,
    response: result,
    status: "ACT",
  });
  await audit(sql, {
    userId: opts.userId,
    action: "IRN_GENERATE",
    entity: "credit_debit_note",
    entityId: opts.docId,
    after: { irn: result.Irn, ackNo: result.AckNo, mode },
  });
  return { ...result, already: false, mode };
}

export async function cancelPersistedIrn(
  sql: Sql,
  opts: { docType: "INVOICE" | "CN" | "DN"; docId: number; userId: string; now?: Date },
): Promise<{ irn: string; status: "CNL" }> {
  const table = opts.docType === "INVOICE" ? "sales_invoice" : "credit_debit_note";
  const row = (
    await sql.query<{ irn: string | null; irn_ack_dt: string | null; irn_status: string | null }>(
      `select irn, irn_ack_dt::text as irn_ack_dt, irn_status from ${table} where id = $1`,
      [opts.docId],
    )
  )[0];
  if (!row) throw new Error(opts.docType === "INVOICE" ? "Invoice not found" : "Note not found");
  if (!row.irn || row.irn_status !== "ACT") throw new Error("No active IRN to cancel.");
  try {
    assertCancelWindow(ackIso(row.irn_ack_dt), opts.now ?? new Date());
  } catch (e) {
    await logCall(sql, {
      kind: "IRN_CANCEL",
      mode: "stub",
      docType: opts.docType,
      docId: opts.docId,
      request: { irn: row.irn, ackDt: row.irn_ack_dt },
      response: { error: e instanceof Error ? e.message : String(e) },
      status: "ERR",
    });
    throw e;
  }
  await sql.query(`update ${table} set irn_status = 'CNL' where id = $1`, [opts.docId]);
  await logCall(sql, {
    kind: "IRN_CANCEL",
    mode: "stub",
    docType: opts.docType,
    docId: opts.docId,
    request: { irn: row.irn },
    response: { status: "CNL" },
    status: "CNL",
  });
  await audit(sql, {
    userId: opts.userId,
    action: "IRN_CANCEL",
    entity: table,
    entityId: opts.docId,
    after: { irn: row.irn, status: "CNL" },
  });
  return { irn: row.irn, status: "CNL" };
}

export async function previewEwayPartA(
  sql: Sql,
  opts: { docType: "INVOICE" | "CHALLAN"; docId: number },
): Promise<EwayPartA> {
  if (opts.docType === "INVOICE") {
    const snap = await loadInvoiceSnapshot(sql, opts.docId);
    return mapInvoiceToEwayPartA(snap);
  }
  const snap = await loadDocSnapshot<DeliveryChallanDoc>(sql, "job_work_challan", opts.docId);
  if (!snap?.docNo) throw new Error("Posted snapshot missing — e-way Part A is mapped from the frozen challan.");
  return mapChallanToEwayPartA(snap);
}

async function assertEwayNeeded(
  sql: Sql,
  opts: { docType: "INVOICE" | "CHALLAN"; docId: number; force?: boolean },
): Promise<{ required: boolean; partA: EwayPartA; sameState: boolean }> {
  const company = (await sql.query<{ eway_threshold_paise: number; state_code: string }>(`select eway_threshold_paise, state_code from company limit 1`))[0];
  const threshold = n(company?.eway_threshold_paise) || 5_000_000;
  const partA = await previewEwayPartA(sql, opts);
  const sameState = partA.fromStateCode === partA.toStateCode;
  if (opts.docType === "CHALLAN") {
    const ch = (
      await sql.query<{ eway_required: boolean }>(`select eway_required from job_work_challan where id = $1`, [opts.docId])
    )[0];
    const required = ewayRequired({
      valuePaise: Math.round(partA.totalValue * 100),
      thresholdPaise: threshold,
      interState: !sameState,
      force: opts.force,
      jwForce: ch?.eway_required !== false,
    });
    return { required, partA, sameState };
  }
  const inv = (
    await sql.query<{ is_export: boolean; total_paise: number; place_of_supply: string | null }>(
      `select is_export, total_paise, place_of_supply from sales_invoice where id = $1`,
      [opts.docId],
    )
  )[0];
  const inter = Boolean(inv?.is_export) || !sameState;
  const required = ewayRequired({
    valuePaise: n(inv?.total_paise),
    thresholdPaise: threshold,
    interState: inter,
    force: opts.force,
  });
  return { required, partA, sameState };
}

export async function generateAndPersistEway(
  sql: Sql,
  opts: {
    docType: "INVOICE" | "CHALLAN";
    docId: number;
    userId: string;
    vehicle?: string;
    distanceKm: number;
    skipSameState50km?: boolean;
    force?: boolean;
    simulate?: EwaySimulate;
    now?: Date;
    transDoc?: string;
  },
): Promise<StubEwayResult & { id: number; stubNo: string; already: boolean }> {
  const mode = resolveNicMode("EWAY", await setting(sql, "eway_mode", "stub"));
  const existing = (
    await sql.query<{
      id: number;
      stub_no: string;
      ewb_no: string | null;
      status: string;
      valid_from: string | null;
      valid_until: string | null;
      part_a_json: string | null;
      part_b_json: string | null;
    }>(
      `select id, stub_no, ewb_no, status, valid_from::text as valid_from, valid_until::text as valid_until, part_a_json, part_b_json
         from eway_bill where doc_type = $1 and doc_id = $2 and status = 'ACT' order by id desc limit 1`,
      [opts.docType, opts.docId],
    )
  )[0];
  if (existing?.ewb_no) {
    return {
      id: existing.id,
      stubNo: existing.stub_no,
      ewbNo: existing.ewb_no,
      validFrom: existing.valid_from,
      validUntil: existing.valid_until,
      partA: existing.part_a_json ? (JSON.parse(existing.part_a_json) as EwayPartA) : await previewEwayPartA(sql, opts),
      partB: existing.part_b_json ? (JSON.parse(existing.part_b_json) as EwayPartB) : null,
      status: "ACT",
      already: true,
    };
  }
  const { required, partA, sameState } = await assertEwayNeeded(sql, opts);
  if (!required && !opts.force) {
    throw new Error("E-way not required (below threshold and intra-state). Tick force to generate.");
  }
  const wantPartB = Boolean(opts.vehicle) || Boolean(opts.skipSameState50km) || n(opts.distanceKm) > 0;
  const partB = wantPartB
    ? mapPartB({
        vehicle: opts.vehicle,
        distanceKm: opts.distanceKm,
        skipSameState50km: opts.skipSameState50km,
        sameState,
        transDoc: opts.transDoc,
      })
    : null;
  let result: StubEwayResult;
  try {
    result = generateEwayViaMode(partA, partB, { mode, simulate: opts.simulate, now: opts.now });
  } catch (e) {
    await logCall(sql, {
      kind: "EWAY",
      mode,
      docType: opts.docType,
      docId: opts.docId,
      request: { partA, partB },
      response: { error: e instanceof Error ? e.message : String(e) },
      status: "ERR",
    });
    throw e;
  }
  const stubNo = assertDocSerial(await nextDoc(sql, "EWB"));
  const row = (
    await sql.query<{ id: number }>(
      `insert into eway_bill (
         stub_no, doc_type, doc_id, doc_no, doc_date, recipient_gstin, delivery_pin, value_paise, hsn,
         reason_code, reason_label, document_type, bill_to_gstin, ship_to_gstin, vehicle, mode,
         trans_doc, distance_km, skipped_vehicle, part_b_at, nic_signed, created_by,
         ewb_no, sub_supply_type, valid_from, valid_until, skip_same_state_50km,
         part_a_json, part_b_json, request_json, response_json, status
       ) values (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,
         $10,$11,$12,$13,$14,$15,$16,
         $17,$18,$19,$20,false,$21,
         $22,$23,$24,$25,$26,
         $27,$28,$29,$30,'ACT'
       ) returning id`,
      [
        stubNo,
        opts.docType,
        opts.docId,
        partA.docNo,
        nicDateToIso(partA.docDate),
        partA.toGstin,
        String(partA.toPincode || ""),
        Math.round(partA.totalValue * 100),
        partA.hsnCode,
        partA.transType,
        partA.subSupplyDesc,
        opts.docType === "CHALLAN" ? "Delivery Challan" : "Invoice",
        partA.billToGstin,
        partA.shipToGstin,
        partB?.vehicleNo ?? "",
        partB?.transModeLabel ?? "Road",
        partB?.transDocNo ?? "",
        partB?.transDistance ?? opts.distanceKm,
        Boolean(partB?.skipSameState50km),
        partB ? (opts.now ?? new Date()).toISOString() : null,
        opts.userId,
        result.ewbNo,
        partA.subSupplyType,
        result.validFrom,
        result.validUntil,
        Boolean(partB?.skipSameState50km),
        redactJson(partA),
        partB ? redactJson(partB) : null,
        redactJson({ partA, partB }),
        redactJson(result),
      ],
    )
  )[0]!;
  const ewayNo = result.ewbNo;
  if (opts.docType === "CHALLAN") {
    await sql.query(`update job_work_challan set eway_no = $1 where id = $2`, [ewayNo, opts.docId]);
  } else {
    await sql.query(`update sales_invoice set eway_no = $1 where id = $2`, [ewayNo, opts.docId]);
  }
  await logCall(sql, {
    kind: "EWAY",
    mode,
    docType: opts.docType,
    docId: opts.docId,
    request: { partA, partB },
    response: result,
    status: "ACT",
  });
  await audit(sql, {
    userId: opts.userId,
    action: "EWAY_GENERATE",
    entity: "eway_bill",
    entityId: row.id,
    after: { ewbNo: result.ewbNo, subSupplyType: partA.subSupplyType, docType: partA.docType, mode },
  });
  return { ...result, id: row.id, stubNo, already: false };
}

export async function updatePersistedPartB(
  sql: Sql,
  opts: {
    ewayId: number;
    userId: string;
    vehicle?: string;
    distanceKm: number;
    skipSameState50km?: boolean;
    transDoc?: string;
    now?: Date;
  },
): Promise<StubEwayResult> {
  const row = (
    await sql.query<{
      id: number;
      doc_type: string;
      doc_id: number;
      part_a_json: string | null;
      status: string;
    }>(`select id, doc_type, doc_id, part_a_json, status from eway_bill where id = $1`, [opts.ewayId])
  )[0];
  if (!row) throw new Error("e-way not found");
  if (row.status !== "ACT") throw new Error("e-way is not active.");
  const partA = row.part_a_json
    ? (JSON.parse(row.part_a_json) as EwayPartA)
    : await previewEwayPartA(sql, { docType: row.doc_type as "INVOICE" | "CHALLAN", docId: row.doc_id });
  const sameState = partA.fromStateCode === partA.toStateCode;
  const partB = mapPartB({
    vehicle: opts.vehicle,
    distanceKm: opts.distanceKm,
    skipSameState50km: opts.skipSameState50km,
    sameState,
    transDoc: opts.transDoc,
  });
  const mode = resolveNicMode("EWAY", await setting(sql, "eway_mode", "stub"));
  const result = generateEwayViaMode(partA, partB, { mode, now: opts.now });
  await sql.query(
    `update eway_bill set
       vehicle = $1, mode = $2, trans_doc = $3, distance_km = $4, skipped_vehicle = $5,
       skip_same_state_50km = $5, part_b_at = $6, valid_from = $7, valid_until = $8,
       part_b_json = $9, response_json = $10, ewb_no = $11
     where id = $12`,
    [
      partB.vehicleNo,
      partB.transModeLabel,
      partB.transDocNo ?? "",
      partB.transDistance,
      partB.skipSameState50km,
      opts.now ?? new Date(),
      result.validFrom,
      result.validUntil,
      redactJson(partB),
      redactJson(result),
      result.ewbNo,
      opts.ewayId,
    ],
  );
  await audit(sql, {
    userId: opts.userId,
    action: "EWAY_PART_B",
    entity: "eway_bill",
    entityId: opts.ewayId,
    after: { vehicle: partB.vehicleNo, validFrom: result.validFrom },
  });
  return result;
}

export async function cancelPersistedEway(
  sql: Sql,
  opts: { ewayId: number; userId: string },
): Promise<{ ewbNo: string; status: "CNL" }> {
  const row = (
    await sql.query<{ id: number; ewb_no: string | null; status: string; doc_type: string; doc_id: number }>(
      `select id, ewb_no, status, doc_type, doc_id from eway_bill where id = $1`,
      [opts.ewayId],
    )
  )[0];
  if (!row) throw new Error("e-way not found");
  if (row.status !== "ACT") throw new Error("e-way is not active.");
  await sql.query(`update eway_bill set status = 'CNL' where id = $1`, [opts.ewayId]);
  await audit(sql, {
    userId: opts.userId,
    action: "EWAY_CANCEL",
    entity: "eway_bill",
    entityId: opts.ewayId,
    after: { ewbNo: row.ewb_no, status: "CNL" },
  });
  return { ewbNo: row.ewb_no ?? "", status: "CNL" };
}

export async function confirmGateOut(
  sql: Sql,
  opts: { docType: "INVOICE" | "CHALLAN"; docId: number; userId: string },
): Promise<{ gateOutAt: string }> {
  const { required } = await assertEwayNeeded(sql, opts);
  if (required) {
    const ewb = (
      await sql.query<{ id: number; valid_from: string | null; skip_same_state_50km: boolean; status: string }>(
        `select id, valid_from::text as valid_from, skip_same_state_50km, status
           from eway_bill where doc_type = $1 and doc_id = $2 and status = 'ACT' order by id desc limit 1`,
        [opts.docType, opts.docId],
      )
    )[0];
    if (!ewb) throw new Error("Gate-out blocked — e-way is required and missing.");
    if (!ewb.valid_from && !ewb.skip_same_state_50km) {
      throw new Error("Gate-out blocked — e-way Part B is missing (vehicle or ≤ 50 km same State/UT).");
    }
  }
  const now = new Date().toISOString();
  if (opts.docType === "INVOICE") {
    await sql.query(`update sales_invoice set gate_out_at = $1 where id = $2`, [now, opts.docId]);
  } else {
    await sql.query(`update job_work_challan set gate_out_at = $1 where id = $2`, [now, opts.docId]);
  }
  await audit(sql, {
    userId: opts.userId,
    action: "GATE_OUT",
    entity: opts.docType === "INVOICE" ? "sales_invoice" : "job_work_challan",
    entityId: opts.docId,
    after: { gateOutAt: now },
  });
  return { gateOutAt: now };
}
