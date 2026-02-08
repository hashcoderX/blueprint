'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

interface BusinessForm {
  business_name: string;
  registration_no?: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  currency?: string;
  owner_name?: string;
}

export default function BusinessRegisterPage() {
  const [form, setForm] = useState<BusinessForm>({ business_name: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Prefill if business exists
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/business`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setForm({
            business_name: data.business_name || '',
            registration_no: data.registration_no || '',
            tax_id: data.tax_id || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            country: data.country || '',
            currency: data.currency || 'USD',
            owner_name: data.owner_name || ''
          });
        }
      } catch (e) {
        // silent
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/business/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Business details saved successfully');
      } else {
        setMessage(data.error || 'Failed to save business');
      }
    } catch (e) {
      setMessage('Failed to save business');
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
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">🏢</span>
              Business Registration
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Register your business details to enable reports
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Business Name</label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Registration No</label>
                <input
                  type="text"
                  value={form.registration_no || ''}
                  onChange={(e) => setForm({ ...form, registration_no: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Tax ID</label>
                <input
                  type="text"
                  value={form.tax_id || ''}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email || ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone || ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={form.address || ''}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Country</label>
                <input
                  type="text"
                  value={form.country || ''}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Currency</label>
                <select
                  value={form.currency || 'USD'}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="JPY">JPY</option>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Owner Name</label>
                <input
                  type="text"
                  value={form.owner_name || ''}
                  onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                  className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
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
                disabled={saving || !form.business_name}
                className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 disabled:bg-powerbi-gray-400 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap w-full sm:w-auto"
              >
                <span className="w-5 h-5">💾</span>
                {saving ? 'Saving...' : 'Save Business'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </DashboardLayout>
  );
}
