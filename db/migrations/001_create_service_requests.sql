CREATE TABLE IF NOT EXISTS service_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  email VARCHAR(254) NOT NULL,
  service VARCHAR(120) NOT NULL,
  location VARCHAR(300) NOT NULL,
  vehicle VARCHAR(150) NOT NULL,
  preferred_date DATE NOT NULL,
  message VARCHAR(2000),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS service_requests_created_at_idx
  ON service_requests (created_at DESC);
