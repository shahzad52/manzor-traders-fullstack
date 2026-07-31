import { useState, useMemo, useRef } from "react";
import { formatCurrency } from "../../utils/productHelpers";
import InvoiceFormModal from "./InvoiceFormModal";
import InvoicePrintModal from "./InvoicePrintModal";


function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function SourceBadge({ source }) {
  if (source === "manual") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />Custom
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />POS Sale
    </span>
  );
}


function PaymentStatusBadge({ invoice }) {
  const status = invoice.paymentStatus || "paid";
  if (status === "paid") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Paid
    </span>
  );
  if (status === "partial") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Partial
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Udaar
    </span>
  );
}

function DeleteConfirmModal({ invoice, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </div>
        <h3 className="text-center font-bold text-slate-800 mb-1">Delete Invoice?</h3>
        <p className="text-center text-sm text-slate-500 mb-5">
          Invoice <span className="font-bold text-slate-700">#{String(invoice.invoiceNumber || invoice.id).padStart(3, "0")}</span> will be permanently deleted. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors">
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colors = { blue: "bg-blue-50 text-blue-600", emerald: "bg-emerald-50 text-emerald-600", violet: "bg-violet-50 text-violet-600", amber: "bg-amber-50 text-amber-600" };
  const pathParts = icon.split(" M").map((part, i) => i === 0 ? part : "M" + part);
  return (
    <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {pathParts.map((part, i) => <path key={i} d={part} />)}
        </svg>
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-black text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function InvoiceView({ products, invoices, onCreateInvoice, onUpdateInvoice, onDeleteInvoice, onReduceStock, customers = [], invoiceSettings = {} }) {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        const matchSearch = !q || String(inv.id).includes(q) || (inv.customerName || "").toLowerCase().includes(q) || (inv.customerPhone || "").includes(q);
        const matchType = filterType === "all"
          || (filterType === "manual" ? inv.source === "manual" : inv.source !== "manual");
        return matchSearch && matchType;
      })
      .slice()
      .sort((a, b) => (b.invoiceNumber || 0) - (a.invoiceNumber || 0));
  }, [invoices, search, filterType]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayInvs = invoices.filter((i) => new Date(i.createdAt).toDateString() === today);
    return {
      total: invoices.length,
      todayCount: todayInvs.length,
      totalRevenue: invoices.reduce((s, i) => s + i.total, 0),
      customCount: invoices.filter((i) => i.source === "manual").length,
    };
  }, [invoices]);

  const handleCreate = async (data) => {
    await onCreateInvoice(data);
    setShowForm(false);
  };

  const handleUpdate = (data) => {
    if (!editingInvoice) return;
    onUpdateInvoice(editingInvoice.id, data, editingInvoice.source);
    setEditingInvoice(null);
  };

  // Download button — Thermal 80mm PDF
  const handleDownloadInvoice = async (inv) => {
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const settings     = invoiceSettings || {};
      const bf           = { name: settings.ownerName || "", business: settings.businessName || "", phone: settings.phone || "", name2: settings.ownerName2 || "", phone2: settings.phone2 || "", address: settings.address || "", logo: settings.logo || "" };
      const displayName  = bf.business || bf.name || "My Business";
      const thankYouMsg  = settings.thankYouMessage || "Thank you for your business!";
      const invoiceHeading = settings.invoiceHeading || "";
      const subtotal     = inv.subtotal || (inv.items || []).reduce((s, i) => s + (i.lineTotal || 0), 0);
      const discount     = inv.discount || 0;
      const tax          = inv.tax || 0;
      const total        = inv.total || 0;
      const advance      = inv.advance || 0;
      const extraPay     = (inv.payments || []).filter(p => !p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const totalRcv     = advance + extraPay;
      const remaining    = Math.max(0, total - totalRcv);
      const payStatus    = inv.paymentStatus || (remaining <= 0 ? "paid" : "udaar");

      const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
      const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", hour12: true });
      const fmtCur  = (n)   => "Rs " + Number(n || 0).toLocaleString("en-PK");
      const UF      = "'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Arial Unicode MS',sans-serif";

      const hasCtn  = true; // CTN hamesha dikhao (0 bhi)
      const totalQty = (inv.items || []).reduce((s, i) => s + (i.qty || 0), 0);
      const totalCtn = (inv.items || []).reduce((s, i) => s + (i.ctn || 0), 0);

      const infoR = (label, val) =>
        `<tr><td style="font-family:${UF};direction:rtl;text-align:right;font-size:10px;padding:2px 3px;white-space:nowrap;">${label}</td><td style="font-size:10px;padding:2px 3px;direction:ltr;text-align:left;">${val}</td></tr>`;
      const sumR = (label, val, big) =>
        `<tr><td style="font-family:${UF};direction:rtl;text-align:right;font-size:${big?12:11}px;padding:${big?4:2}px 3px;font-weight:${big?900:400};">${label}</td><td style="font-size:${big?12:11}px;padding:${big?4:2}px 3px;direction:ltr;text-align:left;font-weight:${big?900:400};">${val}</td></tr>`;

      const rowsHtml = (inv.items || []).map((item, i) => `
        <tr>
          <td style="border:1px solid #000;padding:2px 1px;font-size:9px;text-align:center;vertical-align:middle;overflow:hidden;">${i+1}</td>
          <td style="border:1px solid #000;padding:2px 4px;font-size:10px;font-family:${UF};direction:rtl;text-align:right;vertical-align:middle;word-break:break-all;">${item.name}</td>
          <td style="border:1px solid #000;padding:2px 1px;font-size:9px;text-align:center;vertical-align:middle;">${item.qty}</td>
          <td style="border:1px solid #000;padding:2px 1px;font-size:9px;text-align:center;vertical-align:middle;">${item.ctn !== undefined ? item.ctn : 0}</td>
          <td style="border:1px solid #000;padding:2px 1px;font-size:8px;text-align:center;vertical-align:middle;direction:ltr;">${fmtCur(item.unitPrice)}</td>
          <td style="border:1px solid #000;padding:2px 1px;font-size:8px;font-weight:700;text-align:center;vertical-align:middle;direction:ltr;">${fmtCur(item.lineTotal)}</td>
        </tr>`).join("");

      const thermalHTML = `
        <div style="width:290px;margin:0 auto;padding:8px 6px 8px 6px;color:#000;background:#fff;font-family:Arial,sans-serif;box-sizing:border-box;">

          <div style="text-align:center;margin-bottom:6px;">
            ${invoiceHeading ? `<div style="font-size:9px;color:#444;font-family:${UF};direction:rtl;margin-bottom:4px;">${invoiceHeading}</div>` : ""}
            ${bf.logo
              ? `<img src="${bf.logo}" alt="Logo" style="max-width:80px;max-height:40px;display:block;margin:0 auto 4px;" />`
              : `<div style="font-size:16px;font-weight:900;font-family:${UF};direction:rtl;margin-bottom:2px;">${displayName}</div>`}
            ${bf.logo && bf.business ? `<div style="font-size:12px;font-weight:900;font-family:${UF};direction:rtl;margin-bottom:2px;">${bf.business}</div>` : ""}
            ${bf.address ? `<div style="font-size:10px;font-family:${UF};direction:rtl;margin-top:3px;margin-bottom:2px;">${bf.address}</div>` : ""}
            ${bf.name && (bf.logo || bf.business) ? `<div style="font-size:11px;font-weight:700;font-family:${UF};direction:rtl;margin-top:2px;">${bf.name}</div>` : ""}
            ${bf.phone ? `<div style="font-size:10px;direction:ltr;margin-top:2px;">${bf.phone}</div>` : ""}
            ${bf.name2 ? `<div style="font-size:11px;font-weight:700;font-family:${UF};direction:rtl;margin-top:4px;">${bf.name2}</div>` : ""}
            ${bf.phone2 ? `<div style="font-size:10px;direction:ltr;margin-top:2px;">${bf.phone2}</div>` : ""}
          </div>

          <div style="border-top:1px dashed #000;margin:5px 0;"></div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:5px;">
            ${infoR("انوائس نمبر :", `#${String(inv.invoiceNumber || inv.id).padStart(3,"0")}`)}
            ${infoR("تاریخ :", `${fmtDate(inv.createdAt)} ${fmtTime(inv.createdAt)}`)}
            ${infoR("نام کسٹمر :", inv.customerName || "کیش کسٹمر")}
            ${inv.customerAddress ? infoR("ایڈریس :", inv.customerAddress) : ""}
            ${inv.customerPhone   ? infoR("نمبر :", inv.customerPhone) : ""}
            ${infoR("اسٹیٹس :", payStatus === "paid" ? "ادا شدہ ✓" : payStatus === "partial" ? "جزوی ادائیگی" : "ادھار")}
          </table>

          <div style="border-top:1px dashed #000;margin:5px 0;"></div>

          <table style="width:278px;border-collapse:collapse;border:1px solid #000;table-layout:fixed;">
            <colgroup>
              <col style="width:14px;"/>
              <col style="width:94px;"/>
              <col style="width:24px;"/>
              <col style="width:24px;"/>
              <col style="width:60px;"/>
              <col style="width:62px;"/>
            </colgroup>
            <thead>
              <tr style="background:#e8e8e8;">
                <th style="border:1px solid #000;padding:2px 1px;font-size:8px;text-align:center;font-weight:700;overflow:hidden;">SR</th>
                <th style="border:1px solid #000;padding:2px 2px;font-size:8px;font-family:${UF};text-align:center;font-weight:700;direction:rtl;">نام آئٹم</th>
                <th style="border:1px solid #000;padding:2px 1px;font-size:8px;text-align:center;font-weight:700;overflow:hidden;">Qty</th>
                <th style="border:1px solid #000;padding:2px 1px;font-size:8px;text-align:center;font-weight:700;overflow:hidden;">CTN</th>
                <th style="border:1px solid #000;padding:2px 1px;font-size:8px;text-align:center;font-weight:700;overflow:hidden;">قیمت</th>
                <th style="border:1px solid #000;padding:2px 1px;font-size:8px;text-align:center;font-weight:700;overflow:hidden;">کل</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background:#e8e8e8;">
                <td colspan="2" style="border:1px solid #000;padding:2px 4px;font-size:9px;font-family:${UF};direction:rtl;text-align:right;font-weight:700;">کل تعداد</td>
                <td style="border:1px solid #000;padding:2px 1px;font-size:9px;text-align:center;font-weight:700;">${totalQty}</td>
                <td style="border:1px solid #000;padding:2px 1px;font-size:9px;text-align:center;font-weight:700;">${totalCtn}</td>
                <td style="border:1px solid #000;"></td>
                <td style="border:1px solid #000;padding:2px 1px;font-size:9px;direction:ltr;text-align:center;font-weight:700;">${fmtCur(subtotal)}</td>
              </tr>
            </tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;margin-top:5px;">
            ${sumR("سب ٹوٹل :", fmtCur(subtotal))}
            ${discount > 0 ? sumR(`ڈسکاؤنٹ (${inv.discountPercent||0}%) :`, `- ${fmtCur(discount)}`) : ""}
            ${tax > 0 ? sumR(`ٹیکس (${inv.taxPercent||0}%) :`, fmtCur(tax)) : ""}
            <tr style="border-top:1px solid #000;">
              <td style="font-size:13px;padding:4px 3px;font-family:${UF};direction:rtl;text-align:right;font-weight:900;">کل ٹوٹل :</td>
              <td style="font-size:13px;padding:4px 3px;direction:ltr;text-align:left;font-weight:900;">${fmtCur(total)}</td>
            </tr>
            ${payStatus !== "paid" ? `
              ${advance > 0 ? sumR("ایڈوانس وصول :", `- ${fmtCur(advance)}`) : ""}
              ${extraPay > 0 ? sumR("دیگر ادائیگی :", `- ${fmtCur(extraPay)}`) : ""}
              <tr style="border-top:1px dashed #000;">
                <td style="font-size:13px;padding:4px 3px;font-family:${UF};direction:rtl;text-align:right;font-weight:900;color:#c00;">ادھار باقی :</td>
                <td style="font-size:13px;padding:4px 3px;direction:ltr;text-align:left;font-weight:900;color:#c00;">${fmtCur(remaining)}</td>
              </tr>` : ``}
          </table>

          ${inv.notes ? `<div style="border-top:1px dashed #000;margin:5px 0;padding-top:4px;font-size:10px;font-family:${UF};direction:rtl;text-align:right;"><strong>نوٹ:</strong> ${inv.notes}</div>` : ""}

          <div style="border-top:1px dashed #000;margin:6px 0;"></div>

          <div style="text-align:center;margin-top:16px;padding-top:8px;">
            <div style="font-size:11px;font-weight:700;font-family:${UF};direction:rtl;margin-bottom:8px;">${thankYouMsg}</div>
            <div style="font-size:9px;color:#555;direction:ltr;margin-top:10px;padding-top:6px;border-top:1px dotted #ccc;">Software Developed by Mudassar Latif · 03287458137</div>
          </div>
        </div>`;

      // ── Render, capture, save as 80mm thermal PDF ────────────────────
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:298px;background:#fff;";
      container.innerHTML = thermalHTML;
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 400));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: 298,
        windowWidth: 298,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdfW   = 80;
      const pdfH   = (canvas.height / canvas.width) * 80;
      const pdf    = new jsPDF({ unit: "mm", format: [pdfW, pdfH], orientation: "portrait" });
      const margin = 2;
      const printW = pdfW - margin * 2;
      const printH = (canvas.height / canvas.width) * printW;
      pdf.addImage(imgData, "PNG", margin, margin, printW, printH);

      pdf.save(`Invoice-${String(inv.invoiceNumber || inv.id).padStart(3, "0")}.pdf`);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingInvoice) return;
    onDeleteInvoice(deletingInvoice.id, deletingInvoice.source);
    setDeletingInvoice(null);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/80">
      {/* Stats */}
      <div className="px-4 sm:px-6 pt-4 pb-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" label="Total Invoices" value={stats.total} color="blue" />
          <StatCard icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="emerald" />
          <StatCard icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" label="Today's Invoices" value={stats.todayCount} color="amber" />
          <StatCard icon="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" label="Custom Invoices" value={stats.customCount} color="violet" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 sm:px-6 py-3">
        <div className="flex flex-col gap-3">
          {/* Search + Category + New Invoice — desktop row */}
          <div className="flex items-stretch gap-3">
            <div className="flex flex-1 items-center gap-2 bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Invoice # or customer name..."
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
              {search && <button onClick={() => setSearch("")} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>}
            </div>
            {/* Type filter — desktop only (shown inline) */}
            <div className="hidden sm:flex relative flex-shrink-0">
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl shadow-sm px-3 py-2.5 pr-8 text-sm text-slate-700 outline-none cursor-pointer h-full min-w-[140px]">
                <option value="all">All Categories</option>
                <option value="manual">Custom</option>
                <option value="pos">POS Sale</option>
              </select>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            {/* New Invoice button — desktop only */}
            <button onClick={() => setShowForm(true)}
              className="hidden sm:flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-colors flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              New Invoice
            </button>
          </div>
          {/* Category filter — mobile only, below search */}
          <div className="sm:hidden relative">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl shadow-sm px-3.5 py-2.5 pr-9 text-sm text-slate-700 outline-none cursor-pointer">
              <option value="all">All Categories</option>
              <option value="manual">Custom</option>
              <option value="pos">POS Sale</option>
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
          {/* New Invoice button — mobile only, full width */}
          <button onClick={() => setShowForm(true)}
            className="sm:hidden w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            New Invoice
          </button>
        </div>
      </div>

      {/* Invoice List */}
      <div className="px-4 sm:px-6 pb-6">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-700 mb-1">No invoices yet</h3>
            <p className="text-sm text-slate-400 mb-5">Make a sale from POS or create a custom invoice</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Create First Invoice
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <p className="text-slate-500">No invoices match the current filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70">
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Invoice #</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Items</th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</th>
                    <th className="px-5 py-3.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-bold text-blue-600 text-sm">#{String(inv.invoiceNumber || inv.id).padStart(3, "0")}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800 text-sm">{inv.customerName || "Walk-in Customer"}</p>
                        {inv.customerPhone && <p className="text-xs text-slate-400 mt-0.5">{inv.customerPhone}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{formatDateTime(inv.createdAt)}</td>
                      <td className="px-5 py-4"><SourceBadge source={inv.source} /></td>
                      <td className="px-5 py-4"><PaymentStatusBadge invoice={inv} /></td>
                      <td className="px-5 py-4 text-sm text-slate-600">{inv.items?.length || 0} item{inv.items?.length !== 1 ? "s" : ""}</td>
                      <td className="px-5 py-4 text-right font-black text-slate-800">{formatCurrency(inv.total)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print */}
                          <button onClick={() => setSelectedInvoice(inv)} title="Print"
                            className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                          </button>
                          {/* Download */}
                          <button onClick={() => handleDownloadInvoice(inv)} title="Download"
                            className="w-8 h-8 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                          {/* Edit — all invoices */}
                          <button onClick={() => setEditingInvoice(inv)} title="Edit"
                            className="w-8 h-8 flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          {/* Delete */}
                          <button onClick={() => setDeletingInvoice(inv)} title="Delete"
                            className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="sm:hidden space-y-3">
              {filtered.map((inv) => (
                <div key={inv.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-bold text-blue-600 text-base">#{String(inv.invoiceNumber || inv.id).padStart(3, "0")}</span>
                      <div className="mt-0.5 flex gap-1.5"><SourceBadge source={inv.source} /><PaymentStatusBadge invoice={inv} /></div>
                    </div>
                    <span className="font-black text-slate-800 text-lg">{formatCurrency(inv.total)}</span>
                  </div>
                  <p className="font-semibold text-slate-700 text-sm">{inv.customerName || "Walk-in Customer"}</p>
                  {inv.customerPhone && <p className="text-xs text-slate-400">{inv.customerPhone}</p>}
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(inv.createdAt)} · {inv.items?.length || 0} items</p>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setSelectedInvoice(inv)}
                      title="Print"
                      className="flex-1 flex items-center justify-center py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect x="6" y="14" width="12" height="8" />
                      </svg>
                    </button>
                    <button onClick={() => handleDownloadInvoice(inv)}
                      title="Download"
                      className="flex-1 flex items-center justify-center py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                    <button onClick={() => setEditingInvoice(inv)}
                      title="Edit"
                      className="flex-1 flex items-center justify-center py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button onClick={() => setDeletingInvoice(inv)}
                      title="Delete"
                      className="flex-1 flex items-center justify-center py-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <InvoiceFormModal products={products} customers={customers} allInvoices={invoices} onSave={handleCreate} onClose={() => setShowForm(false)} />
      )}
      {editingInvoice && (
        <InvoiceFormModal products={products} customers={customers} allInvoices={invoices} existingInvoice={editingInvoice} onSave={handleUpdate} onClose={() => setEditingInvoice(null)} />
      )}
      {selectedInvoice && (
        <InvoicePrintModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} invoiceSettings={invoiceSettings} allInvoices={invoices} />
      )}
      {deletingInvoice && (
        <DeleteConfirmModal invoice={deletingInvoice} onConfirm={handleDeleteConfirm} onClose={() => setDeletingInvoice(null)} />
      )}
    </div>
  );
}
