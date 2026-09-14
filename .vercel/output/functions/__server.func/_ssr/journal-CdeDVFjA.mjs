import { c as todayISO, o as n$1 } from "./format-Bcy9062O.mjs";
import { a as nextDoc } from "./core.server-BOQw3eDO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/journal-CdeDVFjA.js
/** Pure journal mapping — no server imports (node:test). */
function n(v) {
	if (v == null || v === "") return 0;
	const x = typeof v === "number" ? v : Number(v);
	return Number.isFinite(x) ? x : 0;
}
var INV_ACCOUNT = {
	RM: "1110",
	SCRAP: "1120",
	SFG: "1135",
	HOLD: "1135",
	FG: "1140",
	REJECT: "1140",
	JW_OUT: "1150",
	TOOL: "1110"
};
function absPaise(v) {
	return Math.abs(Math.round(n(v)));
}
function pair(dr, cr, paise) {
	const p = absPaise(paise);
	if (p === 0) return [];
	return [{
		account: dr,
		debit: p,
		credit: 0
	}, {
		account: cr,
		debit: 0,
		credit: p
	}];
}
function inventoryAccount(kind, code) {
	if (code === "JW-OUT") return "1150";
	if (code === "RM-SCRAP") return "1120";
	if (code === "SFG" || code === "FG-HOLD") return "1135";
	return INV_ACCOUNT[kind] ?? "1110";
}
function linesForStockMove(m) {
	if ((m.ownerType ?? "OWN") === "CUSTOMER") return [];
	if (m.type.startsWith("JW_IN")) return [];
	const t = m.type;
	const qty = n(m.qtyKg);
	const val = n(m.valuePaise);
	const inv = inventoryAccount(m.warehouseKind, m.warehouseCode);
	if (t === "QC_RELEASE" || t === "QC_REJECT" || t === "TRANSFER") return [];
	if (t === "JW_EXCESS_LOSS") return [];
	if (t === "OPENING" && val !== 0) return pair(inv, "3100", val);
	if (t === "GRN_RECEIPT" && qty > 0) return pair("1110", "2110", val);
	if (t === "WO_ISSUE" && qty < 0) return pair("1130", inv, val);
	if (t === "WO_RECEIPT_SFG_FG" && qty > 0) return pair(inv, "1130", val);
	if ((t === "WO_SCRAP" || t === "WO_BACKFLUSH") && qty > 0) return pair("1120", "1130", val);
	if (t === "JW_OUT" && qty < 0) return pair("1150", inv, val);
	if (t === "JW_OUT" && qty > 0) return [];
	if (t === "JW_RETURN_GOOD" && qty > 0) return pair(inv, "1150", val);
	if (t === "JW_RETURN_REJECT" && qty > 0) return pair(inv, "1150", val);
	if (t === "JW_RETURN_SCRAP" && qty > 0) return pair("1120", "1150", val);
	if ((t === "JW_RETURN_GOOD" || t === "JW_RETURN_REJECT" || t === "JW_RETURN_SCRAP") && qty < 0) return [];
	if (t === "DISPATCH" && qty < 0) return pair("5110", inv, val);
	if (t === "SALES_RETURN" && qty > 0) return pair(inv, "5110", val);
	if ((t === "ADJUST_PLUS" || t === "ADJUST") && qty > 0) return pair(inv, "5120", val);
	if ((t === "ADJUST_MINUS" || t === "ADJUST") && qty < 0) return pair("5120", inv, val);
	if (t === "MELT_OUT" && qty < 0) return pair("1130", inv, val);
	if (val !== 0 && qty > 0) return pair(inv, "1199", val);
	if (val !== 0 && qty < 0) return pair("1199", inv, val);
	return [];
}
function linesBalance(lines) {
	return lines.reduce((s, l) => s + l.debit, 0) === lines.reduce((s, l) => s + l.credit, 0);
}
function invoiceJournalLines(opts) {
	const sales = opts.isExport ? "4120" : "4110";
	const lines = [{
		account: "2200",
		debit: absPaise(opts.totalPaise),
		credit: 0
	}, {
		account: sales,
		debit: 0,
		credit: absPaise(opts.taxablePaise)
	}];
	if (opts.cgstPaise) lines.push({
		account: "2140",
		debit: 0,
		credit: absPaise(opts.cgstPaise)
	});
	if (opts.sgstPaise) lines.push({
		account: "2150",
		debit: 0,
		credit: absPaise(opts.sgstPaise)
	});
	if (opts.igstPaise) lines.push({
		account: "2160",
		debit: 0,
		credit: absPaise(opts.igstPaise)
	});
	return lines;
}
function billMatchLines(opts) {
	const total = absPaise(opts.taxablePaise) + absPaise(opts.cgstPaise) + absPaise(opts.sgstPaise) + absPaise(opts.igstPaise);
	const lines = [{
		account: "2110",
		debit: absPaise(opts.taxablePaise),
		credit: 0
	}, {
		account: "2120",
		debit: 0,
		credit: total
	}];
	if (opts.cgstPaise) lines.push({
		account: "2170",
		debit: absPaise(opts.cgstPaise),
		credit: 0
	});
	if (opts.sgstPaise) lines.push({
		account: "2180",
		debit: absPaise(opts.sgstPaise),
		credit: 0
	});
	if (opts.igstPaise) lines.push({
		account: "2190",
		debit: absPaise(opts.igstPaise),
		credit: 0
	});
	return lines;
}
function jwVendorBillLines(opts) {
	const total = absPaise(opts.chargesPaise) + absPaise(opts.cgstPaise) + absPaise(opts.sgstPaise);
	const lines = [{
		account: "5140",
		debit: absPaise(opts.chargesPaise),
		credit: 0
	}, {
		account: "2120",
		debit: 0,
		credit: total
	}];
	if (opts.cgstPaise) lines.push({
		account: "2170",
		debit: absPaise(opts.cgstPaise),
		credit: 0
	});
	if (opts.sgstPaise) lines.push({
		account: "2180",
		debit: absPaise(opts.sgstPaise),
		credit: 0
	});
	return lines;
}
function receiptLines(amountPaise) {
	return pair("2210", "2200", amountPaise);
}
function excessLossLines(paise) {
	return pair("5130", "1150", paise);
}
function yearMonth(iso) {
	return String(iso).slice(0, 7);
}
function assertNotFuture(iso, today) {
	const t = /* @__PURE__ */ new Date(today + "T00:00:00Z");
	t.setUTCDate(t.getUTCDate() + 1);
	if (iso > t.toISOString().slice(0, 10)) throw new Error(`Document date ${iso} is more than one day in the future`);
}
async function assertPeriodAllows(sql, isoDate, kind = "STOCK") {
	assertNotFuture(isoDate, todayISO());
	const ym = yearMonth(isoDate);
	if (((await sql.query(`select status from period_lock where year_month = $1`, [ym]))[0]?.status ?? "OPEN") === "LOCKED" && kind !== "YEAR_END_ADJ") throw new Error(`Period ${ym} is LOCKED — no ${kind.toLowerCase()} in that month (YEAR_END_ADJ only)`);
}
async function postJournal(sql, opts) {
	const lines = opts.lines.filter((l) => l.debit !== 0 || l.credit !== 0);
	if (lines.length === 0) return null;
	if (!linesBalance(lines)) throw new Error(`Journal does not balance: ${JSON.stringify(lines)}`);
	const date = opts.date ?? todayISO();
	await assertPeriodAllows(sql, date, opts.kind ?? "JOURNAL");
	const docNo = await nextDoc(sql, "JV");
	const j = (await sql.query(`insert into journal (doc_no, jv_date, narration, source_type, source_id, stock_move_id, reverses_journal_id, user_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`, [
		docNo,
		date,
		opts.narration,
		opts.sourceType ?? null,
		opts.sourceId ?? null,
		opts.stockMoveId ?? null,
		opts.reversesJournalId ?? null,
		opts.userId ?? null
	]))[0];
	let i = 1;
	for (const ln of lines) await sql.query(`insert into journal_line (journal_id, line_no, account_code, debit_paise, credit_paise, stock_move_id)
       values ($1,$2,$3,$4,$5,$6)`, [
		j.id,
		i++,
		ln.account,
		ln.debit,
		ln.credit,
		opts.stockMoveId ?? null
	]);
	return {
		id: j.id,
		docNo
	};
}
async function journalFromMove(sql, opts) {
	const lines = linesForStockMove(opts);
	if (lines.length === 0) return;
	let reverses = null;
	if (opts.reverseOf) reverses = (await sql.query(`select id from journal where stock_move_id = $1 order by id desc limit 1`, [opts.reverseOf]))[0]?.id ?? null;
	await postJournal(sql, {
		narration: `${opts.type} move #${opts.moveId}`,
		sourceType: opts.refType ?? opts.type,
		sourceId: opts.refId,
		stockMoveId: opts.moveId,
		reversesJournalId: reverses ?? void 0,
		userId: opts.userId,
		lines
	});
}
async function trialBalance(sql) {
	const mapped = (await sql.query(`select a.code, a.name, a.type,
            coalesce(sum(l.debit_paise),0)::bigint as debit,
            coalesce(sum(l.credit_paise),0)::bigint as credit
       from chart_of_accounts a
       left join journal_line l on l.account_code = a.code
      group by a.code, a.name, a.type
      having coalesce(sum(l.debit_paise),0) <> 0 or coalesce(sum(l.credit_paise),0) <> 0
      order by a.code`)).map((r) => ({
		code: r.code,
		name: r.name,
		type: r.type,
		debit: n$1(r.debit),
		credit: n$1(r.credit)
	}));
	const debit = mapped.reduce((s, r) => s + r.debit, 0);
	const credit = mapped.reduce((s, r) => s + r.credit, 0);
	return {
		rows: mapped,
		debit,
		credit,
		balanced: debit === credit
	};
}
//#endregion
export { journalFromMove as a, receiptLines as c, invoiceJournalLines as i, trialBalance as l, billMatchLines as n, jwVendorBillLines as o, excessLossLines as r, postJournal as s, assertPeriodAllows as t };
