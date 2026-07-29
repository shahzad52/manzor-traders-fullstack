import { useState, useMemo } from "react";
import CustomerSelector from "../common/CustomerSelector";
import { formatCurrency } from "../../utils/productHelpers";
import { calcTotals } from "../../utils/posHelpers";
import ProductIcon from "../common/ProductIcon";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function POSCheckoutModal({ cartItems, products, onConfirm, onClose, customers = [], checkoutLoading = false, allInvoices = [] }) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showUdaarOnInvoice, setShowUdaarOnInvoice] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(todayValue());

  // Selected customer ka pichla udaar calculate karo
  const customerPreviousUdaar = useMemo(() => {
    if (!selectedCustomer) return 0;
    const custInvoices = allInvoices.filter(inv => {
      if (inv.customerId && String(inv.customerId) === String(selectedCustomer.id)) return true;
      if (!inv.customerId && inv.customerName &&
        inv.customerName.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase()) return true;
      return false;
    });
    return custInvoices.reduce((total, inv) => {
      const advInPay = (inv.payments || []).filter(p => p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const otherPay = (inv.payments || []).filter(p => !p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const advance = advInPay > 0 ? 0 : (inv.advance || 0);
      const due = Math.max(0, (inv.total || 0) - advInPay - otherPay - advance);
      return total + due;
    }, 0);
  }, [selectedCustomer, allInvoices]);

  const handleCustomerSelect = (c) => {
    setSelectedCustomer(c);
    setShowUdaarOnInvoice(false);
    if (c) { setCustomerName(c.name); setCustomerPhone(c.phone || ""); setCustomerAddress(c.city || ""); }
    else { setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); }
  };

  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [localCart, setLocalCart] = useState(cartItems.map(c => ({ ...c, ctn: c.ctn || 0 })));
  const updateCtn = (productId, val) => setLocalCart(prev => prev.map(c => c.productId === productId ? { ...c, ctn: Number(val) || 0 } : c));
  const [errors, setErrors] = useState({});
  const [paymentMode, setPaymentMode] = useState("paid");
  const [advanceAmount, setAdvanceAmount] = useState(0);

  const subtotal = useMemo(() => localCart.reduce((s, item) => s + item.product.salePrice * item.qty, 0), [localCart]);
  const { discount, tax, total } = useMemo(() => calcTotals(subtotal, Number(discountPercent) || 0, Number(taxPercent) || 0), [subtotal, discountPercent, taxPercent]);

  const updateQty = (productId, delta) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLocalCart((prev) => prev.map((c) => {
      if (c.productId !== productId) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return null;
      if (newQty > product.currentStock) return c;
      return { ...c, qty: newQty };
    }).filter(Boolean));
  };

  const removeItem = (productId) => setLocalCart((prev) => prev.filter((c) => c.productId !== productId));

  const validate = () => {
    const e = {};
    if (!customerName.trim()) e.customerName = "Customer ka naam likhein";
    if (localCart.length === 0) e.cart = "Cart khali hai";
    // Stock check — koi bhi item stock se zyada na ho
    localCart.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && item.qty > product.currentStock) {
        e.cart = `"${item.product?.name || product.name}" ka stock sirf ${product.currentStock} hai, aap ne ${item.qty} select kiya hai`;
      }
      if (product && product.currentStock <= 0) {
        e.cart = `"${item.product?.name || product.name}" out of stock hai — yeh product sell nahi ho sakta`;
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    let dateISO;
    if (invoiceDate) {
      const now = new Date();
      const picked = new Date(invoiceDate);
      picked.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      dateISO = picked.toISOString();
    } else {
      dateISO = new Date().toISOString();
    }
    onConfirm({
      localCart,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      customerId: selectedCustomer?.id || null,
      subtotal, discount, tax,
      discountPercent: Number(discountPercent) || 0,
      taxPercent: Number(taxPercent) || 0,
      total,
      paymentMode,
      advance: paymentMode === "udaar" ? (Number(advanceAmount) || 0) : total,
      paymentStatus: paymentMode === "paid" ? "paid" : (Number(advanceAmount) > 0 ? "partial" : "udaar"),
      createdAt: dateISO,
      showPreviousUdaarOnInvoice: showUdaarOnInvoice && customerPreviousUdaar > 0,
      previousUdaar: customerPreviousUdaar,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col"
        style={{ maxHeight: "95dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">Customer Details</h2>
              <p className="text-[10px] text-slate-400">Invoice complete karo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3 overscroll-contain">

          {/* Cart */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cart Summary</p>
            {errors.cart && <p className="text-xs text-red-500 mb-1.5">{errors.cart}</p>}
            <div className="space-y-1.5">
              {localCart.map((item) => (
                <div key={item.productId} className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <ProductIcon size={12} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-slate-400">{formatCurrency(item.product.salePrice)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateQty(item.productId, -1)} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14"/></svg>
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                      <button onClick={() => updateQty(item.productId, 1)} disabled={item.qty >= item.product.currentStock} className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                      </button>
                      <button onClick={() => removeItem(item.productId)} className="w-6 h-6 rounded-lg bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <span className="text-xs font-black text-blue-600 min-w-[3rem] text-right flex-shrink-0">{formatCurrency(item.product.salePrice * item.qty)}</span>
                  </div>
                  {/* CTN Row */}
                  <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-slate-200">
                    <span className="text-[10px] text-purple-600 font-bold">CTN (Carton):</span>
                    <input
                      type="number" min="0" value={item.ctn}
                      onChange={e => updateCtn(item.productId, e.target.value)}
                      placeholder="0"
                      className="w-16 px-2 py-0.5 rounded-lg border border-purple-200 bg-purple-50 text-xs outline-none focus:border-purple-400 text-center"
                    />
                    <span className="text-[10px] text-slate-400">boxes/cartons</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discount, Tax, Date */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Discount %</label>
              <input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Tax %</label>
              <input type="number" min="0" max="100" value={taxPercent} onChange={(e) => setTaxPercent(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-2 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-xs outline-none" />
            </div>
          </div>

          {/* Totals */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-1">
            <div className="flex justify-between text-xs text-slate-600"><span>Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-xs text-emerald-600"><span>Discount ({discountPercent}%)</span><span>-{formatCurrency(discount)}</span></div>}
            {tax > 0 && <div className="flex justify-between text-xs text-slate-600"><span>Tax ({taxPercent}%)</span><span>{formatCurrency(tax)}</span></div>}
            <div className="flex justify-between font-bold text-slate-800 text-sm border-t border-blue-100 pt-1.5 mt-0.5">
              <span>Total</span><span className="text-blue-600 font-black">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Customer</p>
            <div className="space-y-2">
              {customers.length > 0 && (
                <div>
                  <CustomerSelector customers={customers} onSelect={handleCustomerSelect} selectedCustomer={selectedCustomer} />
                  <p className="text-[10px] text-slate-400 mt-0.5">Ya neeche manually likhein</p>
                </div>
              )}

              {/* Pichla Udaar */}
              {selectedCustomer && customerPreviousUdaar > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">پچھلا ادھار</p>
                      <p className="text-base font-black text-red-600">{formatCurrency(customerPreviousUdaar)}</p>
                      <p className="text-[10px] text-slate-400">{selectedCustomer.name} ka baqi udaar</p>
                    </div>
                    <label className="flex flex-col items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showUdaarOnInvoice}
                        onChange={e => setShowUdaarOnInvoice(e.target.checked)}
                        className="w-5 h-5 accent-red-500 cursor-pointer"
                      />
                      <span className="text-[9px] text-slate-500 text-center leading-tight">Invoice<br/>pe show</span>
                    </label>
                  </div>
                  {showUdaarOnInvoice && (
                    <p className="text-[10px] text-red-600 font-semibold mt-1.5 bg-red-100 rounded-lg px-2 py-1">
                      ✓ Invoice print mein pichla udaar nazar ayega
                    </p>
                  )}
                </div>
              )}
              <div>
                <input value={customerName} onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: "" })); }}
                  placeholder="Customer Name *"
                  className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${errors.customerName ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"}`} />
                {errors.customerName && <p className="text-xs text-red-500 mt-0.5">{errors.customerName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none" />
                <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="City (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none" />
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Payment Mode</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button type="button" onClick={() => setPaymentMode("paid")}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${paymentMode === "paid" ? "border-emerald-500 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMode === "paid" ? "bg-emerald-500" : "bg-slate-200"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-bold ${paymentMode === "paid" ? "text-emerald-700" : "text-slate-600"}`}>Paid</p>
                  <p className="text-[9px] text-slate-400">Naghd / Full</p>
                </div>
              </button>
              <button type="button" onClick={() => setPaymentMode("udaar")}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${paymentMode === "udaar" ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-red-300"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMode === "udaar" ? "bg-red-500" : "bg-slate-200"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div className="text-left">
                  <p className={`text-xs font-bold ${paymentMode === "udaar" ? "text-red-700" : "text-slate-600"}`}>Udaar</p>
                  <p className="text-[9px] text-slate-400">Baad mein</p>
                </div>
              </button>
            </div>
            {paymentMode === "udaar" && (
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs</span>
                  <input type="number" min="0" max={total} step="any" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)}
                    placeholder="Advance (optional)"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:border-red-400 text-sm outline-none bg-white" />
                </div>
                <div className="rounded-xl px-3 py-2 flex justify-between items-center bg-red-50 border border-red-100">
                  <span className="text-[10px] font-semibold text-slate-600">Remaining Udaar:</span>
                  <span className="font-black text-red-600 text-sm">{formatCurrency(Math.max(0, total - Number(advanceAmount || 0)))}</span>
                </div>
              </div>
            )}
          </div>

          <div className="h-1" />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex gap-2 flex-shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Back</button>
          <button onClick={handleSubmit} disabled={localCart.length === 0 || checkoutLoading}
            className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
            {checkoutLoading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing...</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>{paymentMode === "udaar" ? "Udaar Invoice Banao" : "Invoice Banao"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
