-- GST company settings, CN/DN, e-way stub, CoC, deemed supply (s.143)

alter table company add column if not exists cin text;
alter table company add column if not exists iec text;
alter table company add column if not exists lut_valid_until date;
alter table company add column if not exists registered_office text;
alter table company add column if not exists composition boolean not null default false;
alter table company add column if not exists turnover_above_5cr boolean not null default true;
alter table company add column if not exists hsn_digits integer not null default 6;
alter table company add column if not exists einvoice_applicable boolean not null default true;
alter table company add column if not exists b2c_qr boolean not null default true;
alter table company add column if not exists eway_threshold_paise bigint not null default 5000000;
alter table company add column if not exists msme_credit_days integer not null default 45;
alter table company add column if not exists authorised_signatory text;
alter table company add column if not exists authorised_designation text;

update company set
  cin = coalesce(cin, 'U27320GJ2014PTC081234'),
  iec = coalesce(iec, '0812345678'),
  lut_valid_until = coalesce(lut_valid_until, '2027-03-31'),
  registered_office = coalesce(registered_office, 'Plot 41, GIDC Odhav, Ahmedabad, Gujarat 382415'),
  authorised_signatory = coalesce(authorised_signatory, 'Kavita Mehta'),
  authorised_designation = coalesce(authorised_designation, 'Director'),
  turnover_above_5cr = coalesce(turnover_above_5cr, true),
  hsn_digits = coalesce(hsn_digits, 6),
  einvoice_applicable = coalesce(einvoice_applicable, true),
  b2c_qr = coalesce(b2c_qr, true),
  eway_threshold_paise = coalesce(eway_threshold_paise, 5000000),
  msme_credit_days = coalesce(msme_credit_days, 45),
  composition = coalesce(composition, false);

alter table sales_invoice add column if not exists reverse_charge boolean not null default false;
alter table sales_invoice add column if not exists round_off_paise bigint not null default 0;
alter table sales_invoice add column if not exists export_mode text;
alter table sales_invoice add column if not exists currency text;
alter table sales_invoice add column if not exists forex_rate numeric(12,4);
alter table sales_invoice add column if not exists port text;
alter table sales_invoice add column if not exists incoterm text;
alter table sales_invoice add column if not exists vehicle_no text;
alter table sales_invoice add column if not exists is_service boolean not null default false;
alter table sales_invoice add column if not exists sac text;

insert into number_series (doc_type, prefix, next_no, pad) values
  ('CN',  'CN/26-27/',  1, 4),
  ('EWB', 'EWB/26-27/', 1, 4),
  ('BOS', 'BOS/26-27/', 1, 4),
  ('SI',  'SI/26-27/',  1, 4),
  ('COC', 'COC/26-27/', 1, 4)
on conflict (doc_type) do nothing;

create table if not exists credit_debit_note (
  id serial primary key,
  kind text not null,
  doc_no text not null unique,
  note_date date not null,
  original_invoice_id integer references sales_invoice(id),
  original_invoice_no text not null,
  original_invoice_date date,
  partner_id integer references partner(id),
  reason text,
  taxable_paise bigint not null default 0,
  cgst_paise bigint not null default 0,
  sgst_paise bigint not null default 0,
  igst_paise bigint not null default 0,
  total_paise bigint not null default 0,
  irn text,
  status text not null default 'DRAFT',
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists credit_debit_note_line (
  id serial primary key,
  note_id integer not null references credit_debit_note(id) on delete cascade,
  description text,
  hsn text,
  qty_pcs numeric(14,3) not null default 0,
  qty_kg numeric(14,3) not null default 0,
  taxable_paise bigint not null default 0,
  gst_pct numeric(5,2) not null default 18,
  cgst_paise bigint not null default 0,
  sgst_paise bigint not null default 0,
  igst_paise bigint not null default 0
);

create table if not exists eway_bill (
  id serial primary key,
  stub_no text not null unique,
  doc_type text,
  doc_id integer,
  doc_no text,
  doc_date date,
  recipient_gstin text,
  delivery_pin text,
  value_paise bigint not null default 0,
  hsn text,
  reason_code text not null default '3',
  reason_label text,
  document_type text,
  bill_to_gstin text,
  ship_to_gstin text,
  vehicle text,
  mode text not null default 'Road',
  trans_doc text,
  distance_km integer not null default 0,
  skipped_vehicle boolean not null default false,
  part_b_at timestamptz,
  nic_signed boolean not null default false,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists certificate_of_conformance (
  id serial primary key,
  doc_no text not null unique,
  doc_date date not null,
  partner_id integer references partner(id),
  lot_id integer references stock_lot(id),
  sku text,
  description text,
  alloy_spec text,
  drawing_no text,
  drawing_rev text,
  lot_no text,
  heat_no text,
  qty_nos numeric(14,3) not null default 0,
  qty_kgs numeric(14,3) not null default 0,
  qa_signatory text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists deemed_supply (
  id serial primary key,
  challan_id integer not null references job_work_challan(id),
  invoice_id integer references sales_invoice(id),
  invoice_date date not null,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  created_by text
);
