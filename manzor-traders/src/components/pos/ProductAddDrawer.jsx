import { useState, useEffect } from "react";
import { formatCurrency, getStockStatus } from "../../utils/productHelpers";
import { getCategoryStyle } from "../../utils/posHelpers";
import ProductIcon from "../common/ProductIcon";

export default function ProductAddDrawer({ product, existingQty, onAdd, onClose }) {
  const [qty, setQty] = useState(existingQty > 0 ? existingQty : 1);

  useEffect(() => {
    setQty(existingQty > 0 ? existingQty : 1);
  }, [product?.id, existingQty]);

  if (!product) return null;

  const status = getStockStatus(product);
  const catStyle = getCategoryStyle(product.category);
  const maxQty = product.currentStock;

  const handleAdd = () => {
    if (qty < 1 || qty > maxQty) return;
    onAdd(product, qty);
    onClose();
  };

  const statusStyles = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    low: "bg-amber-50 text-amber-700 border-amber-200",
    out: "bg-red-50 text-red-700 border-red-200",
  };
  const statusLabels = { ok: "In Stock", low: "Low Stock", out: "Out of Stock" };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="px-5 pb-6 pt-2">
          {/* Product Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-100">
              <ProductIcon size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-slate-800 text-lg leading-tight">{product.name}</h3>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full mt-1 ${catStyle.bg} ${catStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                {product.category}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-2xl font-black text-blue-600">{formatCurrency(product.salePrice)}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusStyles[status]}`}>
                  {statusLabels[status]}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {status !== "out" ? `${product.currentStock} units available` : "Yeh product available nahi hai"}
              </p>
            </div>
          </div>

          {status === "out" ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center mb-4">
              <p className="text-red-600 font-semibold text-sm">Yeh product out of stock hai</p>
            </div>
          ) : (
            <>
              {/* Qty Selector */}
              <div className="mb-5">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quantity</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                  <div className="flex-1 text-center">
                    <input
                      type="number"
                      min={1}
                      max={maxQty}
                      value={qty}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= 1 && v <= maxQty) setQty(v);
                      }}
                      className="w-20 text-center text-2xl font-black text-slate-800 bg-transparent outline-none border-b-2 border-blue-300 focus:border-blue-600 pb-1"
                    />
                    <p className="text-xs text-slate-400 mt-1">Max: {maxQty}</p>
                  </div>
                  <button
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Line Total */}
              <div className="bg-blue-50 rounded-2xl p-3 flex items-center justify-between mb-5 border border-blue-100">
                <span className="text-sm font-medium text-blue-700">{qty} × {formatCurrency(product.salePrice)}</span>
                <span className="text-lg font-black text-blue-700">{formatCurrency(qty * product.salePrice)}</span>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Wapas Jayen
            </button>
            {status !== "out" && (
              <button
                onClick={handleAdd}
                className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  <line x1="12" y1="5" x2="12" y2="17" />
                  <line x1="6" y1="11" x2="18" y2="11" />
                </svg>
                Cart Mein Add Karein
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
