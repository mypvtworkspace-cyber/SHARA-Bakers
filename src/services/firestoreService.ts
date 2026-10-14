import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { testFirestoreConnection, type FirestoreDiagnosticResult } from './firestoreDiagnostics';
import { Order, Product, BusinessSettings, User, MatkaPizzaConfig, AuditLog, OrderStatus, PaymentStatus, Rider } from '../types';

export { testFirestoreConnection, type FirestoreDiagnosticResult };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Deeply removes all undefined values from an object, which Firestore rejects with:
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

export class FirestoreService {
  // --- Diagnostics & Connection Testing ---
  public static async testConnection(documentId?: string): Promise<FirestoreDiagnosticResult> {
    return testFirestoreConnection(documentId);
  }

  // --- Orders ---
  public static async saveOrder(order: Order): Promise<void> {
    const path = `orders/${order.id}`;
    try {
      const orderRef = doc(db, 'orders', order.id);
      const cleaned = sanitizeForFirestore({
        ...order,
        firestoreSyncedAt: new Date().toISOString(),
      });
      await setDoc(orderRef, cleaned, { merge: true });
    } catch (err) {
      console.error('[Firestore] Failed to persist order:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public static async getOrders(filter?: { email?: string; userId?: string; phone?: string; role?: string }): Promise<Order[]> {
    const path = 'orders';
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(150));
      const snapshot = await getDocs(q);
      let orders: Order[] = [];
      snapshot.forEach(docSnap => {
        orders.push(docSnap.data() as Order);
      });

      if (filter && filter.role && !['OWNER', 'ADMIN', 'MANAGER', 'COUNTER'].includes(filter.role)) {
        if (filter.role === 'KITCHEN_STAFF') {
          orders = orders.filter(o => ['ORDER_PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
        } else if (filter.role === 'RIDER') {
          orders = orders.filter(o => o.riderId === filter.email || o.riderId === filter.userId);
        } else if (filter.email || filter.userId || filter.phone) {
          orders = orders.filter(o => 
            (filter.email && o.customerEmail?.toLowerCase() === filter.email.toLowerCase()) ||
            (filter.userId && o.customerId === filter.userId) ||
            (filter.phone && o.customerPhone === filter.phone)
          );
        }
      }
      return orders;
    } catch (err) {
      console.error('[Firestore] Failed to fetch orders:', err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  public static subscribeOrders(
    callback: (orders: Order[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const path = 'orders';
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders: Order[] = [];
        snapshot.forEach(docSnap => {
          orders.push(docSnap.data() as Order);
        });
        callback(orders);
      },
      (error) => {
        console.error('[Firestore] Orders subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  public static async updateOrderStatus(orderId: string, status: OrderStatus | string, timelineItem?: any): Promise<void> {
    const path = `orders/${orderId}`;
    try {
      const orderRef = doc(db, 'orders', orderId);
      const updates: any = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (timelineItem) {
        updates.timeline = timelineItem;
      }
      const cleaned = sanitizeForFirestore(updates);
      await updateDoc(orderRef, cleaned);
    } catch (err) {
      console.error('[Firestore] Failed to update order status:', err);
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  public static async updateOrderPaymentStatus(orderId: string, paymentStatus: PaymentStatus | string, actor?: any): Promise<void> {
    const path = `orders/${orderId}`;
    try {
      const orderRef = doc(db, 'orders', orderId);
      const cleaned = sanitizeForFirestore({
        paymentStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: actor?.email || 'staff',
      });
      await updateDoc(orderRef, cleaned);
    } catch (err) {
      console.error('[Firestore] Failed to update order payment status:', err);
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  }

  // --- Settings ---
  public static async saveSettings(settings: BusinessSettings): Promise<void> {
    const path = 'settings/business';
    try {
      const settingsRef = doc(db, 'settings', 'business');
      const cleaned = sanitizeForFirestore({
        ...settings,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(settingsRef, cleaned, { merge: true });
    } catch (err) {
      console.error('[Firestore] Failed to persist settings:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public static async getSettings(): Promise<BusinessSettings | null> {
    const path = 'settings/business';
    try {
      const settingsRef = doc(db, 'settings', 'business');
      const snapshot = await getDoc(settingsRef);
      if (snapshot.exists()) {
        return snapshot.data() as BusinessSettings;
      }
      return null;
    } catch (err) {
      console.error('[Firestore] Failed to fetch settings:', err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  public static subscribeSettings(
    callback: (settings: BusinessSettings) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const path = 'settings/business';
    const settingsRef = doc(db, 'settings', 'business');
    return onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as BusinessSettings);
        }
      },
      (error) => {
        console.error('[Firestore] Settings subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  // --- Matka Pizza Config ---
  public static async saveMatkaConfig(config: MatkaPizzaConfig): Promise<void> {
    const path = 'settings/matkaConfig';
    try {
      const configRef = doc(db, 'settings', 'matkaConfig');
      const cleaned = sanitizeForFirestore({
        ...config,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(configRef, cleaned, { merge: true });
    } catch (err) {
      console.error('[Firestore] Failed to persist Matka config:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public static async getMatkaConfig(): Promise<MatkaPizzaConfig | null> {
    const path = 'settings/matkaConfig';
    try {
      const configRef = doc(db, 'settings', 'matkaConfig');
      const snapshot = await getDoc(configRef);
      if (snapshot.exists()) {
        return snapshot.data() as MatkaPizzaConfig;
      }
      return null;
    } catch (err) {
      console.error('[Firestore] Failed to fetch Matka config:', err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  public static subscribeMatkaConfig(
    callback: (config: MatkaPizzaConfig) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const path = 'settings/matkaConfig';
    const configRef = doc(db, 'settings', 'matkaConfig');
    return onSnapshot(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data() as MatkaPizzaConfig);
        }
      },
      (error) => {
        console.error('[Firestore] Matka config subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  // --- Products ---
  public static async saveProduct(product: Product): Promise<void> {
    const path = `products/${product.id}`;
    try {
      const prodRef = doc(db, 'products', product.id);
      const cleaned = sanitizeForFirestore(product);
      await setDoc(prodRef, cleaned, { merge: true });
    } catch (err) {
      console.error('[Firestore] Failed to persist product:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public static async saveAllProducts(products: Product[]): Promise<void> {
    try {
      for (const prod of products) {
        await FirestoreService.saveProduct(prod);
      }
    } catch (err) {
      console.error('[Firestore] Failed to batch save products:', err);
    }
  }

  public static async getProducts(): Promise<Product[]> {
    const path = 'products';
    try {
      const prodsRef = collection(db, 'products');
      const snapshot = await getDocs(prodsRef);
      const prods: Product[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Product;
        if (data.id && data.name) {
          prods.push(data);
        }
      });
      return prods;
    } catch (err) {
      console.error('[Firestore] Failed to fetch products:', err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  public static subscribeProducts(
    callback: (products: Product[]) => void,
    onError?: (err: any) => void
  ): Unsubscribe {
    const path = 'products';
    const prodsRef = collection(db, 'products');
    return onSnapshot(
      prodsRef,
      (snapshot) => {
        const prods: Product[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as Product;
          if (data.id && data.name) {
            prods.push(data);
          }
        });
        if (prods.length > 0) {
          callback(prods);
        }
      },
      (error) => {
        console.error('[Firestore] Products subscription error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }

  // --- Users ---
  public static async saveUser(user: User): Promise<void> {
    const path = `users/${user.id}`;
    try {
      const userRef = doc(db, 'users', user.id);
      const cleaned = sanitizeForFirestore({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username || user.email,
        phone: user.phone || '',
        role: user.role,
        createdAt: user.createdAt,
        mustChangePassword: user.mustChangePassword || false,
        riderAccountStatus: user.riderAccountStatus || (user.role === 'RIDER' ? 'ACTIVE' : undefined),
      });
      await setDoc(userRef, cleaned, { merge: true });
    } catch (err) {
      console.error('[Firestore] Failed to persist user:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public static async getUser(userId: string): Promise<User | null> {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data() as User;
      }
      return null;
    } catch (err) {
      console.error('[Firestore] Failed to fetch user:', err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  // --- Riders ---
  public static async saveRider(rider: Rider): Promise<void> {
    const path = `riders/${rider.id}`;
    try {
      const riderRef = doc(db, 'riders', rider.id);
      const cleaned = sanitizeForFirestore(rider);
      await setDoc(riderRef, cleaned, { merge: true });
    } catch (err) {
      console.error('[Firestore] Failed to persist rider:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }

  public static async getRiders(): Promise<Rider[]> {
    const path = 'riders';
    try {
      const ridersRef = collection(db, 'riders');
      const snapshot = await getDocs(ridersRef);
      const riders: Rider[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Rider;
        if (data.id && data.name) {
          riders.push(data);
        }
      });
      return riders;
    } catch (err) {
      console.error('[Firestore] Failed to fetch riders:', err);
      handleFirestoreError(err, OperationType.GET, path);
    }
  }

  // --- Audit Logs ---
  public static async addAuditLog(log: AuditLog): Promise<void> {
    const path = `auditLogs/${log.id}`;
    try {
      const logRef = doc(db, 'auditLogs', log.id);
      const cleaned = sanitizeForFirestore(log);
      await setDoc(logRef, cleaned, { merge: true });
    } catch (err) {
      console.error('[Firestore] Failed to add audit log:', err);
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  }
}
