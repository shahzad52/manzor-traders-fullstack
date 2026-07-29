import { useState, useMemo } from "react";
import { formatCurrency } from "../../utils/productHelpers";
import InvoicePrintModal from "../invoices/InvoicePrintModal";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#1D6FDB", "#38BDF8", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#EC4899"];

function StatCard({ label, value, sub, color = "blue", icon }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon.split(" M").map((part, i) => <path key={i} d={i === 0 ? part : "M" + part} />)}
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-black text-slate-800 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const PERIOD_OPTIONS = [
  { key: "day", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
];

function getRange(period) {
  const now = new Date();
  const start = new Date();
  if (period === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}

function calcProfit(inv, products = []) {
  // Purana udhaar (bina product ke manually add kiya gaya) revenue mein count hota hai
  // lekin profit mein nahi — kyunki iska koi cost/item nahi hota.
  if (inv.isOldUdaar) return 0;
  // Pehle stored grossProfit use karo (invoice save hone par calculate hota hai)
  if (inv.grossProfit !== undefined && inv.grossProfit !== null && inv.grossProfit > 0) {
    return inv.grossProfit;
  }
  // Fallback: items se calculate karo
  const cost = (inv.items || []).reduce((s, item) => {
    let cp = item.costPrice;
    if ((cp === undefined || cp === null || cp === 0) && products.length > 0) {
      const prod = products.find(p => String(p.id) === String(item.productId) || p.name === item.name);
      if (prod) cp = prod.costPrice || prod.stockPrice || 0;
    }
    return s + ((cp || 0) * (item.qty || 0));
  }, 0);
  // Discount factor apply karo agar discount tha
  const subtotal = inv.subtotal || inv.total || 0;
  const total = inv.total || 0;
  const discountFactor = subtotal > 0 ? (total / subtotal) : 1;
  const adjustedCost = cost * Math.min(discountFactor, 1);
  return Math.max(0, total - adjustedCost);
}

function groupBy(invoices, period, products = []) {
  if (period === "day") {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      label: `${h}:00`,
      revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0,
    }));
    invoices.forEach((inv) => {
      const h = new Date(inv.createdAt).getHours();
      hours[h].revenue += inv.total || 0;
      hours[h].sales += 1;
      hours[h].profit += calcProfit(inv, products);
      if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
        const advInPmts = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
        const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
        const standAloneAdv = advInPmts > 0 ? 0 : (inv.advance || 0);
        const paid = advInPmts + otherPmts + standAloneAdv;
        hours[h].udaar += Math.max(0, (inv.total || 0) - paid);
        // Receive Udaar = only post-sale payments (not advance-at-sale), only for udaar/partial invoices
        hours[h].udaarReceive += otherPmts;
      }
    });
    return hours.filter((_, i) => i <= new Date().getHours());
  } else if (period === "week") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = days.map((d) => ({ label: d, revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0 }));
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt).getDay();
      data[d].revenue += inv.total || 0;
      data[d].sales += 1;
      data[d].profit += calcProfit(inv, products);
      if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
        const advInPmts = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
        const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
        const standAloneAdv = advInPmts > 0 ? 0 : (inv.advance || 0);
        const paid = advInPmts + otherPmts + standAloneAdv;
        data[d].udaar += Math.max(0, (inv.total || 0) - paid);
        data[d].udaarReceive += otherPmts;
      }
    });
    return data;
  } else if (period === "month") {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      label: `${i + 1}`,
      revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0,
    }));
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt).getDate() - 1;
      if (data[d]) {
        data[d].revenue += inv.total || 0;
        data[d].sales += 1;
        data[d].profit += calcProfit(inv, products);
        if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
          const advInPmts = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
          const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
          const standAloneAdv = advInPmts > 0 ? 0 : (inv.advance || 0);
          const paid = advInPmts + otherPmts + standAloneAdv;
          data[d].udaar += Math.max(0, (inv.total || 0) - paid);
          data[d].udaarReceive += otherPmts;
        }
      }
    });
    return data;
  } else {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map((m) => ({ label: m, revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0 }));
    invoices.forEach((inv) => {
      const m = new Date(inv.createdAt).getMonth();
      data[m].revenue += inv.total || 0;
      data[m].sales += 1;
      data[m].profit += calcProfit(inv, products);
      if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
        const advInPmts = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
        const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
        const standAloneAdv = advInPmts > 0 ? 0 : (inv.advance || 0);
        const paid = advInPmts + otherPmts + standAloneAdv;
        data[m].udaar += Math.max(0, (inv.total || 0) - paid);
        data[m].udaarReceive += otherPmts;
      }
    });
    return data;
  }
}

