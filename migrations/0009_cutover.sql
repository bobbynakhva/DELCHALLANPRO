-- Prompt 06c: cutover kit. Prompt 01–06b tables stay. ADD only.

insert into settings (key, value) values
  ('cutover_blocks_live_docs', 'false')
on conflict (key) do nothing;

insert into warehouse (code, name, kind, is_customer_owned, is_outside_factory, valuation_eligible)
values
  ('CUTOVER-RM', 'Cutover RM (CUTOVERDEMO)', 'RM', false, false, true),
  ('CUTOVER-FG', 'Cutover FG (CUTOVERDEMO)', 'FG', false, false, true),
  ('CUTOVER-JW-OUT', 'Cutover JW-OUT (CUTOVERDEMO)', 'JW_OUT', false, false, true),
  ('CUTOVER-JW-IN', 'Cutover customer metal (CUTOVERDEMO)', 'JW_IN', true, false, false)
on conflict (code) do nothing;

insert into number_series (doc_type, prefix, next_no, pad) values
  ('CUTOVER', 'CUT/26-27/', 1, 4),
  ('OC', 'OC/26-27/', 1, 4)
on conflict (doc_type) do nothing;

create table if not exists cutover_company (
  id serial primary key,
  code text not null unique,
  name text not null,
  opening_date date not null,
  state text not null default 'NOT_STARTED',
  cutover_blocks_live_docs boolean not null default true,
  live_at timestamptz,
  tally_sunset_at timestamptz,
  owner_override boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

insert into cutover_company (code, name, opening_date, state, cutover_blocks_live_docs)
values ('CUTOVERDEMO', 'Cutover Demo Co', current_date, 'NOT_STARTED', true)
on conflict (code) do nothing;

create table if not exists cutover_opening_stock (
  id serial primary key,
  company_id integer not null references cutover_company(id) on delete cascade,
  sku text not null,
  lot_no text not null,
  warehouse_code text not null,
  alloy_code text,
  qty_kg numeric(18,4) not null default 0,
  qty_pcs numeric(18,4) not null default 0,
  rate_paise_per_kg bigint not null default 0,
  value_paise bigint not null default 0,
  heat_no text,
  owner_type text not null default 'OWN',
  customer_code text,
  notes text,
  lot_id integer references stock_lot(id),
  posted_move_id integer,
  dry_run_ok boolean,
  error_text text,
  created_at timestamptz not null default now()
);

create table if not exists cutover_opening_jw (
  id serial primary key,
  company_id integer not null references cutover_company(id) on delete cascade,
  original_challan_no text not null,
  original_challan_date date not null,
  statutory_due date not null,
  partner_code text not null,
  process_code text not null default 'NI_CR',
  sku text not null,
  qty_pcs numeric(18,4) not null default 0,
  qty_kg numeric(18,4) not null default 0,
  rate_paise_per_kg bigint not null default 0,
  value_paise bigint not null default 0,
  challan_id integer references job_work_challan(id),
  lot_id integer references stock_lot(id),
  confirmation_no text,
  snapshot_json text,
  created_at timestamptz not null default now()
);

create table if not exists cutover_opening_subledger (
  id serial primary key,
  company_id integer not null references cutover_company(id) on delete cascade,
  kind text not null,
  partner_code text not null,
  amount_paise bigint not null default 0,
  tally_code text,
  notes text
);

create table if not exists cutover_opening_tb (
  id serial primary key,
  company_id integer not null references cutover_company(id) on delete cascade,
  tamba_code text not null,
  tally_code text,
  debit_paise bigint not null default 0,
  credit_paise bigint not null default 0
);

create table if not exists tally_ledger_map (
  tamba_code text primary key references chart_of_accounts(code),
  tally_code text not null,
  tally_ledger text not null,
  tally_group text
);

insert into tally_ledger_map (tamba_code, tally_code, tally_ledger, tally_group) values
  ('1110', '1200', 'Raw material', 'Inventory'),
  ('1120', '1210', 'Scrap', 'Inventory'),
  ('1130', '1220', 'WIP', 'Inventory'),
  ('1135', '1230', 'SFG', 'Inventory'),
  ('1140', '1240', 'Finished goods', 'Inventory'),
  ('1150', '1245', 'JW-OUT metal', 'Inventory'),
  ('2200', '1100', 'Sundry debtors', 'Current assets'),
  ('2120', '2000', 'Sundry creditors', 'Current liabilities'),
  ('3100', '3000', 'Opening capital', 'Capital')
on conflict (tamba_code) do nothing;

create table if not exists cutover_signoff (
  id serial primary key,
  company_id integer not null references cutover_company(id) on delete cascade,
  gate text not null,
  signed_by text,
  signed_at timestamptz,
  notes text,
  unique (company_id, gate)
);

create table if not exists cutover_export (
  id serial primary key,
  company_id integer not null references cutover_company(id) on delete cascade,
  kind text not null,
  path text not null,
  header text,
  created_at timestamptz not null default now()
);
