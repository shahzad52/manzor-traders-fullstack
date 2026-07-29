import { useState, useMemo } from "react";
import ProductIcon from "../common/ProductIcon";
import { formatCurrency, getStockStatus } from "../../utils/productHelpers";
import { getCategoryStyle } from "../../utils/posHelpers";
import POSStatsCards from "./POSStatsCards";
import POSReceiptModal from "./POSReceiptModal";
import POSCheckoutModal from "./POSCheckoutModal";

function StockPill({ product }) {
  const status = getStockStatus(product);
  const styles = { ok: "bg-emerald-50 text-emerald-700", low: "bg-amber-50 text-amber-700", out: "bg-red-50 text-red-700" };
  const labels = { ok: "In Stock", low: "Low", out: "Out" };
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${styles[status]}`}>{labels[status]}</span>;
}

export default function POSView({ products, posStats, completeSale, recordSale, customers = [], categories: externalCategories = [], invoices = [] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const categories = useMemo(() => {
    const cats = externalCategories.length > 0 ? [...externalCategories].sort() : [...new Set(products.map((p) => p.category))].sort();
    return ["all", ...cats];
  }, [products, externalCategories]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q);
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, categoryFilter]);

  const cartItems = useMemo(() => {
    return cart.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) return null;
      return { ...item, product, lineTotal: product.salePrice * item.qty, ctn: item.ctn !== undefined ? item.ctn : (product.ctn || 0) };
    }).filter(Boolean);
  }, [cart, products]);

  const total = cartItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const getCartQty = (productId) => cart.find((c) => c.productId === productId)?.qty ?? 0;

  const handleProductClick = (product) => {
    if (product.currentStock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id);
      if (existing) {
        if (existing.qty >= product.currentStock) return prev;
        return prev.map((c) => c.productId === product.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { productId: product.id, qty: 1, ctn: 0 }];
    });
  };

  const clearCart = () => setCart([]);

  const syncCartWithStock = () => {
    setCart((prev) => prev.map((c) => {
      const p = products.find((x) => x.id === c.productId);
      if (!p || p.currentStock <= 0) return null;
      return { ...c, qty: Math.min(c.qty, p.currentStock) };
    }).filter(Boolean));
  };

  const handleCheckoutConfirm = async (checkoutData) => {
    const {
      localCart, customerName, customerPhone, customerAddress, customerId,
      subtotal, discount, tax, discountPercent, taxPercent, total: finalTotal,
      paymentMode, advance, paymentStatus, createdAt,
      showPreviousUdaarOnInvoice, previousUdaar,
    } = checkoutData;
    setCheckoutLoading(true);
    try {
      const items = localCart.map((item) => ({ productId: String(item.product.id), qty: item.qty }));
      const { success } = await completeSale(items);
      if (!success) {
        syncCartWithStock();
        setShowCheckout(false);
        setCheckoutLoading(false);
        return;
      }
      const sale = await recordSale({
        customerName, customerPhone, customerAddress, customerId: customerId || null,
        subtotal, discount, tax, discountPercent, taxPercent, total: finalTotal,
        paymentMode: paymentMode || "paid",
        advance: paymentMode === "udaar" ? (advance || 0) : finalTotal,
        paymentStatus: paymentStatus || "paid",
        createdAt,
        showPreviousUdaarOnInvoice: showPreviousUdaarOnInvoice || false,
        previousUdaar: previousUdaar || 0,
        items: localCart.map((item) => ({
          productId: String(item.product.id), name: item.product.name,
          qty: item.qty,
          ctn: item.ctn !== undefined ? item.ctn : (item.product.ctn || 0),
          unitPrice: item.product.salePrice,
          salePrice: item.product.salePrice,
          costPrice: item.product.costPrice || item.product.stockPrice || 0,
          lineTotal: item.product.salePrice * item.qty,
          lineCost: (item.product.costPrice || item.product.stockPrice || 0) * item.qty,
        })),
      });
      setLastSale(sale);
      clearCart();
      setShowCheckout(false);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/80">
      <POSStatsCards posStats={posStats} cartTotal={total} />

      {/* Search + Filter */}
      <div className="px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-2.5">
          {/* Search + category: side by side on desktop, stacked on mobile */}
          <div className="flex items-center gap-3">
            {/* Search bar */}
            <div className="flex flex-1 items-center bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mr-2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                placeholder="Search products..." />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="text-xs text-slate-400 hover:text-slate-600 ml-2">Clear</button>}
            </div>
            {/* Category select — desktop only */}
            <div className="hidden sm:block relative flex-shrink-0">
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5 pr-8 text-sm text-slate-700 outline-none cursor-pointer min-w-[140px]">
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
                ))}
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
          {/* Category select — mobile only, full width below search */}
          <div className="sm:hidden relative">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5 pr-8 text-sm text-slate-700 outline-none cursor-pointer">
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === "all" ? "All Categories" : cat}</option>
              ))}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 sm:px-6 pb-32">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <p className="text-slate-500">No products found. Add products from the Products page.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <p className="text-slate-500">No products match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredProducts.map((product) => {
              const outOfStock = product.currentStock <= 0;
              const inCart = getCartQty(product.id);
              const catStyle = getCategoryStyle(product.category);

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleProductClick(product)}
                  disabled={outOfStock}
                  className={`bg-white rounded-xl border text-left w-full flex flex-col relative transition-all
                    ${outOfStock
                      ? "border-slate-100 opacity-40 cursor-not-allowed"
                      : inCart > 0
                        ? "border-2 border-blue-500 shadow-md shadow-blue-100 active:scale-[0.97]"
                        : "border-slate-100 hover:border-blue-300 hover:shadow-md hover:shadow-blue-100/40 active:scale-[0.97] cursor-pointer"
                    }`}
                >
                  {/* Cart qty badge */}
                  {inCart > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[22px] h-6 px-1.5 bg-blue-600 text-white text-xs font-black rounded-full flex items-center justify-center shadow-md shadow-blue-200 z-10">
                      {inCart}
                    </span>
                  )}

                  <div className="p-3 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <ProductIcon size={14} />
                      <StockPill product={product} />
                    </div>
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm leading-tight line-clamp-2 flex-1 mb-1.5">
                      {product.name}
                    </p>
                    <span className={`inline-flex self-start items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-2 ${catStyle.bg} ${catStyle.text}`}>
                      <span className={`w-1 h-1 rounded-full ${catStyle.dot}`} />
                      {product.category}
                    </span>
                    <div className="mt-auto pt-1 border-t border-slate-50">
                      <p className="text-base font-bold text-blue-600">{formatCurrency(product.salePrice)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {outOfStock ? "Out of stock" : `${product.currentStock} available`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartItems.length > 0 && !showCheckout && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 sm:px-6 pb-4 pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-300/60 border border-slate-200 pointer-events-auto overflow-hidden">
            <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
              {cartItems.map((item) => (
                <span key={item.productId} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <span className="w-4 h-4 bg-blue-600 text-white text-[9px] font-black rounded-full flex items-center justify-center">{item.qty}</span>
                  {item.product.name.length > 15 ? item.product.name.slice(0, 15) + "…" : item.product.name}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <button onClick={clearCart}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
                Clear
              </button>
              <div className="flex-1 text-center">
                <p className="text-xs text-slate-400">{totalItems} items</p>
                <p className="text-lg font-black text-slate-800">{formatCurrency(total)}</p>
              </div>
              <button onClick={() => setShowCheckout(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-[0.98]">
                Next
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <POSCheckoutModal checkoutLoading={checkoutLoading}
          cartItems={cartItems}
          products={products}
          customers={customers}
          allInvoices={invoices}
          onConfirm={handleCheckoutConfirm}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* Receipt Modal */}
      <POSReceiptModal sale={lastSale} onClose={() => setLastSale(null)} onNewSale={() => setLastSale(null)} />
    </div>
  );
}
