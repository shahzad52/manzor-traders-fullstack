import { useMemo } from "react";
import StatsGrid from "../common/StatsGrid";
import RevenueChart from "./RevenueChart";
import CategoryPieChart from "./CategoryPieChart";
import TopProductsList from "./TopProductsList";
import { formatCurrency } from "../../utils/productHelpers";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DashboardView({ products = [], allInvoices = [], customers = [] }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  /* ── Stats Cards ── */
  const statsCards = useMemo(() => {
    const totalRevenue = allInvoices.reduce((s, i) => s + (i.total || 0), 0);

    const thisMonthRevenue = allInvoices
      .filter(i => { const d = new Date(i.createdAt); return d.getFullYear() === currentYear && d.getMonth() === currentMonth; })
      .reduce((s, i) => s + (i.total || 0), 0);

    const lastMonthRevenue = allInvoices
      .filter(i => {
        const d = new Date(i.createdAt);
        const lm = currentMonth === 0 ? 11 : currentMonth - 1;
        const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
        return d.getFullYear() === ly && d.getMonth() === lm;
      })
      .reduce((s, i) => s + (i.total || 0), 0);

    // ✅ FIX: Profit helper - Same logic as Reports
    const calcProfit = (inv) => {
      // Purana udhaar (bina product ke manually add kiya gaya) revenue mein count hota hai
      // lekin profit mein nahi — kyunki iska koi cost/item nahi hota.
      if (inv.isOldUdaar) return 0;
      // First try stored grossProfit
      if (inv.grossProfit !== undefined && inv.grossProfit !== null && inv.grossProfit > 0) {
        return inv.grossProfit;
      }
      
      // Fallback: calculate from items
      const cost = (inv.items || []).reduce((s, item) => {
        let cp = item.costPrice;
        if ((cp === undefined || cp === null || cp === 0) && products.length > 0) {
          const prod = products.find(p => String(p.id) === String(item.productId) || p.name === item.name);
          if (prod) cp = prod.costPrice || prod.stockPrice || 0;
        }
        return s + ((cp || 0) * (item.qty || 0));
      }, 0);
      
      // Apply discount factor (same as Reports)
      const subtotal = inv.subtotal || inv.total || 0;
      const total = inv.total || 0;
      const discountFactor = subtotal > 0 ? (total / subtotal) : 1;
      const adjustedCost = cost * Math.min(discountFactor, 1);
      return Math.max(0, total - adjustedCost);
    };

    const thisMonthInvoices = allInvoices.filter(i => {
      const d = new Date(i.createdAt);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const thisMonthProfit = thisMonthInvoices.reduce((s, i) => s + calcProfit(i), 0);

    const lastMonthInvoices = allInvoices.filter(i => {
      const d = new Date(i.createdAt);
      const lm = currentMonth === 0 ? 11 : currentMonth - 1;
      const ly = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getFullYear() === ly && d.getMonth() === lm;
    });
    const lastMonthProfit = lastMonthInvoices.reduce((s, i) => s + calcProfit(i), 0);

    const revenueChangePct = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : null;

    const todayStr = now.toDateString();
    const todayInvoices = allInvoices.filter(i => new Date(i.createdAt).toDateString() === todayStr);

    const udaarInvoices = allInvoices.filter(inv => inv.paymentStatus === "udaar" || inv.paymentStatus === "partial");
    const totalUdaar = udaarInvoices.reduce((s, inv) => {
      const advInPayments = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const standAloneAdv = advInPayments > 0 ? 0 : (inv.advance || 0);
      const paid = advInPayments + otherPmts + standAloneAdv;
      return s + Math.max(0, (inv.total || 0) - paid);
    }, 0);
    // Udaar Receive = total payments received against udaar/partial invoices only (not cash sales)
    const totalUdaarReceived = allInvoices
      .filter(inv => inv.paymentStatus === "paid" || inv.paymentStatus === "partial" || inv.paymentStatus === "udaar")
      .reduce((s, inv) => {
        // Only count payments that are NOT "Advance at sale" — those are real post-sale udaar collections
        const extraPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
        return s + extraPmts;
      }, 0);

    return [
      {
        title: "Total Revenue",
        value: formatCurrency(totalRevenue),
        change: revenueChangePct !== null ? `${revenueChangePct > 0 ? "+" : ""}${revenueChangePct}%` : null,
        up: revenueChangePct >= 0,
        icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
        light: "bg-blue-50", text: "text-blue-600",
      },
      {
        title: "This Month Profit",
        value: formatCurrency(thisMonthProfit),
        change: lastMonthProfit > 0
          ? `${thisMonthProfit >= lastMonthProfit ? "+" : ""}${(((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100).toFixed(1)}%`
          : null,
        up: thisMonthProfit >= lastMonthProfit,
        icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
        light: "bg-emerald-50", text: "text-emerald-600",
      },
      {
        title: "Total Udaar Receive",
        value: formatCurrency(totalUdaarReceived),
        change: null, up: true,
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
        light: "bg-violet-50", text: "text-violet-600",
      },
      {
        title: "Total Udaar",
        value: formatCurrency(totalUdaar),
        change: udaarInvoices.length > 0 ? `${udaarInvoices.length} pending` : null,
        up: false,
        icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
        light: "bg-red-50", text: "text-red-600",
      },
    ];
  }, [allInvoices, products, currentYear, currentMonth]);

  /* ── Profit Calculation Function (Same as Reports) ── */
  const calcProfit = (inv, products = []) => {
    // Purana udhaar entries revenue mein aate hain lekin profit mein nahi.
    if (inv.isOldUdaar) return 0;
    // ✅ FIX: Use same logic as Reports for consistency
    // First try stored grossProfit
    if (inv.grossProfit !== undefined && inv.grossProfit !== null && inv.grossProfit > 0) {
      return inv.grossProfit;
    }
    
    // Fallback: calculate from items (same as Reports)
    const cost = (inv.items || []).reduce((s, item) => {
      let cp = item.costPrice;
      if ((cp === undefined || cp === null || cp === 0) && products.length > 0) {
        const prod = products.find(p => String(p.id) === String(item.productId) || p.name === item.name);
        if (prod) cp = prod.costPrice || prod.stockPrice || 0;
      }
      return s + ((cp || 0) * (item.qty || 0));
    }, 0);
    
    // Apply discount factor (same as Reports)
    const subtotal = inv.subtotal || inv.total || 0;
    const total = inv.total || 0;
    const discountFactor = subtotal > 0 ? (total / subtotal) : 1;
    const adjustedCost = cost * Math.min(discountFactor, 1);
    return Math.max(0, total - adjustedCost);
  };

  /* ── Monthly Revenue Data (current year) ── */
  const monthlyData = useMemo(() => {
    const data = MONTHS.map(m => ({ month: m, revenue: 0, profit: 0, expenses: 0, count: 0 }));
    allInvoices.forEach(inv => {
      const d = new Date(inv.createdAt);
      if (d.getFullYear() === currentYear) {
        const idx = d.getMonth();
        data[idx].revenue += inv.total || 0;
        data[idx].count += 1;
        // ✅ FIX: Use same calcProfit function as Reports
        const invProfit = calcProfit(inv, products);
        data[idx].profit += invProfit;
        data[idx].expenses += invProfit; // backward compat for ExpensesBarChart
      }
    });
    return data;
  }, [allInvoices, products, currentYear]);

  /* ── Category Pie Data (from real products) ── */
  const categoryData = useMemo(() => {
    const catMap = {};
    products.forEach(p => { catMap[p.category] = (catMap[p.category] || 0) + 1; });
    const total = products.length || 1;
    const colors = ["#1D6FDB","#38BDF8","#0EA5E9","#7DD3FC","#BAE6FD","#34d399","#f59e0b","#a78bfa"];
    return Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        color: colors[i % colors.length],
      }));
  }, [products]);

  /* ── Top Products (from invoice items) ── */
  const topProducts = useMemo(() => {
    const map = {};
    allInvoices.forEach(inv => {
      (inv.items || []).forEach(item => {
        const key = item.name;
        if (!map[key]) {
          const prod = products.find(p => p.id === item.productId || p.name === item.name);
          map[key] = { name: item.name, category: prod?.category || "—", stock: prod?.currentStock ?? 0, sold: 0, revenue: 0 };
        }
        map[key].sold += item.qty || 0;
        map[key].revenue += item.lineTotal || 0;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [allInvoices, products]);


  /* ── Outstanding Balance Summary ── */
  const outstandingSummary = useMemo(() => {
    // For each invoice, compute how much is due
    const totalReceivable = allInvoices.reduce((s, inv) => {
      const advInPayments = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const standAloneAdv = advInPayments > 0 ? 0 : (inv.advance || 0);
      const paid = advInPayments + otherPmts + standAloneAdv;
      const due = Math.max(0, (inv.total || 0) - paid);
      return s + due;
    }, 0);
    const customersWithDue = new Set(
      allInvoices
        .filter((inv) => {
          const advInPayments = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
          const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
          const standAloneAdv = advInPayments > 0 ? 0 : (inv.advance || 0);
          const paid = advInPayments + otherPmts + standAloneAdv;
          return inv.customerId && Math.max(0, (inv.total || 0) - paid) > 0;
        })
        .map((inv) => inv.customerId)
    ).size;
    // Recent payments (last 5)
    const recentPayments = allInvoices
      .flatMap((inv) => (inv.payments || []).map((p) => ({ ...p, invoiceNumber: inv.invoiceNumber, customerName: inv.customerName })))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
    // Top customers by due
    const customerDue = {};
    allInvoices.forEach((inv) => {
      if (!inv.customerId) return;
      const advInPayments = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((ps, p) => ps + (p.amount || 0), 0);
      const standAloneAdv = advInPayments > 0 ? 0 : (inv.advance || 0);
      const paid = advInPayments + otherPmts + standAloneAdv;
      const due = Math.max(0, (inv.total || 0) - paid);
      if (!customerDue[inv.customerId]) customerDue[inv.customerId] = { id: inv.customerId, name: inv.customerName || "Unknown", due: 0 };
      customerDue[inv.customerId].due += due;
    });
    const topDebtors = Object.values(customerDue).sort((a, b) => b.due - a.due).slice(0, 4);
    return { totalReceivable, customersWithDue, recentPayments, topDebtors };
  }, [allInvoices]);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-5 space-y-5">
      <StatsGrid cards={statsCards} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <RevenueChart data={monthlyData} year={currentYear} />
        <CategoryPieChart data={categoryData} />
      </div>


      <div className="pb-2">
        <TopProductsList data={topProducts} />
      </div>

      {/* Outstanding Balance Summary */}
      {outstandingSummary.totalReceivable > 0 && (
        <div className="pb-6">
          <h2 className="text-sm font-black text-slate-700 mb-3">Outstanding Balance Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Receivable</p>
                  <p className="text-xl font-black text-red-600">{formatCurrency(outstandingSummary.totalReceivable)}</p>
                </div>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Customers with Due Balance</p>
                  <p className="text-xl font-black text-amber-700">{outstandingSummary.customersWithDue}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Top Debtors */}
            {outstandingSummary.topDebtors.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3">Top Customers by Due Amount</h3>
                <div className="space-y-2">
                  {outstandingSummary.topDebtors.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                        <span className="text-sm font-semibold text-slate-700 truncate max-w-[140px]">{d.name}</span>
                      </div>
                      <span className="font-black text-red-600">{formatCurrency(d.due)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Payments */}
            {outstandingSummary.recentPayments.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-wider mb-3">Recently Received Payments</h3>
                <div className="space-y-2">
                  {outstandingSummary.recentPayments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{p.customerName || "Walk-in"}</p>
                        <p className="text-[10px] text-slate-400">Inv #{String(p.invoiceNumber || "").padStart(3, "0")} · {p.date ? new Date(p.date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" }) : ""}</p>
                      </div>
                      <span className="font-black text-emerald-600">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
