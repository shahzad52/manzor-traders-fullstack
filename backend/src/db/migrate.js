import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./pool.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
  console.log("Applying schema.sql to database...");
  await pool.query(sql);
  console.log("✅ Schema applied successfully.");

  // ── Safe column additions for existing tables ──────────────────────────────
  // These ALTER TABLE statements are idempotent — they add columns that may be
  // missing from databases created before these columns were added to schema.sql.
  const alterations = [
    // extra JSONB column for sales
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS extra JSONB DEFAULT '{}'::jsonb`,
    // extra JSONB column for manual_invoices
    `ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS extra JSONB DEFAULT '{}'::jsonb`,
    // previous_udaar columns that may be missing on older DBs
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_udaar NUMERIC(14,2) DEFAULT 0`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS show_previous_udaar_on_invoice BOOLEAN DEFAULT false`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_udaar_cleared BOOLEAN DEFAULT false`,
    `ALTER TABLE sales ADD COLUMN IF NOT EXISTS previous_udaar_cleared_at TIMESTAMPTZ`,
    `ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS previous_udaar NUMERIC(14,2) DEFAULT 0`,
    `ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS show_previous_udaar_on_invoice BOOLEAN DEFAULT false`,
    `ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS previous_udaar_cleared BOOLEAN DEFAULT false`,
    `ALTER TABLE manual_invoices ADD COLUMN IF NOT EXISTS previous_udaar_cleared_at TIMESTAMPTZ`,
    // customers adjustments column
    `ALTER TABLE customers ADD COLUMN IF NOT EXISTS adjustments JSONB DEFAULT '[]'::jsonb`,
    // saleshop price — product ki wo price jis par shopkeeper ko bulk/shop sale hoti hai
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS sale_shop_price NUMERIC(14,2) DEFAULT 0`,
  ];

  for (const stmt of alterations) {
    try {
      await pool.query(stmt);
      console.log(`✅ ${stmt.slice(0, 60)}...`);
    } catch (err) {
      console.warn(`⚠️  Alteration skipped (${err.message}): ${stmt.slice(0, 60)}`);
    }
  }

  console.log("✅ All migrations complete.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});

