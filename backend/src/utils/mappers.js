export const num = (v) => (v === null || v === undefined ? 0 : Number(v));

export function mapProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    salePrice: num(row.sale_price),
    stockPrice: num(row.stock_price),
    costPrice: num(row.cost_price),
    lowStockAlertQty: num(row.low_stock_alert_qty),
    currentStock: num(row.current_stock),
    ctn: num(row.ctn),
  };
}

export function mapCustomer(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || "",
    city: row.city || "",
    totalOrders: row.total_orders || 0,
    totalSpent: num(row.total_spent),
    lastOrder: row.last_order,
    adjustments: row.adjustments || [],
  };
}

export function mapInvoice(row, source) {
  return {
    id: row.id,
    source,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id,
    items: row.items || [],
    total: num(row.total),
    advance: num(row.advance),
    paymentMode: row.payment_mode,
    paymentStatus: row.payment_status,
    payments: row.payments || [],
    previousUdaar: num(row.previous_udaar),
    showPreviousUdaarOnInvoice: row.show_previous_udaar_on_invoice,
    previousUdaarCleared: row.previous_udaar_cleared,
    previousUdaarClearedAt: row.previous_udaar_cleared_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.extra || {}),
  };
}

export function mapSettings(row) {
  if (!row) {
    return {
      appSettings: { appName: "InvManager", tagline: "Pro Dashboard" },
      invoiceSettings: { ownerName: "", businessName: "", phone: "", address: "", logo: "" },
      categories: [],
      invoiceCounter: 0,
    };
  }
  return {
    appSettings: row.app_settings,
    invoiceSettings: row.invoice_settings,
    categories: row.categories,
    invoiceCounter: row.invoice_counter,
  };
}
