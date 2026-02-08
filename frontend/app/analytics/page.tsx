'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

type Expense = { id: number; description: string; amount: number; date: string; category: string };
type Income = { id: number; description: string; amount: number; date: string; category: string };
type Goal = { id: number; name: string; progress_percentage: number; status: string; current: number; target: number };
type Task = { id: number; status: 'todo'|'inProgress'|'done'; category: string };
type GoalStats = {
  total_goals: number;
  completed_goals: number;
  active_goals: number;
  avg_progress: number;
  total_current: number;
  total_target: number;
  overdue_goals: number;
  completion_rate: number;
  total_savings_rate: number;
};
type VehicleEntry = { id: number; description: string; amount: number; date: string; vehicle: string; type: 'income'|'expense' };

export default function Analytics() {
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStats | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [vehicleEntries, setVehicleEntries] = useState<VehicleEntry[]>([]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` } as const;

    const fetchAll = async () => {
      try {
        const [expRes, incRes, goalsRes, goalsStatsRes, tasksRes, vehRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/expenses`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/income`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/goals/stats/summary`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/tasks`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicle-expenses`, { headers }),
        ]);

        const safeJson = async (res: Response) => {
          const ct = res.headers.get('content-type') || '';
          if (!ct.includes('application/json')) return [];
          return res.json();
        };

        const [exp, inc, g, gstats, t, v] = await Promise.all([
          safeJson(expRes), safeJson(incRes), safeJson(goalsRes), safeJson(goalsStatsRes), safeJson(tasksRes), safeJson(vehRes)
        ]);
        if (Array.isArray(exp)) setExpenses(exp);
        if (Array.isArray(inc)) setIncome(inc);
        if (Array.isArray(g)) setGoals(g);
        if (gstats && !gstats.error) setGoalStats(gstats);
        if (Array.isArray(t)) setTasks(t);
        if (Array.isArray(v)) setVehicleEntries(v);
      } catch (e) {
        console.error('Error loading analytics data', e);
      }
    };

    fetchAll();
  }, []);

  const totals = useMemo(() => {
    const expensesTotal = expenses.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const incomeTotal = income.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const vehicleTotal = vehicleEntries.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    const net = incomeTotal - expensesTotal;
    const completionRate = (() => {
      const total = goals.length;
      const completed = goals.filter(g => g.status === 'completed').length;
      return total ? Math.round((completed / total) * 100) : 0;
    })();
    return { expensesTotal, incomeTotal, vehicleTotal, net, completionRate };
  }, [expenses, income, vehicleEntries, goals]);

  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category || 'general'] = (map[e.category || 'general'] || 0) + (Number(e.amount) || 0); });
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return { labels: entries.map(([k]) => k), values: entries.map(([,v]) => v) };
  }, [expenses]);

  const statusDistribution = useMemo(() => {
    const counts = { todo: 0, inProgress: 0, done: 0 } as Record<Task['status'], number>;
    tasks.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return counts;
  }, [tasks]);

  const monthLabels = useMemo(() => {
    const set = new Set<string>();
    [...expenses, ...income].forEach(r => { if (r.date) set.add(r.date.slice(0,7)); });
    return Array.from(set).sort();
  }, [expenses, income]);

  const monthlyLine = useMemo(() => {
    const mapExp: Record<string, number> = {};
    const mapInc: Record<string, number> = {};
    expenses.forEach(e => { const m = e.date?.slice(0,7); if (m) mapExp[m] = (mapExp[m] || 0) + Number(e.amount)||0; });
    income.forEach(i => { const m = i.date?.slice(0,7); if (m) mapInc[m] = (mapInc[m] || 0) + Number(i.amount)||0; });
    const labels = monthLabels;
    const expSeries = labels.map(l => mapExp[l] || 0);
    const incSeries = labels.map(l => mapInc[l] || 0);
    return {
      labels,
      datasets: [
        { label: t('pages.manageProjectDetails.analytics.labels.expenses'), data: expSeries, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)', tension: 0.3 },
        { label: t('pages.manageProjectDetails.analytics.labels.income'), data: incSeries, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)', tension: 0.3 },
      ]
    };
  }, [monthLabels, expenses, income]);

  const goalsBuckets = useMemo(() => {
    const buckets = [0,0,0,0]; // 0-25,25-50,50-75,75-100
    goals.forEach(g => {
      const p = Math.max(0, Math.min(100, Number(g.progress_percentage)||0));
      if (p < 25) buckets[0]++; else if (p < 50) buckets[1]++; else if (p < 75) buckets[2]++; else buckets[3]++;
    });
    return buckets;
  }, [goals]);

  const insights = useMemo(() => {
    const list: string[] = [];
    if (totals.net < 0) list.push('Spending exceeds income. Consider reducing expenses or increasing income sources.');
    if ((goalStats?.total_savings_rate || 0) < 30) list.push('Savings rate is low. Automate transfers to savings goals each paycheck.');
    if ((totals.completionRate || 0) < 40) list.push('Task completion is below target. Reassess priorities and reduce WIP to improve throughput.');
    if ((expensesByCategory.values[0] || 0) > (totals.expensesTotal * 0.4)) list.push(`High concentration in ${expensesByCategory.labels[0]} expenses. Set a budget cap for this category.`);
    if (vehicleEntries.length && totals.vehicleTotal > (totals.expensesTotal * 0.2)) list.push('Vehicle-related costs are significant. Consider maintenance optimization or usage adjustments.');
    return list.length ? list : ['Data looks balanced. Keep tracking regularly and review monthly summaries for trends.'];
  }, [totals, goalStats, expensesByCategory, vehicleEntries]);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">📊</span>
              {t('pages.analytics.title')}
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              {/* Optional subtitle translation key could be added */}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-emerald-100 text-sm font-medium">Income</p>
              <p className="text-2xl sm:text-3xl font-bold">{totals.incomeTotal.toFixed(2)}</p>
            </div><span className="text-emerald-200">💵</span></div>
          </div>
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-rose-100 text-sm font-medium">Expenses</p>
              <p className="text-2xl sm:text-3xl font-bold">{totals.expensesTotal.toFixed(2)}</p>
            </div><span className="text-rose-200">💳</span></div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-blue-100 text-sm font-medium">Net Balance</p>
              <p className="text-2xl sm:text-3xl font-bold">{totals.net.toFixed(2)}</p>
            </div><span className="text-blue-200">⚖️</span></div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-purple-100 text-sm font-medium">Savings Rate</p>
              <p className="text-2xl sm:text-3xl font-bold">{Math.round(goalStats?.total_savings_rate || 0)}%</p>
            </div><span className="text-purple-200">💰</span></div>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between"><div>
              <p className="text-amber-100 text-sm font-medium">Tasks Done</p>
              <p className="text-2xl sm:text-3xl font-bold">{totals.completionRate}%</p>
            </div><span className="text-amber-200">✅</span></div>
          </div>
        </div>

        {/* Trends and Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.analytics.monthlyIncomeVsExpenses')}</h3>
            <div className="h-64 sm:h-80">
              <Line data={monthlyLine} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.analytics.expensesByCategory')}</h3>
            <div className="h-64 sm:h-80">
              <Doughnut data={{
                labels: expensesByCategory.labels,
                datasets: [{
                  data: expensesByCategory.values,
                  backgroundColor: ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#6b7280','#14b8a6','#f472b6','#a78bfa','#22c55e'],
                }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '60%' }} />
            </div>
          </div>
        </div>

        {/* Goals and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Goals Progress Distribution</h3>
            <div className="h-64 sm:h-80">
              <Bar data={{
                labels: ['0–25%','25–50%','50–75%','75–100%'],
                datasets: [{ label: t('pages.goals.title'), data: goalsBuckets, backgroundColor: ['#ef4444','#f59e0b','#3b82f6','#10b981'] }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Tasks Status</h3>
            <div className="h-64 sm:h-80">
              <Doughnut data={{
                labels: ['To Do','In Progress','Done'],
                datasets: [{ data: [statusDistribution.todo, statusDistribution.inProgress, statusDistribution.done], backgroundColor: ['#6b7280','#3b82f6','#10b981'] }]
              }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '60%' }} />
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {insights.map((tip, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2">💡</span>
                <span className="text-powerbi-gray-700 dark:text-powerbi-gray-300">{tip}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400 mt-3">
            Smart tips are heuristic-based. For AI-generated insights, we can integrate a secure LLM API in a future update.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}