-- Manzor Traders — PostgreSQL schema
-- Mirrors the old Firestore layout: users/{uid}/products, /sales, /manualInvoices,
-- /customers, /config/settings — but as relational tables scoped by firebase_uid.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── Products ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid        TEXT NOT NULL,
  name                TEXT NOT NULL,
  category            TEXT,
  sale_price          NUMERIC(14,2) DEFAULT 0,
  stock_price         NUMERIC(14,2) DEFAULT 0,
  cost_price          NUMERIC(14,2) DEFAULT 0,
  sale_shop_price     NUMERIC(14,2) DEFAULT 0,
  low_stock_alert_qty NUMERIC(14,2) DEFAULT 0,
  current_stock       NUMERIC(14,2) DEFAULT 0,
  ctn                 NUMERIC(14,2) DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_uid ON products(firebase_uid);

-- ── Customers ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid  TEXT NOT NULL,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  city          TEXT,
  total_orders  INTEGER DEFAULT 0,
  total_spent   NUMERIC(14,2) DEFAULT 0,
  last_order    TIMESTAMPTZ,
  adjustments   JSONB DEFAULT '[]'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_customers_uid ON customers(firebase_uid);

-- ── Sales (POS invoices) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid     TEXT NOT NULL,
  invoice_number   INTEGER,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  items            JSONB DEFAULT '[]'::jsonb,
  total            NUMERIC(14,2) DEFAULT 0,
  advance          NUMERIC(14,2) DEFAULT 0,
  payment_mode     TEXT,
  payment_status   TEXT,
  payments         JSONB DEFAULT '[]'::jsonb,
  previous_udaar             NUMERIC(14,2) DEFAULT 0,
  show_previous_udaar_on_invoice BOOLEAN DEFAULT false,
  previous_udaar_cleared     BOOLEAN DEFAULT false,
  previous_udaar_cleared_at  TIMESTAMPTZ,
  extra            JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sales_uid ON sales(firebase_uid);

-- ── Manual invoices ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS manual_invoices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid     TEXT NOT NULL,
  invoice_number   INTEGER,
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,
  items            JSONB DEFAULT '[]'::jsonb,
  total            NUMERIC(14,2) DEFAULT 0,
  advance          NUMERIC(14,2) DEFAULT 0,
  payment_mode     TEXT,
  payment_status   TEXT,
  payments         JSONB DEFAULT '[]'::jsonb,
  previous_udaar             NUMERIC(14,2) DEFAULT 0,
  show_previous_udaar_on_invoice BOOLEAN DEFAULT false,
  previous_udaar_cleared     BOOLEAN DEFAULT false,
  previous_udaar_cleared_at  TIMESTAMPTZ,
  extra            JSONB DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manual_invoices_uid ON manual_invoices(firebase_uid);

-- ── Per-user settings (appSettings, invoiceSettings, categories, invoice counter) ──
CREATE TABLE IF NOT EXISTS user_settings (
  firebase_uid       TEXT PRIMARY KEY,
  app_settings       JSONB DEFAULT '{"appName":"InvManager","tagline":"Pro Dashboard"}'::jsonb,
  invoice_settings   JSONB DEFAULT '{"ownerName":"","businessName":"","phone":"","address":"","logo":""}'::jsonb,
  categories         JSONB DEFAULT '[]'::jsonb,
  invoice_counter    INTEGER DEFAULT 0,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
