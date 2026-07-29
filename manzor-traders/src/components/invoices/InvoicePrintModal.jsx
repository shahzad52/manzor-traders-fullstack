import { useState } from "react";
import { formatCurrency } from "../../utils/productHelpers";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function formatDateUrdu(iso) {
  const d = new Date(iso);
  const urduMonths = ["جنوری","فروری","مارچ","اپریل","مئی","جون","جولائی","اگست","ستمبر","اکتوبر","نومبر","دسمبر"];
  const day = String(d.getDate()).padStart(2,"0");
  const month = urduMonths[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}
function formatTimeUrdu(iso) {
  const d = new Date(iso);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2,"0");
  const ampm = hours >= 12 ? "شام" : "صبح";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2,"0")}:${minutes} ${ampm}`;
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("en-PK", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export default function InvoicePrintModal({ invoice, onClose, invoiceSettings = {}, allInvoices = [] }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!invoice) return null;

  const subtotal = invoice.subtotal || invoice.items?.reduce((s, i) => s + i.lineTotal, 0) || 0;
  const discount = invoice.discount || 0;
  const tax = invoice.tax || 0;
  const total = invoice.total || 0;
  const advance = invoice.advance || 0;
  const extraPayments = (invoice.payments || []).filter(p => !p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
  const totalReceived = advance + extraPayments;
  const remainingDue = Math.max(0, total - totalReceived);
  const paymentStatus = invoice.paymentStatus || (remainingDue <= 0 ? "paid" : "udaar");

  // پچھلا ادھار: ab real-time calculate karo — invoice save hone ke waqt ka pichla udaar
  // aur abhi kitna wasol hua aur kitna baqi hai
  const prevUdaar = invoice.previousUdaar || 0;
  const showPrevUdaar = invoice.showPreviousUdaarOnInvoice && prevUdaar > 0;

  // Un invoices ka status check karo jinse pichla udaar tha (invoice save hone se pehle ki invoices)
  const prevUdaarPaidStatus = (() => {
    if (!showPrevUdaar || allInvoices.length === 0) return null;
    const invoiceDate = invoice.createdAt ? new Date(invoice.createdAt) : null;
    if (!invoiceDate) return null;
    const custId = invoice.customerId;
    const custName = invoice.customerName;
    // Is invoice se pehle ki customer ki invoices jo udaar mein thi
    const prevInvoices = allInvoices.filter(inv => {
      if (String(inv.id) === String(invoice.id)) return false;
      if (new Date(inv.createdAt) >= invoiceDate) return false;
      if (custId && inv.customerId && String(inv.customerId) === String(custId)) return true;
      if (!inv.customerId && inv.customerName &&
        inv.customerName.trim().toLowerCase() === custName?.trim().toLowerCase()) return true;
      return false;
    });
    // Kitna wasol hua un purani invoices mein se
    let totalPrevDue = 0;
    let totalPrevPaid = 0;
    prevInvoices.forEach(inv => {
      const advInPay = (inv.payments || []).filter(p => p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const otherPay = (inv.payments || []).filter(p => !p.note?.includes("Advance at sale")).reduce((s, p) => s + (p.amount || 0), 0);
      const adv = advInPay > 0 ? 0 : (inv.advance || 0);
      const due = Math.max(0, (inv.total || 0) - advInPay - adv);
      totalPrevDue += due;
      totalPrevPaid += Math.min(otherPay, due);
    });
    // Sirf prevUdaar amount tak limit karo
    const wasol = Math.min(totalPrevPaid, prevUdaar);
    const baqi = Math.max(0, prevUdaar - wasol);
    return { wasol, baqi };
  })();

  const billedFrom = {
    name: invoiceSettings.ownerName || "",
    business: invoiceSettings.businessName || "",
    phone: invoiceSettings.phone || "",
    name2: invoiceSettings.ownerName2 || "",
    phone2: invoiceSettings.phone2 || "",
    address: invoiceSettings.address || "",
    logo: invoiceSettings.logo || "",
  };

  const thankYouMsg = invoiceSettings.thankYouMessage || "Thank you for your business!";
  const invoiceHeading = invoiceSettings.invoiceHeading || "";
  const displayName = billedFrom.business || billedFrom.name || "My Business";
  const UF = `'Noto Nastaliq Urdu','Jameel Noori Nastaleeq','Arial Unicode MS',sans-serif`;

  /* ─── THERMAL HTML (80mm = 302px at 96dpi) ─── */
  const getThermalHTML = () => {
    const totalQty = invoice.items?.reduce((s, i) => s + i.qty, 0) || 0;
    const totalCtn = invoice.items?.reduce((s, i) => s + (i.ctn || 0), 0) || 0;

    const rowsHtml = invoice.items?.map((item, i) => `
      <tr>
        <td style="border:0.5px solid #000;padding:5px 1px;font-size:9px;font-weight:900;color:#000;text-align:center;vertical-align:middle;">${i+1}</td>
        <td style="border:0.5px solid #000;padding:5px 2px;font-size:10px;font-weight:900;color:#000;font-family:${UF};direction:rtl;text-align:right;vertical-align:middle;word-break:break-word;line-height:1.2;">${item.name}</td>
        <td style="border:0.5px solid #000;padding:5px 1px;font-size:9px;font-weight:900;color:#000;text-align:center;vertical-align:middle;">${item.qty}</td>
        <td style="border:0.5px solid #000;padding:5px 1px;font-size:9px;font-weight:900;color:#000;text-align:center;vertical-align:middle;">${item.ctn !== undefined ? item.ctn : 0}</td>
        <td style="border:0.5px solid #000;padding:5px 1px;font-size:9px;font-weight:900;color:#000;text-align:center;vertical-align:middle;">${formatCurrency(item.unitPrice)}</td>
        <td style="border:0.5px solid #000;padding:5px 1px;font-size:9px;font-weight:900;color:#000;text-align:center;vertical-align:middle;">${formatCurrency(item.lineTotal)}</td>
      </tr>`).join("") || "";

    const infoRow = (label, value, valueBold = false) =>
      `<tr>
        <td style="font-size:13px;padding:2px 3px;font-weight:900;color:#000;font-family:${UF};direction:rtl;text-align:right;white-space:nowrap;vertical-align:top;width:45%;">${label}</td>
        <td style="font-size:13px;padding:2px 3px;font-weight:900;color:#000;direction:ltr;text-align:left;vertical-align:top;word-break:break-word;width:55%;">${value}</td>
      </tr>`;

    const sumRow = (label, value, big = false) =>
      `<tr>
        <td style="font-size:${big?13:13}px;padding:${big?3:2}px 2px;font-family:${UF};direction:rtl;text-align:right;font-weight:900;color:#000;vertical-align:middle;width:55%;">${label}</td>
        <td style="font-size:${big?13:13}px;padding:${big?3:2}px 2px;direction:ltr;text-align:left;font-weight:900;color:#000;vertical-align:middle;width:45%;">${value}</td>
      </tr>`;

    return `
      <div style="width:100%;margin:0;padding:2px 3px;color:#000;background:#fff;font-family:Arial,sans-serif;box-sizing:border-box;direction:rtl;">

        <!-- HEADER -->
        <div style="text-align:center;margin-bottom:4px;">
          ${invoiceHeading ? `<div style="font-size:12px;color:#000;font-weight:900;font-family:${UF};margin-bottom:3px;">${invoiceHeading}</div>` : ""}
          ${billedFrom.logo
            ? `<img src="${billedFrom.logo}" alt="Logo" style="max-width:60px;max-height:35px;display:block;margin:0 auto 3px;" />`
            : `<div style="font-size:15px;font-weight:900;color:#000;font-family:${UF};margin-bottom:2px;">${displayName}</div>`
          }
          ${billedFrom.logo && billedFrom.business ? `<div style="font-size:13px;font-weight:900;color:#000;font-family:${UF};margin-bottom:2px;">${billedFrom.business}</div>` : ""}
          ${billedFrom.address ? `<div style="font-size:13px;font-weight:900;color:#000;font-family:${UF};margin-top:2px;">${billedFrom.address}</div>` : ""}
          ${(billedFrom.name && (billedFrom.logo || billedFrom.business)) || billedFrom.phone ? `<div style="font-size:12px;font-weight:900;color:#000;font-family:${UF};margin-top:2px;display:flex;justify-content:center;gap:20px;">${billedFrom.name && (billedFrom.logo || billedFrom.business) ? `<span>${billedFrom.name}</span>` : ""}<span style="direction:ltr;">${billedFrom.phone || ""}</span></div>` : ""}
          ${billedFrom.name2 || billedFrom.phone2 ? `<div style="font-size:12px;font-weight:900;color:#000;font-family:${UF};margin-top:2px;display:flex;justify-content:center;gap:20px;">${billedFrom.name2 ? `<span>${billedFrom.name2}</span>` : ""}<span style="direction:ltr;">${billedFrom.phone2 || ""}</span></div>` : ""}
        </div>

        <div style="border-top:2px solid #000;margin:3px 0;"></div>

        <!-- INFO -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:3px;">
          <tbody>
            <tr>
              <td colspan="2" style="font-size:13px;padding:2px 3px;font-weight:900;color:#000;font-family:${UF};direction:rtl;text-align:right;white-space:nowrap;">انوائس نمبر : #${String(invoice.invoiceNumber || invoice.id).padStart(3,"0")}</td>
            </tr>
            <tr>
              <td colspan="2" style="font-size:13px;padding:2px 3px;font-weight:900;color:#000;font-family:${UF};direction:rtl;text-align:right;white-space:nowrap;"><span style="font-family:${UF};">تاریخ : </span><span style="direction:ltr;unicode-bidi:embed;">${formatDate(invoice.createdAt)} ${formatTime(invoice.createdAt)}</span></td>
            </tr>
            <tr>
              <td colspan="2" style="font-size:13px;padding:2px 3px;font-weight:900;color:#000;font-family:${UF};direction:rtl;text-align:right;">نام کسٹمر : ${invoice.customerName || "کیش کسٹمر"}</td>
            </tr>
            ${invoice.customerAddress ? `<tr><td colspan="2" style="font-size:13px;padding:2px 3px;font-weight:900;color:#000;font-family:${UF};direction:rtl;text-align:right;">ایڈریس : ${invoice.customerAddress}</td></tr>` : ""}
          </tbody>
        </table>

        <!-- ITEMS TABLE -->
        <table style="width:100%;border-collapse:collapse;table-layout:fixed;max-width:100%;">
          <colgroup>
            <col style="width:9%;"/>
            <col style="width:33%;"/>
            <col style="width:11%;"/>
            <col style="width:11%;"/>
            <col style="width:17%;"/>
            <col style="width:17%;"/>
          </colgroup>
          <thead>
            <tr>
              <th style="border:0.5px solid #000;padding:2px 1px;font-size:10px;text-align:center;font-weight:900;color:#000;">SR</th>
              <th style="border:0.5px solid #000;padding:2px 1px;font-size:10px;font-family:${UF};text-align:center;font-weight:900;color:#000;">نام آئٹم</th>
              <th style="border:0.5px solid #000;padding:2px 1px;font-size:10px;font-family:${UF};text-align:center;font-weight:900;color:#000;">تعداد</th>
              <th style="border:0.5px solid #000;padding:2px 1px;font-size:10px;text-align:center;font-weight:900;color:#000;">CTN</th>
              <th style="border:0.5px solid #000;padding:2px 1px;font-size:10px;font-family:${UF};text-align:center;font-weight:900;color:#000;">قیمت</th>
              <th style="border:0.5px solid #000;padding:2px 1px;font-size:10px;font-family:${UF};text-align:center;font-weight:900;color:#000;">کل</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr>
              <td colspan="2" style="border:0.5px solid #000;padding:1px 2px;font-size:10px;font-family:${UF};text-align:center;font-weight:900;color:#000;">کل تعداد</td>
              <td style="border:0.5px solid #000;padding:1px 1px;font-size:10px;text-align:center;font-weight:900;color:#000;">${totalQty}</td>
              <td style="border:0.5px solid #000;padding:1px 1px;font-size:10px;text-align:center;font-weight:900;color:#000;">${totalCtn}</td>
              <td style="border:0.5px solid #000;"></td>
              <td style="border:0.5px solid #000;padding:1px 1px;font-size:10px;text-align:center;font-weight:900;color:#000;">${formatCurrency(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        <!-- TOTALS -->
        <table style="width:100%;border-collapse:collapse;margin-top:3px;">
          <tbody>
            ${discount > 0 ? sumRow(`ڈسکاؤنٹ (${invoice.discountPercent||0}%) :`, `- ${formatCurrency(discount)}`) : ""}
            ${tax > 0 ? sumRow(`ٹیکس (${invoice.taxPercent||0}%) :`, formatCurrency(tax)) : ""}
            <tr>
              <td style="font-size:13px;padding:3px 2px;font-family:${UF};direction:rtl;text-align:right;font-weight:900;color:#000;width:55%;">کل ٹوٹل :</td>
              <td style="font-size:13px;padding:3px 2px;direction:ltr;text-align:left;font-weight:900;color:#000;width:45%;">${formatCurrency(total)}</td>
            </tr>
            ${paymentStatus !== "paid" ? `
              ${advance > 0 ? sumRow("ایڈوانس وصول :", `- ${formatCurrency(advance)}`) : ""}
              ${extraPayments > 0 ? sumRow("دیگر ادائیگی :", `- ${formatCurrency(extraPayments)}`) : ""}
              <tr style="border-top:2px dashed #000;">
                <td style="font-size:13px;padding:3px 2px;font-family:${UF};direction:rtl;text-align:right;font-weight:900;color:#000;width:55%;">ادھار باقی :</td>
                <td style="font-size:13px;padding:3px 2px;direction:ltr;text-align:left;font-weight:900;color:#000;width:45%;">${formatCurrency(remainingDue)}</td>
              </tr>
            ` : ``}
            ${showPrevUdaar ? `
              <tr style="border-top:2px solid #000;margin-top:4px;">
                <td colspan="2" style="font-size:12px;padding:3px 2px;font-family:${UF};direction:rtl;text-align:center;font-weight:900;color:#000;">─── پچھلا ادھار ───</td>
              </tr>
              ${sumRow("پچھلا ادھار :", formatCurrency(prevUdaar))}
            ` : ""}
          </tbody>
        </table>

        ${invoice.notes ? `
          <div style="border-top:1px dashed #000;margin:3px 0;padding-top:3px;font-size:9px;font-weight:700;color:#000;font-family:${UF};direction:rtl;text-align:right;">
            <strong>نوٹ:</strong> ${invoice.notes}
          </div>
        ` : ""}

        <div style="border-top:2px solid #000;margin:4px 0;"></div>

        <!-- FOOTER -->
        <div style="text-align:center;padding-bottom:5px;">
          <div style="font-size:13px;font-weight:900;color:#000;font-family:${UF};margin-bottom:6px;">${thankYouMsg}</div>
          <div style="border-top:1px dotted #000;padding-top:5px;">
            <div style="font-size:11px;color:#000;font-weight:900;direction:ltr;margin-bottom:4px;">Software Developed by TechRiwaayat · 03263555252</div>
          </div>
        </div>

      </div>`;
  };

  /* ─── PRINT ─── */
  const handlePrint = () => {
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) { alert("Popup blocked! Please allow popups."); return; }
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Invoice #${String(invoice.invoiceNumber || invoice.id).padStart(3,"0")}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    * { margin: 0 !important; box-sizing: border-box !important; }
    body, div, h1, h2, h3, h4, h5, h6, p { padding: 0 !important; }
    html, body {
      width: 100%;
      max-width: 80mm;
      margin: 0 auto !important;
      background: #fff;
      overflow: visible !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    table { width: 100% !important; max-width: 100%; word-break: break-word; }
    img { max-width: 100%; }
    tr, td, th { page-break-inside: avoid; }
    .print-safe-area { padding-left: 2mm !important; padding-right: 2mm !important; }
    @media print {
      @page {
        size: 80mm auto;
        margin: 0 4mm 0 5mm;
      }
      html, body {
        width: 100% !important;
        max-width: 80mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      .print-safe-area { padding-left: 2mm !important; padding-right: 2mm !important; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-safe-area">
  ${getThermalHTML()}
  </div>
  <script>
    window.onload = function() {
      document.fonts.ready.then(function() {
        setTimeout(function() {
          window.print();
          setTimeout(function() { window.close(); }, 1500);
        }, 300);
      });
    };
  </script>
</body>
</html>`);
    win.document.close();
  };

  /* ─── DOWNLOAD PDF ─── */
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const MM_TO_PX = 3.7795275591;
      const widthPx = Math.round(80 * MM_TO_PX);
      const container = document.createElement("div");
      container.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${widthPx}px;background:#ffffff;`;
      container.innerHTML = getThermalHTML();
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 500));
      const canvas = await html2canvas(container, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: widthPx,
        windowWidth: widthPx,
      });
      document.body.removeChild(container);
      const imgData = canvas.toDataURL("image/png");
      const pdfW = 80;
      const pdfH = Math.ceil((canvas.height / canvas.width) * pdfW);
      const pdf = new jsPDF({ unit: "mm", format: [pdfW, pdfH], orientation: "portrait" });
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`Invoice-${String(invoice.invoiceNumber || invoice.id).padStart(3,"0")}.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  /* ─── JSX PREVIEW ─── */
  const infoStyle = { fontFamily: UF, direction: "rtl", textAlign: "right", fontSize: 13, fontWeight: 900, color: "#000000", padding: "1px 2px", whiteSpace: "nowrap", verticalAlign: "top", width: "45%" };
  const valStyle  = { fontSize: 13, fontWeight: 900, color: "#000000", padding: "1px 2px", direction: "ltr", textAlign: "left", verticalAlign: "top", wordBreak: "break-word", width: "55%" };
  const totalQty = invoice.items?.reduce((s,i) => s + i.qty, 0) || 0;
  const totalCtn = invoice.items?.reduce((s,i) => s + (i.ctn || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col max-h-[95vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Invoice #{String(invoice.invoiceNumber || invoice.id).padStart(3,"0")}</h2>
              <p className="text-xs text-slate-400">{formatDate(invoice.createdAt)} · {formatTime(invoice.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl transition-all"
              style={{
                background: isDownloading ? "linear-gradient(135deg,#374151,#1e3a8a)" : "linear-gradient(135deg,#0f172a,#1e3a8a)",
                color: "#fff", boxShadow: "0 4px 14px rgba(30,58,138,0.35)",
                opacity: isDownloading ? 0.75 : 1, cursor: isDownloading ? "not-allowed" : "pointer",
              }}
            >
              {isDownloading ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  Saving...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/>
                    <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
                  </svg>
                  Thermal PDF
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>

            <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        {/* Thermal Preview — 80mm simulation */}
        <div className="overflow-y-auto flex-1 p-4 bg-slate-100">
          <div className="bg-white shadow mx-auto" style={{ width: 302, color: "#000" }}>
            <div style={{ padding: "6px 6px", direction: "rtl" }}>

              {/* HEADER */}
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                {invoiceHeading && <div style={{ fontSize: 12, color: "#000", fontWeight: 900, fontFamily: UF, marginBottom: 3 }}>{invoiceHeading}</div>}
                {billedFrom.logo
                  ? <img src={billedFrom.logo} alt="logo" style={{ maxWidth: 60, maxHeight: 35, display: "block", margin: "0 auto 3px" }} />
                  : <div style={{ fontSize: 15, fontWeight: 900, color: "#000", fontFamily: UF, marginBottom: 2 }}>{displayName}</div>
                }
                {billedFrom.logo && billedFrom.business && <div style={{ fontSize: 13, fontWeight: 900, color: "#000", fontFamily: UF, marginBottom: 2 }}>{billedFrom.business}</div>}
                {billedFrom.address && <div style={{ fontSize: 13, fontWeight: 900, color: "#000", fontFamily: UF, marginTop: 2 }}>{billedFrom.address}</div>}
                {((billedFrom.name && (billedFrom.logo || billedFrom.business)) || billedFrom.phone) && <div style={{ fontSize: 12, fontWeight: 900, color: "#000", fontFamily: UF, marginTop: 2, display: "flex", justifyContent: "center", gap: 20 }}>{billedFrom.name && (billedFrom.logo || billedFrom.business) && <span>{billedFrom.name}</span>}<span style={{ direction: "ltr" }}>{billedFrom.phone}</span></div>}
                {(billedFrom.name2 || billedFrom.phone2) && <div style={{ fontSize: 12, fontWeight: 900, color: "#000", fontFamily: UF, marginTop: 2, display: "flex", justifyContent: "center", gap: 20 }}>{billedFrom.name2 && <span>{billedFrom.name2}</span>}<span style={{ direction: "ltr" }}>{billedFrom.phone2}</span></div>}
              </div>

              <div style={{ borderTop: "2px solid #000", margin: "3px 0" }} />

              {/* INFO */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 3 }}>
                <tbody>
                  <tr>
                    <td colSpan={2} style={{ ...infoStyle, fontWeight: 900, width: "100%" }}>انوائس نمبر : #{String(invoice.invoiceNumber || invoice.id).padStart(3,"0")}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ ...infoStyle, fontWeight: 900, width: "100%" }}>
                      تاریخ : <span style={{ direction: "ltr", unicodeBidi: "embed" }}>{formatDate(invoice.createdAt)} {formatTime(invoice.createdAt)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} style={{ ...infoStyle, fontWeight: 900, width: "100%" }}>نام کسٹمر : {invoice.customerName || "کیش کسٹمر"}</td>
                  </tr>
                  {invoice.customerAddress && (
                    <tr>
                      <td colSpan={2} style={{ ...infoStyle, fontWeight: 900, width: "100%" }}>ایڈریس : {invoice.customerAddress}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* ITEMS TABLE */}
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "9%" }} /><col style={{ width: "33%" }} />
                  <col style={{ width: "11%" }} /><col style={{ width: "11%" }} />
                  <col style={{ width: "17%" }} /><col style={{ width: "17%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ border: "0.5px solid #000", padding: "2px 1px", fontSize: 10, textAlign: "center", fontWeight: 900, color: "#000" }}>SR</th>
                    <th style={{ border: "0.5px solid #000", padding: "2px 1px", fontSize: 10, fontFamily: UF, textAlign: "center", fontWeight: 900, color: "#000" }}>نام آئٹم</th>
                    <th style={{ border: "0.5px solid #000", padding: "2px 1px", fontSize: 10, fontFamily: UF, textAlign: "center", fontWeight: 900, color: "#000" }}>تعداد</th>
                    <th style={{ border: "0.5px solid #000", padding: "2px 1px", fontSize: 10, textAlign: "center", fontWeight: 900, color: "#000" }}>CTN</th>
                    <th style={{ border: "0.5px solid #000", padding: "2px 1px", fontSize: 10, fontFamily: UF, textAlign: "center", fontWeight: 900, color: "#000" }}>قیمت</th>
                    <th style={{ border: "0.5px solid #000", padding: "2px 1px", fontSize: 10, fontFamily: UF, textAlign: "center", fontWeight: 900, color: "#000" }}>کل</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ border: "0.5px solid #000", padding: "5px 1px", fontSize: 9, fontWeight: 900, color: "#000", textAlign: "center", verticalAlign: "middle" }}>{idx + 1}</td>
                      <td style={{ border: "0.5px solid #000", padding: "5px 2px", fontSize: 10, fontWeight: 900, color: "#000", fontFamily: UF, direction: "rtl", textAlign: "right", verticalAlign: "middle", wordBreak: "break-word", lineHeight: 1.2 }}>{item.name}</td>
                      <td style={{ border: "0.5px solid #000", padding: "5px 1px", fontSize: 9, fontWeight: 900, color: "#000", textAlign: "center", verticalAlign: "middle" }}>{item.qty}</td>
                      <td style={{ border: "0.5px solid #000", padding: "5px 1px", fontSize: 9, fontWeight: 900, color: "#000", textAlign: "center", verticalAlign: "middle" }}>{item.ctn !== undefined ? item.ctn : 0}</td>
                      <td style={{ border: "0.5px solid #000", padding: "5px 1px", fontSize: 9, fontWeight: 900, color: "#000", textAlign: "center", verticalAlign: "middle" }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ border: "0.5px solid #000", padding: "5px 1px", fontSize: 9, fontWeight: 900, color: "#000", textAlign: "center", verticalAlign: "middle" }}>{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} style={{ border: "0.5px solid #000", padding: "1px 2px", fontSize: 10, fontFamily: UF, textAlign: "center", fontWeight: 900, color: "#000" }}>کل تعداد</td>
                    <td style={{ border: "0.5px solid #000", padding: "1px 1px", fontSize: 10, textAlign: "center", fontWeight: 900, color: "#000" }}>{totalQty}</td>
                    <td style={{ border: "0.5px solid #000", padding: "1px 1px", fontSize: 10, textAlign: "center", fontWeight: 900, color: "#000" }}>{totalCtn}</td>
                    <td style={{ border: "0.5px solid #000" }} />
                    <td style={{ border: "0.5px solid #000", padding: "1px 1px", fontSize: 10, textAlign: "center", fontWeight: 900, color: "#000" }}>{formatCurrency(subtotal)}</td>
                  </tr>
                </tbody>
              </table>

              {/* TOTALS */}
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 3 }}>
                <tbody>
                  {discount > 0 && <tr><td style={{ ...infoStyle, width: "55%" }}>ڈسکاؤنٹ ({invoice.discountPercent||0}%) :</td><td style={{ ...valStyle, width: "45%" }}>- {formatCurrency(discount)}</td></tr>}
                  {tax > 0 && <tr><td style={{ ...infoStyle, width: "55%" }}>ٹیکس ({invoice.taxPercent||0}%) :</td><td style={{ ...valStyle, width: "45%" }}>{formatCurrency(tax)}</td></tr>}
                  <tr>
                    <td style={{ ...infoStyle, fontSize: 13, fontWeight: 900, width: "55%" }}>کل ٹوٹل :</td>
                    <td style={{ ...valStyle, fontSize: 13, fontWeight: 900, width: "45%" }}>{formatCurrency(total)}</td>
                  </tr>
                  {paymentStatus !== "paid" ? (
                    <>
                      {advance > 0 && <tr><td style={{ ...infoStyle, width: "55%" }}>ایڈوانس وصول :</td><td style={{ ...valStyle, width: "45%" }}>- {formatCurrency(advance)}</td></tr>}
                      {extraPayments > 0 && <tr><td style={{ ...infoStyle, width: "55%" }}>دیگر ادائیگی :</td><td style={{ ...valStyle, width: "45%" }}>- {formatCurrency(extraPayments)}</td></tr>}
                      <tr style={{ borderTop: "2px dashed #000" }}>
                        <td style={{ ...infoStyle, fontSize: 13, fontWeight: 900, width: "55%" }}>ادھار باقی :</td>
                        <td style={{ ...valStyle, fontSize: 13, fontWeight: 900, width: "45%" }}>{formatCurrency(remainingDue)}</td>
                      </tr>
                    </>
                  ) : null}
                  {showPrevUdaar ? (
                    <>
                      <tr style={{ borderTop: "2px solid #000" }}>
                        <td colSpan={2} style={{ textAlign: "center", fontSize: 12, fontFamily: UF, color: "#000", fontWeight: 900, padding: "3px" }}>─── پچھلا ادھار ───</td>
                      </tr>
                      <tr>
                        <td style={{ ...infoStyle, width: "55%" }}>پچھلا ادھار :</td>
                        <td style={{ ...valStyle, width: "45%" }}>{formatCurrency(prevUdaar)}</td>
                      </tr>
                    </>
                  ) : null}
                </tbody>
              </table>

              {invoice.notes && (
                <div style={{ borderTop: "1px dashed #000", margin: "3px 0", paddingTop: 3, fontSize: 9, fontWeight: 700, color: "#000", fontFamily: UF, textAlign: "right" }}>
                  <strong>نوٹ:</strong> {invoice.notes}
                </div>
              )}

              <div style={{ borderTop: "2px solid #000", margin: "4px 0" }} />

              <div style={{ textAlign: "center", paddingBottom: 5 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#000", fontFamily: UF, marginBottom: 6 }}>{thankYouMsg}</div>
                <div style={{ borderTop: "1px dotted #000", paddingTop: 5 }}>
                  <div style={{ fontSize: 11, color: "#000", fontWeight: 900, direction: "ltr", marginBottom: 4 }}>Software Developed by TechRiwaayat · 03263555252</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
