-- Process Subcontracting (Plating, Heat Treatment, Polishing)
CREATE TABLE IF NOT EXISTS subcontract_order (
  id serial PRIMARY KEY,
  doc_no text NOT NULL UNIQUE,
  partner_id integer REFERENCES partner(id),
  process_type text NOT NULL DEFAULT 'PLATING',
  sent_date date NOT NULL,
  expected_return_date date,
  status text DEFAULT 'SENT',
  remarks text,
  created_by integer REFERENCES staff(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcontract_line (
  id serial PRIMARY KEY,
  subcontract_id integer REFERENCES subcontract_order(id) ON DELETE CASCADE,
  lot_id integer REFERENCES stock_lot(id),
  item_id integer REFERENCES item(id),
  sent_qty_pcs numeric(18,3) DEFAULT 0,
  sent_qty_kg numeric(18,3) DEFAULT 0,
  received_qty_pcs numeric(18,3) DEFAULT 0,
  received_qty_kg numeric(18,3) DEFAULT 0,
  process_loss_kg numeric(18,3) DEFAULT 0,
  rate_paise_per_kg integer DEFAULT 0
);

INSERT INTO number_series (doc_type, prefix, next_no, pad)
VALUES ('SUB', 'SUB/26-27/', 1, 4)
ON CONFLICT (doc_type) DO NOTHING;

-- Machine Tooling & Preventive Maintenance
CREATE TABLE IF NOT EXISTS machine_tooling_log (
  id serial PRIMARY KEY,
  machine_id integer REFERENCES work_center(id),
  tool_name text NOT NULL,
  tool_slot text,
  rated_life_parts integer NOT NULL DEFAULT 5000,
  current_parts integer DEFAULT 0,
  status text DEFAULT 'OK',
  last_replaced_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS preventive_maintenance (
  id serial PRIMARY KEY,
  machine_id integer REFERENCES work_center(id),
  check_date date NOT NULL DEFAULT current_date,
  coolant_level text DEFAULT 'OK',
  lubrication_ok boolean DEFAULT true,
  spindle_sound_ok boolean DEFAULT true,
  chip_conveyor_ok boolean DEFAULT true,
  inspected_by_id integer REFERENCES staff(id),
  remarks text
);

-- Partner Credit Limits & PO Approvals
ALTER TABLE partner
  ADD COLUMN IF NOT EXISTS credit_limit_paise bigint DEFAULT 50000000,
  ADD COLUMN IF NOT EXISTS credit_hold boolean DEFAULT false;

ALTER TABLE purchase_order
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'APPROVED',
  ADD COLUMN IF NOT EXISTS approved_by_id integer REFERENCES staff(id);
