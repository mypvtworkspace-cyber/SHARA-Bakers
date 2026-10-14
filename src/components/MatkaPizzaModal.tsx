import React, { useState, useMemo } from 'react';
import { X, Flame, Users, Sparkles, Check, ShoppingBag, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { resolveProductImage } from '../services/imageResolver';

export const MatkaPizzaModal: React.FC = () => {
  const { isMatkaModalOpen, setIsMatkaModalOpen, matkaConfig, addToCart } = useApp();

  // Selected state
  const [selectedSizeId, setSelectedSizeId] = useState<string>(matkaConfig.sizes[1]?.id || matkaConfig.sizes[0]?.id);
  const [selectedPersons, setSelectedPersons] = useState<number>(3);
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(matkaConfig.flavors[0]?.id);
  const [selectedCrustId, setSelectedCrustId] = useState<string>(matkaConfig.crustOptions[0]?.id);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [customerNote, setCustomerNote] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const selectedSize = useMemo(() => {
    return matkaConfig.sizes.find(s => s.id === selectedSizeId) || matkaConfig.sizes[0];
  }, [selectedSizeId, matkaConfig]);

  const selectedFlavor = useMemo(() => {
    return matkaConfig.flavors.find(f => f.id === selectedFlavorId) || matkaConfig.flavors[0];
  }, [selectedFlavorId, matkaConfig]);

  const selectedCrust = useMemo(() => {
    return matkaConfig.crustOptions.find(c => c.id === selectedCrustId) || matkaConfig.crustOptions[0];
  }, [selectedCrustId, matkaConfig]);

  const activeAddons = useMemo(() => {
    return matkaConfig.addons.filter(a => selectedAddonIds.includes(a.id));
  }, [selectedAddonIds, matkaConfig]);

  // Authoritative Unit Price calculation for preview
  const calculatedUnitPrice = useMemo(() => {
    let price = selectedSize.basePrice;

    // Person adjustment if configured
    if (matkaConfig.servingConfig.pricePerPersonAdjustment) {
      const diff = Math.max(0, selectedPersons - 1);
      price += diff * matkaConfig.servingConfig.pricePerPersonAdjustment;
    }

    // Flavor adjustment
    if (selectedFlavor) {
      price += selectedFlavor.priceAdjustment;
    }

    // Crust adjustment
    if (selectedCrust) {
      price += selectedCrust.priceAdjustment;
    }

    // Addons
    for (const addon of activeAddons) {
      price += addon.price;
    }

    return price;
  }, [selectedSize, selectedPersons, selectedFlavor, selectedCrust, activeAddons, matkaConfig]);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  const handleAddToCart = () => {
    const customAddons = activeAddons.map(a => ({
      id: a.id,
      name: a.name,
      price: a.price,
    }));

    addToCart({
      productId: 'prod-matka-pizza',
      productName: `Matka Pizza (${selectedSize.name})`,
      category: 'matka-pizza',
      unitPrice: calculatedUnitPrice,
      quantity,
      image: resolveProductImage('assets/images/sahara_matka_pizza_dish.jpg', 'matka-pizza'),
      customization: {
        size: selectedSize.name,
        persons: selectedPersons,
        flavor: selectedFlavor.name,
        crust: selectedCrust.name,
        selectedAddons: customAddons,
        customerNote: customerNote.trim() || undefined,
      },
    });

    setIsMatkaModalOpen(false);
  };

  if (!isMatkaModalOpen) return null;

  // Allowed person values from admin config
  const allowedPersons = matkaConfig.servingConfig.allowedValues && matkaConfig.servingConfig.allowedValues.length > 0
    ? matkaConfig.servingConfig.allowedValues
    : Array.from(
        { length: matkaConfig.servingConfig.maxPersons - matkaConfig.servingConfig.minPersons + 1 },
        (_, i) => matkaConfig.servingConfig.minPersons + i
      );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-700" />
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900 leading-tight">
                Matka Pizza Configurator
              </h2>
              <p className="text-xs text-stone-500">
                Clay-pot baked in Bannu • Custom size, servings & ingredients
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMatkaModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Configurator Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1">
          
          {/* STEP 1: SIZE SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800">
                1. Select Pot Size
              </label>
              <span className="text-xs text-amber-800 font-medium">
                {selectedSize.servesText}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {matkaConfig.sizes.map((size) => {
                const isSelected = size.id === selectedSizeId;
                return (
                  <button
                    key={size.id}
                    type="button"
                    onClick={() => {
                      setSelectedSizeId(size.id);
                      setSelectedPersons(size.defaultPersons);
                    }}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/70 ring-1 ring-amber-700 shadow-sm'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-900">{size.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-amber-800" />}
                    </div>
                    <div className="text-xs font-mono font-bold text-amber-900 mt-1">
                      Rs. {size.basePrice.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {size.servesText}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: NUMBER OF PEOPLE / SERVING SELECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-amber-700" />
                <span>2. Number of People / Servings</span>
              </label>
              <span className="text-xs font-semibold text-stone-700 font-mono">
                Selected: {selectedPersons} {selectedPersons === 1 ? 'Person' : 'Persons'}
              </span>
            </div>
            
            <p className="text-xs text-stone-500 mb-3">
              Specify the intended gathering size so our chefs calibrate dough thickness and chicken tikka density.
            </p>

            <div className="flex flex-wrap gap-2">
              {allowedPersons.map((num) => {
                const isSelected = selectedPersons === num;
                const isRecommended = selectedSize.recommendedPersons.includes(num);
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedPersons(num)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-amber-800 text-white border-amber-800 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    <span>{num} {num === 1 ? 'Person' : 'Persons'}</span>
                    {isRecommended && !isSelected && (
                      <span className="ml-1 text-[10px] text-amber-700 opacity-90">★</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: FLAVOR SELECTION */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block mb-2">
              3. Select Savory Filling & Flavor
            </label>
            <div className="space-y-2">
              {matkaConfig.flavors.map((flavor) => {
                const isSelected = flavor.id === selectedFlavorId;
                return (
                  <button
                    key={flavor.id}
                    type="button"
                    onClick={() => setSelectedFlavorId(flavor.id)}
                    className={`w-full p-3 text-left rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/60 ring-1 ring-amber-700'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-stone-900">{flavor.name}</span>
                        {flavor.isSpicy && (
                          <span className="text-[10px] bg-red-100 text-red-700 font-semibold px-1.5 py-0.2 rounded">
                            Spicy
                          </span>
                        )}
                        {flavor.priceAdjustment > 0 && (
                          <span className="text-xs font-mono text-amber-800 font-medium">
                            +Rs. {flavor.priceAdjustment}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{flavor.description}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-800 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: CRUST / BAKING STYLE */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block mb-2">
              4. Earthenware Crust Preparation
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {matkaConfig.crustOptions.map((crust) => {
                const isSelected = crust.id === selectedCrustId;
                return (
                  <button
                    key={crust.id}
                    type="button"
                    onClick={() => setSelectedCrustId(crust.id)}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/60 ring-1 ring-amber-700'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-stone-900">{crust.name}</div>
                    {crust.priceAdjustment > 0 ? (
                      <div className="text-xs font-mono text-amber-800 font-semibold mt-0.5">
                        +Rs. {crust.priceAdjustment}
                      </div>
                    ) : (
                      <div className="text-[11px] text-stone-500 mt-0.5">Standard</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 5: ADD-ONS */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block mb-2">
              5. Optional Toppings & Fresh Dips
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {matkaConfig.addons.map((addon) => {
                const isSelected = selectedAddonIds.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-2.5 text-left rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/70 text-stone-900'
                        : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium">{addon.name}</div>
                      <div className="text-xs font-mono text-amber-900 font-semibold">+Rs. {addon.price}</div>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-amber-800 border-amber-800 text-white' : 'border-stone-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 6: KITCHEN INSTRUCTIONS */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-stone-800 block mb-1">
              6. Special Kitchen Instructions (Optional)
            </label>
            <textarea
              rows={2}
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder="e.g. Extra well-done crispy crust, keep spice mild, serve with extra spoons..."
              className="w-full text-xs p-3 rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
            />
          </div>

          {/* ECO NOTICE: CLAY POT RETURN CREDIT */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Clay Pot Eco-Credit:</span> Return your clean Sahara Matka pot to our Railway Road counter anytime to receive a <strong>Rs. {matkaConfig.clayPotReturnCredit} voucher</strong> toward your next purchase.
            </div>
          </div>

        </div>

        {/* Modal Footer with Live Authoritative Price & Add to Cart */}
        <div className="p-4 sm:p-6 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            {/* Quantity stepper */}
            <div className="flex items-center border border-stone-300 rounded-lg bg-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-sm font-bold text-stone-700 hover:bg-stone-100 rounded-l"
              >
                -
              </button>
              <span className="px-3 py-1.5 text-xs font-mono font-bold text-stone-900 min-w-[28px] text-center">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-1.5 text-sm font-bold text-stone-700 hover:bg-stone-100 rounded-r"
              >
                +
              </button>
            </div>

            {/* Total calculation display */}
            <div>
              <div className="text-[10px] uppercase font-semibold text-stone-500">
                Authoritative Total
              </div>
              <div className="text-xl font-bold font-mono text-stone-950">
                Rs. {(calculatedUnitPrice * quantity).toLocaleString()}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded shadow transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Matka Pizza to Cart</span>
          </button>
        </div>

      </div>
    </div>
  );
};
