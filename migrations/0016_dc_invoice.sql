CREATE TABLE IF NOT EXISTS dispatch (
  id serial PRIMARY KEY,
  doc_no text NOT NULL UNIQUE,
  dc_no text,
  partner_id integer REFERENCES partner(id),
  ship_to_partner_id integer REFERENCES partner(id),
  customer_po_no text,
  is_dc_cum_invoice boolean DEFAULT false,
  dispatch_date date NOT NULL DEFAULT current_date,
  vehicle_no text,
  transport_doc_no text,
  dispatch_from text,
  dispatch_to text,
  gross_wt_kg numeric(18,3) DEFAULT 0,
  status text NOT NULL DEFAULT 'POSTED',
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dispatch_line (
  id serial PRIMARY KEY,
  dispatch_id integer REFERENCES dispatch(id) ON DELETE CASCADE,
  lot_id integer REFERENCES stock_lot(id),
  item_id integer REFERENCES item(id),
  qty_pcs numeric(18,3) DEFAULT 0,
  gross_wt_kg numeric(18,3) DEFAULT 0,
  qty_per_pkt numeric(18,3) DEFAULT 0
);

INSERT INTO number_series (doc_type, prefix, next_no, pad)
VALUES ('DC', 'DC/26-27/', 1, 4)
ON CONFLICT (doc_type) DO NOTHING;
