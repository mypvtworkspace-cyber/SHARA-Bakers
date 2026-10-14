import React from 'react';
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Flame, 
  Banknote, 
  TrendingUp, 
  ChefHat 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AdminOverview: React.FC = () => {
  const { orders, matkaConfig, setCurrentView, settings } = useApp();

  // Real database metrics
  const activeOrders = orders.filter(
    o => !['DELIVERED', 'PICKED_UP', 'CANCELLED', 'REJECTED'].includes(o.status)
  );
  const pendingOrders = orders.filter(
    o => o.status === 'ORDER_PLACED'
  );
  const preparingOrders = orders.filter(
    o => o.status === 'PREPARING'
  );

  // Financial calculations
  const totalSales = orders.reduce((sum, o) => {
    if (o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
      return sum + o.totalAmount;
    }
    return sum;
  }, 0);

  const pendingCodAmount = orders.reduce((sum, o) => {
    if (o.paymentStatus === 'PAYMENT_PENDING' && o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
      return sum + o.totalAmount;
    }
    return sum;
  }, 0);

  const confirmedCashReceived = orders.reduce((sum, o) => {
    if (o.paymentStatus === 'PAYMENT_CONFIRMED') {
      return sum + o.totalAmount;
    }
    return sum;
  }, 0);

  // Top products from real order items
  const productCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
  orders.forEach(o => {
    if (o.status !== 'CANCELLED' && o.status !== 'REJECTED') {
      o.items.forEach(it => {
        if (!productCountMap[it.productName]) {
          productCountMap[it.productName] = { name: it.productName, count: 0, revenue: 0 };
        }
        productCountMap[it.productName].count += it.quantity;
        productCountMap[it.productName].revenue += it.itemTotal;
      });
    }
  });

  const topProducts = Object.values(productCountMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            Restaurant Operations Overview
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Sahara Bakers Railway Road, Bannu • Real-time order metrics, cash on delivery ledger & kitchen workload
          </p>
        </div>
        <button
          onClick={() => setCurrentView('kitchen')}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-200 hover:bg-amber-300 rounded-lg shadow-sm transition-colors"
        >
          <ChefHat className="w-4 h-4 text-amber-900" />
          <span>Open Kitchen KDS Screen</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sales</span>
            <DollarSign className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            Rs. {totalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 font-mono">
            {orders.length} total orders recorded
          </div>
        </div>

        {/* Confirmed Cash Received */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cash Received</span>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-green-800">
            Rs. {confirmedCashReceived.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500">
            Cash verified by staff upon delivery
          </div>
        </div>

        {/* Pending Cash on Delivery */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending COD</span>
            <Banknote className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-900">
            Rs. {pendingCodAmount.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500">
            Cash to collect from active deliveries
          </div>
        </div>

        {/* Active Kitchen Queue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Kitchen Queue</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">
            {activeOrders.length}
          </div>
          <div className="text-[11px] text-stone-500">
            {preparingOrders.length} in oven • {pendingOrders.length} new
          </div>
        </div>

      </div>

      {/* Flagship Matka Pizza Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 text-amber-50 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-900 rounded-xl text-amber-300">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-white">
              Matka Pizza Flagship Config
            </h3>
            <p className="text-xs text-amber-200 mt-0.5">
              Configured Range: {matkaConfig.servingConfig.minPersons} to {matkaConfig.servingConfig.maxPersons} Persons • Base: Rs. {matkaConfig.sizes[0].basePrice} (Small), Rs. {matkaConfig.sizes[1].basePrice} (Medium), Rs. {matkaConfig.sizes[2].basePrice} (Large)
            </p>
          </div>
        </div>
        <div className="text-xs text-amber-300 font-mono">
          Clay Pot Return Credit: Rs. {matkaConfig.clayPotReturnCredit}
        </div>
      </div>

      {/* Grid: Popular Products & Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Popular Ordered Products */}
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
            <TrendingUp className="w-4 h-4 text-amber-800" />
            <h3 className="text-sm font-bold text-stone-900">Top Ordered Products</h3>
          </div>
          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              No orders placed yet. Ordered products will appear here.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="truncate pr-2">
                    <span className="font-bold text-stone-900">{p.name}</span>
                    <span className="text-[10px] text-stone-400 block font-mono">Rs. {p.revenue.toLocaleString()}</span>
                  </div>
                  <span className="font-mono font-bold bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
                    {p.count} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-900">Recent Customer Orders</h3>
            <span className="text-xs text-stone-500 font-mono">{orders.length} total</span>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-stone-500">
              No customer orders placed yet. Orders will appear here in real time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                  <tr>
                    <th className="px-5 py-3">Order #</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Payment</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-stone-50/70">
                      <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                        #{order.orderNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-stone-900">{order.customerName}</div>
                        <div className="text-[11px] text-stone-500 font-mono">{order.customerPhone}</div>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-stone-900">
                        Rs. {order.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          order.paymentStatus === 'PAYMENT_CONFIRMED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {order.paymentStatus === 'PAYMENT_CONFIRMED' ? 'PAID' : 'COD PENDING'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
                          {(order.status || 'PENDING').replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Project Information / About System */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-sm text-stone-900 border-b border-stone-200 pb-2.5">
          Project Information / About System
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-stone-500 block text-[11px]">Project:</span>
            <span className="font-bold text-stone-900 text-sm">
              {settings.projectMetadata?.businessName || settings.businessName || 'Sahara Bakers'}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[11px]">Creator:</span>
            <span className="font-bold text-stone-900 text-sm">
              {settings.projectMetadata?.creatorName || settings.creatorName || 'Mr Zaheer'}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[11px]">Credit:</span>
            <span className="font-semibold text-stone-800">
              {settings.projectMetadata?.creatorCredit || settings.creatorCredit || 'Designed & Developed by Mr Zaheer'}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
