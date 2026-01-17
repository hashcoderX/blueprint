'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface Task {
  id: number;
  title: string;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'low' | 'medium' | 'high';
  category: string;
  planned_date?: string | null;
  allocated_hours?: number;
}

interface ActiveLog { task_id: number; start_time: string; }

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeLogs, setActiveLogs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({
    title: '',
    priority: 'medium' as Task['priority'],
    category: 'job',
    planned_date: new Date().toISOString().slice(0, 10),
    allocated_hours: 1,
  });
  const [summary, setSummary] = useState<{ month: string; data: { category: string; hours: number }[] }>({ month: '', data: [] });
  const [activeTab, setActiveTab] = useState<'overview' | 'planner' | 'kanban' | 'analytics'>('overview');
  const [showAddForm, setShowAddForm] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = new URL('http://localhost:3001/api/tasks');
      if (!showAll && selectedDate) url.searchParams.set('date', selectedDate);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.error) setTasks(data);
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/tasks/logs/active', { headers: { Authorization: `Bearer ${token}` } });
      const data: ActiveLog[] = await res.json();
      if (Array.isArray(data)) {
        const map: Record<number, string> = {};
        data.forEach(d => { map[d.task_id] = d.start_time; });
        setActiveLogs(map);
      }
    } catch (e) {
      console.error('Error fetching active logs:', e);
    }
  };

  const fetchSummary = async (d: Date) => {
    if (!token) return;
    const month = d.toISOString().slice(0, 7);
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/summary?month=${month}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.error) setSummary(data);
    } catch (e) {
      console.error('Error fetching summary:', e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchActiveLogs();
    fetchSummary(new Date(selectedDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, showAll]);

  // lightweight ticking for running timers
  useEffect(() => {
    const id = setInterval(() => {
      if (Object.keys(activeLogs).length) {
        // trigger re-render
        setActiveLogs((prev) => ({ ...prev }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [activeLogs]);

  const tasksByStatus = useMemo(() => ({
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'inProgress'),
    done: tasks.filter(t => t.status === 'done'),
  }), [tasks]);

  const priorityColors: Record<Task['priority'], string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  const categoryColors: Record<string, string> = {
    job: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    farming: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    study: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    exercise: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    general: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !form.title.trim()) return;
    try {
      const res = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.error) {
        setForm({ ...form, title: '' });
        fetchTasks();
      }
    } catch (e) {
      console.error('Error creating task:', e);
    }
  };

  const handleUpdate = async (id: number, patch: Partial<Task>) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.error) fetchTasks();
    } catch (e) {
      console.error('Error updating task:', e);
    }
  };

  const handleStart = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${id}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.error) {
        setActiveLogs({ ...activeLogs, [id]: new Date().toISOString() });
        fetchTasks();
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
  };

  const handleStop = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${id}/stop`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.error) {
        const map = { ...activeLogs };
        delete map[id];
        setActiveLogs(map);
        fetchTasks();
        fetchSummary(new Date(selectedDate));
      }
    } catch (e) {
      console.error('Error stopping task:', e);
    }
  };

  const runningSince = (id: number): string | null => {
    const start = activeLogs[id];
    if (!start) return null;
    const ms = Date.now() - new Date(start).getTime();
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const monthChart = useMemo(() => {
    const labels = summary.data.map(d => d.category);
    const values = summary.data.map(d => d.hours);
    return {
      labels,
      datasets: [{
        label: 'Hours',
        data: values,
        backgroundColor: ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#6b7280'],
        borderWidth: 0,
      }]
    };
  }, [summary]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'inProgress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    const allocated = tasks.reduce((sum, t) => sum + (t.allocated_hours || 0), 0);
    const running = Object.keys(activeLogs).length;
    return { total, inProgress, done, allocated, running };
  }, [tasks, activeLogs]);

  const TaskTable = ({ data }: { data: Task[] }) => (
    <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
        <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white flex items-center">
          Task List
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Planned</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Alloc (h)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
            {data.map((task) => (
              <tr key={task.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{task.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                  <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[task.category] || categoryColors.general}`}>{task.category}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[task.priority]}`}>{task.priority}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white capitalize">{task.status.replace(/([A-Z])/g, ' $1')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{task.planned_date || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{task.allocated_hours || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="flex gap-2 justify-end">
                    {runningSince(task.id) ? (
                      <button onClick={() => handleStop(task.id)} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded">Stop</button>
                    ) : (
                      <button onClick={() => handleStart(task.id)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">Start</button>
                    )}
                    {task.status !== 'done' && (
                      <button onClick={() => handleUpdate(task.id, { status: 'done' })} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Done</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">⏱</span>
              Task Planner & Tracking
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Plan your day, track time, and see monthly summaries
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <span className="w-5 h-5">+</span>
              Add Task
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div><span className="text-blue-200">📋</span></div>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-amber-100 text-sm font-medium">In Progress</p>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
            </div><span className="text-amber-200">🚀</span></div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-green-100 text-sm font-medium">Done</p>
              <p className="text-3xl font-bold">{stats.done}</p>
            </div><span className="text-green-200">✅</span></div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-purple-100 text-sm font-medium">Allocated Hours</p>
              <p className="text-3xl font-bold">{stats.allocated.toFixed(1)}</p>
            </div><span className="text-purple-200">⏳</span></div>
          </div>
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-rose-100 text-sm font-medium">Active Timers</p>
              <p className="text-3xl font-bold">{stats.running}</p>
            </div><span className="text-rose-200">⏰</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'planner', label: 'Planner' },
              { id: 'kanban', label: 'Kanban' },
              { id: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-powerbi-primary text-white shadow-lg'
                    : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <TaskTable data={tasks.slice(0, 10)} />
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-200">Plan for</label>
                <input type="date" className="bg-white dark:bg-powerbi-gray-900 border rounded px-2 py-1"
                       value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                <label className="inline-flex items-center gap-2 text-sm text-powerbi-gray-700 dark:text-powerbi-gray-200 ml-3">
                  <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} /> Show all
                </label>
              </div>
              <TaskTable data={tasks} />
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(tasksByStatus).map(([column, columnTasks]) => (
                <div key={column} className="bg-powerbi-gray-100 dark:bg-powerbi-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 capitalize">
                    {column.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <div key={task.id} className="bg-white dark:bg-powerbi-gray-800 p-3 rounded shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-medium text-powerbi-gray-900 dark:text-white">{task.title}</h4>
                            <div className="flex flex-wrap gap-2 mt-2 items-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>{task.priority}</span>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${categoryColors[task.category] || categoryColors.general}`}>{task.category}</span>
                              {task.planned_date && <span className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-300">Plan: {task.planned_date}</span>}
                              {typeof task.allocated_hours === 'number' && task.allocated_hours > 0 && (
                                <span className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-300">Alloc: {task.allocated_hours}h</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {runningSince(task.id) && (
                              <div className="text-xs font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-1 rounded mb-2">
                                {runningSince(task.id)}
                              </div>
                            )}
                            <div className="flex gap-2 justify-end">
                              {runningSince(task.id) ? (
                                <button onClick={() => handleStop(task.id)} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded">Stop</button>
                              ) : (
                                <button onClick={() => handleStart(task.id)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">Start</button>
                              )}
                              {task.status !== 'done' && (
                                <button onClick={() => handleUpdate(task.id, { status: 'done' })} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Done</button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!columnTasks.length && <div className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">No tasks</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">This Month by Category</h3>
                  <div className="h-80">
                    <Bar data={monthChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  </div>
                </div>
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Share of Time</h3>
                  <div className="h-80 flex items-center justify-center">
                    <Doughnut data={monthChart} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Task Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Add Task</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Title</label>
                    <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                           className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Category</label>
                      <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                              className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white">
                        <option value="job">Job</option>
                        <option value="farming">Farming</option>
                        <option value="personal">Personal</option>
                        <option value="study">Study</option>
                        <option value="exercise">Exercise</option>
                        <option value="general">General</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Priority</label>
                      <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task['priority'] })}
                              className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Planned Date</label>
                      <input type="date" value={form.planned_date} onChange={e => setForm({ ...form, planned_date: e.target.value })}
                             className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Allocated Hours</label>
                      <input type="number" min={0} step={0.25} value={form.allocated_hours}
                             onChange={e => setForm({ ...form, allocated_hours: Number(e.target.value) })}
                             className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors">Cancel</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl transition-colors">Add Task</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="mt-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">Loading…</div>}
      </div>
    </DashboardLayout>
  );
}