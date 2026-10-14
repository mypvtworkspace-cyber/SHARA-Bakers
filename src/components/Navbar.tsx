import React, { useState } from 'react';
import { ShoppingBag, User as UserIcon, Menu, X, ChefHat, ShieldCheck, PhoneCall } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuthService } from '../services/authService';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    cart,
    setIsCartOpen,
    setIsAuthModalOpen,
    setAuthModalMode,
    setIsProfileModalOpen,
    currentView,
    setCurrentView,
    setIsMatkaModalOpen,
    newOrdersCount,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isPrivilegedStaff = AuthService.canAccessKitchen(currentUser);
  const isPrivilegedAdmin = AuthService.canAccessAdmin(currentUser);

  return (
    <header className="sticky top-0 z-40 bg-stone-50/95 backdrop-blur-md border-b border-stone-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Zone 1: Single text element wordmark */}
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('store');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group"
          >
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-display group-hover:text-amber-800 transition-colors">
              Sahara Bakers
            </span>
          </a>

          {/* Zone 2: Clean text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-700">
            {currentView === 'store' ? (
              <>
                <a 
                  href="#matka-pizza" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('matka-pizza')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-amber-800 transition-colors"
                >
                  Matka Pizza
                </a>
                <a 
                  href="#menu" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-amber-800 transition-colors"
                >
                  Menu
                </a>
                <a 
                  href="#about" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-amber-800 transition-colors"
                >
                  Our Story
                </a>
                <a 
                  href="#contact" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-amber-800 transition-colors"
                >
                  Find Us
                </a>

                {/* Role-specific portal shortcuts */}
                {AuthService.canAccessKitchen(currentUser) && (
                  <button
                    onClick={() => setCurrentView('kitchen')}
                    className="relative flex items-center gap-1.5 hover:text-amber-800 text-stone-700 font-medium transition-colors"
                  >
                    <ChefHat className="w-4 h-4 text-amber-700" />
                    <span>Kitchen KDS</span>
                    {newOrdersCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-red-600 text-white rounded-full animate-pulse">
                        {newOrdersCount}
                      </span>
                    )}
                  </button>
                )}

                {AuthService.canAccessCounter(currentUser) && (
                  <button
                    onClick={() => setCurrentView('counter')}
                    className="relative flex items-center gap-1.5 hover:text-amber-800 text-stone-700 font-medium transition-colors"
                  >
                    <span>Counter POS</span>
                  </button>
                )}

                {AuthService.canAccessManager(currentUser) && (
                  <button
                    onClick={() => setCurrentView('manager')}
                    className="relative flex items-center gap-1.5 hover:text-amber-800 text-stone-700 font-medium transition-colors"
                  >
                    <span>Manager</span>
                  </button>
                )}

                {AuthService.canAccessWaiter(currentUser) && (
                  <button
                    onClick={() => setCurrentView('waiter')}
                    className="relative flex items-center gap-1.5 hover:text-amber-800 text-stone-700 font-medium transition-colors"
                  >
                    <span>Floor Waiter</span>
                  </button>
                )}

                {AuthService.canAccessRider(currentUser) && (
                  <button
                    onClick={() => setCurrentView('rider')}
                    className="relative flex items-center gap-1.5 hover:text-amber-800 text-stone-700 font-medium transition-colors"
                  >
                    <span>Rider Portal</span>
                  </button>
                )}

                {isPrivilegedAdmin && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className="relative flex items-center gap-1.5 text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded font-semibold text-xs transition-colors"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Center</span>
                    {newOrdersCount > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-red-600 text-white rounded-full animate-pulse ml-1">
                        NEW ({newOrdersCount})
                      </span>
                    )}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setCurrentView('store')}
                  className="hover:text-amber-800 font-semibold text-stone-900 transition-colors"
                >
                  ← Back to Restaurant Website
                </button>
                {AuthService.canAccessKitchen(currentUser) && (
                  <button
                    onClick={() => setCurrentView('kitchen')}
                    className={`hover:text-amber-800 transition-colors ${currentView === 'kitchen' ? 'text-amber-900 font-bold' : ''}`}
                  >
                    Kitchen
                  </button>
                )}
                {AuthService.canAccessCounter(currentUser) && (
                  <button
                    onClick={() => setCurrentView('counter')}
                    className={`hover:text-amber-800 transition-colors ${currentView === 'counter' ? 'text-amber-900 font-bold' : ''}`}
                  >
                    Counter
                  </button>
                )}
                {AuthService.canAccessManager(currentUser) && (
                  <button
                    onClick={() => setCurrentView('manager')}
                    className={`hover:text-amber-800 transition-colors ${currentView === 'manager' ? 'text-amber-900 font-bold' : ''}`}
                  >
                    Manager
                  </button>
                )}
                {AuthService.canAccessWaiter(currentUser) && (
                  <button
                    onClick={() => setCurrentView('waiter')}
                    className={`hover:text-amber-800 transition-colors ${currentView === 'waiter' ? 'text-amber-900 font-bold' : ''}`}
                  >
                    Waiter
                  </button>
                )}
                {AuthService.canAccessRider(currentUser) && (
                  <button
                    onClick={() => setCurrentView('rider')}
                    className={`hover:text-amber-800 transition-colors ${currentView === 'rider' ? 'text-amber-900 font-bold' : ''}`}
                  >
                    Rider
                  </button>
                )}
                {isPrivilegedAdmin && (
                  <button
                    onClick={() => setCurrentView('admin')}
                    className={`hover:text-amber-800 transition-colors ${currentView === 'admin' ? 'text-amber-900 font-bold' : ''}`}
                  >
                    Admin Center
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Zone 3: Primary actions */}
          <div className="flex items-center gap-3">
            {/* Direct Order Signature Matka CTA (desktop) */}
            {currentView === 'store' && (
              <button
                onClick={() => setIsMatkaModalOpen(true)}
                className="hidden lg:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wide text-amber-950 bg-amber-200 hover:bg-amber-300 rounded border border-amber-300/80 transition-colors"
              >
                Order Matka Pizza
              </button>
            )}

            {/* User Account / Profile */}
            {currentUser ? (
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition-colors"
                title="Your Account"
              >
                <UserIcon className="w-4 h-4 text-stone-700" />
                <span className="hidden sm:inline font-semibold">{currentUser.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-800 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded border border-stone-200 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-stone-600" />
                <span>Sign In</span>
              </button>
            )}

            {/* Shopping Bag Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center p-2.5 text-stone-900 bg-amber-600 hover:bg-amber-700 text-white rounded transition-colors"
              aria-label="View shopping cart"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-stone-950 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-stone-50">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-700 hover:text-stone-900 rounded"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-stone-50 px-4 pt-3 pb-6 space-y-3">
          <div className="flex flex-col space-y-2 text-sm font-medium text-stone-800">
            {currentView === 'store' ? (
              <>
                <button
                  onClick={() => {
                    setIsMatkaModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 font-semibold text-amber-900 border-b border-stone-200"
                >
                  🔥 Order Flagship Matka Pizza
                </button>
                <a
                  href="#matka-pizza"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-amber-800"
                >
                  Matka Pizza Details
                </a>
                <a
                  href="#menu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-amber-800"
                >
                  Complete Menu
                </a>
                <a
                  href="#about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-amber-800"
                >
                  About Sahara Bakers
                </a>
                <a
                  href="#contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 hover:text-amber-800"
                >
                  Location & Contact
                </a>

                {AuthService.canAccessKitchen(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('kitchen');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between text-left py-2 font-semibold text-amber-900"
                  >
                    <span>Kitchen Display (KDS)</span>
                    {newOrdersCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-600 text-white rounded-full">
                        {newOrdersCount} NEW
                      </span>
                    )}
                  </button>
                )}

                {AuthService.canAccessCounter(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('counter');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between text-left py-2 font-semibold text-stone-800"
                  >
                    <span>Counter POS</span>
                  </button>
                )}

                {AuthService.canAccessManager(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('manager');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between text-left py-2 font-semibold text-stone-800"
                  >
                    <span>Manager Portal</span>
                  </button>
                )}

                {AuthService.canAccessWaiter(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('waiter');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between text-left py-2 font-semibold text-stone-800"
                  >
                    <span>Floor Waiter Portal</span>
                  </button>
                )}

                {AuthService.canAccessRider(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('rider');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between text-left py-2 font-semibold text-stone-800"
                  >
                    <span>Rider Delivery Portal</span>
                  </button>
                )}

                {isPrivilegedAdmin && (
                  <button
                    onClick={() => {
                      setCurrentView('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between text-left py-2 font-semibold text-amber-900 bg-amber-100 px-3 rounded"
                  >
                    <span>Admin Control Center</span>
                    {newOrdersCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-red-600 text-white rounded-full">
                        {newOrdersCount} NEW
                      </span>
                    )}
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setCurrentView('store');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left py-2 font-semibold text-stone-900"
                >
                  ← Return to Customer Storefront
                </button>
                {AuthService.canAccessKitchen(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('kitchen');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left py-2 text-amber-800 font-medium"
                  >
                    Kitchen KDS
                  </button>
                )}
                {AuthService.canAccessCounter(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('counter');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left py-2 text-stone-800 font-medium"
                  >
                    Counter POS
                  </button>
                )}
                {AuthService.canAccessManager(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('manager');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left py-2 text-stone-800 font-medium"
                  >
                    Manager Portal
                  </button>
                )}
                {AuthService.canAccessWaiter(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('waiter');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left py-2 text-stone-800 font-medium"
                  >
                    Waiter Portal
                  </button>
                )}
                {AuthService.canAccessRider(currentUser) && (
                  <button
                    onClick={() => {
                      setCurrentView('rider');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left py-2 text-stone-800 font-medium"
                  >
                    Rider Portal
                  </button>
                )}
                {isPrivilegedAdmin && (
                  <button
                    onClick={() => {
                      setCurrentView('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="text-left py-2 text-amber-800 font-semibold"
                  >
                    Admin Control Center
                  </button>
                )}
              </>
            )}

            <div className="pt-3 border-t border-stone-200 text-xs text-stone-500 flex items-center gap-2">
              <PhoneCall className="w-3.5 h-3.5 text-stone-600" />
              <span>Railway Road, Bannu: +92 330 5868488</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
