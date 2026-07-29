import ProductIcon from "../common/ProductIcon";
import { formatCurrency } from "../../utils/productHelpers";

export default function TopProductsList({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-slate-800 text-base">Top Products</h2>
          <p className="text-xs text-slate-400 mt-0.5">By total revenue (all time)</p>
        </div>
      </div>
      {data.length > 0 ? (
        <div className="space-y-3">
          {data.map((p, i) => (
            <div key={p.name + i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
              <ProductIcon size={18} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{p.name}</p>
                <p className="text-xs text-slate-400">{p.category} · {p.stock} in stock</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-800">{formatCurrency(p.revenue)}</p>
                <p className="text-xs font-medium text-emerald-500">▲ {p.sold} sold</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-10 flex flex-col items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-2 opacity-40">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
          </svg>
          <p className="text-sm">Abhi koi sale nahi — POS se sale karein</p>
        </div>
      )}
    </div>
  );
}
