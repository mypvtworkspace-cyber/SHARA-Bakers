import React, { useState } from 'react';
import { ChefHat, Clock, ArrowRight, RefreshCw, Volume2, VolumeX, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuthService } from '../services/authService';
import { OrderEngine } from '../services/orderEngine';
import { OrderStatus, Order } from '../types';

export const KitchenDisplay: React.FC = () => {
  const { currentUser, orders, refreshData, setCurrentView } = useApp();
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Authoritative staff RBAC check
  if (!AuthService.canAccessKitchen(currentUser)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-700 rounded-full">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-stone-900">403 – Unauthorized Access</h2>
        <p className="text-xs text-stone-600 max-w-md">
          The Kitchen Display System requires authenticated kitchen staff or manager credentials. 
          Please sign in with authorized staff credentials.
        </p>
        <button
          onClick={() => setCurrentView('store')}
          className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded hover:bg-stone-800"
        >
          Return to Storefront
        </button>
      </div>
    );
  }

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!currentUser) return;
    const res = await OrderEngine.updateOrderStatus({
      orderId,
      newStatus,
      actor: currentUser,
    });
    if (res.success) {
      await refreshData();
    } else {
      alert(res.error || 'Unable to update status.');
    }
  };

  // Group active orders by operational columns
  const activeOrders = orders.filter(o => !['DELIVERED', 'PICKED_UP', 'CANCELLED', 'REJECTED'].includes(o.status));
  const newOrders = activeOrders.filter(o => o.status === 'ORDER_PLACED');
  const acceptedOrders = activeOrders.filter(o => o.status === 'ACCEPTED');
  const preparingOrders = activeOrders.filter(o => o.status === 'PREPARING');
  const readyOrders = activeOrders.filter(o => o.status === 'READY' || o.status === 'OUT_FOR_DELIVERY' || o.status === 'READY_FOR_PICKUP');

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col">
      
      {/* KDS Header */}
      <div className="bg-stone-950 px-6 py-4 border-b border-stone-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-600/30 text-amber-400 rounded-lg">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold font-display text-white tracking-wide">
              Sahara Bakers Kitchen Display (KDS)
            </h1>
            <p className="text-xs text-stone-400">
              Railway Road Kitchen • Live orders & Earthen Pot Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-white px-2 py-1 rounded bg-stone-800"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5 text-stone-500" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>
          <button
            onClick={refreshData}
            className="flex items-center gap-1 text-xs text-stone-300 hover:text-white px-3 py-1.5 bg-stone-800 hover:bg-stone-700 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setCurrentView('store')}
            className="text-xs text-stone-400 hover:text-white font-medium"
          >
            Exit KDS
          </button>
        </div>
      </div>

      {/* Columns Grid */}
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto">
        
        {/* Column 1: NEW ORDERS */}
        <div className="bg-stone-950/60 rounded-xl border border-stone-800 flex flex-col">
          <div className="p-3 border-b border-stone-800 bg-stone-900/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              1. New Incoming
            </span>
            <span className="text-xs font-mono font-bold bg-amber-950 text-amber-300 px-2 py-0.5 rounded">
              {newOrders.length}
            </span>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {newOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-600">No new orders waiting.</div>
            ) : (
              newOrders.map((ord) => (
                <KdsOrderCard
                  key={ord.id}
                  order={ord}
                  onNext={() => handleUpdateStatus(ord.id, 'ACCEPTED')}
                  nextLabel="Accept Order"
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: ACCEPTED / QUEUED */}
        <div className="bg-stone-950/60 rounded-xl border border-stone-800 flex flex-col">
          <div className="p-3 border-b border-stone-800 bg-stone-900/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              2. Accepted & Queued
            </span>
            <span className="text-xs font-mono font-bold bg-blue-950 text-blue-300 px-2 py-0.5 rounded">
              {acceptedOrders.length}
            </span>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {acceptedOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-600">No queued orders.</div>
            ) : (
              acceptedOrders.map((ord) => (
                <KdsOrderCard
                  key={ord.id}
                  order={ord}
                  onNext={() => handleUpdateStatus(ord.id, 'PREPARING')}
                  nextLabel="Start Baking in Clay Pot"
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: PREPARING IN OVEN */}
        <div className="bg-stone-950/60 rounded-xl border border-stone-800 flex flex-col">
          <div className="p-3 border-b border-stone-800 bg-stone-900/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
              3. In Oven / Preparing
            </span>
            <span className="text-xs font-mono font-bold bg-orange-950 text-orange-300 px-2 py-0.5 rounded">
              {preparingOrders.length}
            </span>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-600">Nothing currently baking.</div>
            ) : (
              preparingOrders.map((ord) => (
                <KdsOrderCard
                  key={ord.id}
                  order={ord}
                  onNext={() => handleUpdateStatus(ord.id, 'READY')}
                  nextLabel="Mark Ready / Boxed"
                />
              ))
            )}
          </div>
        </div>

        {/* Column 4: READY / DISPATCH */}
        <div className="bg-stone-950/60 rounded-xl border border-stone-800 flex flex-col">
          <div className="p-3 border-b border-stone-800 bg-stone-900/80 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-green-400">
              4. Ready for Handover
            </span>
            <span className="text-xs font-mono font-bold bg-green-950 text-green-300 px-2 py-0.5 rounded">
              {readyOrders.length}
            </span>
          </div>
          <div className="p-3 space-y-3 overflow-y-auto flex-1">
            {readyOrders.length === 0 ? (
              <div className="text-center py-8 text-xs text-stone-600">No ready orders waiting.</div>
            ) : (
              readyOrders.map((ord) => (
                <KdsOrderCard
                  key={ord.id}
                  order={ord}
                  onNext={() => {
                    const finalStatus = ord.fulfilmentType === 'DELIVERY' ? 'DELIVERED' : 'PICKED_UP';
                    handleUpdateStatus(ord.id, finalStatus);
                  }}
                  nextLabel={ord.fulfilmentType === 'DELIVERY' ? 'Delivered to Customer' : 'Picked Up by Customer'}
                />
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

interface KdsCardProps {
  order: Order;
  onNext: () => void;
  nextLabel: string;
}

const KdsOrderCard: React.FC<KdsCardProps> = ({ order, onNext, nextLabel }) => {
  const elapsedMinutes = Math.floor(
    (Date.now() - new Date(order.createdAt).getTime()) / 60000
  );

  return (
    <div className="bg-stone-900 rounded-lg border border-stone-800 p-3.5 space-y-3 shadow-md">
      
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-bold text-amber-400">
          #{order.orderNumber}
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400">
          <Clock className="w-3 h-3 text-stone-500" />
          <span>{elapsedMinutes}m ago</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
          order.fulfilmentType === 'DELIVERY' ? 'bg-amber-950 text-amber-300' : 'bg-stone-800 text-stone-300'
        }`}>
          {order.fulfilmentType}
        </span>
        <span className="text-stone-300 font-medium truncate">
          {order.customerName}
        </span>
      </div>

      {/* Items list with prominent Matka Pizza details */}
      <div className="border-t border-stone-800/80 pt-2 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="text-xs bg-stone-950/50 p-2 rounded border border-stone-800/50">
            <div className="font-bold text-stone-200">
              {item.quantity} × {item.productName}
            </div>
            {item.customization && (
              <div className="text-[11px] text-stone-400 mt-0.5 space-y-0.5">
                {item.customization.size && (
                  <div>Size: <strong className="text-stone-200">{item.customization.size}</strong></div>
                )}
                {item.customization.persons && (
                  <div className="text-amber-400 font-bold">
                    • Servings: {item.customization.persons} {item.customization.persons === 1 ? 'Person' : 'Persons'}
                  </div>
                )}
                {item.customization.flavor && (
                  <div>Flavor: <span className="text-stone-300">{item.customization.flavor}</span></div>
                )}
                {item.customization.crust && (
                  <div>Crust: <span className="text-stone-300">{item.customization.crust}</span></div>
                )}
                {item.customization.selectedAddons && item.customization.selectedAddons.length > 0 && (
                  <div>Addons: <span className="text-stone-300">{item.customization.selectedAddons.map(a => a.name).join(', ')}</span></div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <div className="text-[11px] italic text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-900/40">
          Kitchen Note: "{order.specialInstructions}"
        </div>
      )}

      {/* Next State Action Button */}
      <button
        onClick={onNext}
        className="w-full py-2 px-3 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded shadow transition-colors flex items-center justify-center gap-1.5"
      >
        <span>{nextLabel}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

    </div>
  );
};
