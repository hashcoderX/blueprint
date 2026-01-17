'use client';

import DashboardLayout from '../../components/DashboardLayout';

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
            Detailed financial reports and insights
          </p>
        </div>

        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-8">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">
              Analytics Coming Soon
            </h3>
            <p className="text-powerbi-gray-500 dark:text-powerbi-gray-500">
              Detailed financial analytics and reporting features will be available here.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}