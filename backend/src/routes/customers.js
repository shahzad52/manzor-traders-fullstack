import { Router } from "express";
import pool from "../db/pool.js";
import { mapCustomer } from "../utils/mappers.js";

const router = Router();

router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM customers WHERE firebase_uid=$1 ORDER BY created_at ASC",
    [req.uid]
  );
  res.json(rows.map(mapCustomer));
});

router.post("/", async (req, res) => {
  const f = req.body;
  const { rows } = await pool.query(
    `INSERT INTO customers (firebase_uid, name, phone, email, city, total_orders, total_spent, last_order)
     VALUES ($1,$2,$3,$4,$5,0,0,now()) RETURNING *`,
    [req.uid, String(f.name || "").trim(), String(f.phone || "").trim(), f.email || "", f.city || ""]
  );
  res.status(201).json(mapCustomer(rows[0]));
});

router.put("/:id", async (req, res) => {
  const f = req.body;
  const { rows } = await pool.query(
    `UPDATE customers SET name=$1, phone=$2, email=$3, city=$4, updated_at=now()
     WHERE id=$5 AND firebase_uid=$6 RETURNING *`,
    [String(f.name || "").trim(), String(f.phone || "").trim(), f.email || "", f.city || "", req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: "Customer not found" });
  res.json(mapCustomer(rows[0]));
});

router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM customers WHERE id=$1 AND firebase_uid=$2", [req.params.id, req.uid]);
  res.status(204).end();
});

// POST /api/customers/:id/adjustments  { type, amount, reason, date }
router.post("/:id/adjustments", async (req, res) => {
  const { type, amount, reason, date } = req.body;
  const { rows } = await pool.query(
    `UPDATE customers SET adjustments = adjustments || $1::jsonb, updated_at = now()
     WHERE id=$2 AND firebase_uid=$3 RETURNING *`,
    [JSON.stringify([{ type, amount, reason, date }]), req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: "Customer not found" });
  res.json(mapCustomer(rows[0]));
});

// POST /api/customers/:id/stats  { deltaOrders, deltaSpent, lastOrder }
// Internal helper used by sale/invoice creation & deletion to keep customer totals in sync.
router.post("/:id/stats", async (req, res) => {
  const { deltaOrders = 0, deltaSpent = 0, lastOrder } = req.body;
  const { rows } = await pool.query(
    `UPDATE customers SET
        total_orders = GREATEST(0, total_orders + $1),
        total_spent = GREATEST(0, total_spent + $2),
        last_order = COALESCE($3, last_order),
        updated_at = now()
     WHERE id=$4 AND firebase_uid=$5 RETURNING *`,
    [deltaOrders, deltaSpent, lastOrder || null, req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: "Customer not found" });
  res.json(mapCustomer(rows[0]));
});

export default router;
