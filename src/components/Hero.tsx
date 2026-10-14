import React, { useState, useEffect } from 'react';
import { ArrowRight, Flame, Clock, MapPin, Sparkles, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import heroMatkaPizza from '../assets/images/sahara_hero_matka_pizza.jpg';

export const Hero: React.FC = () => {
  const { setIsMatkaModalOpen, settings, matkaConfig } = useApp();
  const [animationStage, setAnimationStage] = useState<'intro' | 'settled'>('intro');
  const [isImageReady, setIsImageReady] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  // Find lowest price
  const minPrice = matkaConfig.sizes.reduce((min, s) => s.basePrice < min ? s.basePrice : min, 350);

  // Preload hero image to guarantee animation never runs on empty container
  useEffect(() => {
    const img = new Image();
    img.src = heroMatkaPizza;
    if (img.complete) {
      setIsImageReady(true);
    } else {
      img.onload = () => setIsImageReady(true);
      img.onerror = () => setIsImageReady(true);
    }
  }, []);

  useEffect(() => {
    // Respect accessibility reduced motion settings
    const prefersReduced = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReduced) {
      setAnimationStage('settled');
      return;
    }

    if (!isImageReady) return;

    setAnimationStage('intro');
    const timer = setTimeout(() => {
      setAnimationStage('settled');
    }, 2600);

    return () => clearTimeout(timer);
  }, [replayKey, isImageReady]);

  const handleReplayIntro = () => {
    setReplayKey((prev) => prev + 1);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-stone-100 via-stone-50 to-stone-100 border-b border-stone-200 py-12 md:py-20">
      
      {/* Background ambient warm decorative gradient (Subtle slow glow) */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-10 left-10 w-72 h-72 bg-amber-100/30 rounded-full blur-2xl pointer-events-none -z-0" />

      {/* Optional announcement bar */}
      {settings.announcement && (
        <div className="bg-amber-900 text-amber-50 text-xs sm:text-sm py-2 px-4 text-center font-medium shadow-xs">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {settings.announcement}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Authentic Restaurant Story & Direct Action */}
          <div className="lg:col-span-7 space-y-6 animate-hero-text">
            
            {/* Metadata kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-900 uppercase">
              <span>Bannu, Khyber Pakhtunkhwa</span>
              <span aria-hidden="true">•</span>
              <span>Railway Road Heritage</span>
              <span aria-hidden="true">•</span>
              <span>Clay Pot Artisans</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-stone-950 font-display leading-[1.12] text-balance">
              The Famous Clay-Pot <span className="italic text-amber-800">Matka Pizza</span> & Artisanal Bakery.
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-2xl leading-relaxed">
              Baked in authentic earthen pots right here on Railway Road. Layered with slow-simmered spiced chicken, 
              rich roasted peppers, and thick bubbling mozzarella — alongside our daily fresh celebration cakes, 
              flaky pastries, and royal Pakistani mithai.
            </p>

            {/* Publicly confirmed pricing & fast reassurance */}
            <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-stone-600 font-medium">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-700" />
                Slow-baked in clay earthenware
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-700" />
                Freshly prepared in ~30 mins
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700" />
                Delivery throughout Bannu
              </span>
            </div>

            {/* Direct CTAs */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => setIsMatkaModalOpen(true)}
                className="bakery-btn inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <Flame className="w-4 h-4" />
                <span>Customize Matka Pizza</span>
                <span className="text-xs opacity-90 font-mono">(From Rs. {minPrice})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <a
                href="#menu"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bakery-btn inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg transition-colors text-center"
              >
                Browse Bakery & Cakes
              </a>
            </div>

            {/* Trust note & Replay intro animation trigger */}
            <div className="pt-1 flex items-center justify-between text-xs text-stone-500">
              <p>
                ♻️ Return your washed clay pot to Sahara Bakers counter anytime for a <strong>Rs. 50 voucher</strong>.
              </p>
              <button
                type="button"
                onClick={handleReplayIntro}
                title="Replay cinematic pizza landing intro"
                className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 font-medium px-2 py-0.5 rounded hover:bg-amber-100/60 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Replay Intro</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero High-Fidelity Food Visual with Verified Matka Pizza Image Asset */}
          <div key={replayKey} className="lg:col-span-5 relative flex flex-col items-center">
            
            {/* Dynamic Ground Contact Shadow */}
            <div 
              className={`absolute -bottom-3 w-[84%] h-8 bg-amber-950/35 rounded-[100%] blur-md pointer-events-none transition-all ${
                animationStage === 'intro' ? 'matka-shadow-active' : 'matka-shadow-idle'
              }`} 
            />

            {/* Matka Pizza Main Animated Container */}
            <div 
              className={`relative w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-stone-200/80 bg-stone-900 group aspect-[4/3] sm:aspect-[16/10] lg:aspect-square bakery-image-container ${
                animationStage === 'intro' ? 'matka-intro-active' : 'matka-idle-float'
              }`}
            >
              <img
                src={heroMatkaPizza}
                alt="Sahara Bakers Signature Matka Pizza bubbling with mozzarella in traditional clay pot"
                referrerPolicy="no-referrer"
                loading="eager"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 bakery-image-card"
              />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 bg-amber-950/85 text-amber-200 text-[11px] font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm flex items-center gap-1.5 shadow-sm border border-amber-500/30">
                <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Original Bannu Clay Pot</span>
              </div>

              {/* Editorial Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent flex flex-col justify-end p-6 text-white pointer-events-none">
                <span className="text-xs uppercase tracking-wider text-amber-300 font-semibold mb-1">
                  Sahara Flagship Special
                </span>
                <h3 className="text-xl sm:text-2xl font-bold font-display">Bannu Clay Pot Matka Pizza</h3>
                <p className="text-xs text-stone-300 mt-1 max-w-sm">
                  Choose your size (Small, Medium, Large) & select exact number of people (1 to 7+).
                </p>
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-xs font-mono pointer-events-auto">
                  <span>Small Rs 350 • Med Rs 650 • Large Rs 1,150</span>
                  <button
                    type="button"
                    onClick={() => setIsMatkaModalOpen(true)}
                    className="text-amber-400 hover:text-amber-300 underline font-sans font-semibold transition-colors"
                  >
                    Configure Now →
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
