'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { FolderOpen, ShoppingCart, DollarSign, Gem, Layers } from 'lucide-react';

export default function ManageGemBusiness() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20">💎</span>
              Manage My Gem Business
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Track inventory, purchases, and sales for your gem trade
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Inventory Items</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <Layers className="w-6 h-6 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Purchases (Month)</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <ShoppingCart className="w-6 h-6 text-emerald-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Sales (Month)</p>
                <p className="text-3xl font-bold">0</p>
              </div>
              <DollarSign className="w-6 h-6 text-blue-200" />
            </div>
          </div>
        </div>

        {/* Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Gem className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Inventory</h3>
              </div>
              <button className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white">Add Item</button>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Maintain stock, grading info, and photos.</p>
            <div className="mt-4 text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">No items yet.</div>
          </div>

          {/* Purchases */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mr-2" />
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Purchases</h3>
              </div>
              <button className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white">Add Purchase</button>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Record gemstone purchases and suppliers.</p>
            <div className="mt-4 text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">No purchases yet.</div>
          </div>

          {/* Sales/Income */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">Income</h3>
              </div>
              <button className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">Add Sale</button>
            </div>
            <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Track sales, auctions, and consignments.</p>
            <div className="mt-4 text-powerbi-gray-500 dark:text-powerbi-gray-400 text-sm">No sales yet.</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
