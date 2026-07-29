import { formatCurrency } from "../../utils/productHelpers";
import { formatSaleTime } from "../../utils/posHelpers";

export default function POSReceiptModal({ sale, onClose, onNewSale }) {
  if (!sale) return null;

  const hasCtn = (sale.items || []).some(i => i.ctn > 0);

  const profit = (sale.items || []).reduce((s, item) => {
    return s + Math.max(0, ((item.unitPrice || 0) - (item.costPrice || 0)) * (item.qty || 0));
  }, 0);
  const profitPct = sale.total > 0 ? ((profit / sale.total) * 100).toFixed(1) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

        {/* Top success banner */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-6 pt-8 pb-10 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 30% 20%, white 1px, transparent 1px),radial-gradient(circle at 70% 80%, white 1px, transparent 1px)",backgroundSize:"28px 28px"}} />
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{animationDuration:"2s"}} />
            <div className="relative w-16 h-16 rounded-full bg-white/25 border-2 border-white/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sale Complete!</h2>
          <p className="text-emerald-100 text-sm mt-1 font-medium">
            Invoice #{String(sale.invoiceNumber || sale.id).padStart(3,"0")} · {formatSaleTime(sale.createdAt)}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-2xl px-5 py-2.5">
            <span className="text-emerald-100 text-sm font-medium">Total Paid</span>
            <span className="text-white text-xl font-black">{formatCurrency(sale.total)}</span>
          </div>
        </div>

        {/* Ticket tear edge */}
        <div className="flex px-2 -mt-2 relative z-10">
          {Array.from({length:18}).map((_,i) => (
            <div key={i} className="flex-1 h-4 bg-white rounded-full mx-0.5" />
          ))}
        </div>

        {/* Body */}
        <div className="px-6 py-3 max-h-[42vh] overflow-y-auto scrollbar-hide">
          {sale.customerName && (
            <div className="flex items-center gap-2.5 mb-4 p-3 bg-slate-50 rounded-2xl">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 leading-none mb-0.5">Customer</p>
                <p className="text-sm font-bold text-slate-800">{sale.customerName}</p>
              </div>
            </div>
          )}

          {/* Items Table with CTN column */}
          <div className="mb-4">
            <div className="grid text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100 mb-1"
              style={{ gridTemplateColumns: hasCtn ? "1fr 40px 36px 56px" : "1fr 40px 56px" }}>
              <span>Item</span>
              <span className="text-center">Qty</span>
              {hasCtn && <span className="text-center">CTN</span>}
              <span className="text-right">Amount</span>
            </div>
            <div className="space-y-1.5">
              {(sale.items || []).map((item, i) => {
                const itemProfit = Math.max(0, ((item.unitPrice||0)-(item.costPrice||0))*(item.qty||0));
                return (
                  <div key={i} className="grid items-center gap-1 py-1.5 border-b border-slate-50 last:border-0"
                    style={{ gridTemplateColumns: hasCtn ? "1fr 40px 36px 56px" : "1fr 40px 56px" }}>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{formatCurrency(item.unitPrice)} × {item.qty}</p>
                    </div>
                    <span className="text-xs text-center text-slate-600 font-medium">{item.qty}</span>
                    {hasCtn && <span className="text-xs text-center text-purple-600 font-bold">{item.ctn || 0}</span>}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-800">{formatCurrency(item.lineTotal)}</p>
                      {itemProfit > 0 && <p className="text-[10px] text-emerald-600 font-semibold">+{formatCurrency(itemProfit)}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl p-4 space-y-2">
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="text-red-500 font-semibold">-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="text-slate-700 font-semibold">+{formatCurrency(sale.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-base pt-2 border-t border-slate-200">
              <span className="text-slate-800">Grand Total</span>
              <span className="text-blue-600">{formatCurrency(sale.total)}</span>
            </div>
            {profit > 0 && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-500">Net Profit</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(profit)}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">{profitPct}%</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-3 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
            Close
          </button>
          <button type="button" onClick={onNewSale}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-200 hover:opacity-90 transition-all flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
