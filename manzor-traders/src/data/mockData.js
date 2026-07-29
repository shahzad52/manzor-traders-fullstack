export const revenueData = [
  { month: "Jan", revenue: 42000, profit: 18000, expenses: 24000 },
  { month: "Feb", revenue: 55000, profit: 22000, expenses: 33000 },
  { month: "Mar", revenue: 48000, profit: 20000, expenses: 28000 },
  { month: "Apr", revenue: 63000, profit: 29000, expenses: 34000 },
  { month: "May", revenue: 71000, profit: 34000, expenses: 37000 },
  { month: "Jun", revenue: 58000, profit: 26000, expenses: 32000 },
  { month: "Jul", revenue: 80000, profit: 40000, expenses: 40000 },
  { month: "Aug", revenue: 75000, profit: 36000, expenses: 39000 },
  { month: "Sep", revenue: 90000, profit: 45000, expenses: 45000 },
  { month: "Oct", revenue: 85000, profit: 42000, expenses: 43000 },
  { month: "Nov", revenue: 95000, profit: 50000, expenses: 45000 },
  { month: "Dec", revenue: 110000, profit: 58000, expenses: 52000 },
];

export const categoryData = [
  { name: "Electronics", value: 38, color: "#1D6FDB" },
  { name: "Clothing", value: 24, color: "#38BDF8" },
  { name: "Food & Drinks", value: 18, color: "#0EA5E9" },
  { name: "Furniture", value: 12, color: "#7DD3FC" },
  { name: "Others", value: 8, color: "#BAE6FD" },
];

export const topProducts = [
  { name: "iPhone 15 Pro", category: "Electronics", stock: 245, sold: 1820, revenue: "Rs 182,000", trend: "up" },
  { name: "Nike Air Max", category: "Clothing", stock: 512, sold: 1540, revenue: "Rs 123,200", trend: "up" },
  { name: "MacBook Air M3", category: "Electronics", stock: 87, sold: 960, revenue: "Rs 115,200", trend: "down" },
  { name: "Samsung 4K TV", category: "Electronics", stock: 134, sold: 740, revenue: "Rs 96,200", trend: "up" },
  { name: "Levi's 501 Jeans", category: "Clothing", stock: 890, sold: 2100, revenue: "Rs 84,000", trend: "up" },
];

export const dashboardStatsCards = [
  {
    title: "Total Revenue",
    value: "Rs 892,400",
    change: "+14.2%",
    up: true,
    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    light: "bg-blue-50",
    text: "text-blue-600",
  },
  {
    title: "Net Profit",
    value: "Rs 420,600",
    change: "+8.7%",
    up: true,
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    light: "bg-emerald-50",
    text: "text-emerald-600",
  },
  {
    title: "Total Products",
    value: "4,826",
    change: "+3.1%",
    up: true,
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    light: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    title: "Total Invoices",
    value: "1,284",
    change: "-2.4%",
    up: false,
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    light: "bg-amber-50",
    text: "text-amber-600",
  },
];

export const navItems = [
  { icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
  { icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", label: "Products" },
  { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", label: "Customers" },
  { icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", label: "Point of Sale" },
  { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Invoices" },
  { icon: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Reports" },
  { icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", label: "Settings" },
];

export const initialProducts = [
  { id: 1, name: "iPhone 15 Pro", category: "Electronics", salePrice: 999, stockPrice: 899, costPrice: 750, lowStockAlertQty: 30, currentStock: 87 },
  { id: 2, name: "Nike Air Max", category: "Clothing", salePrice: 120, stockPrice: 95, costPrice: 60, lowStockAlertQty: 50, currentStock: 512 },
  { id: 3, name: "MacBook Air M3", category: "Electronics", salePrice: 1199, stockPrice: 1099, costPrice: 950, lowStockAlertQty: 15, currentStock: 8 },
  { id: 4, name: "Samsung 4K TV", category: "Electronics", salePrice: 799, stockPrice: 699, costPrice: 520, lowStockAlertQty: 20, currentStock: 0 },
  { id: 5, name: "Levi's 501 Jeans", category: "Clothing", salePrice: 89, stockPrice: 75, costPrice: 40, lowStockAlertQty: 100, currentStock: 890 },
  { id: 6, name: "Organic Green Tea", category: "Food & Drinks", salePrice: 12, stockPrice: 9, costPrice: 5, lowStockAlertQty: 40, currentStock: 12 },
];

export const PRODUCT_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food & Drinks",
  "Furniture",
  "Others",
];

export const initialCustomers = [
  { id: 1, name: "Ahmed Khan", phone: "0300-1234567", email: "ahmed@example.com", city: "Lahore", totalOrders: 12, totalSpent: 145600, lastOrder: "2026-05-20T10:30:00" },
  { id: 2, name: "Sara Malik", phone: "0321-9876543", email: "sara@example.com", city: "Karachi", totalOrders: 8, totalSpent: 87200, lastOrder: "2026-05-18T14:15:00" },
  { id: 3, name: "Bilal Hussain", phone: "0333-5551234", email: "bilal@example.com", city: "Islamabad", totalOrders: 5, totalSpent: 54300, lastOrder: "2026-05-15T09:00:00" },
  { id: 4, name: "Fatima Zahra", phone: "0345-7778899", email: "fatima@example.com", city: "Faisalabad", totalOrders: 20, totalSpent: 234000, lastOrder: "2026-05-21T16:45:00" },
  { id: 5, name: "Usman Ali", phone: "0311-4445566", email: "usman@example.com", city: "Multan", totalOrders: 3, totalSpent: 23400, lastOrder: "2026-05-10T11:00:00" },
  { id: 6, name: "Zainab Noor", phone: "0300-2223344", email: "zainab@example.com", city: "Lahore", totalOrders: 15, totalSpent: 178900, lastOrder: "2026-05-22T08:30:00" },
];
