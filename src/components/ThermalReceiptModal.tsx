import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  FileText, 
  Scissors,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Order, ThermalPaperWidth } from '../types';
import { useApp } from '../context/AppContext';
import { apiClient } from '../services/apiClient';

interface ThermalReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  isReprint?: boolean;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
  isReprint = false,
}) => {
  const { currentUser, settings, printerConfig } = useApp();
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>(printerConfig?.paperWidth || '58mm');
  const [printError, setPrintError] = useState<string | null>(null);
  const [isReprinting, setIsReprinting] = useState<boolean>(false);
  const [reprintSuccessMsg, setReprintSuccessMsg] = useState<string | null>(null);
  const [printerStatus, setPrinterStatus] = useState<'ready' | 'printing' | 'error'>('ready');

  if (!isOpen || !order) return null;

  const serverReceiptId = `REC-${order.orderNumber}-${new Date(order.createdAt).getTime().toString().slice(-4)}`;

  const handleExecutePrint = async () => {
    setPrintError(null);
    setPrinterStatus('printing');

    try {
      if (isReprint && currentUser) {
        setIsReprinting(true);
        await apiClient.reprintReceipt(order.id, serverReceiptId, {
          email: currentUser.email,
          role: currentUser.role,
        });
        setReprintSuccessMsg('Reprint verified and logged to server audit trail.');
      }

      // Execute browser-driven thermal print
      window.print();
      setPrinterStatus('ready');
    } catch (err: any) {
      console.error('Print failure:', err);
      setPrinterStatus('error');
      setPrintError('Order saved successfully, but the receipt could not be printed. Check the printer connection and try again.');
    } finally {
      setIsReprinting(false);
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-lg bg-stone-900 text-stone-100 rounded-2xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:bg-white print:text-black">
        
        {/* TOP CONTROLS (Hidden during actual print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-800 bg-stone-950/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-900/60 text-amber-400 rounded-lg">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold font-display text-white flex items-center gap-1.5">
                <span>{isReprint ? 'Reprint Thermal Receipt' : 'Counter Thermal Receipt'}</span>
                {isReprint && (
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-mono rounded">
                    REPRINT
                  </span>
                )}
              </div>
              <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${printerStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span>Printer: {printerStatus === 'error' ? 'Connection Warning' : `Ready (${paperWidth} Roll)`}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Paper Width Selector */}
            <div className="flex rounded-lg border border-stone-800 bg-stone-900 p-0.5 text-[11px]">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded font-mono ${paperWidth === '58mm' ? 'bg-amber-700 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
                title="58mm Small Roll"
              >
                58mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded font-mono ${paperWidth === '80mm' ? 'bg-amber-700 text-white font-bold' : 'text-stone-400 hover:text-white'}`}
                title="80mm Wide Roll"
              >
                80mm
              </button>
            </div>

            <button
              onClick={handleExecutePrint}
              disabled={isReprinting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isReprint ? 'Reprint Now' : 'Print Receipt'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-200 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT ERROR BANNER */}
        {printError && (
          <div className="p-3 bg-red-950/80 border-b border-red-800 text-red-200 text-xs flex items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{printError}</span>
            </div>
            <button
              onClick={handleExecutePrint}
              className="px-2.5 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-[11px] font-bold"
            >
              Retry Print
            </button>
          </div>
        )}

        {reprintSuccessMsg && (
          <div className="p-2.5 bg-emerald-950/80 border-b border-emerald-800 text-emerald-200 text-xs flex items-center gap-2 print:hidden">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{reprintSuccessMsg}</span>
          </div>
        )}

        {/* THERMAL PAPER CONTAINER (Simulated Thermal Print View) */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-stone-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          
          <div 
            className={`bg-[#fffff8] text-stone-950 font-mono shadow-xl border border-stone-300 p-4 sm:p-5 text-[11px] leading-tight select-all print:shadow-none print:border-none print:p-1 print:text-[10px] ${
              paperWidth === '58mm' ? 'w-[300px] max-w-[300px]' : 'w-[400px] max-w-[400px]'
            }`}
            style={{ fontFamily: '"Courier New", Courier, monospace' }}
          >
            {/* BRAND HEADER WITH MANDATORY SAHARA BAKERS LOGO (EVERY RECEIPT) */}
            <div className="text-center space-y-1 pb-2 border-b border-dashed border-stone-400">
              <div className="flex justify-center items-center py-1">
                <img
                  src="/assets/images/sahara_logo.jpg"
                  alt="Sahara Bakers Logo"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain mx-auto receipt-logo-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/images/sahara_logo.jpg';
                  }}
                />
              </div>
              <div className="text-sm font-black tracking-wider text-black uppercase">
                {settings.businessName || 'SAHARA BAKERS'}
              </div>
              <div className="text-[10px] leading-tight text-stone-800">
                The Famous Clay-Pot Matka Pizza<br />
                & Artisanal Bakery
              </div>
              <div className="text-[9px] text-stone-700">
                Railway Road, Bannu, Pakistan
              </div>
              <div className="text-[9px] font-bold text-stone-900">
                Tel: {settings.phone || '+92 330 5868488'}
              </div>
              {isReprint && (
                <div className="inline-block mt-1 px-2 py-0.5 border border-stone-800 text-[9px] font-bold uppercase tracking-widest text-stone-900">
                  ** DUPLICATE REPRINT **
                </div>
              )}
            </div>

            {/* ORDER META INFO */}
            <div className="py-2 border-b border-dashed border-stone-400 space-y-1 text-[10px]">
              <div className="flex justify-between font-bold">
                <span>ORDER #{order.orderNumber}</span>
                <span>{order.orderType || (order.fulfilmentType === 'DELIVERY' ? 'DELIVERY' : 'COUNTER')}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Date: {formattedDate}</span>
                <span>Time: {formattedTime}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Counter: {order.tableNumber ? `Table: ${order.tableNumber}` : 'Counter 1'}</span>
                <span>Staff: {order.waiterName || currentUser?.name || 'Authorized'}</span>
              </div>
              {order.customerName && (
                <div className="text-stone-800 pt-0.5 border-t border-dotted border-stone-300">
                  Customer: <span className="font-bold">{order.customerName}</span> ({order.customerPhone})
                </div>
              )}
              {order.fulfilmentType === 'DELIVERY' && order.deliveryAddress && (
                <div className="text-[9px] text-stone-700 leading-tight">
                  Area: {order.deliveryAddress.area} • {order.deliveryAddress.street}
                </div>
              )}
              {order.riderName && (
                <div className="text-[9px] font-bold text-stone-800">
                  Rider: {order.riderName}
                </div>
              )}
            </div>

            {/* COLUMN HEADERS */}
            <div className="py-1 border-b border-dashed border-stone-400 flex justify-between font-bold text-[10px]">
              <span className="w-1/2">ITEM</span>
              <span className="w-1/6 text-center">QTY</span>
              <span className="w-1/3 text-right">PRICE</span>
            </div>

            {/* ITEM ROWS */}
            <div className="py-2 border-b border-dashed border-stone-400 space-y-1.5 text-[10px]">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span className="w-1/2 font-semibold truncate" title={item.productName}>
                      {item.productName}
                    </span>
                    <span className="w-1/6 text-center">
                      {item.quantity}
                    </span>
                    <span className="w-1/3 text-right font-bold">
                      {item.itemTotal}
                    </span>
                  </div>
                  {/* Compact customization notes */}
                  {(item.size || item.customization?.flavor || item.numberOfPersons) && (
                    <div className="text-[8.5px] text-stone-600 pl-2">
                      {item.size ? `[${item.size}] ` : ''}
                      {item.numberOfPersons ? `${item.numberOfPersons}p ` : ''}
                      {item.customization?.flavor ? `${item.customization.flavor}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* TOTALS & SUMMARY */}
            <div className="py-2 border-b border-dashed border-stone-400 space-y-1 text-[10px]">
              <div className="flex justify-between text-stone-700">
                <span>Subtotal:</span>
                <span>Rs. {order.subtotal}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>Delivery Charge:</span>
                  <span>Rs. {order.deliveryFee}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>Discount:</span>
                  <span>-Rs. {order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-xs pt-1 border-t border-dotted border-stone-400 text-black">
                <span>TOTAL:</span>
                <span>Rs. {order.totalAmount}</span>
              </div>
              <div className="text-[9px] text-stone-800 pt-0.5">
                Payment: <strong className="uppercase">{(order.paymentMethod || 'CASH').replace(/_/g, ' ')}</strong>
                <span className="ml-1">({order.paymentStatus === 'PAYMENT_CONFIRMED' ? 'PAID' : 'PENDING'})</span>
              </div>
            </div>

            {/* EASYPAISA PAYMENT QR SECTION (ONLY FOR EASYPAISA ORDERS) */}
            {order.paymentMethod === 'EASYPAISA' && (
              <div className="py-3 border-b border-dashed border-stone-400 text-center space-y-2">
                <div className="flex justify-center items-center">
                  <div className="p-2 bg-white border border-stone-300 inline-block">
                    <img
                      src="/assets/images/sahara_easypaisa_qr.png"
                      alt="Easypaisa QR Code"
                      className="w-36 h-36 sm:w-40 sm:h-40 object-contain mx-auto block receipt-qr-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/sahara_easypaisa_qr.png';
                      }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-black space-y-0.5 leading-tight text-center">
                  <div>
                    <span className="font-bold">Easypaisa Name: </span>
                    <span>{settings.easypaisaAccountTitle || 'Rahman Ullah Khan'}</span>
                  </div>
                  <div>
                    <span className="font-bold">Easypaisa Number: </span>
                    <span className="font-mono font-bold">{settings.easypaisaAccountNumber || '0333-8072589'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* RECEIPT FOOTER */}
            <div className="text-center pt-3 space-y-1 text-[9px] text-stone-700">
              <div className="font-bold text-stone-900">
                Thank you for visiting Sahara Bakers!
              </div>
              <div>
                Fresh daily since inception • Bannu
              </div>
              <div className="text-[8px] text-stone-600 pt-1 font-mono">
                Receipt ID: {serverReceiptId}
              </div>
              <div className="text-[8px] text-stone-500 font-mono">
                *** Server Authoritative Record ***
              </div>
              <div className="pt-2 text-stone-400 flex items-center justify-center gap-1">
                <Scissors className="w-3 h-3" />
                <span>- - - - - - - - - - - - - - - - -</span>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM ACTION BAR (Hidden during actual print) */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs print:hidden">
          <div className="text-stone-400 text-[11px] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>ESC/POS & Direct Thermal Compatible</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecutePrint}
              disabled={isReprinting}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{isReprint ? 'Execute Reprint' : 'Send to Thermal Printer'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
