ALTER TABLE work_order
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS lead_time_days integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS rm_heat_no text,
  ADD COLUMN IF NOT EXISTS test_cert_no text,
  ADD COLUMN IF NOT EXISTS wo_type text DEFAULT 'MANUFACTURING',
  ADD COLUMN IF NOT EXISTS approved_by_id integer REFERENCES staff(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

CREATE TABLE IF NOT EXISTS routing_step (
  id serial PRIMARY KEY,
  wo_id integer REFERENCES work_order(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  step_name text NOT NULL,
  machine_name text,
  cnc_program_no text,
  target_min integer DEFAULT 0,
  actual_min integer DEFAULT 0,
  instructions text,
  status text DEFAULT 'PENDING'
);
