'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Cloud, CloudRain, Zap, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout';

interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  date?: string;
  mood?: string;
  one_sentence?: string;
}

export default function Diary() {
  const router = useRouter();
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [content, setContent] = useState('');
  const [oneSentence, setOneSentence] = useState('');
  const [mood, setMood] = useState('');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetch('http://localhost:3001/api/diary', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const todayEntry = data.find((e: DiaryEntry) => e.date === today);
        if (todayEntry) {
          // Load today's diary if it exists (even if empty)
          setEntry(todayEntry);
          setContent(todayEntry.content || '');
          setMood(todayEntry.mood || '');
          setOneSentence(todayEntry.one_sentence || '');
        } else if (data.length > 0) {
          // If no entry for today but there are previous entries, load the most recent one
          const mostRecent = data
            .filter((e: DiaryEntry) => !!e.date) // Filter out entries without dates
            .sort((a: DiaryEntry, b: DiaryEntry) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
          if (mostRecent) {
            setEntry(mostRecent);
            setContent(mostRecent.content || '');
            setMood(mostRecent.mood || '');
            setOneSentence(mostRecent.one_sentence || '');
          } else {
            // Start fresh if no valid entries
            setEntry({ id: 0, title: 'Today', content: '', date: today });
            setContent('');
            setMood('');
            setOneSentence('');
          }
        } else {
          // Start fresh if no diary entries at all
          setEntry({ id: 0, title: 'Today', content: '', date: today });
          setContent('');
          setMood('');
          setOneSentence('');
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching diary:', err);
        setIsLoading(false);
      });
  }, [today]);

  const saveEntry = useCallback(async (isManualSave = false) => {
    const token = localStorage.getItem('token');
    if (!token || !entry) return;

    // For auto-save, don't save if content is empty
    // For manual save, allow saving even if empty (to create today's entry)
    if (!isManualSave && !content.trim() && !mood && !oneSentence.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      const method = entry.id > 0 ? 'PUT' : 'POST';
      const url = entry.id > 0 ? `http://localhost:3001/api/diary/${entry.id}` : 'http://localhost:3001/api/diary';

      const requestBody = {
        title: entry.title,
        content,
        date: today,
        mood,
        one_sentence: oneSentence
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const savedEntry = await response.json();
        setEntry(savedEntry);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000); // Hide after 3 seconds
      } else {
        console.error('Save failed:', response.status, await response.text());
        alert('Failed to save diary entry. Please try again.');
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setIsSaving(false);
    }
  }, [entry, content, mood, oneSentence, today]);

  useEffect(() => {
    // Only auto-save if there's actual content
    const hasContent = content.trim() || mood || oneSentence.trim();
    if (!hasContent) return;

    const timer = setTimeout(() => {
      if (entry) {
        void saveEntry();
      }
    }, 2000); // Auto-save after 2 seconds of no changes

    return () => clearTimeout(timer);
  }, [content, oneSentence, mood, saveEntry, entry]);

  const moodOptions = [
    { value: 'cloud', icon: Cloud, label: 'Cloudy' },
    { value: 'rain', icon: CloudRain, label: 'Rainy' },
    { value: 'sun', icon: Sun, label: 'Sunny' },
    { value: 'storm', icon: Zap, label: 'Stormy' },
    { value: 'love', icon: Heart, label: 'Loving' }
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading your diary...</div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header like other pages */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white">Diary</h1>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/diary/view')}
              className="px-4 py-2 rounded-xl shadow bg-gray-600 text-white hover:bg-gray-700"
            >
              View Diary
            </button>
            <button
              onClick={() => setIsNightMode(!isNightMode)}
              className={`p-2 rounded-full ${
                isNightMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-200 text-amber-800'
              }`}
              title="Toggle Night Mode"
            >
              {isNightMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        {/* Diary card */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
          <div className={`transition-all duration-500 ${
            isNightMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-50 text-gray-800'
          }`}>
            {/* Inner header date (handwritten) */}
            <div className="flex justify-between items-center p-6">
              <div className="text-2xl font-light" style={{ fontFamily: 'var(--font-kalam)' }}>
                Today
              </div>
            </div>

            {/* Mood Selector */}
            <div className="px-6 mb-4">
              <div className="flex space-x-4">
                {moodOptions.map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => setMood(value)}
                    className={`p-2 rounded-full transition-all ${
                      mood === value
                        ? (isNightMode ? 'bg-amber-700' : 'bg-amber-200')
                        : 'hover:bg-opacity-50'
                    }`}
                    title={label}
                  >
                    <Icon size={24} />
                  </button>
                ))}
              </div>
            </div>

            {/* One Sentence */}
            <div className="px-6 mb-4">
              <input
                type="text"
                value={oneSentence}
                onChange={(e) => setOneSentence(e.target.value)}
                placeholder="One sentence about today..."
                className={`w-full p-3 rounded-lg border-none outline-none ${
                  isNightMode
                    ? 'bg-amber-800 text-amber-100 placeholder-amber-300'
                    : 'bg-white text-gray-800 placeholder-gray-400'
                }`}
                style={{ fontFamily: 'var(--font-kalam)', caretColor: isNightMode ? '#fbbf24' : '#374151' }}
              />
            </div>

            {/* Writing Area */}
            <div className="px-6 pb-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts here..."
                className={`w-full min-h-[60vh] p-4 rounded-lg resize-none border-none outline-none shadow-inner ${
                  isNightMode
                    ? 'bg-amber-800 text-amber-100 placeholder-amber-300'
                    : 'bg-white text-gray-800 placeholder-gray-400'
                }`}
                style={{
                  fontFamily: 'var(--font-kalam)',
                  fontSize: '18px',
                  lineHeight: '1.6',
                  backgroundImage: isNightMode ? 'none' : 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                  caretColor: isNightMode ? '#fbbf24' : '#374151'
                }}
              />
              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {content.trim() || mood || oneSentence.trim()
                    ? 'Auto-saves every 2 seconds • Continue editing anytime'
                    : 'Start writing to begin auto-saving'
                  }
                </div>
                <button
                  onClick={() => void saveEntry(true)}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-xl shadow ${
                    justSaved
                      ? 'bg-green-600 text-white'
                      : isNightMode ? 'bg-amber-700 text-amber-100 hover:bg-amber-600' : 'bg-amber-600 text-white hover:bg-amber-700'
                  } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? 'Saving…' : justSaved ? 'Saved!' : 'Save'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 text-sm opacity-60" style={{ fontFamily: 'var(--font-kalam)' }}>
              Your thoughts are safe here.
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}