export const PAYMENT_METHODS = [
  { id: "cash", label: "Cash", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "card", label: "Card", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { id: "wallet", label: "Wallet", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
];

export const CATEGORY_STYLES = {
  Electronics: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  Clothing: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
  "Food & Drinks": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  Furniture: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  Others: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

export const DEFAULT_CATEGORY_STYLE = { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };

export function getCategoryStyle(category) {
  return CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE;
}

export function calcTotals(subtotal, discountPercent = 0, taxPercent = 0) {
  const discount = Math.min(subtotal * (discountPercent / 100), subtotal);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (taxPercent / 100);
  const total = afterDiscount + tax;
  return { subtotal, discount, afterDiscount, tax, total };
}

export function formatSaleTime(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
