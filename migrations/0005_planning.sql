-- Prompt 04: quote freeze, tariffs, ATP, MRP, variance period, planning fields.
-- Prompt 01–03 tables stay; this only adds planning columns / new tables.

-- Item planning (do not fake MRP)
alter table item add column if not exists safety_stock_pcs numeric(14,3) not null default 0;
alter table item add column if not exists min_qty_kg numeric(14,3) not null default 0;
alter table item add column if not exists daily_pcs numeric(14,3) not null default 0;
alter table item add column if not exists purchase_lead_days integer not null default 7;
alter table item add column if not exists pack_days integer not null default 1;
alter table item add column if not exists jw_days integer not null default 14;

-- Work-centre weekly load
alter table work_center add column if not exists weekly_minutes integer not null default 2880;
alter table work_center add column if not exists daily_pcs numeric(14,3) not null default 0;
alter table work_center add column if not exists queue_days integer not null default 0;

update work_center set weekly_minutes = 2880, daily_pcs = 1600 where code = 'CNC-1';
update work_center set weekly_minutes = 2880, daily_pcs = 1400 where code = 'CNC-2';
update work_center set weekly_minutes = 2400, daily_pcs = 400 where code = 'FORGE-1';
update work_center set weekly_minutes = 2400, daily_pcs = 0, queue_days = 7 where code = 'SUB-PLATE';
update work_center set weekly_minutes = 2400, daily_pcs = 0, queue_days = 5 where code = 'SUB-POLISH';

update routing_op set setup_min = 30 where process_code = 'MACHINE' and setup_min = 0;

update item set daily_pcs = 1600, safety_stock_pcs = 500, pack_days = 1, jw_days = 14
  where sku = 'HEX-NIPPLE-1/2-NCR';
update item set daily_pcs = 900, safety_stock_pcs = 200, pack_days = 1, jw_days = 14
  where sku like 'HEX-NIPPLE-%' and sku <> 'HEX-NIPPLE-1/2-NCR';
update item set daily_pcs = 2500, safety_stock_pcs = 400, pack_days = 1, jw_days = 10
  where sku like 'INSERT-%';
update item set daily_pcs = 400, safety_stock_pcs = 100, pack_days = 2, jw_days = 12
  where sku like 'UNION-%' or sku like 'ELBOW-%';
update item set daily_pcs = 500, safety_stock_pcs = 50, pack_days = 1
  where sku like 'BUSH-%';
update item set min_qty_kg = 50, purchase_lead_days = 7 where type = 'RM';

-- Quote freeze columns
alter table quotation add column if not exists currency text not null default 'INR';
alter table quotation add column if not exists fx_rate numeric(12,4) not null default 1;
alter table quotation add column if not exists metal_basis text not null default 'CU_ZN_BLEND';
alter table quotation add column if not exists fx_snapshot text;

update quotation set status = 'SENT' where status = 'OPEN';

alter table quotation_line add column if not exists cu_pct numeric(6,3);
alter table quotation_line add column if not exists zn_pct numeric(6,3);
alter table quotation_line add column if not exists pb_pct numeric(6,3);
alter table quotation_line add column if not exists cu_paise_per_kg integer;
alter table quotation_line add column if not exists zn_paise_per_kg integer;
alter table quotation_line add column if not exists pb_paise_per_kg integer;
alter table quotation_line add column if not exists metal_rate_date date;
alter table quotation_line add column if not exists blended_paise_per_kg integer;
alter table quotation_line add column if not exists hsn text;
alter table quotation_line add column if not exists gst_rate_pct numeric(5,2) not null default 18;
alter table quotation_line add column if not exists margin_pct numeric(6,3);
alter table quotation_line add column if not exists alloy_code text;
alter table quotation_line add column if not exists conversion_reason text;
alter table quotation_line add column if not exists formula_text text;

-- Instrument-level metal book (CU / ZN / scrap). Header metal_price remains the day book.
alter table metal_price add column if not exists source text not null default 'manual';

create table if not exists metal_price_line (
  id serial primary key,
  as_of_date date not null,
  instrument text not null,
  rate_paise_per_kg integer not null,
  source text not null default 'manual',
  unique (as_of_date, instrument)
);

insert into metal_price_line (as_of_date, instrument, rate_paise_per_kg, source)
select as_of_date, 'CU_INR_KG', cu_paise_per_kg, coalesce(source, 'manual') from metal_price
on conflict (as_of_date, instrument) do nothing;
insert into metal_price_line (as_of_date, instrument, rate_paise_per_kg, source)
select as_of_date, 'ZN_INR_KG', zn_paise_per_kg, coalesce(source, 'manual') from metal_price
on conflict (as_of_date, instrument) do nothing;
insert into metal_price_line (as_of_date, instrument, rate_paise_per_kg, source)
select as_of_date, 'PB_INR_KG', pb_paise_per_kg, coalesce(source, 'manual') from metal_price
on conflict (as_of_date, instrument) do nothing;
insert into metal_price_line (as_of_date, instrument, rate_paise_per_kg, source)
select as_of_date, 'BRASS_SCRAP_C360_KG', 41000, 'dealer' from metal_price
on conflict (as_of_date, instrument) do nothing;

