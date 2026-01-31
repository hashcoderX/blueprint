'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { ShoppingCart, DollarSign, Calendar, Plus } from 'lucide-react';

type GemImage = {
  id?: number;
  file_name: string;
  original_name: string;
  url: string;
};

type GemPurchase = {
  id: number;
  description: string;
  amount: number;
  date: string;
  vendor?: string | null;
  images: GemImage[];
};

export default function GemPurchases() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<GemPurchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  
  // Add form
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [vendor, setVendor] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const monthTotal = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return purchases
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === m && d.getFullYear() === y;
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);
  }, [purchases]);
  
  const totalPurchases = useMemo(() => purchases.length, [purchases]);
  
  const loadPurchases = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('http://localhost:3001/api/gem/purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPurchases(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load purchases', e);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
      }
    } catch (e) {
      console.error('Failed to load user profile', e);
    }
  };
  
  useEffect(() => { 
    fetchUserProfile();
    loadPurchases(); 
  }, []);
  
  const handleAddPurchase = async () => {
    setSubmitError(null);
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setSubmitError('Enter a valid positive amount');
      return;
    }
    if (!files || files.length === 0) {
      setSubmitError('Please add at least one image');
      return;
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('description', desc);
      fd.append('amount', String(amt));
      if (date) fd.append('date', date);
      if (vendor) fd.append('vendor', vendor);
      Array.from(files).forEach(f => fd.append('images', f));
      
      const res = await fetch('http://localhost:3001/api/gem/purchases', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add purchase');
      }
      await loadPurchases();
      // reset and close
      setDesc('');
      setAmount('');
      setDate('');
      setVendor('');
      setFiles(null);
      setShowAdd(false);
    } catch (e: any) {
      setSubmitError(e.message || 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <button
              onClick={() => router.push('/manage-gembusiness')}
              className="flex items-center text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white mb-2"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Back to Gem Business
            </button>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <ShoppingCart className="w-8 h-8 mr-3 text-emerald-600 dark:text-emerald-400" />
              Gem Purchases
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Track your gemstone purchases and suppliers
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(monthTotal)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Purchases</p>
                <p className="text-3xl font-bold">{totalPurchases}</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Average Purchase</p>
                <p className="text-3xl font-bold">
                  {totalPurchases > 0
                    ? new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(
                        purchases.reduce((s, p) => s + (Number(p.amount) || 0), 0) / totalPurchases
                      )
                    : '$0.00'
                  }
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Purchases Grid */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Purchase History</h3>
          
          {loading ? (
            <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">
              Loading purchases...
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">
              No purchases yet. Add your first purchase to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchases.map(p => (
                <div key={p.id} className="border border-powerbi-gray-200 dark:border-powerbi-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-powerbi-gray-900 dark:text-white">{p.description || 'Purchase'}</p>
                      <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{new Date(p.date).toLocaleDateString()}</p>
                      {p.vendor && (
                        <p className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-500">Vendor: {p.vendor}</p>
                      )}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(p.amount) || 0)}
                    </div>
                  </div>
                  {p.images && p.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {p.images.slice(0,3).map(img => (
                        <img key={img.file_name} src={`http://localhost:3001${img.url}`} alt={img.original_name} className="w-full h-20 object-cover rounded-md border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Purchase Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Purchase</h4>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 3ct Sapphire rough" />
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Amount *</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 250.00" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Date</label>
                    <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Vendor (optional)</label>
                    <input value={vendor} onChange={e => setVendor(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Local trader" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Images *</label>
                  <input onChange={e => setFiles(e.target.files)} type="file" multiple accept="image/*,.jpg,.jpeg,.png,.webp" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                </div>
              </div>
              {submitError && (
                <div className="px-6 pb-4">
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{submitError}</div>
                </div>
              )}
              <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">
                  Cancel
                </button>
                <button onClick={handleAddPurchase} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Saving...' : 'Save Purchase'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}