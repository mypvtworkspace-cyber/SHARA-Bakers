import { 
  User, 
  Product, 
  Order, 
  MatkaPizzaConfig, 
  BusinessSettings, 
  Coupon, 
  AuditLog,
  Rider,
  DeliveryZone,
  ThermalPrinterConfig
} from '../types';
import { hashPassword, generateSalt } from './crypto';
import { apiClient } from './apiClient';
import { ALL_MENU_PRODUCTS } from '../data/defaultProducts';

const STORAGE_KEYS = {
  USERS: 'sb_users_v2',
  CURRENT_USER: 'sb_current_user_v2',
  PRODUCTS: 'sb_products_v2',
  MATKA_CONFIG: 'sb_matka_config_v2',
  ORDERS: 'sb_orders_v2',
  SETTINGS: 'sb_settings_v2',
  COUPONS: 'sb_coupons_v2',
  AUDIT_LOGS: 'sb_audit_logs_v2',
  CART: 'sb_cart_v2',
  RIDERS: 'sb_riders_v2',
  DELIVERY_ZONES: 'sb_delivery_zones_v2',
  PRINTER_CONFIG: 'sb_printer_config_v2',
};

const DEFAULT_RIDERS: Rider[] = [
  {
    id: 'rider_zubair',
    name: 'Zubair',
    username: 'zubair@rider',
    phone: '+92 330 5868492',
    areaNote: 'Cantt & City Deliveries',
    status: 'AVAILABLE',
    active: true,
    accountStatus: 'ACTIVE',
    totalDeliveries: 28,
    completedDeliveries: 28,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rider_shah_nawaz',
    name: 'Shah Nawaz',
    username: 'shahnawaz@rider',
    phone: '+923350507308',
    altPhone: '+923490068374',
    areaNote: 'Rashid / Bannu Cantt & City (رائش)',
    status: 'AVAILABLE',
    active: true,
    accountStatus: 'ACTIVE',
    totalDeliveries: 12,
    completedDeliveries: 12,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rider_haroon',
    name: 'Haroon Niazi',
    username: 'haroon@rider',
    phone: '+923322533155',
    areaNote: 'Railway Road & City Center',
    status: 'AVAILABLE',
    active: true,
    accountStatus: 'PENDING_VERIFICATION',
    totalDeliveries: 9,
    completedDeliveries: 9,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rider_rohin_riyaz',
    name: 'Rohin Riyaz',
    username: 'rohin@rider',
    phone: '+923348944901',
    altPhone: '+923369396994',
    areaNote: 'Markaz Delivery / Main Branch (مرکز ڈلیوری)',
    status: 'AVAILABLE',
    active: true,
    accountStatus: 'PENDING_VERIFICATION',
    totalDeliveries: 15,
    completedDeliveries: 15,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: 'zone-1',
    name: 'Zone 1: Railway Road & City Center',
    minDistanceKm: 0,
    maxDistanceKm: 2,
    fee: 80,
    estimatedMinutes: '15-25 mins',
    active: true,
    description: 'Immediate vicinity around Sahara Bakers and City Market',
  },
  {
    id: 'zone-2',
    name: 'Zone 2: Cantonment & Sugar Mill Colony',
    minDistanceKm: 2,
    maxDistanceKm: 5,
    fee: 140,
    estimatedMinutes: '25-35 mins',
    active: true,
    description: 'Bannu Cantt, Station area, and Sugar Mill Colony',
  },
  {
    id: 'zone-3',
    name: 'Zone 3: Miran Shah Road & Mandeyan',
    minDistanceKm: 5,
    maxDistanceKm: 8,
    fee: 200,
    estimatedMinutes: '35-45 mins',
    active: true,
    description: 'Outer ring, Mandeyan, and Miran Shah Road',
  },
  {
    id: 'zone-4',
    name: 'Zone 4: Bannu University & Suburbs',
    minDistanceKm: 8,
    maxDistanceKm: 12,
    fee: 280,
    estimatedMinutes: '45-60 mins',
    active: true,
    description: 'University of Science and Technology Bannu & Outskirts',
  },
];

const DEFAULT_PRINTER_CONFIG: ThermalPrinterConfig = {
  paperWidth: '58mm',
  headerNote: 'The Famous Clay-Pot Matka Pizza & Artisanal Bakery',
  footerNote: 'Thank you for visiting Sahara Bakers! Fresh daily since inception.',
  autoCut: true,
};

