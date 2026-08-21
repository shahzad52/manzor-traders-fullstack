import { Router } from "express";
import pool from "../db/pool.js";
import { mapSettings } from "../utils/mappers.js";
import { PRODUCT_CATEGORIES } from "../defaultCategories.js";

const router = Router();

// Ensures a settings row exists for this user (mirrors old Firestore "bootstrap")
export async function ensureSettingsRow(uid) {
  const { rows } = await pool.query("SELECT * FROM user_settings WHERE firebase_uid=$1", [uid]);
  if (rows.length) return rows[0];
  const { rows: inserted } = await pool.query(
    `INSERT INTO user_settings (firebase_uid, categories) VALUES ($1, $2) RETURNING *`,
    [uid, JSON.stringify(PRODUCT_CATEGORIES)]
  );
  return inserted[0];
}

router.get("/", async (req, res) => {
  const row = await ensureSettingsRow(req.uid);
  res.json(mapSettings(row));
});

router.put("/app-settings", async (req, res) => {
  const row = await ensureSettingsRow(req.uid);
  const next = { ...row.app_settings, ...req.body };
  const { rows } = await pool.query(
    `UPDATE user_settings SET app_settings=$1, updated_at=now() WHERE firebase_uid=$2 RETURNING *`,
    [JSON.stringify(next), req.uid]
  );
  res.json(mapSettings(rows[0]));
});

router.put("/invoice-settings", async (req, res) => {
  const row = await ensureSettingsRow(req.uid);
  const next = { ...row.invoice_settings, ...req.body };
  const { rows } = await pool.query(
    `UPDATE user_settings SET invoice_settings=$1, updated_at=now() WHERE firebase_uid=$2 RETURNING *`,
    [JSON.stringify(next), req.uid]
  );
  res.json(mapSettings(rows[0]));
});

router.post("/categories", async (req, res) => {
  const row = await ensureSettingsRow(req.uid);
  const name = String(req.body.name || "").trim();
  const current = row.categories || [];
  if (!name || current.includes(name)) return res.json(mapSettings(row));
  const next = [...current, name];
  const { rows } = await pool.query(
    `UPDATE user_settings SET categories=$1, updated_at=now() WHERE firebase_uid=$2 RETURNING *`,
    [JSON.stringify(next), req.uid]
  );
  res.json(mapSettings(rows[0]));
});

router.delete("/categories/:name", async (req, res) => {
  const row = await ensureSettingsRow(req.uid);
  const next = (row.categories || []).filter((c) => c !== req.params.name);
  const { rows } = await pool.query(
    `UPDATE user_settings SET categories=$1, updated_at=now() WHERE firebase_uid=$2 RETURNING *`,
    [JSON.stringify(next), req.uid]
  );
  res.json(mapSettings(rows[0]));
});

export default router;
