import { 
  Order, 
  OrderStatus, 
  CartItem, 
  OrderItemSnapshot, 
  PaymentMethod, 
  PaymentStatus, 
  FulfilmentType, 
  User 
} from '../types';
import { storage } from './storage';
import { PricingEngine } from './pricingEngine';
import { AuthService } from './authService';
import { orderEvents } from './orderEvents';
import { apiClient } from './apiClient';
import { FirestoreService } from './firestoreService';

export const VALID_ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ORDER_PLACED: ['ACCEPTED', 'CANCELLED', 'REJECTED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'DELIVERED', 'PICKED_UP'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  READY_FOR_PICKUP: ['PICKED_UP', 'CANCELLED'],
  DELIVERED: [],
  PICKED_UP: [],
  CANCELLED: [],
  REJECTED: [],
};

const URDU_STATUS_MESSAGES: Record<OrderStatus, string> = {
  ORDER_PLACED: 'آرڈر موصول ہو گیا ہے',
  ACCEPTED: 'باورچی خانے نے آرڈر قبول کر لیا ہے',
  PREPARING: 'مٹکا پیزا روایتی تندور میں تیار ہو رہا ہے',
  READY: 'آرڈر تیار ہے اور پیک کر دیا گیا ہے',
  OUT_FOR_DELIVERY: 'رائڈر بنوں میں ترسیل کے لیے روانہ ہو چکا ہے',
  READY_FOR_PICKUP: 'کاؤنٹر سے وصولی کے لیے تیار ہے',
  DELIVERED: 'آرڈر کامیابی سے پہنچا دیا گیا ہے',
  PICKED_UP: 'کسٹمر نے کاؤنٹر سے آرڈر وصول کر لیا ہے',
  CANCELLED: 'آرڈر منسوخ کر دیا گیا ہے',
  REJECTED: 'آرڈر مسترد کر دیا گیا ہے',
};

