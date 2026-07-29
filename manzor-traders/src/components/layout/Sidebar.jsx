import { navItems } from "../../data/mockData";

export default function Sidebar({ sidebarOpen, mobileSidebar, setMobileSidebar, activeNav, setActiveNav, setSidebarOpen, appSettings = {} }) {
  return (
    <>
      {mobileSidebar && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        className={`
          fixed lg:relative z-30 flex flex-col h-full bg-white border-r border-slate-100
          transition-all duration-300 ease-in-out shadow-sm
          ${mobileSidebar ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"}
          ${sidebarOpen ? "lg:w-64" : "lg:w-20"}
        `}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-slate-800 text-base leading-tight">{appSettings.appName || "InvManager"}</p>
              <p className="text-xs text-slate-400">{appSettings.tagline || "Pro Dashboard"}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute -right-3.5 top-16 w-7 h-7 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm hover:bg-blue-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1D6FDB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={sidebarOpen ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
          </svg>
        </button>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.label === "Dashboard" || item.label === "Products" || item.label === "Point of Sale" || item.label === "Invoices" || item.label === "Reports" || item.label === "Customers" || item.label === "Settings") {
                  setActiveNav(item.label);
                }
                setMobileSidebar(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${activeNav === item.label
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                {item.icon.split(" M").map((part, i) => (
                  <path key={i} d={i === 0 ? part : "M" + part} />
                ))}
              </svg>
              {sidebarOpen && (
                <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
              )}
            </button>
          ))}
        </nav>


      </aside>
    </>
  );
}
