export default function NotificationPanel({ alerts, open, onClose }) {
  if (!open) return null;

  const outCount = alerts.filter(a => a.type === "out").length;
  const lowCount = alerts.filter(a => a.type === "low").length;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel — fixed on mobile, absolute on desktop */}
      <div className="
        fixed left-2 right-2 top-16 z-50
        sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80
        bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/80 overflow-hidden
      ">
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-sm">Stock Alerts</span>
          </div>
          <div className="flex items-center gap-1.5">
            {outCount > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                {outCount} Out
              </span>
            )}
            {lowCount > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                {lowCount} Low
              </span>
            )}
            <button onClick={onClose} className="ml-1 w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-72 overflow-y-auto">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-500">All stock levels are good!</p>
              <p className="text-xs text-slate-400">No alerts right now</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`px-4 py-3 border-b border-slate-50 last:border-0 flex items-start gap-3 ${
                  alert.type === "out" ? "bg-red-50/60" : "bg-amber-50/60"
                }`}
              >
                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  alert.type === "out" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  {alert.type === "out" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800">{alert.title}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
                      alert.type === "out" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                    }`}>
                      {alert.type === "out" ? "OUT" : "LOW"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{alert.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] text-slate-400 text-center">
              Go to <span className="font-semibold text-slate-500">Products</span> page to restock items
            </p>
          </div>
        )}
      </div>
    </>
  );
}
