import { useState } from "react";

export default function LoginView({ onEmailLogin, onForgotPassword }) {
  const [mode, setMode] = useState("login"); // "login" | "forgot"
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Min 6 characters";
    return e;
  };

  const authErrorMsg = (err) => {
    const msg = err?.message?.toLowerCase() || "";
    if (msg.includes("invalid login credentials") || msg.includes("invalid email or password"))
      return "Incorrect email or password";
    if (msg.includes("email not confirmed"))
      return "Please verify your email before signing in";
    if (msg.includes("rate limit") || msg.includes("too many requests"))
      return "Too many attempts — try again later";
    if (msg.includes("network") || msg.includes("fetch"))
      return "Network error — check your connection";
    return err?.message || "Something went wrong. Please try again.";
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    try {
      await onEmailLogin(form.email, form.password);
    } catch (err) {
      setErrors({ general: authErrorMsg(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail.includes("@")) {
      setErrors({ forgotEmail: "Enter a valid email address" });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await onForgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setErrors({ general: authErrorMsg(err) });
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    setErrors(er => ({ ...er, [key]: "", general: "" }));
  };

  const inputCls = (key) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all bg-slate-50 border font-medium placeholder-slate-300 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${errors[key] ? "border-red-400 bg-red-50" : "border-slate-200"}`;

  const labelCls = "block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5";

  // ── Logo shared ──────────────────────────────────────────────────────────
  const Logo = () => (
    <div className="flex items-center gap-2.5 mb-7">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#1D6FDB" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <span className="font-bold text-slate-800 text-base tracking-tight">InvManager</span>
    </div>
  );

  // ── Forgot Password View ─────────────────────────────────────────────────
  if (mode === "forgot") {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-slate-100 p-4"
        style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', 'Segoe UI', sans-serif" }}
      >
        <div className="w-full max-w-[440px] rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-200/60 bg-white">
          <div className="p-8">
            <Logo />

            {/* Heading */}
            <div className="mb-6">
              <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight leading-none">
                Reset Password
              </h1>
              <p className="text-slate-400 text-xs mt-1.5">
                Email enter karo, hum aapko reset link bhejein ge
              </p>
            </div>

            {/* Success State */}
            {forgotSent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="font-bold text-slate-800 text-sm mb-1">Email bhej diya gaya!</p>
                <p className="text-slate-400 text-xs mb-5">
                  <span className="font-semibold text-slate-600">{forgotEmail}</span> par password reset link bheja gaya hai. Inbox check karo.
                </p>
                <button
                  onClick={() => { setMode("login"); setForgotSent(false); setForgotEmail(""); setErrors({}); }}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold tracking-tight transition-all flex items-center justify-center gap-2"
                  style={{ background: "#1D6FDB" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#185FA5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1D6FDB")}
                >
                  ← Back to Sign In
                </button>
              </div>
            ) : (
              <>
                {/* General Error */}
                {errors.general && (
                  <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <p className="text-red-600 text-xs font-medium">{errors.general}</p>
                  </div>
                )}

                {/* Email Field */}
                <div className="mb-5">
                  <label className={labelCls}>Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setErrors({}); }}
                    placeholder="you@example.com"
                    className={inputCls("forgotEmail")}
                    onKeyDown={(e) => e.key === "Enter" && handleForgotSubmit()}
                  />
                  {errors.forgotEmail && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.forgotEmail}</p>}
                </div>

                {/* Submit */}
                <button
                  onClick={handleForgotSubmit}
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-bold tracking-tight transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: "#1D6FDB" }}
                  onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = "#185FA5")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1D6FDB")}
                >
                  {loading ? (
                    <><svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Bhej raha hai...</>
                  ) : (
                    <>Reset Link Bhejo <span className="opacity-70">→</span></>
                  )}
                </button>

                {/* Back link */}
                <p className="text-center text-xs text-slate-400 mt-4">
                  Yaad aa gaya?{" "}
                  <button
                    onClick={() => { setMode("login"); setErrors({}); setForgotEmail(""); }}
                    className="font-bold" style={{ color: "#1D6FDB" }}
                  >
                    Sign in karo
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Login View ───────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-100 p-4"
      style={{ fontFamily: "'Plus Jakarta Sans', 'DM Sans', 'Segoe UI', sans-serif" }}
    >
      <div className="w-full max-w-[440px] rounded-2xl overflow-hidden shadow-2xl shadow-slate-300/60 border border-slate-200/60 bg-white">
        <div className="p-8">
          <Logo />

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-[22px] font-extrabold text-slate-800 tracking-tight leading-none">
              Welcome back
            </h1>
            <p className="text-slate-400 text-xs mt-1.5">
              Sign in to your account to continue
            </p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="mb-3 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p className="text-red-600 text-xs font-medium">{errors.general}</p>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={inputCls("email")} />
              {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.email}</p>}
            </div>

            <div>
              {/* Password Label + Forgot Password Link */}
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                <button
                  onClick={() => { setMode("forgot"); setErrors({}); setForgotEmail(form.email); }}
                  className="text-[10px] font-bold transition-colors"
                  style={{ color: "#1D6FDB" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#185FA5")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#1D6FDB")}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="••••••••" className={inputCls("password") + " pr-9"} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.password}</p>}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 py-2.5 rounded-xl text-white text-sm font-bold tracking-tight transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#1D6FDB" }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = "#185FA5")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1D6FDB")}
          >
            {loading ? (
              <><svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Please wait...</>
            ) : (
              <>Sign In <span className="opacity-70">→</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
