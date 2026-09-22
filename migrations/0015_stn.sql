CREATE TABLE IF NOT EXISTS stn (
  id serial PRIMARY KEY,
  doc_no text NOT NULL UNIQUE,
  stn_date date NOT NULL,
  from_warehouse_id integer REFERENCES warehouse(id),
  to_warehouse_id integer REFERENCES warehouse(id),
  item_type text DEFAULT 'FINISHED_GOODS',
  prepared_by_id integer REFERENCES staff(id),
  status text NOT NULL DEFAULT 'POSTED',
  remarks text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stn_line (
  id serial PRIMARY KEY,
  stn_id integer REFERENCES stn(id) ON DELETE CASCADE,
  item_id integer REFERENCES item(id),
  qty numeric(18,3) NOT NULL,
  uom text NOT NULL DEFAULT 'KG',
  rate_paise integer NOT NULL DEFAULT 0,
  lot_no text,
  rack_no text,
  created_at timestamptz DEFAULT now()
);

INSERT INTO number_series (doc_type, prefix, next_no, pad)
VALUES ('STN', 'STN/26-27/', 1, 4)
ON CONFLICT (doc_type) DO NOTHING;
