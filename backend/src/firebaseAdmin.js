import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("SUPABASE_URL or SUPABASE_ANON_KEY is not set in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Express middleware: verifies the Supabase JWT token using the Supabase Client.
 * Attaches req.uid (Supabase user UUID) and req.userEmail.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing Authorization bearer token" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      throw new Error(error?.message || "User not found");
    }
    req.uid = user.id; // Supabase user UUID
    req.userEmail = user.email || null;
    next();
  } catch (err) {
    console.error("Supabase JWT verification failed:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export default { requireAuth };
