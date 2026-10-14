import React, { useState } from 'react';
import { AdminLayout, AdminTab } from './AdminLayout';
import { AdminOverview } from './AdminOverview';
import { AdminOrders } from './AdminOrders';
import { AdminMatkaPizza } from './AdminMatkaPizza';
import { AdminMenu } from './AdminMenu';
import { AdminPricing } from './AdminPricing';
import { AdminCoupons } from './AdminCoupons';
import { AdminCustomers } from './AdminCustomers';
import { AdminSettings } from './AdminSettings';
import { AdminAuditLogs } from './AdminAuditLogs';

export const AdminControlCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  return (
    <AdminLayout currentTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'overview' && <AdminOverview />}
      {activeTab === 'orders' && <AdminOrders />}
      {activeTab === 'matka' && <AdminMatkaPizza />}
      {activeTab === 'menu' && <AdminMenu />}
      {activeTab === 'pricing' && <AdminPricing />}
      {activeTab === 'coupons' && <AdminCoupons />}
      {activeTab === 'customers' && <AdminCustomers />}
      {activeTab === 'settings' && <AdminSettings />}
      {activeTab === 'audit' && <AdminAuditLogs />}
    </AdminLayout>
  );
};
