import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, onAuthStateChanged, signOut as firebaseSignOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, updateProfile,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { setIdTokenProvider } from "./api/client";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import DashboardView from "./components/dashboard/DashboardView";
import ProductsView from "./components/products/ProductsView";
import POSView from "./components/pos/POSView";
import InvoiceView from "./components/invoices/InvoiceView";
import ReportsView from "./components/reports/ReportsView";
import CustomersView from "./components/customers/CustomersView";
import SettingsView from "./components/settings/SettingsView";
import UserProfileView from "./components/profile/UserProfileView";
import LoginView from "./components/auth/LoginView";
import { useProducts } from "./hooks/useProducts";

// ── Firebase init ──────────────────────────────────────────────────────────
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};
// Firebase is used ONLY for authentication here — all app data (products, sales,
// invoices, customers, settings) lives in PostgreSQL via the Express backend.
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);

// Give the backend API client a way to fetch a fresh Firebase ID token for
// every request (it verifies this token server-side, then reads/writes Postgres).
setIdTokenProvider(() => (auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(null)));

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const {
    loading: dataLoading,
    products, alerts, stats, allInvoices,
    addProduct, updateProduct, deleteProduct, stockIn, stockOut,
    posStats, completeSale, recordSale,
    createManualInvoice, updateInvoice, deleteInvoice,
    customers, addCustomer, updateCustomer, deleteCustomer, receivePayment, addBalanceAdjustment,
    categories, addCategory, removeCategory,
    appSettings, updateAppSettings,
    invoiceSettings, updateInvoiceSettings,
    restoreBackup,
  } = useProducts(currentUser?.uid);

  // ── Auth state listener ─────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          name: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email,
          loginMethod: user.providerData[0]?.providerId === "google.com" ? "google" : "email",
          uid: user.uid,
          photoURL: user.photoURL,
        });
        setActiveNav("Dashboard");
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Auth handlers ───────────────────────────────────────────────────────
  const handleEmailLogin = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const handleEmailRegister = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name) await updateProfile(cred.user, { displayName: name });
    return cred;
  };

  const handleGoogleLogin = () =>
    signInWithPopup(auth, new GoogleAuthProvider());

  const handleForgotPassword = (email) =>
    sendPasswordResetEmail(auth, email);

  const handleLogout = async () => {
    await firebaseSignOut(auth);
    setActiveNav("Dashboard");
  };

  const handleUpdatePassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  };

  // ── Loading screen ──────────────────────────────────────────────────────
  if (authLoading || (currentUser && dataLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          {currentUser && <p className="text-sm text-slate-500">Loading your data...</p>}
        </div>
      </div>
    );
  }

  // ── Login screen ────────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <LoginView
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
        onGoogleLogin={handleGoogleLogin}
        onForgotPassword={handleForgotPassword}
      />
    );
  }

  const pageConfig = {
    Dashboard: { title: "Dashboard", subtitle: `Welcome back, ${currentUser.name} 👋` },
    Products: { title: "Products", subtitle: "Manage inventory & stock alerts" },
    "Point of Sale": { title: "Point of Sale", subtitle: "Sell products & process orders" },
    Invoices: { title: "Invoices", subtitle: "Invoice banayein aur manage karein" },
    Reports: { title: "Reports", subtitle: "Sales aur revenue ki detailed reports" },
    Customers: { title: "Customers", subtitle: "Manage your customer directory" },
    Settings: { title: "Settings", subtitle: "Customize categories and app settings" },
    Profile: { title: "My Profile", subtitle: "Manage your account and preferences" },
  };
  const config = pageConfig[activeNav] || pageConfig.Dashboard;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        mobileSidebar={mobileSidebar}
        setMobileSidebar={setMobileSidebar}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        setSidebarOpen={setSidebarOpen}
        appSettings={appSettings}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          title={config.title}
          subtitle={config.subtitle}
          onMenuClick={() => setMobileSidebar(true)}
          alerts={alerts}
          currentUser={currentUser}
          onLogout={handleLogout}
          setActiveNav={setActiveNav}
          products={products}
          customers={customers}
          allInvoices={allInvoices}
        />
        {activeNav === "Products" ? (
          <ProductsView
            products={products} stats={stats}
            addProduct={addProduct} updateProduct={updateProduct}
            deleteProduct={deleteProduct} stockIn={stockIn} stockOut={stockOut}
            categories={categories}
          />
        ) : activeNav === "Point of Sale" ? (
          <POSView
            products={products} posStats={posStats}
            completeSale={completeSale} recordSale={recordSale}
            customers={customers}
            categories={categories}
            invoices={allInvoices}
          />
        ) : activeNav === "Invoices" ? (
          <InvoiceView
            products={products}
            invoices={allInvoices}
            onCreateInvoice={createManualInvoice}
            onUpdateInvoice={updateInvoice}
            onDeleteInvoice={deleteInvoice}
            onReduceStock={completeSale}
            customers={customers}
            invoiceSettings={invoiceSettings}
          />
        ) : activeNav === "Reports" ? (
          <ReportsView invoices={allInvoices} products={products} invoiceSettings={invoiceSettings} />
        ) : activeNav === "Customers" ? (
          <CustomersView customers={customers} addCustomer={addCustomer} updateCustomer={updateCustomer} deleteCustomer={deleteCustomer} allInvoices={allInvoices} onReceivePayment={receivePayment} onCreateInvoice={createManualInvoice} onReduceStock={completeSale} onUpdateInvoice={updateInvoice} onDeleteInvoice={deleteInvoice} invoiceSettings={invoiceSettings} products={products} />
        ) : activeNav === "Settings" ? (
          <SettingsView categories={categories} addCategory={addCategory} removeCategory={removeCategory} appSettings={appSettings} updateAppSettings={updateAppSettings} invoiceSettings={invoiceSettings} updateInvoiceSettings={updateInvoiceSettings} allInvoices={allInvoices} products={products} customers={customers} onRestoreBackup={restoreBackup} />
        ) : activeNav === "Profile" ? (
          <UserProfileView
            appSettings={appSettings}
            currentUser={currentUser}
            onLogout={handleLogout}
            products={products}
            allInvoices={allInvoices}
            onUpdatePassword={handleUpdatePassword}
          />
        ) : (
          <DashboardView products={products} allInvoices={allInvoices} customers={customers} />
        )}
      </main>
    </div>
  );
}
