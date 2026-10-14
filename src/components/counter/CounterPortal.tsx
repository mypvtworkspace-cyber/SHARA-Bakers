import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  Banknote, 
  LogOut, 
  RefreshCw, 
  Store,
  DollarSign,
  Receipt,
  QrCode,
  Filter,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderEngine, VALID_ORDER_TRANSITIONS } from '../../services/orderEngine';
import { Order, OrderStatus } from '../../types';
import { ThermalReceiptModal } from '../ThermalReceiptModal';
import { OrderReceiptModal } from '../OrderReceiptModal';

export const CounterPortal: React.FC = () => {
  const { 
    orders, 
    refreshData, 
    currentUser, 
    logout, 
    setCurrentView,
    settings 
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedOrderForThermal, setSelectedOrderForThermal] = useState<Order | null>(null);
  const [selectedOrderForCustomerReceipt, setSelectedOrderForCustomerReceipt] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter(o => {
      const matchesSearch = !q || 
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.deliveryAddress?.street && o.deliveryAddress.street.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || 
        (paymentFilter === 'PENDING' && o.paymentStatus !== 'PAYMENT_CONFIRMED') ||
        (paymentFilter === 'CONFIRMED' && o.paymentStatus === 'PAYMENT_CONFIRMED') ||
        (paymentFilter === 'EASYPAISA' && o.paymentMethod === 'EASYPAISA') ||
        (paymentFilter === 'CASH' && o.paymentMethod !== 'EASYPAISA');

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Operational metrics
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === todayStr);
    const pendingPayment = orders.filter(o => o.paymentStatus !== 'PAYMENT_CONFIRMED' && !['CANCELLED', 'REJECTED'].includes(o.status));
    const confirmedPaid = orders.filter(o => o.paymentStatus === 'PAYMENT_CONFIRMED');
    const easypaisaOrders = orders.filter(o => o.paymentMethod === 'EASYPAISA');
    const totalRevenue = confirmedPaid.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

    return {
      todayCount: todayOrders.length,
      pendingPaymentCount: pendingPayment.length,
      confirmedCount: confirmedPaid.length,
      easypaisaCount: easypaisaOrders.length,
      totalRevenue,
    };
  }, [orders]);

  const handleConfirmPayment = async (orderId: string) => {
    if (!currentUser) return;
    setIsProcessing(orderId);
    try {
      const res = await OrderEngine.confirmCODPayment(orderId, currentUser);
      if (res.success) {
        await refreshData();
      } else {
        alert(res.error || 'Failed to confirm payment.');
      }
    } finally {
      setIsProcessing(null);
    }
  };

  const handleAdvanceStatus = async (orderId: string, nextStatus: OrderStatus) => {
    if (!currentUser) return;
    setIsProcessing(orderId);
    try {
      const res = await OrderEngine.updateOrderStatus({
        orderId,
        newStatus: nextStatus,
        actor: currentUser,
        note: `Status advanced to ${nextStatus} by Counter Staff (${currentUser.name})`
      });
      if (res.success) {
        await refreshData();
      } else {
        alert(res.error || 'Failed to update order status.');
      }
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center font-bold text-lg font-serif shadow">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-white">
                  Sahara Bakers — Counter & Cashier Portal
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Billing & POS
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Railway Road, Bannu • Logged in as: <span className="text-amber-400 font-semibold">{currentUser?.name || 'Counter Cashier'} ({currentUser?.email})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshData()}
              className="p-2 text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors border border-stone-700"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('store')}
              className="px-3 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg border border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Store</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 rounded-lg border border-rose-800/50 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5 mb-1">
              <Receipt className="w-3.5 h-3.5 text-amber-700" />
              <span>Today's Orders</span>
            </div>
            <div className="text-2xl font-bold font-mono text-stone-900">{stats.todayCount}</div>
            <span className="text-[10px] text-stone-400">Total bills generated</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Pending Payment</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-700">{stats.pendingPaymentCount}</div>
            <span className="text-[10px] text-amber-600 font-medium">Awaiting cash/verification</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5 mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
              <span>Paid / Confirmed</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">{stats.confirmedCount}</div>
            <span className="text-[10px] text-stone-400">Settled receipts</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5 mb-1">
              <QrCode className="w-3.5 h-3.5 text-teal-700" />
              <span>Easypaisa Orders</span>
            </div>
            <div className="text-2xl font-bold font-mono text-teal-800">{stats.easypaisaCount}</div>
            <span className="text-[10px] text-stone-400">Mobile QR / transfers</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-stone-700" />
              <span>Settled Revenue</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-stone-950">Rs. {stats.totalRevenue.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-700 font-semibold">Authoritative total</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order #, Customer Name, Phone, Area..."
              className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg p-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-stone-500 ml-1.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-stone-700 pr-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="ORDER_PLACED">Placed</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-lg p-1 text-xs">
              <Banknote className="w-3.5 h-3.5 text-stone-500 ml-1.5" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="bg-transparent font-medium text-stone-700 pr-2 py-1 focus:outline-none cursor-pointer"
              >
                <option value="all">All Payments</option>
                <option value="PENDING">Pending Payment</option>
                <option value="CONFIRMED">Payment Confirmed</option>
                <option value="CASH">Cash Orders</option>
                <option value="EASYPAISA">Easypaisa Orders</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table & Cards */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <Receipt className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800">No Orders Match Your Query</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No orders found matching "{searchQuery}" or the selected status/payment filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((order) => {
              const isPaid = order.paymentStatus === 'PAYMENT_CONFIRMED';
              const isEasyPaisa = order.paymentMethod === 'EASYPAISA';

              return (
                <div 
                  key={order.id}
                  className={`bg-white rounded-xl border p-4.5 flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md ${
                    !isPaid ? 'border-amber-300 ring-1 ring-amber-400/20' : 'border-stone-200'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Order Card Row */}
                    <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                      <div>
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          #{order.orderNumber}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-mono">
                          {order.orderDateTime || new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'DELIVERED' || order.status === 'PICKED_UP'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'CANCELLED' || order.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {(order.status || 'PENDING').replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[10px] font-bold uppercase font-mono px-1.5 py-0.2 rounded ${
                          isPaid ? 'text-emerald-700 bg-emerald-50' : 'text-amber-800 bg-amber-50'
                        }`}>
                          {isPaid ? '✓ PAID' : '⚠ PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="text-xs space-y-1 text-stone-700">
                      <div className="font-semibold text-stone-900 flex items-center justify-between">
                        <span>{order.customerName}</span>
                        <span className="font-mono text-stone-500 font-normal">{order.customerPhone}</span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">
                          {order.fulfilmentType === 'DELIVERY' 
                            ? `${order.deliveryAddress?.area || 'Bannu'} • ${order.deliveryAddress?.street || ''}`
                            : 'Counter Express Pickup'}
                        </span>
                      </div>

                      {order.fulfilmentType === 'DELIVERY' && (
                        <div className="text-[11px] pt-1">
                          {order.riderName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                              🚴 Rider: <strong>{order.riderName}</strong>
                              {order.riderId && <span className="text-[10px] text-emerald-600">({order.riderId})</span>}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">
                              🚴 Awaiting Rider Claim / Dispatch
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Items Breakdown */}
                    <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-[11px] space-y-1">
                      <div className="font-bold text-stone-600 uppercase text-[9px] tracking-wider mb-1">
                        Ordered Items ({order.items.length})
                      </div>
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-stone-800">
                          <span className="truncate max-w-[200px]">
                            {it.quantity}x {it.productName} {it.customization?.size ? `(${it.customization.size})` : ''}
                          </span>
                          <span className="font-mono text-stone-700 font-semibold">
                            Rs. {it.itemTotal}
                          </span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-stone-200 flex justify-between items-center text-xs font-bold text-stone-950">
                        <span>Total Payable</span>
                        <span className="font-mono text-amber-900 font-extrabold text-sm">
                          Rs. {order.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method Badge */}
                    <div className="flex items-center justify-between text-[11px] bg-stone-100 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-stone-600" />
                        <span className="font-semibold text-stone-800">
                          {isEasyPaisa ? '📱 Easypaisa (QR Transfer)' : '💵 Cash on Delivery'}
                        </span>
                      </div>
                      {isEasyPaisa && (
                        <span className="text-[9px] font-bold text-teal-800 uppercase bg-teal-100 px-1.5 py-0.5 rounded">
                          QR Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-stone-100 space-y-2 mt-3">
                    {/* Payment Confirmation Button */}
                    {!isPaid && (
                      <button
                        onClick={() => handleConfirmPayment(order.id)}
                        disabled={isProcessing === order.id}
                        className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{isProcessing === order.id ? 'Processing...' : 'Confirm Payment Received'}</span>
                      </button>
                    )}

                    {/* Receipt Printing Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedOrderForThermal(order)}
                        className="py-1.5 px-2 text-[11px] font-semibold text-stone-800 bg-stone-50 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Printer className="w-3 h-3 text-amber-700" />
                        <span>Thermal POS</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrderForCustomerReceipt(order)}
                        className="py-1.5 px-2 text-[11px] font-semibold text-stone-800 bg-stone-50 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <Receipt className="w-3 h-3 text-stone-600" />
                        <span>Bill Receipt</span>
                      </button>
                    </div>

                    {/* Status Progression Controls */}
                    {(VALID_ORDER_TRANSITIONS[order.status] || []).length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {(VALID_ORDER_TRANSITIONS[order.status] || []).map((nextSt) => (
                          <button
                            key={nextSt}
                            onClick={() => handleAdvanceStatus(order.id, nextSt)}
                            disabled={isProcessing === order.id}
                            className="flex-1 py-1 px-1.5 text-[10px] font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors flex items-center justify-center gap-1"
                          >
                            <span>Mark: {(nextSt || '').replace(/_/g, ' ')}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Thermal Receipt Print Modal (Supports 58mm/80mm roll, logo, & Easypaisa QR) */}
      {selectedOrderForThermal && (
        <ThermalReceiptModal
          order={selectedOrderForThermal}
          isOpen={!!selectedOrderForThermal}
          onClose={() => setSelectedOrderForThermal(null)}
        />
      )}

      {/* Customer Full Receipt Modal */}
      {selectedOrderForCustomerReceipt && (
        <OrderReceiptModal
          order={selectedOrderForCustomerReceipt}
          onClose={() => setSelectedOrderForCustomerReceipt(null)}
          onTrack={() => setSelectedOrderForCustomerReceipt(null)}
        />
      )}
    </div>
  );
};
