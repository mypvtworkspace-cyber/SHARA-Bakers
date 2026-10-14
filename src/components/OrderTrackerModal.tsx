import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Clock, ChefHat, Truck, Sparkles, RefreshCw, Phone, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Order, OrderStatus } from '../types';
import { OrderEngine } from '../services/orderEngine';

const STATUS_STEPS: { status: OrderStatus; label: string; urdu: string; icon: any }[] = [
  { status: 'ORDER_PLACED', label: 'Order Received', urdu: 'آرڈر موصول ہو گیا ہے', icon: Clock },
  { status: 'ACCEPTED', label: 'Accepted by Kitchen', urdu: 'باورچی خانے نے قبول کر لیا', icon: CheckCircle },
  { status: 'PREPARING', label: 'In Earthen Oven', urdu: 'روایتی مٹکے میں پک رہا ہے', icon: ChefHat },
  { status: 'READY', label: 'Ready & Packed', urdu: 'آرڈر تیار اور پیک ہو چکا', icon: CheckCircle },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', urdu: 'رائڈر بنوں میں روانہ', icon: Truck },
  { status: 'DELIVERED', label: 'Delivered', urdu: 'کامیابی سے پہنچا دیا گیا', icon: Sparkles },
];

export const OrderTrackerModal: React.FC = () => {
  const { activeOrderForTracking, setActiveOrderForTracking, setConfirmedOrderForReceipt, currentUser } = useApp();
  const [liveOrder, setLiveOrder] = useState<Order | null>(activeOrderForTracking);

  useEffect(() => {
    setLiveOrder(activeOrderForTracking);
  }, [activeOrderForTracking]);

  // Periodic polling from authoritative database to reflect kitchen updates in real time
  useEffect(() => {
    if (!liveOrder) return;
    const interval = setInterval(() => {
      const updated = OrderEngine.getOrderById(liveOrder.id, currentUser);
      if (updated) {
        setLiveOrder(updated);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [liveOrder?.id, currentUser]);

  if (!liveOrder) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.status === liveOrder.status);
  const isCancelled = liveOrder.status === 'CANCELLED' || liveOrder.status === 'REJECTED';

  const refreshNow = () => {
    const updated = OrderEngine.getOrderById(liveOrder.id, currentUser);
    if (updated) setLiveOrder(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-amber-900">
                Live Order Progress
              </span>
              <span className="font-mono font-bold text-xs bg-amber-100 text-amber-950 px-2 py-0.5 rounded">
                #{liveOrder.orderNumber}
              </span>
            </div>
            <h2 className="text-base font-bold font-display text-stone-900 mt-0.5">
              Sahara Bakers Bannu
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshNow}
              className="p-1.5 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-200 transition-colors"
              title="Refresh status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActiveOrderForTracking(null)}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* Status Timeline */}
          {isCancelled ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center text-xs space-y-1">
              <div className="font-bold">Order {liveOrder.status}</div>
              <p>For questions or assistance, please call Sahara Bakers directly at +92 330 5868488.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Current State</span>
                <span className="font-semibold text-amber-900">
                  {(liveOrder.status || 'PENDING').replace(/_/g, ' ')}
                </span>
              </div>

              {/* Progress Stepper */}
              <div className="relative border-l-2 border-stone-200 ml-4 pl-6 space-y-5">
                {STATUS_STEPS.map((step, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.status} className="relative flex items-start gap-3">
                      <div
                        className={`absolute -left-[33px] top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white transition-all ${
                          isDone
                            ? 'border-amber-700 text-amber-700 bg-amber-50'
                            : 'border-stone-300 text-stone-300'
                        } ${isCurrent ? 'ring-4 ring-amber-100' : ''}`}
                      >
                        <step.icon className="w-3 h-3" />
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                          {step.label}
                        </div>
                        <div className={`text-[11px] font-sans ${isCurrent ? 'text-amber-800 font-bold' : 'text-stone-400'}`}>
                          {step.urdu}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer & Fulfilment Details */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
            <div className="font-bold text-stone-900">Delivery Information</div>
            <div className="text-stone-600">
              Customer: <strong className="text-stone-800">{liveOrder.customerName}</strong> ({liveOrder.customerPhone})
            </div>
            {liveOrder.deliveryAddress && (
              <div className="text-stone-600">
                Destination: {liveOrder.deliveryAddress.street}, {liveOrder.deliveryAddress.area}, Bannu
              </div>
            )}
            {liveOrder.deliveryNotes && (
              <div className="text-amber-900 italic text-[11px]">
                Note: "{liveOrder.deliveryNotes}"
              </div>
            )}
            <div className="text-stone-600 font-mono">
              Payment: <strong className="text-stone-900">Cash on Delivery</strong> ({liveOrder.paymentStatus})
            </div>
          </div>

          {/* Ordered Items Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
              Ordered Items
            </h4>
            <div className="space-y-2">
              {liveOrder.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 text-xs flex justify-between gap-3">
                  <div>
                    <div className="font-bold text-stone-900">
                      {item.quantity} × {item.productName}
                    </div>
                    {item.customization && (
                      <div className="text-[11px] text-stone-500 mt-0.5 space-y-0.5">
                        {item.customization.size && <div>Size: {item.customization.size}</div>}
                        {item.customization.persons && (
                          <div className="font-semibold text-amber-900">
                            Serving: {item.customization.persons} {item.customization.persons === 1 ? 'Person' : 'Persons'}
                          </div>
                        )}
                        {item.customization.flavor && <div>Flavor: {item.customization.flavor}</div>}
                        {item.customization.selectedAddons && item.customization.selectedAddons.length > 0 && (
                          <div>Addons: {item.customization.selectedAddons.map(a => a.name).join(', ')}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="font-mono font-bold text-stone-900 shrink-0">
                    Rs. {item.itemTotal.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-xs font-mono">
              <span className="font-sans font-bold text-stone-800">Total Payable in Cash</span>
              <span className="text-base font-bold text-stone-950">Rs. {liveOrder.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Reassurance Call & Support Card */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs">
            <div className="font-bold text-amber-950">Need Help or Address Correction?</div>
            <p className="text-stone-600">
              Please keep your phone available. If you need any assistance, reach Sahara Bakers counter at:
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="font-bold font-mono text-amber-950 text-sm">+92 330 5868488</span>
              <a
                href="tel:+923305868488"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 text-white rounded font-bold text-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Helpline</span>
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={() => {
              setActiveOrderForTracking(null);
              setConfirmedOrderForReceipt(liveOrder);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-200 rounded transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>View Full Receipt</span>
          </button>
          <button
            onClick={() => setActiveOrderForTracking(null)}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded transition-colors"
          >
            Close Tracker
          </button>
        </div>

      </div>
    </div>
  );
};
