import { useState } from "react";
import { formatCurrency } from "../../utils/productHelpers";

export default function OldUdaarModal({ customer, onConfirm, onClose }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountNum = parseFloat(amount) || 0;

  const validate = () => {
    if (!amountNum || amountNum <= 0) { setError("Amount likhein"); return false; }
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onConfirm({
        amount: amountNum,
        note: note.trim(),
        date: new Date(date).toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Purana Udhaar Add Karein</h2>
              <p className="text-xs text-slate-400">{customer.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
            Agar customer ka pehle se koi purana udhaar hai (product yaad nahi, sirf amount pata hai), toh yahan sirf amount likh kar add kar dein. Yeh customer ke udhaar mein jud jayega.
          </p>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Udhaar Amount (Rs)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Rs</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-bold outline-none transition-colors
                  ${error ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-red-400"}`}
                placeholder="0"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Purana Udhaar Kab Ka Hai</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition-colors"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Pichla hisaab, purana udhaar..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 transition-colors"
            />
          </div>

          {amountNum > 0 && (
            <div className="rounded-xl p-3 text-sm flex items-center justify-between bg-red-50 text-red-700">
              <span className="font-medium">Customer ka udhaar itna barhega:</span>
              <span className="font-black">{formatCurrency(amountNum)}</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading || amountNum <= 0}
            className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Udhaar Add Karo"}
          </button>
        </div>
      </div>
    </div>
  );
}
