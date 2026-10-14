/**
 * Sahara Bakers – Centralized Image Resolution & Asset Resilience Service
 * 
 * Uses direct static module imports from /src/assets/images/index
 * to ensure Vite generates verified, bundled, and hashed production URLs
 * that permanently resolve without 404s.
 */

import { BAKERY_IMAGES } from '../assets/images';

export const BAKERY_IMAGE_PRESETS: { id: string; name: string; category: string; path: string; bundledUrl: string }[] = [
  { id: 'matka', name: 'Clay-Pot Matka Pizza', category: 'matka-pizza', path: 'assets/images/sahara_matka_pizza_dish.jpg', bundledUrl: BAKERY_IMAGES.matkaPizzaDish },
  { id: 'three_milk_cake', name: 'Three Milk Cake', category: 'cakes', path: 'assets/images/sahara_three_milk_cake.jpg', bundledUrl: BAKERY_IMAGES.threeMilkCake },
  { id: 'fudge_cake', name: 'Belgian Chocolate Fudge Cake', category: 'cakes', path: 'assets/images/sahara_belgian_fudge_cake.jpg', bundledUrl: BAKERY_IMAGES.belgianFudgeCake },
  { id: 'red_velvet', name: 'Red Velvet Cream Cheese Cake', category: 'cakes', path: 'assets/images/sahara_red_velvet_cake.jpg', bundledUrl: BAKERY_IMAGES.redVelvetCake },
  { id: 'lotus_cake', name: 'Lotus Biscoff Crunch Cake', category: 'cakes', path: 'assets/images/sahara_lotus_biscoff_cake.jpg', bundledUrl: BAKERY_IMAGES.lotusBiscoffCake },
  { id: 'pastry_slice', name: 'Dark Chocolate Pastry Slice', category: 'cakes', path: 'assets/images/sahara_chocolate_pastry_slice.jpg', bundledUrl: BAKERY_IMAGES.chocolatePastrySlice },
  { id: 'gulab_jamun', name: 'Royal Hot Gulab Jamun', category: 'sweets', path: 'assets/images/sahara_hot_gulab_jamun.jpg', bundledUrl: BAKERY_IMAGES.hotGulabJamun },
  { id: 'barfi', name: 'Pistachio Almond Khoya Barfi', category: 'sweets', path: 'assets/images/sahara_pistachio_barfi.jpg', bundledUrl: BAKERY_IMAGES.pistachioBarfi },
  { id: 'mithai_box', name: 'Sahara Mixed Mithai Gift Box', category: 'sweets', path: 'assets/images/sahara_mixed_mithai_box.jpg', bundledUrl: BAKERY_IMAGES.mixedMithaiBox },
  { id: 'chicken_patty', name: 'Crispy Chicken Puff Patty', category: 'bakery', path: 'assets/images/sahara_chicken_puff_patty.jpg', bundledUrl: BAKERY_IMAGES.chickenPuffPatty },
  { id: 'croissant', name: 'Artisan Butter Croissant', category: 'bakery', path: 'assets/images/sahara_butter_croissant.jpg', bundledUrl: BAKERY_IMAGES.butterCroissant },
  { id: 'milk_bread', name: 'Sesame Milk Bread Loaf', category: 'bakery', path: 'assets/images/sahara_sesame_milk_bread.jpg', bundledUrl: BAKERY_IMAGES.sesameMilkBread },
  { id: 'cream_roll', name: 'Traditional Cream Horn Roll', category: 'bakery', path: 'assets/images/sahara_cream_horn_roll.jpg', bundledUrl: BAKERY_IMAGES.creamHornRoll },
  { id: 'margarita', name: 'Fresh Mint Lemon Margarita', category: 'beverages', path: 'assets/images/sahara_mint_margarita.jpg', bundledUrl: BAKERY_IMAGES.mintMargarita },
  { id: 'lassi', name: 'Traditional Bannu Sweet Lassi', category: 'beverages', path: 'assets/images/sahara_bannu_sweet_lassi.jpg', bundledUrl: BAKERY_IMAGES.bannuSweetLassi },
];

