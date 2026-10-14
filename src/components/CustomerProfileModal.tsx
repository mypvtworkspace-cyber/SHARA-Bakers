import React, { useState } from 'react';
import { X, User, Phone, Mail, Clock, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderEngine } from '../services/orderEngine';

export const CustomerProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    currentUser,
    logout,
    setActiveOrderForTracking,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');

  if (!isProfileModalOpen || !currentUser) return null;

  const userOrders = OrderEngine.getOrdersForUser(currentUser);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900">{currentUser.name}</h2>
              <p className="text-xs text-stone-500">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-stone-200 px-6 pt-2 bg-stone-50/50 text-xs font-semibold gap-4">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Your Orders ({userOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-amber-800 text-amber-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Account Details
          </button>
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {activeTab === 'orders' ? (
            userOrders.length === 0 ? (
              <div className="text-center py-10 text-stone-500 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-stone-300" />
                <p className="text-xs">You have not placed any orders yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setIsProfileModalOpen(false);
                      setActiveOrderForTracking(ord);
                    }}
                    className="p-4 bg-stone-50 rounded-xl border border-stone-200 hover:border-amber-400 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-stone-900">
                          #{ord.orderNumber}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-amber-900 bg-amber-100 px-2 py-0.2 rounded">
                          {(ord.status || 'PENDING').replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-xs text-stone-600 mt-1">
                        {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} • Rs. {ord.totalAmount.toLocaleString()} ({ord.fulfilmentType})
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-800 font-semibold group-hover:translate-x-0.5 transition-transform">
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4 text-xs">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-stone-500" />
                  <span className="text-stone-500">Name:</span>
                  <span className="font-semibold text-stone-900">{currentUser.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-stone-500" />
                  <span className="text-stone-500">Email:</span>
                  <span className="font-semibold text-stone-900">{currentUser.email}</span>
                </div>
                {currentUser.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-stone-500" />
                    <span className="text-stone-500">Phone:</span>
                    <span className="font-semibold text-stone-900">{currentUser.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-stone-500" />
                  <span className="text-stone-500">Member Since:</span>
                  <span className="font-semibold text-stone-900">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={() => {
              logout();
              setIsProfileModalOpen(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
