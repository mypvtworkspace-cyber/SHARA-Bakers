export type UserRole = 
  | 'OWNER' 
  | 'ADMIN' 
  | 'MANAGER' 
  | 'WAITER'
  | 'KITCHEN_STAFF' 
  | 'RIDER'
  | 'ORDER_STAFF' 
  | 'COUNTER'
  | 'FINANCE' 
  | 'CUSTOMER';

export interface User {
  id: string;
  name: string;
  email: string; // Used for login; e.g. sahara@bannu, shahnawaz@rider
  username?: string;
  phone?: string;
  role: UserRole;
  passwordHash: string; // Securely hashed, never plain text
  passwordSalt: string;
  createdAt: string;
  addresses?: CustomerAddress[];
  mustChangePassword?: boolean;
  riderAccountStatus?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
}

export interface CustomerAddress {
  id: string;
  label: string;
  streetAddress: string;
  area: string;
  landmark?: string;
  phone: string;
  isDefault?: boolean;
}

export type ProductCategory = 
  | 'burgers-deals' 
  | 'pizza-deals' 
  | 'birthday-deals' 
  | 'matka-calzon' 
  | 'biryani' 
  | 'regular-pizza' 
  | 'special-pizza' 
  | 'meter-pizza' 
  | 'burgers' 
  | 'shawarma' 
  | 'fries' 
  | 'pasta' 
  | 'starters' 
  | 'desserts'
  | 'matka-pizza' 
  | 'bakery' 
  | 'cakes' 
  | 'sweets' 
  | 'beverages';

export type ProductType = 
  | 'MATKA_PIZZA' 
  | 'PIZZA' 
  | 'BURGER'
  | 'SHAWARMA'
  | 'FRIES'
  | 'PASTA'
  | 'STARTER'
  | 'DESSERT'
  | 'DEAL'
  | 'BIRYANI'
  | 'BAKERY' 
  | 'CAKE' 
  | 'SWEETS' 
  | 'DRINK' 
  | 'COMBO';

export interface ServingConfiguration {
  minPersons: number;
  maxPersons: number;
  step: number;
  allowedValues: number[]; // e.g. [1, 2, 3, 4, 5, 6, 7]
  labelTemplate: string; // e.g. "{count} Persons"
  enabled: boolean;
  pricePerPersonAdjustment?: number; // Rs adjustment per person above base
}

export interface MatkaPizzaConfig {
  servingConfig: ServingConfiguration;
  sizes: {
    id: string;
    name: string; // Small, Medium, Large
    servesText: string;
    basePrice: number; // in PKR
    defaultPersons: number;
    recommendedPersons: number[];
  }[];
  flavors: {
    id: string;
    name: string;
    description: string;
    priceAdjustment: number;
    isSpicy?: boolean;
    available: boolean;
  }[];
  crustOptions: {
    id: string;
    name: string;
    description: string;
    priceAdjustment: number;
    available: boolean;
  }[];
  addons: {
    id: string;
    name: string;
    price: number;
    category: 'cheese' | 'sauce' | 'topping' | 'side';
    available: boolean;
  }[];
  clayPotReturnCredit: number; // Rs 50 credit when pot is returned
  estimatedPrepTimeMinutes: number; // 25-35 mins
}

export interface ProductOption {
  id: string;
  name: string;
  price: number;
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  required: boolean;
  options: ProductOption[];
}

export interface ProductPriceVariation {
  sizeName: string; // e.g., 'Small', 'Medium', 'Large', 'XL', '6 PC', '12 PC'
  price: number; // in PKR
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  productType: ProductType;
  description: string;
  basePrice: number; // in PKR
  image: string;
  available: boolean;
  hasSizes?: boolean;
  priceVariations?: ProductPriceVariation[];
  isFeatured?: boolean;
  isSignature?: boolean;
  prepTimeMinutes?: number;
  unit?: string; // e.g., "1 Kg", "500g", "1 Slice", "1 Pot"
  optionGroups?: ProductOptionGroup[];
  ingredients?: string[];
  stockQuantity?: number;
}

export interface CartCustomization {
  size?: string;
  persons?: number;
  flavor?: string;
  crust?: string;
  selectedAddons?: { id: string; name: string; price: number }[];
  selectedOptions?: { groupName: string; optionName: string; price: number }[];
  customerNote?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  unitPrice: number; // authoritative unit price in PKR
  quantity: number;
  image: string;
  customization?: CartCustomization;
  itemTotal: number;
}

export type OrderStatus = 
  | 'ORDER_PLACED' 
  | 'ACCEPTED' 
  | 'PREPARING' 
  | 'READY' 
  | 'OUT_FOR_DELIVERY' 
  | 'READY_FOR_PICKUP' 
  | 'DELIVERED' 
  | 'PICKED_UP' 
  | 'CANCELLED' 
  | 'REJECTED';