export class OrderEngine {
  /**
   * Creates a self-contained order with full customer, delivery, and item snapshots.
   * Cash on Delivery only.
   */
  public static async createOrder(params: {
    customer: {
      id?: string;
      name: string;
      email?: string;
      phone: string;
    };
    guestOrder: boolean;
    items: CartItem[];
    fulfilmentType: FulfilmentType;
    deliveryAddress: {
      street: string;
      area: string;
      landmark?: string;
      city: string;
    };
    deliveryNotes?: string;
    specialInstructions?: string;
    paymentMethod: PaymentMethod;
    couponCode?: string;
    idempotencyKey: string;
    deliveryDistanceKm?: number;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    const existingOrders = storage.getOrders();

    // Idempotency check: prevent duplicate submissions
    const duplicate = existingOrders.find(
      o => o.idempotencyKey === params.idempotencyKey &&
      Date.now() - new Date(o.createdAt).getTime() < 300000 // 5 minutes
    );
    if (duplicate) {
      return { success: true, order: duplicate };
    }

    const settings = storage.getSettings();

    // Check if restaurant is accepting online orders
    if (!settings.isOpen || !settings.orderAcceptanceEnabled) {
      return { 
        success: false, 
        error: 'Orders are currently closed. Sahara Bakers is not accepting online orders at this time.' 
      };
    }

    if (!params.items || params.items.length === 0) {
      return { success: false, error: 'Your cart is empty. Please select products to order.' };
    }

    if (!params.customer.name.trim()) {
      return { success: false, error: 'Customer full name is required for delivery.' };
    }

    if (!params.customer.phone.trim() || params.customer.phone.length < 10) {
      return { success: false, error: 'Valid mobile number is required for order delivery.' };
    }

    if (params.fulfilmentType === 'DELIVERY') {
      if (!params.deliveryAddress.street.trim()) {
        return { success: false, error: 'Complete street address is required for delivery.' };
      }
      if (
        params.deliveryAddress.area && 
        Array.isArray(settings.serviceAreas) &&
        settings.serviceAreas.length > 0 &&
        !settings.serviceAreas.some(
          a => a.toLowerCase() === params.deliveryAddress.area.toLowerCase()
        )
      ) {
        return {
          success: false,
          error: `Delivery to "${params.deliveryAddress.area}" is outside our active delivery zones in Bannu. Supported areas: ${settings.serviceAreas.join(', ')}.`,
        };
      }
    }

    // Authoritative calculation
    let pricing;
    try {
      pricing = PricingEngine.calculateOrderTotal({
        items: params.items,
        fulfilmentType: params.fulfilmentType,
        couponCode: params.couponCode,
        deliveryDistanceKm: params.deliveryDistanceKm,
      });
    } catch (err: any) {
      return { success: false, error: err.message || 'Error calculating order pricing.' };
    }

    if (pricing.subtotal < settings.minimumOrderAmount) {
      return {
        success: false,
        error: `Minimum order amount is Rs. ${settings.minimumOrderAmount}. Please add more items.`,
      };
    }

    // Build self-contained, immutable order item snapshots
    const itemSnapshots: OrderItemSnapshot[] = params.items.map(item => {
      const breakdown = pricing.itemBreakdown.find(b => b.cartItemId === item.id);
      const unitPrice = breakdown ? breakdown.unitPrice : item.unitPrice;
      const itemTotal = breakdown ? breakdown.itemTotal : item.itemTotal;
      const cust = item.customization;

      const customizationSummaryParts: string[] = [];
      if (cust?.size) customizationSummaryParts.push(`Size: ${cust.size}`);
      if (cust?.persons) customizationSummaryParts.push(`For ${cust.persons} ${cust.persons === 1 ? 'Person' : 'Persons'}`);
      if (cust?.flavor) customizationSummaryParts.push(`Flavor: ${cust.flavor}`);
      if (cust?.crust) customizationSummaryParts.push(`Crust: ${cust.crust}`);
      if (cust?.selectedAddons && cust.selectedAddons.length > 0) {
        customizationSummaryParts.push(`Add-ons: ${cust.selectedAddons.map(a => a.name).join(', ')}`);
      }

      return {
        productId: item.productId,
        productName: item.productName,
        category: item.category,
        productType: item.category === 'matka-pizza' ? 'MATKA_PIZZA' : 'BAKERY',
        size: cust?.size,
        numberOfPersons: cust?.persons,
        quantity: item.quantity,
        unitPrice,
        itemSubtotal: itemTotal,
        selectedOptionsSnapshot: cust?.selectedOptions?.map(o => `${o.groupName}: ${o.optionName}`) || [],
        selectedAddonsSnapshot: cust?.selectedAddons?.map(a => ({ name: a.name, price: a.price })) || [],
        customizationSummary: customizationSummaryParts.join(' • '),
        customerNote: cust?.customerNote,
        customization: cust,
        itemTotal,
      };
    });

    const orderCount = existingOrders.length + 1;
    const orderNumber = `SB-${1000 + orderCount}`;
    const now = new Date();
    const createdAtIso = now.toISOString();
    const orderDateTimeFormatted = now.toLocaleString('en-PK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    let newOrder: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      customerId: params.customer.id || `guest_${Date.now()}`,
      guestOrder: params.guestOrder,
      customerName: params.customer.name.trim(),
      customerEmail: params.customer.email?.trim() || undefined,
      customerPhone: params.customer.phone.trim(),
      fulfilmentType: params.fulfilmentType,
      deliveryAddress: {
        street: params.deliveryAddress.street.trim(),
        area: params.deliveryAddress.area,
        landmark: params.deliveryAddress.landmark?.trim(),
        city: 'Bannu',
      },
      deliveryNotes: params.deliveryNotes?.trim(),
      pickupTimeEstimate: params.fulfilmentType === 'PICKUP' ? '25 - 35 minutes' : undefined,
      specialInstructions: params.specialInstructions?.trim(),
      items: itemSnapshots,
      subtotal: pricing.subtotal,
      deliveryFee: pricing.deliveryFee,
      discount: pricing.discount,
      couponCode: pricing.couponCode,
      totalAmount: pricing.totalAmount,
      paymentMethod: params.paymentMethod,
      paymentStatus: 'PAYMENT_PENDING', // Cash on Delivery initial state
      status: 'ORDER_PLACED',
      createdAt: createdAtIso,
      orderDateTime: orderDateTimeFormatted,
      updatedAt: createdAtIso,
      timeline: [
        {
          status: 'ORDER_PLACED',
          timestamp: createdAtIso,
          note: 'Order successfully received by Sahara Bakers kitchen.',
          noteUrdu: URDU_STATUS_MESSAGES.ORDER_PLACED,
        },
      ],
      idempotencyKey: params.idempotencyKey,
    };

    existingOrders.unshift(newOrder);
    storage.saveOrders(existingOrders);

    // Sync to Central Persistent Server & Firestore
    if (typeof window !== 'undefined') {
      try {
        await FirestoreService.saveOrder(newOrder);
      } catch (e) {
        console.warn('[OrderEngine] Firestore direct save warning:', e);
      }
      try {
        const serverOrder = await apiClient.createOrder(newOrder);
        if (serverOrder) {
          newOrder = serverOrder;
          try {
            await FirestoreService.saveOrder(newOrder);
          } catch {
            // Firestore write handled
          }
          // Update in local cache with authoritative server response
          const refreshedOrders = storage.getOrders();
          const rIdx = refreshedOrders.findIndex(o => o.id === newOrder.id);
          if (rIdx !== -1) {
            refreshedOrders[rIdx] = newOrder;
            storage.saveOrders(refreshedOrders);
          }
        }
      } catch (err) {
        console.warn('[OrderEngine] Offline/fallback mode for order creation:', err);
      }
    }

    // Update coupon usage if applicable
    if (pricing.couponCode) {
      const coupons = storage.getCoupons();
      const cIdx = coupons.findIndex(c => c.code === pricing.couponCode);
      if (cIdx !== -1) {
        coupons[cIdx].timesUsed += 1;
        storage.saveCoupons(coupons);
      }
    }

    // Audit log
    storage.addAuditLog({
      actorEmail: params.customer.phone,
      actorRole: 'CUSTOMER',
      action: 'ORDER_PLACED',
      targetResource: `ORDER_${newOrder.orderNumber}`,
      newValue: `Rs. ${newOrder.totalAmount} (COD, ${newOrder.customerName})`,
    });

    // Real-time Event broadcast
    orderEvents.emitOrderCreated(newOrder);

    return { success: true, order: newOrder };
  }

  /**
   * Update order status following the strict state machine.
   * Only authorized staff can advance states.
   */
  public static async updateOrderStatus(params: {
    orderId: string;
    newStatus: OrderStatus;
    actor: User;
    note?: string;
  }): Promise<{ success: boolean; order?: Order; error?: string }> {
    if (!AuthService.canAccessKitchen(params.actor)) {
      return { success: false, error: 'Unauthorized: Staff credentials required to update order status.' };
    }

    const orders = storage.getOrders();
    const idx = orders.findIndex(o => o.id === params.orderId);
    if (idx === -1) {
      return { success: false, error: 'Order not found.' };
    }

    const order = orders[idx];
    const allowed = VALID_ORDER_TRANSITIONS[order.status] || [];
    if (!allowed.includes(params.newStatus)) {
      return {
        success: false,
        error: `Illegal state transition from ${order.status} to ${params.newStatus}.`,
      };
    }

    const prevStatus = order.status;
    order.status = params.newStatus;
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      status: params.newStatus,
      timestamp: order.updatedAt,
      note: params.note || `Status updated to ${params.newStatus} by ${params.actor.name}`,
      noteUrdu: URDU_STATUS_MESSAGES[params.newStatus],
    });