export default function ReportsView({ invoices, products, invoiceSettings = {} }) {
  const [period, setPeriod] = useState("month");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const { start, end } = useMemo(() => getRange(period), [period]);

  const filtered = useMemo(() =>
    invoices.filter((inv) => {
      const d = new Date(inv.createdAt);
      return d >= start && d <= end;
    }), [invoices, start, end]);

  const chartData = useMemo(() => groupBy(filtered, period, products), [filtered, period, products]);

  // Summary stats
  const totalRevenue = filtered.reduce((s, inv) => s + (inv.total || 0), 0);
  const totalSales = filtered.length;
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const posSales = filtered.filter((i) => i.source !== "manual").length;
  const manualSales = filtered.filter((i) => i.source === "manual").length;
  const estimatedProfit = filtered.reduce((s, inv) => s + calcProfit(inv, products), 0);
  const profitMarginPct = totalRevenue > 0 ? ((estimatedProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Top products
  const topProducts = useMemo(() => {
    const map = {};
    filtered.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const key = item.name || "Unknown";
        if (!map[key]) map[key] = { name: key, qty: 0, revenue: 0 };
        map[key].qty += item.qty || 0;
        map[key].revenue += item.lineTotal || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filtered]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = {};
    filtered.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        const cat = product?.category || "Other";
        if (!map[cat]) map[cat] = { name: cat, value: 0 };
        map[cat].value += item.lineTotal || 0;
      });
    });
    return Object.values(map).sort((a, b) => b.value - a.value);
  }, [filtered, products]);

  // Invoice source breakdown
  const sourceData = [
    { name: "POS Sales", value: posSales },
    { name: "Custom Invoices", value: manualSales },
  ].filter((d) => d.value > 0);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/80">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-800">Reports</h2>
            <p className="text-sm text-slate-400 mt-0.5">Detailed report for {periodLabel}</p>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
            {PERIOD_OPTIONS.map((opt) => (
              <button key={opt.key} onClick={() => setPeriod(opt.key)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${period === opt.key
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 sm:px-6 pb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Revenue" value={formatCurrency(totalRevenue)} sub={periodLabel} color="blue"
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatCard label={`Profit (${periodLabel})`} value={formatCurrency(estimatedProfit)} sub={periodLabel} color="emerald"
            icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          <StatCard label="Total Sales" value={totalSales} sub="invoices" color="violet"
            icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

          <StatCard label="POS Sales" value={posSales} sub="transactions" color="blue"
            icon="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          <StatCard label="Custom Invoices" value={manualSales} sub="manual" color="violet"
            icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue + Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 text-sm">Revenue & Profit Trend</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span>Revenue</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>Profit</span>
            </div>
          </div>
          {chartData.every(d => d.revenue === 0) ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No sales in {periodLabel}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={(val, name) => [
                    name === "revenue" ? formatCurrency(val) : name === "profit" ? formatCurrency(val) : val,
                    name === "revenue" ? "Revenue" : name === "profit" ? "Profit" : "Sales"
                  ]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#1D6FDB" radius={[4, 4, 0, 0]} name="revenue" />
                <Bar dataKey="profit" fill="#10B981" radius={[4, 4, 0, 0]} name="profit" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sales Source Pie */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-bold text-slate-700 text-sm mb-4">Sale Types</h3>
          {sourceData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={72}
                    dataKey="value" paddingAngle={3}>
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(val) => [val, "Sales"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-2">
                {sourceData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                      <span className="text-slate-600 font-medium">{d.name}</span>
                    </div>
                    <span className="font-bold text-slate-800">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Udaar Line Chart */}
      <div className="px-4 sm:px-6 pb-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-700 text-sm">Udaar & Receive Udaar</h3>
              <p className="text-xs text-slate-400 mt-0.5">{periodLabel} wise comparison</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>Udaar (Due)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>Received</span>
            </div>
          </div>
          {chartData.every(d => d.udaar === 0 && d.udaarReceive === 0) ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No udaar data in {periodLabel}</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip
                  formatter={(val, name) => [formatCurrency(val), name === "udaar" ? "Udaar (Due)" : "Received"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend formatter={(val) => val === "udaar" ? "Udaar (Due)" : "Receive Udaar"} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="udaar" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: "#ef4444" }} activeDot={{ r: 5 }} name="udaar" />
                <Line type="monotone" dataKey="udaarReceive" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: "#10B981" }} activeDot={{ r: 5 }} name="udaarReceive" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-bold text-slate-700 text-sm mb-4">Top Products ({periodLabel})</h3>
          {topProducts.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No product data available</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const pct = topProducts[0].revenue > 0 ? (p.revenue / topProducts[0].revenue) * 100 : 0;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black text-white flex-shrink-0`}
                          style={{ background: COLORS[i % COLORS.length] }}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-semibold text-slate-700 truncate">{p.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-bold text-slate-800">{formatCurrency(p.revenue)}</p>
                        <p className="text-[10px] text-slate-400">{p.qty} units</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Revenue */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h3 className="font-bold text-slate-700 text-sm mb-4">Category Revenue ({periodLabel})</h3>
          {categoryData.length === 0 ? (
            <div className="py-10 text-center text-slate-400 text-sm">No category data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(val) => [formatCurrency(val), "Revenue"]}
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#1D6FDB">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Invoice detail table */}
      <div className="px-4 sm:px-6 pb-8">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm">Invoices ({periodLabel})</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg font-semibold">{filtered.length} records</span>
          </div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No invoices in {periodLabel}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/70">
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                    <th className="px-3 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.slice(0, 50).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-bold text-blue-600 text-sm">#{String(inv.invoiceNumber || inv.id).padStart(3, "0")}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700 font-medium">{inv.customerName || "Walk-in"}</td>
                      <td className="px-5 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(inv.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-5 py-3">
                        {inv.source === "manual" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />Custom
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />POS
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-black text-slate-800 text-sm">{formatCurrency(inv.total)}</td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors mx-auto"
                          title="Invoice view karein"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 50 && (
                <div className="px-5 py-3 text-center text-xs text-slate-400 border-t border-slate-50">
                  Showing 50 of {filtered.length}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice View Modal */}
      {selectedInvoice && (
        <InvoicePrintModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoiceSettings={invoiceSettings}
        />
      )}
    </div>
  );
}
