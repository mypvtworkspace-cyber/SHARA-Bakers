import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Flame, 
  UtensilsCrossed, 
  Tag, 
  Users, 
  Settings, 
  ShieldAlert, 
  FileText, 
  ArrowLeft, 
  LogOut, 
  DollarSign 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';

export type AdminTab = 
  | 'overview' 
  | 'orders' 
  | 'matka' 
  | 'menu' 
  | 'pricing' 
  | 'coupons' 
  | 'customers' 
  | 'audit' 
  | 'settings';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ currentTab, onTabChange, children }) => {
  const { currentUser, logout, setCurrentView } = useApp();

  // Authoritative RBAC check
  if (!AuthService.canAccessAdmin(currentUser)) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-700 rounded-full">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold font-display text-stone-900">403 – Privileged Access Restricted</h2>
        <p className="text-xs text-stone-600 max-w-md">
          The Admin Control Center is restricted to authorized Sahara Bakers Owner and Administrator accounts.
          Please authenticate with authorized credentials.
        </p>
        <button
          onClick={() => setCurrentView('store')}
          className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded hover:bg-stone-800"
        >
          Return to Customer Storefront
        </button>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders & Dispatch', icon: ShoppingBag },
    { id: 'matka', label: 'Matka Pizza Flagship', icon: Flame },
    { id: 'menu', label: 'Menu Catalog', icon: UtensilsCrossed },
    { id: 'pricing', label: 'Pricing & Delivery', icon: DollarSign },
    { id: 'coupons', label: 'Coupons & Promos', icon: Tag },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'settings', label: 'Business Settings', icon: Settings },
    { id: 'audit', label: 'Security Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col lg:flex-row">
      
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-stone-900 text-stone-300 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand & Role Lockup */}
          <div className="p-6 border-b border-stone-800">
            <span className="text-xl font-bold font-display text-white tracking-wide block">
              Sahara Bakers
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-900/80 text-amber-200 px-2 py-0.5 rounded">
                {currentUser?.role}
              </span>
              <span className="text-xs text-stone-400 truncate">
                {currentUser?.email}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-amber-800 text-white'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-stone-800 space-y-2">
          <button
            onClick={() => setCurrentView('store')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Storefront View</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          <div className="pt-2 border-t border-stone-800/80 text-[10px] text-stone-500">
            <span className="block font-medium text-stone-400">Sahara Bakers Admin</span>
            <span>Designed & Developed by Mr Zaheer</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {children}
      </main>

    </div>
  );
};