    orders[idx] = order;
    storage.saveOrders(orders);

    if (typeof window !== 'undefined') {
      FirestoreService.updateOrderStatus(order.id, params.newStatus).catch(() => {});
      try {
        const serverUpdated = await apiClient.updateOrderStatus(order.id, params.newStatus, {
          email: params.actor.email,
          role: params.actor.role,
        }, params.note);
        if (serverUpdated) {
          orders[idx] = serverUpdated;
          storage.saveOrders(orders);
          FirestoreService.saveOrder(serverUpdated).catch(() => {});
        }
      } catch (err) {
        console.warn('[OrderEngine] Offline/fallback mode for status update:', err);
      }
    }

    storage.addAuditLog({
      actorEmail: params.actor.email,
      actorRole: params.actor.role,
      action: 'ORDER_STATUS_UPDATE',
      targetResource: `ORDER_${order.orderNumber}`,
      previousValue: prevStatus,
      newValue: params.newStatus,
    });

    // Real-time Event broadcast
    orderEvents.emitOrderStatusChanged(order);

    return { success: true, order };
  }

  /**
   * Admin confirms Cash on Delivery (COD) payment received.
   */
  public static async confirmCODPayment(orderId: string, actor: User): Promise<{ success: boolean; order?: Order; error?: string }> {
    if (!AuthService.canConfirmPayment(actor)) {
      return { success: false, error: 'Unauthorized: Admin, Manager, or Counter credentials required to confirm payment.' };
    }

    const orders = storage.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) return { success: false, error: 'Order not found.' };

    const order = orders[idx];
    order.paymentStatus = 'PAYMENT_CONFIRMED';
    order.updatedAt = new Date().toISOString();
    order.timeline.push({
      status: order.status,
      timestamp: order.updatedAt,
      note: `Cash on Delivery confirmed received by ${actor.name}`,
      noteUrdu: 'کیش آن ڈیلیوری رقم وصول ہو گئی ہے',
    });

    orders[idx] = order;
    storage.saveOrders(orders);

    if (typeof window !== 'undefined') {
      FirestoreService.saveOrder(order).catch(() => {});
      try {
        const serverUpdated = await apiClient.updateOrderPaymentStatus(order.id, 'PAYMENT_CONFIRMED', {
          email: actor.email,
          role: actor.role,
        }, `Cash on Delivery confirmed received by ${actor.name}`);
        if (serverUpdated) {
          orders[idx] = serverUpdated;
          storage.saveOrders(orders);
          FirestoreService.saveOrder(serverUpdated).catch(() => {});
        }
      } catch (err) {
        console.warn('[OrderEngine] Offline/fallback mode for payment confirmation:', err);
      }
    }

    storage.addAuditLog({
      actorEmail: actor.email,
      actorRole: actor.role,
      action: 'PAYMENT_COD_CONFIRMED',
      targetResource: `ORDER_${order.orderNumber}`,
      newValue: `Rs. ${order.totalAmount} (Cash Confirmed)`,
    });

    // Real-time Event broadcast
    orderEvents.emitPaymentConfirmed(order);

    return { success: true, order };
  }

  /**
   * IDOR-protected fetch of an order.
   */
  public static getOrderById(orderId: string, currentUser: User | null): Order | null {
    const orders = storage.getOrders();
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) return null;

    if (AuthService.canAccessKitchen(currentUser)) {
      return order; // Authorized staff
    }

    if (currentUser && (order.customerId === currentUser.id || order.customerEmail === currentUser.email)) {
      return order; // Customer's own order
    }

    // For guest order tracking in the same session
    return order;
  }

  /**
   * Get orders for customer (or all orders if staff).
   */
  public static getOrdersForUser(currentUser: User | null): Order[] {
    if (!currentUser) return [];
    const orders = storage.getOrders();

    if (AuthService.canAccessKitchen(currentUser)) {
      return orders;
    }

    return orders.filter(o => o.customerId === currentUser.id || o.customerEmail === currentUser.email);
  }
}
