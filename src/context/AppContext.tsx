import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  User, 
  Product, 
  MatkaPizzaConfig, 
  BusinessSettings, 
  CartItem, 
  Order, 
  FulfilmentType,
  Rider,
  DeliveryZone,
  ThermalPrinterConfig
} from '../types';
import { storage } from '../services/storage';
import { authService, AuthService } from '../services/authService';
import { PricingEngine, AuthoritativePriceSummary } from '../services/pricingEngine';
import { orderEvents } from '../services/orderEvents';
import { audioAlert } from '../services/audioAlert';
import { apiClient } from '../services/apiClient';
import { FirestoreService } from '../services/firestoreService';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  login: (id: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (params: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Data
  products: Product[];
  matkaConfig: MatkaPizzaConfig;
  settings: BusinessSettings;
  orders: Order[];
  riders: Rider[];
  deliveryZones: DeliveryZone[];
  printerConfig: ThermalPrinterConfig;
  selectedDistanceKm: number;
  setSelectedDistanceKm: (km: number) => void;
  refreshData: () => void;
  isLoading: boolean;
  initError: string | null;

  // Real-time Alerts
  newOrdersCount: number;
  latestNewOrder: Order | null;
  clearNewOrderAlert: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'itemTotal'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: string;
  setAppliedCoupon: (code: string) => void;
  fulfilmentType: FulfilmentType;
  setFulfilmentType: (type: FulfilmentType) => void;
  priceSummary: AuthoritativePriceSummary;

  // Modals & Navigation
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'signup';
  setAuthModalMode: (mode: 'login' | 'signup') => void;

  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isMatkaModalOpen: boolean;
  setIsMatkaModalOpen: (open: boolean) => void;
  activeOrderForTracking: Order | null;
  setActiveOrderForTracking: (order: Order | null) => void;
  confirmedOrderForReceipt: Order | null;
  setConfirmedOrderForReceipt: (order: Order | null) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;

  // View routing
  currentView: 'store' | 'kitchen' | 'admin' | 'manager' | 'waiter' | 'rider' | 'counter';
  setCurrentView: (view: 'store' | 'kitchen' | 'admin' | 'manager' | 'waiter' | 'rider' | 'counter') => void;
}

const AppContext = createContext<AppContextType | null>(null);

const CART_STORAGE_KEY = 'sb_cart_items_v1';

const getInitialView = (): 'store' | 'kitchen' | 'admin' | 'manager' | 'waiter' | 'rider' | 'counter' => {
  if (typeof window === 'undefined') return 'store';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const viewParam = search.get('view')?.toLowerCase();

  if (path.includes('/counter') || hash === '#counter' || viewParam === 'counter') {
    return 'counter';
  }
  if (path.includes('/kitchen') || hash === '#kitchen' || viewParam === 'kitchen') {
    return 'kitchen';
  }
  if (path.includes('/admin') || hash === '#admin' || viewParam === 'admin') {
    return 'admin';
  }
  if (path.includes('/manager') || hash === '#manager' || viewParam === 'manager') {
    return 'manager';
  }
  if (path.includes('/waiter') || hash === '#waiter' || viewParam === 'waiter') {
    return 'waiter';
  }
  if (path.includes('/rider') || hash === '#rider' || viewParam === 'rider') {
    return 'rider';
  }
  return 'store';
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return storage.getCurrentUser();
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [matkaConfig, setMatkaConfig] = useState<MatkaPizzaConfig>(storage.getMatkaConfig());
  const [settings, setSettings] = useState<BusinessSettings>(storage.getSettings());
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<Rider[]>(storage.getRiders());
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(storage.getDeliveryZones());
  const [printerConfig, setPrinterConfig] = useState<ThermalPrinterConfig>(storage.getPrinterConfig());
  const [selectedDistanceKm, setSelectedDistanceKm] = useState<number>(1.5);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Real-time alerts
  const [newOrdersCount, setNewOrdersCount] = useState<number>(0);
  const [latestNewOrder, setLatestNewOrder] = useState<Order | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<string>('');
  const [fulfilmentType, setFulfilmentType] = useState<FulfilmentType>('DELIVERY');

  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMatkaModalOpen, setIsMatkaModalOpen] = useState(false);
  const [activeOrderForTracking, setActiveOrderForTracking] = useState<Order | null>(null);
  const [confirmedOrderForReceipt, setConfirmedOrderForReceipt] = useState<Order | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // App view with URL routing
  const [currentView, setCurrentViewState] = useState<'store' | 'kitchen' | 'admin' | 'manager' | 'waiter' | 'rider' | 'counter'>(getInitialView);

  const setCurrentView = (view: 'store' | 'kitchen' | 'admin' | 'manager' | 'waiter' | 'rider' | 'counter') => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      const newHash = view === 'store' ? '' : `#${view}`;
      window.history.pushState(null, '', newHash || window.location.pathname);
    }
  };

  const clearNewOrderAlert = () => {
    setNewOrdersCount(0);
    setLatestNewOrder(null);
  };

  const refreshData = async (userParam?: User | null) => {
    const activeUser = userParam !== undefined ? userParam : (currentUser || storage.getCurrentUser());
    try {
      if (typeof window !== 'undefined') {
        const bootstrap = await apiClient.getBootstrap() as any;
        if (bootstrap && bootstrap.products) {
          setProducts(bootstrap.products);
          setMatkaConfig(bootstrap.matkaConfig);
          setSettings(bootstrap.settings);
          if (bootstrap.riders) setRiders(bootstrap.riders);
          if (bootstrap.deliveryZones) setDeliveryZones(bootstrap.deliveryZones);
          if (bootstrap.printerConfig) setPrinterConfig(bootstrap.printerConfig);
        } else {
          // Fallback to Firestore if bootstrap incomplete
          const [fsProducts, fsSettings, fsMatka] = await Promise.all([
            FirestoreService.getProducts(),
            FirestoreService.getSettings(),
            FirestoreService.getMatkaConfig(),
          ]);
          if (fsProducts.length > 0) setProducts(fsProducts);
          if (fsSettings) setSettings(fsSettings);
          if (fsMatka) setMatkaConfig(fsMatka);
        }

        const serverOrders = await apiClient.getOrders(
          activeUser?.role, 
          activeUser?.email,
          activeUser?.id,
          activeUser?.phone
        );
        if (serverOrders && serverOrders.length > 0) {
          setOrders(serverOrders);
          storage.saveOrders(serverOrders);
        } else if (activeUser) {
          // If server returned empty, check Firestore
          const fsOrders = await FirestoreService.getOrders({
            email: activeUser.email,
            userId: activeUser.id,
            phone: activeUser.phone,
            role: activeUser.role,
          });
          if (fsOrders.length > 0) {
            setOrders(fsOrders);
            storage.saveOrders(fsOrders);
          } else {
            setOrders([]);
          }
        } else {
          setOrders([]);
        }
      }
    } catch {
      // Offline fallback: Check Firestore directly
      try {
        const [fsProducts, fsSettings, fsOrders] = await Promise.all([
          FirestoreService.getProducts(),
          FirestoreService.getSettings(),
          FirestoreService.getOrders(activeUser ? {
            email: activeUser.email,
            userId: activeUser.id,
            phone: activeUser.phone,
            role: activeUser.role,
          } : undefined),
        ]);
        if (fsProducts.length > 0) setProducts(fsProducts);
        else setProducts(storage.getProducts());

        if (fsSettings) setSettings(fsSettings);
        else setSettings(storage.getSettings());

        if (fsOrders.length > 0) {
          setOrders(fsOrders);
          storage.saveOrders(fsOrders);
        } else {
          setOrders(storage.getOrders());
        }
      } catch {
        setProducts(storage.getProducts());
        setMatkaConfig(storage.getMatkaConfig());
        setSettings(storage.getSettings());
        setOrders(storage.getOrders());
      }
      setRiders(storage.getRiders());
      setDeliveryZones(storage.getDeliveryZones());
      setPrinterConfig(storage.getPrinterConfig());
    }
    
    if (userParam !== undefined) {
      setCurrentUser(userParam);
    } else {
      const stored = storage.getCurrentUser();
      if (stored && (!currentUser || currentUser.id !== stored.id)) {
        setCurrentUser(stored);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await storage.initialize();
        const initialUser = storage.getCurrentUser();
        if (initialUser) {
          setCurrentUser(initialUser);
        }
        await refreshData(initialUser);
      } catch (err: any) {
        console.error('Failed to initialize Sahara Bakers platform:', err);
        setInitError(err.message || 'Error initializing bakery data');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Listen to browser hash/popstate
  useEffect(() => {
    const handleUrlChange = () => {
      const view = getInitialView();
      setCurrentViewState(view);
    };
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Subscribe to real-time events from Firestore, central server, and cross-tab storage sync
  useEffect(() => {
    // 1. Direct real-time Firestore synchronization
    const unsubOrders = FirestoreService.subscribeOrders((liveOrders) => {
      const activeUser = currentUser || storage.getCurrentUser();
      let filtered = liveOrders;
      if (activeUser && activeUser.role && !['OWNER', 'ADMIN', 'MANAGER', 'COUNTER'].includes(activeUser.role)) {
        if (activeUser.role === 'KITCHEN_STAFF') {
          filtered = liveOrders.filter(o => ['ORDER_PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
        } else if (activeUser.role === 'RIDER') {
          filtered = liveOrders.filter(o => o.riderId === activeUser.email || o.riderId === activeUser.id);
        } else if (activeUser.role === 'WAITER' || activeUser.role === 'ORDER_STAFF') {
          filtered = liveOrders.filter(o => o.waiterId === activeUser.email || o.waiterId === activeUser.id || new Date(o.createdAt).toDateString() === new Date().toDateString());
        } else if (activeUser.email || activeUser.id || activeUser.phone) {
          filtered = liveOrders.filter(o => 
            (activeUser.email && o.customerEmail?.toLowerCase() === activeUser.email.toLowerCase()) ||
            (activeUser.id && o.customerId === activeUser.id) ||
            (activeUser.phone && o.customerPhone === activeUser.phone)
          );
        }
      } else if (!activeUser) {
        // Guest customer: show their placed orders matching local storage
        const localOrders = storage.getOrders();
        const localIds = new Set(localOrders.map(o => o.id));
        if (localIds.size > 0) {
          filtered = liveOrders.filter(o => localIds.has(o.id));
        }
      }
      setOrders(filtered);
      storage.saveOrders(filtered);
    }, (err) => {
      console.warn('[AppContext] Firestore orders subscription fallback:', err);
    });

    const unsubSettings = FirestoreService.subscribeSettings((liveSettings) => {
      if (liveSettings && liveSettings.businessName) {
        setSettings(liveSettings);
      }
    }, () => {});

    const unsubMatka = FirestoreService.subscribeMatkaConfig((liveMatka) => {
      if (liveMatka && liveMatka.sizes) {
        setMatkaConfig(liveMatka);
      }
    }, () => {});

    const unsubProducts = FirestoreService.subscribeProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    }, () => {});

    // 2. Server-Sent Events from central backend
    const unsubscribeApi = apiClient.on('*', (event) => {
      refreshData();
      if (event?.type === 'NEW_ORDER') {
        setNewOrdersCount(prev => prev + 1);
        setLatestNewOrder(event.payload);
        audioAlert.playNewOrderChime();
      }
    });

    const unsubscribeLegacy = orderEvents.subscribe((payload) => {
      refreshData();
      if (payload.type === 'ORDER_CREATED') {
        setNewOrdersCount(prev => prev + 1);
        setLatestNewOrder(payload.order);
        audioAlert.playNewOrderChime();
      }
    });

    const handleStorage = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('sb_')) {
        refreshData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubOrders();
      unsubSettings();
      unsubMatka();
      unsubProducts();
      unsubscribeApi();
      unsubscribeLegacy();
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentUser]);

  // Save cart changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  // Auth actions
  const login = async (id: string, pass: string) => {
    const res = await authService.login(id, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthModalOpen(false);
      // Auto-route to the authorized staff portal
      if (res.user.role === 'KITCHEN_STAFF') {
        setCurrentView('kitchen');
      } else if (res.user.role === 'WAITER' || res.user.role === 'ORDER_STAFF') {
        setCurrentView('waiter');
      } else if (res.user.role === 'RIDER') {
        setCurrentView('rider');
      } else if (res.user.role === 'MANAGER') {
        setCurrentView('manager');
      } else if (res.user.role === 'COUNTER') {
        setCurrentView('counter');
      } else if (['OWNER', 'ADMIN'].includes(res.user.role)) {
        setCurrentView('admin');
      }
      await refreshData(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const signup = async (params: { name: string; email: string; phone: string; password: string }) => {
    const res = await authService.signup(params);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      setIsAuthModalOpen(false);
      await refreshData(res.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const logout = async () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentView('store');
    await refreshData(null);
  };

  // Cart operations
  const addToCart = (item: Omit<CartItem, 'id' | 'itemTotal'>) => {
    const id = `ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const itemTotal = item.unitPrice * item.quantity;
    const newItem: CartItem = { ...item, id, itemTotal };
    setCart(prev => [...prev, newItem]);
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => 
      prev.map(i => {
        if (i.id === itemId) {
          const itemTotal = (i.itemTotal / i.quantity) * quantity;
          return { ...i, quantity, itemTotal };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon('');
  };

  // Authoritative price calculation
  const priceSummary = useMemo(() => {
    try {
      return PricingEngine.calculateOrderTotal({
        items: cart,
        fulfilmentType,
        couponCode: appliedCoupon,
        deliveryDistanceKm: selectedDistanceKm,
      });
    } catch {
      return {
        subtotal: 0,
        deliveryFee: 0,
        discount: 0,
        totalAmount: 0,
        itemBreakdown: [],
      };
    }
  }, [cart, fulfilmentType, appliedCoupon, selectedDistanceKm, products, matkaConfig, settings, deliveryZones]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        login,
        signup,
        logout,
        products,
        matkaConfig,
        settings,
        orders,
        riders,
        deliveryZones,
        printerConfig,
        selectedDistanceKm,
        setSelectedDistanceKm,
        refreshData,
        isLoading,
        initError,
        newOrdersCount,
        latestNewOrder,
        clearNewOrderAlert,
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        setAppliedCoupon,
        fulfilmentType,
        setFulfilmentType,
        priceSummary,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isMatkaModalOpen,
        setIsMatkaModalOpen,
        activeOrderForTracking,
        setActiveOrderForTracking,
        confirmedOrderForReceipt,
        setConfirmedOrderForReceipt,
        isProfileModalOpen,
        setIsProfileModalOpen,
        currentView,
        setCurrentView,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
