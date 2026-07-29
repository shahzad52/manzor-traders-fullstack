import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CustomTooltip from "../charts/CustomTooltip";

export default function RevenueChart({ data = [], year = new Date().getFullYear() }) {
  const hasData = data.some(d => d.revenue > 0);
  return (
    <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-slate-800 text-base">Revenue & Profit</h2>
          <p className="text-xs text-slate-400 mt-0.5">{year} monthly overview</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block"></span> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Profit
          </span>
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1D6FDB" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#1D6FDB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `Rs ${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#1D6FDB" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5, fill: "#1D6FDB" }} name="Revenue" />
            <Area type="monotone" dataKey="expenses" stroke="#10B981" name="Profit" strokeWidth={2.5} fill="url(#profGrad)" dot={false} activeDot={{ r: 5, fill: "#10B981" }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[220px] flex flex-col items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-2 opacity-40">
            <path d="M3 3v18h18"/><path d="m7 16 4-4 4 4 5-5"/>
          </svg>
          <p className="text-sm">Koi invoice nahi — sale karein to yahan data ayega</p>
        </div>
      )}
    </div>
  );
}
