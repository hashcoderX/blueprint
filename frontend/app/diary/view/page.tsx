'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../../../components/DashboardLayout';
import { Search, ChevronLeft, ChevronRight, Cloud, CloudRain, Sun, Zap, Heart } from 'lucide-react';

interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  date?: string;
  mood?: string;
  one_sentence?: string;
}

const moodOptions = [
  { value: 'cloud', icon: Cloud, label: 'Cloudy' },
  { value: 'rain', icon: CloudRain, label: 'Rainy' },
  { value: 'sun', icon: Sun, label: 'Sunny' },
  { value: 'storm', icon: Zap, label: 'Stormy' },
  { value: 'love', icon: Heart, label: 'Loving' }
];

export default function DiaryList() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  const filtered = entries.filter((e) =>
    [e.title, e.content, e.one_sentence].join(' ').toLowerCase().includes(query.toLowerCase())
  );

  const handlePageTurn = useCallback((direction: 'prev' | 'next') => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      if (direction === 'next' && currentPage < filtered.length - 1) {
        setCurrentPage(currentPage + 1);
      } else if (direction === 'prev' && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
      setIsAnimating(false);
    }, 300);
  }, [isAnimating, currentPage, filtered.length]);

  // Initialize token presence on client to avoid SSR hydration mismatch
  useEffect(() => {
    const t = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;
    setHasToken(t);
  }, []);

  useEffect(() => {
    if (hasToken !== true) {
      // If not logged in or unknown, stop loading state quickly
      if (hasToken === false) setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    fetch('http://localhost:3001/api/diary', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data
            .filter(e => e.date)
            .sort((a: DiaryEntry, b: DiaryEntry) => (a.date! < b.date! ? 1 : -1));
          setEntries(sorted);
        }
      })
      .finally(() => setLoading(false));
  }, [hasToken]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePageTurn('prev');
      } else if (e.key === 'ArrowRight') {
        handlePageTurn('next');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handlePageTurn]);

  const currentEntry = filtered[currentPage];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 mt-16 px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap min-w-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-powerbi-gray-900 dark:text-white">My Diary</h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Flip through your memories, one page at a time. Use arrow keys to navigate.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-powerbi-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-200 dark:border-powerbi-gray-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Diary Book */}
        <div className="flex justify-center px-0 sm:px-2">
          <div className="relative w-full max-w-2xl">
            {hasToken === null ? (
              <div className="text-gray-500 text-center py-20">Loading your diary...</div>
            ) : hasToken === false ? (
              <div className="text-gray-500 text-center py-20">Log in to view your diary.</div>
            ) : loading ? (
              <div className="text-gray-500 text-center py-20">Loading your diary...</div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-500 text-center py-20">No entries found. Start writing in your diary.</div>
            ) : (
              <>
                {/* Page Content */}
                <div
                  className={`relative bg-white dark:bg-powerbi-gray-800 p-4 sm:p-8 rounded-2xl shadow-2xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 min-h-[380px] sm:min-h-[500px] transition-all duration-300 ${
                    isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  }`}
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  {/* Decorative ribbon */}
                  <div className="absolute -top-3 left-6 w-28 h-3 rounded-b-xl bg-gradient-to-r from-amber-500 to-amber-300 dark:from-amber-600 dark:to-amber-400 mt-12" />

                  {/* Inner page tint */}
                  <div className="rounded-xl p-4 sm:p-6 bg-amber-50 dark:bg-amber-900/10 overflow-y-auto max-h-[60vh] sm:max-h-[65vh]">
                  <div className="mb-6">
                    <div className="text-2xl font-light text-gray-900 dark:text-white mb-2" style={{ fontFamily: 'var(--font-kalam)' }}>
                      {(() => {
                        const d = currentEntry.date ? new Date(currentEntry.date) : new Date();
                        return d.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        });
                      })()}
                    </div>
                    {currentEntry.mood && (() => {
                      const moodOption = moodOptions.find(m => m.value === currentEntry.mood);
                      const Icon = moodOption?.icon || Cloud;
                      const label = moodOption?.label || currentEntry.mood;
                      return (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 text-sm font-medium">
                          <Icon size={16} />
                          {label}
                        </span>
                      );
                    })()}
                  </div>

                  {currentEntry.one_sentence && (
                    <div className="text-lg text-gray-700 dark:text-gray-300 italic mb-6" style={{ fontFamily: 'var(--font-kalam)' }}>
                      &ldquo;{currentEntry.one_sentence}&rdquo;
                    </div>
                  )}

                  <div className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap break-words" style={{ fontFamily: 'var(--font-kalam)', lineHeight: '1.6' }}>
                    {currentEntry.content}
                  </div>

                  <div className="absolute bottom-4 right-4 text-xs text-gray-400 opacity-50">
                    Page {currentPage + 1} of {filtered.length}
                  </div>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row justify-between mt-6 gap-3 sm:gap-0">
                  <button
                    onClick={() => handlePageTurn('prev')}
                    disabled={currentPage === 0 || isAnimating}
                    className="flex items-center justify-center px-4 py-3 bg-powerbi-primary hover:brightness-110 disabled:opacity-50 text-white rounded-xl transition-colors w-full sm:w-auto"
                  >
                    <ChevronLeft size={20} className="mr-2" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageTurn('next')}
                    disabled={currentPage === filtered.length - 1 || isAnimating}
                    className="flex items-center justify-center px-4 py-3 bg-powerbi-primary hover:brightness-110 disabled:opacity-50 text-white rounded-xl transition-colors w-full sm:w-auto"
                  >
                    Next
                    <ChevronRight size={20} className="ml-2" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
