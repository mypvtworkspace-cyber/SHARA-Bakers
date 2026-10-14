import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    signup,
  } = useApp();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        const res = await login(identifier, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid credentials. Please verify and try again.');
        }
      } else {
        const res = await signup({ name, email: identifier, phone, password });
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h2 className="text-base font-bold font-display text-stone-900">
              {authModalMode === 'login' ? 'Sign In to Sahara Bakers' : 'Create Customer Account'}
            </h2>
            <p className="text-xs text-stone-500">
              {authModalMode === 'login' 
                ? 'Access your orders, saved addresses & quick checkout' 
                : 'Join Sahara Bakers for fast ordering and tracking'}
            </p>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authModalMode === 'signup' && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Asad Ullah"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-700 block mb-1">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0300 1234567"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
              Email Address / Username *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. customer@example.com"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-stone-700 block mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-700"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Authenticating...</span>
            ) : (
              <span>{authModalMode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          {/* Switch Mode */}
          <div className="pt-2 text-center text-xs text-stone-600">
            {authModalMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthModalMode('signup');
                  }}
                  className="font-semibold text-amber-800 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setAuthModalMode('login');
                  }}
                  className="font-semibold text-amber-800 hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
          {/* Quick Staff Access Credentials Helper */}
          {authModalMode === 'login' && (
            <div className="pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                  Staff & Operational Portals Quick Sign-In
                </span>
                <span className="text-[10px] text-stone-400 font-mono">pwd: sahara@123</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('sahara@bannu');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-medium transition-colors"
                >
                  Admin / Owner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('cooker@sahara');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200 rounded font-medium transition-colors"
                >
                  Kitchen Chef
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('counter@sahara');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded font-medium transition-colors"
                >
                  Counter Cashier
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('manager@sahara');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded font-medium transition-colors"
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('waiter@sahara');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded font-medium transition-colors"
                >
                  Waiter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('zubair@rider');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 rounded font-medium transition-colors"
                >
                  Rider: Zubair
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('shahnawaz@rider');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 rounded font-medium transition-colors"
                >
                  Rider: Shah Nawaz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('haroon@rider');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 rounded font-medium transition-colors"
                >
                  Rider: Haroon Niazi
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIdentifier('rohin@rider');
                    setPassword('sahara@123');
                    setErrorMsg(null);
                  }}
                  className="px-2 py-1.5 text-center bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200 rounded font-medium transition-colors"
                >
                  Rider: Rohin Riyaz
                </button>
              </div>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
