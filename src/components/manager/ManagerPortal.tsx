import React, { useState, useMemo, useEffect } from 'react';
import { 
  ClipboardList, 
  ChefHat, 
  Bike, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  Power, 
  Calendar, 
  Eye, 
  Clock, 
  UserCheck, 
  TrendingUp,
  Receipt,
  UtensilsCrossed,
  Printer,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { apiClient } from '../../services/apiClient';
import { Order, OrderStatus, Product, User, Rider, RiderStatus } from '../../types';
import { ThermalReceiptModal } from '../ThermalReceiptModal';

export const ManagerPortal: React.FC = () => {
  const { 
    currentUser, 
    orders, 
    products, 
    riders,
    refreshData, 
    setCurrentView 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'live' | 'riders' | 'availability' | 'history'>('live');

  // Rider assignment state
  const [selectedRiderForOrder, setSelectedRiderForOrder] = useState<{ [orderId: string]: string }>({});
  const [selectedRiderFilter, setSelectedRiderFilter] = useState<string>('ALL');

  // Thermal Reprint State
  const [isThermalReprintOpen, setIsThermalReprintOpen] = useState<boolean>(false);
  const [orderForReprint, setOrderForReprint] = useState<Order | null>(null);

  // History state (Section 43)
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyDateFilter, setHistoryDateFilter] = useState<'today' | 'yesterday' | 'all'>('today');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  // RBAC Guard
  if (!AuthService.canAccessManager(currentUser)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-700 rounded-full">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-stone-900">403 – Unauthorized Access</h2>
        <p className="text-xs text-stone-600 max-w-md">
          The Manager Operations Portal requires authorized management credentials.
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

  // Load Manager Operational History (Section 43)
  const fetchManagerHistory = async () => {
    if (!currentUser) return;
    setIsLoadingHistory(true);
    try {
      const res = await apiClient.getHistory({
        role: currentUser.role,
        email: currentUser.email,
        date: historyDateFilter,
        status: historyStatusFilter,
        search: historySearch,
        limit: 50,
      });
      setHistoryOrders(res.orders);
    } catch (err) {
      console.error('Failed to load manager history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchManagerHistory();
    }
  }, [activeTab, historyDateFilter, historyStatusFilter, historySearch]);

  // Operational metrics
  const todayOrders = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return orders.filter(o => o.createdAt.startsWith(todayStr));
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders.filter(o => !['DELIVERED', 'PICKED_UP', 'CANCELLED', 'REJECTED'].includes(o.status));
  }, [orders]);

  const inKitchenOrders = useMemo(() => {
    return activeOrders.filter(o => ['ACCEPTED', 'PREPARING'].includes(o.status));
  }, [activeOrders]);

  const readyOrders = useMemo(() => {
    return activeOrders.filter(o => o.status === 'READY');
  }, [activeOrders]);

  const deliveryOrders = useMemo(() => {
    return activeOrders.filter(o => o.fulfilmentType === 'DELIVERY');
  }, [activeOrders]);

  // Handle Rider Assignment
  const handleAssignRider = async (orderId: string) => {
    const riderId = selectedRiderForOrder[orderId];
    if (!riderId || !currentUser) return;
    const rider = riders.find(r => r.id === riderId || r.phone === riderId || r.name === riderId);
    const riderName = rider ? rider.name : 'Ahmad Nawaz (احمد نواز)';

    try {
      await apiClient.assignRider(orderId, rider ? rider.id : riderId, riderName, {
        email: currentUser.email,
        role: currentUser.role,
      });
      refreshData();
    } catch (err: any) {
      alert('Failed to assign rider: ' + err.message);
    }
  };

  // Manager updates rider operational status (Section 62)
  const handleUpdateRiderStatus = async (riderId: string, status: RiderStatus) => {
    if (!currentUser) return;
    try {
      await apiClient.updateRiderStatus(riderId, status, {
        email: currentUser.email,
        role: currentUser.role,
      });
      refreshData();
    } catch (err: any) {
      alert('Failed to update rider status: ' + err.message);
    }
  };

  // Toggle Product Availability
  const handleToggleProduct = async (product: Product) => {
    if (!currentUser) return;
    try {
      await apiClient.updateProductAvailability(product.id, !product.available, {
        email: currentUser.email,
        role: currentUser.role,
      });
      refreshData();
    } catch (err: any) {
      alert('Failed to update availability: ' + err.message);
    }
  };

  // Override status
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser) return;
    try {
      await apiClient.updateOrderStatus(orderId, newStatus, {
        email: currentUser.email,
        role: currentUser.role,
      }, `Manager overridden to ${newStatus}`);
      refreshData();
    } catch (err: any) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      
      {/* Top Header */}
      <header className="bg-stone-900 text-stone-50 px-6 py-4 shadow-md flex items-center justify-between border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-700 rounded-lg text-amber-100">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-white">
              Sahara Bakers — Manager Operations Portal
            </h1>
            <p className="text-xs text-stone-400">
              Shift Operations • Floor, Kitchen & Delivery Coordination • <strong className="text-white">{currentUser?.name || 'Manager'}</strong>
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'live' ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Shift ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('riders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'riders' ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Riders & Fleet ({riders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('availability')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'availability' ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Stock Availability</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Operational History</span>
          </button>

          <button
            onClick={() => setCurrentView('store')}
            className="ml-3 text-xs text-stone-400 hover:text-white font-medium"
          >
            Exit Portal
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Active Orders</span>
            <span className="text-2xl font-bold font-display text-stone-900">{activeOrders.length}</span>
            <span className="text-[10px] text-amber-700 font-medium block mt-1">Live in building</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">In Kitchen Ovens</span>
            <span className="text-2xl font-bold font-display text-amber-800">{inKitchenOrders.length}</span>
            <span className="text-[10px] text-stone-500 block mt-1">Preparing & baking</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Ready for Pickup / Delivery</span>
            <span className="text-2xl font-bold font-display text-green-700">{readyOrders.length}</span>
            <span className="text-[10px] text-stone-500 block mt-1">Packaged & plated</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
            <span className="text-[11px] font-semibold text-stone-500 uppercase block">Today's Orders Total</span>
            <span className="text-2xl font-bold font-display text-stone-900">{todayOrders.length}</span>
            <span className="text-[10px] text-stone-500 block mt-1">Shift volume</span>
          </div>
        </div>

        {/* TAB 1: LIVE SHIFT OPERATIONS & RIDER DISPATCH */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900">
                  Live Orders & Dispatch Monitor
                </h2>
                <p className="text-xs text-stone-500">
                  Manage kitchen progress and assign riders for delivery throughout Bannu
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

            {/* Active Orders List */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Order #</th>
                      <th className="px-5 py-3.5">Customer & Channel</th>
                      <th className="px-5 py-3.5">Items Snapshot</th>
                      <th className="px-5 py-3.5">Total (PKR)</th>
                      <th className="px-5 py-3.5">Kitchen / Status</th>
                      <th className="px-5 py-3.5">Delivery Rider</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {activeOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-stone-400">
                          No active orders in progress right now.
                        </td>
                      </tr>
                    ) : (
                      activeOrders.map(order => {
                        const isDelivery = order.fulfilmentType === 'DELIVERY';
                        return (
                          <tr key={order.id} className="hover:bg-stone-50/70">
                            <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                              {order.orderNumber}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="font-bold text-stone-800 block">{order.customerName}</span>
                              <span className="text-[11px] text-stone-500 block">
                                {order.fulfilmentType === 'DELIVERY' ? `🛵 Delivery (${order.deliveryAddress.area})` :
                                 order.orderType === 'DINE_IN' ? `🍽️ ${order.tableNumber || 'Dine-in'}` : '🛍️ Takeaway Counter'}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-stone-700 max-w-xs truncate">
                              {order.items.map(i => `${i.quantity}× ${i.productName}`).join(', ')}
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-stone-950">
                              Rs. {order.totalAmount}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                order.status === 'READY' ? 'bg-green-100 text-green-800' :
                                order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                                order.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                                'bg-stone-100 text-stone-800'
                              }`}>
                                {(order.status || 'PENDING').replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {isDelivery ? (
                                order.riderName ? (
                                  <span className="text-[11px] font-semibold text-green-800 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                                    ✓ {order.riderName}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={selectedRiderForOrder[order.id] || ''}
                                      onChange={(e) => setSelectedRiderForOrder({
                                        ...selectedRiderForOrder,
                                        [order.id]: e.target.value,
                                      })}
                                      className="text-xs bg-stone-50 border border-stone-300 rounded p-1"
                                    >
                                      <option value="">Select Rider...</option>
                                      {riders.filter(r => r.active).map(r => (
                                        <option key={r.id} value={r.id}>
                                          {r.name} ({r.status === 'AVAILABLE' ? 'Available' : (r.status || 'BUSY').replace(/_/g, ' ')})
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleAssignRider(order.id)}
                                      disabled={!selectedRiderForOrder[order.id]}
                                      className="px-2 py-1 bg-amber-800 text-white rounded text-[10px] font-bold disabled:opacity-40"
                                    >
                                      Assign
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="text-[11px] text-stone-400">N/A (Pick/Dine)</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right space-x-1.5">
                              {order.status === 'READY' && !isDelivery && (
                                <button
                                  onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                                  className="px-2.5 py-1 bg-green-700 text-white rounded text-xs font-semibold hover:bg-green-800"
                                >
                                  Complete
                                </button>
                              )}
                              <button
                                onClick={() => setInspectingOrder(order)}
                                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-xs font-semibold"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB: RIDER MANAGEMENT & PERFORMANCE (Section 61, 62, 64, 65) */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900 flex items-center gap-2">
                  <Bike className="w-5 h-5 text-amber-700" />
                  <span>Rider Fleet Management & Real-Time Performance</span>
                </h2>
                <p className="text-xs text-stone-500">
                  Live capacity, dispatch status, workload metrics, and historical drop-offs computed from database records
                </p>
              </div>

              <button
                onClick={refreshData}
                className="flex items-center gap-1.5 text-xs text-stone-700 bg-white border border-stone-300 px-3 py-1.5 rounded-lg shadow-xs hover:bg-stone-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Fleet Status</span>
              </button>
            </div>

            {/* Section 61 Dashboard: Real Database Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-stone-400 block">Total Riders</span>
                <span className="text-xl font-bold font-display text-stone-900">{riders.length}</span>
              </div>
              <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-emerald-700 block">Available</span>
                <span className="text-xl font-bold font-display text-emerald-950">
                  {riders.filter(r => r.status === 'AVAILABLE').length}
                </span>
              </div>
              <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-blue-700 block">On Delivery</span>
                <span className="text-xl font-bold font-display text-blue-950">
                  {riders.filter(r => r.status === 'ON_THE_WAY').length}
                </span>
              </div>
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Busy / Assigned</span>
                <span className="text-xl font-bold font-display text-amber-950">
                  {riders.filter(r => r.status === 'ASSIGNED' || r.status === 'BUSY').length}
                </span>
              </div>
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-stone-500 block">Offline</span>
                <span className="text-xl font-bold font-display text-stone-700">
                  {riders.filter(r => r.status === 'OFFLINE').length}
                </span>
              </div>
              <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-purple-700 block">Deliveries Today</span>
                <span className="text-xl font-bold font-display text-purple-950">
                  {todayOrders.filter(o => o.fulfilmentType === 'DELIVERY').length}
                </span>
              </div>
              <div className="bg-green-50 p-3.5 rounded-xl border border-green-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase text-green-700 block">Completed Today</span>
                <span className="text-xl font-bold font-display text-green-950">
                  {todayOrders.filter(o => o.fulfilmentType === 'DELIVERY' && o.status === 'DELIVERED').length}
                </span>
              </div>
            </div>

            {/* Section 64: Rider Workload Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold font-display text-sm text-stone-900">
                    Rider Workload & Fleet Roster
                  </h3>
                  <p className="text-xs text-stone-500">
                    Current assignments, contact channels, and operational status controls
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Rider Name</th>
                      <th className="px-5 py-3">Phone Numbers</th>
                      <th className="px-5 py-3">Assigned Route</th>
                      <th className="px-5 py-3">Current Status</th>
                      <th className="px-5 py-3">Active Order</th>
                      <th className="px-5 py-3 text-center">Active Trips</th>
                      <th className="px-5 py-3 text-center">Completed</th>
                      <th className="px-5 py-3 text-right">Status Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {riders.map(rider => (
                      <tr key={rider.id} className="hover:bg-stone-50/70">
                        <td className="px-5 py-3.5 font-bold text-stone-900 font-display">
                          {rider.name}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-stone-800">
                          <div className="flex items-center gap-1 font-bold">
                            <Phone className="w-3 h-3 text-amber-700" />
                            <span>{rider.phone}</span>
                          </div>
                          {rider.altPhone && (
                            <div className="text-[11px] text-stone-500 font-normal">
                              Alt: {rider.altPhone}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-stone-600 italic">
                          {rider.areaNote || 'Bannu Central'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            rider.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                            rider.status === 'ON_THE_WAY' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                            rider.status === 'ASSIGNED' ? 'bg-amber-100 text-amber-800' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {(rider.status || 'AVAILABLE').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono">
                          {rider.currentOrderNumber ? (
                            <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              #{rider.currentOrderNumber}
                            </span>
                          ) : (
                            <span className="text-stone-400 italic">None</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold font-mono">
                          {rider.activeDeliveries || 0}
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold font-mono text-emerald-800">
                          {rider.completedDeliveries || 0}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <select
                            value={rider.status}
                            onChange={(e) => handleUpdateRiderStatus(rider.id, e.target.value as RiderStatus)}
                            className="text-xs bg-stone-50 border border-stone-300 rounded p-1 font-medium"
                          >
                            <option value="AVAILABLE">Set AVAILABLE</option>
                            <option value="BUSY">Set BUSY</option>
                            <option value="ON_THE_WAY">Set ON THE WAY</option>
                            <option value="OFFLINE">Set OFFLINE</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 65: Delivery History per Rider */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold font-display text-sm text-stone-900">
                    Rider Delivery Performance History
                  </h3>
                  <p className="text-xs text-stone-500">
                    Historical logs of all deliveries executed by Sahara riders
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-stone-600">Filter Rider:</label>
                  <select
                    value={selectedRiderFilter}
                    onChange={(e) => setSelectedRiderFilter(e.target.value)}
                    className="text-xs bg-white border border-stone-300 rounded-lg p-1.5"
                  >
                    <option value="ALL">All Riders</option>
                    {riders.map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Order #</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Rider Name</th>
                      <th className="px-5 py-3">Customer Area</th>
                      <th className="px-5 py-3">Delivery Fee</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders
                      .filter(o => o.fulfilmentType === 'DELIVERY')
                      .filter(o => selectedRiderFilter === 'ALL' || o.riderName === selectedRiderFilter)
                      .slice(0, 20)
                      .map(ord => (
                        <tr key={ord.id} className="hover:bg-stone-50/70">
                          <td className="px-5 py-3 font-mono font-bold text-stone-900">
                            {ord.orderNumber}
                          </td>
                          <td className="px-5 py-3 text-stone-500 font-mono text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-3 font-semibold text-stone-900">
                            {ord.riderName || <span className="text-stone-400 italic">Unassigned</span>}
                          </td>
                          <td className="px-5 py-3 text-stone-700">
                            {ord.deliveryAddress?.area || 'Bannu'}
                          </td>
                          <td className="px-5 py-3 font-mono text-stone-800">
                            Rs. {ord.deliveryFee}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ord.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              ord.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-100 text-blue-800' :
                              'bg-stone-100 text-stone-700'
                            }`}>
                              {(ord.status || 'PENDING').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-stone-950 text-right">
                            Rs. {ord.totalAmount}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: PRODUCT STOCK AVAILABILITY (Manager quick toggle) */}
        {activeTab === 'availability' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-display text-stone-900">
                Menu Item Availability Control
              </h2>
              <p className="text-xs text-stone-500">
                Instantly mark sold out or back-in-stock items across all customer and waiter terminals
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(prod => (
                <div 
                  key={prod.id}
                  className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${prod.available ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{prod.name}</h4>
                      <span className="text-[10px] text-stone-500 uppercase">{prod.category} • Rs. {prod.basePrice}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleProduct(prod)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      prod.available 
                        ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800' 
                        : 'bg-red-100 text-red-800 hover:bg-green-100 hover:text-green-800'
                    }`}
                  >
                    {prod.available ? 'In Stock' : 'Sold Out'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MANAGER OPERATIONAL HISTORY (Section 43) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900">
                  Manager Operational History
                </h2>
                <p className="text-xs text-stone-500">
                  Comprehensive historical view across Counter, Kitchen, and Delivery channels
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex rounded-lg border border-stone-300 bg-white p-0.5 text-xs">
                  <button
                    onClick={() => setHistoryDateFilter('today')}
                    className={`px-3 py-1 rounded-md font-semibold ${historyDateFilter === 'today' ? 'bg-amber-800 text-white' : 'text-stone-600'}`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setHistoryDateFilter('yesterday')}
                    className={`px-3 py-1 rounded-md font-semibold ${historyDateFilter === 'yesterday' ? 'bg-amber-800 text-white' : 'text-stone-600'}`}
                  >
                    Yesterday
                  </button>
                  <button
                    onClick={() => setHistoryDateFilter('all')}
                    className={`px-3 py-1 rounded-md font-semibold ${historyDateFilter === 'all' ? 'bg-amber-800 text-white' : 'text-stone-600'}`}
                  >
                    All Dates
                  </button>
                </div>

                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-stone-300 rounded-lg p-1.5 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELIVERED">Delivered / Finished</option>
                  <option value="OUT_FOR_DELIVERY">On The Way</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search order #, phone, customer..."
                  className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 w-48"
                />
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Order #</th>
                      <th className="px-5 py-3.5">Timestamp</th>
                      <th className="px-5 py-3.5">Customer & Phone</th>
                      <th className="px-5 py-3.5">Channel / Fulfilment</th>
                      <th className="px-5 py-3.5">Items</th>
                      <th className="px-5 py-3.5">Total Amount</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {historyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-stone-400">
                          {isLoadingHistory ? 'Loading history...' : 'No orders found matching this filter.'}
                        </td>
                      </tr>
                    ) : (
                      historyOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-stone-50/70">
                          <td className="px-5 py-3 font-mono font-bold text-stone-900">
                            {ord.orderNumber}
                          </td>
                          <td className="px-5 py-3 text-stone-500 font-mono text-[11px]">
                            {new Date(ord.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-bold text-stone-800 block">{ord.customerName}</span>
                            <span className="text-[11px] text-stone-500 font-mono">{ord.customerPhone}</span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="font-medium text-stone-700 block">
                              {ord.fulfilmentType === 'DELIVERY' ? '🛵 Delivery' : '🛍️ Pickup / Dine'}
                            </span>
                            {ord.riderName && (
                              <span className="text-[10px] text-stone-400 block">Rider: {ord.riderName}</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-stone-600 max-w-xs truncate">
                            {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                          </td>
                          <td className="px-5 py-3 font-mono font-bold text-stone-950">
                            Rs. {ord.totalAmount}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ord.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                              ord.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {(ord.status || 'PENDING').replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => setInspectingOrder(ord)}
                              className="text-amber-800 hover:text-amber-950 font-semibold underline text-xs"
                            >
                              Inspect
                            </button>
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

      {/* Inspect Order Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold font-display text-base text-stone-900">
                  Order Details: {inspectingOrder.orderNumber}
                </h3>
                <span className="text-xs text-stone-500">{new Date(inspectingOrder.createdAt).toLocaleString()}</span>
              </div>
              <button onClick={() => setInspectingOrder(null)} className="text-stone-400 hover:text-stone-700 text-sm font-bold">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                <div><strong>Customer:</strong> {inspectingOrder.customerName} ({inspectingOrder.customerPhone})</div>
                <div><strong>Fulfilment:</strong> {inspectingOrder.fulfilmentType} ({inspectingOrder.deliveryAddress.street}, {inspectingOrder.deliveryAddress.area})</div>
                {inspectingOrder.riderName && <div><strong>Assigned Rider:</strong> {inspectingOrder.riderName}</div>}
                <div><strong>Payment:</strong> Cash on Delivery (Status: {inspectingOrder.paymentStatus})</div>
              </div>

              <div className="divide-y divide-stone-100 pt-2">
                <span className="font-bold block mb-1">Items:</span>
                {inspectingOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between py-1.5">
                    <span><strong>{i.quantity}×</strong> {i.productName}</span>
                    <span className="font-mono">Rs. {i.itemTotal}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 pt-2 flex justify-between font-bold text-sm">
                <span>Total Amount:</span>
                <span className="font-mono text-amber-900">Rs. {inspectingOrder.totalAmount}</span>
              </div>

              <div className="border-t border-stone-100 pt-2">
                <span className="font-bold block mb-1">Status Timeline:</span>
                <div className="space-y-1 text-[11px] text-stone-600">
                  {inspectingOrder.timeline.map((t, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• {t.note || t.status}</span>
                      <span className="font-mono text-stone-400">{new Date(t.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setOrderForReprint(inspectingOrder);
                  setIsThermalReprintOpen(true);
                }}
                className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Reprint Thermal Receipt</span>
              </button>
              <button
                onClick={() => setInspectingOrder(null)}
                className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manager Thermal Reprint Modal */}
      <ThermalReceiptModal
        order={orderForReprint}
        isOpen={isThermalReprintOpen}
        onClose={() => setIsThermalReprintOpen(false)}
        isReprint={true}
      />

    </div>
  );
};
