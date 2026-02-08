'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useMemo, useState, useCallback } from 'react';

type EntryType = 'expense' | 'income';

interface VehicleEntry {
  id: number;
  description: string;
  amount: number; // always positive in UI
  date: string;
  vehicle: string;
  type: EntryType;
}

interface Vehicle {
  id: number;
  name: string;
  make: string;
  model: string;
  year: number;
  vehicle_no: string;
}

// removed unused currency helper to satisfy lint

export default function VehicleExpenses() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<VehicleEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState<VehicleEntry | null>(null);
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [activeTab, setActiveTab] = useState<'entries' | 'vehicles'>('entries');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<VehicleEntry | null>(null);
  const [form, setForm] = useState({
    description: '',
    vehicle: '',
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    type: 'expense' as EntryType,
  });
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vehicle_no: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Currency formatting function using user's selected currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: userCurrency }).format(amount);
  };

  const parseJsonResponse = async (res: Response) => {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text().catch(() => '');
      throw new Error(`Expected JSON, got ${ct} ${res.status}: ${text.substring(0, 200)}`);
    }
    return res.json();
  };

  const fetchEntries = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicle-expenses`, { headers: { Authorization: `Bearer ${token}` } });
      const data: VehicleEntry[] = await parseJsonResponse(res);
      if (Array.isArray(data)) setEntries(data);
    } catch (e) {
      console.error('Error fetching vehicle entries:', e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  

  const vehicleOptions = useMemo(() => vehicles.map(v => v.name), [vehicles]);

  const filtered = useMemo(() => filterVehicle === 'all' ? entries : entries.filter(e => e.vehicle === filterVehicle), [entries, filterVehicle]);

  const totals = useMemo(() => {
    const income = filtered.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = filtered.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const openAdd = () => {
    setForm({ description: '', vehicle: '', amount: 0, date: new Date().toISOString().slice(0, 10), type: 'expense' });
    setShowAdd(true);
  };

  const openEdit = (entry: VehicleEntry) => {
    setSelected(entry);
    setForm({ description: entry.description, vehicle: entry.vehicle, amount: entry.amount, date: entry.date, type: entry.type });
    setShowEdit(true);
  };

  const openDetails = (entry: VehicleEntry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicle-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: t('pages.vehicleExpenses.messages.entryAdded') });
        setShowAdd(false);
        fetchEntries();
      } else {
        setMessage({ type: 'error', text: data.error || t('pages.vehicleExpenses.messages.failedToAdd') });
      }
    } catch (e) {
      console.error('Add entry error:', e);
      setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToAdd') });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selected) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicle-expenses/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: t('pages.vehicleExpenses.messages.entryUpdated') });
        setShowEdit(false);
        setSelected(null);
        fetchEntries();
      } else {
        setMessage({ type: 'error', text: data.error || t('pages.vehicleExpenses.messages.failedToUpdate') });
      }
    } catch (e) {
      console.error('Update entry error:', e);
      setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToUpdate') });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicle-expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setMessage({ type: 'success', text: t('pages.vehicleExpenses.messages.entryDeleted') });
        fetchEntries();
      } else {
        setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToDelete') });
      }
    } catch (e) {
      console.error('Delete entry error:', e);
      setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToDelete') });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const fetchVehicles = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicles`, { headers: { Authorization: `Bearer ${token}` } });
      const data: Vehicle[] = await parseJsonResponse(res);
      if (Array.isArray(data)) setVehicles(data);
    } catch (e) {
      console.error('Error fetching vehicles:', e);
    }
  }, [token]);

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await parseJsonResponse(res);
      if (data.currency) setUserCurrency(data.currency);
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  }, [token]);

  useEffect(() => {
    fetchEntries();
    fetchVehicles();
    fetchUserProfile();
  }, [fetchEntries, fetchVehicles, fetchUserProfile]);

  const submitAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(vehicleForm),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: t('pages.vehicleExpenses.messages.vehicleAdded') });
        setShowAddVehicle(false);
        fetchVehicles();
        setVehicleForm({ name: '', make: '', model: '', year: new Date().getFullYear(), vehicle_no: '' });
      } else {
        setMessage({ type: 'error', text: data.error || t('pages.vehicleExpenses.messages.failedToAddVehicle') });
      }
    } catch (e) {
      console.error('Add vehicle error:', e);
      setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToAddVehicle') });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const submitEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedVehicle) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicles/${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(vehicleForm),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: t('pages.vehicleExpenses.messages.vehicleUpdated') });
        setShowEditVehicle(false);
        setSelectedVehicle(null);
        fetchVehicles();
      } else {
        setMessage({ type: 'error', text: data.error || t('pages.vehicleExpenses.messages.failedToUpdateVehicle') });
      }
    } catch (e) {
      console.error('Update vehicle error:', e);
      setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToUpdateVehicle') });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setMessage({ type: 'success', text: t('pages.vehicleExpenses.messages.vehicleDeleted') });
        fetchVehicles();
      } else {
        setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToDeleteVehicle') });
      }
    } catch (e) {
      console.error('Delete vehicle error:', e);
      setMessage({ type: 'error', text: t('pages.vehicleExpenses.messages.failedToDeleteVehicle') });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const openEditVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleForm({ name: vehicle.name, make: vehicle.make, model: vehicle.model, year: vehicle.year, vehicle_no: vehicle.vehicle_no });
    setShowEditVehicle(true);
  };

  const openAddVehicle = () => {
    setVehicleForm({ name: '', make: '', model: '', year: new Date().getFullYear(), vehicle_no: '' });
    setShowAddVehicle(true);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 mt-16">
        {message && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl shadow-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">🚗</span>
              {t('pages.vehicleExpenses.title')}
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">Track costs and earnings by vehicle {loading && <span className="ml-2 text-xs italic">({t('common.loading')})</span>}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {activeTab === 'entries' && <button onClick={openAdd} className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap">{t('pages.vehicleExpenses.addEntry')}</button>}
            {activeTab === 'vehicles' && <button onClick={openAddVehicle} className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap">{t('pages.vehicleExpenses.addVehicle')}</button>}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-1">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('entries')} 
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium transition-colors ${activeTab === 'entries' ? 'bg-powerbi-primary text-white' : 'text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white'}`}
            >
              {t('pages.vehicleExpenses.tabs.entries')}
            </button>
            <button 
              onClick={() => setActiveTab('vehicles')} 
              className={`flex-1 py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-sm sm:text-base font-medium transition-colors ${activeTab === 'vehicles' ? 'bg-powerbi-primary text-white' : 'text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white'}`}
            >
              {t('pages.vehicleExpenses.tabs.vehicles')}
            </button>
          </div>
        </div>

        {activeTab === 'entries' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-emerald-100 text-sm font-medium">Income</p>
                    <p className="text-emerald-100 text-sm font-medium">{t('pages.vehicleExpenses.income')}</p>
                  <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totals.income)}</p>
                </div><span className="text-emerald-200">💵</span></div>
              </div>
              <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-rose-100 text-sm font-medium">Expenses</p>
                    <p className="text-rose-100 text-sm font-medium">{t('pages.vehicleExpenses.expenses')}</p>
                  <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totals.expense)}</p>
                </div><span className="text-rose-200">🧾</span></div>
              </div>
              <div className={`rounded-2xl p-6 text-white ${totals.net >= 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'}`}>
                <div className="flex items-center justify-between"><div>
                  <p className="text-white/80 text-sm font-medium">Net</p>
                    <p className="text-white/80 text-sm font-medium">{t('pages.vehicleExpenses.net')}</p>
                  <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(totals.net)}</p>
                </div><span className="opacity-80">⚖️</span></div>
              </div>
            </div>

            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">{t('pages.vehicleExpenses.tabs.entries')}</h3>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <label className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300">{t('pages.vehicleExpenses.vehicleLabel')}</label>
                  <select className="bg-white dark:bg-powerbi-gray-900 border rounded px-2 py-1 w-full sm:w-auto" value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}>
                    <option value="all">{t('common.all')}</option>
                    {vehicleOptions.map(v => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.type')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.description')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.vehicle')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.amount')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.date')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
                    {filtered.map((e) => (
                      <tr key={e.id} onClick={() => openDetails(e)} className="cursor-pointer hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${e.type === 'income' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'}`}>{t(`pages.vehicleExpenses.types.${e.type}`)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{e.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{e.vehicle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{formatCurrency(e.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">{e.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(e)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded">{t('buttons.edit')}</button>
                            <button onClick={() => handleDelete(e.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">{t('buttons.delete')}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">{t('pages.vehicleExpenses.noEntries')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'vehicles' && (
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">{t('pages.vehicleExpenses.tabs.vehicles')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.make')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.model')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.year')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.vehicleNo')}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">{t('pages.vehicleExpenses.tableHeaders.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{v.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{v.make}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{v.model}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{v.year}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{v.vehicle_no || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => openEditVehicle(v)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded">{t('buttons.edit')}</button>
                          <button onClick={() => handleDeleteVehicle(v.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">{t('buttons.delete')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!vehicles.length && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">{t('pages.vehicleExpenses.noVehicles')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.vehicleExpenses.addEntry')}</h3>
                <form onSubmit={submitAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.type')}</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EntryType })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                      <option value="expense">{t('pages.vehicleExpenses.types.expense')}</option>
                      <option value="income">{t('pages.vehicleExpenses.types.income')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.description')}</label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.vehicle')}</label>
                      <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                        <option value="">{t('pages.vehicleExpenses.labels.selectVehicle')}</option>
                        {vehicleOptions.map(v => (<option key={v} value={v}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.amount')}</label>
                      <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.date')}</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">{t('buttons.cancel')}</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">{t('buttons.add')}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.vehicleExpenses.editEntry')}</h3>
                <form onSubmit={submitEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.type')}</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EntryType })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                      <option value="expense">{t('pages.vehicleExpenses.types.expense')}</option>
                      <option value="income">{t('pages.vehicleExpenses.types.income')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.description')}</label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.vehicle')}</label>
                      <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                        <option value="">Select vehicle</option>
                        {vehicleOptions.map(v => (<option key={v} value={v}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.amount')}</label>
                      <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.date')}</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => { setShowEdit(false); setSelected(null); }} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">{t('buttons.cancel')}</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">{t('buttons.save')}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.vehicleExpenses.addVehicle')}</h3>
                <form onSubmit={submitAddVehicle} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.name')}</label>
                    <input value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.make')}</label>
                      <input value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.model')}</label>
                      <input value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.year')}</label>
                    <input type="number" min="1900" max={new Date().getFullYear() + 1} value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.vehicleNo')}</label>
                    <input value={vehicleForm.vehicle_no} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })} placeholder="e.g. ABC-123" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddVehicle(false)} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">{t('buttons.cancel')}</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">{t('buttons.add')}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Vehicle Modal */}
        {showEditVehicle && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('buttons.edit')} {t('pages.vehicleExpenses.tabs.vehicles')}</h3>
                <form onSubmit={submitEditVehicle} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.name')}</label>
                    <input value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.make')}</label>
                      <input value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.model')}</label>
                      <input value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.year')}</label>
                    <input type="number" min="1900" max={new Date().getFullYear() + 1} value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">{t('pages.vehicleExpenses.labels.vehicleNo')}</label>
                    <input value={vehicleForm.vehicle_no} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })} placeholder="e.g. ABC-123" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => { setShowEditVehicle(false); setSelectedVehicle(null); }} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">{t('buttons.cancel')}</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">{t('buttons.save')}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">{t('pages.vehicleExpenses.detailsTitle')}</h3>
                  <button
                    onClick={() => { setShowDetails(false); setSelectedEntry(null); }}
                    className="text-powerbi-gray-400 hover:text-powerbi-gray-600 dark:hover:text-powerbi-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedEntry.type === 'income' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'}`}>
                      {selectedEntry.type.charAt(0).toUpperCase() + selectedEntry.type.slice(1)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.vehicleExpenses.labels.description')}</label>
                    <p className="text-powerbi-gray-900 dark:text-white text-lg">{selectedEntry.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.vehicleExpenses.labels.vehicle')}</label>
                      <p className="text-powerbi-gray-900 dark:text-white">{selectedEntry.vehicle}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.vehicleExpenses.labels.date')}</label>
                      <p className="text-powerbi-gray-900 dark:text-white">{selectedEntry.date}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.vehicleExpenses.labels.amount')}</label>
                    <p className={`text-2xl font-bold ${selectedEntry.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {selectedEntry.type === 'income' ? '+' : '-'}{formatCurrency(selectedEntry.amount)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-powerbi-gray-200 dark:border-powerbi-gray-600">
                  <button
                    onClick={() => { setShowDetails(false); setSelectedEntry(null); }}
                    className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200"
                  >
                    {t('buttons.close')}
                  </button>
                  <button
                    onClick={() => { setShowDetails(false); openEdit(selectedEntry); }}
                    className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl"
                  >
                    {t('pages.vehicleExpenses.editEntry')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}