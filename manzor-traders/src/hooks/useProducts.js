import { useState, useMemo, useCallback, useEffect } from "react";
import { PRODUCT_CATEGORIES } from "../data/mockData";
import { buildStockAlerts, getStockStatus } from "../utils/productHelpers";
import { api } from "../api/client";

// ── IndexedDB helpers for logo (unchanged) ──
function openLogoIDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("inv_settings", 1);
    r.onupgradeneeded = (e) => e.target.result.createObjectStore("logo");
    r.onsuccess = (e) => res(e.target.result);
    r.onerror = () => rej(r.error);
  });
}
async function loadLogoFromIDB() {
  try {
    const db = await openLogoIDB();
    return new Promise((res) => {
      const req = db.transaction("logo", "readonly").objectStore("logo").get("current");
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
  } catch {
    return null;
  }
}
async function saveLogoToIDB(logoData) {
  const db = await openLogoIDB();
  await new Promise((res, rej) => {
    const tx = db.transaction("logo", "readwrite");
    tx.objectStore("logo").put(logoData, "current");
    tx.oncomplete = res;
    tx.onerror = () => rej(tx.error);
  });
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useProducts(uid) {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [manualInvoices, setManualInvoices] = useState([]);
  const [categories, setCategories] = useState(PRODUCT_CATEGORIES);
  const [appSettings, setAppSettings] = useState({ appName: "InvManager", tagline: "Pro Dashboard" });
  const [invoiceSettings, setInvoiceSettings] = useState({ ownerName: "", businessName: "", phone: "", address: "", logo: "" });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Modular Refresh Actions ────────────────────────────────────────────────
  const refreshProducts = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await api.get("/api/products");
      setProducts(data || []);
    } catch (e) {
      console.error("Failed to refresh products:", e);
    }
  }, [uid]);

  const refreshCustomers = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await api.get("/api/customers");
      setCustomers(data || []);
    } catch (e) {
      console.error("Failed to refresh customers:", e);
    }
  }, [uid]);

  const refreshInvoices = useCallback(async () => {
    if (!uid) return;
    try {
      const [manualData, salesData] = await Promise.all([
        api.get("/api/invoices"),
        api.get("/api/pos"),
      ]);
      setManualInvoices(manualData || []);
      setSales(salesData || []);
    } catch (e) {
      console.error("Failed to refresh invoices:", e);
    }
  }, [uid]);

  const refreshSettings = useCallback(async () => {
    if (!uid) return;
    try {
      const data = await api.get("/api/settings");
      if (data) {
        setAppSettings(data.appSettings || { appName: "InvManager", tagline: "Pro Dashboard" });
        setCategories(data.categories?.length ? data.categories : PRODUCT_CATEGORIES);
        const inv = data.invoiceSettings || {};
        if (inv.logo === "__local__") {
          const logoData = await loadLogoFromIDB();
          setInvoiceSettings({ ...inv, logo: logoData || "" });
        } else {
          setInvoiceSettings(inv);
        }
      }
    } catch (e) {
      console.error("Failed to refresh settings:", e);
    }
  }, [uid]);

  const refreshAll = useCallback(async () => {
    if (!uid) return;
    await Promise.all([
      refreshProducts(),
      refreshCustomers(),
      refreshInvoices(),
      refreshSettings(),
    ]);
  }, [uid, refreshProducts, refreshCustomers, refreshInvoices, refreshSettings]);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    refreshAll().finally(() => setLoading(false));
  }, [uid, refreshAll]);

  // ── Computed ────────────────────────────────────────────────────────────
  const alerts = useMemo(() => buildStockAlerts(products), [products]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.currentStock || 0), 0);
    const lowStockCount = products.filter((p) => getStockStatus(p) === "low").length;
    const outOfStockCount = products.filter((p) => getStockStatus(p) === "out").length;
    return { totalProducts, totalStock, lowStockCount, outOfStockCount };
  }, [products]);

  const allInvoices = useMemo(() => {
    const normalize = (inv) => {
      const advancePayments = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const extraPayments = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const totalPaid = advancePayments + extraPayments + (inv.advance && advancePayments === 0 ? inv.advance : 0);
      const due = Math.max(0, (inv.total || 0) - totalPaid);
      let paymentStatus;
      if (due <= 0) paymentStatus = "paid";
      else if (totalPaid > 0) paymentStatus = "partial";
      else paymentStatus = "udaar";
      return { ...inv, paymentStatus };
    };
    const combined = [
      ...sales.map((s) => normalize({ ...s, source: s.source || "pos" })),
      ...manualInvoices.map((m) => normalize({ ...m, source: m.source || "manual" })),
    ];
    return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [sales, manualInvoices]);

  const posStats = useMemo(() => {
    const inStock = products.filter((p) => p.currentStock > 0).length;
    const today = new Date().toDateString();
    const todaySales = sales.filter((s) => new Date(s.createdAt).toDateString() === today);
    const todayRevenue = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    return { inStock, todaySalesCount: todaySales.length, todayRevenue };
  }, [products, sales]);

  // ── Product actions ─────────────────────────────────────────────────────
  const addProduct = useCallback(async (form) => {
    const created = await api.post("/api/products", form);
    setProducts((prev) => [...prev, created]);
    return created;
  }, []);

  const updateProduct = useCallback(async (id, form) => {
    const updated = await api.put(`/api/products/${id}`, form);
    setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? updated : p)));
    return updated;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await api.delete(`/api/products/${id}`);
    setProducts((prev) => prev.filter((p) => String(p.id) !== String(id)));
  }, []);

  const stockIn = useCallback(async (id, qty) => {
    const amount = Number(qty);
    if (!amount || amount <= 0) return false;
    try {
      const updated = await api.post(`/api/products/${id}/stock-in`, { qty: amount });
      setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? updated : p)));
      return true;
    } catch {
      return false;
    }
  }, []);

  const stockOut = useCallback(async (id, qty) => {
    const amount = Number(qty);
    if (!amount || amount <= 0) return false;
    try {
      const updated = await api.post(`/api/products/${id}/stock-out`, { qty: amount });
      setProducts((prev) => prev.map((p) => (String(p.id) === String(id) ? updated : p)));
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Sale / Invoice actions ───────────────────────────────────────────────
  const completeSale = useCallback(async (items) => {
    if (!items?.length) return { success: false };
    try {
      const result = await api.post("/api/pos/complete-sale", { items });
      if (result.success) {
        await refreshProducts(); // stock updated
      }
      return result;
    } catch {
      return { success: false };
    }
  }, [refreshProducts]);

  const recordSale = useCallback(async (sale) => {
    const created = await api.post("/api/pos/sales", sale);
    setSales((prev) => [created, ...prev]);
    if (sale.customerId) {
      await Promise.all([refreshCustomers(), refreshProducts()]);
    } else {
      await refreshProducts();
    }
    return created;
  }, [refreshCustomers, refreshProducts]);

  const createManualInvoice = useCallback(async (data) => {
    const created = await api.post("/api/invoices/manual", data);
    setManualInvoices((prev) => [created, ...prev]);
    if (data.customerId) {
      await Promise.all([refreshCustomers(), refreshProducts()]);
    } else {
      await refreshProducts();
    }
    return created;
  }, [refreshCustomers, refreshProducts]);

  const updateInvoice = useCallback(async (id, data, source) => {
    const updated = await api.put(`/api/invoices/${id}?source=${source === "manual" ? "manual" : "pos"}`, data);
    if (source === "manual") {
      setManualInvoices((prev) => prev.map((i) => (String(i.id) === String(id) ? updated : i)));
    } else {
      setSales((prev) => prev.map((i) => (String(i.id) === String(id) ? updated : i)));
    }
    await Promise.all([refreshProducts(), refreshCustomers()]);
    return updated;
  }, [refreshProducts, refreshCustomers]);

  const deleteInvoice = useCallback(async (id, source) => {
    if (source === "manual") {
      await api.delete(`/api/invoices/${id}?source=manual`);
    } else {
      await api.delete(`/api/pos/${id}`);
    }
    await Promise.all([refreshProducts(), refreshCustomers(), refreshInvoices()]);
  }, [refreshProducts, refreshCustomers, refreshInvoices]);

  // ── Customer actions ─────────────────────────────────────────────────────
  const addCustomer = useCallback(async (form) => {
    const created = await api.post("/api/customers", form);
    setCustomers((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCustomer = useCallback(async (id, form) => {
    const updated = await api.put(`/api/customers/${id}`, form);
    setCustomers((prev) => prev.map((c) => (String(c.id) === String(id) ? updated : c)));
    return updated;
  }, []);

  const deleteCustomer = useCallback(async (id) => {
    await api.delete(`/api/customers/${id}`);
    setCustomers((prev) => prev.filter((c) => String(c.id) !== String(id)));
  }, []);

  // ── Payment & Ledger actions ────────────────────────────────────────────
  const receivePayment = useCallback(async ({ customerId, amount, date, note, allocations }) => {
    const mapped = allocations.map((a) => ({
      ...a,
      source: sales.some((s) => String(s.id) === String(a.invoiceId)) ? "pos" : "manual",
    }));
    await api.post("/api/invoices/receive-payment", { customerId, amount, date, note, allocations: mapped });
    await Promise.all([refreshCustomers(), refreshInvoices()]);
  }, [sales, refreshCustomers, refreshInvoices]);

  const addBalanceAdjustment = useCallback(async ({ customerId, type, amount, reason, date }) => {
    const updated = await api.post(`/api/customers/${customerId}/adjustments`, { type, amount, reason, date });
    setCustomers((prev) => prev.map((c) => (String(c.id) === String(customerId) ? updated : c)));
  }, []);

  // ── Settings actions ────────────────────────────────────────────────────
  const addCategory = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const settings = await api.post("/api/settings/categories", { name: trimmed });
    setCategories(settings.categories);
  }, [categories]);

  const removeCategory = useCallback(async (name) => {
    const settings = await api.delete(`/api/settings/categories/${encodeURIComponent(name)}`);
    if (settings) setCategories(settings.categories);
    else setCategories((prev) => prev.filter((c) => c !== name));
  }, []);

  const updateAppSettings = useCallback(async (settings) => {
    const next = await api.put("/api/settings/app-settings", settings);
    setAppSettings(next.appSettings);
  }, []);

  const updateInvoiceSettings = useCallback(async (settings) => {
    const { logo, ...rest } = settings;
    const payload = { ...rest };
    if (logo !== undefined) {
      if (logo) {
        await saveLogoToIDB(logo);
        payload.logo = "__local__";
      } else {
        payload.logo = "";
      }
    }
    const next = await api.put("/api/settings/invoice-settings", payload);
    setInvoiceSettings((prev) => ({ ...next.invoiceSettings, logo: logo !== undefined ? logo : prev.logo }));
  }, []);

  // ── Backup Restore ──────────────────────────────────────────────────────
  const restoreBackup = useCallback(async (data) => {
    if (!uid) throw new Error("Not logged in");
    if (data.settings?.invoiceSettings?.logo && data.settings.invoiceSettings.logo !== "__local__") {
      try {
        await saveLogoToIDB(data.settings.invoiceSettings.logo);
      } catch {
        /* ignore */
      }
    }
    await api.post("/api/backup/restore", data);
    await refreshAll();
  }, [uid, refreshAll]);

  return {
    loading,
    products, alerts, stats, sales, allInvoices, posStats,
    addProduct, updateProduct, deleteProduct, stockIn, stockOut,
    completeSale, recordSale, createManualInvoice, updateInvoice, deleteInvoice,
    customers, addCustomer, updateCustomer, deleteCustomer, receivePayment, addBalanceAdjustment,
    categories, addCategory, removeCategory,
    appSettings, updateAppSettings,
    invoiceSettings, updateInvoiceSettings,
    restoreBackup,
  };
}
