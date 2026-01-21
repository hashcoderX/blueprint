'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { Search } from 'lucide-react';

interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  date: string;
  mood?: string;
  one_sentence?: string;
}

export default function DiaryList() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('http://localhost:3001/api/diary', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a: DiaryEntry, b: DiaryEntry) => (a.date < b.date ? 1 : -1));
          setEntries(sorted);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter((e) =>
    [e.title, e.content, e.one_sentence].join(' ').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Diary</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search thoughts..."
                className="pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading entries...</div>
        ) : (
          <div className="relative">
            {filtered.map((e, index) => (
              <div
                key={e.id}
                className="relative mb-4 p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                style={{
                  backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                  transform: `translateY(${index * 2}px) rotate(${Math.random() * 2 - 1}deg)`,
                  zIndex: filtered.length - index,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-white text-lg">
                    {new Date(e.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  {e.mood && (
                    <span className="text-xs px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 font-medium">
                      {e.mood}
                    </span>
                  )}
                </div>
                {e.one_sentence && (
                  <div className="text-base mt-2 text-gray-700 dark:text-gray-300 italic">
                    "{e.one_sentence}"
                  </div>
                )}
                <div className="text-sm mt-4 text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-6">
                  {e.content}
                </div>
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 opacity-50">
                  Page {filtered.length - index}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-gray-500 text-center py-20">No entries found. Start writing in your diary.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
