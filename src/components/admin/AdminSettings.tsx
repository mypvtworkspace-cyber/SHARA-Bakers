import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Database, RefreshCw, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { storage } from '../../services/storage';
import { apiClient } from '../../services/apiClient';
import { FirestoreService, testFirestoreConnection, type FirestoreDiagnosticResult } from '../../services/firestoreService';
import { BusinessSettings } from '../../types';

export const AdminSettings: React.FC = () => {
  const { settings, refreshData, currentUser } = useApp();
  const [form, setForm] = useState<BusinessSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [dbDiagnostic, setDbDiagnostic] = useState<FirestoreDiagnosticResult | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    const updatedForm: BusinessSettings = {
      ...form,
      creatorName: form.creatorName || 'Mr Zaheer',
      creatorCredit: form.creatorCredit || 'Designed & Developed by Mr Zaheer',
      creatorUrl: form.creatorUrl?.trim() || undefined,
      showCreatorCredit: form.showCreatorCredit !== false,
      logoUrl: form.logoUrl || '/assets/images/sahara_logo.jpg',
      easypaisaQrUrl: form.easypaisaQrUrl || '/assets/images/sahara_easypaisa_qr.png',
      easypaisaAccountTitle: form.easypaisaAccountTitle || 'Rahman Ullah Khan',
      easypaisaAccountNumber: form.easypaisaAccountNumber || '0333-8072589',
      projectMetadata: {
        businessName: form.businessName || 'Sahara Bakers',
        creatorName: form.creatorName || 'Mr Zaheer',
        creatorCredit: form.creatorCredit || 'Designed & Developed by Mr Zaheer',
        creatorUrl: form.creatorUrl?.trim() || undefined,
        updatedAt: new Date().toISOString(),
      },
    };
    storage.saveSettings(updatedForm);
    FirestoreService.saveSettings(updatedForm).catch(() => {});

    try {
      await apiClient.updateSettings(updatedForm, currentUser ? {
        email: currentUser.email,
        role: currentUser.role,
      } : undefined);
    } catch (err) {
      console.warn('[AdminSettings] Server sync fallback:', err);
    }

    if (currentUser) {
      storage.addAuditLog({
        actorEmail: currentUser.email,
        actorRole: currentUser.role,
        action: 'BUSINESS_SETTINGS_UPDATE',
        targetResource: 'BUSINESS_INFO',
        newValue: `Hours: ${updatedForm.openingTime}-${updatedForm.closingTime}, Open: ${updatedForm.isOpen}`,
      });
    }

    await refreshData();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-stone-900">
            Restaurant & Business Profile
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Sahara Bakers Bannu contact information, hours of operation & announcements
          </p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded shadow transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Business settings updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4 text-xs">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">Business Name</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Street Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Postal Code</label>
              <input
                type="text"
                value={form.postalCode}
                onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Telephone Contact</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">WhatsApp Order Support</label>
            <input
              type="text"
              value={form.whatsappPhone}
              onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Opening Time (24h or HH:mm)</label>
            <input
              type="text"
              value={form.openingTime}
              onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Closing Time</label>
            <input
              type="text"
              value={form.closingTime}
              onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded font-mono"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-stone-700 block mb-1">Top Announcement Banner</label>
            <input
              type="text"
              value={form.announcement || ''}
              onChange={(e) => setForm({ ...form, announcement: e.target.value })}
              placeholder="e.g. Fresh Clay-Pot Matka Pizza baked to order! Return your clay pot for Rs. 50 credit."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-stone-200 flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isOpen}
              onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
              className="rounded text-amber-700 focus:ring-amber-700"
            />
            <span className="font-semibold text-stone-800">Restaurant Currently Open</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.orderAcceptanceEnabled}
              onChange={(e) => setForm({ ...form, orderAcceptanceEnabled: e.target.checked })}
              className="rounded text-amber-700 focus:ring-amber-700"
            />
            <span className="font-semibold text-stone-800">Accept Online Orders</span>
          </label>
        </div>

      </form>

      {/* Official Brand & Receipt Assets (Section 15) */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-stone-200 pb-2.5">
          <div>
            <h3 className="font-bold text-sm text-stone-900">
              Official Brand & Thermal Receipt Assets
            </h3>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Authoritative receipt logo and EasyPaisa QR configurations for counter and mobile receipts.
            </p>
          </div>
          <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded">
            Verified Production Assets
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Logo Card */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <span className="font-bold text-stone-800 text-xs block">1. Sahara Bakers Official Logo</span>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-lg border border-stone-300 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="/assets/images/sahara_logo.jpg" 
                  alt="Sahara Bakers Logo" 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    // Fallback to bundled asset
                    (e.target as HTMLImageElement).src = '/src/assets/images/sahara_logo.jpg';
                  }}
                />
              </div>
              <div className="space-y-1 text-[11px] text-stone-600">
                <p className="font-semibold text-stone-900">Official Chef & Wheat Wreath Logo</p>
                <p>Status: <strong className="text-green-700">Active on ALL Receipts</strong></p>
                <p className="text-stone-400">Printed on Cash, EasyPaisa, Counter & History receipts.</p>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                Logo Asset Path / URL
              </label>
              <input
                type="text"
                value={form.logoUrl || '/assets/images/sahara_logo.jpg'}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                className="w-full p-2 bg-white border border-stone-300 rounded font-mono text-[11px]"
              />
            </div>
          </div>

          {/* EasyPaisa Card */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
            <span className="font-bold text-stone-800 text-xs block">2. EasyPaisa Payment Account & QR</span>
            <div className="flex items-center gap-4">
              <div className="w-20 h-24 bg-white rounded-lg border border-stone-300 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img 
                  src="/assets/images/sahara_easypaisa_qr.png" 
                  alt="Easypaisa QR Code" 
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    // Fallback to bundled asset
                    (e.target as HTMLImageElement).src = '/src/assets/images/sahara_easypaisa_qr.png';
                  }}
                />
              </div>
              <div className="space-y-1 text-[11px] text-stone-600">
                <p className="font-semibold text-stone-900">{form.easypaisaAccountTitle || 'Rahman Ullah Khan'}</p>
                <p className="font-mono font-bold text-stone-800">{form.easypaisaAccountNumber || '0333-8072589'}</p>
                <p>Status: <strong className="text-emerald-700">Active for EasyPaisa Orders</strong></p>
                <p className="text-stone-400">Printed on receipts when payment method is EasyPaisa.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">Account Title</label>
                <input
                  type="text"
                  value={form.easypaisaAccountTitle || 'Rahman Ullah Khan'}
                  onChange={(e) => setForm({ ...form, easypaisaAccountTitle: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded text-[11px]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">Mobile / Account #</label>
                <input
                  type="text"
                  value={form.easypaisaAccountNumber || '0333-8072589'}
                  onChange={(e) => setForm({ ...form, easypaisaAccountNumber: e.target.value })}
                  className="w-full p-2 bg-white border border-stone-300 rounded font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Information & Developer Credit Settings */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-stone-900 border-b border-stone-200 pb-2.5">
          Project Information & Website Developer Credit
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-stone-500 block text-[11px]">Business:</span>
            <span className="font-bold text-stone-900 text-sm">Sahara Bakers</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[11px]">Designed & Developed by:</span>
            <span className="font-bold text-stone-900 text-sm">{form.creatorName || 'Mr Zaheer'}</span>
          </div>
          <div>
            <span className="text-stone-500 block text-[11px]">Footer Credit Status:</span>
            <span className="font-semibold text-emerald-800">
              {form.showCreatorCredit !== false ? 'Active in Public Footer' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Developer Credit Controls */}
        <div className="pt-3 border-t border-stone-100 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.showCreatorCredit !== false}
              onChange={(e) => setForm({ ...form, showCreatorCredit: e.target.checked })}
              className="rounded text-amber-700 focus:ring-amber-700"
            />
            <span className="font-semibold text-stone-800">
              Display "Designed & Developed by Mr Zaheer" in Website Footer
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Developer Name
              </label>
              <input
                type="text"
                value={form.creatorName || 'Mr Zaheer'}
                onChange={(e) => setForm({ ...form, creatorName: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700 block mb-1">
                Credit Line Text
              </label>
              <input
                type="text"
                value={form.creatorCredit || 'Designed & Developed by Mr Zaheer'}
                onChange={(e) => setForm({ ...form, creatorCredit: e.target.value })}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded text-xs"
              />
            </div>
          </div>

          <div className="max-w-lg">
            <label className="font-semibold text-stone-700 block mb-1">
              Developer Profile / Portfolio URL (Optional)
            </label>
            <input
              type="url"
              value={form.creatorUrl || ''}
              onChange={(e) => setForm({ ...form, creatorUrl: e.target.value })}
              placeholder="Leave empty for non-clickable text credit"
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded text-xs font-mono"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              If left blank, "Mr Zaheer" is rendered as clean, non-clickable text in the public footer.
            </p>
          </div>
        </div>

        {/* Cloud Firestore Diagnostic Panel */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-700" />
                Cloud Firestore Database Connection
              </h3>
              <p className="text-xs text-stone-500">
                Tests SDK initialization against configuration and verifies server read/write on the 'test-connection' document.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                setTestingDb(true);
                try {
                  const res = await FirestoreService.testConnection();
                  setDbDiagnostic(res);
                } catch (err: any) {
                  setDbDiagnostic({
                    success: false,
                    message: err?.message || 'Connection test failed',
                    timestamp: new Date().toISOString(),
                    configVerification: {
                      matched: false,
                      projectId: { configured: '', initialized: undefined, matches: false },
                      appId: { configured: '', initialized: undefined, matches: false },
                      apiKey: { configured: '', initialized: undefined, matches: false },
                      firestoreDatabaseId: { configured: '', matches: false },
                    },
                    operationResult: {
                      documentPath: 'test-connection/diagnostic',
                      writeSuccess: false,
                      readSuccess: false,
                      dataMatches: false,
                      latencyMs: 0,
                    },
                    error: err?.message || String(err),
                  });
                } finally {
                  setTestingDb(false);
                }
              }}
              disabled={testingDb}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white rounded text-xs font-semibold shadow-sm transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingDb ? 'animate-spin' : ''}`} />
              {testingDb ? 'Testing Connection...' : 'Test Database Connection'}
            </button>
          </div>

          {dbDiagnostic && (
            <div className={`p-3 rounded-lg border text-xs space-y-2 ${
              dbDiagnostic.success 
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  {dbDiagnostic.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                  )}
                  {dbDiagnostic.success ? 'Firestore Connected & Operational' : 'Connection Test Failed'}
                </span>
                <span className="text-[11px] opacity-75 font-mono">
                  {dbDiagnostic.operationResult.latencyMs}ms latency
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {dbDiagnostic.message}
              </p>
              <div className="pt-2 border-t border-current/10 grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                <div>Project: {dbDiagnostic.configVerification.projectId.configured}</div>
                <div>Target DB: {dbDiagnostic.configVerification.firestoreDatabaseId.configured || '(default)'}</div>
                <div>Doc Path: {dbDiagnostic.operationResult.documentPath}</div>
                <div>Read/Write Status: {dbDiagnostic.operationResult.writeSuccess && dbDiagnostic.operationResult.readSuccess ? 'Verified (Read + Write OK)' : 'Failed'}</div>
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] text-stone-400 pt-2 border-t border-stone-100">
          Official restaurant ordering & operations platform for Sahara Bakers, Railway Road, Bannu, Pakistan.
        </p>
      </div>

    </div>
  );
};
