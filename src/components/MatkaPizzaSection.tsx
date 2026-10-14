import React from 'react';
import { Flame, Users, Clock, Sparkles, Check, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const MatkaPizzaSection: React.FC = () => {
  const { setIsMatkaModalOpen, matkaConfig } = useApp();

  return (
    <section id="matka-pizza" className="py-16 md:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900 mb-2">
            <Flame className="w-4 h-4 text-amber-700" />
            <span>Sahara Bakers Signature Experience</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-950 tracking-tight">
            The Original Bannu Matka Pizza
          </h2>
          <p className="mt-3 text-stone-600 text-base sm:text-lg">
            Slow-baked in genuine earthenware pots for an earthy smoky aroma, a golden crunchy bottom crust, 
            and a decadent top layer of molten cheese and spiced cuts.
          </p>
        </div>

        {/* 3 Size Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {matkaConfig.sizes.map((size) => (
            <div
              key={size.id}
              className="group relative bg-stone-50 rounded-xl border border-stone-200 p-6 flex flex-col justify-between hover:border-amber-400 hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-stone-500">
                    Handcrafted Earthen Pot
                  </span>
                  <span className="text-xs font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    ~{matkaConfig.estimatedPrepTimeMinutes} Mins
                  </span>
                </div>
                <h3 className="text-2xl font-bold font-display text-stone-900 mb-1">
                  {size.name} Matka Pizza
                </h3>
                <p className="text-sm text-stone-600 mb-4">
                  {size.servesText}
                </p>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-extrabold text-stone-950 font-mono">
                    Rs. {size.basePrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-stone-500 font-sans">base price</span>
                </div>

                {/* Features checklist */}
                <ul className="space-y-2.5 text-xs text-stone-700 border-t border-stone-200/80 pt-4 mb-6">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Baked in traditional clay earthenware</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Select exact number of people ({matkaConfig.servingConfig.minPersons}–{matkaConfig.servingConfig.maxPersons})</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Choice of Tikka, Malai Boti, Mughlai, or 4-Cheese</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Rs. {matkaConfig.clayPotReturnCredit} pot return credit voucher</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setIsMatkaModalOpen(true)}
                className="bakery-btn w-full py-2.5 px-4 text-xs font-semibold text-stone-900 bg-stone-200 hover:bg-amber-700 hover:text-white rounded transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Customize This Size</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Highlight Banner on Earthenware & Serving Flexibility */}
        <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-950 text-white rounded-2xl p-6 sm:p-10 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400">
              <Users className="w-4 h-4" />
              <span>Catering & Group Friendly</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-display">
              Ordering for a Family or Gathering in Bannu?
            </h3>
            <p className="text-stone-300 text-sm leading-relaxed">
              Use our first-class Matka Configurator to specify the exact number of people (from 1 up to {matkaConfig.servingConfig.maxPersons} persons). 
              Our kitchen balances dough depth, cheese density, and savory chicken tikka ratios specifically for your table.
            </p>
          </div>
          <button
            onClick={() => setIsMatkaModalOpen(true)}
            className="shrink-0 px-6 py-3.5 text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded shadow transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>Launch Matka Configurator</span>
          </button>
        </div>

      </div>
    </section>
  );
};
