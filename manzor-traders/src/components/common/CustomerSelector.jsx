import { useState, useRef, useEffect } from "react";

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
];

function getInitials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

/**
 * CustomerSelector
 * Props:
 *   customers: array of customer objects
 *   onSelect: (customer) => void  — called when a customer is picked
 *   selectedCustomer: customer object or null
 */
export default function CustomerSelector({ customers = [], onSelect, selectedCustomer }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const dropRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      (c.city || "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = () => {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handlePick = (c) => {
    onSelect(c);
    setOpen(false);
    setQuery("");
  };

  const handleClear = () => {
    onSelect(null);
    setOpen(false);
  };

  const colorIdx = selectedCustomer
    ? customers.findIndex((c) => c.id === selectedCustomer.id) % AVATAR_COLORS.length
    : 0;

  return (
    <div className="relative" ref={dropRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={selectedCustomer ? undefined : handleOpen}
        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm transition-colors text-left
          ${selectedCustomer
            ? "border-blue-300 bg-blue-50"
            : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
          }`}
      >
        {selectedCustomer ? (
          <>
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${AVATAR_COLORS[colorIdx]} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-[10px] font-bold">{getInitials(selectedCustomer.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 truncate">{selectedCustomer.name}</p>
              {selectedCustomer.phone && <p className="text-xs text-slate-400">{selectedCustomer.phone}</p>}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg hover:bg-blue-200 text-blue-400 hover:text-blue-700 transition-colors"
              title="Clear selection"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </>
        ) : (
          <>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <span className="text-slate-400 flex-1">Select from saved customers...</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><path d="m6 9 6 6 6-6" /></svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, phone..."
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No customers found</p>
            ) : (
              filtered.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handlePick(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[11px] font-bold">{getInitials(c.name)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.phone}{c.city ? ` · ${c.city}` : ""}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
