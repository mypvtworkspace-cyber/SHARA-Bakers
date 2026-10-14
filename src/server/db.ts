import fs from 'fs';
import path from 'path';
import { 
  User, 
  Product, 
  Order, 
  MatkaPizzaConfig, 
  BusinessSettings, 
  Coupon, 
  AuditLog,
  UserRole,
  OrderStatus,
  Rider,
  RiderStatus,
  DeliveryZone,
  ThermalPrinterConfig
} from '../types';
import { FirestoreService } from '../services/firestoreService';
import { ALL_MENU_PRODUCTS } from '../data/defaultProducts';

const DB_PATH = path.resolve(process.cwd(), 'data', 'db.json');

export interface CentralDatabaseSchema {
  version: number;
  updatedAt: string;
  settings: BusinessSettings;
  matkaConfig: MatkaPizzaConfig;
  products: Product[];
  orders: Order[];
  users: User[];
  coupons: Coupon[];
  auditLogs: AuditLog[];
  riders: Rider[];
  deliveryZones: DeliveryZone[];
  printerConfig: ThermalPrinterConfig;
}

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
      id: 'flavor-tikka',
      name: 'Signature Chicken Tikka',
      description: 'Charcoal-infused spicy smoked chicken chunks with bell peppers and roasted onion slices.',
      priceAdjustment: 0,
      isSpicy: true,
      available: true,
    },
    {
      id: 'flavor-malai',
      name: 'Creamy Malai Boti',
      description: 'Tender marinated chicken breast cubes in rich velvety cream, cardamom, and subtle green chili.',
      priceAdjustment: 50,
      isSpicy: false,
      available: true,
    },
    {
      id: 'flavor-mughlai',
      name: 'Royal Mughlai Feast',
      description: 'Slow-simmered minced meat, roasted almonds, golden fried onions, and fragrant herbs.',
      priceAdjustment: 100,
      isSpicy: false,
      available: true,
    },
    {
      id: 'flavor-cheese',
      name: 'Four-Cheese Clay Melt',
      description: 'Generous layers of premium Mozzarella, Cheddar, fresh Paneer cubes, and Gouda.',
      priceAdjustment: 80,
      isSpicy: false,
      available: true,
    },
  ],
  crustOptions: [
    {
      id: 'crust-clay',
      name: 'Traditional Clay Pot Baking',
      description: 'Earthen pot charred dough crust that stays piping hot and crisp.',
      priceAdjustment: 0,
      available: true,
    },
    {
      id: 'crust-cheese-burst',
      name: 'Stuffed Mozzarella Rim',
      description: 'Molten cheese stuffed around the interior pot circumference.',
      priceAdjustment: 120,
      available: true,
    },
  ],
  addons: [
    { id: 'addon-extra-cheese', name: 'Extra Mozzarella Melt', price: 120, category: 'cheese', available: true },
    { id: 'addon-jalapeno', name: 'Pickled Jalapeños', price: 60, category: 'topping', available: true },
    { id: 'addon-mushrooms', name: 'Sautéed Garlic Mushrooms', price: 90, category: 'topping', available: true },
    { id: 'addon-garlic-mayo', name: 'House Special Garlic Dip', price: 50, category: 'sauce', available: true },
  ],
  clayPotReturnCredit: 50,
  estimatedPrepTimeMinutes: 30,
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-matka-pizza',
    name: 'Sahara Signature Clay-Pot Matka Pizza',
    category: 'matka-pizza',
    productType: 'MATKA_PIZZA',
    description: 'Slow-baked in genuine earthenware pots for an earthy smoky aroma, golden crunchy crust, and bubbling molten mozzarella.',
    basePrice: 350,
    image: 'assets/images/sahara_matka_pizza_dish.jpg',
    available: true,
    isFeatured: true,
    isSignature: true,
    prepTimeMinutes: 30,
    unit: '1 Clay Pot',
  },
  {
    id: 'prod-bakery-patty',
    name: 'Crispy Chicken Puff Patty',
    category: 'bakery',
    productType: 'BAKERY',
    description: 'Flaky golden puff pastry filled with freshly spiced shredded chicken breast.',
    basePrice: 90,
    image: 'assets/images/sahara_chicken_puff_patty.jpg',
    available: true,
    isFeatured: true,
    prepTimeMinutes: 5,
    unit: '1 Piece',
  },
  {
    id: 'prod-bakery-croissant',
    name: 'Artisan Butter Croissant',
    category: 'bakery',
    productType: 'BAKERY',
    description: 'Freshly baked flaky Parisian butter croissant with honeycomb interior.',
    basePrice: 140,
    image: 'assets/images/sahara_butter_croissant.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: '1 Piece',
  },
  {
    id: 'prod-bakery-bread',
    name: 'Sahara Special Sesame Milk Bread',
    category: 'bakery',
    productType: 'BAKERY',
    description: 'Soft, pillowy fresh daily milk loaf topped with toasted golden sesame seeds.',
    basePrice: 160,
    image: 'assets/images/sahara_sesame_milk_bread.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: '1 Loaf',
  },
  {
    id: 'prod-bakery-cream-roll',
    name: 'Traditional Cream Horn Roll',
    category: 'bakery',
    productType: 'BAKERY',
    description: 'Crisp spiral pastry horn loaded with light sweet vanilla whipped cream.',
    basePrice: 85,
    image: 'assets/images/sahara_cream_horn_roll.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: '1 Piece',
  },
  {
    id: 'prod-cake-three-milk',
    name: 'Three Milk Cake',
    category: 'cakes',
    productType: 'CAKE',
    description: 'A soft, moist cake soaked in a rich three-milk mixture and finished with a creamy topping.',
    basePrice: 1650,
    image: 'assets/images/sahara_three_milk_cake.jpg',
    available: true,
    isFeatured: true,
    prepTimeMinutes: 20,
    unit: '1 Kg',
  },
  {
    id: 'prod-cake-fudge',
    name: 'Belgian Chocolate Fudge Cake',
    category: 'cakes',
    productType: 'CAKE',
    description: 'Deep cocoa sponge layered with rich Belgian dark chocolate ganache and fudge frosting.',
    basePrice: 1600,
    image: 'assets/images/sahara_belgian_fudge_cake.jpg',
    available: true,
    isFeatured: true,
    prepTimeMinutes: 20,
    unit: '1 Kg',
  },
  {
    id: 'prod-cake-red-velvet',
    name: 'Red Velvet Cream Cheese Cake',
    category: 'cakes',
    productType: 'CAKE',
    description: 'Velvety crimson sponge layered with silky smooth Philadelphia cream cheese frosting.',
    basePrice: 1750,
    image: 'assets/images/sahara_red_velvet_cake.jpg',
    available: true,
    isFeatured: true,
    prepTimeMinutes: 20,
    unit: '1 Kg',
  },
  {
    id: 'prod-cake-lotus',
    name: 'Lotus Biscoff Crunch Cake',
    category: 'cakes',
    productType: 'CAKE',
    description: 'Spiced caramel biscuit sponge topped with speculoos cream and toasted Biscoff drizzle.',
    basePrice: 1850,
    image: 'assets/images/sahara_lotus_biscoff_cake.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 20,
    unit: '1 Kg',
  },
  {
    id: 'prod-cake-slice',
    name: 'Dark Chocolate Pastry Slice',
    category: 'cakes',
    productType: 'CAKE',
    description: 'Individual portion of rich layered chocolate ganache pastry for instant indulgence.',
    basePrice: 220,
    image: 'assets/images/sahara_chocolate_pastry_slice.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: '1 Slice',
  },
  {
    id: 'prod-sweets-gulab',
    name: 'Royal Hot Gulab Jamun',
    category: 'sweets',
    productType: 'SWEETS',
    description: 'Khoya dumplings soaked in fragrant cardamom and saffron rosewater syrup.',
    basePrice: 1100,
    image: 'assets/images/sahara_hot_gulab_jamun.jpg',
    available: true,
    isFeatured: true,
    prepTimeMinutes: 10,
    unit: '1 Kg',
  },
  {
    id: 'prod-sweets-barfi',
    name: 'Pistachio Almond Khoya Barfi',
    category: 'sweets',
    productType: 'SWEETS',
    description: 'Dense pure buffalo milk khoya fudge infused with crushed green pistachios and almonds.',
    basePrice: 1350,
    image: 'assets/images/sahara_pistachio_barfi.jpg',
    available: true,
    isFeatured: true,
    prepTimeMinutes: 10,
    unit: '1 Kg',
  },
  {
    id: 'prod-sweets-box',
    name: 'Sahara Heritage Mixed Mithai Gift Box',
    category: 'sweets',
    productType: 'SWEETS',
    description: 'Assortment of handcrafted Cham Cham, Motichoor Laddu, Pera, and Kalakand.',
    basePrice: 1300,
    image: 'assets/images/sahara_mixed_mithai_box.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 10,
    unit: '1 Kg Box',
  },
  {
    id: 'prod-drink-margarita',
    name: 'Fresh Mint Lemon Margarita',
    category: 'beverages',
    productType: 'DRINK',
    description: 'Crushed garden mint, freshly squeezed lemon juice, black salt, and sparkling soda.',
    basePrice: 220,
    image: 'assets/images/sahara_mint_margarita.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: '1 Glass',
  },
  {
    id: 'prod-drink-lassi',
    name: 'Traditional Bannu Sweet Lassi',
    category: 'beverages',
    productType: 'DRINK',
    description: 'Rich creamy yogurt churned with sugar and topped with thick malai cream.',
    basePrice: 180,
    image: 'assets/images/sahara_bannu_sweet_lassi.jpg',
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: '1 Clay Cup',
  },
];

