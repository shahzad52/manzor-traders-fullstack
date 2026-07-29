import { useState, useMemo, useRef, useEffect } from "react";
import CustomerSelector from "../common/CustomerSelector";
import { calcTotals } from "../../utils/posHelpers";
import { formatCurrency } from "../../utils/productHelpers";

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

const emptyItem = () => ({ id: Date.now() + Math.random(), name: "", qty: 1, ctn: 0, salePrice: 0, costPrice: 0 });

function prefillItems(existingInvoice) {
  if (!existingInvoice?.items?.length) return [emptyItem()];
  return existingInvoice.items.map((i) => ({
    id: Date.now() + Math.random(),
    name: i.name || "",
    qty: i.qty || 1,
    ctn: i.ctn || 0,
    salePrice: i.unitPrice || i.salePrice || 0,
    costPrice: i.costPrice || 0,
  }));
}

// Product autocomplete dropdown
function ProductAutocomplete({ value, onChange, onSelect, products }) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    if (value.trim().length === 0) { setFiltered([]); setOpen(false); return; }
    const q = value.toLowerCase();
    const results = products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
    setFiltered(results);
    setOpen(results.length > 0);
  }, [value, products]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Item name likhein..."
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-400"
      />
      {open && (
        <div className="absolute left-0 top-full mt-0.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 w-full max-h-48 overflow-y-auto">
          {filtered.map(p => (
            <div
              key={p.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
              onMouseDown={() => { onSelect(p); setOpen(false); }}
            >
              <span className="text-xs font-semibold text-slate-800">{p.name}</span>
              <span className="text-[10px] text-slate-400">{formatCurrency(p.salePrice)} · {p.currentStock <= 0 ? <span className="text-red-500">Out</span> : `${p.currentStock} available`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InvoiceFormModal({ products, existingInvoice, prefillCustomer = null, onSave, onClose, customers = [], saveLoading = false, allInvoices = [] }) {
  const isEdit = !!existingInvoice;

  const [customerName, setCustomerName] = useState(prefillCustomer?.name || existingInvoice?.customerName || "");
  const [customerPhone, setCustomerPhone] = useState(prefillCustomer?.phone || existingInvoice?.customerPhone || "");
  const [customerAddress, setCustomerAddress] = useState(prefillCustomer?.city || existingInvoice?.customerAddress || "");
  const [selectedCustomer, setSelectedCustomer] = useState(prefillCustomer || null);
  const [showUdaarOnInvoice, setShowUdaarOnInvoice] = useState(existingInvoice?.showPreviousUdaarOnInvoice ?? true);
  const customerLocked = !!prefillCustomer;

  // Selected customer ka pichla udaar calculate karo (current invoice ko exclude karo edit mode mein)
  const customerPreviousUdaar = useMemo(() => {
    if (!selectedCustomer && !prefillCustomer) return 0;
    const custId = selectedCustomer?.id || prefillCustomer?.id;
    const custName = selectedCustomer?.name || prefillCustomer?.name || customerName;
    const custInvoices = allInvoices.filter(inv => {
      // Edit mode mein current invoice ko exclude karo
      if (existingInvoice && String(inv.id) === String(existingInvoice.id)) return false;
      if (custId && inv.customerId && String(inv.customerId) === String(custId)) return true;
      if (!inv.customerId && inv.customerName &&
        inv.customerName.trim().toLowerCase() === custName.trim().toLowerCase()) return true;
      return false;
    });
    return custInvoices.reduce((total, inv) => {
      const advInPay = (inv.payments || []).filter(p => p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const otherPay = (inv.payments || []).filter(p => !p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const advance = advInPay > 0 ? 0 : (inv.advance || 0);
      const due = Math.max(0, (inv.total || 0) - advInPay - otherPay - advance);
      return total + due;
    }, 0);
  }, [selectedCustomer, prefillCustomer, allInvoices, existingInvoice, customerName]);

  const handleCustomerSelect = (c) => {
    setSelectedCustomer(c);
    setShowUdaarOnInvoice(true);
    if (c) { setCustomerName(c.name); setCustomerPhone(c.phone || ""); setCustomerAddress(c.city || ""); }
    else { setCustomerName(""); setCustomerPhone(""); setCustomerAddress(""); }
  };

  const [items, setItems] = useState(() => prefillItems(existingInvoice));
  const [discountPercent, setDiscountPercent] = useState(existingInvoice?.discountPercent ?? 0);
  const [taxPercent, setTaxPercent] = useState(existingInvoice?.taxPercent ?? 0);
  const [notes, setNotes] = useState(existingInvoice?.notes || "");
  const [errors, setErrors] = useState({});
  const [paymentMode, setPaymentMode] = useState(existingInvoice?.paymentMode || "paid");
  const [advanceAmount, setAdvanceAmount] = useState(
    (existingInvoice?.paymentMode === "udaar" && existingInvoice?.advance > 0) ? existingInvoice.advance : 0
  );
  const [invoiceDate, setInvoiceDate] = useState(
    existingInvoice?.createdAt ? existingInvoice.createdAt.slice(0, 10) : todayValue()
  );
  // Guard against double-submit (e.g. double click / double tap) which was
  // creating the same invoice twice. saveLoading from parent is optional —
  // this internal lock always protects the Save button on its own.
  const [isSaving, setIsSaving] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.salePrice || 0), 0), [items]);
  const { discount, tax, total } = useMemo(() => calcTotals(subtotal, Number(discountPercent) || 0, Number(taxPercent) || 0), [subtotal, discountPercent, taxPercent]);
  const totalCost = useMemo(() => items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.costPrice || 0), 0), [items]);
  const grossProfit = total - totalCost;
  const profitMargin = total > 0 ? (grossProfit / total) * 100 : 0;

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id, field, value) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const fillFromProduct = (id, p) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, productId: p.id, name: p.name, salePrice: p.salePrice, costPrice: p.costPrice || p.stockPrice || 0 } : i));
  };

  const validate = () => {
    const e = {};
    if (!customerName.trim()) e.customerName = "Customer name likhein";
    const valid = items.filter((i) => i.name.trim() && Number(i.qty) > 0);
    if (valid.length === 0) e.items = "Kam az kam ek item zaroor ho";
    if (!existingInvoice) {
      valid.forEach((item) => {
        if (!item.productId) return;
        const prod = products.find((p) => String(p.id) === String(item.productId));
        if (prod && prod.currentStock <= 0) {
          e.items = `"${prod.name}" out of stock hai`;
        } else if (prod && Number(item.qty) > prod.currentStock) {
          e.items = `"${prod.name}" ka stock sirf ${prod.currentStock} hai`;
        }
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    // Already saving — ignore extra clicks/taps so we never submit twice.
    if (isSaving) return;
    if (!validate()) return;
    const validItems = items.filter((i) => i.name.trim() && Number(i.qty) > 0).map((i) => ({
      productId: i.productId || null, name: i.name.trim(), qty: Number(i.qty),
      ctn: Number(i.ctn) || 0,
      unitPrice: Number(i.salePrice), salePrice: Number(i.salePrice), costPrice: Number(i.costPrice),
      lineTotal: Number(i.qty) * Number(i.salePrice), lineCost: Number(i.qty) * Number(i.costPrice),
    }));
    let dateISO;
    if (invoiceDate) {
      const now = new Date();
      const picked = new Date(invoiceDate);
      picked.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      dateISO = picked.toISOString();
    } else {
      dateISO = new Date().toISOString();
    }
    setIsSaving(true);
    try {
      // ✅ FIX: Build save data object first
      const saveData = {
        customerName: customerName.trim(), customerPhone: customerPhone.trim(), customerAddress: customerAddress.trim(),
        customerId: selectedCustomer?.id || null, notes: notes.trim(),
        subtotal, discount, tax,
        discountPercent: Number(discountPercent) || 0, taxPercent: Number(taxPercent) || 0, total,
        totalCost, grossProfit, profitMargin: Number(profitMargin.toFixed(2)),
        items: validItems, source: "manual", paymentMode,
        advance: paymentMode === "udaar" ? (Number(advanceAmount) || 0) : total,
        paymentStatus: paymentMode === "paid" ? "paid" : (Number(advanceAmount) > 0 ? "partial" : "udaar"),
        payments: paymentMode === "udaar" && Number(advanceAmount) > 0
          ? [{ amount: Number(advanceAmount), date: dateISO, note: "Advance at sale" }] : [],
        createdAt: dateISO,
        showPreviousUdaarOnInvoice: showUdaarOnInvoice && customerPreviousUdaar > 0,
        previousUdaar: customerPreviousUdaar || 0,
      };
      
      // ✅ FIX: Preserve invoice number when editing
      if (isEdit) {
        saveData.invoiceNumber = existingInvoice.invoiceNumber;
      }
      
      await onSave(saveData);
      // Note: on success the parent normally closes this modal (setShowForm(false)),
      // which unmounts us — no need to reset isSaving in that case.
    } catch (err) {
      // If saving failed, unlock so the user can retry.
      setIsSaving(false);
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl flex flex-col"
        style={{ maxHeight: "95dvh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 ${isEdit ? "bg-amber-500 shadow-amber-200" : "bg-blue-600 shadow-blue-200"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                {isEdit
                  ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
                  : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></>
                }
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">
                {isEdit ? `Edit Invoice #${String(existingInvoice.invoiceNumber || existingInvoice.id).padStart(3,"0")}` : "New Invoice"}
              </h2>
              {prefillCustomer && <p className="text-[10px] text-blue-500 font-semibold">{prefillCustomer.name}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3 overscroll-contain">

          {/* Customer */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Customer</p>
            {customerLocked ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{customerName}</p>
                  {customerPhone && <p className="text-xs text-slate-400">{customerPhone}</p>}
                </div>
                <span className="ml-auto text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Auto-filled</span>
              </div>
            ) : (
              <div className="space-y-2">
                {customers.length > 0 && (
                  <div>
                    <CustomerSelector customers={customers} onSelect={handleCustomerSelect} selectedCustomer={selectedCustomer} />
                    <p className="text-[10px] text-slate-400 mt-0.5">Ya neeche likhein</p>
                  </div>
                )}
                <div>
                  <input value={customerName} onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: "" })); }}
                    placeholder="Customer Name *"
                    className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${errors.customerName ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400 bg-white"}`} />
                  {errors.customerName && <p className="text-xs text-red-500 mt-0.5">{errors.customerName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 bg-white text-sm outline-none" />
                  <input value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="City"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 bg-white text-sm outline-none" />
                </div>
              </div>
            )}

            {/* Pichla Udaar Box */}
            {customerPreviousUdaar > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">پچھلا ادھار</p>
                    <p className="text-base font-black text-red-600">{customerPreviousUdaar.toLocaleString("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-slate-400">{(selectedCustomer?.name || customerName)} ka baqi udaar</p>
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
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Items</p>
              <button onClick={addItem} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Add Item
              </button>
            </div>
            {errors.items && <p className="text-xs text-red-500 mb-1.5">{errors.items}</p>}
            <div className="space-y-2">
              {items.map((item) => {
                const selectedProd = item.productId ? products.find(p => String(p.id) === String(item.productId)) : null;
                const isOutOfStock = selectedProd && selectedProd.currentStock <= 0;
                const isLowStock = selectedProd && selectedProd.currentStock > 0 && Number(item.qty) > selectedProd.currentStock;
                return (
                <div key={item.id} className={`bg-slate-50 rounded-xl p-2.5 border ${isOutOfStock ? "border-red-300 bg-red-50" : isLowStock ? "border-amber-300 bg-amber-50" : "border-slate-100"}`}>
                  {/* Product Autocomplete */}
                  <div className="mb-2 flex gap-2 items-center">
                    <div className="flex-1">
                      <ProductAutocomplete
                        value={item.name}
                        onChange={(val) => updateItem(item.id, "name", val)}
                        onSelect={(p) => fillFromProduct(item.id, p)}
                        products={products}
                      />
                    </div>
                    {isOutOfStock && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full whitespace-nowrap">Out of Stock</span>}
                    {isLowStock && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full whitespace-nowrap">Sirf {selectedProd.currentStock}</span>}
                  </div>
                  {/* Qty | CTN | Sale | Cost | Delete */}
                  <div className="grid grid-cols-12 gap-1.5 items-center">
                    <div className="col-span-2">
                      <input type="number" min="1" value={item.qty} onChange={(e) => updateItem(item.id, "qty", e.target.value)} placeholder="Qty"
                        className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-400 text-center" />
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="0" value={item.ctn} onChange={(e) => updateItem(item.id, "ctn", e.target.value)} placeholder="CTN"
                        className="w-full px-1.5 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-xs outline-none focus:border-purple-400 text-center" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" value={item.salePrice} onChange={(e) => updateItem(item.id, "salePrice", e.target.value)} placeholder="Sale"
                        className="w-full px-1.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs outline-none focus:border-blue-400 text-right" />
                    </div>
                    <div className="col-span-3">
                      <input type="number" min="0" value={item.costPrice} onChange={(e) => updateItem(item.id, "costPrice", e.target.value)} placeholder="Cost"
                        className="w-full px-1.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-xs outline-none focus:border-amber-400 text-right" />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {items.length > 1 && (
                        <button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                    <span>Qty · CTN · Sale · Cost</span>
                    <div className="flex gap-2">
                      <span className="font-bold text-blue-600">Total: {formatCurrency(Number(item.qty||0)*Number(item.salePrice||0))}</span>
                      {item.costPrice > 0 && <span className="text-emerald-600 font-semibold">Munafa: {formatCurrency(Number(item.qty||0)*(Number(item.salePrice||0)-Number(item.costPrice||0)))}</span>}
                    </div>
                  </div>
                </div>
              );})}
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

          {/* Notes */}
          <div>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none" />
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
                <div><p className={`text-xs font-bold ${paymentMode === "paid" ? "text-emerald-700" : "text-slate-600"}`}>Paid</p><p className="text-[9px] text-slate-400">Naghd / Full</p></div>
              </button>
              <button type="button" onClick={() => setPaymentMode("udaar")}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${paymentMode === "udaar" ? "border-red-500 bg-red-50" : "border-slate-200 bg-white hover:border-red-300"}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${paymentMode === "udaar" ? "bg-red-500" : "bg-slate-200"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div><p className={`text-xs font-bold ${paymentMode === "udaar" ? "text-red-700" : "text-slate-600"}`}>Udaar</p><p className="text-[9px] text-slate-400">Baad mein</p></div>
              </button>
            </div>
            {paymentMode === "udaar" && (
              <div className="space-y-1.5">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rs</span>
                  <input type="number" min="0" step="any" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)}
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

          {/* Totals */}
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-1">
            <div className="flex justify-between text-xs text-slate-600"><span>Subtotal</span><span className="font-semibold">{formatCurrency(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-xs text-emerald-600"><span>Discount ({discountPercent}%)</span><span>-{formatCurrency(discount)}</span></div>}
            {tax > 0 && <div className="flex justify-between text-xs text-slate-600"><span>Tax ({taxPercent}%)</span><span>{formatCurrency(tax)}</span></div>}
            <div className="flex justify-between font-bold text-slate-800 text-sm border-t border-blue-100 pt-1.5">
              <span>Total</span><span className="text-blue-600 font-black">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="h-1" />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 flex gap-2 flex-shrink-0 bg-white">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSave} disabled={saveLoading || isSaving}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2 ${isEdit ? "bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-200" : "bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"}`}>
            {(saveLoading || isSaving) ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
            ) : (
              isEdit ? "Save Changes" : "Invoice Banao"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
