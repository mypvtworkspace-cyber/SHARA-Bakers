import React, { useState } from 'react';
import { Plus, Trash2, Power } from 'lucide-react';
import { storage } from '../../services/storage';
import { Coupon } from '../../types';
import { useApp } from '../../context/AppContext';

export const AdminCoupons: React.FC = () => {
  const { currentUser } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>(() => storage.getCoupons());
  const [isAdding, setIsAdding] = useState(false);

  // New coupon form
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(50);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(500);

  const toggleCoupon = (cCode: string) => {
    const list = storage.getCoupons();
    const idx = list.findIndex(c => c.code === cCode);
    if (idx === -1) return;
    list[idx].isActive = !list[idx].isActive;
    storage.saveCoupons(list);
    setCoupons([...list]);

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'COUPON_TOGGLE',
        targetResource: `COUPON_${cCode}`,
        newValue: String(list[idx].isActive),
      });
    }
  };

  const handleDeleteCoupon = (cCode: string) => {
    if (!window.confirm(`Delete coupon code "${cCode}" permanently?`)) return;
    const list = storage.getCoupons().filter(c => c.code !== cCode);
    storage.saveCoupons(list);
    setCoupons([...list]);

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'COUPON_DELETE',
        targetResource: `COUPON_${cCode}`,
      });
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const list = storage.getCoupons();
    const cleanCode = code.trim().toUpperCase();
    if (list.some(c => c.code === cleanCode)) {
      alert('A coupon with this code already exists.');
      return;
    }
    const newCoupon: Coupon = {
      code: cleanCode,
      discountType,
      discountValue,
      minOrderAmount,
      validUntil: '2026-12-31',
      isActive: true,
      timesUsed: 0,
    };
    list.unshift(newCoupon);
    storage.saveCoupons(list);
    setCoupons([...list]);

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'COUPON_CREATE',
        targetResource: `COUPON_${cleanCode}`,
        newValue: `${discountValue} (${discountType})`,
      });
    }

    setIsAdding(false);
    setCode('');
    setDiscountValue(50);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            Coupons & Promotional Discounts
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Create, toggle and manage promotional codes redeemed at customer checkout
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Coupon Code</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreateCoupon} className="p-5 bg-white rounded-xl border border-stone-200 shadow space-y-3 text-xs">
          <h3 className="font-bold text-stone-900">New Promotion Code</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BANNU100"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono uppercase"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Type *</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded"
              >
                <option value="FIXED">Fixed Amount (PKR)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Discount Value *</label>
              <input
                type="number"
                required
                min={1}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Min Order Amount (PKR)</label>
              <input
                type="number"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(Number(e.target.value))}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-white bg-amber-700 hover:bg-amber-800 rounded font-semibold"
            >
              Save Coupon
            </button>
          </div>
        </form>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Value</th>
                <th className="px-6 py-3">Min Order</th>
                <th className="px-6 py-3">Times Used</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {coupons.map((c) => (
                <tr key={c.code} className="hover:bg-stone-50/70">
                  <td className="px-6 py-3.5 font-mono font-bold text-stone-900">
                    {c.code}
                  </td>
                  <td className="px-6 py-3.5 uppercase text-[10px] font-semibold text-stone-600">
                    {c.discountType}
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-amber-900">
                    {c.discountType === 'FIXED' ? `Rs. ${c.discountValue}` : `${c.discountValue}%`}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-stone-700">
                    Rs. {c.minOrderAmount}
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-stone-900">
                    {c.timesUsed}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.isActive ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {c.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => toggleCoupon(c.code)}
                      className="p-1 text-stone-400 hover:text-stone-700"
                      title={c.isActive ? 'Disable coupon' : 'Enable coupon'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCoupon(c.code)}
                      className="p-1 text-stone-400 hover:text-red-700"
                      title="Delete coupon"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
