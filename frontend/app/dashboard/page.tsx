'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import {
  TrendingUp,
  DollarSign,
  Target,
  CheckSquare,
  Car,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Bell,
  Activity,
  PieChart,
  BarChart3,
  Users,
  CreditCard,
  type LucideIcon
} from 'lucide-react';

interface DashboardStats {
  totalExpenses: number;
  monthlyChange: number;
  goalsProgress: number;
  pendingTasks: number;
  vehicleExpenses: number;
  savingsRate: number;
  budgetUtilization: number;
}

interface RecentActivity {
  id: string;
  type: 'expense' | 'goal' | 'task' | 'payment';
  description: string;
  amount?: number;
  date: string;
  status: 'completed' | 'pending' | 'overdue';
}

// removed unused top-level getActivityColor

const ActivityIconEl = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'expense':
      return <DollarSign className={className || ''} />;
    case 'goal':
      return <Target className={className || ''} />;
    case 'task':
      return <CheckSquare className={className || ''} />;
    case 'payment':
      return <CreditCard className={className || ''} />;
    default:
      return <Activity className={className || ''} />;
  }
};

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  prefix = '',
  suffix = '',
  currency
}: {
  title: string;
  value: number | string;
  change?: number;
  icon: LucideIcon;
  color: string;
  prefix?: string;
  suffix?: string;
  currency?: string;
}) => (
  <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/20`}>
        <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
      </div>
      {change !== undefined && (
        <div className={`flex items-center ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span className="text-sm font-semibold">{Math.abs(change)}%</span>
        </div>
      )}
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-powerbi-gray-600 dark:text-powerbi-gray-400">{title}</p>
      <p className="text-3xl font-bold text-powerbi-gray-900 dark:text-white">
        {prefix === '$'
          ? new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(
              typeof value === 'number' ? value : 0
            )
          : `${prefix}${typeof value === 'number' ? value.toLocaleString() : value}`}
        {suffix}
      </p>
    </div>
  </div>
);

const QuickAction = ({ icon: Icon, title, description, onClick, color }: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center p-4 bg-white dark:bg-powerbi-gray-800 rounded-xl shadow-md border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 hover:bg-${color}-50 dark:hover:bg-${color}-900/10 group`}
  >
    <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20 mr-3 group-hover:bg-${color}-200 dark:group-hover:bg-${color}-900/30 transition-colors`}>
      <Icon className={`w-5 h-5 text-${color}-600 dark:text-${color}-400`} />
    </div>
    <div className="text-left">
      <h3 className="font-semibold text-powerbi-gray-900 dark:text-white">{title}</h3>
      <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{description}</p>
    </div>
  </button>
);

