import { useState } from "react";

export default function LoginView({ onEmailLogin, onEmailRegister, onGoogleLogin, onForgotPassword }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const validate = () => {
    const e = {};
    if (mode === "register" && !form.name.trim()) e.name = "Name is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email";
    if (form.password.length < 6) e.password = "Min 6 characters";
    if (mode === "register" && form.password !== form.confirm) e.confirm = "Passwords don't match";
    return e;
  };

  const firebaseErrorMsg = (code) => {
    const map = {
      "auth/user-not-found": "No account found with this email",
      "auth/wrong-password": "Incorrect password",
      "auth/invalid-credential": "Invalid email or password",
      "auth/email-already-in-use": "Email is already registered",
      "auth/invalid-email": "Invalid email address",
      "auth/weak-password": "Password is too weak (min 6 chars)",
      "auth/too-many-requests": "Too many attempts — try again later",
      "auth/popup-closed-by-user": "Google sign-in was cancelled",
      "auth/network-request-failed": "Network error — check your connection",
    };
    return map[code] || "Something went wrong. Please try again.";
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setErrors({});
    try {
      if (mode === "login") {
        await onEmailLogin(form.email, form.password);
      } else {
        await onEmailRegister(form.email, form.password, form.name);
      }
    } catch (err) {
      setErrors({ general: firebaseErrorMsg(err.code) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setErrors({});
    try {
      await onGoogleLogin();
    } catch (err) {
      setErrors({ general: firebaseErrorMsg(err.code) });
    } finally {
      setGoogleLoading(false);
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
      setErrors({ general: firebaseErrorMsg(err.code) });
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

  // ── Login / Register View ────────────────────────────────────────────────
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
              {mode === "login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-slate-400 text-xs mt-1.5">
              {mode === "login" ? "Sign in to your account to continue" : "Get started — it's free"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1 mb-5">
            {[["login", "Sign In"], ["register", "Sign Up"]].map(([m, label]) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m ? "bg-white shadow-sm text-blue-600 border border-slate-200/80" : "text-slate-400 hover:text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all mb-4 disabled:opacity-60"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
          >
            {googleLoading ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1D6FDB" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">or with email</span>
            <div className="flex-1 h-px bg-slate-100" />
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
            {mode === "register" && (
              <div>
                <label className={labelCls}>Full Name</label>
                <input value={form.name} onChange={set("name")} placeholder="John Doe" className={inputCls("name")} />
                {errors.name && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.name}</p>}
              </div>
            )}

            <div>
              <label className={labelCls}>Email Address</label>
              <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" className={inputCls("email")} />
              {errors.email && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.email}</p>}
            </div>

            {mode === "login" ? (
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
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.password} onChange={set("password")} placeholder="Min 6 chars" className={inputCls("password") + " pr-9"} />
                    <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        {showPw ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>}
                      </svg>
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.password}</p>}
                </div>
                <div>
                  <label className={labelCls}>Confirm</label>
                  <input type="password" value={form.confirm} onChange={set("confirm")} placeholder="Repeat" className={inputCls("confirm")} />
                  {errors.confirm && <p className="text-red-500 text-[10px] mt-1 font-medium">{errors.confirm}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading || googleLoading}
            className="w-full mt-5 py-2.5 rounded-xl text-white text-sm font-bold tracking-tight transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "#1D6FDB" }}
            onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = "#185FA5")}
            onMouseLeave={e => (e.currentTarget.style.background = "#1D6FDB")}
          >
            {loading ? (
              <><svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Please wait...</>
            ) : (
              <>{mode === "login" ? "Sign In" : "Create Account"} <span className="opacity-70">→</span></>
            )}
          </button>

          <p className="text-center text-xs text-slate-400 mt-4">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setMode(mode === "login" ? "register" : "login"); setErrors({}); }}
              className="font-bold" style={{ color: "#1D6FDB" }}
            >
              {mode === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
