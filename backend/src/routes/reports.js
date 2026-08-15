import { Router } from "express";
import pool from "../db/pool.js";
import { mapInvoice, mapProduct } from "../utils/mappers.js";

const router = Router();

function getRange(period) {
  const now = new Date();
  const start = new Date();
  if (period === "day") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }
  return { start, end: now };
}

// Invoice par ab tak kitne paise wasool huay hain (advance + baqi payments),
// same logic jo groupBy ke andar udaar/udaarReceive nikalne ke liye use hoti hai.
function getPaidAmount(inv) {
  const advInPmts = (inv.payments || []).filter(p => p.note && p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
  const otherPmts = (inv.payments || []).filter(p => !p.note || !p.note.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
  const standAloneAdv = advInPmts > 0 ? 0 : (inv.advance || 0);
  return advInPmts + otherPmts + standAloneAdv;
}

function calcProfit(inv, products = []) {
  if (inv.isOldUdaar || (inv.extra && inv.extra.isOldUdaar)) return 0;

  const gross = inv.extra?.grossProfit ?? inv.grossProfit;
  let fullProfit;
  if (gross !== undefined && gross !== null && Number(gross) > 0) {
    fullProfit = Number(gross);
  } else {
    const cost = (inv.items || []).reduce((s, item) => {
      let cp = item.costPrice;
      if ((cp === undefined || cp === null || cp === 0) && products.length > 0) {
        const prod = products.find(p => String(p.id) === String(item.productId) || p.name === item.name);
        if (prod) cp = prod.costPrice || prod.stockPrice || 0;
      }
      return s + ((cp || 0) * (item.qty || 0));
    }, 0);

    const subtotal = inv.extra?.subtotal ?? inv.subtotal ?? inv.total ?? 0;
    const total = inv.total || 0;
    const discountFactor = subtotal > 0 ? (total / subtotal) : 1;
    const adjustedCost = cost * Math.min(discountFactor, 1);
    fullProfit = Math.max(0, total - adjustedCost);
  }

  // Udaar / partial invoices ka jitna hissa abhi tak wasool nahi hua, us
  // hisse ka profit bhi abhi count nahi karna — sirf wasool shuda (paid)
  // amount ke hisaab se munafa dikhana hai, poori invoice ka nahi.
  if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
    const total = inv.total || 0;
    if (total <= 0) return 0;
    const paid = getPaidAmount(inv);
    const paidRatio = Math.max(0, Math.min(1, paid / total));
    return fullProfit * paidRatio;
  }

  return fullProfit;
}

function groupBy(invoices, period, products = [], paymentEvents = []) {
  if (period === "day") {
    const hours = Array.from({ length: 24 }, (_, h) => ({
      label: `${h}:00`,
      revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0,
    }));
    invoices.forEach((inv) => {
      const h = new Date(inv.createdAt).getHours();
      hours[h].revenue += inv.total || 0;
      hours[h].sales += 1;
      hours[h].profit += calcProfit(inv, products);
      if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
        const paid = getPaidAmount(inv);
        hours[h].udaar += Math.max(0, (inv.total || 0) - paid);
      }
    });
    paymentEvents.forEach((ev) => {
      const h = new Date(ev.date).getHours();
      if (hours[h]) hours[h].udaarReceive += ev.amount;
    });
    return hours.filter((_, i) => i <= new Date().getHours());
  } else if (period === "week") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const data = days.map((d) => ({ label: d, revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0 }));
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt).getDay();
      data[d].revenue += inv.total || 0;
      data[d].sales += 1;
      data[d].profit += calcProfit(inv, products);
      if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
        const paid = getPaidAmount(inv);
        data[d].udaar += Math.max(0, (inv.total || 0) - paid);
      }
    });
    paymentEvents.forEach((ev) => {
      const d = new Date(ev.date).getDay();
      if (data[d]) data[d].udaarReceive += ev.amount;
    });
    return data;
  } else if (period === "month") {
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      label: `${i + 1}`,
      revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0,
    }));
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt).getDate() - 1;
      if (data[d]) {
        data[d].revenue += inv.total || 0;
        data[d].sales += 1;
        data[d].profit += calcProfit(inv, products);
        if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
          const paid = getPaidAmount(inv);
          data[d].udaar += Math.max(0, (inv.total || 0) - paid);
        }
      }
    });
    paymentEvents.forEach((ev) => {
      const d = new Date(ev.date).getDate() - 1;
      if (data[d]) data[d].udaarReceive += ev.amount;
    });
    return data;
  } else {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const data = months.map((m) => ({ label: m, revenue: 0, sales: 0, profit: 0, udaar: 0, udaarReceive: 0 }));
    invoices.forEach((inv) => {
      const m = new Date(inv.createdAt).getMonth();
      data[m].revenue += inv.total || 0;
      data[m].sales += 1;
      data[m].profit += calcProfit(inv, products);
      if (inv.paymentStatus === "udaar" || inv.paymentStatus === "partial") {
        const paid = getPaidAmount(inv);
        data[m].udaar += Math.max(0, (inv.total || 0) - paid);
      }
    });
    paymentEvents.forEach((ev) => {
      const m = new Date(ev.date).getMonth();
      if (data[m]) data[m].udaarReceive += ev.amount;
    });
    return data;
  }
}

