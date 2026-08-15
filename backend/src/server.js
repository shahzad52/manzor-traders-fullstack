import "dotenv/config";
import app from "./app.js";
import { runMigrations } from "./db/migrate.js";

const PORT = process.env.PORT || 4000;

// Server start hote hi database schema apne aap up-to-date ho jata hai —
// (idempotent hai, dobara chalne se kuch nahi bigrta) taake Render jaisi
// jagah deploy karne ke baad manually "npm run migrate" chalana na bhoolein.
async function start() {
  try {
    await runMigrations();
  } catch (err) {
    console.error("❌ Startup migration failed:", err);
    // Migration fail hone par bhi server start hone dete hain (taake purana
    // data/features na atkein), lekin error clearly log ho jata hai taake
    // Render logs mein turant pata chal jaye.
  }

  app.listen(PORT, () => {
    console.log(`🚀 Manzor Traders backend running on http://localhost:${PORT}`);
  });
}

start();