const STATIC_IMAGE_MAP: Record<string, string> = {
  // Official Branding & Receipt Assets
  'sahara_logo.jpg': BAKERY_IMAGES.saharaLogo,
  'sahara_logo': BAKERY_IMAGES.saharaLogo,
  'sahara_easypaisa_qr.png': BAKERY_IMAGES.easypaisaQr,
  'sahara_easypaisa_qr.jpg': BAKERY_IMAGES.easypaisaQr,
  'sahara_easypaisa_qr': BAKERY_IMAGES.easypaisaQr,

  // Hero & Showcase
  'sahara_hero_matka_pizza.jpg': BAKERY_IMAGES.heroMatkaPizza,
  'sahara_hero_matka_pizza': BAKERY_IMAGES.heroMatkaPizza,
  'sahara_matka_pizza_dish.jpg': BAKERY_IMAGES.matkaPizzaDish,
  'sahara_matka_pizza_dish': BAKERY_IMAGES.matkaPizzaDish,
  'sahara_artisan_bakery.jpg': BAKERY_IMAGES.artisanBakery,
  'sahara_artisan_bakery': BAKERY_IMAGES.artisanBakery,
  'sahara_celebration_cakes.jpg': BAKERY_IMAGES.celebrationCakes,
  'sahara_celebration_cakes': BAKERY_IMAGES.celebrationCakes,
  'sahara_traditional_sweets.jpg': BAKERY_IMAGES.traditionalSweets,
  'sahara_traditional_sweets': BAKERY_IMAGES.traditionalSweets,

  // Cakes
  'sahara_three_milk_cake.jpg': BAKERY_IMAGES.threeMilkCake,
  'sahara_belgian_fudge_cake.jpg': BAKERY_IMAGES.belgianFudgeCake,
  'sahara_red_velvet_cake.jpg': BAKERY_IMAGES.redVelvetCake,
  'sahara_lotus_biscoff_cake.jpg': BAKERY_IMAGES.lotusBiscoffCake,
  'sahara_chocolate_pastry_slice.jpg': BAKERY_IMAGES.chocolatePastrySlice,

  // Sweets
  'sahara_hot_gulab_jamun.jpg': BAKERY_IMAGES.hotGulabJamun,
  'sahara_pistachio_barfi.jpg': BAKERY_IMAGES.pistachioBarfi,
  'sahara_mixed_mithai_box.jpg': BAKERY_IMAGES.mixedMithaiBox,

  // Bakery
  'sahara_chicken_puff_patty.jpg': BAKERY_IMAGES.chickenPuffPatty,
  'sahara_butter_croissant.jpg': BAKERY_IMAGES.butterCroissant,
  'sahara_sesame_milk_bread.jpg': BAKERY_IMAGES.sesameMilkBread,
  'sahara_cream_horn_roll.jpg': BAKERY_IMAGES.creamHornRoll,

  // Beverages
  'sahara_mint_margarita.jpg': BAKERY_IMAGES.mintMargarita,
  'sahara_bannu_sweet_lassi.jpg': BAKERY_IMAGES.bannuSweetLassi,
};

export function getCategoryFallback(category: string): string {
  switch (category) {
    case 'cakes':
      return BAKERY_IMAGES.celebrationCakes;
    case 'sweets':
      return BAKERY_IMAGES.traditionalSweets;
    case 'bakery':
      return BAKERY_IMAGES.artisanBakery;
    case 'matka-pizza':
      return BAKERY_IMAGES.matkaPizzaDish;
    case 'beverages':
      return BAKERY_IMAGES.mintMargarita;
    default:
      return BAKERY_IMAGES.artisanBakery;
  }
}

export function resolveProductImage(rawPath: string | undefined, category: string = 'bakery'): string {
  if (!rawPath || typeof rawPath !== 'string' || !rawPath.trim()) {
    return getCategoryFallback(category);
  }

  const trimmed = rawPath.trim();

  // Full remote URLs or Persistent Data URIs (Base64)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // Temporary blob URLs that might have been saved in state:
  if (trimmed.startsWith('blob:')) {
    console.warn('[ImageResolver] Fragile transient blob URL detected, falling back to persistent asset:', trimmed);
    return getCategoryFallback(category);
  }

  // Extract base filename (e.g. "sahara_hero_matka_pizza.jpg" or strip timestamps)
  const filename = trimmed.split('/').pop()?.split('?')[0] || '';
  
  // Clean filename of timestamp suffix if present (e.g. sahara_hero_matka_pizza_1790931769603.jpg -> sahara_hero_matka_pizza.jpg)
  const canonicalName = filename.replace(/_\d{10,15}(\.jpg|\.png|\.webp)?$/i, '$1');

  // 1. Direct match in Vite-bundled static image map
  if (STATIC_IMAGE_MAP[filename]) {
    return STATIC_IMAGE_MAP[filename];
  }
  if (STATIC_IMAGE_MAP[canonicalName]) {
    return STATIC_IMAGE_MAP[canonicalName];
  }

  // 2. Search by key prefixes (e.g. "hero_matka" or "matka_pizza")
  for (const [key, url] of Object.entries(STATIC_IMAGE_MAP)) {
    const keyBase = key.replace('.jpg', '');
    if (filename.includes(keyBase) || canonicalName.includes(keyBase)) {
      return url;
    }
  }

  // 3. Fallback to runtime BASE_URL for external public directory assets
  const base = import.meta.env.BASE_URL || './';
  const baseUrl = base.endsWith('/') ? base : `${base}/`;
  let clean = trimmed.replace(/^\/?(src\/)?/, '');
  if (!clean.startsWith('assets/images/') && !clean.startsWith('images/products/')) {
    clean = `assets/images/${filename}`;
  }

  return `${baseUrl}${clean}`;
}

/**
 * Validates and converts an uploaded File into a persistent Base64 Data URI
 * for offline and multi-session persistence without depending on transient blob URLs.
 */
export async function processUploadedImage(file: File): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  if (!file.type.startsWith('image/')) {
    return { success: false, error: 'Only valid image files (JPG, PNG, WebP) are supported.' };
  }

  if (file.size > 4 * 1024 * 1024) {
    return { success: false, error: 'Image file size must be less than 4MB.' };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resolve({ success: true, dataUrl: result });
      } else {
        resolve({ success: false, error: 'Failed to read uploaded image file.' });
      }
    };
    reader.onerror = () => {
      resolve({ success: false, error: 'Error reading file.' });
    };
    reader.readAsDataURL(file);
  });
}
