'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Target, Calendar, Search, Eye, AlertTriangle } from 'lucide-react';

interface Goal {
  id: number;
  name: string;
  description: string;
  category: string;
  current: number;
  target: number;
  target_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  progress_percentage: number;
  notes: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface GoalStats {
  total_goals: number;
  completed_goals: number;
  active_goals: number;
  avg_progress: number;
  total_current: number;
  total_target: number;
  overdue_goals: number;
  completion_rate: number;
  total_savings_rate: number;
}

const categoryColors: Record<string, string> = {
  'Savings': 'green',
  'Investment': 'blue',
  'Debt Payoff': 'red',
  'Emergency Fund': 'yellow',
  'Vacation': 'purple',
  'Car': 'orange',
  'Home': 'indigo',
  'Education': 'teal',
  'Health': 'pink',
  'Other': 'gray'
};

const getCategoryColor = (category: string) => {
  const color = categoryColors[category] || 'gray';
  const gradients: Record<string, string> = {
    green: 'from-green-500 to-green-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    indigo: 'from-indigo-500 to-indigo-600',
    teal: 'from-teal-500 to-teal-600',
    pink: 'from-pink-500 to-pink-600',
    gray: 'from-gray-500 to-gray-600'
  };
  return {
    bg: `bg-${color}-100 dark:bg-${color}-900`,
    text: `text-${color}-800 dark:text-${color}-300`,
    border: `border-${color}-200 dark:border-${color}-700`,
    progress: gradients[color] || 'from-blue-500 to-green-500'
  };
};

// Deterministic date formatting to avoid hydration mismatches and ensure availability in all components
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  } catch {
    return '';
  }
}

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<GoalStats | null>(null);
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ show: boolean; goalId: number | null }>({ show: false, goalId: null });
  const [showErrorModal, setShowErrorModal] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [isUpdatingGoal, setIsUpdatingGoal] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    priority: 'all',
    search: ''
  });
  const [userCurrency, setUserCurrency] = useState('USD');

  const categories = ['Savings', 'Investment', 'Debt Payoff', 'Emergency Fund', 'Vacation', 'Car', 'Home', 'Education', 'Health', 'Other'];
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['active', 'completed', 'paused'];

  const fetchGoals = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const queryParams = new URLSearchParams();
    if (filters.category !== 'all') queryParams.append('category', filters.category);
    if (filters.status !== 'all') queryParams.append('status', filters.status);
    if (filters.priority !== 'all') queryParams.append('priority', filters.priority);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) {
        console.error('Error:', data.error);
      } else {
        setGoals(data.filter((goal: Goal) =>
          goal.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          goal.description.toLowerCase().includes(filters.search.toLowerCase())
        ));
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGoals();
    fetchStats();
    fetchUserProfile();
  }, [filters, fetchGoals]);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUserCurrency(userData.currency || 'USD');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: userCurrency }).format(amount);
  };

  // fetchGoals wrapped in useCallback above

  // formatDate is defined at module scope for reuse

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals/stats/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!data.error) {
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleCreateGoal = async (goalData: Partial<Goal>) => {
    setIsCreatingGoal(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setIsCreatingGoal(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalData)
      });
      const data = await res.json();
      if (data.error) {
        setFormError('Error creating goal: ' + data.error);
      } else {
        setGoals([data, ...goals]);
        setShowCreateForm(false);
        setFormError(null);
        fetchStats();
      }
    } catch (err) {
      console.error('Error creating goal:', err);
      setFormError('Error creating goal: Network error');
    } finally {
      setIsCreatingGoal(false);
    }
  };

  const handleUpdateGoal = async (goalData: Partial<Goal>) => {
    setIsUpdatingGoal(true);
    const token = localStorage.getItem('token');
    if (!token || !editingGoal) {
      setIsUpdatingGoal(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals/${editingGoal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goalData)
      });
      const data = await res.json();
      if (data.error) {
        setShowErrorModal({ show: true, message: 'Error updating goal: ' + data.error });
      } else {
        setGoals(goals.map(g => g.id === editingGoal.id ? data : g));
        setEditingGoal(null);
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating goal:', err);
      setShowErrorModal({ show: true, message: 'Error updating goal' });
    } finally {
      setIsUpdatingGoal(false);
    }
  };

  const handleDeleteGoal = async (goalId: number) => {
    setShowConfirmDelete({ show: true, goalId });
  };

  const confirmDeleteGoal = async () => {
    const goalId = showConfirmDelete.goalId;
    if (!goalId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) {
        setShowErrorModal({ show: true, message: 'Error deleting goal: ' + data.error });
      } else {
        setGoals(goals.filter(g => g.id !== goalId));
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting goal:', err);
      setShowErrorModal({ show: true, message: 'Error deleting goal' });
    } finally {
      setShowConfirmDelete({ show: false, goalId: null });
    }
  };

  const handleProgressUpdate = async (goalId: number, amount: number, description: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount, description })
      });
      const data = await res.json();
      if (data.error) {
        setShowErrorModal({ show: true, message: 'Error updating progress: ' + data.error });
      } else {
        // Update goals list and currently viewing goal to reflect changes immediately
        setGoals(goals.map(g => g.id === goalId ? data.goal : g));
        setViewingGoal(data.goal);
        fetchStats();
      }
    } catch (err) {
      console.error('Error updating progress:', err);
      setShowErrorModal({ show: true, message: 'Error updating progress' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const isOverdue = (targetDate: string, status: string) => {
    return new Date(targetDate) < new Date() && status !== 'completed';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-8 mt-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-powerbi-gray-900 dark:text-white flex items-center text-center sm:text-left">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">🎯</span>
              {t('pages.goals.title')}
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1 text-center sm:text-left">
              Track, prioritize, and achieve your financial goals
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Goal
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">{t('pages.goals.totalGoals')}</p>
                  <p className="text-3xl font-bold">{stats.total_goals}</p>
                </div>
                <span className="text-blue-200">📋</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold">{stats.completed_goals}</p>
                </div>
                <span className="text-green-200">✅</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Avg Progress</p>
                  <p className="text-3xl font-bold">{Math.round(stats.avg_progress || 0)}%</p>
                </div>
                <span className="text-purple-200">📈</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rose-100 text-sm font-medium">Overdue</p>
                  <p className="text-3xl font-bold">{stats.overdue_goals}</p>
                </div>
                <span className="text-rose-200">⏰</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
          <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="w-5 h-5 text-powerbi-gray-500" />
              <input
                type="text"
                placeholder={t('pages.goals.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full sm:w-64 px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full sm:w-auto px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full sm:w-auto px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              {statuses.map(status => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="w-full sm:w-auto px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
            >
              <option value="all">All Priorities</option>
              {priorities.map(priority => <option key={priority} value={priority}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</option>)}
            </select>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {goals.map((goal) => (
            <div key={goal.id} className="bg-white dark:bg-powerbi-gray-800 p-4 sm:p-5 md:p-6 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-1">{goal.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${getCategoryColor(goal.category).bg} ${getCategoryColor(goal.category).text}`}>
                    {goal.category}
                  </span>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                      {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingGoal(goal)}
                    className="p-2 text-powerbi-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingGoal(goal)}
                    className="p-2 text-powerbi-gray-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                    title="Edit Goal"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="p-2 text-powerbi-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-powerbi-gray-600 dark:text-powerbi-gray-400">Progress</span>
                  <span className="font-medium text-powerbi-gray-900 dark:text-white">
                    {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                  </span>
                </div>
                <div className="w-full bg-powerbi-gray-200 dark:bg-powerbi-gray-700 rounded-full h-3">
                  <div
                    className={`bg-gradient-to-r ${getCategoryColor(goal.category).progress} h-3 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base font-medium text-powerbi-gray-900 dark:text-white">
                    {Math.round(goal.progress_percentage)}% Complete
                  </span>
                  {isOverdue(goal.target_date, goal.status) && (
                    <AlertTriangle className="w-4 h-4 text-red-500" aria-hidden="true" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm sm:text-base">Target: {formatDate(goal.target_date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {goals.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-powerbi-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-powerbi-gray-900 dark:text-white mb-2">{t('pages.goals.noGoalsFound')}</h3>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-4">
              {filters.search || filters.category !== 'all' || filters.status !== 'all' || filters.priority !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Start by creating your first financial goal.'}
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Create Your First Goal
            </button>
          </div>
        )}

        {/* Create/Edit Form Modal */}
        {(showCreateForm || editingGoal) && (
          <GoalForm
            goal={editingGoal}
            onSave={editingGoal ? handleUpdateGoal : handleCreateGoal}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingGoal(null);
              setFormError(null);
            }}
            error={formError}
            isLoading={editingGoal ? isUpdatingGoal : isCreatingGoal}
          />
        )}

        {/* View Details Modal */}
        {viewingGoal && (
          <GoalDetails
            goal={viewingGoal}
            onClose={() => setViewingGoal(null)}
            onProgressUpdate={handleProgressUpdate}
            onEdit={() => {
              setViewingGoal(null);
              setEditingGoal(viewingGoal);
            }}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Confirmation Modal */}
        {showConfirmDelete.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-6">
                  Are you sure you want to delete this goal? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowConfirmDelete({ show: false, goalId: null })}
                    className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteGoal}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {showErrorModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Error</h3>
                <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-6">
                  {showErrorModal.message}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowErrorModal({ show: false, message: '' })}
                    className="bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    OK
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

// Goal Form Component
function GoalForm({ goal, onSave, onCancel, error, isLoading }: {
  goal?: Goal | null;
  onSave: (data: Partial<Goal>) => void;
  onCancel: () => void;
  error?: string | null;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    description: goal?.description || '',
    category: goal?.category || 'Savings',
    current: goal ? goal.current.toString() : '',
    target: goal ? goal.target.toString() : '',
    target_date: goal?.target_date ? goal.target_date.split('T')[0] : '',
    priority: goal?.priority || 'medium',
    notes: goal?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      current: parseFloat(formData.current) || 0,
      target: parseFloat(formData.target) || 0
    };
    onSave(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={isLoading}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g., Emergency Fund"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  disabled={isLoading}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {['Savings', 'Investment', 'Debt Payoff', 'Emergency Fund', 'Vacation', 'Car', 'Home', 'Education', 'Health', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                disabled={isLoading}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Describe your goal..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                  placeholder="0.00"
                  value={formData.current}
                  onChange={(e) => setFormData({...formData, current: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Amount ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  disabled={isLoading}
                  placeholder="0.00"
                  value={formData.target}
                  onChange={(e) => setFormData({...formData, target: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  disabled={isLoading}
                  onChange={(e) => setFormData({...formData, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Date *
              </label>
              <input
                type="date"
                required
                disabled={isLoading}
                value={formData.target_date}
                onChange={(e) => setFormData({...formData, target_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                disabled={isLoading}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                {goal ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Goal Details Component
function GoalDetails({ goal, onClose, onProgressUpdate, onEdit, formatCurrency }: {
  goal: Goal;
  onClose: () => void;
  onProgressUpdate: (goalId: number, amount: number, description: string) => Promise<void> | void;
  onEdit: () => void;
  formatCurrency: (amount: number) => string;
}) {
  const [progressAmount, setProgressAmount] = useState(0);
  const [progressDescription, setProgressDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (progressAmount > 0) {
      try {
        setIsSubmitting(true);
        await onProgressUpdate(goal.id, progressAmount, progressDescription);
        setProgressAmount(0);
        setProgressDescription('');
      } catch (err) {
        setSubmitError('Failed to add progress');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isOverdue = new Date(goal.target_date) < new Date() && goal.status !== 'completed';
  const daysLeft = Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{goal.name}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category).bg} ${getCategoryColor(goal.category).text}`}>
                  {goal.category}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${goal.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : goal.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'}`}>
                  {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                </span>
                <span className={goal.priority === 'high' ? 'text-red-600 dark:text-red-400' : goal.priority === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}>
                  {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Edit Goal
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Current Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(goal.current)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Target Amount</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(goal.target)}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                    <div
                      className={`bg-gradient-to-r ${getCategoryColor(goal.category).progress} h-4 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {Math.round(goal.progress_percentage)}% Complete
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(goal.target - goal.current)} remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Progress */}
              {goal.status !== 'completed' && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Add Progress</h4>
                  <form onSubmit={handleProgressSubmit} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={progressAmount}
                        onChange={(e) => setProgressAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter amount"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (optional)
                      </label>
                      <input
                        type="text"
                        value={progressDescription}
                        onChange={(e) => setProgressDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="e.g., Monthly savings deposit"
                      />
                    </div>
                    {submitError && (
                      <div className="text-red-600 text-sm">{submitError}</div>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || progressAmount <= 0}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Progress'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
                <div className="space-y-4">
                  {goal.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {goal.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Target Date
                      </label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className={`text-gray-900 dark:text-white ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {formatDate(goal.target_date)}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      </div>
                      {!isOverdue && goal.status !== 'completed' && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {daysLeft} days left
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Created
                      </label>
                      <span className="text-gray-900 dark:text-white">
                        {formatDate(goal.created_at)}
                      </span>
                    </div>
                  </div>

                  {goal.completed_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Completed
                      </label>
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        {goal.completed_at ? formatDate(goal.completed_at) : ''}
                      </span>
                    </div>
                  )}

                  {goal.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes
                      </label>
                      <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        {goal.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}