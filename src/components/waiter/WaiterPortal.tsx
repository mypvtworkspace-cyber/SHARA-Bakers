import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  ShoppingBag, 
  Flame, 
  Clock, 
  CheckCircle2, 
  Search, 
  Receipt, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  UtensilsCrossed, 
  RefreshCw,
  X,
  CreditCard,
  ChefHat,
  Printer,
  Bike,
  Phone,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthService } from '../../services/authService';
import { apiClient } from '../../services/apiClient';
import { resolveProductImage } from '../../services/imageResolver';
import { Product, CartItem, Order, OrderStatus, ProductCategory, Rider } from '../../types';
import { ThermalReceiptModal } from '../ThermalReceiptModal';

export const WaiterPortal: React.FC = () => {
  const { 
    currentUser, 
    products, 
    matkaConfig, 
    orders, 
    riders,
    refreshData, 
    setCurrentView 
  } = useApp();

  // Active Tab: Floor, Take Order, Riders & Dispatch, History
  const [activeTab, setActiveTab] = useState<'floor' | 'new-order' | 'riders' | 'history'>('floor');

  // Thermal Receipt State
  const [thermalReceiptOrder, setThermalReceiptOrder] = useState<Order | null>(null);
  const [isThermalModalOpen, setIsThermalModalOpen] = useState<boolean>(false);
  const [isReprintMode, setIsReprintMode] = useState<boolean>(false);

  // New Order State
  const [selectedChannel, setSelectedChannel] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'CASH' | 'EASYPAISA'>('CASH');
  const [tableNumber, setTableNumber] = useState<string>('Table 1');
  const [customerName, setCustomerName] = useState<string>('Walk-in Guest');
  const [customerPhone, setCustomerPhone] = useState<string>('03300000000');
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  // History State
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyDateFilter, setHistoryDateFilter] = useState<'today' | 'yesterday' | 'all'>('today');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState<string>('');
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [selectedOrderForView, setSelectedOrderForView] = useState<Order | null>(null);

  // RBAC Guard
  if (!AuthService.canAccessWaiter(currentUser)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-3 bg-red-100 text-red-700 rounded-full">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-display text-stone-900">403 – Unauthorized Access</h2>
        <p className="text-xs text-stone-600 max-w-md">
          The Waiter & Counter Portal requires authorized server or floor staff credentials.
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

  // Load Waiter History from Central API
  const fetchWaiterHistory = async () => {
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
      console.error('Failed to load waiter history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchWaiterHistory();
    }
  }, [activeTab, historyDateFilter, historyStatusFilter, historySearch]);

  // Active Floor Orders (Orders in Dine-in or Counter created recently)
  const activeFloorOrders = useMemo(() => {
    return orders.filter(o => 
      !['DELIVERED', 'PICKED_UP', 'CANCELLED', 'REJECTED'].includes(o.status)
    );
  }, [orders]);

  // Filtered Products for quick order creation
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = !productSearch.trim() || 
        p.name.toLowerCase().includes(productSearch.toLowerCase());
      return matchCat && matchSearch && p.available;
    });
  }, [products, selectedCategory, productSearch]);

  // Add Item to Waiter Order
  const handleAddItem = (prod: Product) => {
    setOrderItems(prev => {
      const existing = prev.find(i => i.productId === prod.id);
      if (existing) {
        return prev.map(i => i.productId === prod.id 
          ? { ...i, quantity: i.quantity + 1, itemTotal: (i.quantity + 1) * i.unitPrice }
          : i
        );
      }
      const newItem: CartItem = {
        id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        productName: prod.name,
        category: prod.category,
        unitPrice: prod.basePrice,
        quantity: 1,
        image: prod.image,
        itemTotal: prod.basePrice,
      };
      return [...prev, newItem];
    });
  };

  const handleUpdateItemQty = (productId: string, delta: number) => {
    setOrderItems(prev => {
      return prev
        .map(item => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty, itemTotal: newQty * item.unitPrice } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((acc, item) => acc + item.itemTotal, 0);
  };

  // Submit Order to Kitchen & Central Database
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0 || !currentUser) return;
    setIsSubmittingOrder(true);
    setOrderSuccessMsg(null);

    const subtotal = calculateSubtotal();
    const orderNumber = `SB-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      customerId: currentUser.id,
      guestOrder: true,
      customerName: customerName.trim() || 'Walk-in Guest',
      customerPhone: customerPhone.trim() || '03300000000',
      fulfilmentType: 'PICKUP',
      orderType: selectedChannel,
      tableNumber: selectedChannel === 'DINE_IN' ? tableNumber : undefined,
      waiterId: currentUser.email,
      waiterName: currentUser.name,
      kitchenStatus: 'PENDING',
      deliveryAddress: {
        street: 'Sahara Bakers Counter / Dine-in',
        area: 'Railway Road',
        city: 'Bannu',
      },
      items: orderItems.map(i => ({
        productId: i.productId,
        productName: i.productName,
        category: i.category,
        productType: i.category === 'matka-pizza' ? 'MATKA_PIZZA' : 'BAKERY',
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        itemSubtotal: i.itemTotal,
        itemTotal: i.itemTotal,
      })),
      subtotal,
      deliveryFee: 0,
      discount: 0,
      totalAmount: subtotal,
      paymentMethod: orderPaymentMethod,
      paymentStatus: 'PAYMENT_PENDING',
      status: 'ORDER_PLACED',
      createdAt: new Date().toISOString(),
      orderDateTime: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          status: 'ORDER_PLACED',
          timestamp: new Date().toISOString(),
          note: `Order taken by ${currentUser.name} (${selectedChannel}${selectedChannel === 'DINE_IN' ? ` - ${tableNumber}` : ''})`,
        },
      ],
      idempotencyKey: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    };

    try {
      const created = await apiClient.createOrder(newOrder, { email: currentUser.email, role: currentUser.role });
      refreshData();
      setOrderItems([]);
      setOrderSuccessMsg(`Order ${orderNumber} confirmed & sent to Kitchen!`);
      // Open thermal receipt modal with confirmed server-authoritative order
      setThermalReceiptOrder(created);
      setIsReprintMode(false);
      setIsThermalModalOpen(true);
      setTimeout(() => {
        setOrderSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert('Failed to send order to kitchen: ' + err.message);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Settle Bill / Cash Collected
  const handleSettleBill = async (orderId: string) => {
    if (!currentUser) return;
    try {
      await apiClient.updateOrderStatus(orderId, 'DELIVERED', {
        email: currentUser.email,
        role: currentUser.role,
      }, 'Bill settled with cash at floor/counter');
      refreshData();
    } catch (err: any) {
      alert('Failed to settle bill: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900">
      
      {/* Top Header */}
      <header className="bg-amber-900 text-amber-50 px-6 py-4 shadow-md flex items-center justify-between border-b border-amber-950">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-800 rounded-lg text-amber-300">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold font-display tracking-tight text-white">
              Sahara Bakers — Waiter & Counter Portal
            </h1>
            <p className="text-xs text-amber-200">
              Logged in as <strong className="text-white">{currentUser?.name || 'Staff'}</strong> • Railway Road Floor
            </p>
          </div>
        </div>

        {/* Tab Switcher & Quick Navigation */}
        <div className="flex items-center gap-2">
          {/* Printer Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/70 border border-amber-800 rounded-lg text-[11px] text-amber-200 mr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Thermal: Ready (58mm)</span>
          </div>

          <button
            onClick={() => setActiveTab('floor')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'floor' ? 'bg-white text-amber-900 shadow-sm' : 'bg-amber-800/80 text-amber-100 hover:bg-amber-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Active Floor ({activeFloorOrders.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('new-order')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'new-order' ? 'bg-white text-amber-900 shadow-sm' : 'bg-amber-800/80 text-amber-100 hover:bg-amber-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Take Order</span>
          </button>

          <button
            onClick={() => setActiveTab('riders')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'riders' ? 'bg-white text-amber-900 shadow-sm' : 'bg-amber-800/80 text-amber-100 hover:bg-amber-800'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Riders & Dispatch ({riders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'bg-white text-amber-900 shadow-sm' : 'bg-amber-800/80 text-amber-100 hover:bg-amber-800'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>History & Receipts</span>
          </button>

          <button
            onClick={() => setCurrentView('store')}
            className="ml-3 text-xs text-amber-200 hover:text-white font-medium"
          >
            Exit Portal
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        
        {/* TAB 1: ACTIVE FLOOR / ORDERS */}
        {activeTab === 'floor' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900">
                  Floor & Counter Live Orders
                </h2>
                <p className="text-xs text-stone-500">
                  Real-time status synchronization with Kitchen Display System
                </p>
              </div>
              <button
                onClick={refreshData}
                className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-300 px-3 py-1.5 rounded-lg shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Server</span>
              </button>
            </div>

            {activeFloorOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-stone-200 shadow-xs space-y-3">
                <UtensilsCrossed className="w-10 h-10 text-stone-300 mx-auto" />
                <h3 className="text-sm font-bold text-stone-800">No active orders right now</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  Take a new dine-in table or takeaway counter order to send directly to the kitchen.
                </p>
                <button
                  onClick={() => setActiveTab('new-order')}
                  className="px-4 py-2 bg-amber-800 text-white text-xs font-semibold rounded-lg hover:bg-amber-900 shadow-xs"
                >
                  + Take New Order
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeFloorOrders.map(order => {
                  const isReady = order.status === 'READY';
                  return (
                    <div 
                      key={order.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                        isReady ? 'border-green-500 ring-2 ring-green-500/20 bg-green-50/20' : 'border-stone-200'
                      }`}
                    >
                      <div>
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
                          <div>
                            <span className="font-mono font-bold text-sm text-stone-900">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              {order.orderType === 'DINE_IN' ? (order.tableNumber || 'Dine-in') : 'Takeaway Counter'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                            order.status === 'READY' ? 'bg-green-100 text-green-800 animate-pulse' :
                            order.status === 'PREPARING' ? 'bg-amber-100 text-amber-800' :
                            order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800' :
                            'bg-stone-100 text-stone-800'
                          }`}>
                            {(order.status || 'PENDING').replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="text-xs text-stone-600 mb-3 flex items-center justify-between">
                          <span>👤 {order.customerName}</span>
                          <span className="text-stone-400 font-mono">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Items List */}
                        <div className="space-y-1.5 border-t border-stone-100 pt-2 mb-4">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-stone-800">
                                <strong className="text-stone-900">{item.quantity}×</strong> {item.productName}
                              </span>
                              <span className="font-mono text-stone-600">Rs. {item.itemTotal}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total & Action */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 block">Total Bill</span>
                          <span className="font-mono font-bold text-base text-stone-950">
                            Rs. {order.totalAmount}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setThermalReceiptOrder(order);
                              setIsReprintMode(false);
                              setIsThermalModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-amber-100 hover:text-amber-900 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Print Counter Thermal Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>

                          {isReady ? (
                            <button
                              onClick={() => handleSettleBill(order.id)}
                              className="px-3.5 py-2 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Settle Bill & Finish</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-amber-700 font-medium">
                              <ChefHat className="w-3.5 h-3.5 animate-spin" />
                              <span>In Kitchen...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TAKE NEW ORDER */}
        {activeTab === 'new-order' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: Product Selection */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* Channel & Table selection */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-wrap items-center gap-4">
                <div className="flex rounded-lg border border-stone-300 p-0.5 bg-stone-50">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('DINE_IN')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      selectedChannel === 'DINE_IN' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    Dine-in Floor
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('TAKEAWAY')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      selectedChannel === 'TAKEAWAY' ? 'bg-amber-800 text-white shadow-xs' : 'text-stone-600'
                    }`}
                  >
                    Counter Takeaway
                  </button>
                </div>

                {selectedChannel === 'DINE_IN' && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-stone-600">Table:</span>
                    <select
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="text-xs bg-stone-50 border border-stone-300 rounded-lg p-1.5 font-bold"
                    >
                      {['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6', 'Table 7', 'Table 8', 'Family Hall 1', 'Family Hall 2'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Guest / Customer Name"
                    className="w-full text-xs p-2 bg-stone-50 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Category pills & Search */}
              <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'matka-pizza', 'cakes', 'sweets', 'bakery', 'beverages'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedCategory === cat ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {(cat || '').replace(/-/g, ' ')}
                    </button>
                  ))}
                </div>
                <div className="relative min-w-[150px]">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search menu..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => handleAddItem(prod)}
                    className="bg-white p-3 rounded-xl border border-stone-200 shadow-xs hover:border-amber-600 hover:shadow-md transition-all text-left flex flex-col justify-between group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={resolveProductImage(prod.image, prod.category)}
                        alt={prod.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-stone-900 truncate group-hover:text-amber-800">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] text-stone-400 block uppercase">
                          {prod.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-100 pt-2 mt-1">
                      <span className="font-mono font-bold text-xs text-stone-900">
                        Rs. {prod.basePrice}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                        + Add
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right 4 Cols: Order Summary & Fire to Kitchen */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-md flex flex-col justify-between min-h-[450px]">
                <div>
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-3">
                    <h3 className="font-bold font-display text-sm text-stone-900 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4 text-amber-800" />
                      <span>Current Order Ticket</span>
                    </h3>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      {selectedChannel} {selectedChannel === 'DINE_IN' ? `• ${tableNumber}` : ''}
                    </span>
                  </div>

                  {orderItems.length === 0 ? (
                    <div className="py-12 text-center text-stone-400 text-xs">
                      No items selected yet.<br />Tap menu items to add to order.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {orderItems.map(item => (
                        <div key={item.productId} className="flex items-center justify-between text-xs border-b border-stone-50 pb-2">
                          <div className="flex-1 pr-2">
                            <span className="font-semibold text-stone-900 block truncate">{item.productName}</span>
                            <span className="text-[10px] text-stone-400 font-mono">Rs. {item.unitPrice} each</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateItemQty(item.productId, -1)}
                              className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs"
                            >
                              -
                            </button>
                            <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateItemQty(item.productId, 1)}
                              className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold flex items-center justify-center text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-stone-200 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-stone-500">Order Subtotal</span>
                    <span className="font-mono font-bold text-lg text-stone-950">
                      Rs. {calculateSubtotal().toLocaleString()}
                    </span>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-stone-500 block">
                      Payment Mode
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setOrderPaymentMethod('CASH')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          orderPaymentMethod === 'CASH'
                            ? 'bg-amber-100 text-amber-950 border-amber-600 font-bold'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        💵 Cash
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderPaymentMethod('EASYPAISA')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                          orderPaymentMethod === 'EASYPAISA'
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-600 font-bold'
                            : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        📱 EasyPaisa
                      </button>
                    </div>
                  </div>

                  {orderSuccessMsg && (
                    <div className="p-2.5 bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg text-center font-semibold">
                      {orderSuccessMsg}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitOrder}
                    disabled={orderItems.length === 0 || isSubmittingOrder}
                    className="w-full py-3 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Flame className="w-4 h-4 text-amber-300" />
                    <span>{isSubmittingOrder ? 'Sending to Kitchen...' : 'Send Order to Kitchen'}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: WAITER HISTORY (Section 42) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900">
                  Waiter Order History
                </h2>
                <p className="text-xs text-stone-500">
                  Authoritative records for orders served by {currentUser?.name || 'Staff'}
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
                    All History
                  </button>
                </div>

                <select
                  value={historyStatusFilter}
                  onChange={(e) => setHistoryStatusFilter(e.target.value)}
                  className="text-xs bg-white border border-stone-300 rounded-lg p-1.5 font-medium"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DELIVERED">Completed / Settled</option>
                  <option value="PREPARING">Preparing</option>
                  <option value="READY">Ready</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search order #..."
                  className="text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 w-36"
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
                      <th className="px-5 py-3.5">Date & Time</th>
                      <th className="px-5 py-3.5">Table / Channel</th>
                      <th className="px-5 py-3.5">Items Summary</th>
                      <th className="px-5 py-3.5">Amount (PKR)</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {historyOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-stone-400">
                          {isLoadingHistory ? 'Loading history records...' : 'No orders found matching this filter.'}
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
                          <td className="px-5 py-3 font-medium text-stone-800">
                            {ord.orderType === 'DINE_IN' ? (ord.tableNumber || 'Dine-in') : 'Takeaway Counter'}
                          </td>
                          <td className="px-5 py-3 text-stone-600 line-clamp-1 max-w-xs">
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
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setThermalReceiptOrder(ord);
                                  setIsReprintMode(true);
                                  setIsThermalModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors"
                                title="Reprint Thermal Receipt with Server Audit"
                              >
                                <Printer className="w-3 h-3 text-amber-800" />
                                <span>Reprint</span>
                              </button>
                              <button
                                onClick={() => setSelectedOrderForView(ord)}
                                className="text-stone-500 hover:text-stone-900 font-medium underline text-xs"
                              >
                                View
                              </button>
                            </div>
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

        {/* TAB 4: RIDERS & DISPATCH (Section 60 & 66) */}
        {activeTab === 'riders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-display text-stone-900 flex items-center gap-2">
                  <Bike className="w-5 h-5 text-amber-700" />
                  <span>Delivery Fleet & Rider Dispatch</span>
                </h2>
                <p className="text-xs text-stone-500">
                  Real-time rider operational status, area coverage, and live delivery tracking for Counter staff
                </p>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold">
                  {riders.filter(r => r.status === 'AVAILABLE').length} Available
                </span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-bold">
                  {riders.filter(r => r.status === 'ON_THE_WAY' || r.status === 'ASSIGNED').length} On Delivery
                </span>
                <button
                  onClick={refreshData}
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-300 px-3 py-1 rounded-lg"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Rider Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {riders.map(rider => {
                const isAvail = rider.status === 'AVAILABLE';
                const isOnDelivery = rider.status === 'ON_THE_WAY';
                const isAssigned = rider.status === 'ASSIGNED';

                return (
                  <div
                    key={rider.id}
                    className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-sm text-stone-900 font-display">
                          {rider.name}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isAvail ? 'bg-emerald-100 text-emerald-800' :
                          isOnDelivery ? 'bg-blue-100 text-blue-800 animate-pulse' :
                          isAssigned ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {(rider.status || 'AVAILABLE').replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 space-y-1">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-stone-800">
                          <Phone className="w-3.5 h-3.5 text-amber-700" />
                          <span>{rider.phone || 'No phone'}</span>
                          {rider.altPhone && (
                            <span className="text-[11px] text-stone-500 font-normal">/ {rider.altPhone}</span>
                          )}
                        </div>
                        {rider.areaNote && (
                          <div className="text-[11px] text-stone-500 italic">
                            Route: {rider.areaNote}
                          </div>
                        )}
                        <div className="text-[11px] text-stone-500 pt-1">
                          Completed: <strong className="text-stone-800">{rider.completedDeliveries || 0}</strong> orders
                        </div>
                      </div>

                      {/* Current assigned delivery if any */}
                      {rider.currentOrderNumber && (
                        <div className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                          <span className="text-[10px] text-amber-700 font-bold uppercase block">
                            Active Assignment
                          </span>
                          <span className="font-mono font-bold text-amber-950">
                            Order #{rider.currentOrderNumber}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Call Action */}
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                      <a
                        href={rider.phone ? `tel:${rider.phone.replace(/[^0-9+]/g, '')}` : '#'}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call {(rider.name || 'Rider').split(' ')[0]}</span>
                      </a>
                      {rider.altPhone && (
                        <a
                          href={`tel:${rider.altPhone.replace(/[^0-9+]/g, '')}`}
                          className="text-[11px] text-stone-500 hover:text-stone-800 underline font-mono"
                        >
                          Alt Phone
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LIVE DELIVERY ORDERS AT COUNTER (Section 66) */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold font-display text-sm text-stone-900">
                    Live Delivery Orders Dispatch Status
                  </h3>
                  <p className="text-xs text-stone-500">
                    Counter delivery verification, customer addresses & assigned riders
                  </p>
                </div>
                <span className="text-xs text-stone-500">
                  Total Delivery Orders: {orders.filter(o => o.fulfilmentType === 'DELIVERY').length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px]">
                    <tr>
                      <th className="px-5 py-3">Order #</th>
                      <th className="px-5 py-3">Customer Area</th>
                      <th className="px-5 py-3">Delivery Fee</th>
                      <th className="px-5 py-3">Assigned Rider</th>
                      <th className="px-5 py-3">Delivery Status</th>
                      <th className="px-5 py-3">Order Total</th>
                      <th className="px-5 py-3 text-right">Thermal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.filter(o => o.fulfilmentType === 'DELIVERY').slice(0, 15).map(ord => (
                      <tr key={ord.id} className="hover:bg-stone-50/70">
                        <td className="px-5 py-3 font-mono font-bold text-stone-900">
                          {ord.orderNumber}
                        </td>
                        <td className="px-5 py-3 text-stone-700">
                          {ord.deliveryAddress?.area || 'Bannu City'}
                        </td>
                        <td className="px-5 py-3 font-mono text-stone-800">
                          Rs. {ord.deliveryFee}
                        </td>
                        <td className="px-5 py-3 font-semibold text-stone-900">
                          {ord.riderName || <span className="text-stone-400 italic font-normal">Unassigned</span>}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            ord.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            ord.deliveryStatus === 'ON_THE_WAY' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                            ord.deliveryStatus === 'ASSIGNED' ? 'bg-amber-100 text-amber-800' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {ord.deliveryStatus || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-stone-950">
                          Rs. {ord.totalAmount}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => {
                              setThermalReceiptOrder(ord);
                              setIsReprintMode(true);
                              setIsThermalModalOpen(true);
                            }}
                            className="text-amber-800 hover:text-amber-950 font-semibold underline text-xs"
                          >
                            Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Counter Thermal Receipt Modal */}
      <ThermalReceiptModal
        order={thermalReceiptOrder}
        isOpen={isThermalModalOpen}
        onClose={() => setIsThermalModalOpen(false)}
        isReprint={isReprintMode}
      />

      {/* Bill / Receipt Modal */}
      {selectedOrderForView && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold font-display text-base text-stone-900">Order {selectedOrderForView.orderNumber}</h3>
                <p className="text-xs text-stone-500">{new Date(selectedOrderForView.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedOrderForView(null)} className="text-stone-400 hover:text-stone-700">✕</button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-stone-100">
              {selectedOrderForView.items.map((i, idx) => (
                <div key={idx} className="flex justify-between pt-2">
                  <span><strong>{i.quantity}×</strong> {i.productName}</span>
                  <span className="font-mono">Rs. {i.itemTotal}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-200 pt-3 flex justify-between font-bold text-sm">
              <span>Total Amount Paid</span>
              <span className="font-mono text-amber-900">Rs. {selectedOrderForView.totalAmount}</span>
            </div>

            <button
              onClick={() => setSelectedOrderForView(null)}
              className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
