import { useState, useMemo } from "react";
import SVGIcon from "../common/SVGIcon";
import CustomerProfileView from "./CustomerProfileView";

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-emerald-500 to-emerald-600",
  "from-amber-500 to-amber-600",
  "from-rose-500 to-rose-600",
  "from-cyan-500 to-cyan-600",
];

function formatCurrency(val) {
  return "Rs " + Number(val).toLocaleString("en-PK");
}
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}
function getInitials(name) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState(
    customer
      ? { name: customer.name, phone: customer.phone, email: customer.email || "", city: customer.city || "" }
      : { name: "", phone: "", email: "", city: "" }
  );
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ ...form });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-lg">{customer ? "Edit Customer" : "New Customer"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {[
            { key: "name", label: "Name *", placeholder: "Customer name" },
            { key: "phone", label: "Phone *", placeholder: "0300-1234567" },
            { key: "email", label: "Email", placeholder: "email@example.com" },
            { key: "city", label: "City", placeholder: "Lahore, Karachi..." },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
              <input
                type="text" value={form[key]} placeholder={placeholder}
                onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: "" })); }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${errors[key] ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-400 bg-white"}`}
              />
              {errors[key] && <p className="text-xs text-red-500 mt-1">{errors[key]}</p>}
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
            {customer ? "Update" : "Add Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ customer, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
        </div>
        <h3 className="text-center font-bold text-slate-800 mb-1">Delete Customer?</h3>
        <p className="text-center text-sm text-slate-500 mb-5"><span className="font-bold text-slate-700">{customer.name}</span> will be permanently deleted.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersView({ customers = [], addCustomer, updateCustomer, deleteCustomer, allInvoices = [], onReceivePayment, onCreateInvoice, onReduceStock, onUpdateInvoice, onDeleteInvoice, invoiceSettings = {}, products = [] }) {
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [profileCustomer, setProfileCustomer] = useState(null);
  const [profileCustomerIndex, setProfileCustomerIndex] = useState(0);

  // ── ALL hooks must be called before any conditional return ──
  const cities = useMemo(() => {
    const all = customers.map((c) => c.city).filter(Boolean);
    return [...new Set(all)].sort();
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q);
      const matchCity = !cityFilter || (c.city || "") === cityFilter;
      return matchSearch && matchCity;
    });
  }, [customers, search, cityFilter]);

  const stats = useMemo(() => {
    const totalOutstanding = allInvoices.reduce((s, inv) => {
      const advInPmts = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const standAloneAdv = advInPmts > 0 ? 0 : (inv.advance || 0);
      const paid = advInPmts + otherPmts + standAloneAdv;
      return s + Math.max(0, (inv.total || 0) - paid);
    }, 0);
    // Total Revenue / Total Orders are derived live from actual invoices
    // matched to an ADDED customer — either by customerId (primary) or by
    // name+phone fallback (for older invoices saved without customerId,
    // same logic as CustomerProfileView) — this way deleting or creating
    // an invoice is always reflected immediately and correctly, with no
    // drift possible, and stays consistent with each customer's profile page.
    const customerById = new Map(customers.map((c) => [String(c.id), c]));
    const customerByName = new Map(
      customers.map((c) => [c.name.trim().toLowerCase(), c])
    );
    const customerInvoices = allInvoices.filter((inv) => {
      // primary match: customerId (must belong to a customer that still exists)
      if (inv.customerId && customerById.has(String(inv.customerId))) return true;
      // fallback: name match (older invoices saved without customerId)
      if (!inv.customerId && inv.customerName) {
        const cust = customerByName.get(inv.customerName.trim().toLowerCase());
        if (cust) {
          if (!inv.customerPhone || !cust.phone) return true;
          if (inv.customerPhone.replace(/\D/g, "") === cust.phone.replace(/\D/g, "")) return true;
        }
      }
      return false;
    });
    return {
      total: customers.length,
      totalRevenue: customerInvoices.reduce((s, inv) => s + (inv.total || 0), 0),
      totalOrders: customerInvoices.length,
      totalOutstanding,
    };
  }, [customers, allInvoices]);

  const statsCards = useMemo(() => [
    {
      title: "Total Customers",
      value: stats.total.toString(),
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
      light: "bg-blue-50", text: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      light: "bg-emerald-50", text: "text-emerald-600",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      light: "bg-violet-50", text: "text-violet-600",
    },
  ], [stats]);

  const handleSave = (form) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, form);
      setEditingCustomer(null);
    } else {
      addCustomer(form);
      setShowModal(false);
    }
  };

  const handleDeleteConfirm = () => {
    deleteCustomer(deletingCustomer.id);
    setDeletingCustomer(null);
  };

  // ── Conditional render AFTER all hooks ──
  if (profileCustomer) {
    return (
      <CustomerProfileView
        customer={profileCustomer}
        customerIndex={profileCustomerIndex}
        allInvoices={allInvoices}
        products={products}
        customers={customers}
        onBack={() => setProfileCustomer(null)}
        onReceivePayment={onReceivePayment}
        onCreateInvoice={onCreateInvoice}
        onReduceStock={onReduceStock}
        onUpdateInvoice={onUpdateInvoice}
        onDeleteInvoice={onDeleteInvoice}
        invoiceSettings={invoiceSettings}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/80">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-4 sm:px-6 pt-4 pb-2">
        {statsCards.map((card) => (
          <div key={card.title} className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 hover:shadow-md hover:shadow-slate-100 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div className={`w-9 h-9 rounded-xl ${card.light} flex items-center justify-center flex-shrink-0`}>
                <SVGIcon d={card.icon} size={17} className={card.text} />
              </div>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-800 mb-0.5 truncate">{card.value}</p>
            <p className="text-xs text-slate-400">{card.title}</p>
          </div>
        ))}
      </div>

      <div className="px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-stretch gap-3">
            <div className="flex flex-1 items-center gap-2 bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone or city..."
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
              {search && <button onClick={() => setSearch("")} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>}
            </div>
            <button onClick={() => setShowModal(true)}
              className="hidden sm:flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-colors flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              New Customer
            </button>
          </div>
          {cities.length > 0 && (
            <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
              className="sm:hidden w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none shadow-sm">
              <option value="">All Cities</option>
              {cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          )}
          <button onClick={() => setShowModal(true)}
            className="sm:hidden w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New Customer
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="px-4 sm:px-6 pb-6">
        {customers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No customers yet</h3>
            <p className="text-sm text-slate-400 mb-5">Add your first customer to get started</p>
            <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add Customer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <p className="text-slate-500">No customers match your search.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">City</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Order</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((c, idx) => (
                    <tr
                      key={c.id}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      onClick={() => { setProfileCustomer(c); setProfileCustomerIndex(idx); }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-xs font-bold">{getInitials(c.name)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{c.name}</p>
                            {c.email && <p className="text-xs text-slate-400">{c.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{c.phone}</td>
                      <td className="px-5 py-4">
                        {c.city ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">{c.city}</span>
                        ) : <span className="text-slate-300 text-sm">—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(c.lastOrder)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingCustomer(c); }}
                            title="Edit"
                            className="w-8 h-8 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingCustomer(c); }}
                            title="Delete"
                            className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {filtered.map((c, idx) => (
                <div
                  key={c.id}
                  onClick={() => { setProfileCustomer(c); setProfileCustomerIndex(idx); }}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm cursor-pointer active:bg-blue-50/50 hover:border-blue-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white text-xs font-bold">{getInitials(c.name)}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.city && <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c.city}</span>}
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div>
                      <p className="text-xs text-slate-400">Last Order</p>
                      <p className="text-xs text-slate-600 font-medium">{formatDate(c.lastOrder)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setEditingCustomer(c)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 text-xs font-semibold rounded-xl transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingCustomer(c)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-semibold rounded-xl transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" /></svg>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {(showModal || editingCustomer) && (
        <CustomerModal customer={editingCustomer} onClose={() => { setShowModal(false); setEditingCustomer(null); }} onSave={handleSave} />
      )}
      {deletingCustomer && (
        <DeleteModal customer={deletingCustomer} onConfirm={handleDeleteConfirm} onClose={() => setDeletingCustomer(null)} />
      )}
    </div>
  );
}
