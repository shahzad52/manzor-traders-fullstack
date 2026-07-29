import SVGIcon from "../common/SVGIcon";
import { formatCurrency } from "../../utils/productHelpers";

export default function POSStatsCards({ posStats, cartTotal }) {
  const cards = [
    { title: "In Stock", value: posStats.inStock.toString(), icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", light: "bg-emerald-50", text: "text-emerald-600" },
    { title: "Today's Sales", value: posStats.todaySalesCount.toString(), icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z", light: "bg-blue-50", text: "text-blue-600" },
    { title: "Today's Revenue", value: formatCurrency(posStats.todayRevenue), icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", light: "bg-violet-50", text: "text-violet-600" },
    { title: "Cart Total", value: formatCurrency(cartTotal), icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", light: "bg-amber-50", text: "text-amber-600" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 pt-4 flex-shrink-0">
      {cards.map((card) => (
        <div key={card.title} className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 hover:shadow-md hover:shadow-slate-100 transition-all">
          <div className="flex items-start justify-between mb-2">
            <div className={`w-9 h-9 rounded-xl ${card.light} flex items-center justify-center flex-shrink-0`}>
              <SVGIcon d={card.icon} size={17} className={card.text} />
            </div>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-800 mb-0.5 truncate">{card.value}</p>
          <p className="text-xs text-slate-400">{card.title}</p>
        </div>
      ))}
    </div>
  );
}
