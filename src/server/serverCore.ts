import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { centralDb } from './db';
import { hashPassword, generateSalt, verifyPassword } from '../services/crypto';
import { User, UserRole, OrderStatus } from '../types';
import { FirestoreService } from '../services/firestoreService';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Server-Sent Events subscribers
type SseClient = { id: string; res: express.Response };
const sseClients: SseClient[] = [];

function broadcastEvent(eventType: string, payload: any) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: new Date().toISOString() });
  for (const client of sseClients) {
    try {
      client.res.write(`event: message\ndata: ${data}\n\n`);
    } catch {
      // Handled by close event
    }
  }
}

// Ensure default staff and owner accounts exist in the central database
async function ensureDefaultStaffAccounts() {
  const users = centralDb.getUsers();
  const staffToSeed: { 
    email: string; 
    name: string; 
    role: UserRole; 
    pass: string; 
    phone: string;
    username?: string;
    riderAccountStatus?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED';
    mustChangePassword?: boolean;
    id?: string;
  }[] = [
    { email: 'sahara@bannu', name: 'Sahara Admin & Owner', role: 'OWNER', pass: 'sahara@123', phone: '+92 330 5868488' },
    
    // Requested Individual Riders
    { 
      email: 'shahnawaz@rider', 
      username: 'shahnawaz@rider', 
      name: 'Shah Nawaz', 
      role: 'RIDER', 
      pass: 'sahara@123', 
      phone: '+923350507308',
      riderAccountStatus: 'ACTIVE',
      mustChangePassword: true,
      id: 'usr_rider_shahnawaz',
    },
    { 
      email: 'haroon@rider', 
      username: 'haroon@rider', 
      name: 'Haroon Niazi', 
      role: 'RIDER', 
      pass: 'sahara@123', 
      phone: '+923322533155',
      riderAccountStatus: 'PENDING_VERIFICATION',
      mustChangePassword: true,
      id: 'usr_rider_haroon',
    },
    { 
      email: 'rohin@rider', 
      username: 'rohin@rider', 
      name: 'Rohin Riyaz', 
      role: 'RIDER', 
      pass: 'sahara@123', 
      phone: '+923348944901',
      riderAccountStatus: 'PENDING_VERIFICATION',
      mustChangePassword: true,
      id: 'usr_rider_rohin',
    },

    // Operational staff
    { email: 'cooker@sahara', name: 'Ustad Farhan (Kitchen Cooker)', role: 'KITCHEN_STAFF', pass: 'sahara@123', phone: '+92 330 5868491' },
    { email: 'manager@sahara', name: 'Tariq Khan (Manager)', role: 'MANAGER', pass: 'sahara@123', phone: '+92 330 5868489' },
    { email: 'waiter@sahara', name: 'Bilal Ahmed (Floor Waiter)', role: 'WAITER', pass: 'sahara@123', phone: '+92 330 5868490' },
    { email: 'counter@sahara', name: 'Rashid Khan (Counter Cashier)', role: 'COUNTER', pass: 'sahara@123', phone: '+92 330 5868493' },

    // Zubair Rider Account
    { 
      email: 'zubair@rider', 
      username: 'zubair@rider', 
      name: 'Zubair', 
      role: 'RIDER', 
      pass: 'sahara@123', 
      phone: '+92 330 5868492',
      riderAccountStatus: 'ACTIVE',
      mustChangePassword: false,
      id: 'usr_rider_zubair',
    },

    // Legacy general rider alias for fallback
    { email: 'rider@sahara', username: 'rider@sahara', name: 'Zubair Ali (Delivery Captain)', role: 'RIDER', pass: 'sahara@123', phone: '+92 330 5868492', riderAccountStatus: 'ACTIVE' },
  ];

  let modified = false;
  for (const staff of staffToSeed) {
    const existingIndex = users.findIndex(u => 
      u.email.toLowerCase() === staff.email.toLowerCase() ||
      (staff.username && u.username && u.username.toLowerCase() === staff.username.toLowerCase())
    );

    if (existingIndex === -1) {
      const salt = generateSalt();
      const hash = await hashPassword(staff.pass, salt);
      const newUser: User = {
        id: staff.id || `usr_${staff.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: staff.name,
        email: staff.email,
        username: staff.username || staff.email,
        phone: staff.phone,
        role: staff.role,
        passwordHash: hash,
        passwordSalt: salt,
        createdAt: new Date().toISOString(),
        mustChangePassword: staff.mustChangePassword ?? false,
        riderAccountStatus: staff.riderAccountStatus,
      };
      users.push(newUser);
      modified = true;
      FirestoreService.saveUser(newUser).catch(() => {});
    } else {
      // Ensure properties (username, status, phone) are properly linked on existing record
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
        FirestoreService.saveUser(users[existingIndex]).catch(() => {});
      }
    }
  }

  if (modified) {
    await centralDb.saveUsers(users);
  }
}

// -------------------------------------------------------------
// SSE Real-time Synchronizer Endpoint
// -------------------------------------------------------------
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write('\n');

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const client: SseClient = { id: clientId, res };
  sseClients.push(client);

  req.on('close', () => {
    const idx = sseClients.findIndex(c => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// -------------------------------------------------------------
// Centralized REST API Endpoints
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Sahara Bakers Central Backend',
    version: centralDb.getData().version,
    updatedAt: centralDb.getData().updatedAt,
  });
});

// Bootstrap / Initial state fetch for clients
app.get('/api/bootstrap', (req, res) => {
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
    printerConfig: data.printerConfig || { paperWidth: '58mm', autoCut: true },
  });
});

// Version check for polling fallback
app.get('/api/sync', (req, res) => {
  const data = centralDb.getData();
  res.json({
    version: data.version,
    updatedAt: data.updatedAt,
  });
});

// Products
app.get('/api/products', (req, res) => {
  res.json(centralDb.getProducts());
});

app.post('/api/products', async (req, res) => {
  try {
    const actor = req.body.actor;
    const product = await centralDb.createProduct(req.body.product, actor);
    broadcastEvent('PRODUCT_CREATED', product);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const actor = req.body.actor;
    const updated = await centralDb.updateProduct(req.params.id, req.body.product, actor);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    broadcastEvent('PRODUCT_UPDATED', updated);
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id/price', async (req, res) => {
  try {
    const { price, actor } = req.body;
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ error: 'Valid positive price required' });
    }
    const updated = await centralDb.updateProductPrice(req.params.id, price, actor);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    broadcastEvent('PRICE_UPDATED', { id: updated.id, newPrice: price, product: updated });
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/products/:id/availability', async (req, res) => {
  try {
    const { available, actor } = req.body;
    const updated = await centralDb.updateProductAvailability(req.params.id, Boolean(available), actor);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    broadcastEvent('AVAILABILITY_CHANGED', { id: updated.id, available, product: updated });
    res.json({ success: true, product: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const actor = req.body.actor;
    const deleted = await centralDb.deleteProduct(req.params.id, actor);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    broadcastEvent('PRODUCT_DELETED', { id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Matka Pizza Config
app.get('/api/matka-config', (req, res) => {
  res.json(centralDb.getMatkaConfig());
});

app.put('/api/matka-config', async (req, res) => {
  try {
    const actor = req.body.actor;
    const updated = await centralDb.updateMatkaConfig(req.body.config, actor);
    broadcastEvent('MATKA_CONFIG_UPDATED', updated);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Business Settings
app.get('/api/settings', (req, res) => {
  res.json(centralDb.getSettings());
});

app.put('/api/settings', async (req, res) => {
  try {
    const actor = req.body.actor;
    const updated = await centralDb.updateSettings(req.body.settings, actor);
    broadcastEvent('SETTINGS_UPDATED', updated);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Orders with server-side RBAC
app.get('/api/orders', (req, res) => {
  const role = (req.query.role as UserRole) || 'CUSTOMER';
  const userEmail = (req.query.email as string)?.toLowerCase().trim();
  const userId = (req.query.userId as string)?.trim();
  const userPhone = (req.query.phone as string)?.trim();
  const allOrders = centralDb.getOrders();

  // RBAC Filter
  if (['OWNER', 'ADMIN', 'MANAGER', 'COUNTER'].includes(role)) {
    return res.json(allOrders);
  }
  if (role === 'KITCHEN_STAFF') {
    // Kitchen sees active and recent orders
    const kitchenOrders = allOrders.filter(o => 
      ['ORDER_PLACED', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status) ||
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    );
    return res.json(kitchenOrders);
  }
  if (role === 'WAITER' || role === 'ORDER_STAFF') {
    // Waiter sees orders they created or dine-in orders or today's orders
    const waiterOrders = allOrders.filter(o => 
      o.waiterId === userEmail || 
      o.waiterId === userId ||
      o.customerEmail === userEmail ||
      o.orderType === 'DINE_IN' || 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    );
    return res.json(waiterOrders);
  }
  if (role === 'RIDER') {
    // Rider sees assigned deliveries and orders needing pickup
    const riderOrders = allOrders.filter(o => 
      o.riderId === userEmail ||
      o.riderId === userId ||
      (o.fulfilmentType === 'DELIVERY' && ['READY', 'OUT_FOR_DELIVERY'].includes(o.status))
    );
    return res.json(riderOrders);
  }

  // Customer: orders matching userEmail OR customerId OR customerPhone
  if (userEmail || userId || userPhone) {
    const customerOrders = allOrders.filter(o => 
      (userEmail && o.customerEmail?.toLowerCase() === userEmail) ||
      (userId && o.customerId === userId) ||
      (userPhone && o.customerPhone === userPhone)
    );
    return res.json(customerOrders);
  }

  res.json([]);
});

app.post('/api/orders', async (req, res) => {
  try {
    const { order, actor } = req.body;
    if (!order) return res.status(400).json({ error: 'Order data required' });

    // Idempotency protection check
    const existing = centralDb.getOrders().find(
      o => o.idempotencyKey && o.idempotencyKey === order.idempotencyKey &&
      Date.now() - new Date(o.createdAt).getTime() < 300000
    );
    if (existing) {
      return res.json({ success: true, order: existing, duplicate: true });
    }

    const created = await centralDb.createOrder(order, actor);
    broadcastEvent('NEW_ORDER', created);
    res.json({ success: true, order: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, actor, note } = req.body;
    if (!status || !actor) {
      return res.status(400).json({ error: 'Status and actor required' });
    }
    const updated = await centralDb.updateOrderStatus(req.params.id, status as OrderStatus, actor, note);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    broadcastEvent('ORDER_STATUS_CHANGED', updated);
    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, actor, note } = req.body;
    if (!paymentStatus || !actor) {
      return res.status(400).json({ error: 'paymentStatus and actor required' });
    }
    const updated = await centralDb.updateOrderPaymentStatus(req.params.id, paymentStatus, actor, note);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    broadcastEvent('ORDER_PAYMENT_CHANGED', updated);
    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/orders/:id/assign-rider', async (req, res) => {
  try {
    const { riderId, riderName, actor } = req.body;
    if (!riderId || !riderName || !actor) {
      return res.status(400).json({ error: 'Rider details and actor required' });
    }
    const updated = await centralDb.assignRider(req.params.id, riderId, riderName, actor);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    broadcastEvent('RIDER_ASSIGNED', updated);
    broadcastEvent('RIDER_STATUS_CHANGED', { riderId, riderName, status: 'ASSIGNED' });
    res.json({ success: true, order: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Thermal Receipt Reprint Audit & Verification
app.post('/api/orders/:id/reprint-receipt', async (req, res) => {
  try {
    const { receiptId, actor } = req.body;
    if (!actor) return res.status(400).json({ error: 'Actor required' });
    const order = centralDb.getOrders().find(o => o.id === req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const audit = await centralDb.recordReceiptReprint(order.id, receiptId || `REC_${order.orderNumber}`, actor);
    broadcastEvent('RECEIPT_REPRINTED', { orderId: order.id, receiptId: receiptId || `REC_${order.orderNumber}`, actor });
    res.json({ success: true, order, auditLog: audit });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Riders Management API
app.get('/api/riders', (req, res) => {
  res.json(centralDb.getRiders());
});

app.post('/api/riders', async (req, res) => {
  try {
    const { rider, actor } = req.body;
    if (!rider || !rider.name || !rider.phone) {
      return res.status(400).json({ error: 'Rider name and phone required' });
    }
    const created = await centralDb.createRider(rider, actor);
    broadcastEvent('RIDER_CREATED', created);
    res.json({ success: true, rider: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/riders/:id', async (req, res) => {
  try {
    const { updates, actor } = req.body;
    const updated = await centralDb.updateRider(req.params.id, updates, actor);
    if (!updated) return res.status(404).json({ error: 'Rider not found' });
    broadcastEvent('RIDER_UPDATED', updated);
    res.json({ success: true, rider: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/riders/:id/status', async (req, res) => {
  try {
    const { status, actor } = req.body;
    if (!status) return res.status(400).json({ error: 'Status required' });
    const updated = await centralDb.updateRiderStatus(req.params.id, status, actor);
    if (!updated) return res.status(404).json({ error: 'Rider not found' });
    broadcastEvent('RIDER_STATUS_CHANGED', updated);
    res.json({ success: true, rider: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery Zones API
app.get('/api/delivery-zones', (req, res) => {
  res.json(centralDb.getDeliveryZones());
});

app.put('/api/delivery-zones', async (req, res) => {
  try {
    const { zones, actor } = req.body;
    if (!Array.isArray(zones)) return res.status(400).json({ error: 'Zones array required' });
    const updated = await centralDb.updateDeliveryZones(zones, actor);
    broadcastEvent('DELIVERY_ZONES_UPDATED', updated);
    res.json({ success: true, zones: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/delivery/calculate', (req, res) => {
  try {
    const { distanceKm, subtotal } = req.body;
    const dist = typeof distanceKm === 'number' ? distanceKm : 1.5;
    const orderSubtotal = typeof subtotal === 'number' ? subtotal : 0;
    const settings = centralDb.getSettings();
    const zones = centralDb.getDeliveryZones();

    // Check free delivery threshold
    if (orderSubtotal >= settings.freeDeliveryThreshold) {
      return res.json({
        distanceKm: dist,
        fee: 0,
        isFreeDelivery: true,
        zoneName: 'Free Delivery (Above Rs. 2000)',
        available: true,
      });
    }

    const matchedZone = zones.find(z => z.active && dist >= z.minDistanceKm && dist <= z.maxDistanceKm);
    if (matchedZone) {
      return res.json({
        distanceKm: dist,
        fee: matchedZone.fee,
        isFreeDelivery: false,
        zone: matchedZone,
        zoneName: matchedZone.name,
        estimatedMinutes: matchedZone.estimatedMinutes,
        available: true,
      });
    }

    // Beyond max zone
    const maxConfiguredDistance = Math.max(...zones.filter(z => z.active).map(z => z.maxDistanceKm), 12);
    if (dist > maxConfiguredDistance) {
      return res.json({
        distanceKm: dist,
        fee: 0,
        available: false,
        outsideRange: true,
        message: 'Sorry, this location is currently outside our standard delivery area.',
      });
    }

    // Fallback standard fee
    res.json({
      distanceKm: dist,
      fee: settings.standardDeliveryFee || 150,
      zoneName: 'Standard Delivery Area',
      available: true,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Thermal Printer Config API
app.get('/api/printer-config', (req, res) => {
  res.json(centralDb.getPrinterConfig());
});

app.put('/api/printer-config', async (req, res) => {
  try {
    const { config, actor } = req.body;
    if (!config) return res.status(400).json({ error: 'Config required' });
    const updated = await centralDb.updatePrinterConfig(config, actor);
    broadcastEvent('PRINTER_CONFIG_UPDATED', updated);
    res.json({ success: true, config: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Role-Based Centralized History Query
app.get('/api/history', (req, res) => {
  const role = (req.query.role as UserRole) || 'CUSTOMER';
  const userEmail = (req.query.email as string)?.toLowerCase();
  const search = (req.query.search as string)?.toLowerCase().trim();
  const statusFilter = req.query.status as string;
  const dateFilter = req.query.date as string; // 'today', 'yesterday', or specific date YYYY-MM-DD
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  let allOrders = centralDb.getOrders();

  // Role Scope
  if (['OWNER', 'ADMIN'].includes(role)) {
    // Owner sees complete operational & audit history
  } else if (role === 'MANAGER') {
    // Manager sees all operational orders
  } else if (role === 'WAITER') {
    allOrders = allOrders.filter(o => 
      o.waiterId === userEmail || 
      o.customerEmail === userEmail ||
      o.orderType === 'DINE_IN'
    );
  } else if (role === 'KITCHEN_STAFF') {
    allOrders = allOrders.filter(o => 
      ['PREPARING', 'READY', 'ACCEPTED', 'DELIVERED', 'PICKED_UP'].includes(o.status)
    );
  } else if (role === 'RIDER') {
    allOrders = allOrders.filter(o => o.riderId === userEmail);
  } else {
    // Customer
    allOrders = allOrders.filter(o => o.customerEmail?.toLowerCase() === userEmail);
  }

  // Filter by Search
  if (search) {
    allOrders = allOrders.filter(o => 
      o.orderNumber.toLowerCase().includes(search) ||
      o.customerName.toLowerCase().includes(search) ||
      o.customerPhone.includes(search) ||
      o.items.some(i => i.productName.toLowerCase().includes(search))
    );
  }

  // Filter by Status
  if (statusFilter && statusFilter !== 'ALL') {
    allOrders = allOrders.filter(o => o.status === statusFilter);
  }

  // Filter by Date
  if (dateFilter) {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      allOrders = allOrders.filter(o => o.createdAt.startsWith(todayStr));
    } else if (dateFilter === 'yesterday') {
      allOrders = allOrders.filter(o => o.createdAt.startsWith(yesterdayStr));
    } else if (dateFilter !== 'all') {
      allOrders = allOrders.filter(o => o.createdAt.startsWith(dateFilter));
    }
  }

  const total = allOrders.length;
  const startIndex = (page - 1) * limit;
  const pagedOrders = allOrders.slice(startIndex, startIndex + limit);

  res.json({
    orders: pagedOrders,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    limit,
  });
});

// Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const role = req.query.role as UserRole;
  if (!['OWNER', 'ADMIN', 'MANAGER'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden: Access restricted to management' });
  }
  res.json(centralDb.getAuditLogs());
});

// Auth
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password required' });
    }
    const cleanId = identifier.trim().toLowerCase();
    const users = centralDb.getUsers();
    // Allow login by email or username (or phone)
    const user = users.find(u => 
      u.email.toLowerCase() === cleanId || 
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.phone && u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
    );
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await centralDb.addAuditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetResource: 'AUTH_SESSION',
      newValue: `Logged in with role ${user.role} (${user.email})`,
    });

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password Endpoint (Supports first-login required password change)
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { identifier, currentPassword, newPassword } = req.body;
    if (!identifier || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Identifier, current password, and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const cleanId = identifier.trim().toLowerCase();
    const users = centralDb.getUsers();
    const userIdx = users.findIndex(u => 
      u.email.toLowerCase() === cleanId || 
      (u.username && u.username.toLowerCase() === cleanId)
    );
    if (userIdx === -1) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const user = users[userIdx];
    const isCurrentValid = await verifyPassword(currentPassword, user.passwordSalt, user.passwordHash);
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password does not match' });
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);
    users[userIdx].passwordSalt = newSalt;
    users[userIdx].passwordHash = newHash;
    users[userIdx].mustChangePassword = false;

    await centralDb.saveUsers(users);
    await FirestoreService.saveUser(users[userIdx]).catch(() => {});

    await centralDb.addAuditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PASSWORD_CHANGED',
      targetResource: 'USER_ACCOUNT',
      newValue: `Password updated for ${user.email}`,
    });

    res.json({ success: true, user: users[userIdx] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }
    const cleanEmail = email.trim().toLowerCase();
    const users = centralDb.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = generateSalt();
    const hash = await hashPassword(password, salt);
    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      role: 'CUSTOMER',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      addresses: [],
    };

    users.push(newUser);
    await centralDb.saveUsers(users);

    await centralDb.addAuditLog({
      actorEmail: newUser.email,
      actorRole: 'CUSTOMER',
      action: 'CUSTOMER_SIGNUP',
      targetResource: 'USER_ACCOUNT',
      newValue: `Created customer account: ${newUser.name}`,
    });

    res.json({ success: true, user: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Staff List for Admin/Owner
app.get('/api/users', (req, res) => {
  const role = req.query.role as UserRole;
  if (!['OWNER', 'ADMIN'].includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Strip password hash and salt from response for security
  const sanitized = centralDb.getUsers().map(({ passwordHash, passwordSalt, ...safe }) => safe);
  res.json(sanitized);
});

// Start Server and Mount Frontend
async function startServer() {
  await ensureDefaultStaffAccounts();
  await centralDb.syncWithFirestore();

  if (!isProd) {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build from dist
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Sahara Bakers] Full-Stack Server running at http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('[Sahara Bakers Server Error]:', err);
  process.exit(1);
});
