// server.ts
import express from "express";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// src/server/db.ts
import fs from "fs";
import path from "path";

// src/services/firestoreService.ts
import {
  collection,
  doc as doc3,
  getDoc,
  getDocs,
  setDoc as setDoc2,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

// src/services/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, doc as doc2, getDocFromServer as getDocFromServer2 } from "firebase/firestore";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "buoyant-music-hxctm",
  appId: "1:663311185325:web:9be5bc2dd58c53b81e9d24",
  apiKey: "AIzaSyDoIiDzO0vGL27JMnOu6HdAjhT2lk4JJug",
  authDomain: "buoyant-music-hxctm.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-saharabakersrest-a80226e5-8fc2-40d0-93cb-82f0be8ca08f",
  storageBucket: "buoyant-music-hxctm.firebasestorage.app",
  messagingSenderId: "663311185325",
  measurementId: "",
  oAuthClientId: "663311185325-bv7mo07rv5keeate4539faaq52a5lkc5.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/services/firestoreDiagnostics.ts
import { doc, setDoc, getDocFromServer } from "firebase/firestore";
async function testFirestoreConnection(documentId = "diagnostic") {
  const startTime = Date.now();
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const initializedOptions = firebase_default.options;
  const projectIdMatches = initializedOptions.projectId === firebase_applet_config_default.projectId;
  const appIdMatches = initializedOptions.appId === firebase_applet_config_default.appId;
  const apiKeyMatches = initializedOptions.apiKey === firebase_applet_config_default.apiKey;
  const configMatched = projectIdMatches && appIdMatches && apiKeyMatches;
  const configVerification = {
    matched: configMatched,
    projectId: {
      configured: firebase_applet_config_default.projectId,
      initialized: initializedOptions.projectId,
      matches: projectIdMatches
    },
    appId: {
      configured: firebase_applet_config_default.appId,
      initialized: initializedOptions.appId,
      matches: appIdMatches
    },
    apiKey: {
      configured: firebase_applet_config_default.apiKey,
      initialized: initializedOptions.apiKey,
      matches: apiKeyMatches
    },
    firestoreDatabaseId: {
      configured: firebase_applet_config_default.firestoreDatabaseId,
      matches: Boolean(firebase_applet_config_default.firestoreDatabaseId)
    }
  };
  const docPath = `test-connection/${documentId}`;
  const testDocRef = doc(db, "test-connection", documentId);
  try {
    const testPayload = {
      status: "ok",
      testRunAt: timestamp,
      timestampMs: startTime,
      projectId: firebase_applet_config_default.projectId,
      databaseId: firebase_applet_config_default.firestoreDatabaseId || "(default)",
      source: "Sahara Bakers Firestore Diagnostic Utility"
    };
    await setDoc(testDocRef, testPayload, { merge: true });
    const writeSuccess = true;
    const snapshot = await getDocFromServer(testDocRef);
    const readSuccess = snapshot.exists();
    const dataRead = snapshot.data();
    const dataMatches = Boolean(
      dataRead && dataRead.status === "ok" && dataRead.projectId === firebase_applet_config_default.projectId
    );
    const latencyMs = Date.now() - startTime;
    const overallSuccess = configMatched && writeSuccess && readSuccess && dataMatches;
    const result = {
      success: overallSuccess,
      message: overallSuccess ? `Firestore connection test successful! SDK matched configuration and verified server read/write on '${docPath}' in ${latencyMs}ms.` : `Firestore connection test partially succeeded. Please review configuration & permissions details.`,
      timestamp,
      configVerification,
      operationResult: {
        documentPath: docPath,
        writeSuccess,
        readSuccess,
        dataMatches,
        latencyMs,
        dataRead
      }
    };
    console.log("[Firestore Diagnostics]", result.message, {
      projectId: configVerification.projectId.configured,
      databaseId: configVerification.firestoreDatabaseId.configured,
      latency: `${latencyMs}ms`
    });
    return result;
  } catch (err) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Firestore Diagnostics Error]", errorMessage, err);
    return {
      success: false,
      message: `Firestore connection test failed: ${errorMessage}`,
      timestamp,
      configVerification,
      operationResult: {
        documentPath: docPath,
        writeSuccess: false,
        readSuccess: false,
        dataMatches: false,
        latencyMs
      },
      error: errorMessage
    };
  }
}
if (typeof window !== "undefined") {
  window.__testFirestoreConnection = testFirestoreConnection;
}

