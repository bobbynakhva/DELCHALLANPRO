/**
 * Finance lite — journals for value-changing stock moves.
 * Does not replace posting.ts; called from it in the same transaction.
 */
import type { Sql } from "@/lib/db";
import { nextDoc } from "@/lib/erp/core.server";
import { n, todayISO } from "@/lib/erp/format";
import {
  assertNotFuture,
  linesBalance,
  linesForStockMove,
  type JLine,
  type MoveJournalInput,
  yearMonth,
} from "./journal-math";

export * from "./journal-math";

export async function assertPeriodAllows(
  sql: Sql,
  isoDate: string,
  kind: "STOCK" | "INVOICE" | "BILL" | "JOURNAL" | "YEAR_END_ADJ" = "STOCK",
): Promise<void> {
  assertNotFuture(isoDate, todayISO());
  const ym = yearMonth(isoDate);
  const row = (await sql.query<{ status: string }>(`select status from period_lock where year_month = $1`, [ym]))[0];
  const status = row?.status ?? "OPEN";
  if (status === "LOCKED" && kind !== "YEAR_END_ADJ") {
    throw new Error(`Period ${ym} is LOCKED — no ${kind.toLowerCase()} in that month (YEAR_END_ADJ only)`);
  }
}

export async function postJournal(
  sql: Sql,
  opts: {
    date?: string;
    narration: string;
    sourceType?: string;
    sourceId?: number;
    stockMoveId?: number;
    reversesJournalId?: number;
    userId?: string;
    lines: JLine[];
    kind?: "JOURNAL" | "YEAR_END_ADJ";
  },
): Promise<{ id: number; docNo: string } | null> {
  const lines = opts.lines.filter((l) => l.debit !== 0 || l.credit !== 0);
  if (lines.length === 0) return null;
  if (!linesBalance(lines)) {
    throw new Error(`Journal does not balance: ${JSON.stringify(lines)}`);
  }
  const date = opts.date ?? todayISO();
  await assertPeriodAllows(sql, date, opts.kind ?? "JOURNAL");
  const docNo = await nextDoc(sql, "JV");
  const j = (
    await sql.query<{ id: number }>(
      `insert into journal (doc_no, jv_date, narration, source_type, source_id, stock_move_id, reverses_journal_id, user_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8) returning id`,
      [
        docNo,
        date,
        opts.narration,
        opts.sourceType ?? null,
        opts.sourceId ?? null,
        opts.stockMoveId ?? null,
        opts.reversesJournalId ?? null,
        opts.userId ?? null,
      ],
    )
  )[0]!;
  let i = 1;
  for (const ln of lines) {
    await sql.query(
      `insert into journal_line (journal_id, line_no, account_code, debit_paise, credit_paise, stock_move_id)
       values ($1,$2,$3,$4,$5,$6)`,
      [j.id, i++, ln.account, ln.debit, ln.credit, opts.stockMoveId ?? null],
    );
  }
  return { id: j.id, docNo };
}

export async function journalFromMove(
  sql: Sql,
  opts: MoveJournalInput & {
    moveId: number;
    userId?: string;
    refType?: string;
    refId?: number;
    reverseOf?: number | null;
    date?: string;
  },
): Promise<void> {
  const lines = linesForStockMove(opts);
  if (lines.length === 0) return;
  let reverses: number | null = null;
  if (opts.reverseOf) {
    const prev = (
      await sql.query<{ id: number }>(`select id from journal where stock_move_id = $1 order by id desc limit 1`, [
        opts.reverseOf,
      ])
    )[0];
    reverses = prev?.id ?? null;
  }
  await postJournal(sql, {
    narration: `${opts.type} move #${opts.moveId}`,
    sourceType: opts.refType ?? opts.type,
    sourceId: opts.refId,
    stockMoveId: opts.moveId,
    reversesJournalId: reverses ?? undefined,
    userId: opts.userId,
    date: opts.date,
    lines,
  });
}

export async function trialBalance(sql: Sql): Promise<{
  rows: Array<{ code: string; name: string; type: string; debit: number; credit: number }>;
  debit: number;
  credit: number;
  balanced: boolean;
}> {
  const rows = await sql.query<{ code: string; name: string; type: string; debit: string; credit: string }>(
    `select a.code, a.name, a.type,
            coalesce(sum(l.debit_paise),0)::bigint as debit,
            coalesce(sum(l.credit_paise),0)::bigint as credit
       from chart_of_accounts a
       left join journal_line l on l.account_code = a.code
      group by a.code, a.name, a.type
      having coalesce(sum(l.debit_paise),0) <> 0 or coalesce(sum(l.credit_paise),0) <> 0
      order by a.code`,
  );
  const mapped = rows.map((r) => ({
    code: r.code,
    name: r.name,
    type: r.type,
    debit: n(r.debit),
    credit: n(r.credit),
  }));
  const debit = mapped.reduce((s, r) => s + r.debit, 0);
  const credit = mapped.reduce((s, r) => s + r.credit, 0);
  return { rows: mapped, debit, credit, balanced: debit === credit };
}
