'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Plus,
  Clock,
  DollarSign,
  Calendar,
  ShoppingCart,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  BarChart3,
  Users,
  Target,
  TrendingUp
} from 'lucide-react';

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
  total_time_spent: number; // in minutes
}

interface Purchase {
  id: number;
  project_id: number;
  item_name: string;
  cost: number;
  category: string;
  date: string;
  vendor?: string;
}

interface Income {
  id: number;
  project_id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export default function ManageProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'budgeting' | 'purchases' | 'income'>('overview');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [userCurrency, setUserCurrency] = useState<string>('USD');
  const [userCountry, setUserCountry] = useState<string>('');

  // Project form state
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    budget: '',
    start_date: '',
    end_date: '',
    client_name: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Purchase form
  const [purchaseForm, setPurchaseForm] = useState({
    project_id: '',
    item_name: '',
    cost: '',
    category: '',
    vendor: ''
  });

  // Income form
  const [incomeForm, setIncomeForm] = useState({
    project_id: '',
    description: '',
    amount: '',
    category: 'project_revenue'
  });

  // Effects are declared after functions to satisfy lint rules

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUserCurrency(userData.currency || 'USD');
        setUserCountry(userData.country || '');
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'CAD': 'C$',
      'AUD': 'A$',
      'CHF': 'CHF',
      'CNY': '¥',
      'INR': '₹',
      'KRW': '₩'
    };
    return symbols[currency] || '$';
  };

  // Derive an IANA timezone from user's country; fallback to browser timezone
  const getTimeZoneForCountry = (country?: string) => {
    const key = (country || '').trim().toUpperCase();
    const map: { [key: string]: string } = {
      // Sri Lanka
      'SRI LANKA': 'Asia/Colombo',
      'LK': 'Asia/Colombo',
      'LKA': 'Asia/Colombo',
      // India
      'INDIA': 'Asia/Kolkata',
      'IN': 'Asia/Kolkata',
      'IND': 'Asia/Kolkata',
      // United States
      'UNITED STATES': 'America/New_York',
      'US': 'America/New_York',
      'USA': 'America/New_York',
      'UNITED STATES OF AMERICA': 'America/New_York',
      // Canada
      'CANADA': 'America/Toronto',
      'CA': 'America/Toronto',
      // United Kingdom
      'UNITED KINGDOM': 'Europe/London',
      'UK': 'Europe/London',
      'GB': 'Europe/London',
      'GBR': 'Europe/London',
      // Pakistan
      'PAKISTAN': 'Asia/Karachi',
      'PK': 'Asia/Karachi',
      // Bangladesh
      'BANGLADESH': 'Asia/Dhaka',
      'BD': 'Asia/Dhaka',
      // Nepal
      'NEPAL': 'Asia/Kathmandu',
      'NP': 'Asia/Kathmandu',
      // China
      'CHINA': 'Asia/Shanghai',
      'CN': 'Asia/Shanghai',
      // Japan
      'JAPAN': 'Asia/Tokyo',
      'JP': 'Asia/Tokyo',
      // South Korea
      'SOUTH KOREA': 'Asia/Seoul',
      'KOREA, REPUBLIC OF': 'Asia/Seoul',
      'KR': 'Asia/Seoul',
      // Australia
      'AUSTRALIA': 'Australia/Sydney',
      'AU': 'Australia/Sydney',
      // New Zealand
      'NEW ZEALAND': 'Pacific/Auckland',
      'NZ': 'Pacific/Auckland',
      // Brazil
      'BRAZIL': 'America/Sao_Paulo',
      'BR': 'America/Sao_Paulo',
      // Mexico
      'MEXICO': 'America/Mexico_City',
      'MX': 'America/Mexico_City',
      // South Africa
      'SOUTH AFRICA': 'Africa/Johannesburg',
      'ZA': 'Africa/Johannesburg',
      // Nigeria
      'NIGERIA': 'Africa/Lagos',
      'NG': 'Africa/Lagos',
      // Kenya
      'KENYA': 'Africa/Nairobi',
      'KE': 'Africa/Nairobi',
      // UAE
      'UAE': 'Asia/Dubai',
      'UNITED ARAB EMIRATES': 'Asia/Dubai',
      'AE': 'Asia/Dubai',
      // Saudi Arabia
      'SAUDI ARABIA': 'Asia/Riyadh',
      'SA': 'Asia/Riyadh',
      // Turkey
      'TURKEY': 'Europe/Istanbul',
      'TR': 'Europe/Istanbul'
    };
    return map[key] || Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const formatDateTimeInUserTZ = (iso: string) => {
    const tz = getTimeZoneForCountry(userCountry);
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(new Date(iso));
    } catch (e) {
      return new Date(iso).toLocaleString();
    }
  };

  // Robust currency formatter using Intl with safe fallback
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: userCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (e) {
      // Fallback when currency code is unknown or Intl fails
      return `${getCurrencySymbol(userCurrency)}${amount.toFixed(2)}`;
    }
  };

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/projects', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/project-purchases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  };

  const loadIncome = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/project-income', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIncome(data);
      }
    } catch (error) {
      console.error('Error loading income:', error);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadProjects();
      loadPurchases();
      loadIncome();
      loadUserProfile();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const projectData = {
      ...projectForm,
      budget: parseFloat(projectForm.budget) || 0,
      status: 'planning' as const
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingProject ? `http://localhost:3001/api/projects/${editingProject.id}` : 'http://localhost:3001/api/projects';
      const method = editingProject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      });

      if (response.ok) {
        loadProjects();
        setShowProjectForm(false);
        setEditingProject(null);
        setProjectForm({
          name: '',
          description: '',
          budget: '',
          start_date: '',
          end_date: '',
          client_name: '',
          priority: 'medium'
        });
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const purchaseData = {
      ...purchaseForm,
      cost: parseFloat(purchaseForm.cost) || 0,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/project-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(purchaseData)
      });

      if (response.ok) {
        loadPurchases();
        loadProjects(); // Update project spent amount
        setPurchaseForm({
          project_id: '',
          item_name: '',
          cost: '',
          category: '',
          vendor: ''
        });
      }
    } catch (error) {
      console.error('Error saving purchase:', error);
    }
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const incomeData = {
      ...incomeForm,
      amount: parseFloat(incomeForm.amount) || 0,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/project-income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(incomeData)
      });

      if (response.ok) {
        loadIncome();
        loadProjects(); // Update project budget
        setIncomeForm({
          project_id: '',
          description: '',
          amount: '',
          category: 'project_revenue'
        });
      }
    } catch (error) {
      console.error('Error saving income:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'on-hold': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTotalProjectSpent = (projectId: number) => {
    return purchases
      .filter(purchase => purchase.project_id === projectId)
      .reduce((total, purchase) => total + purchase.cost, 0);
  };

  return (
    <DashboardLayout>
      <section className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">📁</span>
              Project Management
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Track projects, time, budget, and manage purchases
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowProjectForm(true)}
              className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold">{projects.length}</p>
              </div>
              <span className="text-blue-200">📁</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Projects</p>
                <p className="text-3xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
              </div>
              <span className="text-green-200">✅</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Budget</p>
                <p className="text-3xl font-bold">{formatCurrency(projects.reduce((total, project) => total + (Number(project.budget) || 0), 0))}</p>
              </div>
              <span className="text-purple-200">💰</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Completed</p>
                <p className="text-3xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
              </div>
              <span className="text-amber-200">🏆</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm font-medium">On Hold</p>
                <p className="text-3xl font-bold">{projects.filter(p => p.status === 'on-hold').length}</p>
              </div>
              <span className="text-rose-200">⏸️</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'projects', label: 'Projects', icon: FolderOpen },
              { id: 'budgeting', label: 'Budgeting', icon: DollarSign },
              { id: 'purchases', label: 'Expenses', icon: ShoppingCart },
              { id: 'income', label: 'Income', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'projects' | 'budgeting' | 'purchases' | 'income')}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-powerbi-primary text-white shadow-lg'
                    : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 text-sm">Total Projects</p>
                      <p className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">{projects.length}</p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-powerbi-primary" />
                  </div>
                </div>

                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 text-sm">Active Projects</p>
                      <p className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">
                        {projects.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 text-sm">Total Budget</p>
                      <p className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">
                        {formatCurrency(projects.reduce((total, project) => total + (Number(project.budget) || 0), 0))}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>
            )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <div key={project.id} className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-xl transition-shadow duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/manage-projects/${project.id}`)}
                      >
                        <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-1">
                          {project.name}
                        </h3>
                        <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">
                          {project.description}
                        </p>
                        {project.client_name && (
                          <p className="text-sm text-powerbi-gray-500 dark:text-powerbi-gray-500">
                            Client: {project.client_name}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setEditingProject(project);
                            setProjectForm({
                              name: project.name,
                              description: project.description,
                              budget: project.budget.toString(),
                              start_date: project.start_date,
                              end_date: project.end_date,
                              client_name: project.client_name || '',
                              priority: project.priority
                            });
                            setShowProjectForm(true);
                          }}
                          className="p-2 text-powerbi-gray-400 hover:text-powerbi-primary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                          {project.priority.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-powerbi-gray-600 dark:text-powerbi-gray-400">Budget</span>
                          <span className="font-medium text-powerbi-gray-900 dark:text-white">
                            {formatCurrency(project.budget)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-powerbi-gray-600 dark:text-powerbi-gray-400">Spent</span>
                          <span className="font-medium text-powerbi-gray-900 dark:text-white">
                            {formatCurrency(getTotalProjectSpent(project.id))}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        {/* No time tracking buttons */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budgeting Tab */}
          {activeTab === 'budgeting' && (
            <div className="space-y-6">
              {projects.map((project) => {
                const spent = getTotalProjectSpent(project.id);
                const remaining = project.budget - spent;
                const percentage = project.budget > 0 ? (spent / project.budget) * 100 : 0;

                return (
                  <div key={project.id} className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">
                          {formatCurrency(remaining)}
                        </p>
                        <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                          Remaining Budget
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="w-full bg-powerbi-gray-200 dark:bg-powerbi-gray-700 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all duration-300 ${
                            percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Budget</p>
                          <p className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                            {formatCurrency(project.budget)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Spent</p>
                          <p className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                            {formatCurrency(spent)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Used</p>
                          <p className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                            {percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-6">
              {/* Add Purchase Form */}
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">
                  Add Purchase
                </h3>
                <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Project
                      </label>
                      <select
                        value={purchaseForm.project_id}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, project_id: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      >
                        <option value="">Select Project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        value={purchaseForm.item_name}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, item_name: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                        placeholder="e.g., Software License, Hardware, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Cost
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={purchaseForm.cost}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, cost: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={purchaseForm.category}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      >
                        <option value="">Select Category</option>
                        <option value="Software">Software</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Services">Services</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Travel">Travel</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Vendor (Optional)
                    </label>
                    <input
                      type="text"
                      value={purchaseForm.vendor}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, vendor: e.target.value })}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      placeholder="e.g., Adobe, AWS, etc."
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl transition-colors"
                  >
                    Add Purchase
                  </button>
                </form>
              </div>

              {/* Purchases List */}
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                    Purchase History
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {purchases.map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-powerbi-gray-900 dark:text-white">
                            {purchase.item_name}
                          </p>
                          <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                            {purchase.category} • {projects.find(p => p.id === purchase.project_id)?.name}
                            {purchase.vendor && ` • ${purchase.vendor}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-powerbi-gray-900 dark:text-white">
                            {formatCurrency(purchase.cost)}
                          </p>
                          <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">
                            {new Date(purchase.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Income Tab */}
          {activeTab === 'income' && (
            <div className="space-y-6">
              {/* Add Income Form */}
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">
                  Add Income
                </h3>
                <form onSubmit={handleIncomeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Project
                      </label>
                      <select
                        value={incomeForm.project_id}
                        onChange={(e) => setIncomeForm({ ...incomeForm, project_id: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      >
                        <option value="">Select Project</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={incomeForm.description}
                        onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                        placeholder="e.g., Client Payment, Milestone Payment, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={incomeForm.amount}
                        onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={incomeForm.category}
                        onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      >
                        <option value="project_revenue">Project Revenue</option>
                        <option value="milestone_payment">Milestone Payment</option>
                        <option value="client_payment">Client Payment</option>
                        <option value="investment">Investment</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl transition-colors"
                  >
                    Add Income
                  </button>
                </form>
              </div>

              {/* Income List */}
              <div className="bg-white dark:bg-powerbi-gray-800 rounded-xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                    Income History
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {income.map((incomeItem) => (
                      <div key={incomeItem.id} className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex-1">
                          <p className="font-medium text-green-800 dark:text-green-200">
                            {incomeItem.description}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {incomeItem.category.replace('_', ' ').toUpperCase()} • {projects.find(p => p.id === incomeItem.project_id)?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-green-800 dark:text-green-200">
                            +{formatCurrency(incomeItem.amount)}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            {new Date(incomeItem.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Project Form Modal */}
        {showProjectForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <button
                  onClick={() => {
                    setShowProjectForm(false);
                    setEditingProject(null);
                    setProjectForm({
                      name: '',
                      description: '',
                      budget: '',
                      start_date: '',
                      end_date: '',
                      client_name: '',
                      priority: 'medium'
                    });
                  }}
                  className="text-powerbi-gray-400 hover:text-powerbi-gray-600 dark:hover:text-powerbi-gray-300"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      placeholder="Describe the project"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Budget
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={projectForm.budget}
                      onChange={(e) => setProjectForm({ ...projectForm, budget: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={projectForm.priority}
                      onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.start_date}
                      onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={projectForm.end_date}
                      onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Client Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={projectForm.client_name}
                      onChange={(e) => setProjectForm({ ...projectForm, client_name: e.target.value })}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white"
                      placeholder="Enter client name"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectForm(false);
                      setEditingProject(null);
                      setProjectForm({
                        name: '',
                        description: '',
                        budget: '',
                        start_date: '',
                        end_date: '',
                        client_name: '',
                        priority: 'medium'
                      });
                    }}
                    className="px-4 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 text-powerbi-gray-700 dark:text-powerbi-gray-300 rounded-lg hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}