import { useState, useRef, useEffect } from "react";

function SearchBar({ setActiveNav, products = [], customers = [], allInvoices = [] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const q = query.trim().toLowerCase();

  const matchedProducts = q.length > 0
    ? products.filter(p => p.name?.toLowerCase().includes(q)).slice(0, 4)
    : [];

  const matchedCustomers = q.length > 0
    ? customers.filter(c => c.name?.toLowerCase().includes(q) || c.phone?.includes(q)).slice(0, 3)
    : [];

  const matchedInvoices = q.length > 0
    ? allInvoices.filter(inv =>
        String(inv.invoiceNumber || inv.id).includes(q) ||
        inv.customerName?.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const hasResults = matchedProducts.length > 0 || matchedCustomers.length > 0 || matchedInvoices.length > 0;

  const handleKey = (e) => {
    if (e.key === "Escape") { setQuery(""); setOpen(false); }
  };

  return (
    <div ref={ref} className="relative hidden sm:block">
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-blue-300 focus-within:bg-white transition-all">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          className="bg-transparent text-sm text-slate-600 outline-none w-40 placeholder:text-slate-400"
          placeholder="Search products, customers..."
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      {open && q && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 z-50 overflow-hidden">
          {!hasResults ? (
            <div className="px-4 py-4 text-sm text-slate-400 text-center">Koi result nahi mila</div>
          ) : (
            <div className="py-1.5 max-h-80 overflow-y-auto">

              {/* Products */}
              {matchedProducts.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products</span>
                  </div>
                  {matchedProducts.map(p => (
                    <button key={p.id}
                      onClick={() => { setActiveNav?.("Products"); setQuery(""); setOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category} · Stock: {p.currentStock ?? 0}</p>
                      </div>
                      <span className="text-xs font-bold text-blue-600 flex-shrink-0">Rs {p.salePrice?.toLocaleString()}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Customers */}
              {matchedCustomers.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customers</span>
                  </div>
                  {matchedCustomers.map(c => (
                    <button key={c.id}
                      onClick={() => { setActiveNav?.("Customers"); setQuery(""); setOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.phone || "—"} · {c.city || "—"}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Invoices */}
              {matchedInvoices.length > 0 && (
                <>
                  <div className="px-4 pt-2 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices</span>
                  </div>
                  {matchedInvoices.map(inv => (
                    <button key={inv.id}
                      onClick={() => { setActiveNav?.("Invoices"); setQuery(""); setOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-violet-50 transition-colors text-left">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">#{String(inv.invoiceNumber || inv.id).padStart(3,"0")}</p>
                        <p className="text-xs text-slate-400 truncate">{inv.customerName || "Walk-in"}</p>
                      </div>
                      <span className="text-xs font-bold text-violet-600 flex-shrink-0">Rs {inv.total?.toLocaleString()}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import NotificationPanel from "./NotificationPanel";

export default function Topbar({ title, subtitle, onMenuClick, alerts, currentUser, onLogout, setActiveNav, products, customers, allInvoices }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = currentUser?.name
    ? currentUser.name.split(" ").map(w => w[0]).slice(0, 2).join("")
    : "U";

  return (
    <header className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SearchBar setActiveNav={setActiveNav} products={products} customers={customers} allInvoices={allInvoices} />

        {/* Notification Bell */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
            className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {alerts.length}
              </span>
            )}
          </button>
          <NotificationPanel alerts={alerts} open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>

        {/* User Avatar + Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
          >
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="avatar" className="w-8 h-8 rounded-xl object-cover shadow-sm flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white text-xs font-black">{initials}</span>
              </div>
            )}
            <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[90px] truncate">
              {currentUser?.name?.split(" ")[0]}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/70 z-20 overflow-hidden">

                {/* User info header */}
                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="avatar" className="w-9 h-9 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-black">{initials}</span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  <button
                    onClick={() => { setUserMenuOpen(false); setActiveNav && setActiveNav("Profile"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    My Profile
                  </button>

                  <button
                    onClick={() => { setUserMenuOpen(false); setActiveNav && setActiveNav("Settings"); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                    </div>
                    Settings
                  </button>

                  <div className="mx-4 h-px bg-slate-100 my-1" />

                  <button
                    onClick={() => { setUserMenuOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors font-medium"
                  >
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                    </div>
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