// src/services/firebase.ts
var app = getApps().length > 0 ? getApp() : initializeApp({
  apiKey: firebase_applet_config_default.apiKey,
  authDomain: firebase_applet_config_default.authDomain,
  projectId: firebase_applet_config_default.projectId,
  storageBucket: firebase_applet_config_default.storageBucket,
  messagingSenderId: firebase_applet_config_default.messagingSenderId,
  appId: firebase_applet_config_default.appId
});
var auth = getAuth(app);
var firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true
    },
    firebase_applet_config_default.firestoreDatabaseId || void 0
  );
} catch {
  firestoreDb = firebase_applet_config_default.firestoreDatabaseId ? getFirestore(app, firebase_applet_config_default.firestoreDatabaseId) : getFirestore(app);
}
var db = firestoreDb;
async function testConnection() {
  try {
    await getDocFromServer2(doc2(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is operating in offline mode.");
    }
  }
}
if (typeof window !== "undefined") {
  testConnection().catch(() => {
  });
}
var firebase_default = app;

// src/services/firestoreService.ts
function handleFirestoreError(error, operationType, path3) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path: path3
  };
  console.error("[Firestore Error]:", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
function sanitizeForFirestore(data) {
  if (data === null || data === void 0) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  if (typeof data === "object" && !(data instanceof Date)) {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== void 0) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}
var FirestoreService = class _FirestoreService {
  // --- Diagnostics & Connection Testing ---
  static async testConnection(documentId) {
    return testFirestoreConnection(documentId);
  }
  // --- Orders ---
  static async saveOrder(order) {
    const path3 = `orders/${order.id}`;
    try {
      const orderRef = doc3(db, "orders", order.id);
      const cleaned = sanitizeForFirestore({
        ...order,
        firestoreSyncedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await setDoc2(orderRef, cleaned, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to persist order:", err);
      handleFirestoreError(err, "write" /* WRITE */, path3);
    }
  }
  static async getOrders(filter) {
    const path3 = "orders";
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"), limit(150));
      const snapshot = await getDocs(q);
      let orders = [];
      snapshot.forEach((docSnap) => {
        orders.push(docSnap.data());
      });
      if (filter && filter.role && !["OWNER", "ADMIN", "MANAGER", "COUNTER"].includes(filter.role)) {
        if (filter.role === "KITCHEN_STAFF") {
          orders = orders.filter((o) => ["ORDER_PLACED", "ACCEPTED", "PREPARING", "READY"].includes(o.status));
        } else if (filter.role === "RIDER") {
          orders = orders.filter((o) => o.riderId === filter.email || o.riderId === filter.userId);
        } else if (filter.email || filter.userId || filter.phone) {
          orders = orders.filter(
            (o) => filter.email && o.customerEmail?.toLowerCase() === filter.email.toLowerCase() || filter.userId && o.customerId === filter.userId || filter.phone && o.customerPhone === filter.phone
          );
        }
      }
      return orders;
    } catch (err) {
      console.error("[Firestore] Failed to fetch orders:", err);
      handleFirestoreError(err, "get" /* GET */, path3);
    }
  }
  static subscribeOrders(callback, onError) {
    const path3 = "orders";
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"), limit(150));
    return onSnapshot(
      q,
      (snapshot) => {
        const orders = [];
        snapshot.forEach((docSnap) => {
          orders.push(docSnap.data());
        });
        callback(orders);
      },
      (error) => {
        console.error("[Firestore] Orders subscription error:", error);
        if (onError) onError(error);
        handleFirestoreError(error, "get" /* GET */, path3);
      }
    );
  }
  static async updateOrderStatus(orderId, status, timelineItem) {
    const path3 = `orders/${orderId}`;
    try {
      const orderRef = doc3(db, "orders", orderId);
      const updates = {
        status,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (timelineItem) {
        updates.timeline = timelineItem;
      }
      const cleaned = sanitizeForFirestore(updates);
      await updateDoc(orderRef, cleaned);
    } catch (err) {
      console.error("[Firestore] Failed to update order status:", err);
      handleFirestoreError(err, "update" /* UPDATE */, path3);
    }
  }
  static async updateOrderPaymentStatus(orderId, paymentStatus, actor) {
    const path3 = `orders/${orderId}`;
    try {
      const orderRef = doc3(db, "orders", orderId);
      const cleaned = sanitizeForFirestore({
        paymentStatus,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        updatedBy: actor?.email || "staff"
      });
      await updateDoc(orderRef, cleaned);
    } catch (err) {
      console.error("[Firestore] Failed to update order payment status:", err);
      handleFirestoreError(err, "update" /* UPDATE */, path3);
    }
  }
  // --- Settings ---
  static async saveSettings(settings) {
    const path3 = "settings/business";
    try {
      const settingsRef = doc3(db, "settings", "business");
      const cleaned = sanitizeForFirestore({
        ...settings,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await setDoc2(settingsRef, cleaned, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to persist settings:", err);
      handleFirestoreError(err, "write" /* WRITE */, path3);
    }
  }
  static async getSettings() {
    const path3 = "settings/business";
    try {
      const settingsRef = doc3(db, "settings", "business");
      const snapshot = await getDoc(settingsRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return null;
    } catch (err) {
      console.error("[Firestore] Failed to fetch settings:", err);
      handleFirestoreError(err, "get" /* GET */, path3);
    }
  }
  static subscribeSettings(callback, onError) {
    const path3 = "settings/business";
    const settingsRef = doc3(db, "settings", "business");
    return onSnapshot(
      settingsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      },
      (error) => {
        console.error("[Firestore] Settings subscription error:", error);
        if (onError) onError(error);
        handleFirestoreError(error, "get" /* GET */, path3);
      }
    );
  }
  // --- Matka Pizza Config ---
  static async saveMatkaConfig(config) {
    const path3 = "settings/matkaConfig";
    try {
      const configRef = doc3(db, "settings", "matkaConfig");
      const cleaned = sanitizeForFirestore({
        ...config,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      await setDoc2(configRef, cleaned, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to persist Matka config:", err);
      handleFirestoreError(err, "write" /* WRITE */, path3);
    }
  }
  static async getMatkaConfig() {
    const path3 = "settings/matkaConfig";
    try {
      const configRef = doc3(db, "settings", "matkaConfig");
      const snapshot = await getDoc(configRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return null;
    } catch (err) {
      console.error("[Firestore] Failed to fetch Matka config:", err);
      handleFirestoreError(err, "get" /* GET */, path3);
    }
  }
  static subscribeMatkaConfig(callback, onError) {
    const path3 = "settings/matkaConfig";
    const configRef = doc3(db, "settings", "matkaConfig");
    return onSnapshot(
      configRef,
      (snapshot) => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      },
      (error) => {
        console.error("[Firestore] Matka config subscription error:", error);
        if (onError) onError(error);
        handleFirestoreError(error, "get" /* GET */, path3);
      }
    );
  }
  // --- Products ---
  static async saveProduct(product) {
    const path3 = `products/${product.id}`;
    try {
      const prodRef = doc3(db, "products", product.id);
      const cleaned = sanitizeForFirestore(product);
      await setDoc2(prodRef, cleaned, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to persist product:", err);
      handleFirestoreError(err, "write" /* WRITE */, path3);
    }
  }
  static async saveAllProducts(products) {
    try {
      for (const prod of products) {
        await _FirestoreService.saveProduct(prod);
      }
    } catch (err) {
      console.error("[Firestore] Failed to batch save products:", err);
    }
  }
  static async getProducts() {
    const path3 = "products";
    try {
      const prodsRef = collection(db, "products");
      const snapshot = await getDocs(prodsRef);
      const prods = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id && data.name) {
          prods.push(data);
        }
      });
      return prods;
    } catch (err) {
      console.error("[Firestore] Failed to fetch products:", err);
      handleFirestoreError(err, "get" /* GET */, path3);
    }
  }
  static subscribeProducts(callback, onError) {
    const path3 = "products";
    const prodsRef = collection(db, "products");
    return onSnapshot(
      prodsRef,
      (snapshot) => {
        const prods = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.id && data.name) {
            prods.push(data);
          }
        });
        if (prods.length > 0) {
          callback(prods);
        }
      },
      (error) => {
        console.error("[Firestore] Products subscription error:", error);
        if (onError) onError(error);
        handleFirestoreError(error, "get" /* GET */, path3);
      }
    );
  }
  // --- Users ---
  static async saveUser(user) {
    const path3 = `users/${user.id}`;
    try {
      const userRef = doc3(db, "users", user.id);
      const cleaned = sanitizeForFirestore({
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username || user.email,
        phone: user.phone || "",
        role: user.role,
        createdAt: user.createdAt,
        mustChangePassword: user.mustChangePassword || false,
        riderAccountStatus: user.riderAccountStatus || (user.role === "RIDER" ? "ACTIVE" : void 0)
      });
      await setDoc2(userRef, cleaned, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to persist user:", err);
      handleFirestoreError(err, "write" /* WRITE */, path3);
    }
  }
  static async getUser(userId) {
    const path3 = `users/${userId}`;
    try {
      const userRef = doc3(db, "users", userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data();
      }
      return null;
    } catch (err) {
      console.error("[Firestore] Failed to fetch user:", err);
      handleFirestoreError(err, "get" /* GET */, path3);
    }
  }
  // --- Riders ---
  static async saveRider(rider) {
    const path3 = `riders/${rider.id}`;
    try {
      const riderRef = doc3(db, "riders", rider.id);
      const cleaned = sanitizeForFirestore(rider);
      await setDoc2(riderRef, cleaned, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to persist rider:", err);
      handleFirestoreError(err, "write" /* WRITE */, path3);
    }
  }
  static async getRiders() {
    const path3 = "riders";
    try {
      const ridersRef = collection(db, "riders");
      const snapshot = await getDocs(ridersRef);
      const riders = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id && data.name) {
          riders.push(data);
        }
      });
      return riders;
    } catch (err) {
      console.error("[Firestore] Failed to fetch riders:", err);
      handleFirestoreError(err, "get" /* GET */, path3);
    }
  }
  // --- Audit Logs ---
  static async addAuditLog(log) {
    const path3 = `auditLogs/${log.id}`;
    try {
      const logRef = doc3(db, "auditLogs", log.id);
      const cleaned = sanitizeForFirestore(log);
      await setDoc2(logRef, cleaned, { merge: true });
    } catch (err) {
      console.error("[Firestore] Failed to add audit log:", err);
      handleFirestoreError(err, "write" /* WRITE */, path3);
    }
  }
};

// src/server/db.ts
var DB_PATH = path.resolve(process.cwd(), "data", "db.json");
var DEFAULT_SETTINGS = {
  businessName: "Sahara Bakers",
  tagline: "Home of Signature Clay-Pot Matka Pizza & Artisanal Bakery",
  address: "Railway Road, near Syed Software House",
  city: "Bannu",
  postalCode: "28100",
  phone: "+92 330 5868488",
  whatsappPhone: "+92 330 5868488",
  email: "info@saharabakers.pk",
  openingTime: "08:00",
  closingTime: "23:30",
  isOpen: true,
  orderAcceptanceEnabled: true,
  standardDeliveryFee: 150,
  freeDeliveryThreshold: 2e3,
  minimumOrderAmount: 300,
  announcement: "Fresh Clay-Pot Matka Pizza baked to order! Return your clay pot for Rs. 50 credit.",
  supportedPaymentMethods: ["CASH", "EASYPAISA", "CASH_ON_DELIVERY", "CASH_ON_PICKUP"],
  serviceAreas: [
    "Railway Road",
    "City Center",
    "Cantonment Bannu",
    "Miran Shah Road",
    "Kohat Road",
    "Sugar Mill Colony",
    "Mandeyan",
    "Bannu University Campus",
    "Ghauri Gate"
  ],
  creatorName: "Mr Zaheer",
  creatorCredit: "Designed & Developed by Mr Zaheer",
  showCreatorCredit: true,
  logoUrl: "/assets/images/sahara_logo.jpg",
  easypaisaQrUrl: "/assets/images/sahara_easypaisa_qr.png",
  easypaisaAccountTitle: "Rahman Ullah Khan",
  easypaisaAccountNumber: "0333-8072589",
  projectMetadata: {
    businessName: "Sahara Bakers",
    creatorName: "Mr Zaheer",
    creatorCredit: "Designed & Developed by Mr Zaheer",
    updatedAt: "2026-10-06T00:00:00.000Z"
  }
};
var DEFAULT_MATKA_CONFIG = {
  servingConfig: {
    minPersons: 1,
    maxPersons: 7,
    step: 1,
    allowedValues: [1, 2, 3, 4, 5, 6, 7],
    labelTemplate: "{count} Persons",
    enabled: true,
    pricePerPersonAdjustment: 0
  },
  sizes: [
    {
      id: "size-small",
      name: "Small",
      servesText: "Best for 1-2 Persons",
      basePrice: 350,
      defaultPersons: 1,
      recommendedPersons: [1, 2]
    },
    {
      id: "size-medium",
      name: "Medium",
      servesText: "Best for 2-4 Persons",
      basePrice: 650,
      defaultPersons: 3,
      recommendedPersons: [2, 3, 4]
    },
    {
      id: "size-large",
      name: "Large",
      servesText: "Best for 4-7 Persons",
      basePrice: 1150,
      defaultPersons: 5,
      recommendedPersons: [4, 5, 6, 7]
    }
  ],
  flavors: [
    {
      id: "flavor-tikka",
      name: "Signature Chicken Tikka",
      description: "Charcoal-infused spicy smoked chicken chunks with bell peppers and roasted onion slices.",
      priceAdjustment: 0,
      isSpicy: true,
      available: true
    },
    {
      id: "flavor-malai",
      name: "Creamy Malai Boti",
      description: "Tender marinated chicken breast cubes in rich velvety cream, cardamom, and subtle green chili.",
      priceAdjustment: 50,
      isSpicy: false,
      available: true
    },
    {
      id: "flavor-mughlai",
      name: "Royal Mughlai Feast",
      description: "Slow-simmered minced meat, roasted almonds, golden fried onions, and fragrant herbs.",
      priceAdjustment: 100,
      isSpicy: false,
      available: true
    },
    {
      id: "flavor-cheese",
      name: "Four-Cheese Clay Melt",
      description: "Generous layers of premium Mozzarella, Cheddar, fresh Paneer cubes, and Gouda.",
      priceAdjustment: 80,
      isSpicy: false,
      available: true
    }
  ],
  crustOptions: [
    {
      id: "crust-clay",
      name: "Traditional Clay Pot Baking",
      description: "Earthen pot charred dough crust that stays piping hot and crisp.",
      priceAdjustment: 0,
      available: true
    },
    {
      id: "crust-cheese-burst",
      name: "Stuffed Mozzarella Rim",
      description: "Molten cheese stuffed around the interior pot circumference.",
      priceAdjustment: 120,
      available: true
    }
  ],
  addons: [
    { id: "addon-extra-cheese", name: "Extra Mozzarella Melt", price: 120, category: "cheese", available: true },
    { id: "addon-jalapeno", name: "Pickled Jalape\xF1os", price: 60, category: "topping", available: true },
    { id: "addon-mushrooms", name: "Saut\xE9ed Garlic Mushrooms", price: 90, category: "topping", available: true },
    { id: "addon-garlic-mayo", name: "House Special Garlic Dip", price: 50, category: "sauce", available: true }
  ],
  clayPotReturnCredit: 50,
  estimatedPrepTimeMinutes: 30
};
var DEFAULT_PRODUCTS = [
  {
    id: "prod-matka-pizza",
    name: "Sahara Signature Clay-Pot Matka Pizza",
    category: "matka-pizza",
    productType: "MATKA_PIZZA",
    description: "Slow-baked in genuine earthenware pots for an earthy smoky aroma, golden crunchy crust, and bubbling molten mozzarella.",
    basePrice: 350,
    image: "assets/images/sahara_matka_pizza_dish.jpg",
    available: true,
    isFeatured: true,
    isSignature: true,
    prepTimeMinutes: 30,
    unit: "1 Clay Pot"
  },
  {
    id: "prod-bakery-patty",
    name: "Crispy Chicken Puff Patty",
    category: "bakery",
    productType: "BAKERY",
    description: "Flaky golden puff pastry filled with freshly spiced shredded chicken breast.",
    basePrice: 90,
    image: "assets/images/sahara_chicken_puff_patty.jpg",
    available: true,
    isFeatured: true,
    prepTimeMinutes: 5,
    unit: "1 Piece"
  },
  {
    id: "prod-bakery-croissant",
    name: "Artisan Butter Croissant",
    category: "bakery",
    productType: "BAKERY",
    description: "Freshly baked flaky Parisian butter croissant with honeycomb interior.",
    basePrice: 140,
    image: "assets/images/sahara_butter_croissant.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: "1 Piece"
  },
  {
    id: "prod-bakery-bread",
    name: "Sahara Special Sesame Milk Bread",
    category: "bakery",
    productType: "BAKERY",
    description: "Soft, pillowy fresh daily milk loaf topped with toasted golden sesame seeds.",
    basePrice: 160,
    image: "assets/images/sahara_sesame_milk_bread.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: "1 Loaf"
  },
  {
    id: "prod-bakery-cream-roll",
    name: "Traditional Cream Horn Roll",
    category: "bakery",
    productType: "BAKERY",
    description: "Crisp spiral pastry horn loaded with light sweet vanilla whipped cream.",
    basePrice: 85,
    image: "assets/images/sahara_cream_horn_roll.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: "1 Piece"
  },
  {
    id: "prod-cake-three-milk",
    name: "Three Milk Cake",
    category: "cakes",
    productType: "CAKE",
    description: "A soft, moist cake soaked in a rich three-milk mixture and finished with a creamy topping.",
    basePrice: 1650,
    image: "assets/images/sahara_three_milk_cake.jpg",
    available: true,
    isFeatured: true,
    prepTimeMinutes: 20,
    unit: "1 Kg"
  },
  {
    id: "prod-cake-fudge",
    name: "Belgian Chocolate Fudge Cake",
    category: "cakes",
    productType: "CAKE",
    description: "Deep cocoa sponge layered with rich Belgian dark chocolate ganache and fudge frosting.",
    basePrice: 1600,
    image: "assets/images/sahara_belgian_fudge_cake.jpg",
    available: true,
    isFeatured: true,
    prepTimeMinutes: 20,
    unit: "1 Kg"
  },
  {
    id: "prod-cake-red-velvet",
    name: "Red Velvet Cream Cheese Cake",
    category: "cakes",
    productType: "CAKE",
    description: "Velvety crimson sponge layered with silky smooth Philadelphia cream cheese frosting.",
    basePrice: 1750,
    image: "assets/images/sahara_red_velvet_cake.jpg",
    available: true,
    isFeatured: true,
    prepTimeMinutes: 20,
    unit: "1 Kg"
  },
  {
    id: "prod-cake-lotus",
    name: "Lotus Biscoff Crunch Cake",
    category: "cakes",
    productType: "CAKE",
    description: "Spiced caramel biscuit sponge topped with speculoos cream and toasted Biscoff drizzle.",
    basePrice: 1850,
    image: "assets/images/sahara_lotus_biscoff_cake.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 20,
    unit: "1 Kg"
  },
  {
    id: "prod-cake-slice",
    name: "Dark Chocolate Pastry Slice",
    category: "cakes",
    productType: "CAKE",
    description: "Individual portion of rich layered chocolate ganache pastry for instant indulgence.",
    basePrice: 220,
    image: "assets/images/sahara_chocolate_pastry_slice.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: "1 Slice"
  },
  {
    id: "prod-sweets-gulab",
    name: "Royal Hot Gulab Jamun",
    category: "sweets",
    productType: "SWEETS",
    description: "Khoya dumplings soaked in fragrant cardamom and saffron rosewater syrup.",
    basePrice: 1100,
    image: "assets/images/sahara_hot_gulab_jamun.jpg",
    available: true,
    isFeatured: true,
    prepTimeMinutes: 10,
    unit: "1 Kg"
  },
  {
    id: "prod-sweets-barfi",
    name: "Pistachio Almond Khoya Barfi",
    category: "sweets",
    productType: "SWEETS",
    description: "Dense pure buffalo milk khoya fudge infused with crushed green pistachios and almonds.",
    basePrice: 1350,
    image: "assets/images/sahara_pistachio_barfi.jpg",
    available: true,
    isFeatured: true,
    prepTimeMinutes: 10,
    unit: "1 Kg"
  },
  {
    id: "prod-sweets-box",
    name: "Sahara Heritage Mixed Mithai Gift Box",
    category: "sweets",
    productType: "SWEETS",
    description: "Assortment of handcrafted Cham Cham, Motichoor Laddu, Pera, and Kalakand.",
    basePrice: 1300,
    image: "assets/images/sahara_mixed_mithai_box.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 10,
    unit: "1 Kg Box"
  },
  {
    id: "prod-drink-margarita",
    name: "Fresh Mint Lemon Margarita",
    category: "beverages",
    productType: "DRINK",
    description: "Crushed garden mint, freshly squeezed lemon juice, black salt, and sparkling soda.",
    basePrice: 220,
    image: "assets/images/sahara_mint_margarita.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: "1 Glass"
  },
  {
    id: "prod-drink-lassi",
    name: "Traditional Bannu Sweet Lassi",
    category: "beverages",
    productType: "DRINK",
    description: "Rich creamy yogurt churned with sugar and topped with thick malai cream.",
    basePrice: 180,
    image: "assets/images/sahara_bannu_sweet_lassi.jpg",
    available: true,
    isFeatured: false,
    prepTimeMinutes: 5,
    unit: "1 Clay Cup"
  }
];
var DEFAULT_COUPONS = [
  {
    code: "SAHARA10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    minOrderAmount: 800,
    validUntil: "2026-12-31",
    isActive: true,
    timesUsed: 0
  },
  {
    code: "MATKAPOT",
    discountType: "FIXED",
    discountValue: 50,
    minOrderAmount: 350,
    validUntil: "2026-12-31",
    isActive: true,
    timesUsed: 0
  }
];
var DEFAULT_RIDERS = [
  {
    id: "rider_zubair",
    name: "Zubair",
    username: "zubair@rider",
    phone: "+92 330 5868492",
    areaNote: "Cantt & City Deliveries",
    status: "AVAILABLE",
    active: true,
    accountStatus: "ACTIVE",
    totalDeliveries: 28,
    completedDeliveries: 28,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "rider_shah_nawaz",
    name: "Shah Nawaz",
    username: "shahnawaz@rider",
    phone: "+923350507308",
    altPhone: "+923490068374",
    areaNote: "Rashid / Bannu Cantt & City (\u0631\u0627\u0626\u0634)",
    status: "AVAILABLE",
    active: true,
    accountStatus: "ACTIVE",
    totalDeliveries: 12,
    completedDeliveries: 12,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "rider_haroon",
    name: "Haroon Niazi",
    username: "haroon@rider",
    phone: "+923322533155",
    areaNote: "Railway Road & City Center",
    status: "AVAILABLE",
    active: true,
    accountStatus: "PENDING_VERIFICATION",
    totalDeliveries: 9,
    completedDeliveries: 9,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  {
    id: "rider_rohin_riyaz",
    name: "Rohin Riyaz",
    username: "rohin@rider",
    phone: "+923348944901",
    altPhone: "+923369396994",
    areaNote: "Markaz Delivery / Main Branch (\u0645\u0631\u06A9\u0632 \u0688\u0644\u06CC\u0648\u0631\u06CC)",
    status: "AVAILABLE",
    active: true,
    accountStatus: "PENDING_VERIFICATION",
    totalDeliveries: 15,
    completedDeliveries: 15,
    cancelledDeliveries: 0,
    activeDeliveries: 0,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  }
];
var DEFAULT_DELIVERY_ZONES = [
  {
    id: "zone-1",
    name: "Zone 1: Railway Road & City Center",
    minDistanceKm: 0,
    maxDistanceKm: 2,
    fee: 80,
    estimatedMinutes: "15-25 mins",
    active: true,
    description: "Immediate vicinity around Sahara Bakers and City Market"
  },
  {
    id: "zone-2",
    name: "Zone 2: Cantonment & Sugar Mill Colony",
    minDistanceKm: 2,
    maxDistanceKm: 5,
    fee: 140,
    estimatedMinutes: "25-35 mins",
    active: true,
    description: "Bannu Cantt, Station area, and Sugar Mill Colony"
  },
  {
    id: "zone-3",
    name: "Zone 3: Miran Shah Road & Mandeyan",
    minDistanceKm: 5,
    maxDistanceKm: 8,
    fee: 200,
    estimatedMinutes: "35-45 mins",
    active: true,
    description: "Outer ring, Mandeyan, and Miran Shah Road"
  },
  {
    id: "zone-4",
    name: "Zone 4: Bannu University & Suburbs",
    minDistanceKm: 8,
    maxDistanceKm: 12,
    fee: 280,
    estimatedMinutes: "45-60 mins",
    active: true,
    description: "University of Science and Technology Bannu & Outskirts"
  }
];
var DEFAULT_PRINTER_CONFIG = {
  paperWidth: "58mm",
  headerNote: "The Famous Clay-Pot Matka Pizza & Artisanal Bakery",
  footerNote: "Thank you for visiting Sahara Bakers! Fresh daily since inception.",
  autoCut: true,
  printLogo: true,
  printEasyPaisaQr: true,
  logoUrl: "/assets/images/sahara_logo.jpg",
  easypaisaQrUrl: "/assets/images/sahara_easypaisa_qr.png"
};
var CentralDatabase = class _CentralDatabase {
  constructor() {
    this.writeLock = false;
    this.writeQueue = [];
    this.data = this.loadDatabase();
  }
  static getInstance() {
    if (!_CentralDatabase.instance) {
      _CentralDatabase.instance = new _CentralDatabase();
    }
    return _CentralDatabase.instance;
  }
  loadDatabase() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.products) && parsed.settings) {
          for (const dp of DEFAULT_PRODUCTS) {
            if (!parsed.products.some((p) => p.id === dp.id)) {
              parsed.products.push(dp);
            }
          }
          if (!Array.isArray(parsed.riders) || parsed.riders.length === 0) {
            parsed.riders = [...DEFAULT_RIDERS];
          } else {
            for (const dr of DEFAULT_RIDERS) {
              if (!parsed.riders.some((r) => r.id === dr.id)) {
                parsed.riders.push(dr);
              }
            }
          }
          if (!Array.isArray(parsed.deliveryZones) || parsed.deliveryZones.length === 0) {
            parsed.deliveryZones = [...DEFAULT_DELIVERY_ZONES];
          }
          if (!parsed.printerConfig) {
            parsed.printerConfig = { ...DEFAULT_PRINTER_CONFIG };
          } else {
            parsed.printerConfig.logoUrl = parsed.printerConfig.logoUrl || "/assets/images/sahara_logo.jpg";
            parsed.printerConfig.easypaisaQrUrl = parsed.printerConfig.easypaisaQrUrl || "/assets/images/sahara_easypaisa_qr.jpg";
          }
          if (parsed.settings) {
            if (!parsed.settings.creatorName || parsed.settings.creatorName === "Muhammad Zaheer") {
              parsed.settings.creatorName = "Mr Zaheer";
            }
            if (!parsed.settings.creatorCredit || parsed.settings.creatorCredit.includes("Muhammad Zaheer")) {
              parsed.settings.creatorCredit = "Designed & Developed by Mr Zaheer";
            }
            if (parsed.settings.showCreatorCredit === void 0) {
              parsed.settings.showCreatorCredit = true;
            }
            if (!parsed.settings.logoUrl) {
              parsed.settings.logoUrl = "/assets/images/sahara_logo.jpg";
            }
            if (!parsed.settings.easypaisaQrUrl || parsed.settings.easypaisaQrUrl.endsWith(".jpg")) {
              parsed.settings.easypaisaQrUrl = "/assets/images/sahara_easypaisa_qr.png";
            }
            if (!parsed.settings.easypaisaAccountTitle) {
              parsed.settings.easypaisaAccountTitle = "Rahman Ullah Khan";
            }
            if (!parsed.settings.easypaisaAccountNumber) {
              parsed.settings.easypaisaAccountNumber = "0333-8072589";
            }
            if (!parsed.settings.supportedPaymentMethods || !parsed.settings.supportedPaymentMethods.includes("EASYPAISA")) {
              parsed.settings.supportedPaymentMethods = ["CASH", "EASYPAISA", "CASH_ON_DELIVERY", "CASH_ON_PICKUP"];
            }
          }
          return parsed;
        }
      }
    } catch (err) {
      console.error("[CentralDatabase] Error reading db.json, generating default schema:", err);
    }
    const initialDb = {
      version: 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      settings: DEFAULT_SETTINGS,
      matkaConfig: DEFAULT_MATKA_CONFIG,
      products: DEFAULT_PRODUCTS,
      orders: [],
      users: [],
      coupons: DEFAULT_COUPONS,
      auditLogs: [
        {
          id: `audit_init_${Date.now()}`,
          actorEmail: "system@sahara.pk",
          actorRole: "OWNER",
          action: "CENTRAL_DB_BOOTSTRAP",
          targetResource: "DATABASE",
          newValue: "Centralized database initialized with authentic Sahara Riders & Delivery Zones",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      ],
      riders: DEFAULT_RIDERS,
      deliveryZones: DEFAULT_DELIVERY_ZONES,
      printerConfig: DEFAULT_PRINTER_CONFIG
    };
    this.persist(initialDb);
    return initialDb;
  }
  async persist(dbState) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${DB_PATH}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpPath, JSON.stringify(dbState, null, 2), "utf-8");
      fs.renameSync(tmpPath, DB_PATH);
    } catch (err) {
      console.error("[CentralDatabase] Failed to persist db.json to disk:", err);
    }
  }
  async executeWrite(mutation) {
    const result = mutation();
    this.data.version += 1;
    this.data.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.persist(this.data);
    return result;
  }
  /**
   * Synchronizes authoritative business data between Firestore and in-memory/disk database on server startup.
   */
  async syncWithFirestore() {
    try {
      console.log("[CentralDatabase] Synchronizing state with Firestore...");
      const fsProducts = await FirestoreService.getProducts().catch(() => []);
      if (fsProducts && fsProducts.length > 0) {
        this.data.products = fsProducts;
      } else {
        await FirestoreService.saveAllProducts(this.data.products).catch((e) => console.warn("[DB] Product seed to Firestore:", e));
      }
      const fsSettings = await FirestoreService.getSettings().catch(() => null);
      if (fsSettings && fsSettings.businessName) {
        this.data.settings = { ...this.data.settings, ...fsSettings };
      } else {
        await FirestoreService.saveSettings(this.data.settings).catch((e) => console.warn("[DB] Settings seed to Firestore:", e));
      }
      const fsMatka = await FirestoreService.getMatkaConfig().catch(() => null);
      if (fsMatka && fsMatka.sizes && fsMatka.sizes.length > 0) {
        this.data.matkaConfig = fsMatka;
      } else {
        await FirestoreService.saveMatkaConfig(this.data.matkaConfig).catch((e) => console.warn("[DB] Matka seed to Firestore:", e));
      }
      const fsOrders = await FirestoreService.getOrders().catch(() => []);
      if (fsOrders && fsOrders.length > 0) {
        const existingMap = new Map(this.data.orders.map((o) => [o.id, o]));
        for (const order of fsOrders) {
          existingMap.set(order.id, order);
        }
        this.data.orders = Array.from(existingMap.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      await this.persist(this.data);
      console.log(`[CentralDatabase] Firestore sync complete. Loaded ${this.data.products.length} products, ${this.data.orders.length} orders.`);
    } catch (err) {
      console.error("[CentralDatabase] Error synchronizing with Firestore:", err);
    }
  }
  // --- Read Operations ---
  getData() {
    return this.data;
  }
  getProducts() {
    return this.data.products;
  }
  getProductById(id) {
    return this.data.products.find((p) => p.id === id);
  }
  getMatkaConfig() {
    return this.data.matkaConfig;
  }
  getSettings() {
    return this.data.settings;
  }
  getOrders() {
    return this.data.orders;
  }
  getUsers() {
    return this.data.users;
  }
  getCoupons() {
    return this.data.coupons;
  }
  getAuditLogs() {
    return this.data.auditLogs;
  }
  // --- Write Operations (Server-Authoritative) ---
  async setProducts(products, actor) {
    return this.executeWrite(() => {
      this.data.products = products;
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, "PRODUCTS_UPDATE", "MENU_CATALOG", `Count: ${products.length}`);
      }
      return this.data.products;
    });
  }
  async updateProduct(id, updates, actor) {
    return this.executeWrite(() => {
      const idx = this.data.products.findIndex((p) => p.id === id);
      if (idx === -1) return null;
      const prev = { ...this.data.products[idx] };
      this.data.products[idx] = { ...this.data.products[idx], ...updates };
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          "PRODUCT_UPDATE",
          `PRODUCT_${id}`,
          JSON.stringify(updates),
          JSON.stringify(prev)
        );
      }
      return this.data.products[idx];
    });
  }
  async updateProductPrice(id, newPrice, actor) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const prevPrice = this.data.products[idx].basePrice;
    this.data.products[idx].basePrice = newPrice;
    await FirestoreService.saveProduct(this.data.products[idx]);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          "PRICE_UPDATED",
          `PRODUCT_${this.data.products[idx].name}`,
          `Rs. ${newPrice}`,
          `Rs. ${prevPrice}`
        );
      }
      return this.data.products[idx];
    });
  }
  async updateProductAvailability(id, available, actor) {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    const prev = this.data.products[idx].available;
    this.data.products[idx].available = available;
    await FirestoreService.saveProduct(this.data.products[idx]);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          "AVAILABILITY_CHANGED",
          `PRODUCT_${this.data.products[idx].name}`,
          available ? "In Stock" : "Sold Out",
          prev ? "In Stock" : "Sold Out"
        );
      }
      return this.data.products[idx];
    });
  }
  async createProduct(product, actor) {
    await FirestoreService.saveProduct(product);
    return this.executeWrite(() => {
      this.data.products.push(product);
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, "PRODUCT_CREATED", `PRODUCT_${product.name}`, `Price: Rs. ${product.basePrice}`);
      }
      return product;
    });
  }
  async deleteProduct(id, actor) {
    return this.executeWrite(() => {
      const idx = this.data.products.findIndex((p) => p.id === id);
      if (idx === -1) return false;
      const removed = this.data.products.splice(idx, 1)[0];
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, "PRODUCT_DELETED", `PRODUCT_${removed.name}`, void 0, `Price: Rs. ${removed.basePrice}`);
      }
      return true;
    });
  }
  async updateMatkaConfig(config, actor) {
    this.data.matkaConfig = config;
    const smallSize = config.sizes.find((s) => s.id === "size-small");
    if (smallSize) {
      const mpIdx = this.data.products.findIndex((p) => p.id === "prod-matka-pizza");
      if (mpIdx !== -1) {
        this.data.products[mpIdx].basePrice = smallSize.basePrice;
      }
    }
    await FirestoreService.saveMatkaConfig(config);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, "MATKA_CONFIG_UPDATED", "MATKA_SETTINGS", JSON.stringify(config.sizes));
      }
      return this.data.matkaConfig;
    });
  }
  async updateSettings(settings, actor) {
    this.data.settings = settings;
    await FirestoreService.saveSettings(settings);
    return this.executeWrite(() => {
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, "SETTINGS_UPDATED", "BUSINESS_PROFILE", settings.businessName);
      }
      return this.data.settings;
    });
  }
  async createOrder(order, actor) {
    order.version = 1;
    order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.data.orders.unshift(order);
    await FirestoreService.saveOrder(order);
    return this.executeWrite(() => {
      this.addAuditLogInternal(
        actor?.email || order.customerEmail || "customer@order",
        actor?.role || "CUSTOMER",
        "ORDER_CREATED",
        `ORDER_${order.orderNumber}`,
        `Rs. ${order.totalAmount} (${order.fulfilmentType})`
      );
      return order;
    });
  }
  async updateOrderStatus(orderId, status, actor, note) {
    const result = await this.executeWrite(() => {
      const order = this.data.orders.find((o) => o.id === orderId);
      if (!order) return null;
      const prevStatus = order.status;
      order.status = status;
      order.version = (order.version || 1) + 1;
      order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      order.updatedBy = actor.email;
      if (status === "PREPARING") order.kitchenStatus = "PREPARING";
      if (status === "READY") order.kitchenStatus = "READY";
      if (status === "OUT_FOR_DELIVERY") {
        order.deliveryStatus = "ON_THE_WAY";
        if (order.riderId) {
          const rider = this.data.riders.find((r) => r.id === order.riderId || r.phone === order.riderId || r.name === order.riderName);
          if (rider) {
            rider.status = "ON_THE_WAY";
            rider.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          }
        }
      }
      if (status === "DELIVERED") {
        order.deliveryStatus = "DELIVERED";
        order.paymentStatus = "PAYMENT_CONFIRMED";
        if (order.riderId) {
          const rider = this.data.riders.find((r) => r.id === order.riderId || r.phone === order.riderId || r.name === order.riderName);
          if (rider) {
            rider.status = "AVAILABLE";
            rider.currentOrderId = void 0;
            rider.currentOrderNumber = void 0;
            rider.activeDeliveries = Math.max(0, rider.activeDeliveries - 1);
            rider.completedDeliveries = (rider.completedDeliveries || 0) + 1;
            rider.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
          }
        }
      }
      order.timeline.push({
        status,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: note || `Status updated to ${status} by ${actor.role}`
      });
      this.addAuditLogInternal(
        actor.email,
        actor.role,
        "ORDER_STATUS_CHANGED",
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
  async assignRider(orderId, riderId, riderName, actor) {
    const existing = this.data.orders.find((o) => o.id === orderId);
    if (!existing) return null;
    if (existing.riderId && existing.riderId !== riderId && actor.role === "RIDER") {
      throw new Error(`Order #${existing.orderNumber} has already been accepted by another rider (${existing.riderName || existing.riderId}).`);
    }
    const result = await this.executeWrite(() => {
      const order = this.data.orders.find((o) => o.id === orderId);
      if (!order) return null;
      order.riderId = riderId;
      order.riderName = riderName;
      order.deliveryStatus = "ASSIGNED";
      order.version = (order.version || 1) + 1;
      order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      order.updatedBy = actor.email;
      order.timeline.push({
        status: order.status,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: `Assigned to delivery captain: ${riderName}`
      });
      const rider = this.data.riders.find((r) => r.id === riderId || r.phone === riderId || r.name === riderName);
      if (rider) {
        rider.status = "ASSIGNED";
        rider.currentOrderId = order.id;
        rider.currentOrderNumber = order.orderNumber;
        rider.activeDeliveries = (rider.activeDeliveries || 0) + 1;
        rider.totalDeliveries = (rider.totalDeliveries || 0) + 1;
        rider.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      }
      this.addAuditLogInternal(actor.email, actor.role, "STAFF_ASSIGNED", `ORDER_${order.orderNumber}`, `Rider: ${riderName}`);
      return order;
    });
    if (result) {
      await FirestoreService.saveOrder(result);
    }
    return result;
  }
  async updateOrderPaymentStatus(orderId, paymentStatus, actor, note) {
    const result = await this.executeWrite(() => {
      const order = this.data.orders.find((o) => o.id === orderId);
      if (!order) return null;
      const prevPayment = order.paymentStatus;
      order.paymentStatus = paymentStatus;
      order.version = (order.version || 1) + 1;
      order.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      order.updatedBy = actor.email;
      order.timeline.push({
        status: order.status,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        note: note || `Payment status updated to ${paymentStatus} by ${actor.email}`
      });
      this.addAuditLogInternal(
        actor.email,
        actor.role,
        "PAYMENT_STATUS_CHANGED",
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
  getRiders() {
    return this.data.riders || [];
  }
  async createRider(rider, actor) {
    return this.executeWrite(() => {
      if (!this.data.riders) this.data.riders = [];
      this.data.riders.push(rider);
      if (actor) {
        this.addAuditLogInternal(actor.email, actor.role, "RIDER_CREATED", `RIDER_${rider.name}`, `Phone: ${rider.phone}`);
      }
      return rider;
    });
  }
  async updateRider(id, updates, actor) {
    return this.executeWrite(() => {
      const idx = this.data.riders.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      const prev = { ...this.data.riders[idx] };
      this.data.riders[idx] = {
        ...this.data.riders[idx],
        ...updates,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          "RIDER_UPDATED",
          `RIDER_${this.data.riders[idx].name}`,
          JSON.stringify(updates),
          JSON.stringify(prev)
        );
      }
      return this.data.riders[idx];
    });
  }
  async updateRiderStatus(id, status, actor) {
    return this.executeWrite(() => {
      const idx = this.data.riders.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      const prevStatus = this.data.riders[idx].status;
      this.data.riders[idx].status = status;
      this.data.riders[idx].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (status === "AVAILABLE") {
        this.data.riders[idx].currentOrderId = void 0;
        this.data.riders[idx].currentOrderNumber = void 0;
      }
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          "RIDER_STATUS_CHANGED",
          `RIDER_${this.data.riders[idx].name}`,
          status,
          prevStatus
        );
      }
      return this.data.riders[idx];
    });
  }
  // --- Delivery Zone Operations ---
  getDeliveryZones() {
    return this.data.deliveryZones || [];
  }
  async updateDeliveryZones(zones, actor) {
    return this.executeWrite(() => {
      this.data.deliveryZones = zones;
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          "DELIVERY_ZONE_UPDATED",
          "DELIVERY_ZONES",
          `Configured ${zones.length} delivery distance tiers`
        );
      }
      return this.data.deliveryZones;
    });
  }
  // --- Thermal Printer Configuration ---
  getPrinterConfig() {
    return this.data.printerConfig || { paperWidth: "58mm", autoCut: true };
  }
  async updatePrinterConfig(config, actor) {
    return this.executeWrite(() => {
      this.data.printerConfig = config;
      if (actor) {
        this.addAuditLogInternal(
          actor.email,
          actor.role,
          "PRINTER_CONFIG_UPDATED",
          "THERMAL_PRINTER",
          `Paper: ${config.paperWidth}`
        );
      }
      return this.data.printerConfig;
    });
  }
  // --- Audit Log for Thermal Receipt Reprint ---
  async recordReceiptReprint(orderId, receiptId, actor) {
    return this.executeWrite(() => {
      const newLog = {
        id: `audit_print_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        actorEmail: actor.email,
        actorRole: actor.role,
        action: "RECEIPT_REPRINTED",
        targetResource: `RECEIPT_${orderId}`,
        newValue: `Reprinted receipt ID: ${receiptId}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.data.auditLogs.unshift(newLog);
      return newLog;
    });
  }
  async saveUsers(users) {
    return this.executeWrite(() => {
      this.data.users = users;
      return this.data.users;
    });
  }
  async addAuditLog(log) {
    return this.executeWrite(() => {
      const newLog = {
        ...log,
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      this.data.auditLogs.unshift(newLog);
      if (this.data.auditLogs.length > 500) {
        this.data.auditLogs.pop();
      }
      return newLog;
    });
  }
  addAuditLogInternal(actorEmail, actorRole, action, targetResource, newValue, previousValue) {
    const newLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      actorEmail,
      actorRole,
      action,
      targetResource,
      newValue,
      previousValue,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.auditLogs.unshift(newLog);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs.pop();
    }
  }
};
var centralDb = CentralDatabase.getInstance();

// src/services/crypto.ts
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:sahara_bannu_security_pepper`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function verifyPassword(password, salt, expectedHash) {
  const computedHash = await hashPassword(password, salt);
  return computedHash === expectedHash;
}

// server.ts
var app2 = express();
var PORT = Number(process.env.PORT) || 3e3;
var isProd = process.env.NODE_ENV === "production";
app2.use(express.json({ limit: "10mb" }));
var sseClients = [];
function broadcastEvent(eventType, payload) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  for (const client of sseClients) {
    try {
      client.res.write(`event: message
data: ${data}

`);
    } catch {
    }
  }
}
async function ensureDefaultStaffAccounts() {
  const users = centralDb.getUsers();
  const staffToSeed = [
    { email: "sahara@bannu", name: "Sahara Admin & Owner", role: "OWNER", pass: "sahara@123", phone: "+92 330 5868488" },
    // Requested Individual Riders
    {
      email: "shahnawaz@rider",
      username: "shahnawaz@rider",
      name: "Shah Nawaz",
      role: "RIDER",
      pass: "sahara@123",
      phone: "+923350507308",
      riderAccountStatus: "ACTIVE",
      mustChangePassword: true,
      id: "usr_rider_shahnawaz"
    },
    {
      email: "haroon@rider",
      username: "haroon@rider",
      name: "Haroon Niazi",
      role: "RIDER",
      pass: "sahara@123",
      phone: "+923322533155",
      riderAccountStatus: "PENDING_VERIFICATION",
      mustChangePassword: true,
      id: "usr_rider_haroon"
    },
    {
      email: "rohin@rider",
      username: "rohin@rider",
      name: "Rohin Riyaz",
      role: "RIDER",
      pass: "sahara@123",
      phone: "+923348944901",
      riderAccountStatus: "PENDING_VERIFICATION",
      mustChangePassword: true,
      id: "usr_rider_rohin"
    },
    // Operational staff
    { email: "cooker@sahara", name: "Ustad Farhan (Kitchen Cooker)", role: "KITCHEN_STAFF", pass: "sahara@123", phone: "+92 330 5868491" },
    { email: "manager@sahara", name: "Tariq Khan (Manager)", role: "MANAGER", pass: "sahara@123", phone: "+92 330 5868489" },
    { email: "waiter@sahara", name: "Bilal Ahmed (Floor Waiter)", role: "WAITER", pass: "sahara@123", phone: "+92 330 5868490" },
    { email: "counter@sahara", name: "Rashid Khan (Counter Cashier)", role: "COUNTER", pass: "sahara@123", phone: "+92 330 5868493" },
    // Zubair Rider Account
    {
      email: "zubair@rider",
      username: "zubair@rider",
      name: "Zubair",
      role: "RIDER",
      pass: "sahara@123",
      phone: "+92 330 5868492",
      riderAccountStatus: "ACTIVE",
      mustChangePassword: false,
      id: "usr_rider_zubair"
    },
    // Legacy general rider alias for fallback
    { email: "rider@sahara", username: "rider@sahara", name: "Zubair Ali (Delivery Captain)", role: "RIDER", pass: "sahara@123", phone: "+92 330 5868492", riderAccountStatus: "ACTIVE" }
  ];
  let modified = false;
  for (const staff of staffToSeed) {
    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === staff.email.toLowerCase() || staff.username && u.username && u.username.toLowerCase() === staff.username.toLowerCase()
    );
    if (existingIndex === -1) {
      const salt = generateSalt();
      const hash = await hashPassword(staff.pass, salt);
      const newUser = {
        id: staff.id || `usr_${staff.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: staff.name,
        email: staff.email,
        username: staff.username || staff.email,
        phone: staff.phone,
        role: staff.role,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        mustChangePassword: staff.mustChangePassword ?? false,
        riderAccountStatus: staff.riderAccountStatus
      };
      users.push(newUser);
      modified = true;
      FirestoreService.saveUser(newUser).catch(() => {
      });
    } else {
      let changed = false;
      if (staff.username && !users[existingIndex].username) {
        users[existingIndex].username = staff.username;
        changed = true;
      }
      if (staff.riderAccountStatus && users[existingIndex].riderAccountStatus !== staff.riderAccountStatus) {
        users[existingIndex].riderAccountStatus = staff.riderAccountStatus;
        changed = true;
      }
      if (staff.phone && (!users[existingIndex].phone || users[existingIndex].phone !== staff.phone)) {
        users[existingIndex].phone = staff.phone;
        changed = true;
      }
      if (changed) {
        modified = true;
        FirestoreService.saveUser(users[existingIndex]).catch(() => {
        });
      }
    }
  }
  if (modified) {
    await centralDb.saveUsers(users);
  }
}
app2.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.write("\n");
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const client = { id: clientId, res };
  sseClients.push(client);
  req.on("close", () => {
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});
app2.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Sahara Bakers Central Backend",
    version: centralDb.getData().version,
    updatedAt: centralDb.getData().updatedAt
  });
});
app2.get("/api/bootstrap", (req, res) => {
  const data = centralDb.getData();
  res.json({
    version: data.version,
    updatedAt: data.updatedAt,
    products: data.products,
    matkaConfig: data.matkaConfig,
    settings: data.settings,
    coupons: data.coupons,
    ordersCount: data.orders.length,
    riders: data.riders || [],
    deliveryZones: data.deliveryZones || [],
    printerConfig: data.printerConfig || { paperWidth: "58mm", autoCut: true }
  });
});
app2.get("/api/sync", (req, res) => {
  const data = centralDb.getData();
  res.json({
    version: data.version,
    updatedAt: data.updatedAt
  });
});
app2.get("/api/products", (req, res) => {
  res.json(centralDb.getProducts());
});
app2.post("/api/products", async (req, res) => {
  try {
    const actor = req.body.actor;
    const product = await centralDb.createProduct(req.body.product, actor);
    broadcastEvent("PRODUCT_CREATED", product);
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.put("/api/products/:id", async (req, res) => {
  try {
    const actor = req.body.actor;
    const updated = await centralDb.updateProduct(req.params.id, req.body.product, actor);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    broadcastEvent("PRODUCT_UPDATED", updated);
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.patch("/api/products/:id/price", async (req, res) => {
  try {
    const { price, actor } = req.body;
    if (typeof price !== "number" || price <= 0) {
      return res.status(400).json({ error: "Valid positive price required" });
    }
    const updated = await centralDb.updateProductPrice(req.params.id, price, actor);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    broadcastEvent("PRICE_UPDATED", { id: updated.id, newPrice: price, product: updated });
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.patch("/api/products/:id/availability", async (req, res) => {
  try {
    const { available, actor } = req.body;
    const updated = await centralDb.updateProductAvailability(req.params.id, Boolean(available), actor);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    broadcastEvent("AVAILABILITY_CHANGED", { id: updated.id, available, product: updated });
    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.delete("/api/products/:id", async (req, res) => {
  try {
    const actor = req.body.actor;
    const deleted = await centralDb.deleteProduct(req.params.id, actor);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    broadcastEvent("PRODUCT_DELETED", { id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/matka-config", (req, res) => {
  res.json(centralDb.getMatkaConfig());
});
app2.put("/api/matka-config", async (req, res) => {
  try {
    const actor = req.body.actor;
    const updated = await centralDb.updateMatkaConfig(req.body.config, actor);
    broadcastEvent("MATKA_CONFIG_UPDATED", updated);
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/settings", (req, res) => {
  res.json(centralDb.getSettings());
});
app2.put("/api/settings", async (req, res) => {
  try {
    const actor = req.body.actor;
    const updated = await centralDb.updateSettings(req.body.settings, actor);
    broadcastEvent("SETTINGS_UPDATED", updated);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/orders", (req, res) => {
  const role = req.query.role || "CUSTOMER";
  const userEmail = req.query.email?.toLowerCase().trim();
  const userId = req.query.userId?.trim();
  const userPhone = req.query.phone?.trim();
  const allOrders = centralDb.getOrders();
  if (["OWNER", "ADMIN", "MANAGER", "COUNTER"].includes(role)) {
    return res.json(allOrders);
  }
  if (role === "KITCHEN_STAFF") {
    const kitchenOrders = allOrders.filter(
      (o) => ["ORDER_PLACED", "ACCEPTED", "PREPARING", "READY"].includes(o.status) || new Date(o.createdAt).toDateString() === (/* @__PURE__ */ new Date()).toDateString()
    );
    return res.json(kitchenOrders);
  }
  if (role === "WAITER" || role === "ORDER_STAFF") {
    const waiterOrders = allOrders.filter(
      (o) => o.waiterId === userEmail || o.waiterId === userId || o.customerEmail === userEmail || o.orderType === "DINE_IN" || new Date(o.createdAt).toDateString() === (/* @__PURE__ */ new Date()).toDateString()
    );
    return res.json(waiterOrders);
  }
  if (role === "RIDER") {
    const riderOrders = allOrders.filter(
      (o) => o.riderId === userEmail || o.riderId === userId || o.fulfilmentType === "DELIVERY" && ["READY", "OUT_FOR_DELIVERY"].includes(o.status)
    );
    return res.json(riderOrders);
  }
  if (userEmail || userId || userPhone) {
    const customerOrders = allOrders.filter(
      (o) => userEmail && o.customerEmail?.toLowerCase() === userEmail || userId && o.customerId === userId || userPhone && o.customerPhone === userPhone
    );
    return res.json(customerOrders);
  }
  res.json([]);
});
app2.post("/api/orders", async (req, res) => {
  try {
    const { order, actor } = req.body;
    if (!order) return res.status(400).json({ error: "Order data required" });
    const existing = centralDb.getOrders().find(
      (o) => o.idempotencyKey && o.idempotencyKey === order.idempotencyKey && Date.now() - new Date(o.createdAt).getTime() < 3e5
    );
    if (existing) {
      return res.json({ success: true, order: existing, duplicate: true });
    }
    const created = await centralDb.createOrder(order, actor);
    broadcastEvent("NEW_ORDER", created);
    res.json({ success: true, order: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { status, actor, note } = req.body;
    if (!status || !actor) {
      return res.status(400).json({ error: "Status and actor required" });
    }
    const updated = await centralDb.updateOrderStatus(req.params.id, status, actor, note);
    if (!updated) return res.status(404).json({ error: "Order not found" });
    broadcastEvent("ORDER_STATUS_CHANGED", updated);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.patch("/api/orders/:id/payment", async (req, res) => {
  try {
    const { paymentStatus, actor, note } = req.body;
    if (!paymentStatus || !actor) {
      return res.status(400).json({ error: "paymentStatus and actor required" });
    }
    const updated = await centralDb.updateOrderPaymentStatus(req.params.id, paymentStatus, actor, note);
    if (!updated) return res.status(404).json({ error: "Order not found" });
    broadcastEvent("ORDER_PAYMENT_CHANGED", updated);
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.patch("/api/orders/:id/assign-rider", async (req, res) => {
  try {
    const { riderId, riderName, actor } = req.body;
    if (!riderId || !riderName || !actor) {
      return res.status(400).json({ error: "Rider details and actor required" });
    }
    const updated = await centralDb.assignRider(req.params.id, riderId, riderName, actor);
    if (!updated) return res.status(404).json({ error: "Order not found" });
    broadcastEvent("RIDER_ASSIGNED", updated);
    broadcastEvent("RIDER_STATUS_CHANGED", { riderId, riderName, status: "ASSIGNED" });
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.post("/api/orders/:id/reprint-receipt", async (req, res) => {
  try {
    const { receiptId, actor } = req.body;
    if (!actor) return res.status(400).json({ error: "Actor required" });
    const order = centralDb.getOrders().find((o) => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const audit = await centralDb.recordReceiptReprint(order.id, receiptId || `REC_${order.orderNumber}`, actor);
    broadcastEvent("RECEIPT_REPRINTED", { orderId: order.id, receiptId: receiptId || `REC_${order.orderNumber}`, actor });
    res.json({ success: true, order, auditLog: audit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/riders", (req, res) => {
  res.json(centralDb.getRiders());
});
app2.post("/api/riders", async (req, res) => {
  try {
    const { rider, actor } = req.body;
    if (!rider || !rider.name || !rider.phone) {
      return res.status(400).json({ error: "Rider name and phone required" });
    }
    const created = await centralDb.createRider(rider, actor);
    broadcastEvent("RIDER_CREATED", created);
    res.json({ success: true, rider: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.put("/api/riders/:id", async (req, res) => {
  try {
    const { updates, actor } = req.body;
    const updated = await centralDb.updateRider(req.params.id, updates, actor);
    if (!updated) return res.status(404).json({ error: "Rider not found" });
    broadcastEvent("RIDER_UPDATED", updated);
    res.json({ success: true, rider: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.patch("/api/riders/:id/status", async (req, res) => {
  try {
    const { status, actor } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });
    const updated = await centralDb.updateRiderStatus(req.params.id, status, actor);
    if (!updated) return res.status(404).json({ error: "Rider not found" });
    broadcastEvent("RIDER_STATUS_CHANGED", updated);
    res.json({ success: true, rider: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/delivery-zones", (req, res) => {
  res.json(centralDb.getDeliveryZones());
});
app2.put("/api/delivery-zones", async (req, res) => {
  try {
    const { zones, actor } = req.body;
    if (!Array.isArray(zones)) return res.status(400).json({ error: "Zones array required" });
    const updated = await centralDb.updateDeliveryZones(zones, actor);
    broadcastEvent("DELIVERY_ZONES_UPDATED", updated);
    res.json({ success: true, zones: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.post("/api/delivery/calculate", (req, res) => {
  try {
    const { distanceKm, subtotal } = req.body;
    const dist = typeof distanceKm === "number" ? distanceKm : 1.5;
    const orderSubtotal = typeof subtotal === "number" ? subtotal : 0;
    const settings = centralDb.getSettings();
    const zones = centralDb.getDeliveryZones();
    if (orderSubtotal >= settings.freeDeliveryThreshold) {
      return res.json({
        distanceKm: dist,
        fee: 0,
        isFreeDelivery: true,
        zoneName: "Free Delivery (Above Rs. 2000)",
        available: true
      });
    }
    const matchedZone = zones.find((z) => z.active && dist >= z.minDistanceKm && dist <= z.maxDistanceKm);
    if (matchedZone) {
      return res.json({
        distanceKm: dist,
        fee: matchedZone.fee,
        isFreeDelivery: false,
        zone: matchedZone,
        zoneName: matchedZone.name,
        estimatedMinutes: matchedZone.estimatedMinutes,
        available: true
      });
    }
    const maxConfiguredDistance = Math.max(...zones.filter((z) => z.active).map((z) => z.maxDistanceKm), 12);
    if (dist > maxConfiguredDistance) {
      return res.json({
        distanceKm: dist,
        fee: 0,
        available: false,
        outsideRange: true,
        message: "Sorry, this location is currently outside our standard delivery area."
      });
    }
    res.json({
      distanceKm: dist,
      fee: settings.standardDeliveryFee || 150,
      zoneName: "Standard Delivery Area",
      available: true
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/printer-config", (req, res) => {
  res.json(centralDb.getPrinterConfig());
});
app2.put("/api/printer-config", async (req, res) => {
  try {
    const { config, actor } = req.body;
    if (!config) return res.status(400).json({ error: "Config required" });
    const updated = await centralDb.updatePrinterConfig(config, actor);
    broadcastEvent("PRINTER_CONFIG_UPDATED", updated);
    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/history", (req, res) => {
  const role = req.query.role || "CUSTOMER";
  const userEmail = req.query.email?.toLowerCase();
  const search = req.query.search?.toLowerCase().trim();
  const statusFilter = req.query.status;
  const dateFilter = req.query.date;
  const page = parseInt(req.query.page) || 1;
  const limit2 = parseInt(req.query.limit) || 20;
  let allOrders = centralDb.getOrders();
  if (["OWNER", "ADMIN"].includes(role)) {
  } else if (role === "MANAGER") {
  } else if (role === "WAITER") {
    allOrders = allOrders.filter(
      (o) => o.waiterId === userEmail || o.customerEmail === userEmail || o.orderType === "DINE_IN"
    );
  } else if (role === "KITCHEN_STAFF") {
    allOrders = allOrders.filter(
      (o) => ["PREPARING", "READY", "ACCEPTED", "DELIVERED", "PICKED_UP"].includes(o.status)
    );
  } else if (role === "RIDER") {
    allOrders = allOrders.filter((o) => o.riderId === userEmail);
  } else {
    allOrders = allOrders.filter((o) => o.customerEmail?.toLowerCase() === userEmail);
  }
  if (search) {
    allOrders = allOrders.filter(
      (o) => o.orderNumber.toLowerCase().includes(search) || o.customerName.toLowerCase().includes(search) || o.customerPhone.includes(search) || o.items.some((i) => i.productName.toLowerCase().includes(search))
    );
  }
  if (statusFilter && statusFilter !== "ALL") {
    allOrders = allOrders.filter((o) => o.status === statusFilter);
  }
  if (dateFilter) {
    const now = /* @__PURE__ */ new Date();
    const todayStr = now.toISOString().split("T")[0];
    const yesterday = new Date(now.getTime() - 864e5);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (dateFilter === "today") {
      allOrders = allOrders.filter((o) => o.createdAt.startsWith(todayStr));
    } else if (dateFilter === "yesterday") {
      allOrders = allOrders.filter((o) => o.createdAt.startsWith(yesterdayStr));
    } else if (dateFilter !== "all") {
      allOrders = allOrders.filter((o) => o.createdAt.startsWith(dateFilter));
    }
  }
  const total = allOrders.length;
  const startIndex = (page - 1) * limit2;
  const pagedOrders = allOrders.slice(startIndex, startIndex + limit2);
  res.json({
    orders: pagedOrders,
    total,
    page,
    totalPages: Math.ceil(total / limit2) || 1,
    limit: limit2
  });
});
app2.get("/api/audit-logs", (req, res) => {
  const role = req.query.role;
  if (!["OWNER", "ADMIN", "MANAGER"].includes(role)) {
    return res.status(403).json({ error: "Forbidden: Access restricted to management" });
  }
  res.json(centralDb.getAuditLogs());
});
app2.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: "Identifier and password required" });
    }
    const cleanId = identifier.trim().toLowerCase();
    const users = centralDb.getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === cleanId || u.username && u.username.toLowerCase() === cleanId || u.phone && u.phone.replace(/\s+/g, "") === cleanId.replace(/\s+/g, "")
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const isValid = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    await centralDb.addAuditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: "USER_LOGIN",
      targetResource: "AUTH_SESSION",
      newValue: `Logged in with role ${user.role} (${user.email})`
    });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.post("/api/auth/change-password", async (req, res) => {
  try {
    const { identifier, currentPassword, newPassword } = req.body;
    if (!identifier || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "Identifier, current password, and new password required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" });
    }
    const cleanId = identifier.trim().toLowerCase();
    const users = centralDb.getUsers();
    const userIdx = users.findIndex(
      (u) => u.email.toLowerCase() === cleanId || u.username && u.username.toLowerCase() === cleanId
    );
    if (userIdx === -1) {
      return res.status(404).json({ error: "User account not found" });
    }
    const user = users[userIdx];
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: "Current password does not match" });
    }
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);
    users[userIdx].passwordSalt = newSalt;
    users[userIdx].passwordHash = newHash;
    users[userIdx].mustChangePassword = false;
    await centralDb.saveUsers(users);
    await FirestoreService.saveUser(users[userIdx]).catch(() => {
    });
    await centralDb.addAuditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: "PASSWORD_CHANGED",
      targetResource: "USER_ACCOUNT",
      newValue: `Password updated for ${user.email}`
    });
    res.json({ success: true, user: users[userIdx] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password required" });
    }
    const cleanEmail = email.trim().toLowerCase();
    const users = centralDb.getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || "").trim(),
      role: "CUSTOMER",
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      addresses: []
    };
    users.push(newUser);
    await centralDb.saveUsers(users);
    await centralDb.addAuditLog({
      actorEmail: newUser.email,
      actorRole: "CUSTOMER",
      action: "CUSTOMER_SIGNUP",
      targetResource: "USER_ACCOUNT",
      newValue: `Created customer account: ${newUser.name}`
    });
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app2.get("/api/users", (req, res) => {
  const role = req.query.role;
  if (!["OWNER", "ADMIN"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const sanitized = centralDb.getUsers().map(({ passwordHash, passwordSalt, ...safe }) => safe);
  res.json(sanitized);
});
async function startServer() {
  await ensureDefaultStaffAccounts();
  await centralDb.syncWithFirestore();
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = path2.resolve(process.cwd(), "dist");
    app2.use(express.static(distPath));
    app2.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sahara Bakers] Full-Stack Server running at http://0.0.0.0:${PORT} (env: ${isProd ? "production" : "development"})`);
  });
}
startServer().catch((err) => {
  console.error("[Sahara Bakers Server Error]:", err);
  process.exit(1);
});
