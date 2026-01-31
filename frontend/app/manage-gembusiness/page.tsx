'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { ShoppingCart, DollarSign, Gem, Layers } from 'lucide-react';

type GemImage = {
  id?: number;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
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

export default function ManageGemBusiness() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<GemPurchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [vendor, setVendor] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  useEffect(() => { loadPurchases(); }, []);

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20">💎</span>
              Manage My Gem Business
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Track inventory, purchases, and sales for your gem trade
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Inventory Items</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <Layers className="w-6 h-6 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Purchases (Month)</p>
                <p className="text-3xl font-bold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(monthTotal)}</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-emerald-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Sales (Month)</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <DollarSign className="w-6 h-6 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Gem className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Inventory</h3>
              </div>
              <button onClick={() => router.push('/manage-gembusiness/inventory')} className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">View Inventory</button>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Maintain stock, grading info, and photos.</p>
            <div className="mt-4 text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">Click &quot;View Inventory&quot; to manage your items.</div>
          </div>

          {/* Purchases */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Purchases</h3>
              </div>
              <button onClick={() => setShowAdd(true)} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Add Purchase</button>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Record gemstone purchases and suppliers.</p>

            {loading ? (
              <div className="mt-4 text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">Loading...</div>
            ) : purchases.length === 0 ? (
              <div className="mt-4 text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">No purchases yet.</div>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {purchases.map(p => (
                  <div key={p.id} className="border border-powerbi-gray-200 dark:border-powerbi-gray-700 rounded-xl p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-powerbi-gray-900 dark:text-white">{p.description || 'Purchase'}</p>
                        <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{new Date(p.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(p.amount) || 0)}
                      </div>
                    </div>
                    {p.images && p.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {p.images.slice(0,3).map(img => (
                          <img key={img.file_name} src={`http://localhost:3001${img.url}`} alt={img.original_name} className="w-full h-20 object-cover rounded-md border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Add Purchase Modal */}
            {showAdd && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <h4 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Add Purchase</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Description</label>
                      <input value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 3ct Sapphire rough" />
                    </div>
                    <div>
                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Amount</label>
                      <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="0.01" className="mt-1 w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 250.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Date</label>
                        <input value={date} onChange={e => setDate(e.target.value)} type="date" className="mt-1 w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                      </div>
                      <div>
                        <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Vendor (optional)</label>
                        <input value={vendor} onChange={e => setVendor(e.target.value)} className="mt-1 w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Local trader" />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Images</label>
                      <input onChange={e => setFiles(e.target.files)} type="file" multiple accept="image/*,.jpg,.jpeg,.png,.webp" className="mt-1 w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                    </div>
                  </div>
                  {submitError && <div className="mt-3 text-sm text-red-600">{submitError}</div>}
                  <div className="mt-5 flex justify-end gap-2">
                    <button onClick={() => setShowAdd(false)} className="px-3 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white">Cancel</button>
                    <button onClick={handleAddPurchase} disabled={isSubmitting} className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Saving...' : 'Save Purchase'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sales/Income */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Income</h3>
              </div>
              <button className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Add Sale</button>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Track sales, auctions, and consignments.</p>
            <div className="mt-4 text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">No sales yet.</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
