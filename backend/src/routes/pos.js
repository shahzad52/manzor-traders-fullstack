import { Router } from "express";
import pool from "../db/pool.js";
import { mapInvoice } from "../utils/mappers.js";
import { ensureSettingsRow } from "./settings.js";

const router = Router();

// GET /api/pos - get all POS sales
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM sales WHERE firebase_uid=$1 ORDER BY created_at DESC",
      [req.uid]
    );
    res.json(rows.map((r) => mapInvoice(r, "pos")));
  } catch (err) {
    next(err);
  }
});

// Helper: reserve the next invoice number
async function getNextInvoiceNumber(client, uid) {
  await ensureSettingsRow(uid);
  const { rows } = await client.query(
    `UPDATE user_settings SET invoice_counter = invoice_counter + 1, updated_at = now()
     WHERE firebase_uid = $1 RETURNING invoice_counter`,
    [uid]
  );
  return rows[0].invoice_counter;
}

// Helper: update customer total spent and order counts
async function bumpCustomerStats(client, uid, customerId, deltaOrders, deltaSpent, lastOrder) {
  if (!customerId) return;
  await client.query(
    `UPDATE customers SET
        total_orders = GREATEST(0, total_orders + $1),
        total_spent = GREATEST(0, total_spent + $2),
        last_order = COALESCE($3, last_order),
        updated_at = now()
     WHERE id=$4 AND firebase_uid=$5`,
    [deltaOrders, deltaSpent, lastOrder || null, customerId, uid]
  );
}

// POST /api/pos/sales - record a new POS sale
router.post("/sales", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sale = req.body;
    const counter = await getNextInvoiceNumber(client, req.uid);
    const paymentStatus =
      sale.paymentMode === "udaar" ? (Number(sale.advance) > 0 ? "partial" : "udaar") : "paid";
    const payments =
      sale.paymentMode === "udaar" && Number(sale.advance) > 0
        ? [{ amount: Number(sale.advance), date: new Date().toISOString(), note: "Advance at sale" }]
        : [];

    const extra = {
      customerName: sale.customerName || "",
      customerPhone: sale.customerPhone || "",
      customerAddress: sale.customerAddress || "",
      notes: sale.notes || "",
      subtotal: Number(sale.subtotal) || 0,
      discount: Number(sale.discount) || 0,
      tax: Number(sale.tax) || 0,
      discountPercent: Number(sale.discountPercent) || 0,
      taxPercent: Number(sale.taxPercent) || 0,
      totalCost: Number(sale.totalCost) || 0,
      grossProfit: Number(sale.grossProfit) || 0,
      profitMargin: Number(sale.profitMargin) || 0,
    };

    const { rows } = await client.query(
      `INSERT INTO sales
        (firebase_uid, invoice_number, customer_id, items, total, advance, payment_mode, payment_status, payments,
         previous_udaar, show_previous_udaar_on_invoice, extra, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, COALESCE($13, now()))
       RETURNING *`,
      [
        req.uid,
        counter,
        sale.customerId || null,
        JSON.stringify(sale.items || []),
        Number(sale.total) || 0,
        Number(sale.advance) || 0,
        sale.paymentMode || null,
        paymentStatus,
        JSON.stringify(payments),
        Number(sale.previousUdaar) || 0,
        Boolean(sale.showPreviousUdaarOnInvoice),
        JSON.stringify(extra),
        sale.createdAt || null,
      ]
    );

    if (sale.customerId) {
      await bumpCustomerStats(client, req.uid, sale.customerId, 1, Number(sale.total) || 0, new Date().toISOString());
    }

    await client.query("COMMIT");
    res.status(201).json(mapInvoice(rows[0], "pos"));
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// POST /api/pos/complete-sale - deduct stock (used in checkout workflow)
router.post("/complete-sale", async (req, res, next) => {
  const { items = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const { productId, qty } of items) {
      const { rows } = await client.query(
        "SELECT current_stock FROM products WHERE id=$1 AND firebase_uid=$2 FOR UPDATE",
        [productId, req.uid]
      );
      if (!rows.length || Number(rows[0].current_stock) < qty) {
        await client.query("ROLLBACK");
        return res.json({ success: false });
      }
    }
    for (const { productId, qty } of items) {
      await client.query(
        "UPDATE products SET current_stock = current_stock - $1, updated_at = now() WHERE id=$2 AND firebase_uid=$3",
        [qty, productId, req.uid]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

// DELETE /api/pos/:id - delete a POS sale and restore stock
router.delete("/:id", async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT * FROM sales WHERE id=$1 AND firebase_uid=$2`,
      [req.params.id, req.uid]
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Sale not found" });
    }
    const sale = rows[0];

    await client.query(`DELETE FROM sales WHERE id=$1 AND firebase_uid=$2`, [req.params.id, req.uid]);

    // Restore stock for items
    const items = sale.items || [];
    for (const item of items) {
      if (item.productId) {
        await client.query(
          `UPDATE products SET current_stock = current_stock + $1, updated_at = now()
           WHERE id=$2 AND firebase_uid=$3`,
          [Number(item.qty) || 0, item.productId, req.uid]
        );
      }
    }

    // Reverse customer stats
    if (sale.customer_id) {
      await bumpCustomerStats(client, req.uid, sale.customer_id, -1, -Number(sale.total), null);
    }

    await client.query("COMMIT");
    res.status(204).end();
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

export default router;