const DEFAULT_SETTINGS: BusinessSettings = {
  businessName: 'Sahara Bakers',
  tagline: 'Home of Signature Clay-Pot Matka Pizza & Artisanal Bakery',
  address: 'Railway Road, near Syed Software House',
  city: 'Bannu',
  postalCode: '28100',
  phone: '+92 330 5868488',
  whatsappPhone: '+92 330 5868488',
  email: 'info@saharabakers.pk',
  openingTime: '08:00',
  closingTime: '23:30',
  isOpen: true,
  orderAcceptanceEnabled: true,
  standardDeliveryFee: 150,
  freeDeliveryThreshold: 2000,
  minimumOrderAmount: 300,
  announcement: 'Fresh Clay-Pot Matka Pizza baked to order! Return your clay pot for Rs. 50 credit.',
  supportedPaymentMethods: ['CASH', 'EASYPAISA', 'CASH_ON_DELIVERY', 'CASH_ON_PICKUP'],
  serviceAreas: [
    'Railway Road',
    'City Center',
    'Cantonment Bannu',
    'Miran Shah Road',
    'Kohat Road',
    'Sugar Mill Colony',
    'Mandeyan',
    'Bannu University Campus',
    'Ghauri Gate',
  ],
  creatorName: 'Mr Zaheer',
  creatorCredit: 'Designed & Developed by Mr Zaheer',
  showCreatorCredit: true,
  logoUrl: '/assets/images/sahara_logo.jpg',
  easypaisaQrUrl: '/assets/images/sahara_easypaisa_qr.png',
  easypaisaAccountTitle: 'Rahman Ullah Khan',
  easypaisaAccountNumber: '0333-8072589',
  projectMetadata: {
    businessName: 'Sahara Bakers',
    creatorName: 'Mr Zaheer',
    creatorCredit: 'Designed & Developed by Mr Zaheer',
    updatedAt: '2026-10-06T00:00:00.000Z',
  },
};

const DEFAULT_MATKA_CONFIG: MatkaPizzaConfig = {
  servingConfig: {
    minPersons: 1,
    maxPersons: 7,
    step: 1,
    allowedValues: [1, 2, 3, 4, 5, 6, 7],
    labelTemplate: '{count} Persons',
    enabled: true,
    pricePerPersonAdjustment: 0,
  },
  sizes: [
    {
      id: 'size-small',
      name: 'Small',
      servesText: 'Best for 1-2 Persons',
      basePrice: 350,
      defaultPersons: 1,
      recommendedPersons: [1, 2],
    },
    {
      id: 'size-medium',
      name: 'Medium',
      servesText: 'Best for 2-4 Persons',
      basePrice: 650,
      defaultPersons: 3,
      recommendedPersons: [2, 3, 4],
    },
    {
      id: 'size-large',
      name: 'Large',
      servesText: 'Best for 4-7 Persons',
      basePrice: 1150,
      defaultPersons: 5,
      recommendedPersons: [4, 5, 6, 7],
    },
  ],
  flavors: [
    {
      id: 'flav-tikka',
      name: 'Signature Chicken Tikka',
      description: 'Charcoal-spiced chicken breast, crisp capsicum, and golden baked mozzarella.',
      priceAdjustment: 0,
      isSpicy: false,
      available: true,
    },
    {
      id: 'flav-malai',
      name: 'Special Malai Boti',
      description: 'Velvety cream-marinated chicken bites, fresh herbs, and stringy mozzarella.',
      priceAdjustment: 50,
      isSpicy: false,
      available: true,
    },
    {
      id: 'flav-mughlai',
      name: 'Mughlai Supreme',
      description: 'Smoky spiced chicken, mushrooms, black olives, onions, and double cheese blanket.',
      priceAdjustment: 80,
      isSpicy: false,
      available: true,
    },
    {
      id: 'flav-cheese',
      name: 'Four Cheese Clay Pot',
      description: 'Pure mozzarella, golden cheddar, creamy gouda, and cottage cheese melt.',
      priceAdjustment: 100,
      isSpicy: false,
      available: true,
    },
    {
      id: 'flav-fajita',
      name: 'Hot & Spicy Fajita',
      description: 'Zesty Mexican-spiced chicken, jalapeños, sweet corn, and red paprika.',
      priceAdjustment: 40,
      isSpicy: true,
      available: true,
    },
  ],
  crustOptions: [
    {
      id: 'crust-pot-traditional',
      name: 'Traditional Clay Pot Baking',
      description: 'Dough layered and slow-baked directly inside the earthenware pot.',
      priceAdjustment: 0,
      available: true,
    },
    {
      id: 'crust-stuffed-rim',
      name: 'Stuffed Cheese Rim in Pot',
      description: 'Pot rim folded with savory string cheese for decadent bites.',
      priceAdjustment: 90,
      available: true,
    },
    {
      id: 'crust-garlic-butter',
      name: 'Garlic Herb Butter Brush',
      description: 'Infused with roasted garlic butter and Italian oregano.',
      priceAdjustment: 40,
      available: true,
    },
  ],
  addons: [
    {
      id: 'addon-extra-cheese',
      name: 'Extra Mozzarella Melt',
      price: 120,
      category: 'cheese',
      available: true,
    },
    {
      id: 'addon-jalapeno-olives',
      name: 'Jalapeño & Black Olives',
      price: 80,
      category: 'topping',
      available: true,
    },
    {
      id: 'addon-garlic-dip',
      name: 'Signature Garlic Mayo Dip',
      price: 60,
      category: 'sauce',
      available: true,
    },
    {
      id: 'addon-peri-sauce',
      name: 'House Fiery Peri Peri Dip',
      price: 60,
      category: 'sauce',
      available: true,
    },
  ],
  clayPotReturnCredit: 50,
  estimatedPrepTimeMinutes: 30,
};

