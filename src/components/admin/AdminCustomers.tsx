import React from 'react';
import { storage } from '../../services/storage';

export const AdminCustomers: React.FC = () => {
  const users = storage.getUsers();
  const orders = storage.getOrders();

  // Aggregate user statistics
  const userStats = users.map((u) => {
    const userOrders = orders.filter(o => o.customerId === u.id || o.customerEmail === u.email);
    const totalSpent = userOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return {
      ...u,
      orderCount: userOrders.length,
      totalSpent,
    };
  });

  return (
    <div className="space-y-6">
      
      <div>
        <h1 className="text-2xl font-bold font-display text-stone-900">
          Customer & Account Directory
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Registered customer accounts and aggregated order history
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Orders</th>
                <th className="px-6 py-3">Total Spent</th>
                <th className="px-6 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {userStats.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/70">
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-stone-900">{u.name}</div>
                    <div className="text-[11px] text-stone-500">{u.email}</div>
                  </td>
                  <td className="px-6 py-3.5 font-mono text-stone-600">
                    {u.phone || 'N/A'}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-800 px-2 py-0.5 rounded">
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-stone-900">
                    {u.orderCount}
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-stone-900">
                    Rs. {u.totalSpent.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-stone-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
