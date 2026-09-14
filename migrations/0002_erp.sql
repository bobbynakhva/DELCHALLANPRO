-- Tamba ERP — brass parts manufacturing (India GST, dual UOM, lots, job work)

create table if not exists company (
  id serial primary key,
  name text not null,
  trade_name text,
  gstin text not null,
  pan text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  state_code text,
  pincode text,
  phone text,
  email text,
  lut_arn text,
  bank_name text,
  bank_account text,
  bank_ifsc text
);

create table if not exists staff (
  id serial primary key,
  user_id text not null unique,
  name text not null,
  email text not null unique,
  role text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists number_series (
  id serial primary key,
  doc_type text not null unique,
  prefix text not null,
  next_no integer not null default 1,
  pad integer not null default 4
);

create table if not exists uom (
  id serial primary key,
  code text not null unique,
  name text not null,
  decimals integer not null default 3
);

create table if not exists alloy (
  id serial primary key,
  code text not null unique,
  name text not null,
  cu_pct numeric(6,3) not null,
  zn_pct numeric(6,3) not null,
  pb_pct numeric(6,3) not null default 0,
  other_pct numeric(6,3) not null default 0,
  is_scrap boolean not null default false,
  notes text
);

create table if not exists warehouse (
  id serial primary key,
  code text not null unique,
  name text not null,
  kind text not null,
  is_customer_owned boolean not null default false,
  is_outside_factory boolean not null default false,
  valuation_eligible boolean not null default true
);

create table if not exists partner (
  id serial primary key,
  code text not null unique,
  name text not null,
  is_customer boolean not null default false,
  is_vendor boolean not null default false,
  is_job_worker boolean not null default false,
  gstin text,
  pan text,
  address_line1 text,
  city text,
  state text,
  state_code text,
  pincode text,
  country text not null default 'IN',
  credit_limit_paise bigint not null default 0,
  phone text,
  email text
);

create table if not exists partner_process_rate (
  id serial primary key,
  partner_id integer not null references partner(id),
  process_code text not null,
  item_family text not null default '',
  rate_paise_per_pc integer not null default 0,
  rate_paise_per_kg integer not null default 0,
  loss_norm_pct numeric(6,3) not null default 0
);

create table if not exists item (
  id serial primary key,
  sku text not null unique,
  name text not null,
  type text not null,
  alloy_id integer references alloy(id),
  stock_uom text not null,
  alt_uom text,
  kg_per_pc numeric(12,6),
  recovery_factor numeric(8,4) not null default 1,
  hsn text,
  drawing_no text,
  drawing_rev text,
  make_or_buy text not null default 'MAKE',
  inspection_required boolean not null default true,
  valuation_method text not null default 'WAVG',
  family text,
  size_label text,
  conversion_paise integer not null default 0,
  packing_paise integer not null default 0,
  overhead_paise integer not null default 0,
  default_margin_paise integer not null default 0,
  active boolean not null default true
);

create table if not exists metal_price (
  id serial primary key,
  as_of_date date not null unique,
  cu_paise_per_kg integer not null,
  zn_paise_per_kg integer not null,
  pb_paise_per_kg integer not null default 0,
  posted_by text
);

create table if not exists work_center (
  id serial primary key,
  code text not null unique,
  name text not null,
  kind text not null
);

create table if not exists tool_die (
  id serial primary key,
  code text not null unique,
  name text not null,
  item_family text,
  life_shots integer not null default 0,
  shots_used integer not null default 0,
  status text not null default 'ACTIVE'
);

create table if not exists bom (
  id serial primary key,
  item_id integer not null references item(id),
  drawing_rev text,
  status text not null default 'DRAFT',
  approved_by text,
  approved_at timestamptz
);

create table if not exists bom_line (
  id serial primary key,
  bom_id integer not null references bom(id) on delete cascade,
  component_item_id integer not null references item(id),
  qty_per numeric(14,6) not null,
  qty_uom text not null,
  scrap_pct numeric(6,3) not null default 0,
  is_co_product boolean not null default false,
  line_no integer not null
);

create table if not exists routing (
  id serial primary key,
  item_id integer not null references item(id),
  drawing_rev text,
  status text not null default 'APPROVED'
);

create table if not exists routing_op (
  id serial primary key,
  routing_id integer not null references routing(id) on delete cascade,
  seq integer not null,
  work_center_id integer references work_center(id),
  process_code text not null,
  is_subcontract boolean not null default false,
  default_jw_partner_id integer references partner(id),
  setup_min integer not null default 0,
  run_sec_per_pc integer not null default 0
);

create table if not exists stock_lot (
  id serial primary key,
  lot_no text not null unique,
  item_id integer not null references item(id),
  warehouse_id integer not null references warehouse(id),
  alloy_id integer references alloy(id),
  heat_no text,
  qty_kg numeric(14,3) not null default 0,
  qty_pcs numeric(14,3) not null default 0,
  status text not null default 'QUARANTINE',
  owner_type text not null default 'OWN',
  owner_partner_id integer references partner(id),
  unit_value_paise_per_kg integer not null default 0,
  parent_lot_id integer references stock_lot(id),
  source_type text,
  source_id integer,
  created_at timestamptz not null default now()
);

create table if not exists stock_move (
  id serial primary key,
  posted_at timestamptz not null default now(),
  move_type text not null,
  item_id integer not null references item(id),
  lot_id integer not null references stock_lot(id),
  warehouse_id integer not null references warehouse(id),
  qty_kg numeric(14,3) not null,
  qty_pcs numeric(14,3) not null,
  value_paise bigint not null default 0,
  ref_type text,
  ref_id integer,
  notes text,
  user_id text,
  alloy_id integer references alloy(id)
);

create table if not exists genealogy_link (
  id serial primary key,
  child_lot_id integer not null references stock_lot(id),
  parent_lot_id integer not null references stock_lot(id),
  qty_kg numeric(14,3) not null default 0,
  qty_pcs numeric(14,3) not null default 0
);

create table if not exists audit_log (
  id serial primary key,
  at timestamptz not null default now(),
  user_id text,
  action text not null,
  entity text not null,
  entity_id text,
  before_json text,
  after_json text
);

create table if not exists purchase_order (
  id serial primary key,
  doc_no text not null unique,
  partner_id integer not null references partner(id),
  status text not null default 'OPEN',
  order_date date not null,
  expected_date date,
  notes text,
  created_by text
);

create table if not exists po_line (
  id serial primary key,
  po_id integer not null references purchase_order(id) on delete cascade,
  item_id integer not null references item(id),
  qty_kg numeric(14,3) not null,
  qty_pcs numeric(14,3) not null default 0,
  rate_paise_per_kg integer not null,
  received_kg numeric(14,3) not null default 0
);

create table if not exists grn (
  id serial primary key,
  doc_no text not null unique,
  po_id integer references purchase_order(id),
  partner_id integer not null references partner(id),
  grn_date date not null,
  vehicle_no text,
  status text not null default 'POSTED',
  notes text,
  created_by text
);

create table if not exists grn_line (
  id serial primary key,
  grn_id integer not null references grn(id) on delete cascade,
  item_id integer not null references item(id),
  po_line_id integer references po_line(id),
  heat_no text,
  gross_kg numeric(14,3) not null,
  tare_kg numeric(14,3) not null default 0,
  net_kg numeric(14,3) not null,
  qty_pcs numeric(14,3) not null default 0,
  lot_id integer references stock_lot(id),
  warehouse_id integer not null references warehouse(id)
);

create table if not exists quality_inspection (
  id serial primary key,
  doc_no text not null unique,
  lot_id integer not null references stock_lot(id),
  result text not null default 'PENDING',
  inspector_id text,
  inspected_at timestamptz,
  notes text,
  spectro_cu numeric(6,3),
  spectro_zn numeric(6,3),
  spectro_pb numeric(6,3)
);

create table if not exists sales_order (
  id serial primary key,
  doc_no text not null unique,
  partner_id integer not null references partner(id),
  quotation_id integer,
  order_date date not null,
  status text not null default 'OPEN',
  notes text,
  created_by text
);

create table if not exists so_line (
  id serial primary key,
  so_id integer not null references sales_order(id) on delete cascade,
  item_id integer not null references item(id),
  qty_pcs numeric(14,3) not null,
  qty_dispatched numeric(14,3) not null default 0,
  unit_price_paise integer not null,
  gst_pct numeric(5,2) not null default 18
);

create table if not exists work_order (
  id serial primary key,
  doc_no text not null unique,
  item_id integer not null references item(id),
  bom_id integer references bom(id),
  so_id integer references sales_order(id),
  qty_pcs numeric(14,3) not null,
  required_kg numeric(14,3) not null default 0,
  issued_kg numeric(14,3) not null default 0,
  good_pcs numeric(14,3) not null default 0,
  reject_pcs numeric(14,3) not null default 0,
  scrap_kg numeric(14,3) not null default 0,
  status text not null default 'OPEN',
  due_date date,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists wo_issue (
  id serial primary key,
  wo_id integer not null references work_order(id),
  lot_id integer not null references stock_lot(id),
  item_id integer not null references item(id),
  qty_kg numeric(14,3) not null,
  qty_pcs numeric(14,3) not null default 0,
  posted_at timestamptz not null default now()
);

create table if not exists wo_booking (
  id serial primary key,
  wo_id integer not null references work_order(id),
  booked_at timestamptz not null default now(),
  good_pcs numeric(14,3) not null default 0,
  reject_pcs numeric(14,3) not null default 0,
  scrap_kg numeric(14,3) not null default 0,
  scrap_item_id integer references item(id),
  fg_lot_id integer references stock_lot(id),
  reject_lot_id integer references stock_lot(id),
  scrap_lot_id integer references stock_lot(id),
  runner_lot_id integer references stock_lot(id),
  user_id text
);

create table if not exists quotation (
  id serial primary key,
  doc_no text not null unique,
  partner_id integer not null references partner(id),
  quote_date date not null,
  valid_until date,
  status text not null default 'OPEN',
  metal_rate_date date not null,
  cu_paise_per_kg integer not null,
  zn_paise_per_kg integer not null,
  pb_paise_per_kg integer not null default 0,
  formula_snapshot text not null,
  notes text,
  created_by text
);

create table if not exists quotation_line (
  id serial primary key,
  quotation_id integer not null references quotation(id) on delete cascade,
  item_id integer not null references item(id),
  qty_pcs numeric(14,3) not null,
  kg_per_pc numeric(12,6) not null,
  recovery_factor numeric(8,4) not null,
  metal_paise integer not null,
  conversion_paise integer not null,
  jw_paise integer not null,
  packing_paise integer not null,
  overhead_paise integer not null,
  margin_paise integer not null,
  unit_price_paise integer not null,
  gst_pct numeric(5,2) not null default 18
);

create table if not exists job_work_order (
  id serial primary key,
  doc_no text not null unique,
  partner_id integer not null references partner(id),
  process_code text not null,
  status text not null default 'OPEN',
  loss_norm_pct numeric(6,3) not null,
  created_at timestamptz not null default now()
);

create table if not exists job_work_challan (
  id serial primary key,
  doc_no text not null unique,
  jw_order_id integer references job_work_order(id),
  partner_id integer not null references partner(id),
  process_code text not null,
  issued_at timestamptz not null,
  expected_return_at date,
  statutory_due date not null,
  status text not null default 'OPEN',
  vehicle_no text,
  eway_no text,
  notes text,
  created_by text,
  loss_norm_pct numeric(6,3) not null default 0
);

create table if not exists job_work_challan_line (
  id serial primary key,
  challan_id integer not null references job_work_challan(id) on delete cascade,
  item_id integer not null references item(id),
  lot_id integer references stock_lot(id),
  jw_lot_id integer references stock_lot(id),
  qty_pcs numeric(14,3) not null,
  qty_kg numeric(14,3) not null,
  hsn text,
  returned_pcs numeric(14,3) not null default 0
);

create table if not exists job_work_return (
  id serial primary key,
  doc_no text not null unique,
  challan_id integer not null references job_work_challan(id),
  returned_at timestamptz not null default now(),
  good_pcs numeric(14,3) not null default 0,
  reject_pcs numeric(14,3) not null default 0,
  short_pcs numeric(14,3) not null default 0,
  scrap_kg numeric(14,3) not null default 0,
  fg_lot_id integer references stock_lot(id),
  reject_lot_id integer references stock_lot(id),
  notes text,
  created_by text
);

create table if not exists job_work_loss (
  id serial primary key,
  return_id integer not null references job_work_return(id),
  challan_id integer not null,
  actual_loss_pct numeric(8,4) not null,
  norm_pct numeric(6,3) not null,
  excess_pcs numeric(14,3) not null default 0,
  excess_kg numeric(14,3) not null default 0,
  debit_paise bigint not null default 0,
  debit_note_no text,
  debit_status text not null default 'DRAFT'
);

create table if not exists sales_invoice (
  id serial primary key,
  doc_no text not null unique,
  partner_id integer not null references partner(id),
  so_id integer references sales_order(id),
  invoice_date date not null,
  place_of_supply text,
  is_export boolean not null default false,
  taxable_paise bigint not null default 0,
  cgst_paise bigint not null default 0,
  sgst_paise bigint not null default 0,
  igst_paise bigint not null default 0,
  total_paise bigint not null default 0,
  net_kg numeric(14,3) not null default 0,
  irn text,
  irn_ack_no text,
  irn_ack_dt text,
  eway_no text,
  status text not null default 'POSTED',
  created_by text
);

create table if not exists sales_invoice_line (
  id serial primary key,
  invoice_id integer not null references sales_invoice(id) on delete cascade,
  item_id integer not null references item(id),
  lot_id integer references stock_lot(id),
  hsn text,
  qty_pcs numeric(14,3) not null,
  qty_kg numeric(14,3) not null,
  unit_price_paise integer not null,
  taxable_paise bigint not null,
  gst_pct numeric(5,2) not null,
  cgst_paise bigint not null default 0,
  sgst_paise bigint not null default 0,
  igst_paise bigint not null default 0
);

create table if not exists packing_list (
  id serial primary key,
  doc_no text not null unique,
  invoice_id integer not null references sales_invoice(id),
  packed_at timestamptz not null default now(),
  carton_count integer not null default 0,
  net_kg numeric(14,3) not null default 0,
  gross_kg numeric(14,3) not null default 0
);

create table if not exists packing_list_line (
  id serial primary key,
  packing_list_id integer not null references packing_list(id) on delete cascade,
  carton_no text not null,
  lot_id integer not null references stock_lot(id),
  item_id integer not null,
  qty_pcs numeric(14,3) not null,
  net_kg numeric(14,3) not null
);

create table if not exists ncr (
  id serial primary key,
  doc_no text not null unique,
  lot_id integer references stock_lot(id),
  item_id integer references item(id),
  source text,
  description text not null,
  status text not null default 'OPEN',
  disposition text,
  created_at timestamptz not null default now(),
  created_by text
);

create table if not exists melt_order (
  id serial primary key,
  doc_no text not null unique,
  alloy_id integer not null references alloy(id),
  furnace text,
  status text not null default 'OPEN',
  heat_no text,
  created_at timestamptz not null default now()
);

create table if not exists melt_charge (
  id serial primary key,
  melt_id integer not null references melt_order(id) on delete cascade,
  lot_id integer not null references stock_lot(id),
  item_id integer not null,
  qty_kg numeric(14,3) not null
);

create table if not exists melt_spectro (
  id serial primary key,
  melt_id integer not null references melt_order(id),
  cu_pct numeric(6,3),
  zn_pct numeric(6,3),
  pb_pct numeric(6,3),
  passed boolean
);

create table if not exists cost_variance (
  id serial primary key,
  wo_id integer references work_order(id),
  jw_return_id integer,
  kind text not null,
  expected numeric(14,4),
  actual numeric(14,4),
  variance numeric(14,4),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists approval_request (
  id serial primary key,
  kind text not null,
  payload_json text not null,
  threshold_paise bigint,
  requested_by text not null,
  requested_at timestamptz not null default now(),
  approved_by text,
  approved_at timestamptz,
  status text not null default 'PENDING'
);

create table if not exists settings (
  key text primary key,
  value text not null
);

create index if not exists stock_lot_wh_idx on stock_lot (warehouse_id);
create index if not exists stock_lot_item_idx on stock_lot (item_id);
create index if not exists stock_lot_status_idx on stock_lot (status);
create index if not exists stock_move_lot_idx on stock_move (lot_id);
create index if not exists genealogy_child_idx on genealogy_link (child_lot_id);
create index if not exists genealogy_parent_idx on genealogy_link (parent_lot_id);
create index if not exists jw_challan_partner_idx on job_work_challan (partner_id, status);
