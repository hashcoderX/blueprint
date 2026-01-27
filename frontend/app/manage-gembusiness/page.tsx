'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { FolderOpen, ShoppingCart, DollarSign } from 'lucide-react';

export default function ManageGemBusiness() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20">
                <FolderOpen className="w-5 h-5" />
              </span>
              Manage My Gem Business
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Overview for inventory, purchases, and income specific to gem trade
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center mb-3">
              <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Purchases</h3>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Record gemstone purchases and suppliers.</p>
          </div>

          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center mb-3">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Income</h3>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Track sales, auctions, and consignments.</p>
          </div>

          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center mb-3">
              <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
              <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Inventory</h3>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Maintain stock, grading info, and photos.</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
