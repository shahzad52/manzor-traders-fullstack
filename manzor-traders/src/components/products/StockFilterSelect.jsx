import { useState, useRef, useEffect } from "react";
import SVGIcon from "../common/SVGIcon";

export const STOCK_FILTER_OPTIONS = [
  {
    value: "all",
    label: "All Products",
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    light: "bg-slate-100",
    text: "text-slate-600",
  },
  {
    value: "ok",
    label: "In Stock",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    light: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    value: "low",
    label: "Low Stock",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    light: "bg-amber-50",
    text: "text-amber-600",
  },
  {
    value: "out",
    label: "Out of Stock",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
    light: "bg-red-50",
    text: "text-red-600",
  },
];

export default function StockFilterSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = STOCK_FILTER_OPTIONS.find((o) => o.value === value) || STOCK_FILTER_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full sm:w-52 flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 hover:border-blue-300 hover:bg-white transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selected.light}`}>
          <SVGIcon d={selected.icon} size={16} className={selected.text} />
        </span>
        <span className="flex-1 text-left font-medium truncate">{selected.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94A3B8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 py-1 overflow-hidden"
        >
          {STOCK_FILTER_OPTIONS.map((option) => (
            <li key={option.value} role="option" aria-selected={value === option.value}>
              <button
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  value === option.value
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${option.light}`}>
                  <SVGIcon d={option.icon} size={16} className={option.text} />
                </span>
                <span className="font-medium">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
