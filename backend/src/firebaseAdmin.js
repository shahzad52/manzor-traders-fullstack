import fs from "fs";
import admin from "firebase-admin";
import "dotenv/config";

// Firebase is used ONLY for verifying who the logged-in user is (authentication).
// All actual data (products, sales, invoices, customers, settings) lives in PostgreSQL.

function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./service-account.json";
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }
  return null;
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    console.warn(
      "⚠️  No Firebase service account found. Set FIREBASE_SERVICE_ACCOUNT_JSON or " +
        "FIREBASE_SERVICE_ACCOUNT_PATH in .env, otherwise auth verification will fail."
    );
    admin.initializeApp();
  }
}

/**
 * Express middleware: verifies the Firebase ID token sent as
 * "Authorization: Bearer <idToken>" and attaches req.uid.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing Authorization bearer token" });

    const decoded = await admin.auth().verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email || null;
    next();
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default admin;
