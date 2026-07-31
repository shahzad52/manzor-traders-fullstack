import jwt from "jsonwebtoken";
import "dotenv/config";

// Supabase signs all JWT tokens with a secret available in:
// Supabase Dashboard → Project Settings → API → JWT Settings → JWT Secret
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

/**
 * Express middleware: verifies the Supabase JWT token sent as
 * "Authorization: Bearer <token>" and attaches req.uid (Supabase user UUID).
 */
export async function requireAuth(req, res, next) {
  if (!SUPABASE_JWT_SECRET) {
    console.error("SUPABASE_JWT_SECRET is not set in environment variables.");
    return res.status(500).json({ error: "Server auth misconfiguration" });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization bearer token" });
  }

  try {
    const decoded = jwt.verify(token, SUPABASE_JWT_SECRET);
    req.uid = decoded.sub; // Supabase user UUID (same format as firebase_uid)
    req.userEmail = decoded.email || null;
    next();
  } catch (err) {
    console.error("Supabase JWT verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default { requireAuth };
