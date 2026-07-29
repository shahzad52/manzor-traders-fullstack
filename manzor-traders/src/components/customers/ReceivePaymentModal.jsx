import { useState, useMemo } from "react";
import { formatCurrency } from "../../utils/productHelpers";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ReceivePaymentModal({ customer, invoices = [], selectedInvoice = null, onConfirm, onClose }) {
  const unpaidInvoices = useMemo(() =>
    invoices.filter((inv) => inv.due > 0).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [invoices]
  );

  const totalDue = useMemo(() => unpaidInvoices.reduce((s, i) => s + i.due, 0), [unpaidInvoices]);

  const [paymentType, setPaymentType] = useState(selectedInvoice ? "invoice" : "full");
  const [amount, setAmount] = useState(
    selectedInvoice ? String(selectedInvoice.due) : String(totalDue)
  );
  const [note, setNote] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState(
    selectedInvoice ? [selectedInvoice.id] : []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));

  const amountNum = parseFloat(amount) || 0;

  // Preview FIFO allocation
  const fifoAllocation = useMemo(() => {
    if (paymentType === "invoice" && selectedInvoiceIds.length > 0) {
      // Allocate to selected invoices in order
      let remaining = amountNum;
      return unpaidInvoices
        .filter((inv) => selectedInvoiceIds.includes(inv.id))
        .map((inv) => {
          const pay = Math.min(remaining, inv.due);
          remaining -= pay;
          return { ...inv, paying: pay };
        });
    } else {
      // FIFO across all unpaid
      let remaining = amountNum;
      return unpaidInvoices.map((inv) => {
        const pay = Math.min(remaining, inv.due);
        remaining -= pay;
        return { ...inv, paying: pay };
      }).filter((a) => a.paying > 0);
    }
  }, [amountNum, paymentType, selectedInvoiceIds, unpaidInvoices]);

  const handleTypeChange = (type) => {
    setPaymentType(type);
    setError("");
    if (type === "full") {
      setAmount(String(totalDue));
      setSelectedInvoiceIds([]);
    } else if (type === "partial") {
      setAmount("");
      setSelectedInvoiceIds([]);
    } else {
      setAmount(
        selectedInvoice
          ? String(selectedInvoice.due)
          : unpaidInvoices.length > 0 ? String(unpaidInvoices[0].due) : ""
      );
      if (selectedInvoice) setSelectedInvoiceIds([selectedInvoice.id]);
    }
  };

  const toggleInvoice = (id) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    // Recalc amount from selected invoices
    const newIds = selectedInvoiceIds.includes(id)
      ? selectedInvoiceIds.filter((x) => x !== id)
      : [...selectedInvoiceIds, id];
    const total = unpaidInvoices
      .filter((inv) => newIds.includes(inv.id))
      .reduce((s, i) => s + i.due, 0);
    setAmount(String(total));
  };

  const validate = () => {
    if (!amountNum || amountNum <= 0) { setError("Amount likhein"); return false; }
    if (amountNum > totalDue + 0.01) { setError(`Amount Rs ${formatCurrency(totalDue).replace("Rs ","")} se zyada nahi ho sakta`); return false; }
    if (paymentType === "invoice" && selectedInvoiceIds.length === 0) { setError("Kam az kam ek invoice select karein"); return false; }
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onConfirm({
        customerId: customer.id,
        paymentType,
        amount: amountNum,
        note: note.trim(),
        date: paymentDate ? new Date(paymentDate).toISOString() : new Date().toISOString(),
        allocations: fifoAllocation.map((a) => ({ invoiceId: a.id, amount: a.paying })),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Payment Receive Karein</h2>
              <p className="text-xs text-slate-400">{customer.name} · Total Due: {formatCurrency(totalDue)}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Payment Type */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Type</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "full", label: "Full Balance", desc: "Pura baaki" },
                { key: "partial", label: "Partial", desc: "Kuch raqam" },
                { key: "invoice", label: "Invoice-wise", desc: "Invoice select" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleTypeChange(opt.key)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 text-center transition-all ${
                    paymentType === opt.key
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                  }`}
                >
                  <p className={`text-xs font-bold ${paymentType === opt.key ? "text-emerald-700" : "text-slate-700"}`}>{opt.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Invoice Selection */}
          {paymentType === "invoice" && unpaidInvoices.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Invoice Select Karein</p>
              <div className="space-y-2">
                {unpaidInvoices.map((inv) => (
                  <button
                    key={inv.id}
                    onClick={() => toggleInvoice(inv.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedInvoiceIds.includes(inv.id)
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                      selectedInvoiceIds.includes(inv.id) ? "bg-emerald-500" : "bg-slate-200"
                    }`}>
                      {selectedInvoiceIds.includes(inv.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">
                        Invoice #{String(inv.invoiceNumber || inv.id).padStart(3, "0")}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(inv.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-red-600">{formatCurrency(inv.due)}</p>
                      <p className="text-[10px] text-slate-400">due</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              {paymentType === "full" ? "Total Amount" : "Amount (Rs)"}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Rs</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                readOnly={paymentType === "full"}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-bold outline-none transition-colors
                  ${paymentType === "full" ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-white border-slate-200 focus:border-emerald-400"}
                  ${error ? "border-red-400 bg-red-50" : ""}`}
                placeholder="0"
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          {/* Note + Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Note (Optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Cash, Bank..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Date</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 text-sm outline-none"
              />
            </div>
          </div>

          {/* FIFO Preview */}
          {amountNum > 0 && fifoAllocation.length > 0 && (
            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
              <p className="text-xs font-bold text-emerald-700 mb-2">Payment Allocation Preview</p>
              <div className="space-y-1.5">
                {fifoAllocation.map((a, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">
                      Invoice #{String(a.invoiceNumber || a.id).padStart(3, "0")}
                      <span className="text-slate-400 ml-1">(Due: {formatCurrency(a.due)})</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-600">-{formatCurrency(a.paying)}</span>
                      {a.paying >= a.due ? (
                        <span className="text-[9px] font-bold bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">PAID</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full">
                          Rem: {formatCurrency(a.due - a.paying)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {paymentType !== "invoice" && amountNum < totalDue && (
                <p className="text-[10px] text-emerald-600 mt-2 font-medium">
                  FIFO method: Purani invoices pehle settle hongi
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || amountNum <= 0}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>Confirm Payment</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
