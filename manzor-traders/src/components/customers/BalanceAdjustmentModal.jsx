import { useState } from "react";
import { formatCurrency } from "../../utils/productHelpers";

export default function BalanceAdjustmentModal({ customer, onConfirm, onClose }) {
  const [type, setType] = useState("credit"); // credit = reduce balance, debit = add to balance
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amountNum = parseFloat(amount) || 0;

  const validate = () => {
    if (!amountNum || amountNum <= 0) { setError("Amount likhein"); return false; }
    if (!reason.trim()) { setError("Reason likhein"); return false; }
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onConfirm({
        customerId: customer.id,
        type,
        amount: amountNum,
        reason: reason.trim(),
        date: new Date().toISOString(),
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
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Balance Adjustment</h2>
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
          {/* Type */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Adjustment Type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType("credit")}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  type === "credit" ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={type === "credit" ? "#059669" : "#94A3B8"} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <p className={`text-xs font-bold mt-1 ${type === "credit" ? "text-emerald-700" : "text-slate-600"}`}>Credit (Discount)</p>
                <p className="text-[10px] text-slate-400">Balance kam karo</p>
              </button>
              <button
                onClick={() => setType("debit")}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  type === "debit" ? "border-red-500 bg-red-50" : "border-slate-200"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={type === "debit" ? "#dc2626" : "#94A3B8"} strokeWidth="2.5" strokeLinecap="round">
                  <path d="M5 12h14" />
                </svg>
                <p className={`text-xs font-bold mt-1 ${type === "debit" ? "text-red-700" : "text-slate-600"}`}>Debit (Charge)</p>
                <p className="text-[10px] text-slate-400">Balance barha'o</p>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Amount (Rs)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Rs</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-bold outline-none transition-colors
                  ${error && !reason ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-amber-400"}`}
                placeholder="0"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reason *</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(""); }}
              placeholder="e.g. Discount, Return, Penalty..."
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors
                ${error ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-amber-400"}`}
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {amountNum > 0 && (
            <div className={`rounded-xl p-3 text-sm flex items-center justify-between ${type === "credit" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              <span className="font-medium">{type === "credit" ? "Balance will decrease by:" : "Balance will increase by:"}</span>
              <span className="font-black">{formatCurrency(amountNum)}</span>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={loading || amountNum <= 0}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Save Adjustment"}
          </button>
        </div>
      </div>
    </div>
  );
}
