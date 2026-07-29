import express from "express";
import cors from "cors";
import "dotenv/config";

import { requireAuth } from "./firebaseAdmin.js";
import pool from "./db/pool.js";
import { mapProduct, mapCustomer, mapInvoice, mapSettings } from "./utils/mappers.js";
import productsRouter from "./routes/products.js";
import customersRouter from "./routes/customers.js";
import invoicesRouter from "./routes/invoices.js";
import settingsRouter, { ensureSettingsRow } from "./routes/settings.js";
import backupRouter from "./routes/backup.js";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "15mb" })); // logo/base64 uploads can be large-ish

app.get("/health", (_req, res) => res.json({ ok: true }));

// Every /api/* route requires a valid Firebase ID token (authentication only —
// no data is read from or written to Firebase; everything below hits PostgreSQL).
app.use("/api", requireAuth);

app.use("/api/products", productsRouter);
app.use("/api/customers", customersRouter);
app.use("/api/invoices", invoicesRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/backup", backupRouter);

// Bootstrap: one call that returns everything the frontend needs on load
app.get("/api/bootstrap", async (req, res, next) => {
  try {
    const [products, customers, sales, manual, settingsRow] = await Promise.all([
      pool.query("SELECT * FROM products WHERE firebase_uid=$1 ORDER BY created_at ASC", [req.uid]),
      pool.query("SELECT * FROM customers WHERE firebase_uid=$1 ORDER BY created_at ASC", [req.uid]),
      pool.query("SELECT * FROM sales WHERE firebase_uid=$1 ORDER BY created_at DESC", [req.uid]),
      pool.query("SELECT * FROM manual_invoices WHERE firebase_uid=$1 ORDER BY created_at DESC", [req.uid]),
      ensureSettingsRow(req.uid),
    ]);

    res.json({
      products: products.rows.map(mapProduct),
      customers: customers.rows.map(mapCustomer),
      sales: sales.rows.map((r) => mapInvoice(r, "pos")),
      manualInvoices: manual.rows.map((r) => mapInvoice(r, "manual")),
      settings: mapSettings(settingsRow),
    });
  } catch (err) {
    next(err);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
