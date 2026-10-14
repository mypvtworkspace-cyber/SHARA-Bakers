/**
 * Sahara Bakers – Centralized API Client & Cross-Device Synchronizer
 * 
 * Connects directly to the central server database over HTTP & SSE (Server-Sent Events)
 * to ensure all devices share ONE single authoritative business state.
 */

import { 
  Product, 
  MatkaPizzaConfig, 
  BusinessSettings, 
  Order, 
  User, 
  UserRole, 
  OrderStatus,
  Rider,
  RiderStatus,
  DeliveryZone,
  ThermalPrinterConfig 
} from '../types';

export class ApiClient {
  private static instance: ApiClient;
  private sse: EventSource | null = null;
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();
  private pollInterval: any = null;
  private lastVersion = 0;

  private constructor() {
    this.initSync();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private initSync() {
    if (typeof window === 'undefined') return;

    // Connect to Server-Sent Events for instant zero-latency cross-device broadcast
    try {
      this.sse = new EventSource('/api/events');
      this.sse.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          this.emit(parsed.type, parsed.payload);
        } catch (err) {
          console.warn('[ApiClient] SSE parse warning:', err);
        }
      };

      this.sse.onerror = () => {
        // SSE disconnected or not supported in some iframe contexts, start lightweight polling fallback
        this.startPollingFallback();
      };
    } catch {
      this.startPollingFallback();
    }
  }

  private startPollingFallback() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const data = await res.json();
          if (this.lastVersion && data.version > this.lastVersion) {
            this.emit('DATA_OUTDATED', data);
          }
          this.lastVersion = data.version;
        }
      } catch {
        // Offline or server temporarily restarting
      }
    }, 4000);
  }

  public on(eventType: string, callback: (payload: any) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private emit(eventType: string, payload: any) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error('[ApiClient] Error in event listener:', err);
        }
      });
    }
    // Also notify global wildcard listeners
    const globalCallbacks = this.listeners.get('*');
    if (globalCallbacks) {
      globalCallbacks.forEach(cb => cb({ type: eventType, payload }));
    }
  }

  // --- API Calls ---

  public async getBootstrap(): Promise<{
    version: number;
    updatedAt: string;
    products: Product[];
    matkaConfig: MatkaPizzaConfig;
    settings: BusinessSettings;
    coupons: any[];
  }> {
    const res = await fetch('/api/bootstrap');
    if (!res.ok) throw new Error('Failed to bootstrap from server');
    const data = await res.json();
    this.lastVersion = data.version;
    return data;
  }

  public async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  }

  public async updateProductPrice(id: string, price: number, actor?: { email: string; role: UserRole }): Promise<Product> {
    const res = await fetch(`/api/products/${id}/price`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price, actor }),
    });
    if (!res.ok) throw new Error('Failed to update product price on server');
    const data = await res.json();
    return data.product;
  }

  public async updateProductAvailability(id: string, available: boolean, actor?: { email: string; role: UserRole }): Promise<Product> {
    const res = await fetch(`/api/products/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available, actor }),
    });
    if (!res.ok) throw new Error('Failed to update availability on server');
    const data = await res.json();
    return data.product;
  }

  public async createProduct(product: Product, actor?: { email: string; role: UserRole }): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, actor }),
    });
    if (!res.ok) throw new Error('Failed to create product on server');
    const data = await res.json();
    return data.product;
  }

  public async updateProduct(id: string, product: Product, actor?: { email: string; role: UserRole }): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, actor }),
    });
    if (!res.ok) throw new Error('Failed to update product on server');
    const data = await res.json();
    return data.product;
  }

  public async deleteProduct(id: string, actor?: { email: string; role: UserRole }): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor }),
    });
    if (!res.ok) throw new Error('Failed to delete product on server');
    return true;
  }

  public async updateMatkaConfig(config: MatkaPizzaConfig, actor?: { email: string; role: UserRole }): Promise<MatkaPizzaConfig> {
    const res = await fetch('/api/matka-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, actor }),
    });
    if (!res.ok) throw new Error('Failed to update Matka Pizza config on server');
    const data = await res.json();
    return data.config;
  }

  public async updateSettings(settings: BusinessSettings, actor?: { email: string; role: UserRole }): Promise<BusinessSettings> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings, actor }),
    });
    if (!res.ok) throw new Error('Failed to update settings on server');
    const data = await res.json();
    return data.settings;
  }

  public async getOrders(role?: UserRole, email?: string, userId?: string, phone?: string): Promise<Order[]> {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (email) params.set('email', email);
    if (userId) params.set('userId', userId);
    if (phone) params.set('phone', phone);
    const res = await fetch(`/api/orders?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch orders from server');
    return res.json();
  }

  public async createOrder(order: Order, actor?: { email: string; role: UserRole }): Promise<Order> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order, actor }),
    });
    if (!res.ok) throw new Error('Failed to create order on server');
    const data = await res.json();
    return data.order;
  }

  public async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    actor: { email: string; role: UserRole },
    note?: string
  ): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actor, note }),
    });
    if (!res.ok) throw new Error('Failed to update order status on server');
    const data = await res.json();
    return data.order;
  }

  public async updateOrderPaymentStatus(
    orderId: string, 
    paymentStatus: 'PAYMENT_CONFIRMED' | 'PAYMENT_PENDING' | 'REFUNDED', 
    actor: { email: string; role: UserRole },
    note?: string
  ): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus, actor, note }),
    });
    if (!res.ok) throw new Error('Failed to update order payment status on server');
    const data = await res.json();
    return data.order;
  }

  public async assignRider(
    orderId: string, 
    riderId: string, 
    riderName: string, 
    actor: { email: string; role: UserRole }
  ): Promise<Order> {
    const res = await fetch(`/api/orders/${orderId}/assign-rider`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ riderId, riderName, actor }),
    });
    if (!res.ok) throw new Error('Failed to assign rider on server');
    const data = await res.json();
    return data.order;
  }

  public async getHistory(params: {
    role: UserRole;
    email?: string;
    search?: string;
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = new URLSearchParams();
    query.set('role', params.role);
    if (params.email) query.set('email', params.email);
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    if (params.date) query.set('date', params.date);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const res = await fetch(`/api/history?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch history');
    return res.json();
  }

  public async getAuditLogs(role: UserRole): Promise<any[]> {
    const res = await fetch(`/api/audit-logs?role=${role}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  }

  public async login(identifier: string, pass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password: pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }
    return { success: true, user: data.user };
  }

  public async signup(params: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; user?: User; error?: string }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Signup failed' };
    }
    return { success: true, user: data.user };
  }

  public async getStaffUsers(role: UserRole): Promise<User[]> {
    const res = await fetch(`/api/users?role=${role}`);
    if (!res.ok) throw new Error('Failed to fetch staff members');
    return res.json();
  }

  // --- Rider Management ---
  public async getRiders(): Promise<Rider[]> {
    const res = await fetch('/api/riders');
    if (!res.ok) throw new Error('Failed to fetch riders');
    return res.json();
  }

  public async createRider(rider: Rider, actor?: { email: string; role: UserRole }): Promise<Rider> {
    const res = await fetch('/api/riders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rider, actor }),
    });
    if (!res.ok) throw new Error('Failed to create rider');
    const data = await res.json();
    return data.rider;
  }

  public async updateRider(id: string, updates: Partial<Rider>, actor?: { email: string; role: UserRole }): Promise<Rider> {
    const res = await fetch(`/api/riders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, actor }),
    });
    if (!res.ok) throw new Error('Failed to update rider');
    const data = await res.json();
    return data.rider;
  }

  public async updateRiderStatus(id: string, status: RiderStatus, actor?: { email: string; role: UserRole }): Promise<Rider> {
    const res = await fetch(`/api/riders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, actor }),
    });
    if (!res.ok) throw new Error('Failed to update rider status');
    const data = await res.json();
    return data.rider;
  }

  // --- Delivery Zones ---
  public async getDeliveryZones(): Promise<DeliveryZone[]> {
    const res = await fetch('/api/delivery-zones');
    if (!res.ok) throw new Error('Failed to fetch delivery zones');
    return res.json();
  }

  public async updateDeliveryZones(zones: DeliveryZone[], actor?: { email: string; role: UserRole }): Promise<DeliveryZone[]> {
    const res = await fetch('/api/delivery-zones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zones, actor }),
    });
    if (!res.ok) throw new Error('Failed to update delivery zones');
    const data = await res.json();
    return data.zones;
  }

  public async calculateDelivery(distanceKm: number, subtotal: number): Promise<{
    distanceKm: number;
    fee: number;
    isFreeDelivery?: boolean;
    zoneName?: string;
    estimatedMinutes?: string;
    available: boolean;
    outsideRange?: boolean;
    message?: string;
  }> {
    const res = await fetch('/api/delivery/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distanceKm, subtotal }),
    });
    if (!res.ok) throw new Error('Failed to calculate delivery fee');
    return res.json();
  }

  // --- Thermal Printer Config & Receipt Reprint ---
  public async getPrinterConfig(): Promise<ThermalPrinterConfig> {
    const res = await fetch('/api/printer-config');
    if (!res.ok) throw new Error('Failed to fetch printer config');
    return res.json();
  }

  public async updatePrinterConfig(config: ThermalPrinterConfig, actor?: { email: string; role: UserRole }): Promise<ThermalPrinterConfig> {
    const res = await fetch('/api/printer-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, actor }),
    });
    if (!res.ok) throw new Error('Failed to update printer config');
    const data = await res.json();
    return data.config;
  }

  public async reprintReceipt(orderId: string, receiptId: string, actor: { email: string; role: UserRole }): Promise<{ success: boolean; order: Order; auditLog: any }> {
    const res = await fetch(`/api/orders/${orderId}/reprint-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptId, actor }),
    });
    if (!res.ok) throw new Error('Failed to record receipt reprint on server');
    return res.json();
  }
}

export const apiClient = ApiClient.getInstance();