const ActivityItem = ({ activity, currency }: { activity: RecentActivity; currency: string }) => {
  // removed unused getActivityIcon in favor of ActivityIconEl

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'expense': return 'red';
      case 'goal': return 'green';
      case 'task': return 'blue';
      case 'payment': return 'purple';
      default: return 'gray';
    }
  };

  const color = getActivityColor(activity.type);

  return (
    <div className="flex items-center p-4 bg-white dark:bg-powerbi-gray-800 rounded-xl shadow-sm border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-md transition-all duration-200">
      <div className={`p-2 rounded-lg bg-${color}-100 dark:bg-${color}-900/20 mr-3`}>
        <ActivityIconEl type={activity.type} className={`w-4 h-4 text-${color}-600 dark:text-${color}-400`} />
      </div>
      <div className="flex-1">
        <p className="font-medium text-powerbi-gray-900 dark:text-white">{activity.description}</p>
        <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
          {new Date(activity.date).toLocaleDateString()}
        </p>
      </div>
      {activity.amount && (
        <div className="text-right">
          <p className={`font-semibold ${activity.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
            {activity.type === 'expense' ? '-' : '+'}
            {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(activity.amount)}
          </p>
        </div>
      )}
      <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
        activity.status === 'completed'
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : activity.status === 'overdue'
          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      }`}>
        {activity.status}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalExpenses: 0,
    monthlyChange: 0,
    goalsProgress: 0,
    pendingTasks: 0,
    vehicleExpenses: 0,
    savingsRate: 0,
    budgetUtilization: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  const [userCurrency, setUserCurrency] = useState('USD');
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [spendingByCategory, setSpendingByCategory] = useState<Record<string, number>>({});

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3001/api/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const user = await res.json();
        setUserCurrency(user.currency || 'USD');
      }
    } catch (e) {
      console.error('Error loading user profile:', e);
    }
  }, [token]);

  const computeMonthlyChange = (expenses: Array<{ amount: number; date: string }>, vehicle: Array<{ amount: number; date: string; type: string }>) => {
    // Calculate month-over-month percentage change in total expenses
    const now = new Date();
    const curMonth = now.getMonth(), curYear = now.getFullYear();
    const lastMonthDate = new Date(curYear, curMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth(), lastYear = lastMonthDate.getFullYear();

    const inMonth = (d: string, m: number, y: number) => {
      const dt = new Date(d);
      return dt.getMonth() === m && dt.getFullYear() === y;
    };

    const curExp = expenses.filter(e => inMonth(e.date, curMonth, curYear)).reduce((s, e) => s + (Number(e.amount) || 0), 0)
      + vehicle.filter(v => v.type === 'expense' && inMonth(v.date, curMonth, curYear)).reduce((s, v) => s + (Number(v.amount) || 0), 0);

    const lastExp = expenses.filter(e => inMonth(e.date, lastMonth, lastYear)).reduce((s, e) => s + (Number(e.amount) || 0), 0)
      + vehicle.filter(v => v.type === 'expense' && inMonth(v.date, lastMonth, lastYear)).reduce((s, v) => s + (Number(v.amount) || 0), 0);

    if (lastExp <= 0) return 0;
    return Number((((curExp - lastExp) / lastExp) * 100).toFixed(1));
  };

  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    try {
      const [expRes, incRes, vehRes, taskRes, goalRes] = await Promise.all([
        fetch('http://localhost:3001/api/expenses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/income', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/vehicle-expenses', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/tasks', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:3001/api/goals', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [expenses, income, vehicle, tasks, goals] = await Promise.all([
        expRes.json(), incRes.json(), vehRes.json(), taskRes.json(), goalRes.json()
      ]);

      const validExpenses: Array<{ amount: number; date: string; category?: string; description?: string }> = Array.isArray(expenses) ? expenses : [];
      const validIncome: Array<{ amount: number; date: string }> = Array.isArray(income) ? income : [];
      const validVehicle: Array<{ amount: number; date: string; type: string }> = Array.isArray(vehicle) ? vehicle : [];
      const validTasks: Array<{ status: string }> = Array.isArray(tasks) ? tasks : [];
      const validGoals: Array<{ status?: string; completed?: boolean }> = Array.isArray(goals) ? goals : [];

      const vehicleExp = validVehicle.filter(v => v.type === 'expense').reduce((s, v) => s + (Number(v.amount) || 0), 0);
      const totalExp = validExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) + vehicleExp;
      const totalInc = validIncome.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const netIncome = totalInc - totalExp;
      const savingsRate = totalInc > 0 ? Number(((netIncome / totalInc) * 100).toFixed(1)) : 0;
      const budgetUtilization = totalInc > 0 ? Number(((totalExp / totalInc) * 100).toFixed(1)) : 0;
      const monthlyChange = computeMonthlyChange(validExpenses, validVehicle);
      const pendingTasks = validTasks.filter(t => t.status !== 'done').length;
      const goalsProgress = (() => {
        const total = validGoals.length;
        if (!total) return 0;
        const completed = validGoals.filter(g => g.completed === true || g.status === 'completed').length;
        return Number(((completed / total) * 100).toFixed(1));
      })();

      setStats({
        totalExpenses: totalExp,
        monthlyChange,
        goalsProgress,
        pendingTasks,
        vehicleExpenses: vehicleExp,
        savingsRate,
        budgetUtilization
      });

      // Build spending by category for chart
      const catTotals: Record<string, number> = {};
      validExpenses.forEach((e: any) => {
        const cat = e.category || 'General';
        const amt = Number(e.amount) || 0;
        catTotals[cat] = (catTotals[cat] || 0) + amt;
      });
      validVehicle.filter(v => v.type === 'expense').forEach((v: any) => {
        const cat = v.vehicle ? `Vehicle: ${v.vehicle}` : 'Vehicle';
        const amt = Number(v.amount) || 0;
        catTotals[cat] = (catTotals[cat] || 0) + amt;
      });
      setSpendingByCategory(catTotals);

      // Build recent activities from latest financial records
      const expenseActivities: RecentActivity[] = validExpenses
        .filter(e => !!(e as any).date)
        .map((e, idx) => ({
          id: `exp-${idx}-${(e as any).date}`,
          type: 'expense',
          description: (e as any).description || (e as any).category || 'Expense',
          amount: Number((e as any).amount) || 0,
          date: (e as any).date,
          status: 'completed'
        }));

      const incomeActivities: RecentActivity[] = validIncome
        .filter(i => !!(i as any).date)
        .map((i, idx) => ({
          id: `inc-${idx}-${(i as any).date}`,
          type: 'payment',
          description: (i as any).description || (i as any).source || 'Income',
          amount: Number((i as any).amount) || 0,
          date: (i as any).date,
          status: 'completed'
        }));

      const vehicleActivities: RecentActivity[] = validVehicle
        .filter(v => v.type === 'expense' && !!(v as any).date)
        .map((v, idx) => ({
          id: `veh-${idx}-${(v as any).date}`,
          type: 'expense',
          description: (v as any).description || 'Vehicle expense',
          amount: Number((v as any).amount) || 0,
          date: (v as any).date,
          status: 'completed'
        }));

      // Tasks -> recent items with status and dates
      const now = new Date();
      const taskActivities: RecentActivity[] = validTasks
        .map((t: any, idx: number) => {
          const planned = t.planned_date ? new Date(t.planned_date) : null;
          const updated = t.updated_at ? new Date(t.updated_at) : null;
          const created = t.created_at ? new Date(t.created_at) : null;
          const bestDate = (updated || planned || created || now).toISOString();
          const isOverdue = planned && planned < now && t.status !== 'done';
          const status: RecentActivity['status'] = t.status === 'done' ? 'completed' : (isOverdue ? 'overdue' : 'pending');
          return {
            id: `task-${t.id || idx}-${bestDate}`,
            type: 'task',
            description: t.title || 'Task update',
            date: bestDate,
            status
          };
        });

      // Goals -> recent items; include current as amount for quick view
      const goalActivities: RecentActivity[] = validGoals
        .map((g: any, idx: number) => {
          const updated = g.updated_at ? new Date(g.updated_at) : null;
          const created = g.created_at ? new Date(g.created_at) : null;
          const completed = g.completed_at ? new Date(g.completed_at) : null;
          const target = g.target_date ? new Date(g.target_date) : null;
          const bestDate = (completed || updated || created || now).toISOString();
          const isOverdue = target && target < now && g.status !== 'completed';
          const status: RecentActivity['status'] = g.status === 'completed' ? 'completed' : (isOverdue ? 'overdue' : 'pending');
          return {
            id: `goal-${g.id || idx}-${bestDate}`,
            type: 'goal',
            description: g.name || 'Goal progress',
            amount: typeof g.current === 'number' ? g.current : undefined,
            date: bestDate,
            status
          };
        });

      const combined = [...expenseActivities, ...incomeActivities, ...vehicleActivities, ...taskActivities, ...goalActivities]
        .sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1))
        .slice(0, 20);
      setRecentActivities(combined);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  }, [token]);

  type DiaryEntry = {
    id: number;
    title: string;
    content: string;
    date?: string;
    mood?: string;
    one_sentence?: string;
  };
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [diaryLoading, setDiaryLoading] = useState<boolean>(true);

  // Initial data load
  useEffect(() => {
    fetchUserProfile();
    loadDashboardData();
  }, [fetchUserProfile, loadDashboardData]);

  // Register Chart.js on client
  useEffect(() => {
    ChartJS.register(ArcElement, Tooltip, Legend);
  }, []);

  const [hasToken, setHasToken] = useState<boolean | null>(null);
  useEffect(() => {
    // Initialize token status on client to avoid SSR mismatch
    const t = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;
    setHasToken(t);
  }, []);

  // Load recent diary entries (like tasks list)
  useEffect(() => {
    // Wait for client token status to avoid hydration mismatch
    if (hasToken !== true) {
      // If not logged in, stop loading state
      setDiaryLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/diary', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data
            .filter(e => e.date)
            .sort((a: DiaryEntry, b: DiaryEntry) => (a.date! < b.date! ? 1 : -1));
          setDiary(sorted);
        }
      })
      .finally(() => setDiaryLoading(false));
  }, [hasToken]);

  // Merge diary into recent activities
  useEffect(() => {
    if (!diary || diary.length === 0) return;
    setRecentActivities((prev) => {
      const diaryActs: RecentActivity[] = diary.slice(0, 10).map((d) => ({
        id: `diary-${d.id}-${d.date || ''}`,
        type: 'task',
        description: d.title || d.one_sentence || 'Diary entry',
        date: d.date || new Date().toISOString(),
        status: 'completed'
      }));
      const merged = [...diaryActs, ...prev]
        .sort((a, b) => (new Date(a.date) < new Date(b.date) ? 1 : -1))
        .slice(0, 20);
      return merged;
    });
  }, [diary]);

  

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Welcome back! Here&apos;s your financial overview.
            </p>
          </div>
          {/* Removed Quick Add and Bell action buttons */}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Expenses"
            value={stats.totalExpenses}
            change={stats.monthlyChange}
            icon={DollarSign}
            color="red"
            prefix="$"
            currency={userCurrency}
          />
          <StatCard
            title="Goals Progress"
            value={stats.goalsProgress}
            icon={Target}
            color="green"
            suffix="%"
          />
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            icon={CheckSquare}
            color="blue"
          />
          <StatCard
            title="Vehicle Expenses"
            value={stats.vehicleExpenses}
            icon={Car}
            color="purple"
            prefix="$"
            currency={userCurrency}
          />
        </div>

        {/* Charts and Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Spending Overview Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Spending Overview</h3>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-powerbi-gray-600 dark:text-powerbi-gray-400" />
                <select className="text-sm bg-powerbi-gray-100 dark:bg-powerbi-gray-700 rounded-lg px-3 py-1 border-0">
                  <option>Last 30 days</option>
                  <option>Last 3 months</option>
                  <option>Last year</option>
                </select>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-xl p-4">
              {Object.keys(spendingByCategory).length === 0 ? (
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-powerbi-gray-400 mx-auto mb-2" />
                  <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400">No spending data yet</p>
                  <p className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-500 mt-1">Add expenses to see category breakdown</p>
                </div>
              ) : (
                <Pie
                  data={{
                    labels: Object.keys(spendingByCategory),
                    datasets: [{
                      data: Object.keys(spendingByCategory).map(k => spendingByCategory[k]),
                      backgroundColor: [
                        '#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#22c55e','#14b8a6','#f97316','#64748b'
                      ],
                      borderColor: '#ffffff',
                      borderWidth: 2,
                    }]
                  }}
                  options={{
                    plugins: {
                      legend: { position: 'bottom', labels: { color: '#374151' } },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const val = ctx.parsed as number;
                            try {
                              return new Intl.NumberFormat(undefined, { style: 'currency', currency: userCurrency }).format(val);
                            } catch {
                              return `${val.toFixed(2)} ${userCurrency}`;
                            }
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <QuickAction
              icon={Plus}
              title="Add Expense"
              description="Record a new expense"
              onClick={() => {}}
              color="red"
            />
            <QuickAction
              icon={Target}
              title="Set Goal"
              description="Create a new financial goal"
              onClick={() => {}}
              color="green"
            />
            <QuickAction
              icon={CheckSquare}
              title="New Task"
              description="Add a task to your list"
              onClick={() => {}}
              color="blue"
            />
            <QuickAction
              icon={Calendar}
              title="Schedule Payment"
              description="Set up recurring payment"
              onClick={() => {}}
              color="purple"
            />
          </div>
        </div>

        {/* Diary Section */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Your Diary</h3>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/diary')}
                className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white"
              >
                Write Today
              </button>
              <button
                onClick={() => router.push('/diary/view')}
                className="px-3 py-2 rounded-lg bg-powerbi-gray-900 hover:bg-black text-white dark:bg-powerbi-gray-700 dark:hover:bg-powerbi-gray-600"
              >
                View Diary
              </button>
            </div>
          </div>
          {hasToken === null ? (
            <div className="text-powerbi-gray-500">Loading your recent entries...</div>
          ) : hasToken ? (
            diaryLoading ? (
              <div className="text-powerbi-gray-500">Loading your recent entries...</div>
            ) : (
              <div className="space-y-3">
                {diary.slice(0, 4).map((d) => (
                  <div key={d.id} className="p-4 rounded-xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-powerbi-gray-900 dark:text-white">
                        {d.date ? new Date(d.date).toLocaleDateString() : 'No date'}
                      </div>
                      {d.mood && (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                          {d.mood}
                        </span>
                      )}
                    </div>
                    {d.one_sentence && (
                      <div className="text-sm mt-1 text-powerbi-gray-600 dark:text-powerbi-gray-400">
                        {d.one_sentence}
                      </div>
                    )}
                    <div className="text-sm mt-2 line-clamp-2 text-powerbi-gray-600 dark:text-powerbi-gray-400">
                      {d.content}
                    </div>
                  </div>
                ))}
                {diary.length === 0 && (
                  <div className="text-powerbi-gray-500">No entries yet. Start with “Write Today”.</div>
                )}
              </div>
            )
          ) : (
            <div className="text-powerbi-gray-500">Log in to view your diary.</div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Recent Activity</h3>
              <button className="text-sm text-powerbi-primary hover:text-powerbi-secondary font-medium transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} currency={userCurrency} />
              ))}
            </div>
          </div>

          {/* Financial Insights */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Financial Insights</h3>
              <Activity className="w-5 h-5 text-powerbi-gray-600 dark:text-powerbi-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium text-powerbi-gray-900 dark:text-white">Savings Rate</p>
                    <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Above average</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.savingsRate}%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-powerbi-gray-900 dark:text-white">Budget Utilization</p>
                    <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">On track</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.budgetUtilization}%</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg mr-3">
                    <Target className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="font-medium text-powerbi-gray-900 dark:text-white">Goal Achievement</p>
                    <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Keep it up!</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.goalsProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}