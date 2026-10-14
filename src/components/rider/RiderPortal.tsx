import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Clock, 
  Navigation, 
  Coins, 
  AlertCircle, 
  RefreshCw, 
  Receipt, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { apiClient } from '../../services/apiClient';
import { Order, OrderStatus } from '../../types';

export const RiderPortal: React.FC = () => {
  const { 
    currentUser, 
    orders, 
    refreshData, 
    setCurrentView 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'deliveries' | 'history'>('deliveries');
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [historyDateFilter, setHistoryDateFilter] = useState<'today' | 'all'>('today');

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(currentUser?.mustChangePassword ?? false);
  const [currentPassInput, setCurrentPassInput] = useState<string>('sahara@123');
  const [newPassInput, setNewPassInput] = useState<string>('');
  const [confirmPassInput, setConfirmPassInput] = useState<string>('');
  const [passwordChangeErr, setPasswordChangeErr] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<boolean>(false);
  const [isChangingPass, setIsChangingPass] = useState<boolean>(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeErr(null);
    if (newPassInput.length < 6) {
      setPasswordChangeErr('New password must be at least 6 characters long.');
      return;
    }
    if (newPassInput !== confirmPassInput) {
      setPasswordChangeErr('New password and confirmation do not match.');
      return;
    }
    if (newPassInput === 'sahara@123') {
      setPasswordChangeErr('Please choose a unique password different from the initial default.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: currentUser?.username || currentUser?.email,
          currentPassword: currentPassInput,
          newPassword: newPassInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }
      setPasswordChangeSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordChangeSuccess(false);
      }, 1500);
      refreshData();
    } catch (err: any) {
      setPasswordChangeErr(err.message || 'Error updating password');
    } finally {
      setIsChangingPass(false);
    }
  };

  // RBAC Guard
  if (!AuthService.canAccessRider(currentUser)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-700 rounded-full">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-stone-900">403 – Unauthorized Access</h2>
        <p className="text-xs text-stone-600 max-w-md">
          The Rider Portal requires authorized delivery captain credentials.
        </p>
        <button
          onClick={() => setCurrentView('store')}
          className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  // Load Rider Delivery History
  const fetchRiderHistory = async () => {
    if (!currentUser) return;
    setIsLoadingHistory(true);
    try {
      const res = await apiClient.getHistory({
        role: currentUser.role,
        email: currentUser.email,
        date: historyDateFilter,
        status: 'DELIVERED',
        limit: 50,
      });
      setHistoryOrders(res.orders);
    } catch (err) {
      console.error('Failed to load rider history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchRiderHistory();
    }
  }, [activeTab, historyDateFilter]);

  // Deliveries relevant to this rider
  // 1. Orders assigned to this rider (by email, username, id, or phone) that are not yet finished
  // 2. Orders that are ready for delivery with no rider assigned
  const activeDeliveries = useMemo(() => {
    if (!currentUser) return [];
    const myIdentifiers = new Set([
      currentUser.email?.toLowerCase(),
      currentUser.username?.toLowerCase(),
      currentUser.id,
      currentUser.phone?.replace(/\s+/g, ''),
    ].filter(Boolean));

    return orders.filter(o => {
      if (o.fulfilmentType !== 'DELIVERY') return false;
      if (['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status)) return false;

      if (!o.riderId) {
        // Available order waiting for rider pickup
        return true;
      }

      // Check if order is assigned to me
      return (
        myIdentifiers.has(o.riderId.toLowerCase()) ||
        (o.riderName && o.riderName.toLowerCase() === currentUser.name.toLowerCase())
      );
    });
  }, [orders, currentUser]);

  // Calculate Cash Collected Today by this Rider
  const cashCollectedToday = useMemo(() => {
    if (!currentUser) return 0;
    const todayStr = new Date().toISOString().split('T')[0];
    const myIdentifiers = new Set([
      currentUser.email?.toLowerCase(),
      currentUser.username?.toLowerCase(),
      currentUser.id,
      currentUser.phone?.replace(/\s+/g, ''),
    ].filter(Boolean));

    return orders
      .filter(o => 
        (myIdentifiers.has(o.riderId?.toLowerCase()) || (o.riderName && o.riderName === currentUser.name)) &&
        o.status === 'DELIVERED' && 
        o.createdAt.startsWith(todayStr)
      )
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders, currentUser]);

  // Update Delivery Workflow Status
  const handleUpdateDeliveryStatus = async (order: Order, newStatus: OrderStatus, customNote?: string) => {
    if (!currentUser) return;
    try {
      // If accepting an unassigned task, assign to self with verified account ID, name, and phone
      if (!order.riderId) {
        const identifierToRecord = currentUser.username || currentUser.email;
        await apiClient.assignRider(order.id, identifierToRecord, `${currentUser.name} (${currentUser.phone || ''})`, {
          email: currentUser.email,
          role: currentUser.role,
        });
      }

      await apiClient.updateOrderStatus(order.id, newStatus, {
        email: currentUser.email,
        role: currentUser.role,
      }, customNote || `Rider ${currentUser.name} marked ${newStatus}`);

      refreshData();
    } catch (err: any) {
      alert('Delivery update notice: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      
      {/* Top Header */}
      <header className="bg-amber-950 text-white px-6 py-4 shadow-md flex items-center justify-between border-b border-amber-900">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-800 rounded-lg text-amber-300">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
              <span>Sahara Bakers — Rider & Delivery Portal</span>
              {currentUser?.riderAccountStatus === 'ACTIVE' ? (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-700/80 text-emerald-100 rounded-full border border-emerald-400/40">
                  Active
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-500/80 text-amber-950 rounded-full border border-amber-300">
                  Pending Identity Verification
                </span>
              )}
            </h1>
            <p className="text-xs text-amber-200 flex items-center gap-2">
              <span>Delivery Captain <strong className="text-white">{currentUser?.name || 'Rider'}</strong> ({currentUser?.username || currentUser?.email})</span>
              {currentUser?.phone && <span className="text-amber-300 font-mono">• {currentUser.phone}</span>}
            </p>
          </div>
        </div>

        {/* Tab Buttons & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'deliveries' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-900 text-amber-200 hover:bg-amber-800'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Active Trips ({activeDeliveries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-900 text-amber-200 hover:bg-amber-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Trip History</span>
          </button>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-900/60 text-amber-200 hover:text-white hover:bg-amber-800 border border-amber-800 transition-colors"
            title="Change Rider Password"
          >
            {currentUser?.mustChangePassword ? '⚠️ Set New Password' : 'Change Password'}
          </button>

          <button
            onClick={() => setCurrentView('store')}
            className="ml-2 text-xs text-amber-300 hover:text-white font-medium"
          >
            Exit Portal
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        
        {/* Metric banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Active Delivery Tasks</span>
            <span className="text-2xl font-bold font-display text-amber-900">{activeDeliveries.length}</span>
            <span className="text-[10px] text-stone-400 block mt-1">Pending drop-offs</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Cash Collected Today (COD)</span>
            <span className="text-2xl font-bold font-mono text-green-700">Rs. {cashCollectedToday.toLocaleString()}</span>
            <span className="text-[10px] text-stone-400 block mt-1">To settle at counter</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Base Hub</span>
            <span className="text-sm font-bold text-stone-900 block truncate">Railway Road, Bannu</span>
            <span className="text-[10px] text-amber-800 font-medium block mt-1">Near Syed Software House</span>
          </div>
        </div>

        {/* TAB 1: ACTIVE TRIPS & DELIVERIES */}
        {activeTab === 'deliveries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900">
                  Current Delivery Queue
                </h2>
                <p className="text-xs text-stone-500">
                  Follow the step-by-step dispatch workflow: Accept ➔ Pick Up ➔ On The Way ➔ Deliver
                </p>
              </div>
              <button
                onClick={refreshData}
                className="flex items-center gap-1.5 text-xs text-stone-700 bg-white border border-stone-300 px-3 py-1.5 rounded-lg shadow-xs hover:bg-stone-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Server</span>
              </button>
            </div>

            {activeDeliveries.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-xs space-y-3">
                <Bike className="w-12 h-12 text-stone-300 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800">All deliveries cleared!</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  No pending delivery dispatches right now. When customers place online delivery orders, they will appear here instantly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeDeliveries.map(order => {
                  const isAssignedToMe = Boolean(
                    order.riderId && (
                      order.riderId.toLowerCase() === currentUser?.email?.toLowerCase() ||
                      order.riderId.toLowerCase() === currentUser?.username?.toLowerCase() ||
                      order.riderId === currentUser?.id ||
                      (order.riderName && order.riderName.toLowerCase().includes(currentUser?.name?.toLowerCase() || ''))
                    )
                  );
                  const isReady = order.status === 'READY';
                  const isOut = order.status === 'OUT_FOR_DELIVERY';

                  return (
                    <div 
                      key={order.id}
                      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-4 transition-all hover:border-amber-400"
                    >
                      {/* Trip Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-base text-stone-900 bg-stone-100 px-2.5 py-1 rounded-lg">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold text-stone-600">
                            Ordered: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                            {(order.status || 'PENDING').replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono font-bold text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                            COD: Rs. {order.totalAmount}
                          </span>
                        </div>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3 bg-stone-50 rounded-xl space-y-1.5">
                          <span className="font-bold text-stone-900 block flex items-center gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-amber-700" />
                            <span>Delivery Destination</span>
                          </span>
                          <p className="font-medium text-stone-800 leading-relaxed">
                            {order.deliveryAddress.street}, <strong>{order.deliveryAddress.area}</strong>, {order.deliveryAddress.city}
                          </p>
                          {order.deliveryNotes && (
                            <p className="text-[11px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200">
                              📝 <strong>Note:</strong> {order.deliveryNotes}
                            </p>
                          )}
                        </div>

                        <div className="p-3 bg-stone-50 rounded-xl space-y-1.5">
                          <span className="font-bold text-stone-900 block">Customer Contact</span>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-800 text-sm">{order.customerName}</span>
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg font-bold text-xs shadow-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              <span>Call {order.customerPhone}</span>
                            </a>
                          </div>
                          <div className="text-[11px] text-stone-500 pt-1">
                            Items: {order.items.map(i => `${i.quantity}× ${i.productName}`).join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Workflow Buttons */}
                      <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-end gap-2.5">
                        {!isAssignedToMe ? (
                          <button
                            onClick={() => handleUpdateDeliveryStatus(order, order.status, 'Rider accepted task')}
                            className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold rounded-xl shadow-xs"
                          >
                            Accept Delivery Task
                          </button>
                        ) : order.status === 'READY' || order.status === 'ACCEPTED' || order.status === 'PREPARING' ? (
                          <button
                            onClick={() => handleUpdateDeliveryStatus(order, 'OUT_FOR_DELIVERY', 'Picked up from Sahara counter, en route')}
                            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                          >
                            <Bike className="w-4 h-4" />
                            <span>Picked Up ➔ Start Trip</span>
                          </button>
                        ) : order.status === 'OUT_FOR_DELIVERY' ? (
                          <button
                            onClick={() => handleUpdateDeliveryStatus(order, 'DELIVERED', `Cash Rs. ${order.totalAmount} collected by ${currentUser?.name || 'Rider'}`)}
                            className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirm Delivery & Collect Rs. {order.totalAmount}</span>
                          </button>
                        ) : null}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TRIP & CASH HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900">
                  Rider Completed Deliveries
                </h2>
                <p className="text-xs text-stone-500">
                  Verified drop-offs and cash collection tally for {currentUser?.name || 'Rider'}
                </p>
              </div>

              <div className="flex rounded-lg border border-stone-300 bg-white p-0.5 text-xs">
                <button
                  onClick={() => setHistoryDateFilter('today')}
                  className={`px-3 py-1 rounded-md font-semibold ${historyDateFilter === 'today' ? 'bg-amber-800 text-white' : 'text-stone-600'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setHistoryDateFilter('all')}
                  className={`px-3 py-1 rounded-md font-semibold ${historyDateFilter === 'all' ? 'bg-amber-800 text-white' : 'text-stone-600'}`}
                >
                  All History
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Order #</th>
                      <th className="px-5 py-3.5">Delivered Time</th>
                      <th className="px-5 py-3.5">Customer & Area</th>
                      <th className="px-5 py-3.5">Items</th>
                      <th className="px-5 py-3.5">Cash Collected</th>
                      <th className="px-5 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {historyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-stone-400">
                          {isLoadingHistory ? 'Loading history...' : 'No completed deliveries found for this period.'}
                        </td>
                      </tr>
                    ) : (
                      historyOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-stone-50/70">
                          <td className="px-5 py-3 font-mono font-bold text-stone-900">
                            {ord.orderNumber}
                          </td>
                          <td className="px-5 py-3 text-stone-500 font-mono text-[11px]">
                            {new Date(ord.updatedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-bold text-stone-800 block">{ord.customerName}</span>
                            <span className="text-[11px] text-stone-500">{ord.deliveryAddress.area}</span>
                          </td>
                          <td className="px-5 py-3 text-stone-600 max-w-xs truncate">
                            {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-green-700">
                            Rs. {ord.totalAmount}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                              ✓ DELIVERED
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Change Password Dialog */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold font-display text-stone-900">
                {currentUser?.mustChangePassword ? 'First-Login: Set Personal Password' : 'Change Rider Password'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {currentUser?.mustChangePassword 
                  ? 'For security compliance, you must change your default initial password (sahara@123) to a unique private password.'
                  : 'Update your account password for secure access to the delivery portal.'}
              </p>
            </div>

            {passwordChangeSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-900">Password successfully updated!</p>
                <p className="text-[11px] text-emerald-700">Your new credentials are now active across all sessions.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-3.5">
                {passwordChangeErr && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordChangeErr}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Current / Initial Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassInput}
                    onChange={(e) => setCurrentPassInput(e.target.value)}
                    placeholder="e.g. sahara@123"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    New Private Password * (min. 6 characters)
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassInput}
                    onChange={(e) => setNewPassInput(e.target.value)}
                    placeholder="Enter strong password"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-700 block mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassInput}
                    onChange={(e) => setConfirmPassInput(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  {!currentUser?.mustChangePassword && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isChangingPass ? 'Saving...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
