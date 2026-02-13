'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { Gem, Search, Filter, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

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
  color: string | null;
  clarity: string | null;
  cut: string | null;
  shape: string | null;
  origin: string | null;
  purchase_price: number;
  current_value: number | null;
  quantity: number;
  status: 'available' | 'sold' | 'reserved';
  description: string | null;
  created_at: string;
  images: GemImage[];
  expenses_total: number;
  tracking_action_type?: 'burning' | 'broker' | 'note' | null;
  tracking_status?: 'ongoing' | 'completed' | null;
  tracking_start_date?: string | null;
  derived_status?: string | null;
};

type GemTracking = {
  id: number;
  inventory_id: number;
  action_type: 'burning' | 'broker' | 'note';
  party?: string | null;
  status: 'ongoing' | 'completed';
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
};

export default function GemInventory() {
  const router = useRouter();
  const [items, setItems] = useState<GemInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  // Filters
  const [gemNameFilter, setGemNameFilter] = useState('');
  const [weightMinFilter, setWeightMinFilter] = useState('');
  const [weightMaxFilter, setWeightMaxFilter] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('available');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  
  // Add form
  const [gemName, setGemName] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [clarity, setClarity] = useState('');
  const [cut, setCut] = useState('');
  const [shape, setShape] = useState('');
  const [origin, setOrigin] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [selectedItem, setSelectedItem] = useState<GemInventoryItem | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);

  const [showAddExpense, setShowAddExpense] = useState<boolean>(false);
  const [expenseInvId, setExpenseInvId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseSubmitting, setExpenseSubmitting] = useState<boolean>(false);
  const [expenseError, setExpenseError] = useState<string | null>(null);

  // Tracking state
  const [showAddTracking, setShowAddTracking] = useState<boolean>(false);
  const [showTrackingHistory, setShowTrackingHistory] = useState<boolean>(false);
  const [trackingItems, setTrackingItems] = useState<GemTracking[]>([]);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [trackCompletingId, setTrackCompletingId] = useState<number | null>(null);
  const [trackCompleteError, setTrackCompleteError] = useState<string | null>(null);
  const [trackActionType, setTrackActionType] = useState<'burning' | 'broker' | 'note'>('burning');
  const [trackParty, setTrackParty] = useState('');
  const [trackStatus, setTrackStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [trackStartDate, setTrackStartDate] = useState('');
  const [trackEndDate, setTrackEndDate] = useState('');
  const [trackNotes, setTrackNotes] = useState('');
  const [trackSubmitting, setTrackSubmitting] = useState<boolean>(false);

  // Expenses history modal
  type GemExpense = {
    id: number;
    inventory_id: number;
    amount: number;
    date: string;
    description?: string | null;
    category?: string | null;
  };
  const [showExpensesHistory, setShowExpensesHistory] = useState<boolean>(false);
  const [expensesItems, setExpensesItems] = useState<GemExpense[]>([]);
  const [expensesLoading, setExpensesLoading] = useState<boolean>(false);
  const [expensesError, setExpensesError] = useState<string | null>(null);
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const totalValuation = useMemo(() => {
    return items.reduce((sum, item) => {
      const val = item.current_value || item.purchase_price;
      return sum + (val * item.quantity);
    }, 0);
  }, [items]);
  
  const availableCount = useMemo(() => {
    return items.filter(i => i.status === 'available').length;
  }, [items]);
  
  const loadInventory = async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (gemNameFilter) params.append('gem_name', gemNameFilter);
      if (weightMinFilter) params.append('weight_min', weightMinFilter);
      if (weightMaxFilter) params.append('weight_max', weightMaxFilter);
      if (colorFilter) params.append('color', colorFilter);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/gem/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = Array.isArray(data.items)
          ? data.items.map((i: any) => ({
              ...i,
              weight: Number(i.weight ?? 0),
              purchase_price: Number(i.purchase_price ?? 0),
              current_value: i.current_value != null ? Number(i.current_value) : null,
              quantity: Number(i.quantity ?? 1),
              expenses_total: Number(i.expenses_total ?? 0)
            }))
          : [];
        setItems(normalized);
        setTotal(Number(data.total) || 0);
      }
    } catch (e) {
      console.error('Failed to load inventory', e);
    } finally {
      setLoading(false);
    }
  };

  const loadExpensesForItem = async (inventoryId: number) => {
    if (!token) return;
    setExpensesLoading(true);
    setExpensesError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/gem/expenses?inventory_id=${inventoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load expenses');
      }
      const data = await res.json();
      const list: GemExpense[] = Array.isArray(data) ? data.map((e: any) => ({
        id: e.id,
        inventory_id: Number(e.inventory_id),
        amount: Number(e.amount ?? 0),
        date: e.date,
        description: e.description || null,
        category: e.category || null
      })) : [];
      setExpensesItems(list);
    } catch (e: any) {
      setExpensesError(e.message || 'Unexpected error');
    } finally {
      setExpensesLoading(false);
    }
  };

  const loadTrackingForItem = async (inventoryId: number) => {
    if (!token) return;
    setTrackingLoading(true);
    setTrackingError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/gem/tracking?inventory_id=${inventoryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load tracking');
      }
      const data = await res.json();
      const list: GemTracking[] = Array.isArray(data) ? data.map((t: any) => ({
        id: Number(t.id),
        inventory_id: Number(t.inventory_id),
        action_type: t.action_type,
        party: t.party || null,
        status: t.status,
        start_date: t.start_date,
        end_date: t.end_date || null,
        notes: t.notes || null
      })) : [];
      setTrackingItems(list);
    } catch (e: any) {
      setTrackingError(e.message || 'Unexpected error');
    } finally {
      setTrackingLoading(false);
    }
  };

  const markTrackingCompleted = async (trackingId: number) => {
    if (!token) return;
    setTrackCompleteError(null);
    setTrackCompletingId(trackingId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/gem/tracking/${trackingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed' })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update tracking');
      }
      // Reload history
      if (selectedItem) await loadTrackingForItem(selectedItem.id);
    } catch (e: any) {
      setTrackCompleteError(e.message || 'Unexpected error');
    } finally {
      setTrackCompletingId(null);
    }
  };
  
  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/user/profile`, {
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
    loadInventory(); 
  }, [page, gemNameFilter, weightMinFilter, weightMaxFilter, colorFilter, statusFilter]);
  
  const handleAddItem = async () => {
    setSubmitError(null);
    const pp = Number(purchasePrice);
    const wt = Number(weight);
    
    if (!gemName.trim()) {
      setSubmitError('Gem name is required');
      return;
    }
    if (!Number.isFinite(wt) || wt <= 0) {
      setSubmitError('Enter a valid positive weight');
      return;
    }
    if (!Number.isFinite(pp) || pp < 0) {
      setSubmitError('Enter a valid purchase price');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('gem_name', gemName.trim());
      fd.append('weight', String(wt));
      if (color) fd.append('color', color);
      if (clarity) fd.append('clarity', clarity);
      if (cut) fd.append('cut', cut);
      if (shape) fd.append('shape', shape);
      if (origin) fd.append('origin', origin);
      fd.append('purchase_price', String(pp));
      if (currentValue) fd.append('current_value', currentValue);
      if (quantity) fd.append('quantity', quantity);
      if (description) fd.append('description', description);
      if (files) {
        Array.from(files).forEach(f => fd.append('images', f));
      }
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/gem/inventory`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add item');
      }
      await loadInventory();
      // reset
      setGemName('');
      setWeight('');
      setColor('');
      setClarity('');
      setCut('');
      setShape('');
      setOrigin('');
      setPurchasePrice('');
      setCurrentValue('');
      setQuantity('1');
      setDescription('');
      setFiles(null);
      setShowAdd(false);
    } catch (e: any) {
      setSubmitError(e.message || 'Unexpected error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const totalPages = Math.ceil(total / limit);
  
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6 mt-16">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4">
          <div className="min-w-0">
            <button
              onClick={() => router.push('/manage-gembusiness')}
              className="flex items-center text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white mb-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Gem Business
            </button>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <Gem className="w-8 h-8 mr-3 text-purple-600 dark:text-purple-400" />
              Gem Inventory
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Manage your gemstone stock and valuations
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium w-full sm:w-auto shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Valuation</p>
                <p className="text-2xl sm:text-3xl font-bold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(totalValuation)}</p>
              </div>
              <Gem className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Available Items</p>
                <p className="text-2xl sm:text-3xl font-bold">{availableCount}</p>
              </div>
              <Filter className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Items</p>
                <p className="text-2xl sm:text-3xl font-bold">{total}</p>
              </div>
              <Search className="w-8 h-8 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            Filters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Gem Name</label>
              <input
                value={gemNameFilter}
                onChange={(e) => { setGemNameFilter(e.target.value); setPage(1); }}
                placeholder="Search by name"
                className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Weight Min (ct)</label>
              <input
                value={weightMinFilter}
                onChange={(e) => { setWeightMinFilter(e.target.value); setPage(1); }}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Weight Max (ct)</label>
              <input
                value={weightMaxFilter}
                onChange={(e) => { setWeightMaxFilter(e.target.value); setPage(1); }}
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Color</label>
              <input
                value={colorFilter}
                onChange={(e) => { setColorFilter(e.target.value); setPage(1); }}
                placeholder="e.g. Blue"
                className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-powerbi-gray-100 dark:bg-powerbi-gray-900">
                <tr>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Image</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Gem Name</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Weight (ct)</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Color</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Purchase Price</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Current Value</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Expenses</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Qty</th>
                  <th className="text-left px-3 py-2 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 sm:px-6 py-8 text-center text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      Loading inventory...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 sm:px-6 py-8 text-center text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      No items found. Add your first item to get started.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-900/50 cursor-pointer" onClick={() => { setSelectedItem(item); setShowDetail(true); }}>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}${item.images[0].url}`}
                            alt={item.gem_name}
                            className="w-12 h-12 rounded-lg object-cover border border-powerbi-gray-200 dark:border-powerbi-gray-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 flex items-center justify-center">
                            <Gem className="w-6 h-6 text-powerbi-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm font-medium text-powerbi-gray-900 dark:text-white">
                        {item.gem_name}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {Number(item.weight).toFixed(3)}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {item.color || '-'}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(item.purchase_price) || 0)}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(item.current_value ?? item.purchase_price) || 0)}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(item.expenses_total) || 0)}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-4">
                        {(() => {
                          const displayStatus = (item.derived_status || item.tracking_action_type || item.status) as string;
                          const cls = displayStatus === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : displayStatus === 'sold'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
                          return (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
                              {displayStatus}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} items
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 rounded-lg bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 rounded-lg bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 mx-4 sm:mx-6 border border-powerbi-gray-200 dark:border-powerbi-gray-700 max-h-[85vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Inventory Item</h4>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Gem Name *</label>
                    <input value={gemName} onChange={e => setGemName(e.target.value)} disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. Sapphire" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Weight (ct) *</label>
                    <input value={weight} onChange={e => setWeight(e.target.value)} type="number" step="0.001" disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. 2.5" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Color</label>
                    <input value={color} onChange={e => setColor(e.target.value)} disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. Blue" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Clarity</label>
                    <input value={clarity} onChange={e => setClarity(e.target.value)} disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. VS" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Cut</label>
                    <input value={cut} onChange={e => setCut(e.target.value)} disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. Round" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Shape</label>
                    <input value={shape} onChange={e => setShape(e.target.value)} disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. Oval" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Origin</label>
                    <input value={origin} onChange={e => setOrigin(e.target.value)} disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. Sri Lanka" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Purchase Price *</label>
                    <input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} type="number" step="0.01" disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. 500.00" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Current Value</label>
                    <input value={currentValue} onChange={e => setCurrentValue(e.target.value)} type="number" step="0.01" disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g. 600.00" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Quantity</label>
                    <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Additional notes about this gem" />
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Images</label>
                  <input onChange={e => setFiles(e.target.files)} type="file" multiple accept="image/*" disabled={isSubmitting} className={`w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`} />
                </div>
              </div>
              {submitError && (
                <div className="px-6 pb-4">
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{submitError}</div>
                </div>
              )}
              <div className="p-4 sm:p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">
                  Cancel
                </button>
                <button onClick={handleAddItem} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <>
                      <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving…
                    </>
                  ) : (
                    'Add Item'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Item Detail Modal */}
        {showDetail && selectedItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 mx-4 sm:mx-6 border border-powerbi-gray-200 dark:border-powerbi-gray-700 max-h-[85vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Inventory Item Details</h4>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Gem Name</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedItem.gem_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Weight</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{Number(selectedItem.weight).toFixed(3)} ct</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Color</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedItem.color || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Clarity</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedItem.clarity || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Cut</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedItem.cut || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Shape</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedItem.shape || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Origin</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedItem.origin || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Status</label>
                    <p className="text-sm font-medium">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        selectedItem.status === 'available'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : selectedItem.status === 'sold'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {selectedItem.status}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Purchase Price</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selectedItem.purchase_price) || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Current Value</label>
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selectedItem.current_value ?? selectedItem.purchase_price) || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Total Expenses</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(Number(selectedItem.expenses_total) || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Quantity</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{selectedItem.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Created</label>
                    <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{new Date(selectedItem.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Description</label>
                  <p className="text-sm text-powerbi-gray-900 dark:text-white">{selectedItem.description || '-'}</p>
                </div>
                {selectedItem.images && selectedItem.images.length > 0 && (
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Images</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                      {selectedItem.images.map(img => (
                        <img key={img.file_name} src={`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}${img.url}`} alt={img.original_name} className="w-full h-24 object-cover rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 sm:p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-between">
                <button onClick={() => { setShowDetail(false); setSelectedItem(null); }} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Close</button>
                <button onClick={() => {
                  setExpenseInvId(selectedItem!.id.toString());
                  setShowDetail(false);
                  setShowAddExpense(true);
                }} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add Expense
                </button>
                <button onClick={async () => {
                  if (!selectedItem) return;
                  await loadExpensesForItem(selectedItem.id);
                  setExpenseInvId(selectedItem.id.toString());
                  setShowDetail(false);
                  setShowExpensesHistory(true);
                }} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                  View Expenses
                </button>
                <button onClick={() => {
                  if (!selectedItem) return;
                  setTrackActionType('burning');
                  setTrackParty('');
                  setTrackStatus('ongoing');
                  setTrackStartDate(new Date().toISOString().slice(0,10));
                  setTrackEndDate('');
                  setTrackNotes('');
                  setShowDetail(false);
                  setShowAddTracking(true);
                }} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">
                  Add Tracking
                </button>
                <button onClick={async () => {
                  if (!selectedItem) return;
                  await loadTrackingForItem(selectedItem.id);
                  setShowDetail(false);
                  setShowTrackingHistory(true);
                }} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white">
                  View Tracking
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showAddExpense && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg my-8 mx-4 sm:mx-6 border border-powerbi-gray-200 dark:border-powerbi-gray-700 max-h-[85vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Gem Expense</h4>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Amount *</label>
                  <input value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} type="number" min="0" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 25.00" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="p-4 sm:p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowAddExpense(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Cancel</button>
                <button onClick={async () => {
                  setExpenseError(null);
                  const invId = Number(expenseInvId);
                  const amt = Number(expenseAmount);
                  if (!Number.isFinite(invId) || invId <= 0) { setExpenseError('Invalid inventory item'); return; }
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
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/gem/expenses`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Failed to add expense');
                    }
                    await loadInventory();
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

        {/* Add Tracking Modal */}
        {showAddTracking && selectedItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-lg my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Tracking</h4>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Action Type *</label>
                  <select value={trackActionType} onChange={e => setTrackActionType(e.target.value as any)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2">
                    <option value="burning">Burning</option>
                    <option value="broker">Broker</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Start Date *</label>
                    <input value={trackStartDate} onChange={e => setTrackStartDate(e.target.value)} type="date" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">End Date</label>
                    <input value={trackEndDate} onChange={e => setTrackEndDate(e.target.value)} type="date" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Status</label>
                    <select value={trackStatus} onChange={e => setTrackStatus(e.target.value as any)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2">
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Party (Broker/Lab)</label>
                    <input value={trackParty} onChange={e => setTrackParty(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. ABC Brokers" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Notes</label>
                  <textarea value={trackNotes} onChange={e => setTrackNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="Details about this action" />
                </div>
                {trackingError && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{trackingError}</div>
                )}
              </div>
              <div className="p-6 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex justify-end gap-3">
                <button onClick={() => setShowAddTracking(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Cancel</button>
                <button onClick={async () => {
                  if (!selectedItem) return;
                  setTrackingError(null);
                  if (!trackStartDate) { setTrackingError('Start date is required'); return; }
                  setTrackSubmitting(true);
                  try {
                    const payload = {
                      inventory_id: selectedItem.id,
                      action_type: trackActionType,
                      party: trackParty || undefined,
                      status: trackStatus,
                      start_date: trackStartDate,
                      end_date: trackEndDate || undefined,
                      notes: trackNotes || ''
                    };
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/gem/tracking`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}));
                      throw new Error(err.error || 'Failed to add tracking');
                    }
                    setShowAddTracking(false);
                  } catch (e: any) {
                    setTrackingError(e.message || 'Unexpected error');
                  } finally {
                    setTrackSubmitting(false);
                  }
                }} disabled={trackSubmitting} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">{trackSubmitting ? 'Saving...' : 'Save Tracking'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Tracking History Modal */}
        {showTrackingHistory && selectedItem && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 mx-4 sm:mx-6 border border-powerbi-gray-200 dark:border-powerbi-gray-700 max-h-[85vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Tracking History</h4>
                <span className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{selectedItem.gem_name}</span>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {trackingError && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{trackingError}</div>
                )}
                {trackingLoading ? (
                  <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">Loading tracking...</div>
                ) : trackingItems.length === 0 ? (
                  <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">No tracking records for this item.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-powerbi-gray-100 dark:bg-powerbi-gray-900">
                        <tr>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Type</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Party</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Status</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Start</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">End</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Notes</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                        {trackingItems.map((t) => (
                          <tr key={t.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-900/50">
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-900 dark:text-white capitalize">{t.action_type}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{t.party || '-'}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${t.status === 'ongoing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'}`}>{t.status}</span>
                            </td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{new Date(t.start_date).toLocaleDateString()}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{t.end_date ? new Date(t.end_date).toLocaleDateString() : '-'}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{t.notes || '-'}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm">
                              {t.status === 'ongoing' ? (
                                <button
                                  onClick={() => markTrackingCompleted(t.id)}
                                  disabled={trackCompletingId === t.id}
                                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {trackCompletingId === t.id ? 'Updating...' : 'Mark Completed'}
                                </button>
                              ) : (
                                <span className="text-powerbi-gray-500 dark:text-powerbi-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {trackCompleteError && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{trackCompleteError}</div>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button onClick={() => setShowTrackingHistory(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses History Modal */}
        {showExpensesHistory && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 mx-4 sm:mx-6 border border-powerbi-gray-200 dark:border-powerbi-gray-700 max-h-[85vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Expenses History</h4>
                {selectedItem && (
                  <span className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{selectedItem.gem_name}</span>
                )}
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                {expensesError && (
                  <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{expensesError}</div>
                )}
                {expensesLoading ? (
                  <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">Loading expenses...</div>
                ) : expensesItems.length === 0 ? (
                  <div className="text-center py-8 text-powerbi-gray-500 dark:text-powerbi-gray-400">No expenses recorded for this item.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-powerbi-gray-100 dark:bg-powerbi-gray-900">
                        <tr>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Date</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Category</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Description</th>
                          <th className="text-left px-3 py-2 sm:px-6 sm:py-3 text-xs font-semibold text-powerbi-gray-900 dark:text-white">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                        {expensesItems.map((e) => (
                          <tr key={e.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-900/50">
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-900 dark:text-white">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{e.category || '-'}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{e.description || '-'}</td>
                            <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">
                              {new Intl.NumberFormat(undefined, { style: 'currency', currency: userProfile?.currency || 'USD' }).format(e.amount || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {selectedItem && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button onClick={() => {
                      setExpenseInvId(selectedItem.id.toString());
                      setShowExpensesHistory(false);
                      setShowAddExpense(true);
                    }} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Add Expense</button>
                    <button onClick={() => setShowExpensesHistory(false)} className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600">Close</button>
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
