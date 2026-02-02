'use client';

import DashboardLayout from '../components/DashboardLayout';
import { useState, useEffect } from 'react';

interface Summary {
  totalExpenses: number;
  goalsProgress: number;
  pendingTasks: number;
  vehicleExpenses: number;
}

export default function Home() {
  const [summary, setSummary] = useState<Summary>({
    totalExpenses: 12345,
    goalsProgress: 75,
    pendingTasks: 8,
    vehicleExpenses: 2100
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:3001/api/summary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Error:', data.error);
          // Optionally redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        } else {
          setSummary(data);
        }
      })
      .catch(err => console.error('Error fetching summary:', err));
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white text-center sm:text-left">Total Expenses</h3>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2 text-center sm:text-left">${summary.totalExpenses.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 text-center sm:text-left">+5% from last month</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white text-center sm:text-left">Goals Progress</h3>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-green-600 dark:text-green-400 mt-2 text-center sm:text-left">{summary.goalsProgress}%</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 text-center sm:text-left">Goals achieved</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white text-center sm:text-left">Pending Tasks</h3>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-orange-600 dark:text-orange-400 mt-2 text-center sm:text-left">{summary.pendingTasks}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 text-center sm:text-left">Tasks to complete</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 md:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm">
            <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white text-center sm:text-left">Vehicle Expenses</h3>
            <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2 text-center sm:text-left">${summary.vehicleExpenses.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 text-center sm:text-left">This month</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
