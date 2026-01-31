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
};

export default function GemInventory() {
  const router = useRouter();
  const [items, setItems] = useState<GemInventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  
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
      
      const res = await fetch(`http://localhost:3001/api/gem/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to load inventory', e);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadInventory(); }, [page, gemNameFilter, weightMinFilter, weightMaxFilter, colorFilter, statusFilter]);
  
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
      
      const res = await fetch('http://localhost:3001/api/gem/inventory', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
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
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Valuation</p>
                <p className="text-3xl font-bold">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(totalValuation)}</p>
              </div>
              <Gem className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Available Items</p>
                <p className="text-3xl font-bold">{availableCount}</p>
              </div>
              <Filter className="w-8 h-8 text-emerald-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Items</p>
                <p className="text-3xl font-bold">{total}</p>
              </div>
              <Search className="w-8 h-8 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            Filters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Image</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Gem Name</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Weight (ct)</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Color</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Purchase Price</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Current Value</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Qty</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-powerbi-gray-900 dark:text-white">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      Loading inventory...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      No items found. Add your first item to get started.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-900/50">
                      <td className="px-6 py-4">
                        {item.images && item.images.length > 0 ? (
                          <img
                            src={`http://localhost:3001${item.images[0].url}`}
                            alt={item.gem_name}
                            className="w-12 h-12 rounded-lg object-cover border border-powerbi-gray-200 dark:border-powerbi-gray-700"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 flex items-center justify-center">
                            <Gem className="w-6 h-6 text-powerbi-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-powerbi-gray-900 dark:text-white">
                        {item.gem_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {item.weight.toFixed(3)}
                      </td>
                      <td className="px-6 py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {item.color || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.purchase_price)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(item.current_value || item.purchase_price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : item.status === 'sold'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700">
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
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h4 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add Inventory Item</h4>
              </div>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Gem Name *</label>
                    <input value={gemName} onChange={e => setGemName(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Sapphire" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Weight (ct) *</label>
                    <input value={weight} onChange={e => setWeight(e.target.value)} type="number" step="0.001" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 2.5" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Color</label>
                    <input value={color} onChange={e => setColor(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. Blue" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Clarity</label>
                    <input value={clarity} onChange={e => setClarity(e.target.value)} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. VS" />
                  </div>
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
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Purchase Price *</label>
                    <input value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} type="number" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 500.00" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Current Value</label>
                    <input value={currentValue} onChange={e => setCurrentValue(e.target.value)} type="number" step="0.01" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="e.g. 600.00" />
                  </div>
                  <div>
                    <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Quantity</label>
                    <input value={quantity} onChange={e => setQuantity(e.target.value)} type="number" min="1" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="1" />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" placeholder="Additional notes about this gem" />
                </div>
                <div>
                  <label className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1 block">Images</label>
                  <input onChange={e => setFiles(e.target.files)} type="file" multiple accept="image/*" className="w-full rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2" />
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
                <button onClick={handleAddItem} disabled={isSubmitting} className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-60 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
