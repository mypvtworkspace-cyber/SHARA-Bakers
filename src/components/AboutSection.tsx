import React from 'react';
import { Award, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { resolveProductImage } from '../services/imageResolver';

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-16 md:py-24 bg-white border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Images visual showcase */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="group rounded-xl overflow-hidden shadow aspect-[4/5] bg-stone-100 border border-stone-200 bakery-image-container">
                <img
                  src={resolveProductImage('assets/images/sahara_artisan_bakery.jpg', 'bakery')}
                  alt="Fresh daily bakery items at Sahara Bakers Bannu"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover bakery-image-card bakery-image-bakery"
                />
              </div>
              <div className="group rounded-xl overflow-hidden shadow aspect-square bg-stone-100 border border-stone-200 bakery-image-container">
                <img
                  src={resolveProductImage('assets/images/sahara_traditional_sweets.jpg', 'sweets')}
                  alt="Traditional Pakistani sweets at Sahara Bakers Bannu"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover bakery-image-card bakery-image-sweets"
                />
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="group rounded-xl overflow-hidden shadow aspect-square bg-stone-100 border border-stone-200 bakery-image-container">
                <img
                  src={resolveProductImage('assets/images/sahara_celebration_cakes.jpg', 'cakes')}
                  alt="Artisanal celebration cakes at Sahara Bakers Bannu"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover bakery-image-card bakery-image-cake"
                />
              </div>
              <div className="group rounded-xl overflow-hidden shadow aspect-[4/5] bg-stone-100 border border-stone-200 bakery-image-container">
                <img
                  src={resolveProductImage('assets/images/sahara_hero_matka_pizza.jpg', 'matka-pizza')}
                  alt="Clay-pot Matka Pizza baking"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover bakery-image-card bakery-image-default"
                />
              </div>
            </div>
          </div>

          {/* Editorial Content */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900">
              <span>Bannu Culinary Tradition</span>
              <span aria-hidden="true">•</span>
              <span>Since Inception</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold font-display text-stone-950 leading-tight">
              A Legacy of Baking Warmth on Railway Road
            </h2>

            <p className="text-stone-600 text-base leading-relaxed">
              Sahara Bakers was established with a singular devotion: bringing together honest artisanal bakery craft 
              and the beloved regional comfort of authentic Pakistani cuisine. Located prominently on Railway Road 
              near Syed Software House in Bannu, we pride ourselves on scratch-made baking every morning.
            </p>

            <p className="text-stone-600 text-sm leading-relaxed">
              When we introduced the signature <strong>Matka Pizza</strong> — baked directly inside earthenware clay pots — 
              it captured the hearts of local food lovers across Bannu district. The porous earthenware vessel seals in rich spiced chicken juices, 
              creates an irresistibly crisp crust, and delivers a feast that stays hot from our oven to your table.
            </p>

            {/* Core Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-800 rounded-lg shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">100% Pure Ingredients</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Real dairy cream, pure buffalo milk khoya, and fresh halal chicken daily.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-50 text-amber-800 rounded-lg shrink-0">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Community & Sustainability</h4>
                  <p className="text-xs text-stone-500 mt-0.5">Eco-friendly clay pot recycling program with Rs. 50 return credits.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