const DEFAULT_COUPONS: Coupon[] = [
  {
    code: 'SAHARA10',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderAmount: 800,
    validUntil: '2026-12-31',
    isActive: true,
    timesUsed: 0,
  },
  {
    code: 'MATKAPOT',
    discountType: 'FIXED',
    discountValue: 50,
    minOrderAmount: 350,
    validUntil: '2026-12-31',
    isActive: true,
    timesUsed: 0,
  },
];

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
  printLogo: true,
  printEasyPaisaQr: true,
  logoUrl: '/assets/images/sahara_logo.jpg',
  easypaisaQrUrl: '/assets/images/sahara_easypaisa_qr.png',
};

export class CentralDatabase {
  private static instance: CentralDatabase;
  private data: CentralDatabaseSchema;
  private writeLock = false;
  private writeQueue: (() => Promise<void>)[] = [];

  private constructor() {
    this.data = this.loadDatabase();
  }

  public static getInstance(): CentralDatabase {
    if (!CentralDatabase.instance) {
      CentralDatabase.instance = new CentralDatabase();
    }
    return CentralDatabase.instance;
  }

  private loadDatabase(): CentralDatabaseSchema {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products) && parsed.settings) {
          // Verify default products
          for (const dp of DEFAULT_PRODUCTS) {
            if (!parsed.products.some((p: Product) => p.id === dp.id)) {
              parsed.products.push(dp);
            }
          }
          // Verify riders
          if (!Array.isArray(parsed.riders) || parsed.riders.length === 0) {
            parsed.riders = [...DEFAULT_RIDERS];
          } else {
            for (const dr of DEFAULT_RIDERS) {
              if (!parsed.riders.some((r: Rider) => r.id === dr.id)) {
                parsed.riders.push(dr);
              }
            }
          }
          // Verify delivery zones
          if (!Array.isArray(parsed.deliveryZones) || parsed.deliveryZones.length === 0) {
            parsed.deliveryZones = [...DEFAULT_DELIVERY_ZONES];
          }
          // Verify printer config
          if (!parsed.printerConfig) {
            parsed.printerConfig = { ...DEFAULT_PRINTER_CONFIG };
          } else {
            parsed.printerConfig.logoUrl = parsed.printerConfig.logoUrl || '/assets/images/sahara_logo.jpg';
            parsed.printerConfig.easypaisaQrUrl = parsed.printerConfig.easypaisaQrUrl || '/assets/images/sahara_easypaisa_qr.jpg';
          }

          // Ensure settings has latest creator credit and receipt assets
          if (parsed.settings) {
            if (!parsed.settings.creatorName || parsed.settings.creatorName === 'Muhammad Zaheer') {
              parsed.settings.creatorName = 'Mr Zaheer';
            }
            if (!parsed.settings.creatorCredit || parsed.settings.creatorCredit.includes('Muhammad Zaheer')) {
              parsed.settings.creatorCredit = 'Designed & Developed by Mr Zaheer';
            }
            if (parsed.settings.showCreatorCredit === undefined) {
              parsed.settings.showCreatorCredit = true;
            }
            if (!parsed.settings.logoUrl) {
              parsed.settings.logoUrl = '/assets/images/sahara_logo.jpg';
            }
            if (!parsed.settings.easypaisaQrUrl || parsed.settings.easypaisaQrUrl.endsWith('.jpg')) {
              parsed.settings.easypaisaQrUrl = '/assets/images/sahara_easypaisa_qr.png';
            }
            if (!parsed.settings.easypaisaAccountTitle) {
              parsed.settings.easypaisaAccountTitle = 'Rahman Ullah Khan';
            }
            if (!parsed.settings.easypaisaAccountNumber) {
              parsed.settings.easypaisaAccountNumber = '0333-8072589';
            }
            if (!parsed.settings.supportedPaymentMethods || !parsed.settings.supportedPaymentMethods.includes('EASYPAISA')) {
              parsed.settings.supportedPaymentMethods = ['CASH', 'EASYPAISA', 'CASH_ON_DELIVERY', 'CASH_ON_PICKUP'];
            }
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error('[CentralDatabase] Error reading db.json, generating default schema:', err);
    }

    const initialDb: CentralDatabaseSchema = {
      version: 1,
      updatedAt: new Date().toISOString(),
      settings: DEFAULT_SETTINGS,
      matkaConfig: DEFAULT_MATKA_CONFIG,
      products: DEFAULT_PRODUCTS,
      orders: [],
      users: [],
      coupons: DEFAULT_COUPONS,
      auditLogs: [
        {
          id: `audit_init_${Date.now()}`,
          actorEmail: 'system@sahara.pk',
          actorRole: 'OWNER',
          action: 'CENTRAL_DB_BOOTSTRAP',
          targetResource: 'DATABASE',
          newValue: 'Centralized database initialized with authentic Sahara Riders & Delivery Zones',
          timestamp: new Date().toISOString(),
        },
      ],
      riders: DEFAULT_RIDERS,
      deliveryZones: DEFAULT_DELIVERY_ZONES,
      printerConfig: DEFAULT_PRINTER_CONFIG,
    };

    this.persist(initialDb);
    return initialDb;
  }

  private async persist(dbState: CentralDatabaseSchema): Promise<void> {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${DB_PATH}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(dbState, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_PATH);
    } catch (err) {
      console.error('[CentralDatabase] Failed to persist db.json to disk:', err);
    }
  }

  private async executeWrite<T>(mutation: () => T): Promise<T> {
    const result = mutation();
    this.data.version += 1;
    this.data.updatedAt = new Date().toISOString();
    await this.persist(this.data);
    return result;
  }

  /**
   * Synchronizes authoritative business data between Firestore and in-memory/disk database on server startup.
   */
  public async syncWithFirestore(): Promise<void> {
    try {
      console.log('[CentralDatabase] Synchronizing state with Firestore...');
      
      // 1. Products: Load from Firestore, or seed if Firestore is empty
      const fsProducts = await FirestoreService.getProducts().catch(() => []);
      if (fsProducts && fsProducts.length > 0) {
        this.data.products = fsProducts;
      } else {
        await FirestoreService.saveAllProducts(this.data.products).catch(e => console.warn('[DB] Product seed to Firestore:', e));
      }

      // 2. Settings: Load from Firestore, or seed if empty
      const fsSettings = await FirestoreService.getSettings().catch(() => null);
      if (fsSettings && fsSettings.businessName) {
        this.data.settings = { ...this.data.settings, ...fsSettings };
      } else {
        await FirestoreService.saveSettings(this.data.settings).catch(e => console.warn('[DB] Settings seed to Firestore:', e));
      }

      // 3. Matka Config: Load from Firestore, or seed if empty
      const fsMatka = await FirestoreService.getMatkaConfig().catch(() => null);
      if (fsMatka && fsMatka.sizes && fsMatka.sizes.length > 0) {
        this.data.matkaConfig = fsMatka;
      } else {
        await FirestoreService.saveMatkaConfig(this.data.matkaConfig).catch(e => console.warn('[DB] Matka seed to Firestore:', e));
      }

      // 4. Orders: Merge all Firestore orders into server memory
      const fsOrders = await FirestoreService.getOrders().catch(() => []);
      if (fsOrders && fsOrders.length > 0) {
        const existingMap = new Map(this.data.orders.map(o => [o.id, o]));
        for (const order of fsOrders) {
          existingMap.set(order.id, order);
        }
        this.data.orders = Array.from(existingMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // Persist hydrated state to local cache
      await this.persist(this.data);
      console.log(`[CentralDatabase] Firestore sync complete. Loaded ${this.data.products.length} products, ${this.data.orders.length} orders.`);
    } catch (err) {
      console.error('[CentralDatabase] Error synchronizing with Firestore:', err);
    }
  }

  // --- Read Operations ---
  public getData(): CentralDatabaseSchema {
    return this.data;
  }

  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public getMatkaConfig(): MatkaPizzaConfig {
    return this.data.matkaConfig;
  }

  public getSettings(): BusinessSettings {
    return this.data.settings;
  }

  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public getCoupons(): Coupon[] {
    return this.data.coupons;
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Write Operations (Server-Authoritative) ---
  public async setProducts(products: Product[], actor?: { email: string; role: UserRole }): Promise<Product[]> {
    return this.executeWrite(() => {
      this.data.products = products;
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, 'PRODUCTS_UPDATE', 'MENU_CATALOG', `Count: ${products.length}`);
      }
      return this.data.products;
    });
  }

  public async updateProduct(id: string, updates: Partial<Product>, actor?: { email: string; role: UserRole }): Promise<Product | null> {
    return this.executeWrite(() => {
      const idx = this.data.products.findIndex(p => p.id === id);
      if (idx === -1) return null;
      const prev = { ...this.data.products[idx] };
      this.data.products[idx] = { ...this.data.products[idx], ...updates };
      if (actor) {
        this.addAuditLogInternal(
          actor.email, 
          actor.role, 
          'PRODUCT_UPDATE', 
          `PRODUCT_${id}`, 
          JSON.stringify(updates), 
          JSON.stringify(prev)
        );
      }
      return this.data.products[idx];
    });
  }

  public async updateProductPrice(id: string, newPrice: number, actor?: { email: string; role: UserRole }): Promise<Product | null> {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const prevPrice = this.data.products[idx].basePrice;
    this.data.products[idx].basePrice = newPrice;
    await FirestoreService.saveProduct(this.data.products[idx]);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          'PRICE_UPDATED',
          `PRODUCT_${this.data.products[idx].name}`,
          `Rs. ${newPrice}`,
          `Rs. ${prevPrice}`
        );
      }
      return this.data.products[idx];
    });
  }

  public async updateProductAvailability(id: string, available: boolean, actor?: { email: string; role: UserRole }): Promise<Product | null> {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const prev = this.data.products[idx].available;
    this.data.products[idx].available = available;
    await FirestoreService.saveProduct(this.data.products[idx]);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          'AVAILABILITY_CHANGED',
          `PRODUCT_${this.data.products[idx].name}`,
          available ? 'In Stock' : 'Sold Out',
          prev ? 'In Stock' : 'Sold Out'
        );
      }
      return this.data.products[idx];
    });
  }

  public async createProduct(product: Product, actor?: { email: string; role: UserRole }): Promise<Product> {
    await FirestoreService.saveProduct(product);
    return this.executeWrite(() => {
      this.data.products.push(product);
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, 'PRODUCT_CREATED', `PRODUCT_${product.name}`, `Price: Rs. ${product.basePrice}`);
      }
      return product;
    });
  }

  public async deleteProduct(id: string, actor?: { email: string; role: UserRole }): Promise<boolean> {
    return this.executeWrite(() => {
      const idx = this.data.products.findIndex(p => p.id === id);
      if (idx === -1) return false;
      const removed = this.data.products.splice(idx, 1)[0];
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, 'PRODUCT_DELETED', `PRODUCT_${removed.name}`, undefined, `Price: Rs. ${removed.basePrice}`);
      }
      return true;
    });
  }

  public async updateMatkaConfig(config: MatkaPizzaConfig, actor?: { email: string; role: UserRole }): Promise<MatkaPizzaConfig> {
    this.data.matkaConfig = config;
    const smallSize = config.sizes.find(s => s.id === 'size-small');
    if (smallSize) {
      const mpIdx = this.data.products.findIndex(p => p.id === 'prod-matka-pizza');
      if (mpIdx !== -1) {
        this.data.products[mpIdx].basePrice = smallSize.basePrice;
      }
    }
    await FirestoreService.saveMatkaConfig(config);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, 'MATKA_CONFIG_UPDATED', 'MATKA_SETTINGS', JSON.stringify(config.sizes));
      }
      return this.data.matkaConfig;
    });
  }

  public async updateSettings(settings: BusinessSettings, actor?: { email: string; role: UserRole }): Promise<BusinessSettings> {
    this.data.settings = settings;
    await FirestoreService.saveSettings(settings);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, 'SETTINGS_UPDATED', 'BUSINESS_PROFILE', settings.businessName);
      }
      return this.data.settings;
    });
  }

  public async createOrder(order: Order, actor?: { email: string; role: UserRole }): Promise<Order> {
    order.version = 1;
    order.updatedAt = new Date().toISOString();
    this.data.orders.unshift(order);
    await FirestoreService.saveOrder(order);
    return this.executeWrite(() => {
      this.addAuditLogInternal(
        actor?.email || order.customerEmail || 'customer@order',
        actor?.role || 'CUSTOMER',
        'ORDER_CREATED',
        `ORDER_${order.orderNumber}`,
        `Rs. ${order.totalAmount} (${order.fulfilmentType})`
      );
      return order;
    });
  }

  public async updateOrderStatus(
    orderId: string, 
    status: OrderStatus, 
    actor: { email: string; role: UserRole },
    note?: string
  ): Promise<Order | null> {
    const result = await this.executeWrite(() => {
      const order = this.data.orders.find(o => o.id === orderId);
      if (!order) return null;
      const prevStatus = order.status;
      order.status = status;
      order.version = (order.version || 1) + 1;
      order.updatedAt = new Date().toISOString();
      order.updatedBy = actor.email;

      // Update sub-statuses based on workflow
      if (status === 'PREPARING') order.kitchenStatus = 'PREPARING';
      if (status === 'READY') order.kitchenStatus = 'READY';
      if (status === 'OUT_FOR_DELIVERY') {
        order.deliveryStatus = 'ON_THE_WAY';
        // Sync rider status
        if (order.riderId) {
          const rider = this.data.riders.find(r => r.id === order.riderId || r.phone === order.riderId || r.name === order.riderName);
          if (rider) {
            rider.status = 'ON_THE_WAY';
            rider.updatedAt = new Date().toISOString();
          }
        }
      }
      if (status === 'DELIVERED') {
        order.deliveryStatus = 'DELIVERED';
        order.paymentStatus = 'PAYMENT_CONFIRMED';
        // Free up assigned rider and increment completed deliveries
        if (order.riderId) {
          const rider = this.data.riders.find(r => r.id === order.riderId || r.phone === order.riderId || r.name === order.riderName);
          if (rider) {
            rider.status = 'AVAILABLE';
            rider.currentOrderId = undefined;
            rider.currentOrderNumber = undefined;
            rider.activeDeliveries = Math.max(0, rider.activeDeliveries - 1);
            rider.completedDeliveries = (rider.completedDeliveries || 0) + 1;
            rider.updatedAt = new Date().toISOString();
          }
        }
      }

      order.timeline.push({
        status,
        timestamp: new Date().toISOString(),
        note: note || `Status updated to ${status} by ${actor.role}`,
      });

      this.addAuditLogInternal(
        actor.email,
        actor.role,
        'ORDER_STATUS_CHANGED',
        `ORDER_${order.orderNumber}`,
        status,
        prevStatus
      );

      return order;
    });
    if (result) {
      await FirestoreService.saveOrder(result);
    }
    return result;
  }

  public async assignRider(
    orderId: string, 
    riderId: string, 
    riderName: string, 
    actor: { email: string; role: UserRole }
  ): Promise<Order | null> {
    const existing = this.data.orders.find(o => o.id === orderId);
    if (!existing) return null;
    
    // Prevent another rider from claiming an already assigned order
    if (existing.riderId && existing.riderId !== riderId && actor.role === 'RIDER') {
      throw new Error(`Order #${existing.orderNumber} has already been accepted by another rider (${existing.riderName || existing.riderId}).`);
    }

    const result = await this.executeWrite(() => {
      const order = this.data.orders.find(o => o.id === orderId);
      if (!order) return null;
      order.riderId = riderId;
      order.riderName = riderName;
      order.deliveryStatus = 'ASSIGNED';
      order.version = (order.version || 1) + 1;
      order.updatedAt = new Date().toISOString();
      order.updatedBy = actor.email;
      
      order.timeline.push({
        status: order.status,
        timestamp: new Date().toISOString(),
        note: `Assigned to delivery captain: ${riderName}`,
      });

      // Synchronize persistent Rider entity
      const rider = this.data.riders.find(r => r.id === riderId || r.phone === riderId || r.name === riderName);
      if (rider) {
        rider.status = 'ASSIGNED';
        rider.currentOrderId = order.id;
        rider.currentOrderNumber = order.orderNumber;
        rider.activeDeliveries = (rider.activeDeliveries || 0) + 1;
        rider.totalDeliveries = (rider.totalDeliveries || 0) + 1;
        rider.updatedAt = new Date().toISOString();
      }

      this.addAuditLogInternal(actor.email, actor.role, 'STAFF_ASSIGNED', `ORDER_${order.orderNumber}`, `Rider: ${riderName}`);
      return order;
    });
    if (result) {
      await FirestoreService.saveOrder(result);
    }
    return result;
  }

  public async updateOrderPaymentStatus(
    orderId: string, 
    paymentStatus: 'PAYMENT_CONFIRMED' | 'PAYMENT_PENDING' | 'REFUNDED', 
    actor: { email: string; role: UserRole },
    note?: string
  ): Promise<Order | null> {
    const result = await this.executeWrite(() => {
      const order = this.data.orders.find(o => o.id === orderId);
      if (!order) return null;
      const prevPayment = order.paymentStatus;
      order.paymentStatus = paymentStatus;
      order.version = (order.version || 1) + 1;
      order.updatedAt = new Date().toISOString();
      order.updatedBy = actor.email;

      order.timeline.push({
        status: order.status,
        timestamp: new Date().toISOString(),
        note: note || `Payment status updated to ${paymentStatus} by ${actor.email}`,
      });

      this.addAuditLogInternal(
        actor.email,
        actor.role,
        'PAYMENT_STATUS_CHANGED',
        `ORDER_${order.orderNumber}`,
        paymentStatus,
        prevPayment
      );

      return order;
    });
    if (result) {
      await FirestoreService.saveOrder(result);
    }
    return result;
  }

  // --- Rider Entity Operations ---
  public getRiders(): Rider[] {
    return this.data.riders || [];
  }

  public async createRider(rider: Rider, actor?: { email: string; role: UserRole }): Promise<Rider> {
    return this.executeWrite(() => {
      if (!this.data.riders) this.data.riders = [];
      this.data.riders.push(rider);
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, 'RIDER_CREATED', `RIDER_${rider.name}`, `Phone: ${rider.phone}`);
      }
      return rider;
    });
  }

  public async updateRider(id: string, updates: Partial<Rider>, actor?: { email: string; role: UserRole }): Promise<Rider | null> {
    return this.executeWrite(() => {
      const idx = this.data.riders.findIndex(r => r.id === id);
      if (idx === -1) return null;
      const prev = { ...this.data.riders[idx] };
      this.data.riders[idx] = { 
        ...this.data.riders[idx], 
        ...updates,
        updatedAt: new Date().toISOString()
      };
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          'RIDER_UPDATED',
          `RIDER_${this.data.riders[idx].name}`,
          JSON.stringify(updates),
          JSON.stringify(prev)
        );
      }
      return this.data.riders[idx];
    });
  }

  public async updateRiderStatus(id: string, status: RiderStatus, actor?: { email: string; role: UserRole }): Promise<Rider | null> {
    return this.executeWrite(() => {
      const idx = this.data.riders.findIndex(r => r.id === id);
      if (idx === -1) return null;
      const prevStatus = this.data.riders[idx].status;
      this.data.riders[idx].status = status;
      this.data.riders[idx].updatedAt = new Date().toISOString();
      if (status === 'AVAILABLE') {
        this.data.riders[idx].currentOrderId = undefined;
        this.data.riders[idx].currentOrderNumber = undefined;
      }
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          'RIDER_STATUS_CHANGED',
          `RIDER_${this.data.riders[idx].name}`,
          status,
          prevStatus
        );
      }
      return this.data.riders[idx];
    });
  }

  // --- Delivery Zone Operations ---
  public getDeliveryZones(): DeliveryZone[] {
    return this.data.deliveryZones || [];
  }

  public async updateDeliveryZones(zones: DeliveryZone[], actor?: { email: string; role: UserRole }): Promise<DeliveryZone[]> {
    return this.executeWrite(() => {
      this.data.deliveryZones = zones;
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          'DELIVERY_ZONE_UPDATED',
          'DELIVERY_ZONES',
          `Configured ${zones.length} delivery distance tiers`
        );
      }
      return this.data.deliveryZones;
    });
  }

  // --- Thermal Printer Configuration ---
  public getPrinterConfig(): ThermalPrinterConfig {
    return this.data.printerConfig || { paperWidth: '58mm', autoCut: true };
  }

  public async updatePrinterConfig(config: ThermalPrinterConfig, actor?: { email: string; role: UserRole }): Promise<ThermalPrinterConfig> {
    return this.executeWrite(() => {
      this.data.printerConfig = config;
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          'PRINTER_CONFIG_UPDATED',
          'THERMAL_PRINTER',
          `Paper: ${config.paperWidth}`
        );
      }
      return this.data.printerConfig;
    });
  }

  // --- Audit Log for Thermal Receipt Reprint ---
  public async recordReceiptReprint(orderId: string, receiptId: string, actor: { email: string; role: UserRole }): Promise<AuditLog> {
    return this.executeWrite(() => {
      const newLog: AuditLog = {
        id: `audit_print_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: 'RECEIPT_REPRINTED',
        targetResource: `RECEIPT_${orderId}`,
        newValue: `Reprinted receipt ID: ${receiptId}`,
        timestamp: new Date().toISOString(),
      };
      this.data.auditLogs.unshift(newLog);
      return newLog;
    });
  }

  public async saveUsers(users: User[]): Promise<User[]> {
    return this.executeWrite(() => {
      this.data.users = users;
      return this.data.users;
    });
  }

  public async addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    return this.executeWrite(() => {
      const newLog: AuditLog = {
        ...log,
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      this.data.auditLogs.unshift(newLog);
      if (this.data.auditLogs.length > 500) {
        this.data.auditLogs.pop();
      }
      return newLog;
    });
  }

  private addAuditLogInternal(
    actorEmail: string,
    actorRole: UserRole,
    action: string,
    targetResource: string,
    newValue?: string,
    previousValue?: string
  ) {
    const newLog: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorEmail,
      actorRole,
      action,
      targetResource,
      newValue,
      previousValue,
      timestamp: new Date().toISOString(),
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
  }
}

export const centralDb = CentralDatabase.getInstance();
