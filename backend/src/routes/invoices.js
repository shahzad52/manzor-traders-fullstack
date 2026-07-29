import { Router } from "express";
import pool from "../db/pool.js";
import { mapInvoice, num } from "../utils/mappers.js";
import { ensureSettingsRow } from "./settings.js";

const router = Router();

function tableFor(source) {
  return source === "manual" ? "manual_invoices" : "sales";
}

// GET /api/invoices  -> { sales: [...], manualInvoices: [...] }
router.get("/", async (req, res) => {
  const [sales, manual] = await Promise.all([
    pool.query("SELECT * FROM sales WHERE firebase_uid=$1 ORDER BY created_at DESC", [req.uid]),
    pool.query("SELECT * FROM manual_invoices WHERE firebase_uid=$1 ORDER BY created_at DESC", [req.uid]),
  ]);
  res.json({
    sales: sales.rows.map((r) => mapInvoice(r, "pos")),
    manualInvoices: manual.rows.map((r) => mapInvoice(r, "manual")),
  });
});

// Atomically reserve the next invoice number (replaces Firestore runTransaction)
async function getNextInvoiceNumber(client, uid) {
  await ensureSettingsRow(uid);
  const { rows } = await client.query(
    `UPDATE user_settings SET invoice_counter = invoice_counter + 1, updated_at = now()
     WHERE firebase_uid = $1 RETURNING invoice_counter`,
    [uid]
  );
  return rows[0].invoice_counter;
}

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

// POST /api/invoices/sales  (recordSale — POS)
router.post("/sales", async (req, res) => {
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

    const { rows } = await client.query(
      `INSERT INTO sales
        (firebase_uid, invoice_number, customer_id, items, total, advance, payment_mode, payment_status, payments,
         previous_udaar, show_previous_udaar_on_invoice, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, COALESCE($12, now()))
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
    console.error(err);
    res.status(500).json({ error: "Failed to record sale" });
  } finally {
    client.release();
  }
});

// POST /api/invoices/manual  (createManualInvoice)
router.post("/manual", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const data = req.body;
    const counter = await getNextInvoiceNumber(client, req.uid);
    const paymentStatus =
      data.paymentMode === "udaar" ? (Number(data.advance) > 0 ? "partial" : "udaar") : "paid";
    const payments =
      data.paymentMode === "udaar" && Number(data.advance) > 0
        ? [{ amount: Number(data.advance), date: new Date().toISOString(), note: "Advance at sale" }]
        : [];

    const { rows } = await client.query(
      `INSERT INTO manual_invoices
        (firebase_uid, invoice_number, customer_id, items, total, advance, payment_mode, payment_status, payments,
         previous_udaar, show_previous_udaar_on_invoice, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, COALESCE($12, now()))
       RETURNING *`,
      [
        req.uid,
        counter,
        data.customerId || null,
        JSON.stringify(data.items || []),
        Number(data.total) || 0,
        Number(data.advance) || 0,
        data.paymentMode || null,
        paymentStatus,
        JSON.stringify(payments),
        Number(data.previousUdaar) || 0,
        Boolean(data.showPreviousUdaarOnInvoice),
        data.createdAt || null,
      ]
    );

    if (data.customerId) {
      await bumpCustomerStats(client, req.uid, data.customerId, 1, Number(data.total) || 0, new Date().toISOString());
    }

    await client.query("COMMIT");
    res.status(201).json(mapInvoice(rows[0], "manual"));
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create invoice" });
  } finally {
    client.release();
  }
});

// PUT /api/invoices/:id?source=pos|manual  (updateInvoice)
router.put("/:id", async (req, res) => {
  const source = req.query.source === "manual" ? "manual" : "pos";
  const table = tableFor(source);
  const data = req.body;
  const { rows } = await pool.query(
    `UPDATE ${table} SET
       items = COALESCE($1, items),
       total = COALESCE($2, total),
       advance = COALESCE($3, advance),
       payment_mode = COALESCE($4, payment_mode),
       payment_status = COALESCE($5, payment_status),
       customer_id = COALESCE($6, customer_id),
       invoice_number = COALESCE($7, invoice_number),
       updated_at = now()
     WHERE id=$8 AND firebase_uid=$9
     RETURNING *`,
    [
      data.items ? JSON.stringify(data.items) : null,
      data.total !== undefined ? Number(data.total) : null,
      data.advance !== undefined ? Number(data.advance) : null,
      data.paymentMode || null,
      data.paymentStatus || null,
      data.customerId || null,
      data.invoiceNumber !== undefined ? data.invoiceNumber : null,
      req.params.id,
      req.uid,
    ]
  );
  if (!rows.length) return res.status(404).json({ error: "Invoice not found" });
  res.json(mapInvoice(rows[0], source));
});

// DELETE /api/invoices/:id?source=pos|manual  (deleteInvoice — restores stock & customer stats)
router.delete("/:id", async (req, res) => {
  const source = req.query.source === "manual" ? "manual" : "pos";
  const table = tableFor(source);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT * FROM ${table} WHERE id=$1 AND firebase_uid=$2`,
      [req.params.id, req.uid]
    );
    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invoice not found" });
    }
    const inv = rows[0];

    await client.query(`DELETE FROM ${table} WHERE id=$1 AND firebase_uid=$2`, [req.params.id, req.uid]);

    // Restore stock for items that came from inventory
    const items = inv.items || [];
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
    if (inv.customer_id) {
      await bumpCustomerStats(client, req.uid, inv.customer_id, -1, -num(inv.total), null);
    }

    await client.query("COMMIT");
    res.status(204).end();
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to delete invoice" });
  } finally {
    client.release();
  }
});

