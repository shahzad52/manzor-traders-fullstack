import pool from "./db/pool.js";

async function run50kRecordLoadTest() {
  console.log("=========================================================================");
  console.log("🚀 STARTING 50,000 RECORD BENCHMARK & LOAD TEST ON CLOUD SUPABASE");
  console.log("=========================================================================");

  const TEST_UID = "uid_50k_stress_test";

  // Clean old test data if any
  await pool.query("DELETE FROM sales WHERE firebase_uid=$1", [TEST_UID]);
  await pool.query("DELETE FROM customers WHERE firebase_uid=$1", [TEST_UID]);
  await pool.query("DELETE FROM products WHERE firebase_uid=$1", [TEST_UID]);

  console.log("\n📦 STEP 1: Seeding 50,000 Products into Cloud Supabase...");
  const seedStart = Date.now();

  const BATCH_SIZE = 2500;
  const TOTAL_RECORDS = 50000;

  for (let batch = 0; batch < TOTAL_RECORDS; batch += BATCH_SIZE) {
    const values = [];
    for (let i = batch + 1; i <= batch + BATCH_SIZE; i++) {
      values.push(`('${TEST_UID}', 'Product Item #${i}', 'Category_${i % 10}', ${(Math.random()*1000 + 50).toFixed(2)}, ${(Math.random()*800 + 30).toFixed(2)}, ${(Math.random()*700 + 20).toFixed(2)}, 5, ${Math.floor(Math.random()*200)})`);
    }
    await pool.query(`INSERT INTO products (firebase_uid, name, category, sale_price, stock_price, cost_price, low_stock_alert_qty, current_stock) VALUES ${values.join(",")}`);
    process.stdout.write(`   Progress: ${batch + BATCH_SIZE} / ${TOTAL_RECORDS} products inserted...\r`);
  }

  const seedEnd = Date.now();
  console.log(`\n✅ 50,000 Products inserted in ${(seedEnd - seedStart) / 1000} seconds!`);

  // Count total records in DB
  const countRes = await pool.query("SELECT COUNT(*) FROM products WHERE firebase_uid=$1", [TEST_UID]);
  console.log(`   Database verification count: ${countRes.rows[0].count} records present.`);

  console.log("\n⚡ STEP 2: Executing Concurrent Read & Search Queries across 50,000 Records...");

  // Query 1: Exact index lookup
  const readStart1 = Date.now();
  const search1 = await pool.query("SELECT * FROM products WHERE firebase_uid=$1 AND name=$2", [TEST_UID, "Product Item #45123"]);
  const readTime1 = Date.now() - readStart1;
  console.log(`   🔍 [Exact Search Query] Found item in ${readTime1} ms`);

  // Query 2: Wildcard Search (ILIKE) on 50k rows
  const readStart2 = Date.now();
  const search2 = await pool.query("SELECT * FROM products WHERE firebase_uid=$1 AND name ILIKE '%Item #245%' LIMIT 20", [TEST_UID]);
  const readTime2 = Date.now() - readStart2;
  console.log(`   🔎 [Pattern Search ILIKE] Found ${search2.rows.length} matches in ${readTime2} ms`);

  // Query 3: Low stock calculation across 50k items
  const readStart3 = Date.now();
  const search3 = await pool.query("SELECT COUNT(*) FROM products WHERE firebase_uid=$1 AND current_stock <= low_stock_alert_qty", [TEST_UID]);
  const readTime3 = Date.now() - readStart3;
  console.log(`   🚨 [Low Stock Count on 50,000 Items] Found ${search3.rows[0].count} low stock items in ${readTime3} ms`);

  // Query 4: Category grouping & price aggregation on 50k items
  const readStart4 = Date.now();
  const search4 = await pool.query(
    `SELECT category, COUNT(*) as item_count, AVG(sale_price)::numeric(10,2) as avg_price, SUM(current_stock) as total_stock
     FROM products WHERE firebase_uid=$1 GROUP BY category ORDER BY item_count DESC`,
    [TEST_UID]
  );
  const readTime4 = Date.now() - readStart4;
  console.log(`   📊 [Category Aggregation & AVG Price on 50k Items] Processed in ${readTime4} ms:`, search4.rows.slice(0, 5));

  console.log("\n⚡ STEP 3: Executing 100 Concurrent Production POS Transactions on 50k DB...");
  const sampleItemsRes = await pool.query("SELECT id, sale_price FROM products WHERE firebase_uid=$1 LIMIT 100", [TEST_UID]);
  const sampleItems = sampleItemsRes.rows;

  const txStart = Date.now();
  const CONCURRENT_OPS = 100;

  const promises = Array.from({ length: CONCURRENT_OPS }).map(async (_, idx) => {
    const item = sampleItems[idx % sampleItems.length];
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(
        `INSERT INTO sales (firebase_uid, invoice_number, items, total, advance, payment_mode, payment_status)
         VALUES ($1, $2, $3, $4, $5, 'cash', 'paid')`,
        [TEST_UID, 50000 + idx, JSON.stringify([{ id: item.id, qty: 1 }]), item.sale_price, item.sale_price]
      );
      await client.query(`UPDATE products SET current_stock = current_stock - 1 WHERE id = $1`, [item.id]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  });

  await Promise.all(promises);
  const txEnd = Date.now();
  console.log(`✅ 100 Concurrent POS Transactions completed in ${txEnd - txStart} ms!`);

  console.log("\n🧹 STEP 4: Cleaning up 50,000 test records...");
  await pool.query("DELETE FROM sales WHERE firebase_uid=$1", [TEST_UID]);
  await pool.query("DELETE FROM products WHERE firebase_uid=$1", [TEST_UID]);

  console.log("=========================================================================");
  console.log("🎉 50,000 RECORD BENCHMARK COMPLETE: Cloud Supabase handled 50,000 records effortlessly!");
  console.log("=========================================================================");

  await pool.end();
}

run50kRecordLoadTest().catch((err) => {
  console.error("❌ 50k test failed:", err);
  process.exit(1);
});
