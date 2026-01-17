'use client';

import DashboardLayout from '../../components/DashboardLayout';

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-8">
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">
              Settings Coming Soon
            </h3>
            <p className="text-powerbi-gray-500 dark:text-powerbi-gray-500">
              Account preferences and application settings will be available here.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}