const DEFAULT_PRODUCTS: Product[] = ALL_MENU_PRODUCTS;

const DEFAULT_COUPONS: Coupon[] = [
  {
    code: 'WELCOME50',
    discountType: 'FIXED',
    discountValue: 50,
    minOrderAmount: 500,
    validUntil: '2026-12-31',
    isActive: true,
    timesUsed: 14,
  },
  {
    code: 'MATKAFEST',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 800,
    maxDiscount: 200,
    validUntil: '2026-12-31',
    isActive: true,
    timesUsed: 29,
  },
];

class StorageService {
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // 1. Attempt authoritative fetch from central server
    try {
      if (typeof window !== 'undefined') {
        const bootstrap = await apiClient.getBootstrap();
        if (bootstrap && Array.isArray(bootstrap.products) && bootstrap.products.length > 0) {
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(bootstrap.products));
          localStorage.setItem(STORAGE_KEYS.MATKA_CONFIG, JSON.stringify(bootstrap.matkaConfig));
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(bootstrap.settings));
          if (bootstrap.coupons) {
            localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(bootstrap.coupons));
          }
          await this.ensureAdminAccount();
          this.initialized = true;
          return;
        }
      }
    } catch {
      // Server unreachable, use cached local storage
    }

    // 2. Fallback to cached or seeded data
    const existingSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!existingSettings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } else {
      try {
        const parsed = JSON.parse(existingSettings);
        if (!parsed.supportedPaymentMethods || !parsed.supportedPaymentMethods.includes('EASYPAISA')) {
          parsed.supportedPaymentMethods = ['CASH', 'EASYPAISA', 'CASH_ON_DELIVERY', 'CASH_ON_PICKUP'];
        }
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed));
      } catch {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      }
    }

    // Seed default matka config
    if (!localStorage.getItem(STORAGE_KEYS.MATKA_CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.MATKA_CONFIG, JSON.stringify(DEFAULT_MATKA_CONFIG));
    }

    // Seed or update default products with accurate images
    const existingProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!existingProducts) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    } else {
      try {
        const storedList: Product[] = JSON.parse(existingProducts);
        const updatedList = storedList.map(item => {
          const defaultItem = DEFAULT_PRODUCTS.find(dp => dp.id === item.id);
          if (defaultItem) {
            return { ...item, image: defaultItem.image };
          }
          return item;
        });

        // Ensure newly introduced products (e.g. Three Milk Cake) are added to existing storage
        for (const defaultItem of DEFAULT_PRODUCTS) {
          if (!updatedList.some(p => p.id === defaultItem.id)) {
            updatedList.push(defaultItem);
          }
        }

        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updatedList));
      } catch {
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      }
    }

    // Seed default coupons
    if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
      localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(DEFAULT_COUPONS));
    }

    // Ensure authorized Admin user exists with salted password hash
    await this.ensureAdminAccount();

    this.initialized = true;
  }

  private async ensureAdminAccount(): Promise<void> {
    const users = this.getUsers();
    const staffAccountsToEnsure: { email: string; username?: string; name: string; role: any; phone: string; riderAccountStatus?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'; mustChangePassword?: boolean }[] = [
      { email: 'sahara@bannu', username: 'sahara@bannu', name: 'Sahara Admin & Owner', role: 'OWNER', phone: '+92 330 5868488' },
      { email: 'zubair@rider', username: 'zubair@rider', name: 'Zubair', role: 'RIDER', phone: '+92 330 5868492', riderAccountStatus: 'ACTIVE', mustChangePassword: false },
      { email: 'shahnawaz@rider', username: 'shahnawaz@rider', name: 'Shah Nawaz', role: 'RIDER', phone: '+923350507308', riderAccountStatus: 'ACTIVE', mustChangePassword: true },
      { email: 'haroon@rider', username: 'haroon@rider', name: 'Haroon Niazi', role: 'RIDER', phone: '+923322533155', riderAccountStatus: 'PENDING_VERIFICATION', mustChangePassword: true },
      { email: 'rohin@rider', username: 'rohin@rider', name: 'Rohin Riyaz', role: 'RIDER', phone: '+923348944901', riderAccountStatus: 'PENDING_VERIFICATION', mustChangePassword: true },
      { email: 'rider@sahara', username: 'rider@sahara', name: 'Zubair Ali (Delivery Captain)', role: 'RIDER', phone: '+92 330 5868492', riderAccountStatus: 'ACTIVE' },
      { email: 'cooker@sahara', username: 'cooker@sahara', name: 'Ustad Farhan (Kitchen Cooker)', role: 'KITCHEN_STAFF', phone: '+92 330 5868491' },
      { email: 'manager@sahara', username: 'manager@sahara', name: 'Tariq Khan (Manager)', role: 'MANAGER', phone: '+92 330 5868489' },
      { email: 'waiter@sahara', username: 'waiter@sahara', name: 'Bilal Ahmed (Floor Waiter)', role: 'WAITER', phone: '+92 330 5868490' },
      { email: 'counter@sahara', username: 'counter@sahara', name: 'Rashid Khan (Counter Cashier)', role: 'COUNTER', phone: '+92 330 5868493' },
    ];

    let modified = false;
    for (const staff of staffAccountsToEnsure) {
      if (!users.some(u => u.email.toLowerCase() === staff.email.toLowerCase())) {
        const salt = generateSalt();
        const hash = await hashPassword('sahara@123', salt);
        const newUser: User = {
          id: `usr_${staff.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: staff.name,
          email: staff.email,
          username: staff.username || staff.email,
          phone: staff.phone,
          role: staff.role,
          passwordHash: hash,
          passwordSalt: salt,
          createdAt: new Date().toISOString(),
          riderAccountStatus: staff.riderAccountStatus,
          mustChangePassword: staff.mustChangePassword,
        };
        users.push(newUser);
        modified = true;
      }
    }

    if (modified) {
      this.saveUsers(users);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  }

  public saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  public getCurrentUser(): User | null {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  }

  public setCurrentUser(user: User | null): void {
    if (user) {
      const safeUser = { ...user };
      delete (safeUser as any).passwordHash;
      delete (safeUser as any).passwordSalt;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  // --- Products ---
  public getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
  }

  public saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  // --- Matka Pizza Config ---
  public getMatkaConfig(): MatkaPizzaConfig {
    const data = localStorage.getItem(STORAGE_KEYS.MATKA_CONFIG);
    return data ? JSON.parse(data) : DEFAULT_MATKA_CONFIG;
  }

  public saveMatkaConfig(config: MatkaPizzaConfig): void {
    localStorage.setItem(STORAGE_KEYS.MATKA_CONFIG, JSON.stringify(config));
  }

  // --- Orders ---
  public getOrders(): Order[] {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  }

  public saveOrders(orders: Order[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  // --- Settings ---
  public getSettings(): BusinessSettings {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(data);
      parsed.phone = '+92 330 5868488';
      parsed.whatsappPhone = '+92 330 5868488';
      parsed.creatorName = parsed.creatorName === 'Muhammad Zaheer' ? 'Mr Zaheer' : (parsed.creatorName || 'Mr Zaheer');
      parsed.creatorCredit = parsed.creatorCredit?.includes('Muhammad Zaheer') ? 'Designed & Developed by Mr Zaheer' : (parsed.creatorCredit || 'Designed & Developed by Mr Zaheer');
      parsed.showCreatorCredit = parsed.showCreatorCredit !== false;
      parsed.logoUrl = parsed.logoUrl || '/assets/images/sahara_logo.jpg';
      parsed.easypaisaQrUrl = '/assets/images/sahara_easypaisa_qr.png';
      parsed.easypaisaAccountTitle = parsed.easypaisaAccountTitle || 'Rahman Ullah Khan';
      parsed.easypaisaAccountNumber = parsed.easypaisaAccountNumber || '0333-8072589';
      if (!parsed.supportedPaymentMethods || !parsed.supportedPaymentMethods.includes('EASYPAISA')) {
        parsed.supportedPaymentMethods = ['CASH', 'EASYPAISA', 'CASH_ON_DELIVERY', 'CASH_ON_PICKUP'];
      }
      if (!Array.isArray(parsed.serviceAreas) || parsed.serviceAreas.length === 0) {
        parsed.serviceAreas = DEFAULT_SETTINGS.serviceAreas;
      }
      parsed.standardDeliveryFee = typeof parsed.standardDeliveryFee === 'number' ? parsed.standardDeliveryFee : DEFAULT_SETTINGS.standardDeliveryFee;
      parsed.freeDeliveryThreshold = typeof parsed.freeDeliveryThreshold === 'number' ? parsed.freeDeliveryThreshold : DEFAULT_SETTINGS.freeDeliveryThreshold;
      parsed.minimumOrderAmount = typeof parsed.minimumOrderAmount === 'number' ? parsed.minimumOrderAmount : DEFAULT_SETTINGS.minimumOrderAmount;
      parsed.address = parsed.address || DEFAULT_SETTINGS.address;
      parsed.projectMetadata = parsed.projectMetadata || {
        businessName: parsed.businessName || 'Sahara Bakers',
        creatorName: 'Mr Zaheer',
        creatorCredit: 'Designed & Developed by Mr Zaheer',
        creatorUrl: parsed.creatorUrl,
        updatedAt: '2026-10-06T00:00:00.000Z',
      };
      return parsed;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: BusinessSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // --- Coupons ---
  public getCoupons(): Coupon[] {
    const data = localStorage.getItem(STORAGE_KEYS.COUPONS);
    return data ? JSON.parse(data) : DEFAULT_COUPONS;
  }

  public saveCoupons(coupons: Coupon[]): void {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return data ? JSON.parse(data) : [];
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 300) logs.pop();
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // --- Riders ---
  public getRiders(): Rider[] {
    const data = localStorage.getItem(STORAGE_KEYS.RIDERS);
    return data ? JSON.parse(data) : DEFAULT_RIDERS;
  }

  public saveRiders(riders: Rider[]): void {
    localStorage.setItem(STORAGE_KEYS.RIDERS, JSON.stringify(riders));
  }

  // --- Delivery Zones ---
  public getDeliveryZones(): DeliveryZone[] {
    const data = localStorage.getItem(STORAGE_KEYS.DELIVERY_ZONES);
    return data ? JSON.parse(data) : DEFAULT_DELIVERY_ZONES;
  }

  public saveDeliveryZones(zones: DeliveryZone[]): void {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_ZONES, JSON.stringify(zones));
  }

  // --- Printer Config ---
  public getPrinterConfig(): ThermalPrinterConfig {
    const data = localStorage.getItem(STORAGE_KEYS.PRINTER_CONFIG);
    return data ? JSON.parse(data) : DEFAULT_PRINTER_CONFIG;
  }

  public savePrinterConfig(config: ThermalPrinterConfig): void {
    localStorage.setItem(STORAGE_KEYS.PRINTER_CONFIG, JSON.stringify(config));
  }
}

export const storage = new StorageService();
