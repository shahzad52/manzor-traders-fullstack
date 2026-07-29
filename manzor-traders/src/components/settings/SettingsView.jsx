import { useState, useEffect } from "react";

function openLogoIDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open("inv_settings", 1);
    r.onupgradeneeded = (e) => e.target.result.createObjectStore("logo");
    r.onsuccess = (e) => res(e.target.result);
    r.onerror = () => rej(r.error);
  });
}
async function saveLogoToIDB(dataUrl) {
  const db = await openLogoIDB();
  return new Promise((res, rej) => {
    const tx = db.transaction("logo", "readwrite");
    dataUrl ? tx.objectStore("logo").put(dataUrl, "current") : tx.objectStore("logo").delete("current");
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
}
async function loadLogoFromIDB() {
  try {
    const db = await openLogoIDB();
    return new Promise((res) => {
      const req = db.transaction("logo","readonly").objectStore("logo").get("current");
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => res(null);
    });
  } catch { return null; }
}

function Section({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/60">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
          {icon}
        </div>
        <h2 className="font-bold text-slate-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export default function SettingsView({ categories = [], addCategory, removeCategory, appSettings = {}, updateAppSettings, invoiceSettings = {}, updateInvoiceSettings, allInvoices = [], products = [], customers = [], onRestoreBackup }) {
  // App branding
  const [appName, setAppName] = useState(appSettings.appName || "InvManager");
  const [tagline, setTagline] = useState(appSettings.tagline || "Pro Dashboard");
  const [brandSaved, setBrandSaved] = useState(false);

  // Invoice Settings
  const [invOwnerName, setInvOwnerName] = useState(invoiceSettings.ownerName || "");
  const [invBusiness, setInvBusiness] = useState(invoiceSettings.businessName || "");
  const [invPhone, setInvPhone] = useState(invoiceSettings.phone || "");
  const [invOwnerName2, setInvOwnerName2] = useState(invoiceSettings.ownerName2 || "");
  const [invPhone2, setInvPhone2] = useState(invoiceSettings.phone2 || "");
  const [invAddress, setInvAddress] = useState(invoiceSettings.address || "");
  const [invLogo, setInvLogo] = useState(invoiceSettings.logo || "");
  const [logoWidth, setLogoWidth] = useState(invoiceSettings.logoWidth || 90);
  const [logoHeight, setLogoHeight] = useState(invoiceSettings.logoHeight || 56);
  const [thankYouMessage, setThankYouMessage] = useState(invoiceSettings.thankYouMessage || "Thank you for your business!");
  const [invoiceHeading, setInvoiceHeading] = useState(invoiceSettings.invoiceHeading || "");
  const [invSaved, setInvSaved] = useState(false);

  // Sync when Firestore data loads (async)
  useEffect(() => {
    if (!invoiceSettings) return;
    setInvOwnerName(invoiceSettings.ownerName || "");
    setInvBusiness(invoiceSettings.businessName || "");
    setInvPhone(invoiceSettings.phone || "");
    setInvOwnerName2(invoiceSettings.ownerName2 || "");
    setInvPhone2(invoiceSettings.phone2 || "");
    setInvAddress(invoiceSettings.address || "");
    // Logo: load from IndexedDB (no Firestore size limit)
    if (invoiceSettings.logo === "__local__") {
      loadLogoFromIDB().then((logo) => setInvLogo(logo || ""));
    } else {
      setInvLogo(invoiceSettings.logo && invoiceSettings.logo !== "__local__" ? invoiceSettings.logo : "");
    }
    setLogoWidth(invoiceSettings.logoWidth || 90);
    setLogoHeight(invoiceSettings.logoHeight || 56);
    setThankYouMessage(invoiceSettings.thankYouMessage || "Thank you for your business!");
    setInvoiceHeading(invoiceSettings.invoiceHeading || "");
  }, [invoiceSettings]);

  // Sync appSettings
  useEffect(() => {
    if (!appSettings) return;
    setAppName(appSettings.appName || "InvManager");
    setTagline(appSettings.tagline || "Pro Dashboard");
  }, [appSettings]);

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setInvLogo(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveInvoiceSettings = async () => {
    if (typeof updateInvoiceSettings === "function") {
      try { await saveLogoToIDB(invLogo || null); }
      catch (_) { if (invLogo) localStorage.setItem("inv_logo", invLogo); }
      await updateInvoiceSettings({
        ownerName: invOwnerName.trim(),
        businessName: invBusiness.trim(),
        phone: invPhone.trim(),
        ownerName2: invOwnerName2.trim(),
        phone2: invPhone2.trim(),
        address: invAddress.trim(),
        logo: invLogo ? "__local__" : "",
        logoWidth: Number(logoWidth) || 90,
        logoHeight: Number(logoHeight) || 56,
        thankYouMessage: thankYouMessage.trim() || "Thank you for your business!",
        invoiceHeading: invoiceHeading.trim(),
      });
    }
    setInvSaved(true);
    setTimeout(() => setInvSaved(false), 2000);
  };

  const handleSaveBranding = () => {
    if (!appName.trim()) return;
    updateAppSettings({ appName: appName.trim(), tagline: tagline.trim() });
    setBrandSaved(true);
    setTimeout(() => setBrandSaved(false), 2000);
  };

  // Categories
  const [newCat, setNewCat] = useState("");
  const [catError, setCatError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null); // null | 'downloading' | 'uploading' | 'success' | 'error'
  const [backupMsg, setBackupMsg] = useState("");

  const handleDownloadBackup = async () => {
    setBackupStatus("downloading");
    try {
      const logo = await loadLogoFromIDB();
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        products,
        customers,
        allInvoices,
        settings: {
          appSettings,
          invoiceSettings: { ...invoiceSettings, logo: logo || "" },
          categories,
        },
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inv-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatus("success");
      setBackupMsg("Backup download ho gaya!");
      setTimeout(() => setBackupStatus(null), 3000);
    } catch (e) {
      setBackupStatus("error");
      setBackupMsg("Backup failed: " + e.message);
    }
  };

  const handleUploadBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBackupStatus("uploading");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version || !data.allInvoices) throw new Error("Invalid backup file");

        // Actual restore karo
        if (typeof onRestoreBackup === "function") {
          await onRestoreBackup(data);
          setBackupStatus("success");
          setBackupMsg(
            `✅ Backup restore ho gaya! ${data.products?.length || 0} products, ${data.customers?.length || 0} customers, ${data.allInvoices?.length || 0} invoices restore kiye gaye. Exported: ${data.exportedAt?.slice(0, 10) || "unknown"}`
          );
        } else {
          setBackupStatus("success");
          setBackupMsg(
            `Backup loaded! ${data.products?.length || 0} products, ${data.customers?.length || 0} customers, ${data.allInvoices?.length || 0} invoices found. Exported: ${data.exportedAt?.slice(0, 10) || "unknown"}`
          );
        }
      } catch (err) {
        setBackupStatus("error");
        setBackupMsg("File galat hai ya corrupt hai: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };



  const handleAddCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed) { setCatError("Category name is required"); return; }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCatError("This category already exists");
      return;
    }
    addCategory(trimmed);
    setNewCat("");
    setCatError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddCategory();
  };

  const CAT_COLORS = [
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-violet-50 text-violet-700 border-violet-200",
    "bg-emerald-50 text-emerald-700 border-emerald-200",
    "bg-amber-50 text-amber-700 border-amber-200",
    "bg-rose-50 text-rose-700 border-rose-200",
    "bg-cyan-50 text-cyan-700 border-cyan-200",
    "bg-orange-50 text-orange-700 border-orange-200",
    "bg-indigo-50 text-indigo-700 border-indigo-200",
  ];

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50/80 px-4 sm:px-6 py-5 space-y-5">

      {/* App Branding */}
      <Section
        title="App Branding"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">App Name</label>
              <input
                type="text"
                value={appName}
                onChange={(e) => { setAppName(e.target.value); setBrandSaved(false); }}
                placeholder="InvManager"
                maxLength={24}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">Shown at the top of the sidebar</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => { setTagline(e.target.value); setBrandSaved(false); }}
                placeholder="Pro Dashboard"
                maxLength={32}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors"
              />
              <p className="text-[11px] text-slate-400 mt-1">Subtitle shown below the app name</p>
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div>
              <p className="font-bold text-slate-800 text-sm leading-tight">{appName || "InvManager"}</p>
              <p className="text-xs text-slate-400">{tagline || "Pro Dashboard"}</p>
            </div>
            <span className="ml-auto text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Preview</span>
          </div>

          <button
            onClick={handleSaveBranding}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              brandSaved
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
            }`}
          >
            {brandSaved ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                Saved!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                Save Branding
              </>
            )}
          </button>
        </div>
      </Section>

      {/* Categories */}
      <Section
        title="Product Categories"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">These categories appear in the Products page when adding or editing a product.</p>

          {/* Add new category */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Add New Category</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCat}
                onChange={(e) => { setNewCat(e.target.value); setCatError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Sports, Cosmetics, Groceries..."
                className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${catError ? "border-red-400 bg-red-50" : "border-slate-200 focus:border-blue-400"}`}
              />
              <button
                onClick={handleAddCategory}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-colors flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Add
              </button>
            </div>
            {catError && <p className="text-xs text-red-500 mt-1">{catError}</p>}
          </div>

          {/* Existing categories */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">{categories.length} Categories</label>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                No categories yet. Add one above.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, idx) => (
                  <div
                    key={cat}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${CAT_COLORS[idx % CAT_COLORS.length]}`}
                  >
                    <span>{cat}</span>
                    <button
                      onClick={() => setConfirmDelete(cat)}
                      className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors opacity-60 hover:opacity-100"
                      title={`Remove ${cat}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Invoice Settings */}
      <Section
        title="Invoice Settings"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Ye details har invoice mein "Billed From" section mein dikhegi.</p>

          {/* Logo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Business Logo</label>
            <div className="flex items-center gap-3">
              {invLogo ? (
                <img src={invLogo} alt="logo" className="h-14 w-auto max-w-[120px] object-contain rounded-lg border border-slate-200 p-1 bg-white" />
              ) : (
                <div className="h-14 w-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 bg-slate-50 text-xs text-center px-2">No Logo</div>
              )}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer px-3.5 py-2 rounded-xl border border-slate-200 hover:border-blue-400 bg-white text-sm font-medium text-slate-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </label>
                {invLogo && (
                  <button onClick={() => setInvLogo("")} className="text-xs text-red-400 hover:text-red-600 px-1">Remove logo</button>
                )}
                <p className="text-[11px] text-slate-400">PNG, JPG. Logo nahi hoga to Business Name dikhega.</p>
              </div>
            </div>
            {/* Logo size controls */}
            {invLogo && (
              <div className="flex gap-4 mt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Logo Width (px)</label>
                  <input
                    type="number"
                    min="30" max="300"
                    value={logoWidth}
                    onChange={e => setLogoWidth(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Logo Height (px)</label>
                  <input
                    type="number"
                    min="20" max="200"
                    value={logoHeight}
                    onChange={e => setLogoHeight(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <img src={invLogo} alt="preview" style={{ width: Math.min(Number(logoWidth)||90, 80), height: Math.min(Number(logoHeight)||56, 50), objectFit: "contain" }} className="rounded border border-slate-200 bg-white p-0.5" />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Owner / Contact Name</label>
              <input type="text" value={invOwnerName} onChange={e => setInvOwnerName(e.target.value)} placeholder="e.g. Mudassar Latif" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Business Name</label>
              <input type="text" value={invBusiness} onChange={e => setInvBusiness(e.target.value)} placeholder="e.g. Latif Traders" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone Number</label>
              <input type="text" value={invPhone} onChange={e => setInvPhone(e.target.value)} placeholder="e.g. 03287458137" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Address</label>
              <input type="text" value={invAddress} onChange={e => setInvAddress(e.target.value)} placeholder="e.g. Faisalabad, Punjab" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">2nd Owner / Contact Name <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="text" value={invOwnerName2} onChange={e => setInvOwnerName2(e.target.value)} placeholder="e.g. Ahmed Latif" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">2nd Owner Phone Number <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="text" value={invPhone2} onChange={e => setInvPhone2(e.target.value)} placeholder="e.g. 03001234567" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors" />
            </div>
          </div>

          {/* Invoice Heading (Business Name se uper) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Invoice Heading Text
              <span className="ml-1.5 text-[10px] font-normal text-purple-500 bg-purple-50 px-2 py-0.5 rounded-full">Business Name se UPER dikhega</span>
            </label>
            <input
              type="text"
              value={invoiceHeading}
              onChange={e => setInvoiceHeading(e.target.value)}
              placeholder="e.g. بِسْمِ اللہِ الرَّحْمٰنِ الرَّحِیْمِ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 focus:border-purple-400 bg-purple-50 text-sm outline-none transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-1">Ye text Business Name se uper chota font size mein show hoga.</p>
          </div>

          {/* Thank You Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Invoice Footer Message <span className="text-slate-400 font-normal">(Thank You line)</span></label>
            <input
              type="text"
              value={thankYouMessage}
              onChange={e => setThankYouMessage(e.target.value)}
              placeholder="e.g. Thank you for your business!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-400 text-sm outline-none transition-colors"
            />
            <p className="text-[10px] text-slate-400 mt-1">Yeh message invoice ke footer main show hoga.</p>
          </div>

          {/* Live Preview */}
          <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-400 mb-2">Preview — Invoice Header</p>
            {invoiceHeading && (
              <div className="text-center text-[10px] text-slate-500 mb-1">{invoiceHeading}</div>
            )}
            <div className="flex items-start gap-3">
              {invLogo ? (
                <img src={invLogo} alt="logo" className="h-10 w-auto object-contain rounded" />
              ) : (
                <div className="text-base font-black text-blue-900 leading-none">{invBusiness || invOwnerName || "Business Name"}</div>
              )}
              <div className="space-y-0.5 text-sm">
                {invLogo && <div className="font-bold text-slate-800">{invBusiness || "—"}</div>}
                {invAddress && <div className="text-xs text-slate-500">📍 {invAddress}</div>}
                {invOwnerName && <div className="text-xs text-slate-500">{invOwnerName}</div>}
                {invPhone && <div className="text-xs text-slate-500">📞 {invPhone}</div>}
                {invOwnerName2 && <div className="text-xs text-slate-500 mt-1">{invOwnerName2}</div>}
                {invPhone2 && <div className="text-xs text-slate-500">📞 {invPhone2}</div>}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveInvoiceSettings}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              invSaved
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
            }`}
          >
            {invSaved ? (
              <><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg> Saved!</>
            ) : (
              <><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Invoice Settings</>
            )}
          </button>
        </div>
      </Section>

      {/* ── BACKUP & RESTORE ── */}
      <Section title="Backup & Restore" icon={
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      }>
        <div className="space-y-4">
          <p className="text-sm text-slate-500">Apna pura data JSON file mein download karo ya wapas restore karo.</p>

          {/* Download */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadBackup}
              disabled={backupStatus === "downloading"}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-colors disabled:opacity-60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {backupStatus === "downloading" ? "Downloading..." : "Download Backup (JSON)"}
            </button>
            <div className="text-xs text-slate-400">
              {products.length} products · {customers.length} customers · {allInvoices.length} invoices
            </div>
          </div>

          {/* Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Backup File Upload Karo</label>
            <label className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl cursor-pointer transition-colors w-fit">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              JSON File Select Karo
              <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
            </label>
            <p className="text-[10px] text-slate-400 mt-1">Sirf .json backup file accept hogi jo is app ne banayi ho.</p>
          </div>

          {/* Status message */}
          {backupStatus && backupMsg && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${backupStatus === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
              {backupMsg}
            </div>
          )}
        </div>
      </Section>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
            </div>
            <h3 className="text-center font-bold text-slate-800 mb-1">Remove Category?</h3>
            <p className="text-center text-sm text-slate-500 mb-5">
              <span className="font-bold text-slate-700">"{confirmDelete}"</span> will be removed from the category list.
              <br /><span className="text-xs text-amber-600 font-medium">Existing products with this category won't be affected.</span>
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button
                onClick={() => { removeCategory(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
