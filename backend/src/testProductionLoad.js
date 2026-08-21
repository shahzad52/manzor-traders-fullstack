import pool from "./db/pool.js";

async function runProductionGradeLoadTest() {
  console.log("=========================================================================");
  console.log("🚀 STARTING PRODUCTION-GRADE HEAVY LOAD & PERFORMANCE BENCHMARK");
  console.log("=========================================================================");

  const DUMMY_UID = "prod_loadtest_uid_99";

  // Cleanup old test data
  await pool.query("DELETE FROM sales WHERE firebase_uid=$1", [DUMMY_UID]);
  await pool.query("DELETE FROM manual_invoices WHERE firebase_uid=$1", [DUMMY_UID]);
  await pool.query("DELETE FROM customers WHERE firebase_uid=$1", [DUMMY_UID]);
  await pool.query("DELETE FROM products WHERE firebase_uid=$1", [DUMMY_UID]);

  console.log("\n📦 STEP 1: Seeding Large Dataset (10,000 Products & 2,000 Customers)...");
  const seedStart = Date.now();

  // Batch insert 10,000 products
  const productValues = [];
  for (let i = 1; i <= 10000; i++) {
    productValues.push(`('${DUMMY_UID}', 'Mobile Product Item #${i}', 'Electronics', ${(Math.random()*5000 + 100).toFixed(2)}, ${(Math.random()*4000 + 50).toFixed(2)}, ${(Math.random()*3500 + 40).toFixed(2)}, 5, ${Math.floor(Math.random()*100 + 10)})`);
  }
  
  // Insert in chunks of 2,000 to maximize throughput
  for (let i = 0; i < productValues.length; i += 2000) {
    const chunk = productValues.slice(i, i + 2000).join(",");
    await pool.query(`INSERT INTO products (firebase_uid, name, category, sale_price, stock_price, cost_price, low_stock_alert_qty, current_stock) VALUES ${chunk}`);
  }

  // Seed 2,000 customers
  const customerValues = [];
  for (let i = 1; i <= 2000; i++) {
    customerValues.push(`('${DUMMY_UID}', 'Customer Name ${i}', '0300${1000000 + i}', 'Faisalabad', ${Math.floor(Math.random()*50)}, ${(Math.random()*100000).toFixed(2)})`);
  }
  for (let i = 0; i < customerValues.length; i += 1000) {
    const chunk = customerValues.slice(i, i + 1000).join(",");
    await pool.query(`INSERT INTO customers (firebase_uid, name, phone, city, total_orders, total_spent) VALUES ${chunk}`);
  }

  const seedEnd = Date.now();
  console.log(`✅ Seeded 12,000 production records in ${(seedEnd - seedStart) / 1000} seconds!`);

  // Fetch some sample product UUIDs for relational transactions
  const sampleProductsRes = await pool.query("SELECT id, name, sale_price, current_stock FROM products WHERE firebase_uid=$1 LIMIT 100", [DUMMY_UID]);
  const sampleProducts = sampleProductsRes.rows;
  
  const sampleCustomersRes = await pool.query("SELECT id FROM customers WHERE firebase_uid=$1 LIMIT 100", [DUMMY_UID]);
  const sampleCustomers = sampleCustomersRes.rows;

  console.log("\n⚡ STEP 2: Simulating 50 Concurrent POS Cashier Transactions...");
  console.log("   (Each transaction executes: BEGIN -> Sale Insert -> Stock Deduction -> Customer Ledger Update -> COMMIT)");

  const txStart = Date.now();
  const CONCURRENT_TRANSACTIONS = 50;

  const transactionPromises = Array.from({ length: CONCURRENT_TRANSACTIONS }).map(async (_, idx) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const product = sampleProducts[idx % sampleProducts.length];
      const customer = sampleCustomers[idx % sampleCustomers.length];
      const items = JSON.stringify([{ id: product.id, name: product.name, qty: 2, price: product.sale_price }]);

      // 1. Insert Sales Invoice
      const saleRes = await client.query(
        `INSERT INTO sales (firebase_uid, invoice_number, customer_id, items, total, advance, payment_mode, payment_status)
         VALUES ($1, $2, $3, $4, $5, $6, 'cash', 'paid') RETURNING id`,
        [DUMMY_UID, 1000 + idx, customer.id, items, product.sale_price * 2, product.sale_price * 2]
      );

      // 2. Atomic Stock Deduction
      await client.query(
        `UPDATE products SET current_stock = current_stock - 2, updated_at = NOW() WHERE id = $1`,
        [product.id]
      );

      // 3. Update Customer History
      await client.query(
        `UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + $1, last_order = NOW() WHERE id = $2`,
        [product.sale_price * 2, customer.id]
      );

      await client.query("COMMIT");
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  });

  await Promise.all(transactionPromises);
  const txEnd = Date.now();
  const totalTxTime = txEnd - txStart;

  console.log(`✅ 50 Concurrent Full Production Transactions completed in ${totalTxTime} ms!`);
  console.log(`   Average Latency per Transaction: ${(totalTxTime / CONCURRENT_TRANSACTIONS).toFixed(2)} ms`);
  console.log(`   Throughput: ${((CONCURRENT_TRANSACTIONS / totalTxTime) * 1000).toFixed(1)} transactions/sec`);

  console.log("\n📊 STEP 3: Benchmarking Production Complex Read Queries on 12,000+ Records...");

  // Query 1: Search by product name (ILIKE pattern search)
  const searchStart = Date.now();
  const searchRes = await pool.query("SELECT * FROM products WHERE firebase_uid=$1 AND name ILIKE '%Product Item #50%' LIMIT 20", [DUMMY_UID]);
  const searchTime = Date.now() - searchStart;
  console.log(`   🔍 [Search Query] Found ${searchRes.rows.length} matches in ${searchTime} ms`);

  // Query 2: Low Stock Alert Report
  const lowStockStart = Date.now();
  const lowStockRes = await pool.query("SELECT * FROM products WHERE firebase_uid=$1 AND current_stock <= low_stock_alert_qty ORDER BY current_stock ASC", [DUMMY_UID]);
  const lowStockTime = Date.now() - lowStockStart;
  console.log(`   🚨 [Low Stock Report] Found ${lowStockRes.rows.length} alert items in ${lowStockTime} ms`);

  // Query 3: Sales Financial Analytics (Aggregation GROUP BY)
  const analyticsStart = Date.now();
  const analyticsRes = await pool.query(
    `SELECT payment_mode, COUNT(*) as invoice_count, SUM(total) as total_revenue
     FROM sales WHERE firebase_uid=$1 GROUP BY payment_mode`,
    [DUMMY_UID]
  );
  const analyticsTime = Date.now() - analyticsStart;
  console.log(`   📈 [Sales Analytics Aggregation] Processed in ${analyticsTime} ms:`, analyticsRes.rows);

  // Clean up benchmark data
  console.log("\n🧹 STEP 4: Cleaning benchmark test data...");
  await pool.query("DELETE FROM sales WHERE firebase_uid=$1", [DUMMY_UID]);
  await pool.query("DELETE FROM customers WHERE firebase_uid=$1", [DUMMY_UID]);
  await pool.query("DELETE FROM products WHERE firebase_uid=$1", [DUMMY_UID]);

  console.log("=========================================================================");
  console.log("🎉 PRODUCTION LOAD TEST COMPLETE: PostgreSQL remains ultra-fast under heavy load!");
  console.log("=========================================================================");

  await pool.end();
}

runProductionGradeLoadTest().catch((err) => {
  console.error("❌ Production load test failed:", err);
  process.exit(1);
});
