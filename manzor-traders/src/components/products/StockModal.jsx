import { useState } from "react";
import ProductIcon from "../common/ProductIcon";

export default function StockModal({ open, onClose, product, type, onConfirm }) {
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");

  if (!open || !product) return null;

  const isIn = type === "in";
  const title = isIn ? "Stock In" : "Stock Out";

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = Number(qty);
    if (!amount || amount <= 0) {
      setError("Enter a valid quantity.");
      return;
    }
    if (!isIn && product.currentStock < amount) {
      setError(`Only ${product.currentStock} units available.`);
      return;
    }
    const ok = onConfirm(product.id, amount);
    if (ok) {
      setQty("");
      setError("");
      onClose();
    }
  };

  const handleClose = () => {
    setQty("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800">{title}</h2>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <ProductIcon size={20} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{product.name}</p>
              <p className="text-xs text-slate-400">Current stock: {product.currentStock} units</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Quantity</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              placeholder="Enter quantity"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium shadow-md ${
                isIn ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200" : "bg-amber-600 hover:bg-amber-700 shadow-amber-200"
              }`}
            >
              Confirm {title}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
