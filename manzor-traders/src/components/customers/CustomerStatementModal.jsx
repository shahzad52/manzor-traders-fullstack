import { useRef } from "react";
import { formatCurrency } from "../../utils/productHelpers";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });
}

export default function CustomerStatementModal({
  customer,
  ledgerEntries = [],
  invoices = [],
  totalInvoiced,
  totalPaid,
  totalDue,
  onClose,
}) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Account Statement — ${customer.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; color: #1e293b; padding: 24px; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; }
            .header h1 { font-size: 20px; font-weight: 800; color: #0f172a; }
            .header p { color: #64748b; font-size: 11px; margin-top: 2px; }
            .customer-info { display: flex; justify-content: space-between; margin-bottom: 16px; background: #f8fafc; padding: 12px 16px; border-radius: 8px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
            .summary-card { text-align: center; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; }
            .summary-card .label { font-size: 10px; color: #64748b; text-transform: uppercase; }
            .summary-card .value { font-size: 16px; font-weight: 800; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #f1f5f9; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; }
            td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
            tr:hover td { background: #f8fafc; }
            .text-right { text-align: right; }
            .debit { color: #1e293b; font-weight: 600; }
            .credit { color: #059669; font-weight: 600; }
            .balance-pos { color: #dc2626; font-weight: 800; }
            .balance-neg { color: #059669; font-weight: 800; }
            .footer-row td { font-size: 13px; font-weight: 800; background: #f1f5f9; border-top: 2px solid #cbd5e1; }
            .print-date { color: #94a3b8; font-size: 10px; text-align: right; margin-top: 16px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const today = new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Account Statement</h2>
              <p className="text-xs text-slate-400">{customer.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
              </svg>
              Print / PDF
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Statement Content */}
        <div className="overflow-y-auto flex-1 p-5">
          <div ref={printRef}>
            {/* Print Header */}
            <div className="header mb-4 pb-4 border-b border-slate-200">
              <h1 className="text-xl font-black text-slate-800">Account Statement</h1>
              <p className="text-xs text-slate-400 mt-1">Generated on {today}</p>
            </div>

            {/* Customer Info */}
            <div className="customer-info flex justify-between mb-4 bg-slate-50 rounded-xl p-4">
              <div>
                <p className="text-xs text-slate-400">Customer</p>
                <p className="font-bold text-slate-800">{customer.name}</p>
                <p className="text-sm text-slate-500">{customer.phone}</p>
                {customer.city && <p className="text-sm text-slate-400">{customer.city}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Statement Date</p>
                <p className="font-semibold text-slate-700">{today}</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="summary grid grid-cols-3 gap-3 mb-4">
              <div className="summary-card bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Invoiced</p>
                <p className="text-lg font-black text-slate-800 mt-1">{formatCurrency(totalInvoiced)}</p>
              </div>
              <div className="summary-card bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Received</p>
                <p className="text-lg font-black text-emerald-700 mt-1">{formatCurrency(totalPaid)}</p>
              </div>
              <div className={`summary-card rounded-xl p-3 text-center border ${totalDue > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"}`}>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Outstanding</p>
                <p className={`text-lg font-black mt-1 ${totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>{formatCurrency(totalDue)}</p>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Transaction Details</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-100 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">Debit</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">Credit</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledgerEntries.map((e, i) => (
                      <tr key={i} className={e.type === "payment" || e.type === "advance" ? "bg-emerald-50/40" : ""}>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(e.date)}</td>
                        <td className="px-4 py-2.5 text-slate-700 font-medium">{e.description}</td>
                        <td className="px-4 py-2.5 text-right text-slate-700 font-semibold">
                          {e.debit > 0 ? formatCurrency(e.debit) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">
                          {e.credit > 0 ? formatCurrency(e.credit) : "—"}
                        </td>
                        <td className={`px-4 py-2.5 text-right font-black ${e.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {formatCurrency(Math.abs(e.balance))}{e.balance < 0 ? " CR" : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 bg-slate-100">
                      <td colSpan={4} className="px-4 py-3 text-sm font-black text-slate-700 text-right">
                        Current Outstanding Balance:
                      </td>
                      <td className={`px-4 py-3 text-right font-black text-base ${totalDue > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatCurrency(totalDue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="print-date text-right text-xs text-slate-400">
              Printed on {new Date().toLocaleString("en-PK")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