-- Own-shop process tariffs (dated). PartnerProcessRate remains the JW/challan source.
create table if not exists process_tariff (
  id serial primary key,
  process_code text not null,
  item_family text not null default '',
  item_id integer references item(id),
  rate_paise_per_pc integer not null default 0,
  rate_paise_per_kg integer not null default 0,
  effective_from date not null,
  effective_to date
);

insert into process_tariff (process_code, item_family, rate_paise_per_pc, effective_from)
values
  ('TURN_AUTO', 'NIPPLE', 450, '2026-04-01'),
  ('TURN_AUTO', 'INSERT', 180, '2026-04-01'),
  ('TURN_AUTO', 'BUSH', 500, '2026-04-01'),
  ('TURN_AUTO', 'UNION', 720, '2026-04-01'),
  ('TURN_AUTO', 'ELBOW', 640, '2026-04-01'),
  ('PACK_EXPORT', 'NIPPLE', 40, '2026-04-01'),
  ('PACK_EXPORT', 'UNION', 55, '2026-04-01'),
  ('PACK_EXPORT', 'ELBOW', 50, '2026-04-01'),
  ('PACK_EXPORT', 'INSERT', 15, '2026-04-01');

-- ATP / allocation
alter table so_line add column if not exists promise_date date;
alter table so_line add column if not exists promise_working text;
alter table so_line add column if not exists promise_override_reason text;
alter table so_line add column if not exists reserved_lot_id integer references stock_lot(id);
alter table so_line add column if not exists reserved_pcs numeric(14,3) not null default 0;
alter table sales_order add column if not exists credit_blocked boolean not null default false;
alter table sales_order add column if not exists required_date date;

alter table stock_lot add column if not exists reserved_so_line_id integer references so_line(id);
alter table stock_lot add column if not exists reserved_pcs numeric(14,3) not null default 0;

-- Genealogy: consumed parent move (Prompt 03 walk already uses genealogy_link)
alter table genealogy_link add column if not exists parent_move_id integer;
alter table genealogy_link add column if not exists child_move_id integer;
alter table stock_move add column if not exists parent_move_id integer;
alter table stock_move add column if not exists consumed_lot_id integer references stock_lot(id);

-- MRP
create table if not exists mrp_run (
  id serial primary key,
  run_no text not null unique,
  run_at timestamptz not null default now(),
  horizon_days integer not null,
  time_fence_days integer not null default 3,
  user_id text,
  notes text
);

create table if not exists mrp_line (
  id serial primary key,
  run_id integer not null references mrp_run(id) on delete cascade,
  item_id integer not null references item(id),
  demand_qty numeric(14,3) not null default 0,
  supply_qty numeric(14,3) not null default 0,
  available_qty numeric(14,3) not null default 0,
  open_wo_qty numeric(14,3) not null default 0,
  open_po_qty numeric(14,3) not null default 0,
  jw_pipeline_qty numeric(14,3) not null default 0,
  shortfall_qty numeric(14,3) not null default 0,
  qty_uom text not null default 'PCS',
  action text not null default 'NONE',
  suggested_qty numeric(14,3) not null default 0,
  suggested_date date,
  pegging_so_id integer references sales_order(id),
  pegging_json text,
  selected boolean not null default false,
  draft_doc_type text,
  draft_doc_id integer
);

create table if not exists demand_forecast (
  id serial primary key,
  item_id integer not null references item(id),
  week_start date not null,
  qty_pcs numeric(14,3) not null
);

-- Variance period freeze (not GL close)
alter table cost_variance add column if not exists period_from date;
alter table cost_variance add column if not exists period_to date;
alter table cost_variance add column if not exists frozen boolean not null default false;
alter table cost_variance add column if not exists frozen_at timestamptz;
alter table cost_variance add column if not exists value_paise bigint not null default 0;

create table if not exists journey_run (
  id serial primary key,
  run_at timestamptz not null default now(),
  source text not null default 'cli',
  passed integer not null default 0,
  failed integer not null default 0,
  report_json text not null
);

insert into settings (key, value) values
  ('quote_metal_basis', 'CU_ZN_BLEND'),
  ('default_recovery_factor', '1.08'),
  ('default_margin_pct', '3.9'),
  ('mrp_time_fence_days', '3'),
  ('wo_backflush', '1')
on conflict (key) do nothing;

insert into number_series (doc_type, prefix, next_no, pad) values
  ('MRP', 'MRP/26-27/', 1, 4)
on conflict (doc_type) do nothing;

-- Freeze the seeded June quote line so later MetalPrice cannot rewrite it
update quotation_line ql
   set cu_pct = 61.500,
       zn_pct = 35.400,
       pb_pct = 3.100,
       cu_paise_per_kg = 81000,
       zn_paise_per_kg = 26500,
       pb_paise_per_kg = 18500,
       metal_rate_date = '2026-06-01',
       blended_paise_per_kg = 59196,
       alloy_code = 'C36000',
       hsn = (select hsn from item where id = ql.item_id),
       gst_rate_pct = 18,
       margin_pct = 3.900,
       formula_text = 'metal = kgPerPc × recoveryFactor × blended(alloy Cu/Zn/Pb × book); unit = metal + conversion + jw + packing + overhead + margin'
 where quotation_id = (select id from quotation where doc_no = 'QTN/26-27/0001');

