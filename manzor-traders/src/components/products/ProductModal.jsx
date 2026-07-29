import { useState, useEffect } from "react";
import { emptyProductForm } from "../../utils/productHelpers";

export default function ProductModal({ open, onClose, onSave, editingProduct, categories = [] }) {
  const [form, setForm] = useState(emptyProductForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingProduct) {
      setForm({
        name: editingProduct.name,
        category: editingProduct.category,
        salePrice: String(editingProduct.salePrice),
        costPrice: String(editingProduct.costPrice),
        lowStockAlertQty: String(editingProduct.lowStockAlertQty),
        currentStock: String(editingProduct.currentStock),
        ctn: String(editingProduct.ctn || ""),
      });
    } else {
      setForm(emptyProductForm);
    }
    setError("");
  }, [editingProduct, open]);

  if (!open) return null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!form.salePrice || !form.costPrice) {
      setError("Sale price and cost price are required.");
      return;
    }
    onSave(form);
    onClose();
  };

  // Use passed categories; if empty fall back to a sensible default
  const catList = categories.length > 0 ? categories : ["Electronics", "Clothing", "Food & Drinks", "Furniture", "Others"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide shadow-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">{editingProduct ? "Edit Product" : "Add Product"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Product Name *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              placeholder="e.g. iPhone 15 Pro"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Category</label>
            <select
              name="category" value={form.category} onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            >
              {catList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Sale Price *</label>
              <input
                name="salePrice" type="number" min="0" step="0.01" value={form.salePrice} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Cost Price *</label>
              <input
                name="costPrice" type="number" min="0" step="0.01" value={form.costPrice} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Low Stock Alert Qty</label>
              <input
                name="lowStockAlertQty" type="number" min="0" value={form.lowStockAlertQty} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">
                CTN (Carton)
                <span className="ml-1 text-[10px] text-purple-500 font-normal">— ek carton mein kitne pieces</span>
              </label>
              <input
                name="ctn" type="number" min="0" value={form.ctn} onChange={handleChange}
                placeholder="e.g. 12"
                className="w-full border border-purple-200 bg-purple-50 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Current Stock</label>
            <input
              name="currentStock" type="number" min="0" value={form.currentStock} onChange={handleChange}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 shadow-md shadow-blue-200"
            >
              {editingProduct ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
