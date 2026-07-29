import { useState, useMemo } from "react";
import ProductStatsCards from "./ProductStatsCards";
import ProductTable from "./ProductTable";
import ProductModal from "./ProductModal";
import { getStockStatus } from "../../utils/productHelpers";
import StockFilterSelect from "./StockFilterSelect";

function ListViewIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

function GridViewIcon({ active }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export default function ProductsView({
  products, stats,
  addProduct, updateProduct, deleteProduct, stockIn, stockOut,
  categories = [],
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const openAdd = () => { setEditingProduct(null); setModalOpen(true); };
  const openEdit = (product) => { setEditingProduct(product); setModalOpen(true); };

  const handleSave = (form) => {
    if (editingProduct) updateProduct(editingProduct.id, form);
    else addProduct(form);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this product?")) deleteProduct(id);
  };

  const handleStockIn = (product) => stockIn(product.id, 1);
  const handleStockOut = (product) => stockOut(product.id, 1);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !query ||
        (p.name || "").toLowerCase().includes(query) ||
        (p.category || "").toLowerCase().includes(query);
      const status = getStockStatus(p);
      const matchesFilter = stockFilter === "all" || status === stockFilter;
      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, stockFilter]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-5 space-y-5">
      <ProductStatsCards stats={stats} />

      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-slate-800 text-base">Product Inventory</h2>
            <p className="text-xs text-slate-400 mt-0.5">Add, edit, delete & manage stock</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List View"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "list" ? "bg-white shadow-sm shadow-slate-200" : "hover:bg-slate-200/60"
                }`}
              >
                <ListViewIcon active={viewMode === "list"} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid View"
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "grid" ? "bg-white shadow-sm shadow-slate-200" : "hover:bg-slate-200/60"
                }`}
              >
                <GridViewIcon active={viewMode === "grid"} />
              </button>
            </div>

            <button
              onClick={openAdd}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md shadow-blue-200 w-full sm:w-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add Product
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              placeholder="Search products by name or category..."
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 text-xs px-1">Clear</button>
            )}
          </div>
          <StockFilterSelect value={stockFilter} onChange={setStockFilter} />
        </div>

        {/* Product list/grid */}
        {products.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">No products yet. Add your first product.</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-slate-400 py-12 text-sm">No products match your search or filter.</p>
        ) : (
          <ProductTable
            products={filteredProducts}
            onEdit={openEdit}
            onDelete={handleDelete}
            onStockIn={handleStockIn}
            onStockOut={handleStockOut}
            stockIn={stockIn}
            stockOut={stockOut}
            viewMode={viewMode}
          />
        )}
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingProduct={editingProduct}
        categories={categories}
      />
    </div>
  );
}
