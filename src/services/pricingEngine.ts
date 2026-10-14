import { CartItem, Coupon, FulfilmentType } from '../types';
import { storage } from './storage';

export interface AuthoritativePriceSummary {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  totalAmount: number;
  itemBreakdown: {
    cartItemId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    itemTotal: number;
  }[];
}

export class PricingEngine {
  /**
   * Recalculates authoritative prices directly against database products and configurations.
   * Client-supplied prices are strictly ignored to prevent client-side price tampering.
   */
  public static calculateOrderTotal(params: {
    items: CartItem[];
    fulfilmentType: FulfilmentType;
    couponCode?: string;
    deliveryDistanceKm?: number;
  }): AuthoritativePriceSummary {
    const products = storage.getProducts();
    const matkaConfig = storage.getMatkaConfig();
    const settings = storage.getSettings();

    let subtotal = 0;
    const itemBreakdown: AuthoritativePriceSummary['itemBreakdown'] = [];

    for (const item of params.items) {
      const realProduct = products.find(p => p.id === item.productId);
      if (!realProduct) {
        throw new Error(`Product not found: ${item.productId}`);
      }
      if (!realProduct.available) {
        throw new Error(`Item "${realProduct.name}" is currently unavailable.`);
      }

      let authoritativeUnitPrice = realProduct.basePrice;

      // If it's a Matka Pizza, apply authoritative size, flavor, crust, person adjustment, and add-on pricing
      if (realProduct.productType === 'MATKA_PIZZA' && item.customization) {
        const cust = item.customization;

        // Size pricing
        if (cust.size) {
          const sizeObj = matkaConfig.sizes.find(s => s.name.toLowerCase() === cust.size?.toLowerCase());
          if (sizeObj) {
            authoritativeUnitPrice = sizeObj.basePrice;
          }
        }

        // Person / serving price adjustment if configured by admin
        if (cust.persons && matkaConfig.servingConfig.pricePerPersonAdjustment) {
          const basePersons = 1;
          const diff = Math.max(0, cust.persons - basePersons);
          authoritativeUnitPrice += diff * matkaConfig.servingConfig.pricePerPersonAdjustment;
        }

        // Flavor adjustment
        if (cust.flavor) {
          const flavObj = matkaConfig.flavors.find(f => f.name.toLowerCase() === cust.flavor?.toLowerCase());
          if (flavObj) {
            authoritativeUnitPrice += flavObj.priceAdjustment;
          }
        }

        // Crust adjustment
        if (cust.crust) {
          const crustObj = matkaConfig.crustOptions.find(c => c.name.toLowerCase() === cust.crust?.toLowerCase());
          if (crustObj) {
            authoritativeUnitPrice += crustObj.priceAdjustment;
          }
        }

        // Add-ons
        if (cust.selectedAddons && Array.isArray(cust.selectedAddons)) {
          for (const addon of cust.selectedAddons) {
            const realAddon = matkaConfig.addons.find(a => a.id === addon.id || a.name === addon.name);
            if (realAddon && realAddon.available) {
              authoritativeUnitPrice += realAddon.price;
            }
          }
        }
      }

      const itemTotal = authoritativeUnitPrice * Math.max(1, item.quantity);
      subtotal += itemTotal;

      itemBreakdown.push({
        cartItemId: item.id,
        productName: realProduct.name,
        unitPrice: authoritativeUnitPrice,
        quantity: Math.max(1, item.quantity),
        itemTotal,
      });
    }

    // Delivery fee calculation based on configured delivery zones
    let deliveryFee = 0;
    if (params.fulfilmentType === 'DELIVERY') {
      if (subtotal >= settings.freeDeliveryThreshold) {
        deliveryFee = 0; // Free delivery above threshold
      } else {
        const zones = storage.getDeliveryZones();
        const dist = typeof params.deliveryDistanceKm === 'number' ? params.deliveryDistanceKm : 1.5;
        const matched = zones.find(z => z.active && dist >= z.minDistanceKm && dist <= z.maxDistanceKm);
        if (matched) {
          deliveryFee = matched.fee;
        } else {
          deliveryFee = settings.standardDeliveryFee;
        }
      }
    }

    // Coupon discount calculation
    let discount = 0;
    let validCouponCode: string | undefined;

    if (params.couponCode) {
      const codeClean = params.couponCode.trim().toUpperCase();
      const coupons = storage.getCoupons();
      const coupon = coupons.find(c => c.code === codeClean && c.isActive);

      if (coupon) {
        const isDateValid = new Date(coupon.validUntil) >= new Date();
        const meetsMinAmount = subtotal >= coupon.minOrderAmount;

        if (isDateValid && meetsMinAmount) {
          validCouponCode = coupon.code;
          if (coupon.discountType === 'PERCENTAGE') {
            const calc = Math.round((subtotal * coupon.discountValue) / 100);
            discount = coupon.maxDiscount ? Math.min(calc, coupon.maxDiscount) : calc;
          } else {
            discount = Math.min(coupon.discountValue, subtotal);
          }
        }
      }
    }

    const totalAmount = Math.max(0, subtotal + deliveryFee - discount);

    return {
      subtotal,
      deliveryFee,
      discount,
      couponCode: validCouponCode,
      totalAmount,
      itemBreakdown,
    };
  }

  public static formatPKR(amount: number): string {
    return `Rs. ${amount.toLocaleString('en-PK')}`;
  }
}
