'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';

interface ReportData {
  heading: string;
  generated_at: string;
  business: any;
  summary: {
    inventory_items: number;
    inventory_total_value: number;
    purchases_count: number;
    purchases_total: number;
    sales_count: number;
    sales_total: number;
    expenses_count: number;
    expenses_total: number;
  };
}

export default function BusinessReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    (async () => {
      try {
        const res = await fetch('http://localhost:3001/api/business/report', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) {
          setData(json);
        } else {
          setError(json.error || 'Failed to load report');
        }
      } catch (e) {
        setError('Failed to load report');
      }
    })();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <section className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">📄</span>
              {data ? data.heading : 'Business Report'}
            </h1>
            {data?.business?.business_name && (
              <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
                {data.business.business_name} • Generated on {data?.generated_at?.slice(0, 10)}
              </p>
            )}
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handlePrint} className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap">
              <span className="w-5 h-5">🖨️</span>
              Print
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>
        )}

        {data && (
          <div className="space-y-8">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-blue-100 text-sm font-medium">Inventory Items</p>
                  <p className="text-2xl sm:text-3xl font-bold">{data.summary.inventory_items}</p>
                </div><span className="text-blue-200">💎</span></div>
              </div>
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-purple-100 text-sm font-medium">Inventory Value</p>
                  <p className="text-2xl sm:text-3xl font-bold">{data.summary.inventory_total_value.toFixed(2)}</p>
                </div><span className="text-purple-200">💰</span></div>
              </div>
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-emerald-100 text-sm font-medium">Sales Total</p>
                  <p className="text-2xl sm:text-3xl font-bold">{data.summary.sales_total.toFixed(2)}</p>
                </div><span className="text-emerald-200">📈</span></div>
              </div>
              <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between"><div>
                  <p className="text-rose-100 text-sm font-medium">Expenses Total</p>
                  <p className="text-2xl sm:text-3xl font-bold">{data.summary.expenses_total.toFixed(2)}</p>
                </div><span className="text-rose-200">💸</span></div>
              </div>
            </div>

            {/* Details card */}
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
              <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white mb-4">Business Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-powerbi-gray-500">Owner:</span> <span className="font-medium">{data.business?.owner_name || '-'}</span></div>
                <div><span className="text-powerbi-gray-500">Registration No:</span> <span className="font-medium">{data.business?.registration_no || '-'}</span></div>
                <div><span className="text-powerbi-gray-500">Tax ID:</span> <span className="font-medium">{data.business?.tax_id || '-'}</span></div>
                <div><span className="text-powerbi-gray-500">Email:</span> <span className="font-medium">{data.business?.email || '-'}</span></div>
                <div><span className="text-powerbi-gray-500">Phone:</span> <span className="font-medium">{data.business?.phone || '-'}</span></div>
                <div><span className="text-powerbi-gray-500">Country:</span> <span className="font-medium">{data.business?.country || '-'}</span></div>
                <div className="sm:col-span-2"><span className="text-powerbi-gray-500">Address:</span> <span className="font-medium">{data.business?.address || '-'}</span></div>
              </div>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
