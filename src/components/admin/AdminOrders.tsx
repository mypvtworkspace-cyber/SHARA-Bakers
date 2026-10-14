import React, { useState } from 'react';
import { Search, XCircle, ArrowRight, Printer, Banknote } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OrderEngine, VALID_ORDER_TRANSITIONS } from '../../services/orderEngine';
import { Order, OrderStatus } from '../../types';

export const AdminOrders: React.FC = () => {
  const { orders, refreshData, currentUser, setConfirmedOrderForReceipt } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const cleanQuery = searchQuery.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    const matchesFilter = filterStatus === 'all' || o.status === filterStatus;
    const matchesSearch = 
      !cleanQuery ||
      o.orderNumber.toLowerCase().includes(cleanQuery) ||
      o.customerName.toLowerCase().includes(cleanQuery) ||
      o.customerPhone.includes(cleanQuery) ||
      (o.deliveryAddress?.street && o.deliveryAddress.street.toLowerCase().includes(cleanQuery)) ||
      (o.deliveryAddress?.area && o.deliveryAddress.area.toLowerCase().includes(cleanQuery));

    return matchesFilter && matchesSearch;
  });

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser) return;
    const res = await OrderEngine.updateOrderStatus({
      orderId,
      newStatus,
      actor: currentUser,
    });
    if (res.success && res.order) {
      await refreshData();
      setSelectedOrder(res.order);
    } else {
      alert(res.error || 'Failed to update order status');
    }
  };

  const handleConfirmCODPayment = async (orderId: string) => {
    if (!currentUser) return;
    const res = await OrderEngine.confirmCODPayment(orderId, currentUser);
    if (res.success && res.order) {
      await refreshData();
      setSelectedOrder(res.order);
    } else {
      alert(res.error || 'Failed to confirm Cash on Delivery payment');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            Customer Orders & Operations
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Authoritative order state machine, full customer delivery data & Cash on Delivery tracking
          </p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, Name or Phone..."
            className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-700"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-200">
        {[
          { id: 'all', label: `All (${orders.length})` },
          { id: 'ORDER_PLACED', label: 'New Placed' },
          { id: 'ACCEPTED', label: 'Accepted' },
          { id: 'PREPARING', label: 'Preparing' },
          { id: 'READY', label: 'Ready' },
          { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
          { id: 'DELIVERED', label: 'Delivered' },
          { id: 'CANCELLED', label: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              filterStatus === tab.id
                ? 'bg-amber-800 text-white'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-500">
            No customer orders found matching the selected filter or search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3">Order #</th>
                  <th className="px-5 py-3">Date / Time</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Fulfilment</th>
                  <th className="px-5 py-3">Total Payable</th>
                  <th className="px-5 py-3">Payment (COD)</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70">
                    <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                      #{ord.orderNumber}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500 whitespace-nowrap">
                      {ord.orderDateTime || new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-stone-900">{ord.customerName}</div>
                      <div className="text-[11px] text-stone-500 font-mono">{ord.customerPhone}</div>
                      <div className="text-[10px] text-stone-400">
                        {ord.guestOrder ? 'Guest' : 'Registered'}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-semibold">{ord.fulfilmentType}</span>
                      {ord.deliveryAddress && (
                        <div className="text-[10px] text-stone-500 truncate max-w-[140px]">
                          {ord.deliveryAddress.area}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                      Rs. {ord.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        ord.paymentStatus === 'PAYMENT_CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {ord.paymentStatus === 'PAYMENT_CONFIRMED' ? 'CASH RECEIVED' : 'COD PENDING'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
                        {(ord.status || 'PENDING').replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(ord)}
                        className="px-2.5 py-1 text-stone-800 bg-stone-100 hover:bg-stone-200 rounded font-semibold text-[11px] transition-colors"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Order Detailed Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg font-display text-stone-900">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    {(selectedOrder.status || 'PENDING').replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Placed on: {selectedOrder.orderDateTime || new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold p-1 rounded hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {/* 1. CUSTOMER IDENTITY DATA */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-stone-500 text-[10px] block">
                Customer & Account
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-500">Name:</span>{' '}
                  <strong className="text-stone-900 text-sm">{selectedOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-stone-500">Mobile Phone:</span>{' '}
                  <strong className="text-stone-900 font-mono text-sm">{selectedOrder.customerPhone}</strong>
                </div>
                {selectedOrder.customerEmail && (
                  <div>
                    <span className="text-stone-500">Email:</span>{' '}
                    <span className="text-stone-800">{selectedOrder.customerEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-stone-500">Account Type:</span>{' '}
                  <span className="text-stone-800 font-medium">
                    {selectedOrder.guestOrder ? 'Guest Order (No registration required)' : 'Registered Customer'}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. COMPLETE DELIVERY DATA */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-1.5 text-xs">
              <span className="font-bold uppercase tracking-wider text-stone-500 text-[10px] block">
                Delivery Location in Bannu
              </span>
              <div className="space-y-1">
                <div>
                  <span className="text-stone-500">Fulfilment Type:</span>{' '}
                  <strong className="text-stone-900">{selectedOrder.fulfilmentType}</strong>
                </div>
                {selectedOrder.deliveryAddress && (
                  <div>
                    <span className="text-stone-500">Full Address:</span>{' '}
                    <strong className="text-stone-900 leading-relaxed">
                      {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.area}, Bannu
                    </strong>
                    {selectedOrder.deliveryAddress.landmark && (
                      <span className="text-stone-600 block mt-0.5">
                        Landmark: {selectedOrder.deliveryAddress.landmark}
                      </span>
                    )}
                  </div>
                )}
                {selectedOrder.deliveryNotes && (
                  <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 font-medium mt-1">
                    Customer Delivery Note: "{selectedOrder.deliveryNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* 3. ITEM-LEVEL COMPLETE SNAPSHOT */}
            <div className="space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-stone-600 block">
                Ordered Items ({selectedOrder.items.length})
              </span>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <div className="flex justify-between font-bold text-stone-900">
                      <span className="text-sm">
                        {item.quantity} × {item.productName}
                      </span>
                      <span className="font-mono text-sm">
                        Rs. {item.itemTotal.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-600 space-y-0.5 pl-3 border-l-2 border-amber-300">
                      {item.size && (
                        <div>Size: <strong>{item.size}</strong></div>
                      )}
                      {item.numberOfPersons && (
                        <div className="font-bold text-amber-900">
                          • Gatherings / Servings: {item.numberOfPersons} {item.numberOfPersons === 1 ? 'Person' : 'Persons'}
                        </div>
                      )}
                      {item.customization?.flavor && (
                        <div>Flavor: {item.customization.flavor}</div>
                      )}
                      {item.customization?.crust && (
                        <div>Crust: {item.customization.crust}</div>
                      )}
                      {item.selectedAddonsSnapshot && item.selectedAddonsSnapshot.length > 0 && (
                        <div>
                          Add-ons: {item.selectedAddonsSnapshot.map(a => `${a.name} (+Rs.${a.price})`).join(', ')}
                        </div>
                      )}
                      {item.customerNote && (
                        <div className="italic text-stone-500">Note: "{item.customerNote}"</div>
                      )}
                      <div className="font-mono text-[10px] text-stone-400">
                        Unit Base Price: Rs. {item.unitPrice}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. FINANCIAL SNAPSHOT & CASH ON DELIVERY CONTROLS */}
            <div className="p-4 bg-stone-100 rounded-xl border border-stone-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="font-sans">Subtotal</span>
                <span>Rs. {selectedOrder.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans">Delivery Fee</span>
                <span>{selectedOrder.deliveryFee === 0 ? 'FREE' : `Rs. ${selectedOrder.deliveryFee}`}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="flex justify-between text-green-700 font-bold">
                  <span className="font-sans">Discount ({selectedOrder.couponCode})</span>
                  <span>-Rs. {selectedOrder.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-stone-950 pt-2 border-t border-stone-300">
                <span className="font-sans">Final Payable in Cash (COD)</span>
                <span>Rs. {selectedOrder.totalAmount.toLocaleString()}</span>
              </div>

              {/* COD Payment Status & Confirmation Action */}
              <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-700" />
                  <span className="font-sans font-semibold">Payment Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    selectedOrder.paymentStatus === 'PAYMENT_CONFIRMED'
                      ? 'bg-green-200 text-green-900'
                      : 'bg-amber-200 text-amber-950'
                  }`}>
                    {selectedOrder.paymentStatus === 'PAYMENT_CONFIRMED' ? 'CASH RECEIVED (Confirmed)' : 'PAYMENT PENDING (Cash on Delivery)'}
                  </span>
                </div>
                {selectedOrder.paymentStatus !== 'PAYMENT_CONFIRMED' && (
                  <button
                    onClick={() => handleConfirmCODPayment(selectedOrder.id)}
                    className="w-full sm:w-auto px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded font-sans font-bold text-xs shadow transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Confirm Cash Received</span>
                  </button>
                )}
              </div>
            </div>

            {/* 5. AUTHORITATIVE STATUS ADVANCEMENT BUTTONS */}
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <span className="text-xs font-bold text-stone-700 block">
                Advance Order Lifecycle:
              </span>
              <div className="flex flex-wrap gap-2">
                {(VALID_ORDER_TRANSITIONS[selectedOrder.status] || []).map((nextStatus) => {
                  const isCancelAction = nextStatus === 'CANCELLED' || nextStatus === 'REJECTED';
                  return (
                    <button
                      key={nextStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, nextStatus)}
                      className={`px-3 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ${
                        isCancelAction
                          ? 'bg-rose-700 hover:bg-rose-800'
                          : 'bg-amber-800 hover:bg-amber-900'
                      }`}
                    >
                      {isCancelAction && <XCircle className="w-3.5 h-3.5" />}
                      <span>Mark as: {(nextStatus || '').replace(/_/g, ' ')}</span>
                      {!isCancelAction && <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* View Full Printable Receipt Action */}
            <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setConfirmedOrderForReceipt(selectedOrder);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded border border-stone-300 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open / Print Customer Receipt</span>
              </button>
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded transition-colors"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
