'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/DashboardLayout';
import { useI18n } from '../../../i18n/I18nProvider';
import { DollarSign, ShoppingCart, TrendingUp, BarChart3, FileText, Wallet, Upload, Download, File, Eye } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Project {
  id: number;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed';
  budget: number;
  spent: number;
  start_date: string;
  end_date: string;
  client_name?: string;
  priority: 'low' | 'medium' | 'high';
  total_time_spent: number;
}

interface Purchase {
  id: number;
  project_id: number;
  item_name: string;
  cost: number;
  category?: string;
  vendor?: string;
  date: string;
}

interface Income {
  id: number;
  project_id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface Document {
  id: number;
  project_id: number;
  file_name: string;
  original_name: string;
  description: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  uploaded_by?: string;
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params?.id);
  const { t } = useI18n();

  const [project, setProject] = useState<Project | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeTab, setActiveTab] = useState<'budget' | 'purchases' | 'income' | 'analytics' | 'pl-report' | 'balance-report' | 'documents'>('budget');
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [userCountry, setUserCountry] = useState<string>('');

  const loadUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:3001/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        setUserCurrency(user.currency || 'USD');
        setUserCountry(user.country || '');
      }
    } catch (e) {
      console.error('Error loading user profile:', e);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/projects', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data: Project[] = await response.json();
        const found = data.find(p => p.id === projectId) || null;
        setProject(found);
      }
    } catch (e) {
      console.error('Error loading project:', e);
    }
  }, [projectId]);

  const loadPurchases = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/project-purchases', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data: Purchase[] = await response.json();
        setPurchases(data.filter(p => p.project_id === projectId));
      }
    } catch (e) {
      console.error('Error loading purchases:', e);
    }
  }, [projectId]);

  const loadIncome = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/project-income', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data: Income[] = await response.json();
        setIncome(data.filter(i => i.project_id === projectId));
      }
    } catch (e) {
      console.error('Error loading income:', e);
    }
  }, [projectId]);

  const loadDocuments = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/project-documents', { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data: Document[] = await response.json();
        setDocuments(data.filter(d => d.project_id === projectId));
      }
    } catch (e) {
      console.error('Error loading documents:', e);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || Number.isNaN(projectId)) {
      router.push('/manage-projects');
      return;
    }
    const t = setTimeout(() => {
      loadUserProfile();
      loadProjects();
      loadPurchases();
      loadIncome();
      loadDocuments();
    }, 0);
    return () => clearTimeout(t);
  }, [projectId, router, loadUserProfile, loadProjects, loadPurchases, loadIncome, loadDocuments]);

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = { USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$', AUD: 'A$', CHF: 'CHF', CNY: '¥', INR: '₹', KRW: '₩' };
    return symbols[currency] || '$';
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: userCurrency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
    } catch {
      return `${getCurrencySymbol(userCurrency)}${amount.toFixed(2)}`;
    }
  };

  const getTimeZoneForCountry = (country?: string) => {
    const key = (country || '').trim().toUpperCase();
    const map: { [k: string]: string } = { 'SRI LANKA': 'Asia/Colombo', LK: 'Asia/Colombo', LKA: 'Asia/Colombo', INDIA: 'Asia/Kolkata', IN: 'Asia/Kolkata', IND: 'Asia/Kolkata' };
    return map[key] || Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const formatDateTimeInUserTZ = (iso: string) => {
    const tz = getTimeZoneForCountry(userCountry);
    try {
      return new Intl.DateTimeFormat(undefined, { timeZone: tz, year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleString();
    }
  };

  const projectSpent = useMemo(() => purchases.reduce((t, p) => t + p.cost, 0), [purchases]);
  const remaining = useMemo(() => (project ? project.budget - projectSpent : 0), [project, projectSpent]);

  return (
    <DashboardLayout>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 mt-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">📁</span>
              {project?.name || t('pages.manageProjectDetails.title')}
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              {t('pages.manageProjectDetails.subtitle')}
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => router.push('/manage-projects')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 transition-colors w-full sm:w-auto"
            >
              {t('buttons.back')}
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'budget', label: t('pages.manageProjectDetails.tabs.budgeting'), icon: DollarSign },
              { id: 'purchases', label: t('pages.manageProjectDetails.tabs.purchases'), icon: ShoppingCart },
              { id: 'income', label: t('pages.manageProjectDetails.tabs.income'), icon: TrendingUp },
              { id: 'analytics', label: t('pages.manageProjectDetails.tabs.analytics'), icon: BarChart3 },
              { id: 'pl-report', label: t('pages.manageProjectDetails.tabs.plReport'), icon: FileText },
              { id: 'balance-report', label: t('pages.manageProjectDetails.tabs.balance'), icon: Wallet },
              { id: 'documents', label: t('pages.manageProjectDetails.tabs.documents'), icon: File }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'budget' | 'purchases' | 'income' | 'analytics' | 'pl-report' | 'balance-report' | 'documents')}
                className={`flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-powerbi-primary text-white shadow-lg'
                    : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="ml-2">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'budget' && project && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">{t('pages.manageProjectDetails.budget.budget')}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(project.budget)}</p>
                  </div>
                  <span className="text-purple-200">💰</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-rose-100 text-sm font-medium">{t('pages.manageProjectDetails.budget.spent')}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(projectSpent)}</p>
                  </div>
                  <span className="text-rose-200">🧾</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-4 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">{t('pages.manageProjectDetails.budget.remaining')}</p>
                    <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(remaining)}</p>
                  </div>
                  <span className="text-emerald-200">✅</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.manageProjectDetails.purchases.add')}</h3>
              <PurchaseForm projectId={projectId} onSaved={() => { loadPurchases(); loadProjects(); }} userCurrency={userCurrency} formatCurrency={formatCurrency} />
            </div>

            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.manageProjectDetails.purchases.list')}</h3>
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div key={purchase.id} className="flex items-center justify-between p-3 sm:p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-powerbi-gray-900 dark:text-white">{purchase.item_name}</p>
                      <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{purchase.category || t('pages.manageProjectDetails.purchases.uncategorized')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-powerbi-gray-900 dark:text-white">{formatCurrency(purchase.cost)}</p>
                      <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{formatDateTimeInUserTZ(purchase.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.manageProjectDetails.income.add')}</h3>
              <IncomeForm projectId={projectId} onSaved={() => { loadIncome(); loadProjects(); }} userCurrency={userCurrency} formatCurrency={formatCurrency} />
            </div>

            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.manageProjectDetails.income.list')}</h3>
              <div className="space-y-4">
                {income.map((inc) => (
                  <div key={inc.id} className="flex items-center justify-between p-3 sm:p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
                    <div>
                      <p className="font-medium text-powerbi-gray-900 dark:text-white">{inc.description}</p>
                      <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{inc.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-powerbi-gray-900 dark:text-white">{formatCurrency(inc.amount)}</p>
                      <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{formatDateTimeInUserTZ(inc.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.manageProjectDetails.analytics.title')}</h3>
              <div className="h-64">
                <Bar
                  data={{
                    labels: [t('pages.manageProjectDetails.analytics.labels.income'), t('pages.manageProjectDetails.analytics.labels.expenses')],
                    datasets: [
                      {
                        label: t('pages.manageProjectDetails.analytics.datasetAmount'),
                        data: [
                          income.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0),
                          purchases.reduce((sum, pur) => sum + (Number(pur.cost) || 0), 0)
                        ],
                        backgroundColor: ['rgba(34, 197, 94, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                        borderColor: ['rgba(34, 197, 94, 1)', 'rgba(239, 68, 68, 1)'],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: true,
                        text: t('pages.manageProjectDetails.analytics.chartTitle'),
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pl-report' && (() => {
          const totalIncome = income.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
          const totalExpenses = purchases.reduce((sum, pur) => sum + (Number(pur.cost) || 0), 0);
          const netProfitLoss = totalIncome - totalExpenses;
          const isProfitable = netProfitLoss >= 0;

          return (
            <div className="space-y-6">
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h3 className="text-xl font-bold text-powerbi-gray-900 dark:text-white mb-6">{t('pages.manageProjectDetails.plReport.title')}</h3>
                
                <div className="space-y-6">
                  {/* Income Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">{t('pages.manageProjectDetails.plReport.revenueIncome')}</h4>
                    <div className="space-y-2">
                      {income.map((inc) => (
                        <div key={inc.id} className="flex justify-between items-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div>
                            <p className="font-medium text-powerbi-gray-900 dark:text-white">{inc.description}</p>
                            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{inc.category}</p>
                          </div>
                          <p className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(inc.amount)}</p>
                        </div>
                      ))}
                      {income.length === 0 && (
                        <p className="text-powerbi-gray-500 dark:text-powerbi-gray-400 italic">{t('pages.manageProjectDetails.plReport.noIncome')}</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-powerbi-gray-900 dark:text-white">{t('pages.manageProjectDetails.plReport.totalIncome')}</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">{t('pages.manageProjectDetails.plReport.expenses')}</h4>
                    <div className="space-y-2">
                      {purchases.map((pur) => (
                        <div key={pur.id} className="flex justify-between items-center p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div>
                            <p className="font-medium text-powerbi-gray-900 dark:text-white">{pur.item_name}</p>
                            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{pur.category || t('pages.manageProjectDetails.purchases.uncategorized')}</p>
                          </div>
                          <p className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(pur.cost)}</p>
                        </div>
                      ))}
                      {purchases.length === 0 && (
                        <p className="text-powerbi-gray-500 dark:text-powerbi-gray-400 italic">{t('pages.manageProjectDetails.plReport.noExpenses')}</p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-powerbi-gray-900 dark:text-white">{t('pages.manageProjectDetails.plReport.totalExpenses')}</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit/Loss */}
                  <div className={`p-4 sm:p-6 rounded-xl ${isProfitable ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-powerbi-gray-600 dark:text-powerbi-gray-400">{isProfitable ? t('pages.manageProjectDetails.plReport.netProfit') : t('pages.manageProjectDetails.plReport.netLoss')}</p>
                        <p className={`text-2xl sm:text-3xl font-bold ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(Math.abs(netProfitLoss))}
                        </p>
                      </div>
                      <div className={`text-5xl ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {isProfitable ? '📈' : '📉'}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                      {isProfitable ? t('pages.manageProjectDetails.plReport.profitableText') : t('pages.manageProjectDetails.plReport.lossText')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'balance-report' && (() => {
          const totalIncome = income.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0);
          const totalExpenses = purchases.reduce((sum, pur) => sum + (Number(pur.cost) || 0), 0);
          const projectBudget = Number(project?.budget) || 0;
          const currentBalance = projectBudget + totalIncome - totalExpenses;
          const budgetUtilization = projectBudget > 0 ? ((totalExpenses / projectBudget) * 100).toFixed(1) : 0;

          return (
            <div className="space-y-6">
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h3 className="text-xl font-bold text-powerbi-gray-900 dark:text-white mb-6">{t('pages.manageProjectDetails.balanceReport.title')}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 sm:p-6">
                    <p className="text-sm font-medium text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">{t('pages.manageProjectDetails.balanceReport.initialBudget')}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(projectBudget)}</p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 sm:p-6">
                    <p className="text-sm font-medium text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">{t('pages.manageProjectDetails.balanceReport.totalIncome')}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalIncome)}</p>
                  </div>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 sm:p-6">
                    <p className="text-sm font-medium text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">{t('pages.manageProjectDetails.balanceReport.totalExpenses')}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</p>
                  </div>
                  
                  <div className={`rounded-xl p-4 sm:p-6 ${currentBalance >= 0 ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                    <p className="text-sm font-medium text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">{t('pages.manageProjectDetails.balanceReport.currentBalance')}</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${currentBalance >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-orange-600 dark:text-orange-400'}`}>
                      {formatCurrency(currentBalance)}
                    </p>
                  </div>
                </div>

                {/* Budget Utilization */}
                <div className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-xl p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-semibold text-powerbi-gray-900 dark:text-white">{t('pages.manageProjectDetails.balanceReport.budgetUtilization')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-powerbi-gray-900 dark:text-white">{budgetUtilization}%</p>
                  </div>
                  <div className="w-full bg-powerbi-gray-200 dark:bg-powerbi-gray-600 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all ${
                        Number(budgetUtilization) > 100 ? 'bg-red-600' : 
                        Number(budgetUtilization) > 80 ? 'bg-orange-500' : 
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(Number(budgetUtilization), 100)}%` }}
                    ></div>
                  </div>
                  <p className="mt-2 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                    {Number(budgetUtilization) > 100 ? t('pages.manageProjectDetails.balanceReport.exceeded') : 
                     Number(budgetUtilization) > 80 ? t('pages.manageProjectDetails.balanceReport.approaching') : 
                     t('pages.manageProjectDetails.balanceReport.onTrack')}
                  </p>
                </div>

                {/* Financial Summary */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-3">{t('pages.manageProjectDetails.balanceReport.financialSummary')}</h4>
                  
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
                    <span className="text-powerbi-gray-700 dark:text-powerbi-gray-300">{t('pages.manageProjectDetails.balanceReport.initialBudget')}</span>
                    <span className="font-semibold text-powerbi-gray-900 dark:text-white">{formatCurrency(projectBudget)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
                    <span className="text-powerbi-gray-700 dark:text-powerbi-gray-300">{t('pages.manageProjectDetails.balanceReport.totalIncomeGenerated')}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">+ {formatCurrency(totalIncome)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
                    <span className="text-powerbi-gray-700 dark:text-powerbi-gray-300">{t('pages.manageProjectDetails.balanceReport.totalExpenses')}</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">- {formatCurrency(totalExpenses)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 sm:p-4 bg-powerbi-primary/10 dark:bg-powerbi-primary/20 rounded-lg border-2 border-powerbi-primary">
                    <span className="font-bold text-powerbi-gray-900 dark:text-white">{t('pages.manageProjectDetails.balanceReport.availableBalance')}</span>
                    <span className={`text-lg sm:text-xl font-bold ${currentBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.manageProjectDetails.documents.uploadTitle')}</h3>
              <DocumentUploadForm projectId={projectId} onSaved={() => loadDocuments()} />
            </div>

            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.manageProjectDetails.documents.projectDocuments')}</h3>
              <div className="space-y-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 sm:p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <File className="w-8 h-8 text-powerbi-primary" />
                      <div>
                        <p className="font-medium text-powerbi-gray-900 dark:text-white">{doc.original_name}</p>
                        <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">{doc.description}</p>
                        <p className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-500">
                          {(doc.file_size / 1024).toFixed(1)} KB • {formatDateTimeInUserTZ(doc.uploaded_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewDocument(doc.id)}
                        className="flex items-center space-x-2 px-3 py-2 bg-powerbi-gray-100 hover:bg-powerbi-gray-200 dark:bg-powerbi-gray-700 dark:hover:bg-powerbi-gray-600 text-powerbi-gray-700 dark:text-powerbi-gray-300 text-sm font-medium rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{t('pages.manageProjectDetails.documents.view')}</span>
                      </button>
                      <button
                        onClick={() => downloadDocument(doc.id, doc.original_name)}
                        className="flex items-center space-x-2 px-3 py-2 bg-powerbi-primary hover:bg-powerbi-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>{t('pages.manageProjectDetails.documents.download')}</span>
                      </button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-powerbi-gray-500 dark:text-powerbi-gray-400 italic text-center py-8">{t('pages.manageProjectDetails.documents.empty')}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}

function PurchaseForm({ projectId, onSaved, userCurrency, formatCurrency }: { projectId: number; onSaved: () => void; userCurrency: string; formatCurrency: (n: number) => string }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ item_name: '', cost: '', category: '', vendor: '' });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = { project_id: projectId, item_name: form.item_name, cost: parseFloat(form.cost) || 0, category: form.category, vendor: form.vendor, date: new Date().toISOString().split('T')[0] };
    const res = await fetch('http://localhost:3001/api/project-purchases', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (res.ok) {
      setForm({ item_name: '', cost: '', category: '', vendor: '' });
      onSaved();
    }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.forms.itemName')}</label>
          <input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.forms.cost')} ({userCurrency})</label>
          <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.forms.category')}</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.forms.vendor')}</label>
          <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white" />
        </div>
      </div>
      <button type="submit" className="px-4 py-2 bg-powerbi-primary hover:bg-powerbi-primary/90 text-white font-medium rounded-lg transition-colors">{t('pages.manageProjectDetails.purchases.save')}</button>
    </form>
  );
}

function IncomeForm({ projectId, onSaved, userCurrency, formatCurrency }: { projectId: number; onSaved: () => void; userCurrency: string; formatCurrency: (n: number) => string }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ description: '', amount: '', category: '' });
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const payload = { project_id: projectId, description: form.description, amount: parseFloat(form.amount) || 0, category: form.category, date: new Date().toISOString().split('T')[0] };
    const res = await fetch('http://localhost:3001/api/project-income', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    if (res.ok) {
      setForm({ description: '', amount: '', category: '' });
      onSaved();
    }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.forms.description')}</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.forms.amount')} ({userCurrency})</label>
          <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.forms.category')}</label>
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white" />
        </div>
      </div>
      <button type="submit" className="px-4 py-2 bg-powerbi-primary hover:bg-powerbi-primary/90 text-white font-medium rounded-lg transition-colors">{t('pages.manageProjectDetails.income.save')}</button>
    </form>
  );
}

