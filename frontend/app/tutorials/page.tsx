"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import { BookOpen, Plus, Trash2, Edit, Link as LinkIcon, Search, Tag } from 'lucide-react';

interface TutorialItem {
  id: number;
  author_id: number;
  title: string;
  content: string;
  category: string;
  video_url?: string | null;
  tags?: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export default function TutorialsPage() {
  const { t } = useI18n();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
  const [items, setItems] = useState<TutorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', video_url: '', tags: '', published: true });
  const [filters, setFilters] = useState({ search: '', category: 'all', status: 'all' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data && data.role) setRole(data.role);
    } catch {}
  };

  const loadItems = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/tutorials`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);
  useEffect(() => { loadItems(); }, [role]);

  const createItem = async () => {
    if (!token) return;
    if (!form.title.trim() || !form.content.trim()) {
      setFormError('Title and content are required');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/tutorials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          category: form.category.trim() || 'General',
          video_url: form.video_url.trim() || undefined,
          tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
          published: form.published
        })
      });
      const body = await res.json();
      if (!res.ok || body.error) {
        throw new Error(body.error || 'Failed to create tutorial');
      }
      setItems(prev => [body, ...prev]);
      setShowForm(false);
      setFormError(null);
      setForm({ title: '', content: '', category: 'General', video_url: '', tags: '', published: true });
    } catch (e: any) {
      setFormError(e.message || 'Failed to create tutorial');
    }
  };

  const deleteItem = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/tutorials/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok || body.error) {
        throw new Error(body.error || 'Failed to delete tutorial');
      }
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const categories = Array.from(new Set(items.map(i => i.category))).filter(Boolean);

  const filteredItems = items.filter((it) => {
    const matchesSearch = filters.search.trim()
      ? (it.title.toLowerCase().includes(filters.search.toLowerCase()) || it.content.toLowerCase().includes(filters.search.toLowerCase()))
      : true;
    const matchesCategory = filters.category === 'all' ? true : it.category === filters.category;
    const matchesStatus = filters.status === 'all' ? true : (filters.status === 'published' ? it.published : !it.published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="mt-16 p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-powerbi-gray-900 dark:text-white flex items-center">
              <span className="inline-flex items-center justify-center w-8 h-8 mr-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20">📘</span>
              {t('pages.tutorials.title')}
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Guides and how-tos to help you use the app
            </p>
          </div>
          {role === 'super_admin' && (
            <button onClick={() => { setShowForm(true); setFormError(null); }} className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors">
              <Plus className="w-5 h-5" /> Add Tutorial
            </button>
          )}
        </div>

        {showForm && role === 'super_admin' && (
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-6">
            {formError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200">{formError}</div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Category</label>
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Content *</label>
                <textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Video URL</label>
                <input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Tags (comma separated)</label>
                <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white" />
              </div>
              <div className="flex items-center gap-2">
                <input id="published" type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
                <label htmlFor="published" className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300">Published</label>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={createItem} className="bg-powerbi-primary text-white px-4 py-2 rounded-xl hover:brightness-110">Save Tutorial</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border border-powerbi-gray-300 dark:border-powerbi-gray-600">Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Search className="w-5 h-5 text-powerbi-gray-500" />
              <input
                type="text"
                placeholder="Search tutorials..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full sm:w-64 px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
              />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full sm:w-auto px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full sm:w-auto px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        {/* Tutorials Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading && (
            <div className="col-span-full text-powerbi-gray-600 dark:text-powerbi-gray-400">Loading…</div>
          )}
          {!loading && filteredItems.length === 0 && (
            <div className="col-span-full text-powerbi-gray-600 dark:text-powerbi-gray-400">No tutorials found.</div>
          )}
          {filteredItems.map((it) => (
            <div key={it.id} className="bg-white dark:bg-powerbi-gray-800 p-4 sm:p-5 md:p-6 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-1 truncate">{it.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{it.category}</span>
                    {!it.published && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Draft</span>
                    )}
                  </div>
                  <div className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400">{new Date(it.created_at).toLocaleString()}</div>
                </div>
                {role === 'super_admin' && (
                  <div className="flex gap-2">
                    <button onClick={() => deleteItem(it.id)} className="p-2 text-powerbi-gray-500 hover:text-red-600 dark:hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <div className="mt-3 text-powerbi-gray-700 dark:text-powerbi-gray-300 whitespace-pre-wrap line-clamp-6">{it.content}</div>
              {it.video_url && (
                <a href={it.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:underline"><LinkIcon className="w-4 h-4" /> Video</a>
              )}
              {it.tags && it.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {it.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300"><Tag className="w-3 h-3" />{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
