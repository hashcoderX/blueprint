'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { DollarSign, Calendar, Plus, Tag } from 'lucide-react';

type GemImage = {
  id?: number;
  file_name: string;
  original_name: string;
  url: string;
};

type GemInventoryItem = {
  id: number;
  gem_name: string;
  weight: number;
  color?: string | null;
  images: GemImage[];
};

type GemSale = {
  id: number;
  inventory_id: number;
  description: string;
  amount: number;
  date: string;
  buyer?: string | null;
  gem_name?: string;
  weight?: number;
  images?: GemImage[];
  purchase_price?: number;
  expenses_total?: number;
};

export default function GemSales() {
  const router = useRouter();
  const [sales, setSales] = useState<GemSale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);

  // Add form
  const [inventoryId, setInventoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [buyer, setBuyer] = useState('');
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [inventoryOptions, setInventoryOptions] = useState<GemInventoryItem[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [expenseInvId, setExpenseInvId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseSubmitting, setExpenseSubmitting] = useState<boolean>(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  const [selectedSale, setSelectedSale] = useState<GemSale | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const monthTotal = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return sales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === m && d.getFullYear() === y;
      })
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  }, [sales]);

  const totalSales = useMemo(() => sales.length, [sales]);

  const monthExpenses = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return sales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === m && d.getFullYear() === y;
      })
      .reduce((sum, s) => sum + (Number(s.expenses_total) || 0), 0);
  }, [sales]);

  const monthProfit = useMemo(() => {
    const now = new Date();
    const m = now.getMonth();
    const y = now.getFullYear();
    return sales
      .filter(s => {
        const d = new Date(s.date);
        return d.getMonth() === m && d.getFullYear() === y;
      })
      .reduce((sum, s) => {
        const amt = Number(s.amount) || 0;
        const cost = (Number(s.purchase_price) || 0) + (Number(s.expenses_total) || 0);
        return sum + (amt - cost);
      }, 0);
  }, [sales]);

  const loadSales = async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('http://localhost:3001/api/gem/sales', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data) ? data.map((s: any) => ({
          ...s,
          amount: Number(s.amount ?? 0),
          purchase_price: Number(s.purchase_price ?? 0),
          expenses_total: Number(s.expenses_total ?? 0),
          weight: s.weight != null ? Number(s.weight) : undefined
        })) : [];
        setSales(normalized);
      }
    } catch (e) {
      console.error('Failed to load sales', e);
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryOptions = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/gem/inventory?status=available&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const opts = Array.isArray(data.items) ? data.items.map((i: any) => ({
          id: i.id,
          gem_name: i.gem_name,
          weight: Number(i.weight ?? 0),
          color: i.color ?? null,
          images: i.images || []
        })) : [];
        setInventoryOptions(opts);
      }
    } catch (e) {
      console.error('Failed to load inventory options', e);
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
    loadSales();
    loadInventoryOptions();
  }, []);

  const handleAddSale = async () => {
    setSubmitError(null);
    const invId = Number(inventoryId);
    const amt = Number(amount);
    if (!Number.isFinite(invId) || invId <= 0) {
      setSubmitError('Select a valid inventory item');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setSubmitError('Enter a valid positive amount');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        inventory_id: invId,
        amount: amt,
        date: date || undefined,
        buyer: buyer || undefined,
        description: description || ''
      };
      const res = await fetch('http://localhost:3001/api/gem/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add sale');
      }
      await loadSales();
      await loadInventoryOptions();
      // Clear form
      setInventoryId('');
      setAmount('');
      setDate('');
      setBuyer('');
      setDescription('');
      setShowAdd(false);
      // Stay on Sales page; lists refresh and inventory options update
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
              <Tag className="w-8 h-8 mr-3 text-blue-600 dark:text-blue-400" />
              Gem Sales
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Record and track sales of your inventory items
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sale
          </button>
          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(monthTotal)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold">{totalSales}</p>
              </div>
              <Tag className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Profit (Month)</p>
                <p className="text-3xl font-bold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(monthProfit)}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
            <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Sales History</h3>
          </div>
          {loading ? (
            <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">Loading sales...</div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">No sales yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Gem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Weight</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Buyer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Cost</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Profit/Loss</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">P/L %</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider">Images</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-powerbi-gray-800 divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-900/50 cursor-pointer" onClick={() => { setSelectedSale(s); setShowDetail(true); }}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{new Date(s.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-powerbi-gray-900 dark:text-white font-medium">{s.gem_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{s.weight != null ? Number(s.weight).toFixed(3) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{s.buyer || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-700 dark:text-blue-400">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(s.amount) || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format((Number(s.purchase_price) || 0) + (Number(s.expenses_total) || 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                        {(() => {
                          const cost = ((Number(s.purchase_price) || 0) + (Number(s.expenses_total) || 0));
                          const profit = (Number(s.amount) || 0) - cost;
                          const className = profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400';
                          return <span className={className}>{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(profit)}</span>;
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {(() => {
                          const cost = ((Number(s.purchase_price) || 0) + (Number(s.expenses_total) || 0));
                          if (!(cost > 0)) return <span className="text-powerbi-gray-400 dark:text-powerbi-gray-500">-</span>;
                          const profit = (Number(s.amount) || 0) - cost;
                          const profitPct = profit > 0 ? (profit / cost) * 100 : 0;
                          const lossPct = profit < 0 ? ((-profit) / cost) * 100 : 0;
                          return (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                                Profit: {profitPct.toFixed(2)}%
                              </span>
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                                Loss: {lossPct.toFixed(2)}%
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {s.images && s.images.length > 0 ? (
                          <div className="flex space-x-1">
                            {s.images.slice(0, 3).map(img => (
                              <img key={img.file_name} src={`http://localhost:3001${img.url}`} alt={img.original_name} className="w-8 h-8 object-cover rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                            ))}
                            {s.images.length > 3 && (
                              <div className="w-8 h-8 bg-powerbi-gray-100 dark:bg-powerbi-gray-700 rounded flex items-center justify-center text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">+{s.images.length - 3}</div>
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

        {/* Add Sale Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Sale</h4>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Inventory Item *</label>
                  <select value={inventoryId} onChange={e => setInventoryId(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2">
                    <option value="">Select an item</option>
                    {inventoryOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.gem_name} ({opt.weight.toFixed(3)} ct){opt.color ? ` - ${opt.color}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Amount *</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 350.00" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Date</label>
                    <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Buyer (optional)</label>
                    <input value={buyer} onChange={e => setBuyer(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Private collector" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                  <input value={description} onChange={e => setDescription(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Sold at local fair" />
                </div>
              </div>
              {submitError && (
                <div className="px-6 pb-4">
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{submitError}</div>
                </div>
              )}
              <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Cancel</button>
                <button onClick={handleAddSale} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">{isSubmitting ? 'Saving...' : 'Save Sale'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Gem Expense</h4>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Inventory Item *</label>
                  <select value={expenseInvId} onChange={e => setExpenseInvId(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2">
                    <option value="">Select an item</option>
                    {inventoryOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.gem_name} ({opt.weight.toFixed(3)} ct){opt.color ? ` - ${opt.color}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Amount *</label>
                  <input value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 25.00" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Date</label>
                    <input value={expenseDate} onChange={e => setExpenseDate(e.target.value)} type="date" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Category (optional)</label>
                    <input value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Cutting, Certification" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                  <input value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Lab certification fee" />
                </div>
              </div>
              {expenseError && (
                <div className="px-6 pb-4">
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{expenseError}</div>
                </div>
              )}
              <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowAddExpense(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Cancel</button>
                <button onClick={async () => {
                  setExpenseError(null);
                  const invId = Number(expenseInvId);
                  const amt = Number(expenseAmount);
                  if (!Number.isFinite(invId) || invId <= 0) { setExpenseError('Select a valid inventory item'); return; }
                  if (!Number.isFinite(amt) || amt <= 0) { setExpenseError('Enter a valid positive amount'); return; }
                  setExpenseSubmitting(true);
                  try {
                    const payload = {
                      inventory_id: invId,
                      amount: amt,
                      date: expenseDate || undefined,
                      description: expenseDesc || '',
                      category: expenseCategory || undefined
                    };
                    const res = await fetch('http://localhost:3001/api/gem/expenses', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Failed to add expense');
                    }
                    await loadSales();
                    setShowAddExpense(false);
                    setExpenseInvId('');
                    setExpenseAmount('');
                    setExpenseDate('');
                    setExpenseDesc('');
                    setExpenseCategory('');
                  } catch (e: any) {
                    setExpenseError(e.message || 'Unexpected error');
                  } finally {
                    setExpenseSubmitting(false);
                  }
                }} disabled={expenseSubmitting} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">{expenseSubmitting ? 'Saving...' : 'Save Expense'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Sale Detail Modal */}
        {showDetail && selectedSale && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Sale Details</h4>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Date</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{new Date(selectedSale.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Gem</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedSale.gem_name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Weight</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedSale.weight != null ? Number(selectedSale.weight).toFixed(3) + ' ct' : '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Buyer</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedSale.buyer || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Sale Amount</label>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selectedSale.amount) || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Purchase Price</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selectedSale.purchase_price) || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Total Expenses</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selectedSale.expenses_total) || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Profit/Loss</label>
                    <p className="text-sm font-medium">
                      {(() => {
                        const profit = (Number(selectedSale.amount) || 0) - ((Number(selectedSale.purchase_price) || 0) + (Number(selectedSale.expenses_total) || 0));
                        const className = profit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400';
                        return <span className={className}>{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(profit)}</span>;
                      })()}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Description</label>
                  <p className="text-sm text-powerbi-gray-900 dark:text-white">{selectedSale.description || '-'}</p>
                </div>
                {selectedSale.images && selectedSale.images.length > 0 && (
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Images</label>
                    <div className="flex space-x-2 mt-2">
                      {selectedSale.images.map(img => (
                        <img key={img.file_name} src={`http://localhost:3001${img.url}`} alt={img.original_name} className="w-16 h-16 object-cover rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-between">
                <button onClick={() => { setShowDetail(false); setSelectedSale(null); }} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Close</button>
                <button onClick={() => {
                  setExpenseInvId(selectedSale.inventory_id.toString());
                  setShowDetail(false);
                  setShowAddExpense(true);
                }} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add Expense
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
