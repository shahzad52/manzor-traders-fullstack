import ProductIcon from "../common/ProductIcon";
import { formatCurrency, getStockStatus } from "../../utils/productHelpers";
import { getCategoryStyle } from "../../utils/posHelpers";

function StockBadge({ product }) {
  const status = getStockStatus(product);
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    low: "bg-amber-50 text-amber-700 border-amber-200",
    out: "bg-red-50 text-red-700 border-red-200",
  };
  const labels = { ok: "In Stock", low: "Low Stock", out: "Out of Stock" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

import { useState as useStockState } from "react";

function StockControls({ product, onStockIn, onStockOut, stockIn, stockOut }) {
  const [editing, setEditing] = useStockState(false);
  const [inputVal, setInputVal] = useStockState("");
  const canDecrease = product.currentStock > 0;

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") applyInput();
    if (e.key === "Escape") { setEditing(false); setInputVal(""); }
  };

  const applyInput = () => {
    const val = parseInt(inputVal, 10);
    if (!isNaN(val) && val >= 0) {
      const diff = val - product.currentStock;
      if (diff > 0) stockIn(product.id, diff);
      else if (diff < 0) stockOut(product.id, Math.abs(diff));
    }
    setEditing(false);
    setInputVal("");
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onStockOut(product)}
        disabled={!canDecrease}
        title="Decrease stock by 1"
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>

      {editing ? (
        <input
          type="number"
          min="0"
          autoFocus
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onBlur={applyInput}
          className="w-14 text-center text-sm font-bold text-slate-800 border border-blue-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 py-0.5 bg-white"
          title="Type a number and press Enter"
        />
      ) : (
        <span
          onClick={() => { setEditing(true); setInputVal(String(product.currentStock)); }}
          title="Click to type a stock value"
          className="min-w-[2rem] text-center font-bold text-slate-800 text-sm cursor-pointer hover:bg-blue-50 hover:text-blue-700 rounded-lg px-1.5 py-0.5 transition-colors"
        >
          {product.currentStock}
        </span>
      )}

      <button
        type="button"
        onClick={() => onStockIn(product)}
        title="Increase stock by 1"
        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/* ───────────── GRID CARD ───────────── */
function ProductGridCard({ p, onEdit, onDelete, onStockIn, onStockOut, stockIn, stockOut }) {
  const catStyle = getCategoryStyle(p.category);
  const status = getStockStatus(p);
  const stockColors = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    low: "bg-amber-50 text-amber-700 border-amber-200",
    out: "bg-red-50 text-red-700 border-red-200",
  };
  const stockLabels = { ok: "In Stock", low: "Low Stock", out: "Out of Stock" };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md hover:shadow-slate-200/60 hover:border-slate-200 transition-all">
      {/* Top row: icon + name + status */}
      <div className="flex items-start gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <ProductIcon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{p.name}</p>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 ${catStyle.bg} ${catStyle.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
            {p.category}
          </span>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${stockColors[status]}`}>
          {stockLabels[status]}
        </span>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400 font-medium">Sale Price</p>
          <p className="text-sm font-black text-blue-600 mt-0.5">{formatCurrency(p.salePrice)}</p>
        </div>
        <div className="bg-slate-50 rounded-xl px-3 py-2">
          <p className="text-[10px] text-slate-400 font-medium">Cost Price</p>
          <p className="text-sm font-black text-slate-700 mt-0.5">{formatCurrency(p.costPrice)}</p>
        </div>
      </div>

      {/* Stock controls */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2">
        <div>
          <p className="text-[10px] text-slate-400 font-medium">Stock</p>
          <p className="text-xs text-slate-500 mt-0.5">Alert: {p.lowStockAlertQty}</p>
        </div>
        <StockControls product={p} onStockIn={onStockIn} onStockOut={onStockOut} stockIn={stockIn} stockOut={stockOut} />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-0.5">
        <button
          onClick={() => onEdit(p)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors"
        >
          <EditIcon /> Edit
        </button>
        <button
          onClick={() => onDelete(p.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-xl transition-colors"
        >
          <DeleteIcon /> Delete
        </button>
      </div>
    </div>
  );
}

/* ───────────── MAIN EXPORT ───────────── */
export default function ProductTable({ products, onEdit, onDelete, onStockIn, onStockOut, stockIn, stockOut, viewMode = "list" }) {

  /* ── GRID VIEW ── */
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductGridCard
            key={p.id}
            p={p}
            onEdit={onEdit}
            onDelete={onDelete}
            onStockIn={onStockIn}
            onStockOut={onStockOut}
            stockIn={stockIn}
            stockOut={stockOut}
          />
        ))}
      </div>
    );
  }

  /* ── LIST VIEW (default) ── */
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-3 pr-4 font-medium">Product</th>
              <th className="pb-3 pr-4 font-medium">Category</th>
              <th className="pb-3 pr-4 font-medium">Sale</th>
              <th className="pb-3 pr-4 font-medium">Cost</th>
              <th className="pb-3 pr-4 font-medium">Stock</th>
              <th className="pb-3 pr-4 font-medium">Alert Qty</th>
              <th className="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2.5">
                    <ProductIcon size={16} />
                    <span className="font-semibold text-slate-700">{p.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {(() => {
                    const catStyle = getCategoryStyle(p.category);
                    return (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                        {p.category}
                      </span>
                    );
                  })()}
                </td>
                <td className="py-3 pr-4 font-medium">{formatCurrency(p.salePrice)}</td>
                <td className="py-3 pr-4 text-slate-600">{formatCurrency(p.costPrice)}</td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <StockControls product={p} onStockIn={onStockIn} onStockOut={onStockOut} stockIn={stockIn} stockOut={stockOut} />
                    <StockBadge product={p} />
                  </div>
                </td>
                <td className="py-3 pr-4 text-slate-500">{p.lowStockAlertQty}</td>
                <td className="py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(p)}
                      title="Edit product"
                      className="w-8 h-8 flex items-center justify-center text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <EditIcon />
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      title="Delete product"
                      className="w-8 h-8 flex items-center justify-center text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <DeleteIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {products.map((p) => (
          <div key={p.id} className="border border-slate-100 rounded-2xl p-4 bg-white">
            <div className="flex items-start gap-3 mb-3">
              <ProductIcon size={18} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate">{p.name}</p>
                {(() => {
                  const catStyle = getCategoryStyle(p.category);
                  return (
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-0.5 ${catStyle.bg} ${catStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
                      {p.category}
                    </span>
                  );
                })()}
              </div>
              <StockBadge product={p} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div><span className="text-slate-400">Sale:</span> <span className="font-semibold">{formatCurrency(p.salePrice)}</span></div>
              <div><span className="text-slate-400">Cost:</span> <span className="font-semibold">{formatCurrency(p.costPrice)}</span></div>
              <div className="col-span-2"><span className="text-slate-400">Alert at:</span> {p.lowStockAlertQty} units</div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400">Stock</span>
              <StockControls product={p} onStockIn={onStockIn} onStockOut={onStockOut} stockIn={stockIn} stockOut={stockOut} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => onEdit(p)} title="Edit product" className="w-9 h-9 flex items-center justify-center text-blue-700 bg-blue-50 rounded-xl hover:bg-blue-100">
                <EditIcon />
              </button>
              <button onClick={() => onDelete(p.id)} title="Delete product" className="w-9 h-9 flex items-center justify-center text-red-700 bg-red-50 rounded-xl hover:bg-red-100">
                <DeleteIcon />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
