import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    fulfilmentType,
    setFulfilmentType,
    appliedCoupon,
    setAppliedCoupon,
    priceSummary,
    setIsCheckoutOpen,
    settings,
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setAppliedCoupon(couponInput.trim().toUpperCase());
    if (priceSummary.discount > 0) {
      setCouponMsg({ text: 'Coupon applied successfully!', isError: false });
    } else {
      setCouponMsg({ text: 'Coupon applied or will take effect when minimum order is met.', isError: false });
    }
  };

  const handleProceedToCheckout = () => {
    if (priceSummary.subtotal < settings.minimumOrderAmount) {
      setCouponMsg({
        text: `Minimum order amount is Rs. ${settings.minimumOrderAmount}.`,
        isError: true,
      });
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-800" />
            <h2 className="text-base font-bold font-display text-stone-900">
              Your Order Basket
            </h2>
            <span className="text-xs font-mono font-medium text-stone-500">
              ({cart.reduce((s, i) => s + i.quantity, 0)} items)
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fulfilment Switcher */}
        <div className="p-4 bg-stone-100/70 border-b border-stone-200">
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-200 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFulfilmentType('DELIVERY')}
              className={`py-2 rounded-md transition-colors ${
                fulfilmentType === 'DELIVERY'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Delivery in Bannu
            </button>
            <button
              onClick={() => setFulfilmentType('PICKUP')}
              className={`py-2 rounded-md transition-colors ${
                fulfilmentType === 'PICKUP'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Counter Pickup
            </button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-stone-500">
              <ShoppingBag className="w-12 h-12 text-stone-300 stroke-[1.5]" />
              <p className="text-sm font-medium text-stone-700">Your basket is currently empty.</p>
              <p className="text-xs text-stone-400">
                Explore our famous Matka Pizza, freshly baked pastries, or traditional sweets.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="bg-stone-50 rounded-xl border border-stone-200 p-3.5 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-stone-900 leading-snug">
                      {item.productName}
                    </h4>
                    {/* Structured Customization Details */}
                    {item.customization && (
                      <div className="text-[11px] text-stone-600 mt-1 space-y-0.5">
                        {item.customization.size && (
                          <div>Size: <span className="font-semibold">{item.customization.size}</span></div>
                        )}
                        {item.customization.persons && (
                          <div>Serving: <span className="font-semibold text-amber-900">{item.customization.persons} {item.customization.persons === 1 ? 'Person' : 'Persons'}</span></div>
                        )}
                        {item.customization.flavor && (
                          <div>Flavor: <span className="font-semibold">{item.customization.flavor}</span></div>
                        )}
                        {item.customization.crust && (
                          <div>Crust: <span className="font-semibold">{item.customization.crust}</span></div>
                        )}
                        {item.customization.selectedAddons && item.customization.selectedAddons.length > 0 && (
                          <div>
                            Add-ons: <span className="font-semibold">{item.customization.selectedAddons.map(a => a.name).join(', ')}</span>
                          </div>
                        )}
                        {item.customization.customerNote && (
                          <div className="italic text-stone-500">
                            Note: "{item.customization.customerNote}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-stone-400 hover:text-red-700 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-200/80">
                  {/* Quantity Stepper */}
                  <div className="flex items-center border border-stone-300 rounded bg-white">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2 py-0.5 text-xs font-bold text-stone-600 hover:bg-stone-100"
                    >
                      -
                    </button>
                    <span className="px-2.5 py-0.5 text-xs font-mono font-bold min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2 py-0.5 text-xs font-bold text-stone-600 hover:bg-stone-100"
                    >
                      +
                    </button>
                  </div>
                  {/* Item Total */}
                  <span className="text-xs font-bold font-mono text-stone-900">
                    Rs. {item.itemTotal.toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Calculation Breakdown */}
        {cart.length > 0 && (
          <div className="border-t border-stone-200 bg-stone-50 p-4 space-y-3">
            
            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code (e.g. WELCOME50)"
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-700 uppercase font-mono"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold text-stone-800 bg-stone-200 hover:bg-stone-300 rounded transition-colors"
              >
                Apply
              </button>
            </form>

            {couponMsg && (
              <p className={`text-[11px] ${couponMsg.isError ? 'text-red-600' : 'text-green-700'}`}>
                {couponMsg.text}
              </p>
            )}

            {/* Authoritative Price Summary */}
            <div className="space-y-1.5 text-xs text-stone-600 border-t border-stone-200 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {priceSummary.subtotal.toLocaleString()}</span>
              </div>
              {fulfilmentType === 'DELIVERY' && (
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {priceSummary.deliveryFee === 0 ? (
                      <span className="text-green-700 font-bold uppercase font-sans text-[10px]">Free</span>
                    ) : (
                      `Rs. ${priceSummary.deliveryFee}`
                    )}
                  </span>
                </div>
              )}
              {priceSummary.discount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Discount ({priceSummary.couponCode})</span>
                  <span>-Rs. {priceSummary.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-stone-950 border-t border-stone-200 pt-1.5">
                <span className="font-sans">Payable Total</span>
                <span>Rs. {priceSummary.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Minimum order warning */}
            {priceSummary.subtotal < settings.minimumOrderAmount && (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Minimum order amount is Rs. {settings.minimumOrderAmount}</span>
              </div>
            )}

            {/* Checkout Action Button */}
            <button
              onClick={handleProceedToCheckout}
              disabled={priceSummary.subtotal < settings.minimumOrderAmount}
              className="w-full py-3 px-4 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
