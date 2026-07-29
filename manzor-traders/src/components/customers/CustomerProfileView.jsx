import { useState, useMemo } from "react";
import { formatCurrency } from "../../utils/productHelpers";
import ReceivePaymentModal from "./ReceivePaymentModal";
import InvoiceFormModal from "../invoices/InvoiceFormModal";
import InvoicePrintModal from "../invoices/InvoicePrintModal";
import OldUdaarModal from "./OldUdaarModal";

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
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-PK", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }) {
  if (status === "paid") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Paid
    </span>
  );
  if (status === "partial") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Partial
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Udaar
    </span>
  );
}

export default function CustomerProfileView({
  customer,
  customerIndex = 0,
  allInvoices = [],
  products = [],
  customers = [],
  onBack,
  onReceivePayment,
  onCreateInvoice,
  onReduceStock,
  onUpdateInvoice,
  onDeleteInvoice,
  invoiceSettings = {},
}) {
  const [activeTab, setActiveTab] = useState("udaar");
  const [showPayment, setShowPayment] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [showOldUdaar, setShowOldUdaar] = useState(false);
  const [oldUdaarLoading, setOldUdaarLoading] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [selectedForBulk, setSelectedForBulk] = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  // Edit / Delete / Print
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fix: match by customerId OR by customerName (for older invoices without customerId) ──
  const customerInvoices = useMemo(() => {
    return allInvoices
      .filter((inv) => {
        // primary match: customerId
        if (inv.customerId && String(inv.customerId) === String(customer.id)) return true;
        // fallback: name match (older invoices saved without customerId)
        if (!inv.customerId && inv.customerName &&
          inv.customerName.trim().toLowerCase() === customer.name.trim().toLowerCase() &&
          (!inv.customerPhone || !customer.phone || inv.customerPhone.replace(/\D/g, "") === customer.phone.replace(/\D/g, ""))
        ) return true;
        return false;
      })
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [allInvoices, customer]);

  const invoicesWithBalance = useMemo(() => {
    return customerInvoices.map((inv) => {
      // payments array mein "Advance at sale" already hota hai — double count se bachao
      const advanceInPayments = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const otherPayments = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      // Agar advance payments mein nahi hai toh advance field use karo
      const advance = advanceInPayments > 0 ? 0 : (inv.advance || 0);
      const totalPaidIncAdv = advanceInPayments + otherPayments + advance;
      const due = Math.max(0, (inv.total || 0) - totalPaidIncAdv);
      let status = "udaar";
      if (due <= 0) status = "paid";
      else if (totalPaidIncAdv > 0) status = "partial";
      return { ...inv, totalPaid: totalPaidIncAdv, due, status };
    });
  }, [customerInvoices]);

  const udaarInvoices = useMemo(() =>
    invoicesWithBalance.filter(inv => inv.status !== "paid").slice().reverse(),
    [invoicesWithBalance]
  );
  const paidInvoices = useMemo(() =>
    invoicesWithBalance.filter(inv => inv.status === "paid").slice().reverse(),
    [invoicesWithBalance]
  );

  const totalInvoiced = useMemo(() => invoicesWithBalance.reduce((s, i) => s + (i.total || 0), 0), [invoicesWithBalance]);
  const totalPaid = useMemo(() => invoicesWithBalance.reduce((s, i) => s + i.totalPaid, 0), [invoicesWithBalance]);
  const totalDue = useMemo(() => invoicesWithBalance.reduce((s, i) => s + i.due, 0), [invoicesWithBalance]);

  const bulkSelectedTotal = useMemo(() =>
    udaarInvoices.filter(inv => selectedForBulk.has(inv.id)).reduce((s, inv) => s + inv.due, 0),
    [selectedForBulk, udaarInvoices]
  );

  const toggleBulkSelect = (invId) => {
    setSelectedForBulk(prev => {
      const next = new Set(prev);
      if (next.has(invId)) next.delete(invId); else next.add(invId);
      return next;
    });
  };
  const selectAllUdaar = () => setSelectedForBulk(new Set(udaarInvoices.map(i => i.id)));
  const clearSelection = () => setSelectedForBulk(new Set());

  const handlePayInvoice = (inv) => { setPaymentInvoice(inv); setShowPayment(true); };

  const handlePaymentDone = async (paymentData) => {
    await onReceivePayment(paymentData);
    setShowPayment(false);
    setPaymentInvoice(null);
    setSelectedForBulk(new Set());
    setShowBulkConfirm(false);
  };

  const handleCreateInvoice = async (data) => {
    setInvoiceLoading(true);
    try {
      // Reduce stock for items that have a productId
      if (data.items) {
        // We need completeSale — pass it via onReduceStock prop
        const stockItems = data.items
          .filter((i) => i.productId)
          .map((i) => ({ productId: String(i.productId), qty: Number(i.qty) }));
        if (stockItems.length > 0 && onReduceStock) {
          await onReduceStock(stockItems);
        }
      }
      await onCreateInvoice({
        ...data,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || data.customerPhone,
      });
      setShowNewInvoice(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Purana udhaar — bina product ke, sirf amount likh kar customer ke udhaar mein add karo.
  // Yeh revenue mein count hoga lekin profit mein nahi (koi cost/item na hone ki wajah se).
  const handleAddOldUdaar = async ({ amount, note, date }) => {
    setOldUdaarLoading(true);
    try {
      await onCreateInvoice({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || "",
        items: [],
        subtotal: amount,
        discount: 0,
        total: amount,
        advance: 0,
        grossProfit: 0,
        isOldUdaar: true,
        note: note || "Purana Udhaar",
        paymentMode: "udaar",
        createdAt: date,
      });
      setShowOldUdaar(false);
    } finally {
      setOldUdaarLoading(false);
    }
  };

  const handleDeleteInvoice = async (inv) => {
    setDeleteLoading(true);
    try {
      await onDeleteInvoice(inv.id, inv.source || "manual");
      setDeletingInvoice(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateInvoice = async (data) => {
    if (!editingInvoice) return;
    await onUpdateInvoice(editingInvoice.id, data, editingInvoice.source || "manual");
    setEditingInvoice(null);
  };

  const colorClass = AVATAR_COLORS[customerIndex % AVATAR_COLORS.length];

  const InvoiceCard = ({ inv, showSelect = false }) => (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${showSelect && selectedForBulk.has(inv.id) ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-100"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {showSelect && (
            <button onClick={() => toggleBulkSelect(inv.id)}
              className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${selectedForBulk.has(inv.id) ? "border-blue-500 bg-blue-500" : "border-slate-300 bg-white hover:border-blue-400"}`}>
              {selectedForBulk.has(inv.id) && <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </button>
          )}
          <div>
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              {inv.isOldUdaar ? "Purana Udhaar" : `Invoice #${String(inv.invoiceNumber || inv.id).padStart(3, "0")}`}
              {inv.isOldUdaar && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-500">OLD</span>
              )}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(inv.createdAt)}{inv.note ? ` · ${inv.note}` : ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge status={inv.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400">Total</p>
          <p className="text-sm font-black text-slate-800">{formatCurrency(inv.total)}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400">Paid</p>
          <p className="text-sm font-black text-emerald-700">{formatCurrency(inv.totalPaid)}</p>
        </div>
        <div className={`${inv.due > 0 ? "bg-red-50" : "bg-emerald-50"} rounded-xl px-3 py-2`}>
          <p className="text-[10px] text-slate-400">Udaar</p>
          <p className={`text-sm font-black ${inv.due > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(inv.due)}</p>
        </div>
      </div>

      {inv.items && inv.items.length > 0 && (
        <div className="text-xs text-slate-400 mb-3">
          {inv.items.slice(0, 3).map((item, i) => (
            <span key={i}>{item.name} ×{item.qty}{i < Math.min(inv.items.length, 3) - 1 ? ", " : ""}</span>
          ))}
          {inv.items.length > 3 && <span> +{inv.items.length - 3} more</span>}
        </div>
      )}

      {(inv.payments || []).length > 0 && (
        <div className="mb-3 border-t border-slate-100 pt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Payments Received</p>
          <div className="space-y-1">
            {(inv.payments || []).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{formatDate(p.date)}{p.note ? ` · ${p.note}` : ""}</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {inv.advance > 0 && (
        <div className="mb-3 text-xs flex items-center justify-between text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
          <span>Advance</span><span className="font-bold">{formatCurrency(inv.advance)}</span>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        {inv.due > 0 && !showSelect && (
          <button onClick={() => handlePayInvoice(inv)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            Pay {formatCurrency(inv.due)}
          </button>
        )}
        <button onClick={() => setPrintingInvoice(inv)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors flex-shrink-0" title="Print">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        </button>
        {onUpdateInvoice && (
          <button onClick={() => setEditingInvoice(inv)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors flex-shrink-0" title="Edit">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        )}
        {onDeleteInvoice && (
          <button onClick={() => setDeletingInvoice(inv)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 hover:bg-red-100 text-red-400 transition-colors flex-shrink-0" title="Delete">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/80">
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          Customers
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0 shadow-lg`}>
              <span className="text-white text-base font-bold">{getInitials(customer.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-slate-800">{customer.name}</h2>
              <p className="text-sm text-slate-500">{customer.phone}</p>
              {customer.city && <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">{customer.city}</span>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-slate-400 mb-0.5">Outstanding</p>
              <p className={`text-xl font-black ${totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(totalDue)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100">
            <div className="text-center">
              <p className="text-[10px] text-slate-400">Invoiced</p>
              <p className="text-sm font-black text-slate-800">{formatCurrency(totalInvoiced)}</p>
            </div>
            <div className="text-center border-x border-slate-100">
              <p className="text-[10px] text-slate-400">Received</p>
              <p className="text-sm font-black text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400">Udaar</p>
              <p className={`text-sm font-black ${totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(totalDue)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => { setPaymentInvoice(null); setShowPayment(true); }}
            disabled={totalDue <= 0}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            Receive Payment
          </button>
          <button
            onClick={() => setShowNewInvoice(true)}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M12 18v-6M9 15h6" /></svg>
            New Invoice
          </button>
          <button
            onClick={() => setShowOldUdaar(true)}
            className="col-span-2 flex items-center justify-center gap-2 px-3 py-3 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl border border-red-100 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            Purana Udhaar Add Karein
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 mb-4">
          {[
            { key: "udaar", label: `Udaar (${udaarInvoices.length})`, activeClass: "bg-red-500 text-white" },
            { key: "paid", label: `Paid (${paidInvoices.length})`, activeClass: "bg-emerald-600 text-white" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); clearSelection(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === tab.key ? tab.activeClass : "text-slate-500 hover:text-slate-700"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-8">

        {/* UDAAR TAB */}
        {activeTab === "udaar" && (
          <div>
            {udaarInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <p className="text-sm font-bold text-emerald-600">Koi udaar nahi!</p>
                <p className="text-xs text-slate-400 mt-1">Is customer ka koi baqi nahi hai.</p>
              </div>
            ) : (
              <div>
                {/* Bulk Controls */}
                <div className="flex items-center justify-between mb-3 bg-white rounded-xl border border-slate-100 px-4 py-2.5">
                  <button onClick={selectedForBulk.size === udaarInvoices.length ? clearSelection : selectAllUdaar}
                    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${selectedForBulk.size === udaarInvoices.length ? "border-blue-500 bg-blue-500" : selectedForBulk.size > 0 ? "border-blue-400 bg-blue-100" : "border-slate-300"}`}>
                      {selectedForBulk.size === udaarInvoices.length && <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}
                      {selectedForBulk.size > 0 && selectedForBulk.size < udaarInvoices.length && <div className="w-2 h-0.5 bg-blue-500 rounded" />}
                    </div>
                    {selectedForBulk.size === 0 ? "Sab Select" : selectedForBulk.size === udaarInvoices.length ? "Deselect Sab" : `${selectedForBulk.size} Selected`}
                  </button>
                  {selectedForBulk.size > 0 && (
                    <button onClick={() => setShowBulkConfirm(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      Pay {formatCurrency(bulkSelectedTotal)}
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {udaarInvoices.map((inv) => <InvoiceCard key={inv.id} inv={inv} showSelect={true} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAID TAB */}
        {activeTab === "paid" && (
          <div>
            {paidInvoices.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
                <p className="text-sm text-slate-400">Abhi tak koi paid invoice nahi hai.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paidInvoices.map((inv) => <InvoiceCard key={inv.id} inv={inv} showSelect={false} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Confirm */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full sm:max-w-sm shadow-2xl p-5">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
            <h3 className="text-center text-lg font-black text-slate-800 mb-1">Bulk Payment</h3>
            <p className="text-center text-sm text-slate-500 mb-1">{selectedForBulk.size} invoice{selectedForBulk.size > 1 ? "s" : ""} ek sath settle karo</p>
            <p className="text-center text-2xl font-black text-emerald-600 mb-5">{formatCurrency(bulkSelectedTotal)}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkConfirm(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => {
                const combinedInvoice = { id: "bulk", invoiceNumber: "BULK", total: bulkSelectedTotal, due: bulkSelectedTotal, totalPaid: 0, status: "udaar", isBulk: true, bulkInvoiceIds: Array.from(selectedForBulk), payments: [] };
                setShowBulkConfirm(false);
                setPaymentInvoice(combinedInvoice);
                setShowPayment(true);
              }} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200 transition-all">
                Haan, Pay Karo
              </button>
            </div>
          </div>
        </div>
      )}

      {showPayment && (
        <ReceivePaymentModal
          customer={customer}
          invoices={invoicesWithBalance}
          selectedInvoice={paymentInvoice}
          onConfirm={handlePaymentDone}
          onClose={() => { setShowPayment(false); setPaymentInvoice(null); }}
        />
      )}

      {showNewInvoice && (
        <InvoiceFormModal
          products={products}
          customers={customers}
          allInvoices={allInvoices}
          existingInvoice={null}
          prefillCustomer={customer}
          onSave={handleCreateInvoice}
          onClose={() => setShowNewInvoice(false)}
          saveLoading={invoiceLoading}
        />
      )}

      {showOldUdaar && (
        <OldUdaarModal
          customer={customer}
          onConfirm={handleAddOldUdaar}
          onClose={() => !oldUdaarLoading && setShowOldUdaar(false)}
        />
      )}

      {printingInvoice && (
        <InvoicePrintModal
          invoice={printingInvoice}
          invoiceSettings={invoiceSettings}
          onClose={() => setPrintingInvoice(null)}
          allInvoices={allInvoices}
        />
      )}

      {editingInvoice && (
        <InvoiceFormModal
          products={products}
          customers={customers}
          allInvoices={allInvoices}
          existingInvoice={editingInvoice}
          onSave={handleUpdateInvoice}
          onClose={() => setEditingInvoice(null)}
          saveLoading={false}
        />
      )}

      {deletingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-red-100 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </div>
            <h3 className="text-center text-lg font-black text-slate-800 mb-1">Invoice Delete Karo?</h3>
            <p className="text-center text-sm text-slate-500 mb-5">
              Invoice #{String(deletingInvoice.invoiceNumber || deletingInvoice.id).padStart(3,"0")} permanently delete ho jayega.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingInvoice(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleDeleteInvoice(deletingInvoice)} disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Haan, Delete Karo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
