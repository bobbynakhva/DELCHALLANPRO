-- Prompt 06b: foundry first-class. Prompt 01–06a tables stay. ADD only.

insert into settings (key, value) values ('foundry_enabled', 'true')
on conflict (key) do nothing;

alter table alloy add column if not exists cu_min_pct numeric(6,3);
alter table alloy add column if not exists cu_max_pct numeric(6,3);
alter table alloy add column if not exists zn_min_pct numeric(6,3);
alter table alloy add column if not exists zn_max_pct numeric(6,3);
alter table alloy add column if not exists pb_min_pct numeric(6,3);
alter table alloy add column if not exists pb_max_pct numeric(6,3);

update alloy set
  cu_min_pct = coalesce(cu_min_pct, cu_pct - 1.500),
  cu_max_pct = coalesce(cu_max_pct, cu_pct + 1.500),
  zn_min_pct = coalesce(zn_min_pct, zn_pct - 2.000),
  zn_max_pct = coalesce(zn_max_pct, zn_pct + 2.000),
  pb_min_pct = coalesce(pb_min_pct, greatest(pb_pct - 0.500, 0)),
  pb_max_pct = coalesce(pb_max_pct, pb_pct + 0.500)
where cu_min_pct is null or zn_min_pct is null or pb_min_pct is null;

insert into warehouse (code, name, kind, is_customer_owned, is_outside_factory, valuation_eligible)
values ('WIP-MELT', 'Melt WIP', 'WIP', false, false, true)
on conflict (code) do nothing;

insert into number_series (doc_type, prefix, next_no, pad) values
  ('HT', 'HT/26-27/', 1, 4),
  ('POUR', 'POUR/26-27/', 1, 4),
  ('KO', 'KO/26-27/', 1, 4)
on conflict (doc_type) do nothing;

insert into item (sku, name, type, alloy_id, stock_uom, alt_uom, kg_per_pc, recovery_factor, hsn, make_or_buy, inspection_required, family, size_label)
select 'CAST-C360', 'C36000 casting / billet', 'SFG', a.id, 'KG', null, null, 1, '74072110', 'MAKE', false, 'CASTING', 'billet'
from alloy a where a.code = 'C36000'
on conflict (sku) do nothing;

insert into item (sku, name, type, alloy_id, stock_uom, alt_uom, kg_per_pc, recovery_factor, hsn, make_or_buy, inspection_required, family, size_label)
select 'SC-C360-DROSS', 'C36000 dross / skimming', 'SCRAP', a.id, 'KG', null, null, 1, '74040012', 'MAKE', false, 'SCRAP', 'dross'
from alloy a where a.code = 'C36000'
on conflict (sku) do nothing;

insert into item (sku, name, type, alloy_id, stock_uom, alt_uom, kg_per_pc, recovery_factor, hsn, make_or_buy, inspection_required, family, size_label)
select 'ROD-CW617-12MM', 'CW617N rod 12 mm (foundry isolation)', 'RM', a.id, 'KG', 'PCS', null, 1, '74072110', 'BUY', true, 'ROD', '12 mm'
from alloy a where a.code = 'CW617N'
on conflict (sku) do nothing;

create table if not exists melt_recipe (
  id serial primary key,
  alloy_id integer not null references alloy(id),
  name text not null,
  status text not null default 'ACTIVE'
);

create table if not exists melt_recipe_line (
  id serial primary key,
  recipe_id integer not null references melt_recipe(id) on delete cascade,
  item_id integer not null references item(id),
  pct numeric(6,3) not null
);

create table if not exists heat (
  id serial primary key,
  doc_no text not null unique,
  furnace text not null default 'MELT-1',
  alloy_id integer not null references alloy(id),
  recipe_id integer references melt_recipe(id),
  recipe_snapshot_json text,
  status text not null default 'DRAFT',
  wip_lot_id integer references stock_lot(id),
  charged_kg numeric(18,4) not null default 0,
  good_kg numeric(18,4) not null default 0,
  runner_kg numeric(18,4) not null default 0,
  dross_kg numeric(18,4) not null default 0,
  reject_kg numeric(18,4) not null default 0,
  loss_kg numeric(18,4) not null default 0,
  owner_override boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  charged_at timestamptz,
  poured_at timestamptz,
  closed_at timestamptz,
  notes text
);

create table if not exists melt_charge_line (
  id serial primary key,
  heat_id integer not null references heat(id) on delete cascade,
  lot_id integer not null references stock_lot(id),
  item_id integer not null,
  qty_kg numeric(18,4) not null,
  posted_move_id integer,
  created_at timestamptz not null default now()
);

create table if not exists spectro_result (
  id serial primary key,
  heat_id integer not null references heat(id),
  cu_pct numeric(6,3) not null,
  zn_pct numeric(6,3) not null,
  pb_pct numeric(6,3) not null,
  passed boolean not null,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists melt_pour (
  id serial primary key,
  heat_id integer not null references heat(id),
  doc_no text not null unique,
  good_kg numeric(18,4) not null,
  casting_lot_id integer references stock_lot(id),
  created_by text,
  poured_at timestamptz not null default now(),
  snapshot_json text
);

create table if not exists melt_knockout (
  id serial primary key,
  heat_id integer not null references heat(id),
  pour_id integer references melt_pour(id),
  doc_no text not null unique,
  runner_kg numeric(18,4) not null default 0,
  dross_kg numeric(18,4) not null default 0,
  reject_kg numeric(18,4) not null default 0,
  runner_lot_id integer references stock_lot(id),
  dross_lot_id integer references stock_lot(id),
  dross_to_variance boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  snapshot_json text
);

insert into melt_recipe (alloy_id, name, status)
select a.id, 'C360 remelt', 'ACTIVE' from alloy a where a.code = 'C36000'
on conflict do nothing;

insert into melt_recipe_line (recipe_id, item_id, pct)
select r.id, i.id, 100.000
from melt_recipe r
join alloy a on a.id = r.alloy_id
join item i on i.sku = 'SC-C360-TURN'
where a.code = 'C36000' and r.name = 'C360 remelt'
  and not exists (select 1 from melt_recipe_line l where l.recipe_id = r.id);

update item set min_qty_kg = 100 where sku = 'CAST-C360' and coalesce(min_qty_kg, 0) = 0;
