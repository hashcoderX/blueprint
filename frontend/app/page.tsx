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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Expenses</h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">${summary.totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">+5% from last month</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Goals Progress</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{summary.goalsProgress}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Goals achieved</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Tasks</h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">{summary.pendingTasks}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tasks to complete</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vehicle Expenses</h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">${summary.vehicleExpenses.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This month</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
