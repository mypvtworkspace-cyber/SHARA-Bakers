import React, { useState, useEffect } from 'react';
import { Flame, Save, Trash2, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { apiClient } from '../../services/apiClient';
import { MatkaPizzaConfig } from '../../types';

export const AdminMatkaPizza: React.FC = () => {
  const { matkaConfig, refreshData, currentUser } = useApp();
  const [config, setConfig] = useState<MatkaPizzaConfig>(matkaConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setConfig(matkaConfig);
  }, [matkaConfig]);

  // New Flavor form
  const [newFlavorName, setNewFlavorName] = useState('');
  const [newFlavorDesc, setNewFlavorDesc] = useState('');
  const [newFlavorPrice, setNewFlavorPrice] = useState(0);

  // New Add-on form
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState(60);

  const handleSave = async () => {
    storage.saveMatkaConfig(config);
    try {
      await apiClient.updateMatkaConfig(config, currentUser ? {
        email: currentUser.email,
        role: currentUser.role,
      } : undefined);
    } catch (err) {
      console.warn('[AdminMatkaPizza] Server sync fallback:', err);
    }

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'MATKA_PIZZA_CONFIG_UPDATE',
        targetResource: 'MATKA_CONFIG',
        newValue: `Serving: ${config.servingConfig.minPersons}-${config.servingConfig.maxPersons} persons, Sizes: S=${config.sizes[0].basePrice}, M=${config.sizes[1].basePrice}, L=${config.sizes[2].basePrice}`,
      });
    }
    await refreshData();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleServingChange = (min: number, max: number) => {
    const allowed = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    setConfig({
      ...config,
      servingConfig: {
        ...config.servingConfig,
        minPersons: min,
        maxPersons: max,
        allowedValues: allowed,
      },
    });
  };

  const updateSizePrice = (sizeId: string, newPrice: number) => {
    setConfig({
      ...config,
      sizes: config.sizes.map(s => s.id === sizeId ? { ...s, basePrice: newPrice } : s),
    });
  };

  const handleDeleteFlavor = (flavorId: string) => {
    if (config.flavors.length <= 1) {
      alert('You must have at least one flavor available.');
      return;
    }
    setConfig({
      ...config,
      flavors: config.flavors.filter(f => f.id !== flavorId),
    });
  };

  const handleDeleteAddon = (addonId: string) => {
    setConfig({
      ...config,
      addons: config.addons.filter(a => a.id !== addonId),
    });
  };

  const toggleFlavorAvailability = (flavorId: string) => {
    setConfig({
      ...config,
      flavors: config.flavors.map(f => f.id === flavorId ? { ...f, available: !f.available } : f),
    });
  };

  const updateFlavorPrice = (flavorId: string, price: number) => {
    setConfig({
      ...config,
      flavors: config.flavors.map(f => f.id === flavorId ? { ...f, priceAdjustment: price } : f),
    });
  };

  const toggleAddonAvailability = (addonId: string) => {
    setConfig({
      ...config,
      addons: config.addons.map(a => a.id === addonId ? { ...a, available: !a.available } : a),
    });
  };

  const updateAddonPrice = (addonId: string, price: number) => {
    setConfig({
      ...config,
      addons: config.addons.map(a => a.id === addonId ? { ...a, price: price } : a),
    });
  };

  const handleAddFlavor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlavorName.trim()) return;
    const newF = {
      id: `flav_${Date.now()}`,
      name: newFlavorName.trim(),
      description: newFlavorDesc.trim() || 'Signature spiced filling baked in earthenware pot.',
      priceAdjustment: Number(newFlavorPrice) || 0,
      isSpicy: false,
      available: true,
    };
    setConfig({
      ...config,
      flavors: [...config.flavors, newF],
    });
    setNewFlavorName('');
    setNewFlavorDesc('');
    setNewFlavorPrice(0);
  };

  const handleAddAddon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddonName.trim()) return;
    const newA = {
      id: `addon_${Date.now()}`,
      name: newAddonName.trim(),
      price: Number(newAddonPrice) || 50,
      category: 'topping' as const,
      available: true,
    };
    setConfig({
      ...config,
      addons: [...config.addons, newA],
    });
    setNewAddonName('');
    setNewAddonPrice(60);
  };

  return (
    <div className="space-y-6">
      
      {/* Title & Save Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-700" />
            <h1 className="text-2xl font-bold font-display text-stone-900">
              Matka Pizza Flagship Operations
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Configure sizes, dynamic serving capacity, pricing strategy, toppings & earthenware rules.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Matka Configuration</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Configuration saved! Customer configurator updated immediately.</span>
        </div>
      )}

      {/* Module 1: Serving Selection Engine */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              1. Number of People / Serving Configuration
            </h3>
            <p className="text-xs text-stone-500">
              Control the range of servings customers can select in the Matka Pizza configurator.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Minimum People Allowed
            </label>
            <input
              type="number"
              min={1}
              max={config.servingConfig.maxPersons - 1}
              value={config.servingConfig.minPersons}
              onChange={(e) => handleServingChange(Number(e.target.value), config.servingConfig.maxPersons)}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Maximum People Allowed (e.g. 7, 10, or 20)
            </label>
            <input
              type="number"
              min={config.servingConfig.minPersons + 1}
              max={30}
              value={config.servingConfig.maxPersons}
              onChange={(e) => handleServingChange(config.servingConfig.minPersons, Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Price Adjustment Per Extra Person (PKR)
            </label>
            <input
              type="number"
              min={0}
              value={config.servingConfig.pricePerPersonAdjustment || 0}
              onChange={(e) => setConfig({
                ...config,
                servingConfig: {
                  ...config.servingConfig,
                  pricePerPersonAdjustment: Number(e.target.value),
                },
              })}
              placeholder="0 (Fixed size pricing)"
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Leave 0 to use base size pricing only.
            </span>
          </div>
        </div>

        <div className="p-3 bg-stone-50 rounded-lg text-xs text-stone-600">
          Currently active allowed values: <strong className="font-mono">{config.servingConfig.allowedValues?.join(', ')}</strong>
        </div>
      </div>

      {/* Module 2: Sizes & Base Pricing */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-200 pb-3">
          2. Pot Sizes & Base Prices (Pakistani Rupees)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.sizes.map((size) => (
            <div key={size.id} className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="font-bold text-sm text-stone-900">{size.name} Pot</div>
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Base Price (PKR)</label>
                <input
                  type="number"
                  value={size.basePrice}
                  onChange={(e) => updateSizePrice(size.id, Number(e.target.value))}
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-600 block mb-1">Serving Label</label>
                <input
                  type="text"
                  value={size.servesText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfig({
                      ...config,
                      sizes: config.sizes.map(s => s.id === size.id ? { ...s, servesText: val } : s),
                    });
                  }}
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module 3: Flavors & Styles Management */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <h3 className="text-sm font-bold text-stone-900">
            3. Flavors & Savory Fillings ({config.flavors.length})
          </h3>
        </div>

        {/* Add flavor form */}
        <form onSubmit={handleAddFlavor} className="p-3 bg-stone-50 rounded-lg border border-stone-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <label className="font-semibold block mb-0.5">Flavor Name</label>
            <input
              type="text"
              required
              value={newFlavorName}
              onChange={(e) => setNewFlavorName(e.target.value)}
              placeholder="e.g. Achari Tikka..."
              className="w-full p-1.5 bg-white border border-stone-300 rounded"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="font-semibold block mb-0.5">Description</label>
            <input
              type="text"
              value={newFlavorDesc}
              onChange={(e) => setNewFlavorDesc(e.target.value)}
              placeholder="Flavor profile..."
              className="w-full p-1.5 bg-white border border-stone-300 rounded"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="font-semibold block mb-0.5">+Price (PKR)</label>
              <input
                type="number"
                min={0}
                value={newFlavorPrice}
                onChange={(e) => setNewFlavorPrice(Number(e.target.value))}
                className="w-full p-1.5 bg-white border border-stone-300 rounded font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-800 text-white rounded font-bold"
            >
              Add
            </button>
          </div>
        </form>

        {/* Flavors list */}
        <div className="space-y-2">
          {config.flavors.map((flavor) => (
            <div key={flavor.id} className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex-1">
                <div className="font-bold text-stone-900">{flavor.name}</div>
                <div className="text-[11px] text-stone-500">{flavor.description}</div>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <div className="flex items-center gap-1">
                  <span>+Rs.</span>
                  <input
                    type="number"
                    min={0}
                    value={flavor.priceAdjustment}
                    onChange={(e) => updateFlavorPrice(flavor.id, Number(e.target.value))}
                    className="w-16 p-1 bg-white border border-stone-300 rounded text-center font-bold"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toggleFlavorAvailability(flavor.id)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${
                    flavor.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {flavor.available ? 'Active' : 'Disabled'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFlavor(flavor.id)}
                  className="p-1 text-stone-400 hover:text-red-700 transition-colors"
                  title="Delete flavor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module 4: Add-ons & Toppings Management */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <h3 className="text-sm font-bold text-stone-900">
            4. Add-ons & Extra Dips ({config.addons.length})
          </h3>
        </div>

        {/* Add addon form */}
        <form onSubmit={handleAddAddon} className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex gap-2 text-xs max-w-lg">
          <input
            type="text"
            required
            value={newAddonName}
            onChange={(e) => setNewAddonName(e.target.value)}
            placeholder="Addon name (e.g. Ranch Garlic Dip)..."
            className="flex-1 p-1.5 bg-white border border-stone-300 rounded"
          />
          <input
            type="number"
            min={0}
            value={newAddonPrice}
            onChange={(e) => setNewAddonPrice(Number(e.target.value))}
            placeholder="Price"
            className="w-20 p-1.5 bg-white border border-stone-300 rounded font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-800 text-white rounded font-bold"
          >
            Add
          </button>
        </form>

        {/* Addons list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {config.addons.map((addon) => (
            <div key={addon.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-900">{addon.name}</span>
                <span className="text-[11px] text-stone-500 font-mono block">Rs. {addon.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={addon.price}
                  onChange={(e) => updateAddonPrice(addon.id, Number(e.target.value))}
                  className="w-16 p-1 bg-white border border-stone-300 rounded font-mono text-center text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => toggleAddonAvailability(addon.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    addon.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {addon.available ? 'Active' : 'Off'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAddon(addon.id)}
                  className="p-1 text-stone-400 hover:text-red-700 transition-colors"
                  title="Delete addon"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Module 5: Operations & Clay Pot Recycling Credit */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 border-b border-stone-200 pb-3">
          5. Operations & Clay Pot Recycling Credit
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Estimated Oven Prep Time (Minutes)
            </label>
            <input
              type="number"
              value={config.estimatedPrepTimeMinutes}
              onChange={(e) => setConfig({ ...config, estimatedPrepTimeMinutes: Number(e.target.value) })}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Clay Pot Return Voucher Credit (PKR)
            </label>
            <input
              type="number"
              value={config.clayPotReturnCredit}
              onChange={(e) => setConfig({ ...config, clayPotReturnCredit: Number(e.target.value) })}
              className="w-full text-xs p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>
        </div>
      </div>

    </div>
  );
};
