'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import {
  Plus,
  DollarSign,
  ShoppingCart,
  Edit,
  CheckCircle,
  FolderOpen,
  BarChart3,
  TrendingUp,
  Trash2
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
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'budgeting' | 'purchases' | 'income'>('overview');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
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

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Effects are declared after functions to satisfy lint rules

  const loadUserProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/user/profile`, {
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
  }, []);

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

  // removed unused formatDateTimeInUserTZ to satisfy lint

  // Robust currency formatter using Intl with safe fallback
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: userCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.error('Currency format error:', error);
      return `${getCurrencySymbol(userCurrency)}${amount.toFixed(2)}`;
    }
  };

  const loadProjects = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/project-purchases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPurchases(data);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  }, []);

  const loadIncome = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/project-income`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIncome(data);
      }
    } catch (error) {
      console.error('Error loading income:', error);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadProjects();
      loadPurchases();
      loadIncome();
      loadUserProfile();
    }, 0);
    return () => clearTimeout(t);
  }, [loadProjects, loadPurchases, loadIncome, loadUserProfile]);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProject(true);

    const projectData = {
      ...projectForm,
      budget: parseFloat(projectForm.budget) || 0,
      status: 'planning' as const
    };

    try {
      const token = localStorage.getItem('token');
      const url = editingProject ? `${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/projects/${editingProject.id}` : `${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/projects`;
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
    } finally {
      setIsCreatingProject(false);
    }
  };

  const deleteProject = async (projectId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadProjects();
        setShowDeleteModal(false);
        setProjectToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingPurchase(true);

    const purchaseData = {
      ...purchaseForm,
      cost: parseFloat(purchaseForm.cost) || 0,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/project-purchases`, {
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
    } finally {
      setIsAddingPurchase(false);
    }
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingIncome(true);

    const incomeData = {
      ...incomeForm,
      amount: parseFloat(incomeForm.amount) || 0,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/project-income`, {
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
    } finally {
      setIsAddingIncome(false);
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 mt-16">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">📁</span>
              {t('pages.manageProjects.title')}
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Track projects, time, budget, and manage purchases
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setShowProjectForm(true)}
              className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors w-full sm:w-auto"
            >
              <Plus className="w-5 h-5" />
              {t('buttons.add')} Project
            </button>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Projects</p>
                <p className="text-xl sm:text-2xl font-bold">{projects.length}</p>
              </div>
              <span className="text-blue-200">📁</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Projects</p>
                <p className="text-xl sm:text-2xl font-bold">{projects.filter(p => p.status === 'active').length}</p>
              </div>
              <span className="text-green-200">✅</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Budget</p>
                <p className="text-xl sm:text-2xl font-bold">{formatCurrency(projects.reduce((total, project) => total + (Number(project.budget) || 0), 0))}</p>
              </div>
              <span className="text-purple-200">💰</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Completed</p>
                <p className="text-xl sm:text-2xl font-bold">{projects.filter(p => p.status === 'completed').length}</p>
              </div>
              <span className="text-amber-200">🏆</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-rose-400 to-rose-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm font-medium">On Hold</p>
                <p className="text-xl sm:text-2xl font-bold">{projects.filter(p => p.status === 'on-hold').length}</p>
              </div>
              <span className="text-rose-200">⏸️</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'overview', label: t('pages.tasks.tabs.overview'), icon: BarChart3 },
              { id: 'projects', label: t('sidebar.items.manageProjects'), icon: FolderOpen },
              { id: 'budgeting', label: t('pages.manageProjectDetails.tabs.budgeting'), icon: DollarSign },
              { id: 'purchases', label: t('sidebar.descriptions.expensesDesc'), icon: ShoppingCart },
              { id: 'income', label: t('pages.manageProjectDetails.tabs.income'), icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'projects' | 'budgeting' | 'purchases' | 'income')}
                className={`flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-200 ${
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
            {/* Temporarily disabled tab panels to isolate tag mismatch */}
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 text-sm">Total Projects</p>
                      <p className="text-xl sm:text-2xl font-bold text-powerbi-gray-900 dark:text-white">{projects.length}</p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-powerbi-primary" />
                  </div>
                </div>

                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 text-sm">Active Projects</p>
                      <p className="text-xl sm:text-2xl font-bold text-powerbi-gray-900 dark:text-white">
                        {projects.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 text-sm">Total Budget</p>
                      <p className="text-xl sm:text-2xl font-bold text-powerbi-gray-900 dark:text-white">
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
                    <div key={project.id} className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-xl transition-shadow duration-200">
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
                          <button
                            onClick={() => {
                              setProjectToDelete(project);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-powerbi-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
                    <div key={project.id} className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <div className="text-right">
                          <p className="text-xl sm:text-2xl font-bold text-powerbi-gray-900 dark:text-white">
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

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
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
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">
                    Add Purchase
                  </h3>
                  <form onSubmit={handlePurchaseSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                          Project
                        </label>
                        <select
                          value={purchaseForm.project_id}
                          onChange={(e) => setPurchaseForm({ ...purchaseForm, project_id: e.target.value })}
                          required
                          disabled={isAddingPurchase}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                          disabled={isAddingPurchase}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                          disabled={isAddingPurchase}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                          disabled={isAddingPurchase}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                        disabled={isAddingPurchase}
                        className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
                        placeholder="e.g., Adobe, AWS, etc."
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingPurchase}
                      className="bg-powerbi-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                      {isAddingPurchase && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      Add Purchase
                    </button>
                  </form>
                </div>

                {/* Purchases List */}
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                    <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                      Purchase History
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {purchases.map((purchase) => (
                        <div key={purchase.id} className="flex items-center justify-between p-3 sm:p-4 bg-powerbi-gray-50 dark:bg-powerbi-gray-700/50 rounded-lg">
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
                              {new Intl.DateTimeFormat(undefined, { timeZone: getTimeZoneForCountry(userCountry) }).format(new Date(purchase.date))}
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
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">
                    {t('pages.manageProjectDetails.income.add')}
                  </h3>
                  <form onSubmit={handleIncomeSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                          Project
                        </label>
                        <select
                          value={incomeForm.project_id}
                          onChange={(e) => setIncomeForm({ ...incomeForm, project_id: e.target.value })}
                          required
                          disabled={isAddingIncome}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                          disabled={isAddingIncome}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                          disabled={isAddingIncome}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                          disabled={isAddingIncome}
                          className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                      disabled={isAddingIncome}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl transition-colors flex items-center gap-2"
                    >
                      {isAddingIncome && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                      {t('pages.manageProjectDetails.income.add')}
                    </button>
                  </form>
                </div>

                {/* Income List */}
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700">
                  <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                    <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white">
                      {t('pages.manageProjectDetails.income.list')}
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="space-y-4">
                      {income.map((incomeItem) => (
                        <div key={incomeItem.id} className="flex items-center justify-between p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
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
                              {new Intl.DateTimeFormat(undefined, { timeZone: getTimeZoneForCountry(userCountry) }).format(new Date(incomeItem.date))}
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowProjectForm(false)}>
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8 mx-4 sm:mx-6 border border-powerbi-gray-200 dark:border-powerbi-gray-700 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="p-4 sm:p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">
                  {editingProject ? t('pages.manageProjects.form.editTitle') : t('pages.manageProjects.form.createTitle')}
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
                  className="px-3 py-1.5 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleProjectSubmit} className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      required
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                      required
                      rows={3}
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                      disabled={isCreatingProject}
                      className="w-full px-4 py-3 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white disabled:opacity-50"
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
                    className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="bg-powerbi-primary hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                  >
                    {isCreatingProject && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">
              Delete Project
            </h3>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-6">
              Are you sure you want to delete "{projectToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-powerbi-gray-200 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white hover:bg-powerbi-gray-300 dark:hover:bg-powerbi-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProject(projectToDelete.id)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}