// Supported payment methods: CASH & EASYPAISA (with legacy aliases)
export type PaymentMethod = 
  | 'CASH'
  | 'EASYPAISA'
  | 'CASH_ON_DELIVERY' 
  | 'CASH_ON_PICKUP';

export type PaymentStatus = 
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_CONFIRMED' 
  | 'REFUNDED' 
  | 'FAILED';

export type FulfilmentType = 'DELIVERY' | 'PICKUP';

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  category: ProductCategory;
  productType: ProductType;
  size?: string;
  numberOfPersons?: number;
  quantity: number;
  unitPrice: number;
  itemSubtotal: number;
  selectedOptionsSnapshot?: string[];
  selectedAddonsSnapshot?: { name: string; price: number }[];
  customizationSummary?: string;
  customerNote?: string;
  preparationInfo?: string;
  customization?: CartCustomization;
  itemTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. "SB-1042"
  customerId: string;
  guestOrder: boolean;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  fulfilmentType: FulfilmentType;
  deliveryAddress: {
    street: string;
    area: string;
    landmark?: string;
    city: string;
  };
  deliveryNotes?: string;
  pickupTimeEstimate?: string;
  specialInstructions?: string;
  orderType?: 'DELIVERY' | 'PICKUP' | 'DINE_IN' | 'TAKEAWAY';
  tableNumber?: string;
  waiterId?: string;
  waiterName?: string;
  riderId?: string;
  riderName?: string;
  kitchenStatus?: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'HANDED_OFF';
  deliveryStatus?: 'UNASSIGNED' | 'ASSIGNED' | 'ACCEPTED' | 'PICKED_UP' | 'ON_THE_WAY' | 'ARRIVED' | 'DELIVERED';
  version?: number;
  updatedBy?: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  totalAmount: number; // in PKR
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  orderDateTime: string;
  updatedAt: string;
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
    noteUrdu?: string;
  }[];
  idempotencyKey?: string;
}

export interface Coupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number; // % or PKR
  minOrderAmount: number;
  maxDiscount?: number;
  validUntil: string;
  isActive: boolean;
  timesUsed: number;
}

export interface ProjectMetadata {
  businessName: string;
  creatorName: string;
  creatorCredit: string;
  creatorUrl?: string;
  updatedAt?: string;
}

export interface BusinessSettings {
  businessName: string;
  tagline: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string; // Sahara Bakers contact: +92 330 5868488
  whatsappPhone: string;
  email: string;
  openingTime: string; // "08:00"
  closingTime: string; // "23:30"
  isOpen: boolean;
  orderAcceptanceEnabled: boolean;
  standardDeliveryFee: number; // Rs 150
  freeDeliveryThreshold: number; // Rs 2000
  minimumOrderAmount: number; // Rs 300
  announcement?: string;
  supportedPaymentMethods: PaymentMethod[];
  serviceAreas: string[];
  projectMetadata?: ProjectMetadata;
  creatorName?: string;
  creatorCredit?: string;
  creatorUrl?: string;
  showCreatorCredit?: boolean;
  logoUrl?: string;
  easypaisaQrUrl?: string;
  easypaisaAccountTitle?: string;
  easypaisaAccountNumber?: string;
}

export interface AuditLog {
  id: string;
  actorEmail: string;
  actorRole: UserRole;
  action: string;
  targetResource: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  ipAddress?: string;
}

export type RiderStatus = 
  | 'AVAILABLE' 
  | 'BUSY' 
  | 'ASSIGNED' 
  | 'PICKING_UP' 
  | 'ON_THE_WAY' 
  | 'ARRIVED' 
  | 'DELIVERED' 
  | 'OFFLINE';

export interface Rider {
  id: string;
  name: string;
  username?: string;
  userId?: string;
  phone: string;
  altPhone?: string;
  areaNote?: string;
  status: RiderStatus;
  active: boolean;
  accountStatus?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
  currentOrderId?: string;
  currentOrderNumber?: string;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  activeDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  minDistanceKm: number;
  maxDistanceKm: number;
  fee: number; // PKR
  estimatedMinutes: string;
  active: boolean;
  description?: string;
}

export type ThermalPaperWidth = '58mm' | '80mm';

export interface ThermalPrinterConfig {
  paperWidth: ThermalPaperWidth;
  headerNote?: string;
  footerNote?: string;
  autoCut?: boolean;
  printLogo?: boolean;
  printEasyPaisaQr?: boolean;
  logoUrl?: string;
  easypaisaQrUrl?: string;
}

