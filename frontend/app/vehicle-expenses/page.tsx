'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useEffect, useMemo, useState } from 'react';

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

const currency = (n: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);

export default function VehicleExpenses() {
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

  const fetchEntries = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/vehicle-expenses', { headers: { Authorization: `Bearer ${token}` } });
      const data: VehicleEntry[] = await parseJsonResponse(res);
      if (Array.isArray(data)) setEntries(data);
    } catch (e) {
      console.error('Error fetching vehicle entries:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchEntries(); 
    fetchVehicles();
    fetchUserProfile();
  }, []);

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
      const res = await fetch('http://localhost:3001/api/vehicle-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: 'Entry added' });
        setShowAdd(false);
        fetchEntries();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add' });
      }
    } catch (e) {
      console.error('Add entry error:', e);
      setMessage({ type: 'error', text: 'Failed to add' });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selected) return;
    try {
      const res = await fetch(`http://localhost:3001/api/vehicle-expenses/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: 'Entry updated' });
        setShowEdit(false);
        setSelected(null);
        fetchEntries();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch (e) {
      console.error('Update entry error:', e);
      setMessage({ type: 'error', text: 'Failed to update' });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/vehicle-expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Entry deleted' });
        fetchEntries();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete' });
      }
    } catch (e) {
      console.error('Delete entry error:', e);
      setMessage({ type: 'error', text: 'Failed to delete' });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const fetchVehicles = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/vehicles', { headers: { Authorization: `Bearer ${token}` } });
      const data: Vehicle[] = await parseJsonResponse(res);
      if (Array.isArray(data)) setVehicles(data);
    } catch (e) {
      console.error('Error fetching vehicles:', e);
    }
  };

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      const data = await parseJsonResponse(res);
      if (data.currency) setUserCurrency(data.currency);
    } catch (e) {
      console.error('Error fetching user profile:', e);
    }
  };

  const submitAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(vehicleForm),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: 'Vehicle added' });
        setShowAddVehicle(false);
        fetchVehicles();
        setVehicleForm({ name: '', make: '', model: '', year: new Date().getFullYear(), vehicle_no: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add vehicle' });
      }
    } catch (e) {
      console.error('Add vehicle error:', e);
      setMessage({ type: 'error', text: 'Failed to add vehicle' });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const submitEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedVehicle) return;
    try {
      const res = await fetch(`http://localhost:3001/api/vehicles/${selectedVehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(vehicleForm),
      });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setMessage({ type: 'success', text: 'Vehicle updated' });
        setShowEditVehicle(false);
        setSelectedVehicle(null);
        fetchVehicles();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update vehicle' });
      }
    } catch (e) {
      console.error('Update vehicle error:', e);
      setMessage({ type: 'error', text: 'Failed to update vehicle' });
    } finally {
      setTimeout(() => setMessage(null), 2500);
    }
  };

  const handleDeleteVehicle = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/vehicles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Vehicle deleted' });
        fetchVehicles();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete vehicle' });
      }
    } catch (e) {
      console.error('Delete vehicle error:', e);
      setMessage({ type: 'error', text: 'Failed to delete vehicle' });
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">🚗</span>
              Vehicle Income & Expenses
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">Track costs and earnings by vehicle</p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'entries' && <button onClick={openAdd} className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors">+ Add Entry</button>}
            {activeTab === 'vehicles' && <button onClick={openAddVehicle} className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors">+ Add Vehicle</button>}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-1">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('entries')} 
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'entries' ? 'bg-powerbi-primary text-white' : 'text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white'}`}
            >
              Entries
            </button>
            <button 
              onClick={() => setActiveTab('vehicles')} 
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-colors ${activeTab === 'vehicles' ? 'bg-powerbi-primary text-white' : 'text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white'}`}
            >
              Vehicles
            </button>
          </div>
        </div>

        {activeTab === 'entries' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-emerald-100 text-sm font-medium">Income</p>
                  <p className="text-3xl font-bold">{formatCurrency(totals.income)}</p>
                </div><span className="text-emerald-200">💵</span></div>
              </div>
              <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-rose-100 text-sm font-medium">Expenses</p>
                  <p className="text-3xl font-bold">{formatCurrency(totals.expense)}</p>
                </div><span className="text-rose-200">🧾</span></div>
              </div>
              <div className={`rounded-2xl p-6 text-white ${totals.net >= 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-amber-400 to-amber-600'}`}>
                <div className="flex items-center justify-between"><div>
                  <p className="text-white/80 text-sm font-medium">Net</p>
                  <p className="text-3xl font-bold">{formatCurrency(totals.net)}</p>
                </div><span className="opacity-80">⚖️</span></div>
              </div>
            </div>

            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Entries</h3>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300">Vehicle</label>
                  <select className="bg-white dark:bg-powerbi-gray-900 border rounded px-2 py-1" value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}>
                    <option value="all">All</option>
                    {vehicleOptions.map(v => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Vehicle</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
                    {filtered.map((e) => (
                      <tr key={e.id} onClick={() => openDetails(e)} className="cursor-pointer hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${e.type === 'income' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'}`}>{e.type}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{e.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{e.vehicle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{formatCurrency(e.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">{e.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => openEdit(e)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded">Edit</button>
                            <button onClick={() => handleDelete(e.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">No entries</td></tr>
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
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Vehicles</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Make</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Year</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Vehicle No</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
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
                          <button onClick={() => openEditVehicle(v)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded">Edit</button>
                          <button onClick={() => handleDeleteVehicle(v.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!vehicles.length && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">No vehicles</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Add Entry</h3>
                <form onSubmit={submitAdd} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EntryType })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Description</label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Vehicle</label>
                      <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                        <option value="">Select vehicle</option>
                        {vehicleOptions.map(v => (<option key={v} value={v}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Amount</label>
                      <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">Cancel</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">Add</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEdit && selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Edit Entry</h3>
                <form onSubmit={submitEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Type</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EntryType })} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Description</label>
                    <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Vehicle</label>
                      <select value={form.vehicle} onChange={e => setForm({ ...form, vehicle: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white">
                        <option value="">Select vehicle</option>
                        {vehicleOptions.map(v => (<option key={v} value={v}>{v}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Amount</label>
                      <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Date</label>
                    <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => { setShowEdit(false); setSelected(null); }} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">Cancel</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showAddVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Add Vehicle</h3>
                <form onSubmit={submitAddVehicle} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Name</label>
                    <input value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Make</label>
                      <input value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Model</label>
                      <input value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Year</label>
                    <input type="number" min="1900" max={new Date().getFullYear() + 1} value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Vehicle No</label>
                    <input value={vehicleForm.vehicle_no} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })} placeholder="e.g. ABC-123" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowAddVehicle(false)} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">Cancel</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">Add</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Vehicle Modal */}
        {showEditVehicle && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Edit Vehicle</h3>
                <form onSubmit={submitEditVehicle} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Name</label>
                    <input value={vehicleForm.name} onChange={e => setVehicleForm({ ...vehicleForm, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Make</label>
                      <input value={vehicleForm.make} onChange={e => setVehicleForm({ ...vehicleForm, make: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Model</label>
                      <input value={vehicleForm.model} onChange={e => setVehicleForm({ ...vehicleForm, model: e.target.value })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Year</label>
                    <input type="number" min="1900" max={new Date().getFullYear() + 1} value={vehicleForm.year} onChange={e => setVehicleForm({ ...vehicleForm, year: Number(e.target.value) })} required className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Vehicle No</label>
                    <input value={vehicleForm.vehicle_no} onChange={e => setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })} placeholder="e.g. ABC-123" className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-powerbi-gray-700 border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => { setShowEditVehicle(false); setSelectedVehicle(null); }} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200">Cancel</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetails && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-lg w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Entry Details</h3>
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
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Description</label>
                    <p className="text-powerbi-gray-900 dark:text-white text-lg">{selectedEntry.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Vehicle</label>
                      <p className="text-powerbi-gray-900 dark:text-white">{selectedEntry.vehicle}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Date</label>
                      <p className="text-powerbi-gray-900 dark:text-white">{selectedEntry.date}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">Amount</label>
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
                    Close
                  </button>
                  <button
                    onClick={() => { setShowDetails(false); openEdit(selectedEntry); }}
                    className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl"
                  >
                    Edit Entry
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