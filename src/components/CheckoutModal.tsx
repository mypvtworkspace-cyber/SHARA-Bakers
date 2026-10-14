import React, { useState } from 'react';
import { X, CheckCircle, ShieldAlert, Clock, Banknote, MapPin, Phone, User, FileText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderEngine } from '../services/orderEngine';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    clearCart,
    fulfilmentType,
    priceSummary,
    currentUser,
    settings,
    setConfirmedOrderForReceipt,
  } = useApp();

  // Form states
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedArea, setSelectedArea] = useState((settings?.serviceAreas && settings.serviceAreas[0]) || 'Railway Road');
  const [landmark, setLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'EASYPAISA'>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate an idempotency key once per checkout session
  const [idempotencyKey] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  if (!isCheckoutOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Form validation
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name for order delivery.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setErrorMessage('Please enter a valid Pakistani mobile number (e.g., 0300 1234567 or +92 300 1234567).');
      return;
    }
    if (fulfilmentType === 'DELIVERY' && !streetAddress.trim()) {
      setErrorMessage('Please enter your complete street address, house/shop number in Bannu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isGuest = !currentUser;
      const customerId = currentUser?.id || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      
      const result = await OrderEngine.createOrder({
        customer: {
          id: customerId,
          name: customerName.trim(),
          email: customerEmail.trim() || undefined,
          phone: customerPhone.trim(),
        },
        guestOrder: isGuest,
        items: cart,
        fulfilmentType,
        deliveryAddress: {
          street: streetAddress.trim() || 'Counter Pickup (Sahara Bakers, Railway Road)',
          area: selectedArea,
          landmark: landmark.trim() || undefined,
          city: 'Bannu',
        },
        deliveryNotes: deliveryNotes.trim() || undefined,
        specialInstructions: deliveryNotes.trim() || undefined,
        paymentMethod: paymentMethod === 'EASYPAISA' ? 'EASYPAISA' : 'CASH',
        couponCode: priceSummary.couponCode,
        idempotencyKey,
      });

      if (!result.success || !result.order) {
        setErrorMessage(result.error || 'Your order could not be placed right now. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Order created successfully
      clearCart();
      setIsCheckoutOpen(false);
      // Immediately open complete official order receipt
      setConfirmedOrderForReceipt(result.order);
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while confirming your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-stone-900">
              Customer Details & Cash on Delivery Checkout
            </h2>
            <p className="text-xs text-stone-500">
              {fulfilmentType === 'DELIVERY' ? 'Doorstep Delivery in Bannu' : 'Express Counter Pickup at Railway Road'} • No account required
            </p>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Customer Contact (Required) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-700" />
              <span>1. Customer Identity (Required)</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Muhammad Ali"
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Your Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 0330 1234567 or +92 330 1234567"
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700 font-mono"
                />
                <span className="text-[10px] text-stone-500 mt-0.5 block">
                  Our team will contact this number for delivery arrival.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="e.g. yourname@example.com (optional)"
                  className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Complete Delivery Address */}
          {fulfilmentType === 'DELIVERY' ? (
            <div className="pt-2 border-t border-stone-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-700" />
                <span>2. Complete Delivery Address in Bannu (Required)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Bannu Area / Sector *
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  >
                    {(settings?.serviceAreas || [
                      'Railway Road',
                      'City Center',
                      'Cantonment Bannu',
                      'Miran Shah Road',
                      'Kohat Road',
                      'Sugar Mill Colony',
                      'Mandeyan',
                      'Bannu University Campus',
                      'Ghauri Gate',
                    ]).map((area, idx) => (
                      <option key={idx} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Nearby Landmark / Gate (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Near Ghauri Gate / Central Mosque"
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Street Address / House or Shop Number *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. House #14, Street 3, Mohallah Qasaban..."
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                    Delivery Notes / Special Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Call when arriving, deliver carefully..."
                    className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-stone-200 bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-1 text-xs">
              <div className="flex items-center gap-2 text-amber-950 font-bold uppercase">
                <Clock className="w-4 h-4 text-amber-800" />
                <span>Express Pickup at Sahara Bakers Counter</span>
              </div>
              <p className="text-stone-700">
                Location: <strong>{settings.address}, Bannu</strong>.
              </p>
              <p className="text-stone-500">
                Estimated preparation time: <strong>25 - 35 minutes</strong> for authentic clay pot baking.
              </p>
            </div>
          )}

          {/* Section 3: Payment Method (CASH or EASYPAISA) */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Banknote className="w-3.5 h-3.5 text-amber-700" />
                <span>3. Payment Method</span>
              </h3>
              <span className="text-[10px] font-bold text-stone-500 uppercase">
                Select One
              </span>
            </div>

            {/* Payment Choice Selector Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-amber-700 bg-amber-50/80 ring-2 ring-amber-600/20'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-900">💵 Cash</span>
                  {paymentMethod === 'CASH' && (
                    <span className="w-2 h-2 rounded-full bg-amber-700" />
                  )}
                </div>
                <p className="text-[11px] text-stone-600 leading-tight">
                  {fulfilmentType === 'DELIVERY' ? 'Cash on Delivery (COD)' : 'Cash at Pickup Counter'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('EASYPAISA')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  paymentMethod === 'EASYPAISA'
                    ? 'border-emerald-700 bg-emerald-50/80 ring-2 ring-emerald-600/20'
                    : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-900">📱 EasyPaisa</span>
                  {paymentMethod === 'EASYPAISA' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-700" />
                  )}
                </div>
                <p className="text-[11px] text-stone-600 leading-tight">
                  Account QR & Direct Transfer
                </p>
              </button>
            </div>

            {/* Cash Info Panel */}
            {paymentMethod === 'CASH' && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">
                    {fulfilmentType === 'DELIVERY' ? 'Cash on Delivery (COD)' : 'Cash at Pickup Counter'}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  No online payment needed beforehand. Pay the full order amount in cash to our delivery captain upon delivery in Bannu.
                </p>
                <div className="text-[11px] text-amber-900 font-semibold pt-1">
                  Sahara Bakers Support Helpline: <span className="font-mono font-bold">+92 330 5868488</span>
                </div>
              </div>
            )}

            {/* EasyPaisa Info Panel */}
            {paymentMethod === 'EASYPAISA' && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>🟢 EasyPaisa Verified Account</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    QR Printed on Receipt
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-emerald-200">
                  <div className="w-24 h-24 bg-stone-50 rounded border border-emerald-200 p-1.5 flex items-center justify-center shrink-0">
                    <img
                      src="/assets/images/sahara_easypaisa_qr.png"
                      alt="Easypaisa QR Code"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/sahara_easypaisa_qr.png';
                      }}
                    />
                  </div>
                  <div className="space-y-1 text-xs text-stone-700 text-center sm:text-left">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">Easypaisa Name</span>
                      <strong className="text-stone-900 text-sm">{settings.easypaisaAccountTitle || 'Rahman Ullah Khan'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase block font-semibold">Easypaisa Number</span>
                      <strong className="text-emerald-800 font-mono text-base">{settings.easypaisaAccountNumber || '0333-8072589'}</strong>
                    </div>
                    <p className="text-[11px] text-stone-500 pt-0.5">
                      This QR code will be printed directly on your official receipt.
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  * Note: After placing order, payment remains in verification state until staff or delivery captain confirms the receipt.
                </p>
              </div>
            )}
          </div>

          {/* Order Summary Snapshot */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs text-stone-600 font-mono">
            <div className="flex justify-between font-sans font-bold text-stone-900 pb-1 border-b border-stone-200">
              <span>Order Summary</span>
              <span>{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
            </div>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {priceSummary.subtotal.toLocaleString()}</span>
            </div>
            {fulfilmentType === 'DELIVERY' && (
              <div className="flex justify-between">
                <span>Delivery Fee ({selectedArea})</span>
                <span>{priceSummary.deliveryFee === 0 ? 'FREE' : `Rs. ${priceSummary.deliveryFee}`}</span>
              </div>
            )}
            {priceSummary.discount > 0 && (
              <div className="flex justify-between text-green-700 font-bold">
                <span>Discount ({priceSummary.couponCode})</span>
                <span>-Rs. {priceSummary.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm sm:text-base font-bold text-stone-950 pt-2 border-t border-stone-200">
              <span className="font-sans">
                Payable via {paymentMethod === 'EASYPAISA' ? 'EasyPaisa' : 'Cash'}
              </span>
              <span>Rs. {priceSummary.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded transition-colors"
            >
              Back to Basket
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-8 py-3 text-xs sm:text-sm font-bold text-white rounded shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                paymentMethod === 'EASYPAISA'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-amber-700 hover:bg-amber-800'
              }`}
            >
              {isSubmitting ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {paymentMethod === 'EASYPAISA'
                      ? `Place Order (EasyPaisa: Rs. ${priceSummary.totalAmount.toLocaleString()})`
                      : `Place Order (Cash: Rs. ${priceSummary.totalAmount.toLocaleString()})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
