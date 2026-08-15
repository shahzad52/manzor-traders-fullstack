import { Router } from "express";
import pool from "../db/pool.js";
import { ensureSettingsRow } from "./settings.js";

const router = Router();

// POST /api/backup/restore
// body: { products, customers, allInvoices, settings }
router.post("/restore", async (req, res) => {
  const { products = [], customers = [], allInvoices = [], settings = {} } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM products WHERE firebase_uid=$1", [req.uid]);
    await client.query("DELETE FROM customers WHERE firebase_uid=$1", [req.uid]);
    await client.query("DELETE FROM sales WHERE firebase_uid=$1", [req.uid]);
    await client.query("DELETE FROM manual_invoices WHERE firebase_uid=$1", [req.uid]);

    // customerId remapping: old id -> new UUID
    const customerIdMap = new Map();

    for (const c of customers) {
      const { rows } = await client.query(
        `INSERT INTO customers (firebase_uid, name, phone, email, city, total_orders, total_spent, last_order, adjustments)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [
          req.uid, c.name || "", c.phone || "", c.email || "", c.city || "",
          c.totalOrders || 0, c.totalSpent || 0, c.lastOrder || null,
          JSON.stringify(c.adjustments || []),
        ]
      );
      if (c.id !== undefined) customerIdMap.set(String(c.id), rows[0].id);
    }

    for (const p of products) {
      await client.query(
        `INSERT INTO products (firebase_uid, name, category, sale_price, stock_price, cost_price, low_stock_alert_qty, current_stock, ctn)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          req.uid, p.name || "", p.category || null, p.salePrice || 0, p.stockPrice || 0,
          p.costPrice || 0, p.lowStockAlertQty || 0, p.currentStock || 0, p.ctn || 0,
        ]
      );
    }

    for (const inv of allInvoices) {
      const table = inv.source === "manual" ? "manual_invoices" : "sales";
      const mappedCustomerId = inv.customerId ? customerIdMap.get(String(inv.customerId)) || null : null;
      await client.query(
        `INSERT INTO ${table}
          (firebase_uid, invoice_number, customer_id, items, total, advance, payment_mode, payment_status, payments,
           previous_udaar, show_previous_udaar_on_invoice, previous_udaar_cleared, previous_udaar_cleared_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13, COALESCE($14, now()))`,
        [
          req.uid, inv.invoiceNumber || null, mappedCustomerId, JSON.stringify(inv.items || []),
          inv.total || 0, inv.advance || 0, inv.paymentMode || null, inv.paymentStatus || null,
          JSON.stringify(inv.payments || []), inv.previousUdaar || 0,
          Boolean(inv.showPreviousUdaarOnInvoice), Boolean(inv.previousUdaarCleared),
          inv.previousUdaarClearedAt || null, inv.createdAt || null,
        ]
      );
    }

    await ensureSettingsRow(req.uid);
    if (settings && Object.keys(settings).length) {
      await client.query(
        `UPDATE user_settings SET
           app_settings = COALESCE($1, app_settings),
           invoice_settings = COALESCE($2, invoice_settings),
           categories = COALESCE($3, categories),
           updated_at = now()
         WHERE firebase_uid=$4`,
        [
          settings.appSettings ? JSON.stringify(settings.appSettings) : null,
          settings.invoiceSettings ? JSON.stringify({ ...settings.invoiceSettings, logo: "" }) : null,
          settings.categories ? JSON.stringify(settings.categories) : null,
          req.uid,
        ]
      );
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Restore failed" });
  } finally {
    client.release();
  }
});

export default router;
