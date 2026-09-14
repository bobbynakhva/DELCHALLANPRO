-- Prompt 06a: NIC-shaped IRP / e-way adapter. Prompt 01–05 tables stay.

alter table sales_invoice add column if not exists irn_status text;
alter table sales_invoice add column if not exists irn_signed_qr text;
alter table sales_invoice add column if not exists irn_request_json text;
alter table sales_invoice add column if not exists irn_response_json text;
alter table sales_invoice add column if not exists gate_out_at timestamptz;

alter table credit_debit_note add column if not exists irn_ack_no text;
alter table credit_debit_note add column if not exists irn_ack_dt timestamptz;
alter table credit_debit_note add column if not exists irn_status text;
alter table credit_debit_note add column if not exists irn_signed_qr text;
alter table credit_debit_note add column if not exists irn_request_json text;
alter table credit_debit_note add column if not exists irn_response_json text;

alter table job_work_challan add column if not exists gate_out_at timestamptz;
alter table job_work_challan add column if not exists eway_required boolean not null default true;

alter table eway_bill add column if not exists ewb_no text;
alter table eway_bill add column if not exists sub_supply_type text;
alter table eway_bill add column if not exists valid_from timestamptz;
alter table eway_bill add column if not exists valid_until timestamptz;
alter table eway_bill add column if not exists skip_same_state_50km boolean not null default false;
alter table eway_bill add column if not exists part_a_json text;
alter table eway_bill add column if not exists part_b_json text;
alter table eway_bill add column if not exists request_json text;
alter table eway_bill add column if not exists response_json text;
alter table eway_bill add column if not exists status text not null default 'ACT';

create table if not exists irp_call (
  id serial primary key,
  kind text not null,
  mode text not null,
  doc_type text,
  doc_id integer,
  request_json text,
  response_json text,
  status text,
  created_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('einvoice_mode', 'stub'),
  ('eway_mode', 'stub')
on conflict (key) do nothing;
