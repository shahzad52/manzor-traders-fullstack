import { Router } from "express";
import pool from "../db/pool.js";
import { mapProduct } from "../utils/mappers.js";

const router = Router();

// GET /api/products
router.get("/", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM products WHERE firebase_uid = $1 ORDER BY created_at ASC",
    [req.uid]
  );
  res.json(rows.map(mapProduct));
});

// POST /api/products
router.post("/", async (req, res) => {
  const f = req.body;
  const { rows } = await pool.query(
    `INSERT INTO products
      (firebase_uid, name, category, sale_price, stock_price, cost_price, sale_shop_price, low_stock_alert_qty, current_stock, ctn)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [
      req.uid,
      String(f.name || "").trim(),
      f.category || null,
      Number(f.salePrice) || 0,
      Number(f.stockPrice ?? f.costPrice) || 0,
      Number(f.costPrice) || 0,
      Number(f.saleShopPrice) || 0,
      Number(f.lowStockAlertQty) || 0,
      Number(f.currentStock) || 0,
      Number(f.ctn) || 0,
    ]
  );
  res.status(201).json(mapProduct(rows[0]));
});

// PUT /api/products/:id
router.put("/:id", async (req, res) => {
  const f = req.body;
  const { rows } = await pool.query(
    `UPDATE products SET
      name=$1, category=$2, sale_price=$3, stock_price=$4, cost_price=$5,
      sale_shop_price=$6, low_stock_alert_qty=$7, current_stock=$8, ctn=$9, updated_at=now()
     WHERE id=$10 AND firebase_uid=$11
     RETURNING *`,
    [
      String(f.name || "").trim(),
      f.category || null,
      Number(f.salePrice) || 0,
      Number(f.stockPrice ?? f.costPrice) || 0,
      Number(f.costPrice) || 0,
      Number(f.saleShopPrice) || 0,
      Number(f.lowStockAlertQty) || 0,
      Number(f.currentStock) || 0,
      Number(f.ctn) || 0,
      req.params.id,
      req.uid,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: "Product not found" });
  res.json(mapProduct(rows[0]));
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  await pool.query("DELETE FROM products WHERE id=$1 AND firebase_uid=$2", [req.params.id, req.uid]);
  res.status(204).end();
});

// POST /api/products/:id/stock-in  { qty }
router.post("/:id/stock-in", async (req, res) => {
  const amount = Number(req.body.qty);
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid quantity" });
  const { rows } = await pool.query(
    `UPDATE products SET current_stock = current_stock + $1, updated_at = now()
     WHERE id=$2 AND firebase_uid=$3 RETURNING *`,
    [amount, req.params.id, req.uid]
  );
  if (!rows.length) return res.status(404).json({ error: "Product not found" });
  res.json(mapProduct(rows[0]));
});

// POST /api/products/:id/stock-out  { qty }
router.post("/:id/stock-out", async (req, res) => {
  const amount = Number(req.body.qty);
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid quantity" });
  const { rows } = await pool.query(
    `UPDATE products SET current_stock = current_stock - $1, updated_at = now()
     WHERE id=$2 AND firebase_uid=$3 AND current_stock >= $1 RETURNING *`,
    [amount, req.params.id, req.uid]
  );
  if (!rows.length) return res.status(400).json({ error: "Insufficient stock or product not found" });
  res.json(mapProduct(rows[0]));
});

export default router;
