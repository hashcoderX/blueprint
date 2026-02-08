'use client';

import { useEffect, useState, Suspense } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, Target, CheckSquare, DollarSign, Calendar, Filter } from 'lucide-react';

type TypeOption = 'all' | 'expenses' | 'goals' | 'tasks';

function SearchContent() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const sp = useSearchParams();
  const initialQuery = sp.get('query') || '';
  const [q, setQ] = useState(initialQuery);
  const [type, setType] = useState<TypeOption>('all');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({ type: 'all', expenses: [], goals: [], tasks: [], pagination: null });
  const [error, setError] = useState<string | null>(null);

  const fetchSearch = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (type) params.set('type', type);
      if (minAmount) params.set('min_amount', minAmount);
      if (maxAmount) params.set('max_amount', maxAmount);
      if (status) params.set('status', status);
      const res = await fetch(`${API_BASE}/api/search?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        // mode: 'cors' // uncomment if backend requires explicit CORS mode
      });
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok) {
        const text = await res.text();
        setError(`Search failed (${res.status}). ${text.slice(0, 160)}`);
        setResults({ type: 'all', expenses: [], goals: [], tasks: [], pagination: null });
        return;
      }
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        setError(`Unexpected response type. Expected JSON, received: ${text.slice(0, 160)}`);
        setResults({ type: 'all', expenses: [], goals: [], tasks: [], pagination: null });
        return;
      }
      const data = await res.json();
      setError(null);
      setResults(data);
    } catch (e) {
      console.error('Search failed', e);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Refetch when search params change
    const current = sp.get('query') || '';
    setQ(current);
    if (current) fetchSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white">Advanced Search</h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">Find expenses, goals, and tasks with flexible filters.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="col-span-1 lg:col-span-2 relative">
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-powerbi-gray-500" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search expenses, goals, tasks..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none"
              />
            </div>
            <div>
              <select value={type} onChange={(e) => setType(e.target.value as TypeOption)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <option value="all">All</option>
                <option value="expenses">Expenses</option>
                <option value="goals">Goals</option>
                <option value="tasks">Tasks</option>
              </select>
            </div>
            {type === 'expenses' && (
              <div className="flex gap-3">
                <input type="number" placeholder="Min" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
                <input type="number" placeholder="Max" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700" />
              </div>
            )}
            {(type === 'goals' || type === 'tasks') && (
              <div>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <option value="">Any Status</option>
                  {type === 'goals' ? (
                    <>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="todo">Todo</option>
                      <option value="inProgress">In Progress</option>
                      <option value="done">Done</option>
                    </>
                  )}
                </select>
              </div>
            )}
            <div className="flex items-center justify-end lg:justify-start gap-2">
              <button onClick={fetchSearch} className="inline-flex items-center gap-2 px-4 py-2 bg-powerbi-primary text-white rounded-xl">
                <Filter className="w-4 h-4" /> Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {error ? (
          <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
        ) : loading ? (
          <div className="text-powerbi-gray-600 dark:text-powerbi-gray-400">Searching...</div>
        ) : (
          <div className="space-y-6">
            {(results.type === 'all' || results.type === 'expenses') && (
              <section>
                <h2 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-red-600" /> Expenses</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(results.expenses || results.items || []).map((e: any, idx: number) => (
                    <div key={`exp-${e.id || idx}`} className="p-4 rounded-xl bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-powerbi-gray-900 dark:text-white">{e.description}</div>
                        <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{new Date(e.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{e.category}</div>
                      <div className="mt-1 font-bold text-red-600">{Number(e.amount).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(results.type === 'all' || results.type === 'goals') && (
              <section>
                <h2 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white flex items-center gap-2"><Target className="w-5 h-5 text-green-600" /> Goals</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(results.goals || results.items || []).map((g: any, idx: number) => (
                    <div key={`goal-${g.id || idx}`} className="p-4 rounded-xl bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-powerbi-gray-900 dark:text-white">{g.name}</div>
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{g.status}</span>
                      </div>
                      <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{g.category}</div>
                      <div className="mt-1 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Target: {g.target} • Current: {g.current}</div>
                      {g.target_date && (<div className="text-xs text-powerbi-gray-500">Target: {new Date(g.target_date).toLocaleDateString()}</div>)}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(results.type === 'all' || results.type === 'tasks') && (
              <section>
                <h2 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white flex items-center gap-2"><CheckSquare className="w-5 h-5 text-blue-600" /> Tasks</h2>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(results.tasks || results.items || []).map((t: any, idx: number) => (
                    <div key={`task-${t.id || idx}`} className="p-4 rounded-xl bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-powerbi-gray-900 dark:text-white">{t.title}</div>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">{t.status}</span>
                      </div>
                      <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{t.category} • {t.priority}</div>
                      {t.planned_date && (<div className="text-xs text-powerbi-gray-500"><Calendar className="inline w-3 h-3 mr-1" /> {new Date(t.planned_date).toLocaleDateString()}</div>)}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AdvancedSearch() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}