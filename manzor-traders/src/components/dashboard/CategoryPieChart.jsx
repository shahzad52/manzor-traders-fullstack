import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 shadow-lg rounded-xl px-3 py-2 text-sm">
        <p className="font-semibold text-slate-700">{payload[0].name}</p>
        <p className="text-slate-500 mt-0.5">Share: <span className="font-bold" style={{ color: payload[0].payload.color }}>{payload[0].value}%</span></p>
      </div>
    );
  }
  return null;
}

export default function CategoryPieChart({ data = [] }) {
  const hasData = data.length > 0;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="mb-5">
        <h2 className="font-bold text-slate-800 text-base">Products by Category</h2>
        <p className="text-xs text-slate-400 mt-0.5">Current inventory distribution</p>
      </div>
      {hasData ? (
        <>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="none" style={{ outline: "none" }} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }}></span>
                  <span className="text-xs text-slate-600 truncate max-w-[120px]">{item.name}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700">{item.value}%</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="h-[220px] flex flex-col items-center justify-center text-slate-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-2 opacity-40">
            <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/>
          </svg>
          <p className="text-sm">Koi product nahi</p>
        </div>
      )}
    </div>
  );
}
