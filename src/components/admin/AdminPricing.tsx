import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, MapPin, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { apiClient } from '../../services/apiClient';
import { BusinessSettings } from '../../types';

export const AdminPricing: React.FC = () => {
  const { settings, refreshData, currentUser } = useApp();
  const [currentSettings, setCurrentSettings] = useState<BusinessSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  const handleSave = () => {
    storage.saveSettings(currentSettings);
    apiClient.updateSettings(currentSettings, currentUser ? {
      email: currentUser.email,
      role: currentUser.role,
    } : undefined).catch(() => {});
    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'BUSINESS_PRICING_SETTINGS_UPDATE',
        targetResource: 'SETTINGS',
        newValue: `DeliveryFee: Rs. ${currentSettings.standardDeliveryFee}, MinOrder: Rs. ${currentSettings.minimumOrderAmount}, FreeThreshold: Rs. ${currentSettings.freeDeliveryThreshold}`,
      });
    }
    refreshData();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAreaInput.trim()) return;
    const clean = newAreaInput.trim();
    const existingAreas = currentSettings.serviceAreas || [];
    if (existingAreas.includes(clean)) {
      alert('This area is already in the service area list.');
      return;
    }
    setCurrentSettings({
      ...currentSettings,
      serviceAreas: [...existingAreas, clean],
    });
    setNewAreaInput('');
  };

  const handleRemoveArea = (areaToRemove: string) => {
    const existingAreas = currentSettings.serviceAreas || [];
    if (existingAreas.length <= 1) {
      alert('You must retain at least one delivery area in Bannu.');
      return;
    }
    setCurrentSettings({
      ...currentSettings,
      serviceAreas: existingAreas.filter(a => a !== areaToRemove),
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            Pricing, Delivery & Fee Controls
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Authoritative delivery rates, minimum order criteria & free delivery thresholds
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Pricing & Delivery Settings</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Pricing rules and delivery areas saved successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Standard Delivery Fee (PKR)
          </label>
          <input
            type="number"
            min={0}
            value={currentSettings.standardDeliveryFee}
            onChange={(e) => setCurrentSettings({ ...currentSettings, standardDeliveryFee: Number(e.target.value) })}
            className="w-full text-base font-bold font-mono p-2.5 bg-stone-50 border border-stone-300 rounded"
          />
          <p className="text-[11px] text-stone-500">
            Charged on standard delivery orders within Bannu city limits.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Free Delivery Threshold (PKR)
          </label>
          <input
            type="number"
            min={0}
            value={currentSettings.freeDeliveryThreshold}
            onChange={(e) => setCurrentSettings({ ...currentSettings, freeDeliveryThreshold: Number(e.target.value) })}
            className="w-full text-base font-bold font-mono p-2.5 bg-stone-50 border border-stone-300 rounded"
          />
          <p className="text-[11px] text-stone-500">
            Orders with subtotal above this amount get free delivery automatically.
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block">
            Minimum Order Amount (PKR)
          </label>
          <input
            type="number"
            min={0}
            value={currentSettings.minimumOrderAmount}
            onChange={(e) => setCurrentSettings({ ...currentSettings, minimumOrderAmount: Number(e.target.value) })}
            className="w-full text-base font-bold font-mono p-2.5 bg-stone-50 border border-stone-300 rounded"
          />
          <p className="text-[11px] text-stone-500">
            Cart subtotal must equal or exceed this value to proceed to checkout.
          </p>
        </div>

      </div>

      {/* Service Areas in Bannu Management */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-stone-900">
              Bannu Delivery Service Areas ({(currentSettings.serviceAreas || []).length})
            </h3>
          </div>
        </div>

        {/* Add Area Form */}
        <form onSubmit={handleAddArea} className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newAreaInput}
            onChange={(e) => setNewAreaInput(e.target.value)}
            placeholder="Add new area (e.g. Mandan Road, City Mall)..."
            className="flex-1 text-xs p-2 bg-stone-50 border border-stone-300 rounded focus:bg-white"
          />
          <button
            type="submit"
            className="px-3 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Area</span>
          </button>
        </form>

        {/* Area Tags with Delete Buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          {(currentSettings.serviceAreas || []).map((area, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-xs font-medium bg-stone-100 border border-stone-200 text-stone-800 px-3 py-1.5 rounded-lg group"
            >
              <span>{area}</span>
              <button
                type="button"
                onClick={() => handleRemoveArea(area)}
                className="text-stone-400 hover:text-red-700 p-0.5 rounded transition-colors"
                title={`Remove ${area}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
