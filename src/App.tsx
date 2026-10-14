/**
 * Sahara Bakers – Complete Restaurant Website + Ordering + Operations Platform
 * Railway Road, near Syed Software House, Bannu, 28100, Pakistan
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MatkaPizzaSection } from './components/MatkaPizzaSection';
import { MenuSection } from './components/MenuSection';
import { AboutSection } from './components/AboutSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

// Modals
import { MatkaPizzaModal } from './components/MatkaPizzaModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderReceiptModal } from './components/OrderReceiptModal';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { AuthModal } from './components/AuthModal';
import { CustomerProfileModal } from './components/CustomerProfileModal';

// Authenticated Staff / Admin Portals
import { KitchenDisplay } from './components/KitchenDisplay';
import { AdminControlCenter } from './components/admin/AdminControlCenter';
import { RiderPortal } from './components/rider/RiderPortal';
import { WaiterPortal } from './components/waiter/WaiterPortal';
import { ManagerPortal } from './components/manager/ManagerPortal';
import { CounterPortal } from './components/counter/CounterPortal';

const MainLayout: React.FC = () => {
  const { 
    currentView, 
    confirmedOrderForReceipt, 
    setConfirmedOrderForReceipt,
    setActiveOrderForTracking,
    isLoading,
    initError,
    refreshData
  } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-amber-200 border-t-amber-800 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-amber-900 font-serif font-bold text-xl">
            S
          </div>
        </div>
        <h2 className="text-2xl font-bold font-display text-stone-900 tracking-tight">
          Sahara Bakers
        </h2>
        <p className="text-xs text-stone-500 mt-1.5 max-w-xs font-medium">
          Warming the ovens on Railway Road, Bannu • Loading fresh bakery catalog...
        </p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-6 rounded-2xl border border-red-200 shadow-xl space-y-3">
          <div className="text-red-700 font-bold text-base">Unable to Load Bakery Menu</div>
          <p className="text-xs text-stone-600 leading-relaxed">{initError}</p>
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="mt-2 px-5 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow transition-colors"
          >
            Reload Sahara Bakers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-amber-100 selection:text-amber-900">
      {currentView === 'store' && (
        <>
          <Navbar />
          <main className="flex-1">
            <Hero />
            <MatkaPizzaSection />
            <MenuSection />
            <AboutSection />
            <ContactSection />
          </main>
          <Footer />
        </>
      )}

      {currentView === 'kitchen' && (
        <>
          <Navbar />
          <KitchenDisplay />
        </>
      )}

      {currentView === 'counter' && (
        <>
          <Navbar />
          <CounterPortal />
        </>
      )}

      {currentView === 'manager' && (
        <>
          <Navbar />
          <ManagerPortal />
        </>
      )}

      {currentView === 'waiter' && (
        <>
          <Navbar />
          <WaiterPortal />
        </>
      )}

      {currentView === 'rider' && (
        <>
          <Navbar />
          <RiderPortal />
        </>
      )}

      {currentView === 'admin' && (
        <AdminControlCenter />
      )}

      {/* Global Interactive Modals */}
      <MatkaPizzaModal />
      <CartDrawer />
      <CheckoutModal />
      <OrderReceiptModal 
        order={confirmedOrderForReceipt}
        onClose={() => setConfirmedOrderForReceipt(null)}
        onTrack={() => {
          const ord = confirmedOrderForReceipt;
          setConfirmedOrderForReceipt(null);
          setActiveOrderForTracking(ord);
        }}
      />
      <OrderTrackerModal />
      <AuthModal />
      <CustomerProfileModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
