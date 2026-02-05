'use client';

import { useEffect, useState, useCallback } from 'react';
import CardPaymentForm, { CardPaymentValue } from '../../components/CardPaymentForm';
import DashboardLayout from '../../components/DashboardLayout';

interface Profile {
  id: number;
  username: string;
  fullname: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  currency?: string;
  job_type?: string;
  job_subcategory?: string;
  is_paid?: boolean;
  created_at?: string;
  verified?: boolean;
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [subscription, setSubscription] = useState<any>(null);
  const [payValue, setPayValue] = useState<CardPaymentValue>({ card_number: '', expiry_month: '', expiry_year: '', billing_address: '', postal_code: '' });
  const [paymentValid, setPaymentValid] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'monthly' | 'yearly'>('monthly');
  const [verifying, setVerifying] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;
      const res = await fetch('http://localhost:3001/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm({
          fullname: data.fullname || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          country: data.country || '',
          currency: data.currency || '',
          job_type: data.job_type || '',
          job_subcategory: data.job_subcategory || ''
        });
        // Load subscription details
        try {
          const subRes = await fetch('http://localhost:3001/api/subscription', { headers: { Authorization: `Bearer ${token}` } });
          if (subRes.ok) {
            const sub = await subRes.json();
            setSubscription(sub);
          }
        } catch {}
        // Load verification status (fallback to profile.verified if present)
        try {
          const vRes = await fetch('http://localhost:3001/api/user/verification', { headers: { Authorization: `Bearer ${token}` } });
          if (vRes.ok) {
            const v = await vRes.json();
            setProfile((p) => p ? { ...p, verified: v.verified } : p);
          }
        } catch {}
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(t);
  }, [loadProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully');
        if (data.profile) setProfile(data.profile);
      } else {
        setMessage(data.error || 'Update failed');
      }
    } catch (e) {
      console.error('Failed to save profile', e);
      setMessage('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <section className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">⚙️</span>
              Settings
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Manage your account preferences and application settings
            </p>
          </div>
        </div>

        {/* Profile Edit */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Edit Profile</h2>
            {profile && (
              <span className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                Username: <span className="font-medium text-powerbi-gray-900 dark:text-white">{profile.username}</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.fullname || ''}
                  onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Country</label>
                <input
                  type="text"
                  value={form.country || ''}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Currency</label>
                <select
                  value={form.currency || ''}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Profession</label>
                <select
                  value={form.job_type || ''}
                  onChange={(e) => setForm({ ...form, job_type: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                >
                  <option value="">Select</option>
                  <option value="freelancer">Freelancer</option>
                  <option value="businessman">Business</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Specialization</label>
                <input
                  type="text"
                  value={form.job_subcategory || ''}
                  onChange={(e) => setForm({ ...form, job_subcategory: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
            </div>

            {message && (
              <div className="p-3 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <p className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300">{message}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 disabled:bg-powerbi-gray-400 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap w-full sm:w-auto"
              >
                <span className="w-5 h-5">💾</span>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Subscription & Payment */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Subscription & Payment</h2>
            {subscription && (
              <span className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                Plan: <span className="font-medium text-powerbi-gray-900 dark:text-white">{subscription.plan_type || 'free'}</span>
              </span>
            )}
          </div>
          {profile && !profile.is_paid ? (
            <div>
              <div className="p-4 rounded-xl border border-powerbi-blue-200 bg-powerbi-blue-50 dark:border-powerbi-gray-700 dark:bg-powerbi-gray-700/40 mb-4">
                <p className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300">You are on Free. Enjoy full access during your 7-day trial. Upgrade to Pro to keep all features.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <button type="button" onClick={() => setUpgradePlan('monthly')} className={`p-3 rounded-lg border ${upgradePlan === 'monthly' ? 'border-powerbi-primary bg-powerbi-blue-50 dark:bg-powerbi-blue-900/20' : 'border-powerbi-gray-300 dark:border-powerbi-gray-600'}`}>
                  <div className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">$2.99/month</div>
                  <div className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">Monthly plan</div>
                </button>
                <button type="button" onClick={() => setUpgradePlan('yearly')} className={`p-3 rounded-lg border ${upgradePlan === 'yearly' ? 'border-powerbi-primary bg-powerbi-blue-50 dark:bg-powerbi-blue-900/20' : 'border-powerbi-gray-300 dark:border-powerbi-gray-600'}`}>
                  <div className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">$29.99/year</div>
                  <div className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">Best value</div>
                </button>
                <div className="p-3 rounded-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">Current</div>
                  <div className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">Free (trial applies)</div>
                </div>
              </div>
              <CardPaymentForm
                country={form.country || ''}
                value={payValue}
                onChange={(v) => setPayValue({ ...payValue, ...v })}
                onValidityChange={(valid) => setPaymentValid(valid)}
              />
              <div className="flex justify-end mt-3">
                <button
                  className="inline-flex items-center gap-2 bg-powerbi-primary text-white px-4 py-2 rounded-xl disabled:bg-powerbi-gray-400"
                  disabled={!paymentValid}
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const res = await fetch('http://localhost:3001/api/subscription/upgrade', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                          plan_type: upgradePlan,
                          payment_method: 'credit_card',
                          card_number: payValue.card_number,
                          expiry_month: payValue.expiry_month,
                          expiry_year: payValue.expiry_year,
                          billing_address: `${payValue.billing_address}${payValue.postal_code ? `, ${payValue.postal_code}` : ''}`,
                          currency: form.currency || 'USD'
                        })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        setMessage('Upgraded to Pro successfully');
                        loadProfile();
                      } else {
                        setMessage(data.error || 'Upgrade failed');
                      }
                    } catch (e) {
                      console.error(e);
                      setMessage('Upgrade failed');
                    }
                  }}
                >
                  <span>🚀</span> Upgrade to Pro
                </button>
              </div>
            </div>
          ) : (
            <div>
              {subscription ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="p-4 rounded-xl border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                    <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Plan</div>
                    <div className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">{subscription.plan_name}</div>
                    <div className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">Renews: {subscription.current_period_end}</div>
                  </div>
                  <div className="p-4 rounded-xl border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                    <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Payment</div>
                    <div className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">**** **** **** {subscription.last_four || '****'}</div>
                    <div className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">Exp: {subscription.expiry_month}/{subscription.expiry_year}</div>
                  </div>
                </div>
              ) : null}
              <div className="mt-2">
                <h3 className="text-sm font-semibold text-powerbi-gray-900 dark:text-white mb-2">Update Payment Method</h3>
                <CardPaymentForm
                  country={form.country || ''}
                  value={payValue}
                  onChange={(v) => setPayValue({ ...payValue, ...v })}
                  onValidityChange={(valid) => setPaymentValid(valid)}
                />
                <div className="flex justify-end mt-3">
                  <button
                    className="inline-flex items-center gap-2 bg-powerbi-primary text-white px-4 py-2 rounded-xl disabled:bg-powerbi-gray-400"
                    disabled={!paymentValid}
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('http://localhost:3001/api/payment-method', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({
                            payment_type: 'credit_card',
                            card_number: payValue.card_number,
                            expiry_month: payValue.expiry_month,
                            expiry_year: payValue.expiry_year,
                            billing_address: `${payValue.billing_address}${payValue.postal_code ? `, ${payValue.postal_code}` : ''}`
                          })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setMessage('Payment method updated');
                          loadProfile();
                        } else {
                          setMessage(data.error || 'Update failed');
                        }
                      } catch (e) {
                        console.error(e);
                        setMessage('Update failed');
                      }
                    }}
                  >
                    <span>💳</span> Update Payment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Verification */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Profile Verification</h2>
            {profile && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${profile.verified ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'}`}>
                {profile.verified ? 'Verified' : 'Not Verified'}
              </span>
            )}
          </div>
          <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-3">Verify your profile to enhance account trust and unlock certain features. In production, we send a verification email or code.</p>
          <div className="flex justify-end">
            <button
              disabled={verifying || (profile?.verified ?? false)}
              onClick={async () => {
                setVerifying(true);
                setMessage('');
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch('http://localhost:3001/api/user/verify', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                  const data = await res.json();
                  if (res.ok) {
                    setProfile((p) => p ? { ...p, verified: true } : p);
                    setMessage('Profile verified');
                  } else {
                    setMessage(data.error || 'Verification failed');
                  }
                } catch (e) {
                  console.error(e);
                  setMessage('Verification failed');
                } finally {
                  setVerifying(false);
                }
              }}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl disabled:bg-powerbi-gray-400"
            >
              <span>✅</span> {verifying ? 'Verifying...' : 'Verify Profile'}
            </button>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}