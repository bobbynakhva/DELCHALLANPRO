alter table vendor_bill
  add column if not exists vendor_invoice_no text,
  add column if not exists final_disc_pct numeric(5,2) not null default 0,
  add column if not exists gst_pct_override numeric(5,2);
