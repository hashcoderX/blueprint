'use client';

import { useEffect, useState, useCallback } from 'react';
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
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

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
      </section>
    </DashboardLayout>
  );
}