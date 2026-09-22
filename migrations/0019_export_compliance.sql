ALTER TABLE dispatch
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(10,4) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS port_loading text,
  ADD COLUMN IF NOT EXISTS port_discharge text,
  ADD COLUMN IF NOT EXISTS vessel_flight_no text,
  ADD COLUMN IF NOT EXISTS pre_carriage_by text,
  ADD COLUMN IF NOT EXISTS place_of_receipt text,
  ADD COLUMN IF NOT EXISTS final_destination text,
  ADD COLUMN IF NOT EXISTS packing_type text DEFAULT 'WOODEN_PALLETS',
  ADD COLUMN IF NOT EXISTS removal_date date;

ALTER TABLE company
  ADD COLUMN IF NOT EXISTS iec_code text,
  ADD COLUMN IF NOT EXISTS is_eou boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ad_code text;
