import { useState } from "react";

export default function UserProfileView({ appSettings = {}, currentUser = {}, onLogout, products = [], allInvoices = [], onUpdatePassword }) {
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState({
    name: currentUser.name || "User",
    email: currentUser.email || "",
    phone: "—",
    role: "Administrator",
    city: "—",
    joinDate: "2025",
  });
  const [form, setForm] = useState({ ...profile });
  const [pwMode, setPwMode] = useState(false);
  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const isEmailUser = currentUser?.loginMethod === "email";

  const handleSave = () => {
    setProfile({ ...form });
    setEditMode(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePwSave = async () => {
    if (!pw.current) { setPwError("Current password darj karein"); return; }
    if (pw.newPw.length < 6) { setPwError("New password kam az kam 6 characters ka hona chahiye"); return; }
    if (pw.newPw !== pw.confirm) { setPwError("Passwords match nahi ho rahe"); return; }
    setPwError("");
    setPwLoading(true);
    try {
      await onUpdatePassword(pw.current, pw.newPw);
      setPwMode(false);
      setPw({ current: "", newPw: "", confirm: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setPwError("Current password galat hai");
      } else if (err.code === "auth/too-many-requests") {
        setPwError("Bahut zyada koshishein — kuch dair baad try karein");
      } else {
        setPwError("Password update nahi hua. Dobara try karein.");
      }
    } finally {
      setPwLoading(false);
    }
  };

  // Real stats from app data
  const posSales = allInvoices.filter(inv => inv.source === "pos");
  const totalRevenue = allInvoices.reduce((sum, inv) => sum + (inv.total || inv.grandTotal || 0), 0);
  const revenueDisplay = totalRevenue >= 1_000_000
    ? `Rs ${(totalRevenue / 1_000_000).toFixed(1)}M`
    : totalRevenue >= 1_000
    ? `Rs ${(totalRevenue / 1_000).toFixed(0)}K`
    : `Rs ${totalRevenue}`;

  const profileStats = [
    { label: "Total Sales", value: posSales.length, icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", light: "bg-blue-50", text: "text-blue-600" },
    { label: "Invoices Created", value: allInvoices.length, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", light: "bg-violet-50", text: "text-violet-600" },
    { label: "Revenue Managed", value: revenueDisplay, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", light: "bg-emerald-50", text: "text-emerald-600" },
    { label: "Products Added", value: products.length, icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", light: "bg-amber-50", text: "text-amber-600" },
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/80">

      {/* Success Toast */}
      {saved && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-lg shadow-emerald-200 text-sm font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
          Changes saved successfully!
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-4 sm:px-6 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-10 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute -top-8 right-32 w-20 h-20 rounded-full border-4 border-white" />
          <div className="absolute top-12 left-1/2 w-16 h-16 rounded-full border-2 border-white" />
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/40 flex-shrink-0 shadow-xl overflow-hidden">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-2xl sm:text-3xl font-black">
                  {profile.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </span>
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">{profile.name}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{profile.email}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              {profile.role}
            </span>
          </div>
          </div>
          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-red-500/80 border border-white/20 hover:border-red-400 text-white text-sm font-bold transition-all backdrop-blur-sm flex-shrink-0 shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </div>

      {/* Stats Cards — sit cleanly below banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 pt-4 pb-2">
        {profileStats.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 hover:shadow-md hover:shadow-slate-100 transition-all shadow-sm">
            <div className="mb-2">
              <div className={`w-9 h-9 rounded-xl ${card.light} flex items-center justify-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={card.text}>
                  {card.icon.split(" M").map((part, i) => <path key={i} d={i === 0 ? part : "M" + part} />)}
                </svg>
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-800 mb-0.5">{card.value}</p>
            <p className="text-xs text-slate-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Profile Info + Password */}
      <div className="px-4 sm:px-6 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Personal Information */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Personal Information</h3>
            {!editMode ? (
              <button onClick={() => { setForm({ ...profile }); setEditMode(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-semibold transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">Save</button>
              </div>
            )}
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "name", label: "Full Name", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0 M12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
              { key: "email", label: "Email Address", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8 M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
              { key: "phone", label: "Phone Number", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" },
              { key: "city", label: "City", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
            ].map(({ key, label, icon }) => (
              <div key={key}>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {icon.split(" M").map((part, i) => <path key={i} d={i === 0 ? part : "M" + part} />)}
                  </svg>
                  {label}
                </label>
                {editMode ? (
                  <input
                    value={form[key]}
                    onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm text-slate-700 outline-none bg-white"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-700 px-3.5 py-2.5 bg-slate-50 rounded-xl">{profile[key]}</p>
                )}
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                Member Since
              </label>
              <p className="text-sm font-semibold text-slate-700 px-3.5 py-2.5 bg-slate-50 rounded-xl">{profile.joinDate}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Change Password</h3>
            {isEmailUser && (
              <button onClick={() => { setPwMode(!pwMode); setPwError(""); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${pwMode ? "bg-slate-100 text-slate-600" : "bg-amber-50 hover:bg-amber-100 text-amber-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                {pwMode ? "Cancel" : "Update Password"}
              </button>
            )}
          </div>

          {/* Google user — cannot change password */}
          {!isEmailUser ? (
            <div className="p-5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-800">Google se login kiya hua hai</p>
                  <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                    Aap Google account se login hain. Password change karne ke liye Google account settings use karein.
                  </p>
                </div>
              </div>
            </div>
          ) : pwMode ? (
            <div className="p-5 space-y-3">
              {[
                { key: "current", label: "Current Password", placeholder: "Purana password darj karein" },
                { key: "newPw", label: "New Password", placeholder: "Kam az kam 6 characters" },
                { key: "confirm", label: "Confirm New Password", placeholder: "Naya password dobara likhen" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
                  <input
                    type="password" value={pw[key]} placeholder={placeholder}
                    onChange={(e) => { setPw(p => ({ ...p, [key]: e.target.value })); setPwError(""); }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm text-slate-700 outline-none"
                    disabled={pwLoading}
                  />
                </div>
              ))}
              {pwError && (
                <div className="flex items-center gap-2 text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {pwError}
                </div>
              )}
              <button
                onClick={handlePwSave}
                disabled={pwLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors mt-1 flex items-center justify-center gap-2"
              >
                {pwLoading ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
                    Updating...
                  </>
                ) : "Password Update Karein"}
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Password protected</p>
                  <p className="text-xs text-slate-400">Last changed 30 days ago</p>
                </div>
              </div>
              {/* App Info */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <p className="text-xs font-semibold opacity-70 mb-1">Currently Using</p>
                <p className="font-bold text-base leading-tight">{appSettings.appName || "InvManager"}</p>
                <p className="text-xs opacity-70 mt-0.5">{appSettings.tagline || "Pro Dashboard"}</p>
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                  </div>
                  <span className="text-xs font-semibold opacity-90">Admin Access</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
