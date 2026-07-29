import StatsGrid from "../common/StatsGrid";

export default function ProductStatsCards({ stats }) {
  const cards = [
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      light: "bg-violet-50",
      text: "text-violet-600",
    },
    {
      title: "Current Stock",
      value: stats.totalStock.toLocaleString(),
      icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
      light: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      title: "Low Stock Alerts",
      value: stats.lowStockCount.toString(),
      change: stats.lowStockCount > 0 ? "Alert" : null,
      up: false,
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      light: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount.toString(),
      change: stats.outOfStockCount > 0 ? "Critical" : null,
      up: false,
      icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636",
      light: "bg-red-50",
      text: "text-red-600",
    },
  ];

  return <StatsGrid cards={cards} large />;
}
