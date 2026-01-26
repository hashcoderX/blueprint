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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }
    fetch('http://localhost:3001/api/diary', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data
            .filter(e => e.date) // Filter out entries without dates
            .sort((a: DiaryEntry, b: DiaryEntry) => (a.date! < b.date! ? 1 : -1));
          setEntries(sorted);
        }
      })
      .finally(() => setLoading(false));
  }, []);

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white">My Diary</h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              Flip through your memories, one page at a time. Use arrow keys to navigate.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search entries..."
                className="pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Diary Book */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-2xl">
            {(!localStorage.getItem('token')) ? (
              <div className="text-gray-500 text-center py-20">Log in to view your diary.</div>
            ) : loading ? (
              <div className="text-gray-500 text-center py-20">Loading your diary...</div>
            ) : filtered.length === 0 ? (
              <div className="text-gray-500 text-center py-20">No entries found. Start writing in your diary.</div>
            ) : (
              <>
                {/* Page Content */}
                <div
                  className={`bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 min-h-[500px] transition-all duration-300 ${
                    isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
                  }`}
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
                    backgroundSize: '20px 20px',
                  }}
                >
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

                  <div className="text-base text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'var(--font-kalam)', fontSize: '18px', lineHeight: '1.6' }}>
                    {currentEntry.content}
                  </div>

                  <div className="absolute bottom-4 right-4 text-xs text-gray-400 opacity-50">
                    Page {currentPage + 1} of {filtered.length}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => handlePageTurn('prev')}
                    disabled={currentPage === 0 || isAnimating}
                    className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                  >
                    <ChevronLeft size={20} className="mr-2" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageTurn('next')}
                    disabled={currentPage === filtered.length - 1 || isAnimating}
                    className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
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
