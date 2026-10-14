import { User, UserRole } from '../types';
import { storage } from './storage';
import { hashPassword, generateSalt, verifyPassword } from './crypto';
import { FirestoreService } from './firestoreService';

export class AuthService {
  /**
   * Log in user using email/username and password.
   * Admin enters "sahara@bannu" into the standard email field with password "sahara@123".
   */
  public async login(identifier: string, plaintextPassword: string): Promise<{ success: boolean; user?: User; error?: string }> {
    await storage.initialize();
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !plaintextPassword) {
      return { success: false, error: 'Please enter both your email and password.' };
    }

    // Attempt central server authentication
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, password: plaintextPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          storage.setCurrentUser(data.user);
          FirestoreService.saveUser(data.user).catch(() => {});
          return { success: true, user: data.user };
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error) {
          return { success: false, error: errData.error };
        }
      }
    } catch {
      // Server unreachable, fallback to verified local credentials
    }

    const users = storage.getUsers();
    const user = users.find(u => 
      u.email.toLowerCase() === cleanId ||
      (u.username && u.username.toLowerCase() === cleanId) ||
      (u.phone && u.phone.replace(/\s+/g, '') === cleanId.replace(/\s+/g, ''))
    );
    if (!user) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    const isValid = await verifyPassword(plaintextPassword, user.passwordSalt, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password. Please check your credentials.' };
    }

    // Set current active session
    storage.setCurrentUser(user);
    storage.addAuditLog({
      actorEmail: user.email,
      actorRole: user.role,
      action: 'USER_LOGIN',
      targetResource: 'AUTH_SESSION',
      newValue: `Logged in with role ${user.role}`,
    });

    return { success: true, user };
  }

  /**
   * Change password for the current or specified user
   */
  public async changePassword(identifier: string, currentPass: string, newPass: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const cleanId = identifier.trim().toLowerCase();
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanId, currentPassword: currentPass, newPassword: newPass }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        storage.setCurrentUser(data.user);
        return { success: true, user: data.user };
      }
      if (data.error) {
        return { success: false, error: data.error };
      }
    } catch {
      // Local fallback
    }

    const users = storage.getUsers();
    const idx = users.findIndex(u => 
      u.email.toLowerCase() === cleanId || 
      (u.username && u.username.toLowerCase() === cleanId)
    );
    if (idx === -1) return { success: false, error: 'User account not found.' };

    const user = users[idx];
    const isCurrentValid = await verifyPassword(currentPass, user.passwordSalt, user.passwordHash);
    if (!isCurrentValid) {
      return { success: false, error: 'Current password does not match.' };
    }

    const newSalt = generateSalt();
    const newHash = await hashPassword(newPass, newSalt);
    users[idx].passwordSalt = newSalt;
    users[idx].passwordHash = newHash;
    users[idx].mustChangePassword = false;

    storage.saveUsers(users);
    storage.setCurrentUser(users[idx]);
    FirestoreService.saveUser(users[idx]).catch(() => {});

    return { success: true, user: users[idx] };
  }

  /**
   * Register a new customer.
   */
  public async signup(params: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ success: boolean; user?: User; error?: string }> {
    await storage.initialize();
    const cleanEmail = params.email.trim().toLowerCase();

    if (!params.name.trim()) {
      return { success: false, error: 'Please enter your full name.' };
    }
    if (!cleanEmail || !cleanEmail.includes('@') && !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (params.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const users = storage.getUsers();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'An account with this email already exists. Please log in instead.' };
    }

    const salt = generateSalt();
    const hash = await hashPassword(params.password, salt);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      email: cleanEmail,
      phone: params.phone.trim(),
      role: 'CUSTOMER',
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
      addresses: [],
    };

    users.push(newUser);
    storage.saveUsers(users);
    storage.setCurrentUser(newUser);
    FirestoreService.saveUser(newUser).catch(() => {});

    storage.addAuditLog({
      actorEmail: newUser.email,
      actorRole: 'CUSTOMER',
      action: 'CUSTOMER_SIGNUP',
      targetResource: 'USER_ACCOUNT',
      newValue: `Account created for ${newUser.name}`,
    });

    return { success: true, user: newUser };
  }

  public logout(): void {
    const current = storage.getCurrentUser();
    if (current) {
      storage.addAuditLog({
        actorEmail: current.email,
        actorRole: current.role,
        action: 'USER_LOGOUT',
        targetResource: 'AUTH_SESSION',
      });
    }
    storage.setCurrentUser(null);
  }

  public getCurrentUser(): User | null {
    return storage.getCurrentUser();
  }

  public updateUserProfile(updated: Partial<User>): { success: boolean; user?: User; error?: string } {
    const current = storage.getCurrentUser();
    if (!current) return { success: false, error: 'Not authenticated' };

    const users = storage.getUsers();
    const idx = users.findIndex(u => u.id === current.id);
    if (idx === -1) return { success: false, error: 'User record not found' };

    const merged = { ...users[idx], ...updated };
    // Prevent client from escalating their own role
    if (current.role === 'CUSTOMER') {
      merged.role = 'CUSTOMER';
    }

    users[idx] = merged;
    storage.saveUsers(users);
    storage.setCurrentUser(merged);

    return { success: true, user: merged };
  }

  // --- Authoritative RBAC helpers ---
  public static canAccessAdmin(user: User | null): boolean {
    if (!user) return false;
    return ['OWNER', 'ADMIN'].includes(user.role);
  }

  public static canAccessManager(user: User | null): boolean {
    if (!user) return false;
    return ['OWNER', 'ADMIN', 'MANAGER'].includes(user.role);
  }

  public static canAccessWaiter(user: User | null): boolean {
    if (!user) return false;
    return ['OWNER', 'ADMIN', 'MANAGER', 'WAITER', 'ORDER_STAFF'].includes(user.role);
  }

  public static canAccessKitchen(user: User | null): boolean {
    if (!user) return false;
    return ['OWNER', 'ADMIN', 'MANAGER', 'KITCHEN_STAFF'].includes(user.role);
  }

  public static canAccessRider(user: User | null): boolean {
    if (!user) return false;
    return ['OWNER', 'ADMIN', 'MANAGER', 'RIDER'].includes(user.role);
  }

  public static canAccessCounter(user: User | null): boolean {
    if (!user) return false;
    return ['OWNER', 'ADMIN', 'MANAGER', 'COUNTER'].includes(user.role);
  }

  public static canConfirmPayment(user: User | null): boolean {
    if (!user) return false;
    return ['OWNER', 'ADMIN', 'MANAGER', 'COUNTER'].includes(user.role);
  }

  public static isStaff(user: User | null): boolean {
    if (!user) return false;
    return user.role !== 'CUSTOMER';
  }
}

export const authService = new AuthService();
