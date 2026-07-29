export function getStockStatus(product) {
  if (product.currentStock <= 0) return "out";
  if (product.currentStock <= product.lowStockAlertQty) return "low";
  return "ok";
}

export function buildStockAlerts(products) {
  const alerts = [];
  products.forEach((p) => {
    const status = getStockStatus(p);
    if (status === "out") {
      alerts.push({
        id: `out-${p.id}`,
        type: "out",
        productId: p.id,
        title: "Out of Stock",
        message: `${p.name} is out of stock.`,
        time: "Just now",
      });
    } else if (status === "low") {
      alerts.push({
        id: `low-${p.id}`,
        type: "low",
        productId: p.id,
        title: "Low Stock Alert",
        message: `${p.name} has only ${p.currentStock} units left (alert at ${p.lowStockAlertQty}).`,
        time: "Just now",
      });
    }
  });
  return alerts;
}

export function formatCurrency(value) {
  return `Rs ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const emptyProductForm = {
  name: "",
  category: "Electronics",
  salePrice: "",
  costPrice: "",
  lowStockAlertQty: "",
  currentStock: "",
  ctn: "",
};
