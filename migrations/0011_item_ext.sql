alter table item
  add column if not exists rack_no text,
  add column if not exists cgst_pct numeric(5,2) not null default 9,
  add column if not exists sgst_pct numeric(5,2) not null default 9,
  add column if not exists mrp_rate_paise integer not null default 0,
  add column if not exists purchase_rate_paise integer not null default 0,
  add column if not exists min_qty numeric(14,3) not null default 0,
  add column if not exists category text;

alter table partner
  add column if not exists vendor_type text not null default 'MANUFACTURER';
