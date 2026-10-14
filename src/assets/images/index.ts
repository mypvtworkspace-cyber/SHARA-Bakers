/**
 * Sahara Bakers – Canonical Image Assets Registry
 * 
 * Using ES module static imports allows Vite to:
 * 1. Verify every image asset at compile time.
 * 2. Hash and bundle images into /dist/assets/ automatically.
 * 3. Prepend the correct runtime base URL (e.g. './' or '/sahara-bakers/').
 * 4. Guarantee 100% reliable rendering across Dev, Preview, Production build, and GitHub Pages.
 */

import heroMatkaPizza from './sahara_hero_matka_pizza.jpg';
import matkaPizzaDish from './sahara_matka_pizza_dish.jpg';
import artisanBakery from './sahara_artisan_bakery.jpg';
import celebrationCakes from './sahara_celebration_cakes.jpg';
import traditionalSweets from './sahara_traditional_sweets.jpg';

import belgianFudgeCake from './sahara_belgian_fudge_cake.jpg';
import redVelvetCake from './sahara_red_velvet_cake.jpg';
import lotusBiscoffCake from './sahara_lotus_biscoff_cake.jpg';
import threeMilkCake from './sahara_three_milk_cake.jpg';
import chocolatePastrySlice from './sahara_chocolate_pastry_slice.jpg';

import hotGulabJamun from './sahara_hot_gulab_jamun.jpg';
import pistachioBarfi from './sahara_pistachio_barfi.jpg';
import mixedMithaiBox from './sahara_mixed_mithai_box.jpg';

import chickenPuffPatty from './sahara_chicken_puff_patty.jpg';
import butterCroissant from './sahara_butter_croissant.jpg';
import sesameMilkBread from './sahara_sesame_milk_bread.jpg';
import creamHornRoll from './sahara_cream_horn_roll.jpg';

import mintMargarita from './sahara_mint_margarita.jpg';
import bannuSweetLassi from './sahara_bannu_sweet_lassi.jpg';

// Official Branding & Receipt Assets
import saharaLogo from './sahara_logo.jpg';
import easypaisaQr from './sahara_easypaisa_qr.png';

export const BAKERY_IMAGES = {
  // Official Branding & Receipt Assets
  saharaLogo,
  easypaisaQr,

  // Flagship & Showcase
  heroMatkaPizza,
  matkaPizzaDish,
  artisanBakery,
  celebrationCakes,
  traditionalSweets,

  // Cakes
  belgianFudgeCake,
  redVelvetCake,
  lotusBiscoffCake,
  threeMilkCake,
  chocolatePastrySlice,

  // Sweets
  hotGulabJamun,
  pistachioBarfi,
  mixedMithaiBox,

  // Bakery
  chickenPuffPatty,
  butterCroissant,
  sesameMilkBread,
  creamHornRoll,

  // Beverages
  mintMargarita,
  bannuSweetLassi,
} as const;

export default BAKERY_IMAGES;