// GET /api/reports?period=day|week|month|year
router.get("/", async (req, res, next) => {
  try {
    const period = req.query.period || "month";
    const { start, end } = getRange(period);

    // Fetch user's sales and manual invoices
    const [salesResult, manualResult, productsResult] = await Promise.all([
      pool.query("SELECT * FROM sales WHERE firebase_uid=$1", [req.uid]),
      pool.query("SELECT * FROM manual_invoices WHERE firebase_uid=$1", [req.uid]),
      pool.query("SELECT * FROM products WHERE firebase_uid=$1", [req.uid]),
    ]);

    const products = productsResult.rows.map(mapProduct);
    const sales = salesResult.rows.map((r) => mapInvoice(r, "pos"));
    const manualInvoices = manualResult.rows.map((r) => mapInvoice(r, "manual"));

    const combined = [...sales, ...manualInvoices];

    // Filter by date range
    const filtered = combined.filter((inv) => {
      const d = new Date(inv.createdAt);
      return d >= start && d <= end;
    });

    // Summary calculations
    const totalRevenue = filtered.reduce((s, inv) => s + (inv.total || 0), 0);
    const totalSales = filtered.length;
    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    const posSales = filtered.filter((i) => i.source !== "manual").length;
    const manualSales = filtered.filter((i) => i.source === "manual").length;
    const estimatedProfit = filtered.reduce((s, inv) => s + calcProfit(inv, products), 0);
    const profitMarginPct = totalRevenue > 0 ? (estimatedProfit / totalRevenue) * 100 : 0;

    // Top products
    const topProductsMap = {};
    filtered.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const key = item.name || "Unknown";
        if (!topProductsMap[key]) topProductsMap[key] = { name: key, qty: 0, revenue: 0 };
        topProductsMap[key].qty += item.qty || 0;
        topProductsMap[key].revenue += item.lineTotal || 0;
      });
    });
    const topProducts = Object.values(topProductsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Category breakdown
    const categoryMap = {};
    filtered.forEach((inv) => {
      (inv.items || []).forEach((item) => {
        const product = products.find((p) => String(p.id) === String(item.productId));
        const cat = product?.category || "Other";
        if (!categoryMap[cat]) categoryMap[cat] = { name: cat, value: 0 };
        categoryMap[cat].value += item.lineTotal || 0;
      });
    });
    const categoryData = Object.values(categoryMap).sort((a, b) => b.value - a.value);

    // ✅ FIX: "Udaar Receive" ab payment ki apni date ke hisaab se count hota hai,
    // invoice kab banaya gaya tha uske hisaab se nahi. Pehle agar koi purani (is
    // period se pehle wali) udaar invoice ki payment isi period mein wasool hoti
    // thi, to wo report mein bilkul show hi nahi hoti thi — kyunki sirf usi
    // period ki invoices dekhi ja rahi thin. Ab hum SAARI invoices (combined) ke
    // payments scan karte hain aur jo payment ki date is period ke andar aati
    // hai, wahi count hoti hai — chahe invoice kisi bhi purani date ki ho.
    const paymentEvents = [];
    combined.forEach((inv) => {
      (inv.payments || []).forEach((p) => {
        if (p.note && p.note.includes("Advance at sale")) return; // sale ke waqt ka advance revenue mein pehle hi shamil hai
        if (!p.date) return;
        const d = new Date(p.date);
        if (d >= start && d <= end) {
          paymentEvents.push({ date: p.date, amount: p.amount || 0 });
        }
      });
    });
    const totalUdaarReceivedSummary = paymentEvents.reduce((s, ev) => s + ev.amount, 0);

    // Grouped chart data
    const chartData = groupBy(filtered, period, products, paymentEvents);

    // Return the pre-calculated reports payload + the last 50 invoices for the table
    const sortedFiltered = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const recentInvoices = sortedFiltered.slice(0, 50);

    res.json({
      totalRevenue,
      estimatedProfit,
      totalSales,
      avgOrderValue,
      posSales,
      manualSales,
      profitMarginPct,
      totalUdaarReceived: totalUdaarReceivedSummary,
      topProducts,
      categoryData,
      chartData,
      recentInvoices,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
