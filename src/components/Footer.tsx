import React from 'react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { settings, setIsMatkaModalOpen } = useApp();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Address */}
          <div className="md:col-span-2 space-y-4">
            <span className="text-2xl font-bold font-display text-white tracking-tight">
              Sahara Bakers
            </span>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              Bannu's premier destination for original clay-pot Matka Pizza, 
              custom celebration cakes, daily oven-fresh baked savories, and traditional Pakistani mithai.
            </p>
            <div className="text-xs text-stone-400 space-y-1">
              <p>{settings.address}</p>
              <p>Bannu {settings.postalCode}, Khyber Pakhtunkhwa, Pakistan</p>
              <p className="font-mono pt-1 text-stone-300">Tel: {settings.phone}</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setIsMatkaModalOpen(true)}
                  className="hover:text-white transition-colors"
                >
                  Order Matka Pizza
                </button>
              </li>
              <li>
                <a href="#menu" className="hover:text-white transition-colors">
                  Bakery & Cakes Menu
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  Our Culinary Story
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Find Our Bakery
                </a>
              </li>
              <li className="pt-2 border-t border-stone-800">
                <a href="#counter" className="text-stone-400 hover:text-amber-400 transition-colors">
                  Staff Portals (Counter / Kitchen / Rider)
                </a>
              </li>
            </ul>
          </div>

          {/* Hours & Policy */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Kitchen Schedule
            </h4>
            <div className="text-xs text-stone-400 space-y-1">
              <p>Monday – Sunday</p>
              <p className="text-white font-medium">{settings.openingTime} AM – {settings.closingTime} PM</p>
              <p className="pt-2 text-[11px] text-stone-500">
                Clay-pot recycling program: Return clean pot for Rs. 50 voucher.
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <p className="text-stone-400">© 2026 Sahara Bakers. All rights reserved.</p>
          {settings.showCreatorCredit !== false && (
            <p className="text-stone-400 text-[11px] sm:text-xs tracking-wide">
              Designed & Developed by{' '}
              {settings.creatorUrl ? (
                <a
                  href={settings.creatorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-stone-300 hover:text-amber-400 underline underline-offset-2 transition-colors"
                >
                  {settings.creatorName || 'Mr Zaheer'}
                </a>
              ) : (
                <span className="font-medium text-stone-300">
                  {settings.creatorName || 'Mr Zaheer'}
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
};
