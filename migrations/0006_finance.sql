-- Prompt 05: finance lite — COA, journals, AR/AP, period lock. Prompt 01–04 tables stay.

alter table stock_lot alter column qty_kg type numeric(18,4);
alter table stock_move alter column qty_kg type numeric(18,4);

alter table partner add column if not exists is_msme boolean not null default false;
alter table partner add column if not exists credit_days integer not null default 45;
update partner set is_msme = true, credit_days = 45 where code = 'V-RAJESH';
update partner set is_msme = true, credit_days = 45 where code in ('V-KIRAN','V-AMIT');

alter table sales_invoice add column if not exists received_paise bigint not null default 0;
alter table sales_invoice add column if not exists due_date date;
alter table sales_invoice add column if not exists cancelled_at timestamptz;
alter table sales_invoice add column if not exists cancel_reason text;
update sales_invoice set due_date = invoice_date + 30 where due_date is null;

create table if not exists chart_of_accounts (
  code text primary key,
  name text not null,
  type text not null,
  parent_code text
);

insert into chart_of_accounts (code, name, type) values
  ('1110', 'Raw material inventory', 'ASSET'),
  ('1120', 'Scrap inventory', 'ASSET'),
  ('1130', 'WIP', 'ASSET'),
  ('1135', 'SFG inventory', 'ASSET'),
  ('1140', 'Finished goods', 'ASSET'),
  ('1150', 'JW-OUT (our metal at vendor)', 'ASSET'),
  ('1199', 'Inventory clearing', 'ASSET'),
  ('2110', 'GRN inwards (unbilled)', 'LIABILITY'),
  ('2120', 'Trade creditors', 'LIABILITY'),
  ('2140', 'Output CGST', 'LIABILITY'),
  ('2150', 'Output SGST', 'LIABILITY'),
  ('2160', 'Output IGST', 'LIABILITY'),
  ('2170', 'Input CGST', 'ASSET'),
  ('2180', 'Input SGST', 'ASSET'),
  ('2190', 'Input IGST', 'ASSET'),
  ('2200', 'Trade debtors', 'ASSET'),
  ('2210', 'Bank / cash', 'ASSET'),
  ('3100', 'Opening capital', 'EQUITY'),
  ('4110', 'Sales — domestic', 'INCOME'),
  ('4120', 'Sales — export', 'INCOME'),
  ('4130', 'Scrap sales', 'INCOME'),
  ('4140', 'Conversion / JW income', 'INCOME'),
  ('5110', 'Cost of goods sold', 'EXPENSE'),
  ('5120', 'Metal / yield variance', 'EXPENSE'),
  ('5130', 'JW excess loss', 'EXPENSE'),
  ('5140', 'JW conversion charges', 'EXPENSE')
on conflict (code) do nothing;

create table if not exists journal (
  id serial primary key,
  doc_no text not null unique,
  jv_date date not null,
  narration text not null,
  source_type text,
  source_id integer,
  stock_move_id integer,
  reverses_journal_id integer,
  user_id text,
  posted_at timestamptz not null default now()
);

create table if not exists journal_line (
  id serial primary key,
  journal_id integer not null references journal(id) on delete cascade,
  line_no integer not null,
  account_code text not null references chart_of_accounts(code),
  debit_paise bigint not null default 0,
  credit_paise bigint not null default 0,
  stock_move_id integer
);

create table if not exists period_lock (
  year_month text primary key,
  status text not null default 'OPEN',
  closed_by text,
  closed_at timestamptz
);

insert into period_lock (year_month, status)
select to_char(d, 'YYYY-MM'), 'OPEN'
from generate_series('2026-03-01'::date, '2027-03-01'::date, '1 month') d
on conflict (year_month) do nothing;

create table if not exists vendor_bill (
  id serial primary key,
  doc_no text not null unique,
  partner_id integer not null references partner(id),
  bill_date date not null,
  due_date date not null,
  grn_id integer references grn(id),
  jw_return_id integer references job_work_return(id),
  kind text not null default 'GRN',
  taxable_paise bigint not null default 0,
  cgst_paise bigint not null default 0,
  sgst_paise bigint not null default 0,
  igst_paise bigint not null default 0,
  total_paise bigint not null default 0,
  status text not null default 'POSTED',
  created_by text
);

create table if not exists vendor_bill_line (
  id serial primary key,
  bill_id integer not null references vendor_bill(id) on delete cascade,
  item_id integer references item(id),
  qty numeric(18,4) not null,
  qty_uom text not null default 'KG',
  rate_paise integer not null,
  taxable_paise bigint not null
);

create table if not exists ar_receipt (
  id serial primary key,
  doc_no text not null unique,
  partner_id integer not null references partner(id),
  receipt_date date not null,
  amount_paise bigint not null,
  mode text not null default 'NEFT',
  created_by text
);

create table if not exists ar_receipt_alloc (
  id serial primary key,
  receipt_id integer not null references ar_receipt(id) on delete cascade,
  invoice_id integer not null references sales_invoice(id),
  amount_paise bigint not null
);

insert into number_series (doc_type, prefix, next_no, pad) values
  ('JV',   'JV/26-27/',   1, 5),
  ('BILL', 'BILL/26-27/', 1, 4),
  ('RCT',  'RCT/26-27/',  1, 4),
  ('TI',   'TI/26-27/',   1, 6)
on conflict (doc_type) do nothing;

insert into settings (key, value) values
  ('adjust_threshold_paise', '500000'),
  ('session_hours', '8'),
  ('plant_db', 'postgres')
on conflict (key) do nothing;

-- Opening journals: Dr inventory Cr capital. Skip customer-owned (value 0).
do $$
declare
  jid int;
  n int := 1;
  mv record;
  acc text;
  jno text;
begin
  if exists (select 1 from journal where source_type = 'OPENING') then
    null;
  else
    jno := 'JV/26-27/' || lpad('1', 5, '0');
    insert into journal (doc_no, jv_date, narration, source_type)
      values (jno, '2026-04-01', 'Opening balances FY 26-27', 'OPENING')
      returning id into jid;
    for mv in
      select m.id, m.value_paise, w.kind, w.code
        from stock_move m
        join warehouse w on w.id = m.warehouse_id
        join stock_lot l on l.id = m.lot_id
       where m.move_type = 'OPENING' and m.value_paise <> 0 and l.owner_type = 'OWN'
    loop
      acc := case
        when mv.kind in ('RM') then '1110'
        when mv.kind in ('SCRAP') then '1120'
        when mv.kind in ('SFG','HOLD') then '1135'
        when mv.kind in ('FG','REJECT') then '1140'
        when mv.kind in ('JW_OUT') then '1150'
        else '1110'
      end;
      insert into journal_line (journal_id, line_no, account_code, debit_paise, credit_paise, stock_move_id)
        values (jid, n, acc, abs(mv.value_paise), 0, mv.id);
      n := n + 1;
      insert into journal_line (journal_id, line_no, account_code, debit_paise, credit_paise, stock_move_id)
        values (jid, n, '3100', 0, abs(mv.value_paise), mv.id);
      n := n + 1;
    end loop;
    update number_series set next_no = 2 where doc_type = 'JV';
  end if;
end $$;
