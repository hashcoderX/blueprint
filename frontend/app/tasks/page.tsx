'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect, useMemo, useCallback } from 'react';
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
type ActiveTabType = 'overview' | 'planner' | 'kanban' | 'analytics';
interface TaskTimeLog { task_id: number; start_time: string; end_time?: string | null; minutes?: number; }

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${year}-${month}-${day} ${hour12}.${minutes} ${ampm}`;
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeLogs, setActiveLogs] = useState<Record<number, string>>({});
  const [accumulatedMinutes, setAccumulatedMinutes] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [showAll, setShowAll] = useState(false);
  const [form, setForm] = useState({
    title: '',
    priority: 'medium' as Task['priority'],
    category: 'job',
    planned_date: new Date().toISOString().slice(0, 16),
    allocated_hours: 1,
  });
  const [summary, setSummary] = useState<{ month: string; data: { category: string; hours: number }[] }>({ month: '', data: [] });
  const [activeTab, setActiveTab] = useState<ActiveTabType>('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskTimeLogs, setTaskTimeLogs] = useState<TaskTimeLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    priority: 'medium' as Task['priority'],
    category: 'job',
    planned_date: '',
    allocated_hours: 0,
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const parseJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      throw new Error(`Expected JSON, got '${contentType}' with status ${res.status}: ${text.substring(0, 200)}`);
    }
    return res.json();
  };

  const fetchTasks = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const url = new URL('http://localhost:3001/api/tasks');
      if (!showAll && selectedDate) url.searchParams.set('date', selectedDate);
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const data = await parseJsonResponse(res);
      if (res.ok && !data.error) setTasks(data);
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
      const data: ActiveLog[] = await parseJsonResponse(res);
      if (Array.isArray(data)) {
        const map: Record<number, string> = {};
        data.forEach(d => { map[d.task_id] = d.start_time; });
        setActiveLogs(map);
      }
    } catch (e) {
      console.error('Error fetching active logs:', e);
    }
  };

  const fetchTimeSummary = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/tasks/time/summary', { headers: { Authorization: `Bearer ${token}` } });
      const rows: { task_id: number; minutes: number }[] = await parseJsonResponse(res);
      if (Array.isArray(rows)) {
        const map: Record<number, number> = {};
        rows.forEach(r => { map[r.task_id] = Number(r.minutes) || 0; });
        setAccumulatedMinutes(map);
      }
    } catch (e) {
      console.error('Error fetching time summary:', e);
    }
  };

  const fetchSummary = async (d: Date) => {
    if (!token) return;
    const month = d.toISOString().slice(0, 7);
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/summary?month=${month}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await parseJsonResponse(res);
      if (res.ok && !data.error) setSummary(data);
    } catch (e) {
      console.error('Error fetching summary:', e);
    }
  };

  const fetchTaskTimeLogs = async (taskId: number) => {
    if (!token) {
      console.error('No token available for fetching task time logs');
      return;
    }
    try {
      console.log('Fetching time logs for task:', taskId);
      const res = await fetch(`http://localhost:3001/api/tasks/${taskId}/logs`, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Response status:', res.status, res.statusText);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        console.error('Failed to fetch task time logs:', res.status, res.statusText);
        const text = await res.text();
        console.error('Response text:', text.substring(0, 500));
        return;
      }
      
      const data = await res.json();
      console.log('Received data:', data);
      if (!data.error) {
        setTaskTimeLogs(data);
      } else {
        console.error('API returned error:', data.error);
      }
    } catch (e) {
      console.error('Error fetching task time logs:', e);
    }
  };

  const handleTaskClick = async (task: Task) => {
    setSelectedTask(task);
    await fetchTaskTimeLogs(task.id);
    setShowTaskDetailModal(true);
  };

  const getTotalTimeSpent = () => {
    return taskTimeLogs.reduce((total, log) => total + (log.minutes || 0), 0);
  };

  const formatTimeSpent = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Pagination logic
  const getPaginatedData = useCallback((data: Task[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [currentPage, itemsPerPage]);

  const getTotalPages = (data: Task[]) => {
    return Math.ceil(data.length / itemsPerPage);
  };

  const PaginationControls = ({ data }: { data: Task[] }) => {
    const totalPages = getTotalPages(data);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-powerbi-gray-800 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700">
        <div className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, data.length)} of {data.length} tasks
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 rounded hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 text-sm rounded ${
                    currentPage === pageNum
                      ? 'bg-powerbi-primary text-white'
                      : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 rounded hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchTasks();
    fetchActiveLogs();
    fetchTimeSummary();
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

  const tasksByStatus = useMemo(() => {
    const paginatedTasks = getPaginatedData(tasks);
    return {
      todo: paginatedTasks.filter(t => t.status === 'todo'),
      inProgress: paginatedTasks.filter(t => t.status === 'inProgress'),
      done: paginatedTasks.filter(t => t.status === 'done'),
    };
  }, [tasks, getPaginatedData]);

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
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setForm({ ...form, title: '', planned_date: new Date().toISOString().slice(0, 16), allocated_hours: 1 });
        setShowAddForm(false);
        setMessage({ type: 'success', text: 'Task added successfully!' });
        fetchTasks();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add task' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error('Error creating task:', e);
      setMessage({ type: 'error', text: 'Failed to add task' });
      setTimeout(() => setMessage(null), 3000);
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
      const data = await parseJsonResponse(res);
      if (!data.error) fetchTasks();
    } catch (e) {
      console.error('Error updating task:', e);
    }
  };

  const handleStart = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${id}/start`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        setActiveLogs({ ...activeLogs, [id]: new Date().toISOString() });
        fetchTasks();
        // keep accumulated minutes; no need to refresh here
      }
    } catch (e) {
      console.error('Error starting task:', e);
    }
  };

  const handleStop = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${id}/stop`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await parseJsonResponse(res);
      if (!data.error) {
        const map = { ...activeLogs };
        delete map[id];
        setActiveLogs(map);
        fetchTasks();
        fetchSummary(new Date(selectedDate));
        // refresh accumulated minutes from DB so paused time is held
        fetchTimeSummary();
      }
    } catch (e) {
      console.error('Error stopping task:', e);
    }
  };

  const handleDone = async (id: number) => {
    if (!token) return;
    // If running, stop it first to log the time
    if (activeLogs[id]) {
      await handleStop(id);
    }
    // Then update status to done
    await handleUpdate(id, { status: 'done' });
  };

  const handleDelete = async (id: number) => {
    setTaskToDelete(id);
    setShowDeleteModal(true);
  };

  const openEdit = (task: Task) => {
    setEditTask(task);
    setEditForm({
      title: task.title,
      priority: task.priority,
      category: task.category,
      planned_date: task.planned_date ? new Date(task.planned_date).toISOString().slice(0, 16) : '',
      allocated_hours: typeof task.allocated_hours === 'number' ? task.allocated_hours : 0,
    });
    setShowEditModal(true);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    const patch: Partial<Task> = {
      title: editForm.title,
      priority: editForm.priority,
      category: editForm.category,
      planned_date: editForm.planned_date || null,
      allocated_hours: editForm.allocated_hours,
    };
    await handleUpdate(editTask.id, patch);
    setShowEditModal(false);
    setEditTask(null);
  };

  const confirmDelete = async () => {
    if (!taskToDelete || !token) return;
    try {
      const res = await fetch(`http://localhost:3001/api/tasks/${taskToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Task deleted successfully!' });
        fetchTasks();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to delete task' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (e) {
      console.error('Error deleting task:', e);
      setMessage({ type: 'error', text: 'Failed to delete task' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setShowDeleteModal(false);
      setTaskToDelete(null);
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

  const displayElapsed = (id: number): string | null => {
    const baseMin = accumulatedMinutes[id] || 0;
    const baseSec = baseMin * 60;
    const start = activeLogs[id];
    let totalSec = baseSec;
    if (start) {
      totalSec += Math.floor((Date.now() - new Date(start).getTime()) / 1000);
    }
    if (totalSec <= 0) return null;
    const h = Math.floor(totalSec / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
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
    const allocated = tasks.reduce((sum, t) => sum + (Number(t.allocated_hours) || 0), 0);
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
              <tr key={task.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 cursor-pointer" onClick={() => handleTaskClick(task)}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{task.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                  <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[task.category] || categoryColors.general}`}>{task.category}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${priorityColors[task.priority]}`}>{task.priority}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white capitalize">{task.status.replace(/([A-Z])/g, ' $1')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{formatDate(task.planned_date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{task.allocated_hours || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(task)} className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded">Edit</button>
                    {task.status !== 'done' && (
                      <>
                        {runningSince(task.id) ? (
                          <button onClick={() => handleStop(task.id)} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded">Stop</button>
                        ) : (
                          <button onClick={() => handleStart(task.id)} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">Start</button>
                        )}
                        <button onClick={() => handleDone(task.id)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Done</button>
                      </>
                    )}
                    <button onClick={() => handleDelete(task.id)} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Delete</button>
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
      <div className="max-w-7xl mx-auto space-y-8 mt-16 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">⏱</span>
              Task Planner & Tracking
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Plan your day, track time, and see monthly summaries
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap"
            >
              <span className="w-5 h-5">+</span>
              Add Task
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-blue-100 text-sm font-medium">Total Tasks</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.total}</p>
            </div><span className="text-blue-200">📋</span></div>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-amber-100 text-sm font-medium">In Progress</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.inProgress}</p>
            </div><span className="text-amber-200">🚀</span></div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-green-100 text-sm font-medium">Done</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.done}</p>
            </div><span className="text-green-200">✅</span></div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-purple-100 text-sm font-medium">Allocated Hours</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.allocated.toFixed(1)}</p>
            </div><span className="text-purple-200">⏳</span></div>
          </div>
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-rose-100 text-sm font-medium">Active Timers</p>
              <p className="text-2xl sm:text-3xl font-bold">{stats.running}</p>
            </div><span className="text-rose-200">⏰</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'planner', label: 'Planner' },
              { id: 'kanban', label: 'Kanban' },
              { id: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTabType)}
                className={`flex items-center px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-powerbi-primary text-white shadow-lg'
                    : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {message.text}
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
                <TaskTable data={getPaginatedData(tasks)} />
                <PaginationControls data={tasks} />
              </div>
            </div>
          )}

          {activeTab === 'planner' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <label className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-200">Plan for</label>
                <input type="date" className="bg-white dark:bg-powerbi-gray-900 border rounded px-2 py-1 w-full sm:w-auto"
                       value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                <label className="inline-flex items-center gap-2 text-sm text-powerbi-gray-700 dark:text-powerbi-gray-200 sm:ml-3">
                  <input type="checkbox" checked={showAll} onChange={e => setShowAll(e.target.checked)} /> Show all
                </label>
              </div>
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
                <TaskTable data={getPaginatedData(tasks)} />
                <PaginationControls data={tasks} />
              </div>
            </div>
          )}

          {activeTab === 'kanban' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(tasksByStatus).map(([column, columnTasks]) => (
                <div key={column} className="bg-powerbi-gray-100 dark:bg-powerbi-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 capitalize">
                    {column.replace(/([A-Z])/g, ' $1')}
                  </h3>
                  <div className="space-y-3">
                    {columnTasks.map((task) => (
                      <div key={task.id} className="bg-white dark:bg-powerbi-gray-800 p-3 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTaskClick(task)}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-medium text-powerbi-gray-900 dark:text-white">{task.title}</h4>
                            <div className="flex flex-wrap gap-2 mt-2 items-center">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>{task.priority}</span>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${categoryColors[task.category] || categoryColors.general}`}>{task.category}</span>
                              {task.planned_date && <span className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-300">Plan: {formatDate(task.planned_date)}</span>}
                              {typeof task.allocated_hours === 'number' && task.allocated_hours > 0 && (
                                <span className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-300">Alloc: {task.allocated_hours}h</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {displayElapsed(task.id) && (
                              <div className="text-xs font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-1 rounded mb-2">
                                {displayElapsed(task.id)}
                              </div>
                            )}
                            <div className="flex gap-2 justify-end">
                                <button onClick={(e) => { e.stopPropagation(); openEdit(task); }} className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded">Edit</button>
                              {task.status !== 'done' && (
                                <>
                                  {runningSince(task.id) ? (
                                    <button onClick={(e) => { e.stopPropagation(); handleStop(task.id); }} className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 rounded">Pause</button>
                                  ) : (
                                    <button onClick={(e) => { e.stopPropagation(); handleStart(task.id); }} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 rounded">Start</button>
                                  )}
                                  <button onClick={(e) => { e.stopPropagation(); handleDone(task.id); }} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Done</button>
                                </>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Delete</button>
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
            <PaginationControls data={tasks} />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">This Month by Category</h3>
                  <div className="h-64 sm:h-80">
                    <Bar data={monthChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  </div>
                </div>
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Share of Time</h3>
                  <div className="h-64 sm:h-80">
                    <Doughnut
                      data={monthChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        cutout: '60%'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit Task Modal */}
        {showEditModal && editTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Edit Task</h3>
                <form onSubmit={submitEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Title</label>
                    <input type="text" required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                           className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Category</label>
                      <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
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
                      <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value as Task['priority'] })}
                              className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Planned Date & Time</label>
                      <input type="datetime-local" value={editForm.planned_date} onChange={e => setEditForm({ ...editForm, planned_date: e.target.value })}
                             className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Allocated Hours</label>
                      <input type="number" min={0} step={0.25} value={editForm.allocated_hours}
                             onChange={e => setEditForm({ ...editForm, allocated_hours: Number(e.target.value) })}
                             className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => { setShowEditModal(false); setEditTask(null); }}
                            className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors">Cancel</button>
                    <button type="submit" className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl transition-colors">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        {/* Add Task Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
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
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Planned Date & Time</label>
                      <input type="datetime-local" value={form.planned_date} onChange={e => setForm({ ...form, planned_date: e.target.value })}
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

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Delete Task</h3>
                <p className="text-powerbi-gray-600 dark:text-powerbi-gray-300 mb-6">
                  Are you sure you want to delete this task? This action cannot be undone and will also delete all associated time logs.
                </p>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowDeleteModal(false); setTaskToDelete(null); }}
                          className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors">Cancel</button>
                  <button type="button" onClick={confirmDelete}
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl transition-colors">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {showTaskDetailModal && selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">{selectedTask.title}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`inline-block px-3 py-1 text-sm rounded-full ${priorityColors[selectedTask.priority]}`}>{selectedTask.priority}</span>
                      <span className={`inline-block px-3 py-1 text-sm rounded-full ${categoryColors[selectedTask.category] || categoryColors.general}`}>{selectedTask.category}</span>
                      <span className={`inline-block px-3 py-1 text-sm rounded-full ${selectedTask.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : selectedTask.status === 'inProgress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
                        {selectedTask.status.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setShowTaskDetailModal(false)} className="text-powerbi-gray-400 hover:text-powerbi-gray-600 dark:hover:text-powerbi-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Planned Date & Time</h4>
                    <p className="text-powerbi-gray-900 dark:text-white">{formatDate(selectedTask.planned_date)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Allocated Hours</h4>
                    <p className="text-powerbi-gray-900 dark:text-white">{selectedTask.allocated_hours || 0} hours</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Total Time Spent</h4>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatTimeSpent(getTotalTimeSpent())}</p>
                    <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{(getTotalTimeSpent() / 60).toFixed(2)} hours</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Current Status</h4>
                    <p className="text-powerbi-gray-900 dark:text-white capitalize">
                      {runningSince(selectedTask.id) ? `Running (${runningSince(selectedTask.id)})` : selectedTask.status.replace(/([A-Z])/g, ' $1')}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-medium text-powerbi-gray-900 dark:text-white mb-4">Time Sessions</h4>
                  {taskTimeLogs.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {taskTimeLogs.map((log, idx) => (
                        <div key={`${log.task_id}-${log.start_time}-${idx}`} className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700 p-3 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">
                                Started: {formatDate(log.start_time)}
                              </p>
                              {log.end_time && (
                                <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">
                                  Ended: {formatDate(log.end_time)}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">
                                {log.minutes ? formatTimeSpent(log.minutes) : 'Running...'}
                              </p>
                              {log.minutes && (
                                <p className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400">
                                  {(log.minutes / 60).toFixed(2)} hours
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-powerbi-gray-500 dark:text-powerbi-gray-400">No time sessions recorded yet.</p>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setShowTaskDetailModal(false)} className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors">Close</button>
                  {selectedTask.status !== 'done' && (
                    <>
                      {runningSince(selectedTask.id) ? (
                        <button onClick={() => { handleStop(selectedTask.id); setShowTaskDetailModal(false); }} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl transition-colors">Stop Timer</button>
                      ) : (
                        <button onClick={() => { handleStart(selectedTask.id); setShowTaskDetailModal(false); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors">Start Timer</button>
                      )}
                      <button onClick={() => { handleDone(selectedTask.id); setShowTaskDetailModal(false); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors">Mark Done</button>
                    </>
                  )}
                  <button onClick={() => { handleDelete(selectedTask.id); setShowTaskDetailModal(false); }} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors">Delete Task</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="mt-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">Loading…</div>}
      </div>
    </DashboardLayout>
  );
}