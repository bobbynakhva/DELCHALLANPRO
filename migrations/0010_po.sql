-- Migration 0010: Full Purchase Order form fields
-- Adds header-level charges, flags, and per-line discount/UOM/cancel columns

alter table purchase_order
  add column if not exists attn_name         text,
  add column if not exists remarks_internal  text,
  add column if not exists ref_quote         text,
  add column if not exists rejection_tracking   boolean not null default false,
  add column if not exists test_cert_required   boolean not null default false,
  add column if not exists discount_pct      numeric(5,2) not null default 0,
  add column if not exists freight_paise     integer not null default 0,
  add column if not exists pnf_paise         integer not null default 0,
  add column if not exists insurance_paise   integer not null default 0,
  add column if not exists cgst_pct          numeric(5,2) not null default 0,
  add column if not exists sgst_pct          numeric(5,2) not null default 0,
  add column if not exists other_charges_paise integer not null default 0,
  add column if not exists terms_text        text;

alter table po_line
  add column if not exists seq              integer not null default 0,
  add column if not exists uom              text    not null default 'KG',
  add column if not exists discount_pct     numeric(5,2) not null default 0,
  add column if not exists cancelled        boolean not null default false,
  add column if not exists rate_paise_per_pc integer not null default 0;
