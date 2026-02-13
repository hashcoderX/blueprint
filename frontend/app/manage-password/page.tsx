'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';

interface PasswordEntry {
  id: number;
  platform: string;
  email: string | null;
  username: string | null;
  password: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface APIKeyEntry {
  id: number;
  name: string;
  api_key: string;
  api_secret?: string;
  project_name: string;
  provider: string;
  environment: 'development' | 'staging' | 'production';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

type ActiveTab = 'passwords' | 'api-keys';

export default function ManagePassword() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<ActiveTab>('passwords');
  
  // Password states
  const [platform, setPlatform] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    platform: '',
    email: '',
    username: '',
    password: '',
    notes: ''
  });

  // API Key states
  const [apiName, setApiName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [projectName, setProjectName] = useState('');
  const [provider, setProvider] = useState('');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production'>('development');
  const [apiNotes, setApiNotes] = useState('');
  const [savingApi, setSavingApi] = useState(false);
  const [apiEntries, setApiEntries] = useState<APIKeyEntry[]>([]);
  const [showAddApiForm, setShowAddApiForm] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});
  const [showApiSecret, setShowApiSecret] = useState<Record<number, boolean>>({});
  const [editingApiId, setEditingApiId] = useState<number | null>(null);
  const [editApiForm, setEditApiForm] = useState({
    name: '',
    api_key: '',
    api_secret: '',
    project_name: '',
    provider: '',
    environment: 'development' as 'development' | 'staging' | 'production',
    notes: ''
  });

  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const canSubmit = platform.trim().length > 0 && password.trim().length > 0;
  const canSubmitApi = apiName.trim().length > 0 && apiKey.trim().length > 0 && projectName.trim().length > 0;

  const loadEntries = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/passwords`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const loadApiEntries = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/api-keys`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApiEntries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading API entries:', error);
    }
  };

  useEffect(() => { 
    void loadEntries(); 
    void loadApiEntries();
  }, []);

  const handleSave = async () => {
    setMessage(null);
    if (!canSubmit) {
      setMessage({ type: 'error', text: 'Platform and password are required.' });
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setMessage({ type: 'error', text: 'You need to be logged in to save.' });
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/passwords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ platform, email, username, password, notes })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password entry saved successfully!' });
        setPlatform('');
        setEmail('');
        setUsername('');
        setPassword('');
        setNotes('');
        setShowAddForm(false);
        await loadEntries();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save' }));
        setMessage({ type: 'error', text: errorData.error || 'Failed to save.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Save password error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: PasswordEntry) => {
    setEditingId(entry.id);
    setEditForm({
      platform: entry.platform,
      email: entry.email || '',
      username: entry.username || '',
      password: entry.password,
      notes: entry.notes || ''
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/passwords/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password entry updated successfully!' });
        setEditingId(null);
        await loadEntries();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update' }));
        setMessage({ type: 'error', text: errorData.error || 'Failed to update.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this password entry?')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/passwords/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password entry deleted successfully!' });
        await loadEntries();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to delete entry.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveApi = async () => {
    setMessage(null);
    if (!canSubmitApi) {
      setMessage({ type: 'error', text: 'Name, API Key, and Project Name are required.' });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'You need to be logged in to save.' });
      return;
    }
    try {
      setSavingApi(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: apiName, api_key: apiKey, api_secret: apiSecret, project_name: projectName, provider, environment, notes: apiNotes })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'API Key saved successfully!' });
        setApiName('');
        setApiKey('');
        setApiSecret('');
        setProjectName('');
        setProvider('');
        setEnvironment('development');
        setApiNotes('');
        setShowAddApiForm(false);
        await loadApiEntries();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to save' }));
        setMessage({ type: 'error', text: errorData.error || 'Failed to save.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Save API key error:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setSavingApi(false);
    }
  };

  const handleEditApi = (entry: APIKeyEntry) => {
    setEditingApiId(entry.id);
    setEditApiForm({
      name: entry.name,
      api_key: entry.api_key,
      api_secret: entry.api_secret || '',
      project_name: entry.project_name,
      provider: entry.provider,
      environment: entry.environment,
      notes: entry.notes || ''
    });
  };

  const handleUpdateApi = async () => {
    if (!editingApiId) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/api-keys/${editingApiId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editApiForm)
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'API Key updated successfully!' });
        setEditingApiId(null);
        await loadApiEntries();
        setTimeout(() => setMessage(null), 3000);
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to update' }));
        setMessage({ type: 'error', text: errorData.error || 'Failed to update.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteApi = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/api/api-keys/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'API Key deleted successfully!' });
        await loadApiEntries();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to delete API key.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleApiKeyVisibility = (id: number) => {
    setShowApiKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleApiSecretVisibility = (id: number) => {
    setShowApiSecret(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const passwordStats = {
    total: entries.length,
    withEmail: entries.filter(e => e.email).length,
    withUsername: entries.filter(e => e.username).length,
  };

  const apiStats = {
    total: apiEntries.length,
    development: apiEntries.filter(e => e.environment === 'development').length,
    staging: apiEntries.filter(e => e.environment === 'staging').length,
    production: apiEntries.filter(e => e.environment === 'production').length,
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'development': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'staging': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'production': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 mt-16">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/20">🔐</span>
              {t('pages.managePassword.title')}
            </h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Securely store passwords and API keys for personal and development use
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => activeTab === 'passwords' ? setShowAddForm(true) : setShowAddApiForm(true)}
              className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors shrink-0 w-full sm:w-auto"
            >
              <span className="w-5 h-5">+</span>
              {t('buttons.add')} {activeTab === 'passwords' ? 'Password' : 'API Key'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
          <div className="border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
            <nav className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('passwords')}
                className={`px-3 py-3 sm:px-6 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'passwords'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-powerbi-gray-500 hover:text-powerbi-gray-700 dark:text-powerbi-gray-400 dark:hover:text-powerbi-gray-200'
                }`}
              >
                {t('pages.managePassword.title')} ({passwordStats.total})
              </button>
              <button
                onClick={() => setActiveTab('api-keys')}
                className={`px-3 py-3 sm:px-6 sm:py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'api-keys'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                    : 'border-transparent text-powerbi-gray-500 hover:text-powerbi-gray-700 dark:text-powerbi-gray-400 dark:hover:text-powerbi-gray-200'
                }`}
              >
                API Keys & Secrets ({apiStats.total})
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'passwords' ? (
              <>
                {/* Password Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-amber-100 text-sm font-medium">Total Passwords</p>
                        <p className="text-2xl sm:text-3xl font-bold">{passwordStats.total}</p>
                      </div>
                      <span className="text-amber-200">🔐</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">With Email</p>
                        <p className="text-2xl sm:text-3xl font-bold">{passwordStats.withEmail}</p>
                      </div>
                      <span className="text-blue-200">📧</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">With Username</p>
                        <p className="text-2xl sm:text-3xl font-bold">{passwordStats.withUsername}</p>
                      </div>
                      <span className="text-green-200">👤</span>
                    </div>
                  </div>
                </div>

                {/* Password Table */}
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                    <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white flex items-center">
                      Password Vault
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    {entries.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="text-6xl mb-4">🔐</div>
                        <h3 className="text-lg font-medium text-powerbi-gray-900 dark:text-white mb-2">No password entries yet</h3>
                        <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-4">Start by adding your first password entry to keep your credentials secure.</p>
                        <button
                          onClick={() => setShowAddForm(true)}
                          className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors"
                        >
                          <span className="w-5 h-5">+</span>
                          Add Your First Password
                        </button>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                          <tr>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Platform</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Email</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Username</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Password</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Notes</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
                          {entries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700">
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-powerbi-gray-900 dark:text-white">
                                {editingId === entry.id ? (
                                  <input
                                    type="text"
                                    value={editForm.platform}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, platform: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  />
                                ) : (
                                  entry.platform
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                                {editingId === entry.id ? (
                                  <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  />
                                ) : (
                                  entry.email || '-'
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                                {editingId === entry.id ? (
                                  <input
                                    type="text"
                                    value={editForm.username}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  />
                                ) : (
                                  entry.username || '-'
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                                {editingId === entry.id ? (
                                  <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span>{showPassword[entry.id] ? entry.password : '••••••••'}</span>
                                    <button
                                      onClick={() => togglePasswordVisibility(entry.id)}
                                      className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                                    >
                                      {showPassword[entry.id] ? '🙈' : '👁️'}
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 max-w-xs truncate">
                                {editingId === entry.id ? (
                                  <textarea
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                    rows={2}
                                  />
                                ) : (
                                  entry.notes || '-'
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-right">
                                <div className="flex gap-2 justify-end">
                                  {editingId === entry.id ? (
                                    <>
                                      <button
                                        onClick={handleUpdate}
                                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingId(null)}
                                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEdit(entry)}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* API Keys Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">Total API Keys</p>
                        <p className="text-2xl sm:text-3xl font-bold">{apiStats.total}</p>
                      </div>
                      <span className="text-purple-200">🔑</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-medium">Development</p>
                        <p className="text-2xl sm:text-3xl font-bold">{apiStats.development}</p>
                      </div>
                      <span className="text-blue-200">🛠️</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-medium">Staging</p>
                        <p className="text-2xl sm:text-3xl font-bold">{apiStats.staging}</p>
                      </div>
                      <span className="text-yellow-200">🧪</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-400 to-red-600 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm font-medium">Production</p>
                        <p className="text-2xl sm:text-3xl font-bold">{apiStats.production}</p>
                      </div>
                      <span className="text-red-200">🚀</span>
                    </div>
                  </div>
                </div>

                {/* API Keys Table */}
                <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
                  <div className="px-6 py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                    <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white flex items-center">
                      API Keys Vault
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    {apiEntries.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="text-6xl mb-4">🔑</div>
                        <h3 className="text-lg font-medium text-powerbi-gray-900 dark:text-white mb-2">No API keys yet</h3>
                        <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-4">Store your development API keys, secrets, and tokens securely.</p>
                        <button
                          onClick={() => setShowAddApiForm(true)}
                          className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors"
                        >
                          <span className="w-5 h-5">+</span>
                          Add Your First API Key
                        </button>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                          <tr>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Name</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Project</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Provider</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Environment</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">API Key</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Secret</th>
                            <th className="px-3 py-2 sm:px-6 sm:py-3 text-right text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
                          {apiEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700">
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-powerbi-gray-900 dark:text-white">
                                {editingApiId === entry.id ? (
                                  <input
                                    type="text"
                                    value={editApiForm.name}
                                    onChange={(e) => setEditApiForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  />
                                ) : (
                                  entry.name
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                                {editingApiId === entry.id ? (
                                  <input
                                    type="text"
                                    value={editApiForm.project_name}
                                    onChange={(e) => setEditApiForm(prev => ({ ...prev, project_name: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  />
                                ) : (
                                  entry.project_name
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                                {editingApiId === entry.id ? (
                                  <input
                                    type="text"
                                    value={editApiForm.provider}
                                    onChange={(e) => setEditApiForm(prev => ({ ...prev, provider: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  />
                                ) : (
                                  entry.provider
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm">
                                {editingApiId === entry.id ? (
                                  <select
                                    value={editApiForm.environment}
                                    onChange={(e) => setEditApiForm(prev => ({ ...prev, environment: e.target.value as 'development' | 'staging' | 'production' }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900"
                                  >
                                    <option value="development">Development</option>
                                    <option value="staging">Staging</option>
                                    <option value="production">Production</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-1 rounded-full text-xs ${getEnvironmentColor(entry.environment)}`}>
                                    {entry.environment}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 font-mono">
                                {editingApiId === entry.id ? (
                                  <input
                                    type="password"
                                    value={editApiForm.api_key}
                                    onChange={(e) => setEditApiForm(prev => ({ ...prev, api_key: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 font-mono"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span>{showApiKey[entry.id] ? entry.api_key : '••••••••••••••••'}</span>
                                    <button
                                      onClick={() => toggleApiKeyVisibility(entry.id)}
                                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                    >
                                      {showApiKey[entry.id] ? '🙈' : '👁️'}
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400 font-mono">
                                {editingApiId === entry.id ? (
                                  <input
                                    type="password"
                                    value={editApiForm.api_secret}
                                    onChange={(e) => setEditApiForm(prev => ({ ...prev, api_secret: e.target.value }))}
                                    className="w-full p-2 rounded border border-powerbi-gray-200 dark:border-powerbi-gray-700 bg-white dark:bg-powerbi-gray-900 font-mono"
                                  />
                                ) : (
                                  entry.api_secret ? (
                                    <div className="flex items-center gap-2">
                                      <span>{showApiSecret[entry.id] ? entry.api_secret : '••••••••••••••••'}</span>
                                      <button
                                        onClick={() => toggleApiSecretVisibility(entry.id)}
                                        className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                      >
                                        {showApiSecret[entry.id] ? '🙈' : '👁️'}
                                      </button>
                                    </div>
                                  ) : (
                                    '-'
                                  )
                                )}
                              </td>
                              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-right">
                                <div className="flex gap-2 justify-end">
                                  {editingApiId === entry.id ? (
                                    <>
                                      <button
                                        onClick={handleUpdateApi}
                                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => setEditingApiId(null)}
                                        className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                                      >
                                        Cancel
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleEditApi(entry)}
                                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteApi(entry.id)}
                                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 sm:mx-6 max-h-[85vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add New Password Entry</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-powerbi-gray-400 hover:text-powerbi-gray-600 dark:hover:text-powerbi-gray-200"
                  >
                    ✕
                  </button>
                </div>

                {message && (
                  <div className={`px-4 py-2 rounded-lg text-sm mb-4 ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Platform *</label>
                    <input
                      type="text"
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value)}
                      disabled={saving}
                      className="w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                      placeholder="e.g. Facebook, Gmail, GitHub"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={saving}
                      className="w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                      placeholder="e.g. user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={saving}
                      className="w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                      placeholder="e.g. sudharma1993"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={saving}
                      className="w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                      placeholder="Enter password for platform"
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={saving}
                    className="w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50"
                    placeholder="Optional notes or additional information"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !canSubmit}
                    className={`px-4 py-2 rounded-xl shadow flex items-center gap-2 ${
                      saving || !canSubmit
                        ? 'opacity-70 cursor-not-allowed bg-powerbi-gray-400'
                        : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    {saving ? 'Saving…' : 'Save Entry'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add API Key Form Modal */}
        {showAddApiForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-xl max-w-2xl w-full mx-4 sm:mx-6 max-h-[85vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Add New API Key</h2>
                  <button
                    onClick={() => setShowAddApiForm(false)}
                    className="text-powerbi-gray-400 hover:text-powerbi-gray-600 dark:hover:text-powerbi-gray-200"
                  >
                    ✕
                  </button>
                </div>

                {message && (
                  <div className={`px-4 py-2 rounded-lg text-sm mb-4 ${
                    message.type === 'success'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  }`}>
                    {message.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">API Key Name *</label>
                    <input
                      type="text"
                      value={apiName}
                      onChange={(e) => setApiName(e.target.value)}
                      disabled={savingApi}
                      className={`w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        savingApi ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="e.g. Stripe API Key, AWS Access Key"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Project Name *</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      disabled={savingApi}
                      className={`w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        savingApi ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="e.g. E-commerce App, Blog Platform"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Provider</label>
                    <input
                      type="text"
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      disabled={savingApi}
                      className={`w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        savingApi ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="e.g. AWS, Stripe, Google, GitHub"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Environment</label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value as 'development' | 'staging' | 'production')}
                      disabled={savingApi}
                      className={`w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                        savingApi ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="development">Development</option>
                      <option value="staging">Staging</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">API Key *</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={savingApi}
                      className={`w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono ${
                        savingApi ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter your API key"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">API Secret (Optional)</label>
                    <input
                      type="password"
                      value={apiSecret}
                      onChange={(e) => setApiSecret(e.target.value)}
                      disabled={savingApi}
                      className={`w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono ${
                        savingApi ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Enter your API secret or leave empty"
                    />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Notes</label>
                  <textarea
                    value={apiNotes}
                    onChange={(e) => setApiNotes(e.target.value)}
                    disabled={savingApi}
                    className={`w-full p-3 rounded-lg bg-white dark:bg-powerbi-gray-900 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      savingApi ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="Optional notes about this API key"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAddApiForm(false)}
                    className="px-4 py-2 rounded-xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveApi}
                    disabled={savingApi || !canSubmitApi}
                    className={`px-4 py-2 rounded-xl shadow ${
                      savingApi || !canSubmitApi
                        ? 'opacity-70 cursor-not-allowed bg-powerbi-gray-400'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {savingApi ? (
                      <>
                        <div className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving…
                      </>
                    ) : (
                      'Save API Key'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {message && (
          <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}