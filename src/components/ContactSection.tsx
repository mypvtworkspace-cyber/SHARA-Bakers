import React from 'react';
import { MapPin, Phone, Clock, MessageSquare, ExternalLink, Navigation } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ContactSection: React.FC = () => {
  const { settings, setIsCartOpen } = useApp();

  return (
    <section id="contact" className="py-16 md:py-24 bg-stone-100 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Location & Details */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-900 mb-1">
                <span>Visit Us or Order Delivery</span>
              </div>
              <h2 className="text-3xl font-bold font-display text-stone-950">
                Find Sahara Bakers in Bannu
              </h2>
              <p className="text-stone-600 text-sm mt-2">
                Conveniently located on Railway Road. Come savor the aroma of fresh baking or place your delivery order online.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Address */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-stone-200">
                <MapPin className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Bakery Location</h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {settings.address}, Bannu {settings.postalCode}, Khyber Pakhtunkhwa, Pakistan
                  </p>
                  <a
                    href="https://maps.google.com/?q=Railway+Road+Bannu+Pakistan"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-amber-800 font-semibold hover:underline mt-2"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Phone & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-stone-200">
                  <Phone className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">Telephone Call</h4>
                    <p className="text-xs text-stone-600 mt-0.5 font-mono">{settings.phone}</p>
                    <a
                      href={`tel:${settings.phone}`}
                      className="text-xs text-amber-800 font-semibold hover:underline block mt-1"
                    >
                      Call Counter Directly
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-stone-200">
                  <MessageSquare className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">WhatsApp Support</h4>
                    <p className="text-xs text-stone-600 mt-0.5 font-mono">{settings.whatsappPhone}</p>
                    <a
                      href={`https://wa.me/${(settings.whatsappPhone || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-green-700 font-semibold hover:underline block mt-1"
                    >
                      Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-stone-200">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Operating Hours</h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Monday to Sunday: <span className="font-semibold">{settings.openingTime} AM – {settings.closingTime} PM</span>
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Hot Matka Pizza oven operates continuously throughout opening hours.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Frame / Delivery Zones */}
          <div className="lg:col-span-6 flex flex-col justify-between bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Navigation className="w-4 h-4 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900 font-display">
                  Delivery Coverage in Bannu
                </h3>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed mb-4">
                We deliver throughout Bannu with specialized insulated food warmers so your Matka Pizza arrives boiling hot. 
                Standard delivery fee is Rs. {settings.standardDeliveryFee}, or <strong>FREE</strong> for orders above Rs. {settings.freeDeliveryThreshold}.
              </p>

              <div className="space-y-1.5 mb-6">
                <span className="text-xs font-semibold text-stone-700 block">Covered Areas:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(settings?.serviceAreas || [
                    'Railway Road',
                    'City Center',
                    'Cantonment Bannu',
                    'Miran Shah Road',
                    'Kohat Road',
                    'Sugar Mill Colony',
                    'Mandeyan',
                    'Bannu University Campus',
                    'Ghauri Gate',
                  ]).map((area, idx) => (
                    <span
                      key={idx}
                      className="text-xs text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 block">Ready to dine?</span>
                <span className="text-sm font-bold text-stone-900">Place an order for pickup or delivery</span>
              </div>
              <button
                onClick={() => setIsCartOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded transition-colors"
              >
                View Your Cart
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
