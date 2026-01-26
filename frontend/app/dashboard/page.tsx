'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
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

const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
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
            {activity.type === 'expense' ? '-' : '+'}${activity.amount.toFixed(2)}
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
    totalExpenses: 12450,
    monthlyChange: 5.2,
    goalsProgress: 75,
    pendingTasks: 8,
    vehicleExpenses: 2100,
    savingsRate: 23.5,
    budgetUtilization: 78
  });

  const [recentActivities] = useState<RecentActivity[]>([
    { id: '1', type: 'expense', description: 'Grocery shopping at Whole Foods', amount: 127.50, date: '2024-01-15', status: 'completed' },
    { id: '2', type: 'goal', description: 'Emergency fund goal progress', amount: 250, date: '2024-01-15', status: 'completed' },
    { id: '3', type: 'task', description: 'Review monthly budget', date: '2024-01-16', status: 'pending' },
    { id: '4', type: 'payment', description: 'Credit card payment', amount: 450, date: '2024-01-14', status: 'completed' },
    { id: '5', type: 'expense', description: 'Gas station fill-up', amount: 65.20, date: '2024-01-13', status: 'completed' }
  ]);

  const [userCurrency] = useState('USD');

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

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        totalExpenses: prev.totalExpenses + Math.random() * 10 - 5,
        goalsProgress: Math.min(100, prev.goalsProgress + Math.random() * 2 - 1)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;

  // Load recent diary entries (like tasks list)
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      return;
    }
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
  }, []);

  

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
          <div className="flex items-center gap-3">
            <button className="flex items-center px-4 py-2 bg-powerbi-primary hover:bg-powerbi-secondary text-white rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl">
              <Plus className="w-4 h-4 mr-2" />
              Quick Add
            </button>
            <button className="p-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
          </div>
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
            <div className="h-64 flex items-center justify-center bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-xl">
              <div className="text-center">
                <PieChart className="w-12 h-12 text-powerbi-gray-400 mx-auto mb-2" />
                <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400">Interactive chart will be implemented</p>
                <p className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-500 mt-1">Showing spending by category</p>
              </div>
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
          {hasToken ? (
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
                <ActivityItem key={activity.id} activity={activity} />
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