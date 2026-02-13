'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  PiggyBank,
  Wallet,
  FileText,
  Calculator,
  BarChart3,
  Trash2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  source?: string;
}

interface Income {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  source?: string;
}

interface VehicleEntry {
  id: number;
  type: 'income' | 'expense';
  description: string;
  vehicle: string;
  amount: number;
  date: string;
  source?: string;
}

type ActiveTabType = 'overview' | 'income' | 'expenses' | 'analytics';

interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
}

export default function Expenses() {
  const { t } = useI18n();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    savingsRate: 0
  });
  const [activeTab, setActiveTab] = useState<ActiveTabType>('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    transactionId: number | null;
    transactionSource: string | null;
    transactionDescription: string | null;
  }>({
    isOpen: false,
    transactionId: null,
    transactionSource: null,
    transactionDescription: null
  });
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
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
  }, []);

  // Effect moved below fetchData to avoid TDZ on first render

  const formatCurrency = (amount: number): string => {
    const currencySymbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹',
      'KRW': '₩',
      'BRL': 'R$',
      'MXN': '$',
      'RUB': '₽',
      'ZAR': 'R',
      'SGD': 'S$',
      'HKD': 'HK$',
      'NZD': 'NZ$',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'TRY': '₺',
      'THB': '฿',
      'MYR': 'RM',
      'IDR': 'Rp',
      'VND': '₫',
      'PHP': '₱',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'ILS': '₪',
      'CLP': '$',
      'PEN': 'S/',
      'COP': '$',
      'ARS': '$',
      'EGP': '£',
      'NGN': '₦',
      'KES': 'KSh',
      'GHS': '₵',
      'TZS': 'TSh',
      'UGX': 'USh',
      'MAD': 'MAD',
      'DZD': 'DA',
      'TND': 'DT',
      'SAR': '﷼',
      'AED': 'د.إ',
      'QAR': '﷼',
      'BHD': '.د.ب',
      'KWD': 'د.ك',
      'OMR': '﷼.ع',
      'JOD': 'د.ا'
    };

    const symbol = currencySymbols[userCurrency] || userCurrency;
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const [expensesRes, incomeRes, vehicleRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/expenses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/income`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/vehicle-expenses`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const expensesData = await expensesRes.json();
      const incomeData = await incomeRes.json();
      const vehicleData = await vehicleRes.json();

      let validExpenses = [];
      let validIncome = [];

      if (!expensesData.error && Array.isArray(expensesData)) {
        const expensesWithSource = expensesData.map(item => ({ ...item, source: 'expenses' }));
        setExpenses(expensesWithSource);
        validExpenses = expensesWithSource;
      }

      if (!incomeData.error && Array.isArray(incomeData)) {
        const incomeWithSource = incomeData.map(item => ({ ...item, source: 'income' }));
        setIncome(incomeWithSource);
        validIncome = incomeWithSource;
      }

      // Add vehicle expenses and income to the respective arrays
      if (!vehicleData.error && Array.isArray(vehicleData)) {
        const vehicleExpenses = vehicleData.filter((v: VehicleEntry) => v.type === 'expense').map((v: VehicleEntry) => ({
          id: v.id,
          description: `${v.description} (${v.vehicle})`,
          amount: v.amount,
          date: v.date,
          category: 'Vehicle',
          source: 'vehicle-expenses'
        }));
        const vehicleIncome = vehicleData.filter((v: VehicleEntry) => v.type === 'income').map((v: VehicleEntry) => ({
          id: v.id,
          description: `${v.description} (${v.vehicle})`,
          amount: v.amount,
          date: v.date,
          category: 'Vehicle',
          source: 'vehicle-expenses'
        }));

        validExpenses = [...validExpenses, ...vehicleExpenses];
        validIncome = [...validIncome, ...vehicleIncome];

        // Update state to include vehicle data for display
        setExpenses([
          ...((Array.isArray(expensesData) ? expensesData : []).map((item: any) => ({ ...item, source: 'expenses' }))),
          ...vehicleExpenses
        ]);
        setIncome([
          ...((Array.isArray(incomeData) ? incomeData : []).map((item: any) => ({ ...item, source: 'income' }))),
          ...vehicleIncome
        ]);
      }

      calculateSummary(validExpenses, validIncome);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchUserProfile();
  }, [fetchData, fetchUserProfile]);

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingTransaction(true);
    const formData = new FormData(e.currentTarget);
    
    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const date = formData.get('date') as string;
    const category = formData.get('category') as string || 'general';

    const token = localStorage.getItem('token');
    if (!token) {
      setIsAddingTransaction(false);
      return;
    }

    try {
      const endpoint = formType === 'income' ? '/api/income' : '/api/expenses';
      const body = formType === 'income' 
        ? { description, amount, date, category }
        : { description, amount, date, category };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to add transaction');
      }

      // Refresh all data to include vehicle expenses
      await fetchData();

      setShowAddForm(false);
    } catch (err: unknown) {
      console.error('Error adding transaction:', err);
      let errorMessage = 'Failed to add transaction';
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('User not found')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (msg.includes('Access token required')) {
        errorMessage = 'Please log in to add transactions.';
      } else if (msg) {
        errorMessage = msg;
      }
      alert(errorMessage);
    } finally {
      setIsAddingTransaction(false);
    }
  };

  const calculateSummary = (expensesData: Expense[], incomeData: Income[]) => {
    // Ensure we have arrays
    const expenses = Array.isArray(expensesData) ? expensesData : [];
    const income = Array.isArray(incomeData) ? incomeData : [];

    const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0);
    const totalIncome = income.reduce((sum, inc) => sum + parseFloat(inc.amount.toString()), 0);
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

    setSummary({
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate
    });
  };

  const exportBalanceSheet = () => {
    const csvContent = generatePLReport();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `profit-loss-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDeleteModal = (id: number, source: string, description: string) => {
    setDeleteError(null);
    setDeleteModal({
      isOpen: true,
      transactionId: id,
      transactionSource: source,
      transactionDescription: description
    });
  };

  const closeDeleteModal = () => {
    setIsDeleteLoading(false);
    setDeleteError(null);
    setDeleteModal({
      isOpen: false,
      transactionId: null,
      transactionSource: null,
      transactionDescription: null
    });
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteModal.transactionId || !deleteModal.transactionSource) return;

    try {
      setIsDeleteLoading(true);
      setDeleteError(null);
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (deleteModal.transactionSource === 'expenses') {
        endpoint = 'expenses';
      } else if (deleteModal.transactionSource === 'income') {
        endpoint = 'income';
      } else if (deleteModal.transactionSource === 'vehicle-expenses') {
        endpoint = 'vehicle-expenses';
      }

      if (!endpoint) {
        throw new Error('Invalid transaction source');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/${endpoint}/${deleteModal.transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete transaction');
      }

      // Refresh data after successful deletion
      await fetchData();
      setIsDeleteLoading(false);
      closeDeleteModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete transaction';
      setDeleteError(message);
      setIsDeleteLoading(false);
    }
  };

  // Improve modal UX: lock background scroll and close on ESC
  useEffect(() => {
    if (!deleteModal.isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDeleteModal();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [deleteModal.isOpen]);

  const generatePLReport = () => {
    const headers = ['Date', 'Description', 'Category', 'Debit', 'Credit', 'Balance'];
    const rows = [headers.join(',')];

    let runningBalance = 0;

    // Sort all transactions by date
    const allTransactions = [
      ...income.map(i => ({ ...i, type: 'income' })),
      ...expenses.map(e => ({ ...e, type: 'expense', category: 'Expense' }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    allTransactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount.toString());
      const debit = transaction.type === 'expense' ? amount : 0;
      const credit = transaction.type === 'income' ? amount : 0;
      runningBalance += credit - debit;

      rows.push([
        transaction.date,
        `"${transaction.description}"`,
        transaction.category || 'N/A',
        debit.toFixed(2),
        credit.toFixed(2),
        runningBalance.toFixed(2)
      ].join(','));
    });

    // Add summary
    rows.push('');
    rows.push('"SUMMARY"');
    rows.push(`"Total Income",,,"","${summary.totalIncome.toFixed(2)}","${summary.totalIncome.toFixed(2)}"`);
    rows.push(`"Total Expenses",,,"${summary.totalExpenses.toFixed(2)}","","${(summary.totalIncome - summary.totalExpenses).toFixed(2)}"`);
    rows.push(`"Net Income",,,"","${summary.netIncome.toFixed(2)}","${summary.netIncome.toFixed(2)}"`);

    return rows.join('\n');
  };

  const getProfitLossChartData = () => {
    // Get last 12 months of data
    const months = [];
    const profitLoss = [];
    const incomeData = [];
    const expenseData = [];

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push(monthName);

      // Calculate income and expenses for this month
      const monthIncome = income
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);

      const monthExpenses = expenses
        .filter(item => {
          const itemDate = new Date(item.date);
          return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);

      incomeData.push(monthIncome);
      expenseData.push(monthExpenses);
      profitLoss.push(monthIncome - monthExpenses);
    }

    return {
      labels: months,
      datasets: [
        {
          label: 'Net Profit/Loss',
          data: profitLoss,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: t('pages.manageProjectDetails.analytics.labels.income'),
          data: incomeData,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          hidden: true, // Hidden by default
        },
        {
          label: t('pages.manageProjectDetails.analytics.labels.expenses'),
          data: expenseData,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
          hidden: true, // Hidden by default
        }
      ],
    };
  };

  const getIncomeExpensePieData = () => {
    return {
      labels: [t('pages.manageProjectDetails.analytics.labels.income'), t('pages.manageProjectDetails.analytics.labels.expenses')],
      datasets: [
        {
          data: [summary.totalIncome, summary.totalExpenses],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(239, 68, 68)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getIncomeCategoriesData = () => {
    const categories = ['salary', 'freelance', 'investment', 'business', 'other'];
    const categoryData = categories.map(category => {
      return income
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    });

    const categoryLabels = categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));

    return {
      labels: categoryLabels,
      datasets: [
        {
          data: categoryData,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(156, 163, 175, 0.8)',
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(59, 130, 246)',
            'rgb(168, 85, 247)',
            'rgb(251, 191, 36)',
            'rgb(156, 163, 175)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const getExpenseCategoriesData = () => {
    const categories = ['general', 'food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment', 'shopping', 'education', 'travel', 'insurance', 'other'];
    const categoryData = categories.map(category => {
      return expenses
        .filter(item => item.category === category)
        .reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    });

    const categoryLabels = categories.map(cat => {
      // Capitalize first letter and replace underscores with spaces
      return cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ');
    });

    return {
      labels: categoryLabels,
      datasets: [
        {
          data: categoryData,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',    // general - red
            'rgba(245, 101, 101, 0.8)',  // food - light red
            'rgba(252, 165, 165, 0.8)',  // transportation - lighter red
            'rgba(248, 113, 113, 0.8)',  // housing - red
            'rgba(239, 68, 68, 0.8)',    // utilities - red
            'rgba(220, 38, 38, 0.8)',    // healthcare - darker red
            'rgba(185, 28, 28, 0.8)',    // entertainment - dark red
            'rgba(153, 27, 27, 0.8)',    // shopping - darker red
            'rgba(127, 29, 29, 0.8)',    // education - very dark red
            'rgba(69, 10, 10, 0.8)',     // travel - darkest red
            'rgba(239, 68, 68, 0.8)',    // insurance - red
            'rgba(156, 163, 175, 0.8)',  // other - gray
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 101, 101)',
            'rgb(252, 165, 165)',
            'rgb(248, 113, 113)',
            'rgb(239, 68, 68)',
            'rgb(220, 38, 38)',
            'rgb(185, 28, 28)',
            'rgb(153, 27, 27)',
            'rgb(127, 29, 29)',
            'rgb(69, 10, 10)',
            'rgb(239, 68, 68)',
            'rgb(156, 163, 175)',
          ],
          borderWidth: 2,
        },
      ],
    };
  };

  const TransactionTable = ({ data, type }: { data: Income[] | Expense[], type: 'income' | 'expense' }) => (
    <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
        <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white flex items-center">
          {type === 'income' ? (
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
          )}
          {type === 'income' ? 'Income' : 'Expenses'}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
            {data.map((item) => (
              <tr key={`${(item as any).source || type}-${item.id}`} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                  {new Date(item.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                  {item.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    type === 'income'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                  }`}>
                    {item.category || 'general'}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                  type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(parseFloat(item.amount.toString()))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    type="button"
                    onClick={() => openDeleteModal(item.id, item.source || 'expenses', item.description)}
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors duration-200"
                    title="Delete transaction"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
      <div className="max-w-7xl mx-auto space-y-8 mt-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <Calculator className="w-7 h-7 sm:w-8 sm:h-8 mr-3 text-blue-500" />
              {t('pages.expenses.title')}
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Track your financial transactions and generate professional reports
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={exportBalanceSheet}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap"
            >
              <Download className="w-5 h-5" />
              {t('buttons.print')}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              {t('buttons.add')}
            </button>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">{t('pages.manageProjectDetails.balanceReport.totalIncome')}</p>
                <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(summary.totalIncome)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">{t('pages.manageProjectDetails.balanceReport.totalExpenses')}</p>
                <p className="text-2xl sm:text-3xl font-bold">{formatCurrency(summary.totalExpenses)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">{t('pages.expenses.netIncome')}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${summary.netIncome >= 0 ? 'text-white' : 'text-red-200'}`}>
                  {formatCurrency(summary.netIncome)}
                </p>
              </div>
              <PiggyBank className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Savings Rate</p>
                <p className="text-2xl sm:text-3xl font-bold">{summary.savingsRate.toFixed(1)}%</p>
              </div>
              <Wallet className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'overview', label: t('pages.tasks.tabs.overview'), icon: FileText },
              { id: 'income', label: t('pages.manageProjectDetails.tabs.income'), icon: TrendingUp },
              { id: 'expenses', label: t('pages.manageProjectDetails.plReport.expenses'), icon: TrendingDown },
              { id: 'analytics', label: t('pages.tasks.tabs.analytics'), icon: BarChart3 }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTabType)}
                  className={`flex items-center px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-medium text-sm sm:text-base transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-powerbi-primary text-white shadow-lg'
                      : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TransactionTable data={income.slice(0, 5)} type="income" />
                <TransactionTable data={expenses.slice(0, 5)} type="expense" />
              </div>
            </div>
          )}

          {activeTab === 'income' && (
            <TransactionTable data={income} type="income" />
          )}

          {activeTab === 'expenses' && (
            <TransactionTable data={expenses} type="expense" />
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profit & Loss Trend Chart */}
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    Profit & Loss Trend
                  </h3>
                  <div className="h-64 sm:h-80">
                    <Line
                      data={getProfitLossChartData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top' as const,
                          },
                          title: {
                            display: false,
                          },
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: function(value) {
                                return formatCurrency(Number(value));
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Income vs Expenses Pie Chart */}
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                    {t('pages.manageProjectDetails.analytics.title')}
                  </h3>
                  <div className="h-64 sm:h-80 flex items-center justify-center">
                    <Pie
                      data={getIncomeExpensePieData()}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom' as const,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Income Categories Breakdown */}
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 flex items-center">
                  <Wallet className="w-5 h-5 mr-2 text-green-500" />
                  {t('pages.expenses.incomeCategoriesBreakdown')}
                </h3>
                <div className="h-64 sm:h-80">
                  <Pie
                    data={getIncomeCategoriesData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Expense Categories Breakdown */}
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
                  Expense Categories Breakdown
                </h3>
                <div className="h-64 sm:h-80">
                  <Pie
                    data={getExpenseCategoriesData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const label = context.label || '';
                              const value = context.parsed;
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = ((value / total) * 100).toFixed(1);
                              return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Transaction Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">
                  Add Transaction
                </h3>
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">
                      Transaction Type
                    </label>
                    <select
                      value={formType}
                      disabled={isAddingTransaction}
                      onChange={(e) => setFormType(e.target.value as 'income' | 'expense')}
                      className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      required
                      disabled={isAddingTransaction}
                      className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Enter description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      name="amount"
                      step="0.01"
                      required
                      disabled={isAddingTransaction}
                      className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      disabled={isAddingTransaction}
                      className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      disabled={isAddingTransaction}
                      className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formType === 'income' ? (
                        <>
                          <option value="salary">Salary</option>
                          <option value="freelance">Freelance</option>
                          <option value="investment">Investment</option>
                          <option value="business">Business</option>
                          <option value="other">Other</option>
                        </>
                      ) : (
                        <>
                          <option value="general">General</option>
                          <option value="food">Food & Dining</option>
                          <option value="transportation">Transportation</option>
                          <option value="housing">Housing</option>
                          <option value="utilities">Utilities</option>
                          <option value="healthcare">Healthcare</option>
                          <option value="entertainment">Entertainment</option>
                          <option value="shopping">Shopping</option>
                          <option value="education">Education</option>
                          <option value="travel">Travel</option>
                          <option value="insurance">Insurance</option>
                          <option value="other">Other</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      disabled={isAddingTransaction}
                      className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingTransaction}
                      className="bg-powerbi-primary hover:brightness-110 disabled:bg-powerbi-primary/70 text-white px-6 py-2 rounded-xl transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isAddingTransaction && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                      Add {formType === 'income' ? 'Income' : 'Expense'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[1000]" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="absolute inset-0 bg-black/60" onClick={closeDeleteModal}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-6 bg-white dark:bg-powerbi-gray-800 shadow-xl rounded-2xl">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/20">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>

              <h3 id="delete-modal-title" className="text-lg font-semibold text-center text-powerbi-gray-900 dark:text-white mb-2">
                Delete Transaction
              </h3>

              <p className="text-sm text-center text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-6">
                Are you sure you want to delete this transaction?
              </p>

              {deleteModal.transactionDescription && (
                <div className="p-3 mb-6 bg-powerbi-gray-50 dark:bg-powerbi-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-powerbi-gray-900 dark:text-white">
                    {deleteModal.transactionDescription}
                  </p>
                </div>
              )}

              {deleteError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-powerbi-gray-700 bg-powerbi-gray-100 border border-transparent rounded-lg hover:bg-powerbi-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-powerbi-gray-500 dark:bg-powerbi-gray-700 dark:text-powerbi-gray-300 dark:hover:bg-powerbi-gray-600 transition-colors duration-200"
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTransaction}
                  disabled={isDeleteLoading}
                  className={`flex-1 px-4 py-2 text-sm font-medium text-white border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ${isDeleteLoading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'}`}
                >
                  {isDeleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}