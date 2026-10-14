import React from 'react';
import { X, Printer, Phone, CheckCircle, Clock, MapPin, ShoppingBag, ArrowRight } from 'lucide-react';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

interface OrderReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  onTrack: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose, onTrack }) => {
  const { settings } = useApp();
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Bar (Hidden on print) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-stone-200 bg-stone-50 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-700">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>
              Order Confirmed • {order.paymentMethod === 'EASYPAISA' ? 'EasyPaisa Payment' : (order.fulfilmentType === 'DELIVERY' ? 'Cash on Delivery' : 'Cash at Counter')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 flex-1 print:p-2">
          
          {/* RECEIPT HEADER WITH MANDATORY SAHARA BAKERS LOGO */}
          <div className="text-center border-b border-stone-300 pb-5">
            <div className="flex justify-center items-center py-2">
              <img
                src="/assets/images/sahara_logo.jpg"
                alt="Sahara Bakers Logo"
                className="w-20 h-20 sm:w-24 sm:h-24 object-contain mx-auto filter grayscale contrast-125"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/sahara_logo.jpg';
                }}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-stone-950 tracking-tight">
              SAHARA BAKERS
            </h1>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              Railway Road, near Syed Software House, Bannu, 28100, Pakistan
            </p>
            <p className="text-xs text-stone-800 font-mono font-bold mt-1">
              Tel: +92 330 5868488
            </p>
            <div className="inline-block mt-3 px-3 py-1 bg-stone-100 border border-stone-300 rounded text-xs font-bold uppercase tracking-wider text-stone-800">
              Official Order Receipt
            </div>
            <div className="flex justify-between items-center text-xs text-stone-600 font-mono mt-3 pt-2 border-t border-dashed border-stone-200">
              <span>Order No: <strong className="text-stone-950 text-sm">#{order.orderNumber}</strong></span>
              <span>{order.orderDateTime}</span>
            </div>
          </div>

          {/* CUSTOMER & DELIVERY INFORMATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <span className="font-bold uppercase tracking-wider text-stone-500 text-[10px] block mb-1">
                Customer Details
              </span>
              <div className="font-bold text-stone-900 text-sm">{order.customerName}</div>
              <div className="font-mono text-stone-700 mt-0.5 font-bold">
                Phone: {order.customerPhone}
              </div>
              {order.customerEmail && (
                <div className="text-stone-500 text-[11px] mt-0.5">{order.customerEmail}</div>
              )}
              <div className="text-stone-500 text-[10px] mt-1">
                Account: {order.guestOrder ? 'Guest Customer' : 'Registered Customer'}
              </div>
            </div>

            <div>
              <span className="font-bold uppercase tracking-wider text-stone-500 text-[10px] block mb-1">
                Fulfilment & Delivery
              </span>
              <div className="font-semibold text-stone-900">
                {order.fulfilmentType === 'DELIVERY' ? 'Doorstep Delivery' : 'Counter Pickup'}
              </div>
              {order.deliveryAddress && (
                <div className="text-stone-700 mt-0.5 leading-relaxed">
                  {order.deliveryAddress.street}, {order.deliveryAddress.area}, Bannu
                  {order.deliveryAddress.landmark && ` (Near: ${order.deliveryAddress.landmark})`}
                </div>
              )}
              {order.deliveryNotes && (
                <div className="text-amber-900 bg-amber-50/80 p-1.5 rounded border border-amber-200/80 mt-1.5 text-[11px] italic">
                  Note: "{order.deliveryNotes}"
                </div>
              )}
            </div>
          </div>

          {/* ORDER ITEMS ITEMIZED SNAPSHOT */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1.5">
              <span>Item Description & Customization</span>
              <span>Total</span>
            </div>

            <div className="space-y-3 divide-y divide-stone-100">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2.5 first:pt-0 text-xs">
                  <div className="flex justify-between font-bold text-stone-900">
                    <span className="text-sm">
                      {item.quantity} × {item.productName}
                    </span>
                    <span className="font-mono text-sm">
                      Rs. {item.itemTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Complete structured configuration snapshot */}
                  <div className="text-[11px] text-stone-600 mt-1 space-y-0.5 pl-3 border-l-2 border-amber-300">
                    {item.size && (
                      <div>Size: <strong className="text-stone-800">{item.size}</strong></div>
                    )}
                    {item.numberOfPersons && (
                      <div className="text-amber-900 font-bold">
                        • Servings: {item.numberOfPersons} {item.numberOfPersons === 1 ? 'Person' : 'Persons'}
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOTALS & BREAKDOWN */}
          <div className="border-t-2 border-stone-300 pt-3 space-y-1.5 text-xs font-mono text-stone-700">
            <div className="flex justify-between">
              <span className="font-sans">Subtotal</span>
              <span>Rs. {order.subtotal.toLocaleString()}</span>
            </div>
            {order.fulfilmentType === 'DELIVERY' && (
              <div className="flex justify-between">
                <span className="font-sans">Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `Rs. ${order.deliveryFee}`}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-green-700 font-bold">
                <span className="font-sans">Coupon Discount ({order.couponCode})</span>
                <span>-Rs. {order.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-base sm:text-lg font-bold text-stone-950 pt-2 border-t border-stone-300">
              <span className="font-sans">TOTAL PAYABLE</span>
              <span className="font-mono">Rs. {order.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* PAYMENT & ORDER STATUS BANNER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border border-stone-300 p-3.5 rounded-xl bg-stone-50 font-mono">
            <div>
              <span className="font-sans font-semibold text-stone-500 text-[10px] uppercase block">
                Payment Method
              </span>
              <span className="font-bold text-stone-900 text-sm">
                {order.paymentMethod === 'EASYPAISA' 
                  ? 'EASYPAISA (MOBILE QR)' 
                  : order.fulfilmentType === 'DELIVERY' ? 'CASH ON DELIVERY (COD)' : 'CASH AT COUNTER'}
              </span>
              <div className="text-[11px] text-amber-900 font-semibold mt-0.5">
                Status: {order.paymentStatus === 'PAYMENT_CONFIRMED' ? 'PAYMENT CONFIRMED (PAID)' : 'PAYMENT PENDING'}
              </div>
            </div>

            <div>
              <span className="font-sans font-semibold text-stone-500 text-[10px] uppercase block">
                Order Status
              </span>
              <span className="font-bold text-stone-900 text-sm">
                {(order.status || 'PENDING').replace(/_/g, ' ')}
              </span>
              <div className="text-[11px] text-green-800 font-sans mt-0.5">
                کیفیت: آرڈر تصدیق شدہ ہے
              </div>
            </div>
          </div>

          {/* EASYPAISA OFFICIAL QR (ONLY IF PAYMENT METHOD IS EASYPAISA) */}
          {order.paymentMethod === 'EASYPAISA' && (
            <div className="border border-stone-300 bg-stone-50 rounded-xl p-5 text-center space-y-2.5">
              <div className="flex justify-center items-center">
                <div className="p-2.5 bg-white border border-stone-300 rounded-lg inline-block shadow-xs">
                  <img
                    src="/assets/images/sahara_easypaisa_qr.png"
                    alt="Easypaisa QR Code"
                    className="w-40 h-40 sm:w-44 sm:h-44 object-contain mx-auto block receipt-qr-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/src/assets/images/sahara_easypaisa_qr.png';
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-stone-900 space-y-1 font-mono text-center">
                <div>
                  <span className="font-bold font-sans">Easypaisa Name: </span>
                  <span className="font-sans font-bold text-stone-950">{settings.easypaisaAccountTitle || 'Rahman Ullah Khan'}</span>
                </div>
                <div>
                  <span className="font-bold font-sans">Easypaisa Number: </span>
                  <span className="font-bold text-emerald-800">{settings.easypaisaAccountNumber || '0333-8072589'}</span>
                </div>
              </div>
            </div>
          )}

          {/* LARGE CUSTOMER CONFIRMATION / SUPPORT MESSAGE */}
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-200 text-amber-900 rounded-xl shrink-0 mt-0.5">
                <Phone className="w-5 h-5 text-amber-900" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold font-display text-amber-950">
                  Thank you for ordering from Sahara Bakers!
                </h3>
                <p className="text-sm font-bold text-amber-900 font-sans" dir="rtl">
                  صحارا بیکرز سے آرڈر کرنے کا شکریہ!
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              Our team will review your order and prepare it according to the details you provided. 
              <strong> Please keep your phone available</strong> because our team may contact you if we need to confirm any delivery information, address details, item customization, availability, or other information related to your order.
            </p>

            <div className="text-xs sm:text-sm text-amber-950 font-medium bg-amber-100/70 p-3 rounded-xl border border-amber-200 leading-relaxed" dir="rtl">
              براہ کرم اپنا فون اپنے پاس رکھیں تاکہ اگر صحارا بیکرز کی ٹیم کو پتہ، آئٹم کی تفصیل یا آرڈر کی تصدیق کے لیے رابطہ کرنا پڑے تو باآسانی رابطہ ہو سکے۔
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-amber-200">
              <div className="text-xs text-stone-800 text-center sm:text-left">
                For questions, address corrections, or special requests: <br />
                <span className="font-bold text-amber-950 text-sm">Sahara Bakers: +92 330 5868488</span>
              </div>
              <a
                href="tel:+923305868488"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Sahara Bakers</span>
              </a>
            </div>
          </div>

        </div>

        {/* Modal Bottom Action Bar (Hidden on print) */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            onClick={onTrack}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded transition-colors flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Track Order Progress</span>
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded transition-colors"
          >
            Close & Return to Menu
          </button>
        </div>

      </div>
    </div>
  );
};