// POST /api/invoices/receive-payment
// body: { customerId, allocations: [{ invoiceId, source, amount }], date, note }
router.post("/receive-payment", async (req, res) => {
  const { allocations = [], date, note } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const alloc of allocations) {
      const payAmt = Number(alloc.amount);
      if (!payAmt || payAmt <= 0 || alloc.invoiceId === "bulk") continue;
      const table = tableFor(alloc.source);
      const { rows } = await client.query(
        `SELECT * FROM ${table} WHERE id=$1 AND firebase_uid=$2 FOR UPDATE`,
        [alloc.invoiceId, req.uid]
      );
      if (!rows.length) continue;
      const inv = rows[0];
      const existing = inv.payments || [];
      const newPayments = [...existing, { amount: payAmt, date, note: note || "" }];
      const advInPayments = newPayments
        .filter((p) => p.note && p.note.includes("Advance at sale"))
        .reduce((s, p) => s + p.amount, 0);
      const otherPmts = newPayments
        .filter((p) => !p.note || !p.note.includes("Advance at sale"))
        .reduce((s, p) => s + p.amount, 0);
      const standAloneAdv = advInPayments > 0 ? 0 : num(inv.advance);
      const totalPaidAmt = advInPayments + otherPmts + standAloneAdv;
      const newStatus = totalPaidAmt >= num(inv.total) ? "paid" : totalPaidAmt > 0 ? "partial" : "udaar";

      const clearsPreviousUdaar =
        newStatus === "paid" && inv.show_previous_udaar_on_invoice && num(inv.previous_udaar) > 0;

      await client.query(
        `UPDATE ${table} SET
            payments = $1,
            payment_status = $2,
            previous_udaar_cleared = COALESCE($3, previous_udaar_cleared),
            previous_udaar_cleared_at = CASE WHEN $3 THEN now() ELSE previous_udaar_cleared_at END,
            updated_at = now()
         WHERE id=$4 AND firebase_uid=$5`,
        [JSON.stringify(newPayments), newStatus, clearsPreviousUdaar, alloc.invoiceId, req.uid]
      );
    }
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to record payment" });
  } finally {
    client.release();
  }
});

// POST /api/invoices/complete-sale  { items: [{productId, qty}] }  — stock deduction only (used by POS/Invoices views)
router.post("/complete-sale", async (req, res) => {
  const { items = [] } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const { productId, qty } of items) {
      const { rows } = await client.query(
        "SELECT current_stock FROM products WHERE id=$1 AND firebase_uid=$2 FOR UPDATE",
        [productId, req.uid]
      );
      if (!rows.length || num(rows[0].current_stock) < qty) {
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
    console.error(err);
    res.status(500).json({ success: false, error: "Failed to complete sale" });
  } finally {
    client.release();
  }
});

export default router;