function DocumentUploadForm({ projectId, onSaved }: { projectId: number; onSaved: () => void }) {
  const { t } = useI18n();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('project_id', projectId.toString());
    formData.append('description', description);

    try {
      const response = await fetch('http://localhost:3001/api/project-documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setFile(null);
        setDescription('');
        onSaved();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={upload} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.documents.selectFile')}</label>
        <input
          type="file"
          onChange={handleFileChange}
          required
          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-medium file:bg-powerbi-primary file:text-white hover:file:bg-powerbi-primary/90"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">{t('pages.manageProjectDetails.documents.description')}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('pages.manageProjectDetails.documents.descriptionPlaceholder')}
          required
          rows={3}
          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg dark:bg-powerbi-gray-700 dark:text-white resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={uploading || !file}
        className="flex items-center space-x-2 px-4 py-2 bg-powerbi-primary hover:bg-powerbi-primary/90 disabled:bg-powerbi-gray-400 text-white font-medium rounded-lg transition-colors"
      >
        <Upload className="w-4 h-4" />
        <span>{uploading ? t('pages.manageProjectDetails.documents.uploading') : t('pages.manageProjectDetails.documents.uploadButton')}</span>
      </button>
    </form>
  );
}

function downloadDocument(docId: number, fileName: string) {
  const token = localStorage.getItem('token');
  const link = document.createElement('a');
  link.href = `http://localhost:3001/api/project-documents/${docId}/download`;
  link.setAttribute('download', fileName);
  link.style.display = 'none';

  // Add authorization header
  fetch(link.href, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  })
  .catch(error => {
    console.error('Error downloading document:', error);
  });
}

function viewDocument(docId: number) {
  const token = localStorage.getItem('token');
  const url = `http://localhost:3001/api/project-documents/${docId}/download`;
  
  // Open in new tab with authorization
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => response.blob())
    .then(blob => {
      const blobUrl = window.URL.createObjectURL(blob);
      newWindow.location.href = blobUrl;
    })
    .catch(error => {
      console.error('Error viewing document:', error);
      newWindow.close();
    });
  }
}
