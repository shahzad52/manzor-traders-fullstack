import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CustomTooltip from "../charts/CustomTooltip";

export default function ExpensesBarChart({ data = [] }) {
  const hasData = data.some(d => d.revenue > 0);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-base">Monthly Revenue vs Expense</h2>
          <p className="text-xs text-slate-400 mt-0.5">Comparative view (current year)</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded bg-blue-600 inline-block"></span>Revenue</span>
          <span className="flex items-center gap-1.5 text-slate-500"><span className="w-3 h-3 rounded bg-emerald-400 inline-block"></span>Profit</span>
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs ${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" fill="#1D6FDB" radius={[4, 4, 0, 0]} opacity={0.9} name="Revenue" />
            <Bar dataKey="expenses" fill="#34d399" radius={[4, 4, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex flex-col items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-2 opacity-40">
            <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
          </svg>
          <p className="text-sm">Abhi koi data nahi</p>
        </div>
      )}
    </div>
  );
}
