import SVGIcon from "./SVGIcon";

export default function StatCard({ title, value, change, up, icon, light, text, large = false }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 hover:shadow-md hover:shadow-slate-100 transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <div className={`rounded-xl ${light} flex items-center justify-center flex-shrink-0 w-9 h-9`}>
          <SVGIcon d={icon} size={17} className={text} />
        </div>
        {change && (
          <span className={`text-xs px-2 py-0.5 font-semibold rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-base sm:text-lg font-bold text-slate-800 mb-0.5 truncate">{value}</p>
      <p className="text-xs text-slate-400">{title}</p>
    </div>
  );
}
