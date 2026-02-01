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
  inventory_id?: number | null;
  images: GemImage[];
};

type GemExpense = {
  id: number;
  inventory_id: number;
  amount: number;
  date: string;
  category?: string | null;
  description?: string | null;
};

export default function GemPurchases() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<GemPurchase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [selected, setSelected] = useState<GemPurchase | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [showExpensesHistory, setShowExpensesHistory] = useState<boolean>(false);
  const [expenses, setExpenses] = useState<GemExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState<boolean>(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  
  // Add form
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [vendor, setVendor] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Inventory fields
  const [gemName, setGemName] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [clarity, setClarity] = useState('');
  const [cut, setCut] = useState('');
  const [shape, setShape] = useState('');
  const [origin, setOrigin] = useState('');

  // User profile + auth token
  const [userProfile, setUserProfile] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Stats
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

  // Load purchases
  const loadPurchases = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('http://localhost:3001/api/gem/purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const normalized: GemPurchase[] = (Array.isArray(data) ? data : []).map((p: any) => ({
          id: Number(p.id),
          description: typeof p.description === 'string' ? p.description : '',
          amount: Number(p.amount) || 0,
          date: p.date || new Date().toISOString().slice(0,10),
          vendor: p.vendor || null,
          inventory_id: p.inventory_id ? Number(p.inventory_id) : null,
          images: Array.isArray(p.images) ? p.images.map((img: any) => ({
            id: img.id ? Number(img.id) : undefined,
            file_name: String(img.file_name || ''),
            original_name: String(img.original_name || ''),
            url: String(img.url || '')
          })) : []
        }));
        setPurchases(normalized);
      }
    } catch (e) {
      console.error('Failed to load purchases', e);
    } finally {
      setLoading(false);
    }
  };

  // Load expenses for selected inventory
  const loadExpensesForSelected = async () => {
    if (!token || !selected?.inventory_id) return;
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/gem/expenses?inventory_id=${selected.inventory_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load expenses');
      }
      const data = await res.json();
      const normalized: GemExpense[] = (Array.isArray(data) ? data : []).map((e: any) => ({
        id: Number(e.id),
        inventory_id: Number(e.inventory_id),
        amount: Number(e.amount) || 0,
        date: e.date || new Date().toISOString().slice(0,10),
        category: e.category || null,
        description: e.description || null
      }));
      setExpenses(normalized);
    } catch (e: any) {
      setExpensesError(e.message || 'Unexpected error');
    } finally {
      setExpensesLoading(false);
    }
  };

  // Add Expense modal state
  const [expInventoryId, setExpInventoryId] = useState<number | null>(null);
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('general');
  const [expDesc, setExpDesc] = useState<string>('');
  const [expError, setExpError] = useState<string | null>(null);
  const [expSubmitting, setExpSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (showAddExpense && selected) {
      setExpInventoryId(selected.inventory_id || null);
      setExpDate(new Date().toISOString().slice(0,10));
      setExpAmount('');
      setExpCategory('general');
      setExpDesc('');
      setExpError(null);
    }
  }, [showAddExpense, selected]);

  const submitExpense = async () => {
    setExpError(null);
    if (!token) { setExpError('Not authenticated'); return; }
    if (!expInventoryId) { setExpError('Linked inventory is required'); return; }
    const amt = Number(expAmount);
    if (!Number.isFinite(amt) || amt <= 0) { setExpError('Enter a valid positive amount'); return; }
    setExpSubmitting(true);
    try {
      const payload = {
        inventory_id: expInventoryId,
        amount: amt,
        date: expDate || new Date().toISOString().slice(0,10),
        category: expCategory || 'general',
        description: expDesc || ''
      };
      const res = await fetch('http://localhost:3001/api/gem/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add expense');
      }
      setShowAddExpense(false);
    } catch (e: any) {
      setExpError(e.message || 'Unexpected error');
    } finally {
      setExpSubmitting(false);
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
    const wt = Number(weight);
    if (!gemName.trim()) {
      setSubmitError('Gem name is required');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setSubmitError('Enter a valid positive amount');
      return;
    }
    if (!Number.isFinite(wt) || wt <= 0) {
      setSubmitError('Enter a valid positive weight');
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
      
      // Inventory fields
      fd.append('gem_name', gemName.trim());
      fd.append('weight', String(wt));
      if (color) fd.append('color', color.trim());
      if (clarity) fd.append('clarity', clarity.trim());
      if (cut) fd.append('cut', cut.trim());
      if (shape) fd.append('shape', shape.trim());
      if (origin) fd.append('origin', origin.trim());
      
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
      setGemName('');
      setWeight('');
      setColor('');
      setClarity('');
      setCut('');
      setShape('');
      setOrigin('');
      setShowAdd(false);
      // Navigate to inventory to confirm item is listed
      router.push('/manage-gembusiness/inventory');
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

        {/* Purchases Table */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
            <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Purchase History</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">
              Loading purchases...
            </div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">
              No purchases yet. Add your first purchase to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Images</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-powerbi-gray-800 divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                  {purchases.map(p => (
                    <tr
                      key={p.id}
                      className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-900/50 cursor-pointer"
                      onClick={() => { setSelected(p); setShowDetail(true); }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-powerbi-gray-900 dark:text-white font-medium">
                        {p.description || 'Purchase'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {p.vendor || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(p.amount) || 0)}
                      </td>
                      <td className="px-6 py-4">
                        {p.images && p.images.length > 0 ? (
                          <div className="flex space-x-1">
                            {p.images.slice(0, 3).map(img => (
                              <img
                                key={img.file_name}
                                src={`http://localhost:3001${img.url}`}
                                alt={img.original_name}
                                className="w-8 h-8 object-cover rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700"
                              />
                            ))}

                            {/* Purchase Detail Modal */}
                            {showDetail && selected && (
                              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
                                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                                  <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
                                    <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Purchase Details</h4>
                                    <button onClick={() => setShowDetail(false)} className="px-3 py-1.5 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white">Close</button>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Date</div>
                                        <div className="text-powerbi-gray-900 dark:text-white font-medium">{new Date(selected.date).toLocaleDateString()}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Amount</div>
                                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selected.amount) || 0)}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Vendor</div>
                                        <div className="text-powerbi-gray-900 dark:text-white">{selected.vendor || '-'}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Linked Inventory</div>
                                        <div className="text-powerbi-gray-900 dark:text-white">{selected.inventory_id ? `#${selected.inventory_id}` : 'Not linked'}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Description</div>
                                      <div className="text-powerbi-gray-900 dark:text-white">{selected.description || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 mb-2">Images</div>
                                      {selected.images && selected.images.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                          {selected.images.map(img => (
                                            <img key={img.file_name} src={`http://localhost:3001${img.url}`} alt={img.original_name} className="w-full h-28 object-cover rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-powerbi-gray-400 dark:text-powerbi-gray-500">No images</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                                    <button onClick={() => { setShowDetail(false); router.push('/manage-gembusiness/inventory'); }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Open Inventory</button>
                                    <button onClick={() => { setShowExpensesHistory(true); loadExpensesForSelected(); }} disabled={!selected.inventory_id} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">View Expenses</button>
                                    <button onClick={() => setShowAddExpense(true)} disabled={!selected.inventory_id} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">Add Expense</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Purchase Detail Modal */}
                            {showDetail && selected && (
                              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => { setShowDetail(false); setSelected(null); }}>
                                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700" onClick={(e) => e.stopPropagation()}>
                                  <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
                                    <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Purchase Details</h4>
                                    <button onClick={() => { setShowDetail(false); setSelected(null); }} className="px-3 py-1.5 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white">Close</button>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Date</div>
                                        <div className="text-powerbi-gray-900 dark:text-white font-medium">{new Date(selected.date).toLocaleDateString()}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Amount</div>
                                        <div className="text-emerald-700 dark:text-emerald-400 font-semibold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selected.amount) || 0)}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Vendor</div>
                                        <div className="text-powerbi-gray-900 dark:text-white">{selected.vendor || '-'}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Linked Inventory</div>
                                        <div className="text-powerbi-gray-900 dark:text-white">{selected.inventory_id ? `#${selected.inventory_id}` : 'Not linked'}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Description</div>
                                      <div className="text-powerbi-gray-900 dark:text-white">{selected.description || '-'}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 mb-2">Images</div>
                                      {selected.images && selected.images.length > 0 ? (
                                        <div className="grid grid-cols-3 gap-3">
                                          {selected.images.map(img => (
                                            <img key={img.file_name} src={`http://localhost:3001${img.url}`} alt={img.original_name} className="w-full h-28 object-cover rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-powerbi-gray-400 dark:text-powerbi-gray-500">No images</div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                                    <button onClick={() => { setShowDetail(false); setSelected(null); router.push('/manage-gembusiness/inventory'); }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Open Inventory</button>
                                    <button onClick={() => { setShowExpensesHistory(true); loadExpensesForSelected(); }} disabled={!selected.inventory_id} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">View Expenses</button>
                                    <button onClick={() => setShowAddExpense(true)} disabled={!selected.inventory_id} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">Add Expense</button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Add Expense Modal */}
                            {showAddExpense && (
                              <div className="fixed inset-0 bg-black/40 flex items-center justify_center z-50 p-4 overflow-y-auto" onClick={() => setShowAddExpense(false)}>
                                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700" onClick={(e) => e.stopPropagation()}>
                                  <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                                    <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Expense</h4>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    <div>
                                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Linked Inventory ID</label>
                                      <input value={expInventoryId ?? ''} onChange={e => setExpInventoryId(e.target.value ? Number(e.target.value) : null)} type="number" min="1" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 12" />
                                      <p className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400 mt-1">Pre-filled if the purchase created an inventory item.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Amount *</label>
                                        <input value={expAmount} onChange={e => setExpAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 25.00" />
                                      </div>
                                      <div>
                                        <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Date</label>
                                        <input value={expDate} onChange={e => setExpDate(e.target.value)} type="date" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Category</label>
                                      <input value={expCategory} onChange={e => setExpCategory(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. cutting" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                                      <input value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Cutting service" />
                                    </div>
                                  </div>
                                  {expError && (
                                    <div className="px-6 pb-4">
                                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{expError}</div>
                                    </div>
                                  )}
                                  <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                                    <button onClick={() => setShowAddExpense(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Cancel</button>
                                    <button onClick={submitExpense} disabled={expSubmitting} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">{expSubmitting ? 'Saving...' : 'Save Expense'}</button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {/* Add Expense Modal */}
                            {showAddExpense && (
                              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
                                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                                  <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                                    <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Expense</h4>
                                  </div>
                                  <div className="p-6 space-y-4">
                                    <div>
                                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Linked Inventory ID</label>
                                      <input value={expInventoryId ?? ''} onChange={e => setExpInventoryId(e.target.value ? Number(e.target.value) : null)} type="number" min="1" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 12" />
                                      <p className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400 mt-1">Pre-filled if the purchase created an inventory item.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Amount *</label>
                                        <input value={expAmount} onChange={e => setExpAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 25.00" />
                                      </div>
                                      <div>
                                        <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Date</label>
                                        <input value={expDate} onChange={e => setExpDate(e.target.value)} type="date" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Category</label>
                                      <input value={expCategory} onChange={e => setExpCategory(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. cutting" />
                                    </div>
                                    <div>
                                      <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                                      <input value={expDesc} onChange={e => setExpDesc(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Cutting service" />
                                    </div>
                                  </div>
                                  {expError && (
                                    <div className="px-6 pb-4">
                                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{expError}</div>
                                    </div>
                                  )}
                                  <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                                    <button onClick={() => setShowAddExpense(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Cancel</button>
                                    <button onClick={submitExpense} disabled={expSubmitting} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">{expSubmitting ? 'Saving...' : 'Save Expense'}</button>
                                  </div>
                                </div>
                              </div>
                            )}
                            {p.images.length > 3 && (
                              <div className="w-8 h-8 bg-powerbi-gray-100 dark:bg-powerbi-gray-700 rounded flex items-center justify-center text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">
                                +{p.images.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-powerbi-gray-400 dark:text-powerbi-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Gem Name *</label>
                  <input value={gemName} onChange={e => setGemName(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Sapphire" />
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                  <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 3ct Sapphire rough" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Weight (ct) *</label>
                    <input value={weight} onChange={e => setWeight(e.target.value)} type="number" min="0" step="0.001" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 3.250" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Amount *</label>
                    <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 250.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Color</label>
                    <input value={color} onChange={e => setColor(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Blue" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Clarity</label>
                    <input value={clarity} onChange={e => setClarity(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. VS" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Cut</label>
                    <input value={cut} onChange={e => setCut(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Round" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Shape</label>
                    <input value={shape} onChange={e => setShape(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Oval" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Origin</label>
                    <input value={origin} onChange={e => setOrigin(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Sri Lanka" />
                  </div>
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

        {/* Expenses History Modal */}
        {showExpensesHistory && selected && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Expenses History</h4>
                <button onClick={() => setShowExpensesHistory(false)} className="px-3 py-1.5 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white">Close</button>
              </div>
              <div className="p-6">
                {!selected.inventory_id ? (
                  <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">No linked inventory for this purchase.</div>
                ) : expensesLoading ? (
                  <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">Loading expenses...</div>
                ) : expensesError ? (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{expensesError}</div>
                ) : expenses.length === 0 ? (
                  <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">No expenses recorded for this item.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-900/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Category</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-powerbi-gray-800 divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                        {expenses.map(exp => (
                          <tr key={exp.id}>
                            <td className="px-6 py-3 text-sm text-powerbi-gray-900 dark:text-white">{new Date(exp.date).toLocaleDateString()}</td>
                            <td className="px-6 py-3 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{exp.category || '-'}</td>
                            <td className="px-6 py-3 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{exp.description || '-'}</td>
                            <td className="px-6 py-3 text-sm font-semibold text-rose-700 dark:text-rose-400">{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(exp.amount) || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}