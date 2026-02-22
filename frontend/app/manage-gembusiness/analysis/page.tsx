'use client';

import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { ArrowDownRight, ArrowUpRight, Download, Loader2 } from 'lucide-react';

interface GemPurchase {
  id: number;
  description: string;
  amount: number;
  date: string;
  vendor?: string | null;
}

interface GemSale {
  id: number;
  inventory_id: number;
  amount: number;
  date: string;
  buyer?: string | null;
  description?: string | null;
  gem_name?: string | null;
  purchase_price?: number | null;
  expenses_total?: number | null;
}

interface UserProfile {
  currency?: string;
}

function formatCurrency(value: number, currency: string | undefined) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(value || 0);
  } catch {
    return `${value.toFixed(2)} ${currency || 'USD'}`;
  }
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes('"') || str.includes(',') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number | null)[][]) {
  const csvLines = [headers.map(toCsvValue).join(',')];
  for (const row of rows) {
    csvLines.push(row.map(toCsvValue).join(','));
  }
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function GemBusinessAnalysis() {
  const [purchases, setPurchases] = useState<GemPurchase[]>([]);
  const [sales, setSales] = useState<GemSale[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    const fetchAll = async () => {
      if (!token) {
        setLoading(false);
        setError('Not authenticated');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
        const [pRes, sRes, uRes] = await Promise.all([
          fetch(`${base}/api/gem/purchases`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${base}/api/gem/sales`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${base}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!pRes.ok || !sRes.ok || !uRes.ok) {
          throw new Error('Failed to load gem analysis data');
        }

        const [pData, sData, uData] = await Promise.all([pRes.json(), sRes.json(), uRes.json()]);

        setPurchases(
          (Array.isArray(pData) ? pData : []).map((p: any) => ({
            id: Number(p.id),
            description: typeof p.description === 'string' ? p.description : '',
            amount: Number(p.amount) || 0,
            date: p.date || new Date().toISOString().slice(0, 10),
            vendor: p.vendor || null,
          }))
        );

        setSales(
          (Array.isArray(sData) ? sData : []).map((s: any) => ({
            id: Number(s.id),
            inventory_id: Number(s.inventory_id),
            amount: Number(s.amount) || 0,
            date: s.date || new Date().toISOString().slice(0, 10),
            buyer: s.buyer || null,
            description: s.description || '',
            gem_name: s.gem_name || null,
            purchase_price: s.purchase_price != null ? Number(s.purchase_price) : null,
            expenses_total: s.expenses_total != null ? Number(s.expenses_total) : null,
          }))
        );

        setUserProfile(uData || null);
      } catch (e: any) {
        setError(e.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  const filteredSales = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return sales.filter((s) => {
      const d = new Date(s.date);
      if (from && d < from) return false;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (d > toEnd) return false;
      }
      return true;
    });
  }, [sales, fromDate, toDate]);

  const filteredPurchases = useMemo(() => {
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return purchases.filter((p) => {
      const d = new Date(p.date);
      if (from && d < from) return false;
      if (to) {
        const toEnd = new Date(to);
        toEnd.setHours(23, 59, 59, 999);
        if (d > toEnd) return false;
      }
      return true;
    });
  }, [purchases, fromDate, toDate]);

  const currency = userProfile?.currency || 'USD';

  const totalPurchaseAmount = useMemo(
    () => filteredPurchases.reduce((sum, p) => sum + (Number(p.amount) || 0), 0),
    [filteredPurchases]
  );

  const totalSalesAmount = useMemo(
    () => filteredSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0),
    [filteredSales]
  );

  const totalPurchaseAndExpenses = useMemo(
    () =>
      filteredSales.reduce((sum, s) => {
        const purchase = Number(s.purchase_price || 0);
        const expenses = Number(s.expenses_total || 0);
        return sum + purchase + expenses;
      }, 0),
    [filteredSales]
  );

  const totalNetProfit = useMemo(
    () =>
      filteredSales.reduce((sum, s) => {
        const purchase = Number(s.purchase_price || 0);
        const expenses = Number(s.expenses_total || 0);
        const net = (Number(s.amount) || 0) - purchase - expenses;
        return sum + net;
      }, 0),
    [filteredSales]
  );

  const profitMargin = useMemo(() => {
    if (totalPurchaseAndExpenses <= 0) return 0;
    return (totalNetProfit / totalPurchaseAndExpenses) * 100;
  }, [totalNetProfit, totalPurchaseAndExpenses]);

  const handleDownloadPurchases = () => {
    if (!filteredPurchases.length) return;
    const headers = ['Date', 'Description', 'Vendor', 'Amount', 'Currency'];
    const rows = filteredPurchases.map((p) => [p.date, p.description, p.vendor || '', p.amount, currency]);
    downloadCsv('gem-purchases.csv', headers, rows);
  };

  const handleDownloadSales = () => {
    if (!filteredSales.length) return;
    const headers = [
      'Date',
      'Gem',
      'Inventory ID',
      'Purchase Price',
      'Expenses',
      'Sale Amount',
      'Net Profit',
      'Profit / Loss',
      'Buyer',
      'Description',
    ];

    const rows = filteredSales.map((s) => {
      const purchase = Number(s.purchase_price || 0);
      const expenses = Number(s.expenses_total || 0);
      const saleAmount = Number(s.amount) || 0;
      const net = saleAmount - purchase - expenses;
      const label = net > 0 ? 'Profit' : net < 0 ? 'Loss' : 'Break-even';

      return [
        s.date,
        s.gem_name || '',
        s.inventory_id,
        purchase,
        expenses,
        saleAmount,
        net,
        label,
        s.buyer || '',
        s.description || '',
      ];
    });

    downloadCsv('gem-sales-profit-loss.csv', headers, rows);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 space-y-6">
        <div className="flex flex-wrap items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white">Gem Business Analysis</h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              View profit and loss across your gemstone purchases and sales.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 text-sm text-powerbi-gray-900 dark:text-white"
              />
              <span className="hidden sm:inline text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-powerbi-gray-300 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 px-3 py-2 text-sm text-powerbi-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={handleDownloadPurchases}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Purchases CSV
            </button>
            <button
              onClick={handleDownloadSales}
              className="inline-flex items-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              Sales &amp; Profit CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-powerbi-gray-500 dark:text-powerbi-gray-400">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading analysis...
          </div>
        ) : error ? (
          <div className="py-4 px-4 sm:px-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
                <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 mb-1">Total Purchases</div>
                <div className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">
                  {formatCurrency(totalPurchaseAmount, currency)}
                </div>
                <div className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400 mt-1">
                  Based on purchase records in the selected range.
                </div>
              </div>

              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
                <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 mb-1">Total Sales</div>
                <div className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">
                  {formatCurrency(totalSalesAmount, currency)}
                </div>
                <div className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400 mt-1">
                  Sum of all gem sales in the selected range.
                </div>
              </div>

              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
                <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 mb-1">Net Profit</div>
                <div
                  className={`text-2xl font-bold flex items-center ${
                    totalNetProfit > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : totalNetProfit < 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-powerbi-gray-900 dark:text-white'
                  }`}
                >
                  {totalNetProfit >= 0 ? (
                    <ArrowUpRight className="w-5 h-5 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 mr-1" />
                  )}
                  {formatCurrency(totalNetProfit, currency)}
                </div>
                <div className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400 mt-1">
                  Sales minus purchase price and recorded expenses.
                </div>
              </div>

              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
                <div className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 mb-1">Profit Margin</div>
                <div className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">
                  {profitMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400 mt-1">
                  Net profit divided by (purchase price + expenses).
                </div>
              </div>
            </div>

            {/* Sales detail table */}
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Sales Profit &amp; Loss</h2>
                <p className="text-xs sm:text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                  Showing {filteredSales.length} sale{filteredSales.length === 1 ? '' : 's'} in the selected period.
                </p>
              </div>
              {filteredSales.length === 0 ? (
                <div className="py-8 text-center text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">
                  No sales found for the selected period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700 text-sm">
                    <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-900/50">
                      <tr>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider text-xs">
                          Date
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider text-xs">
                          Gem
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider text-xs">
                          Purchase + Expenses
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider text-xs">
                          Sale Amount
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider text-xs">
                          Net Profit
                        </th>
                        <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider text-xs">
                          Buyer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-powerbi-gray-800 divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-700">
                      {filteredSales.map((s) => {
                        const purchase = Number(s.purchase_price || 0);
                        const expenses = Number(s.expenses_total || 0);
                        const totalCost = purchase + expenses;
                        const saleAmount = Number(s.amount) || 0;
                        const net = saleAmount - totalCost;
                        const positive = net > 0;
                        const negative = net < 0;
                        return (
                          <tr key={s.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-900/40">
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap text-powerbi-gray-900 dark:text-white">
                              {new Date(s.date).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap text-powerbi-gray-800 dark:text-powerbi-gray-100">
                              <div className="flex flex-col">
                                <span className="font-medium">{s.gem_name || 'Gem #' + s.inventory_id}</span>
                                <span className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400">ID: {s.inventory_id}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap text-powerbi-gray-800 dark:text-powerbi-gray-100">
                              <div className="flex flex-col">
                                <span>{formatCurrency(purchase, currency)} purchase</span>
                                <span className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400">
                                  + {formatCurrency(expenses, currency)} expenses
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap text-powerbi-gray-800 dark:text-powerbi-gray-100">
                              {formatCurrency(saleAmount, currency)}
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap">
                              <div
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  positive
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                                    : negative
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700'
                                    : 'bg-powerbi-gray-50 dark:bg-powerbi-gray-900/30 text-powerbi-gray-700 dark:text-powerbi-gray-200 border-powerbi-gray-200 dark:border-powerbi-gray-700'
                                }`}
                              >
                                {positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : negative ? <ArrowDownRight className="w-3 h-3 mr-1" /> : null}
                                {formatCurrency(net, currency)}
                              </div>
                            </td>
                            <td className="px-3 py-3 sm:px-4 sm:py-3 whitespace-nowrap text-powerbi-gray-800 dark:text-powerbi-gray-100">
                              {s.buyer || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
