'use client';

import { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Cloud, CloudRain, Zap, Heart } from 'lucide-react';

interface DiaryEntry {
  id: number;
  title: string;
  content: string;
  date: string;
  mood?: string;
  one_sentence?: string;
}

export default function Diary() {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [content, setContent] = useState('');
  const [oneSentence, setOneSentence] = useState('');
  const [mood, setMood] = useState('');
  const [isNightMode, setIsNightMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch('http://localhost:3001/api/diary', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const todayEntry = data.find((e: DiaryEntry) => e.date === today);
        if (todayEntry) {
          setEntry(todayEntry);
          setContent(todayEntry.content);
          setMood(todayEntry.mood || '');
          setOneSentence(todayEntry.one_sentence || '');
        } else {
          setEntry({ id: 0, title: 'Today', content: '', date: today });
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching diary:', err);
        setIsLoading(false);
      });
  }, [today]);

  const saveEntry = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !entry) return;

    try {
      const method = entry.id > 0 ? 'PUT' : 'POST';
      const url = entry.id > 0 ? `http://localhost:3001/api/diary/${entry.id}` : 'http://localhost:3001/api/diary';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: entry.title,
          content,
          date: today,
          mood,
          one_sentence: oneSentence
        })
      });

      if (response.ok) {
        const savedEntry = await response.json();
        setEntry(savedEntry);
      }
    } catch (err) {
      console.error('Error saving:', err);
    }
  }, [entry, content, mood, oneSentence, today]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (entry) {
        void saveEntry();
      }
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timer);
  }, [content, oneSentence, saveEntry, entry]);

  const moodOptions = [
    { value: 'cloud', icon: Cloud, label: 'Cloudy' },
    { value: 'rain', icon: CloudRain, label: 'Rainy' },
    { value: 'sun', icon: Sun, label: 'Sunny' },
    { value: 'storm', icon: Zap, label: 'Stormy' },
    { value: 'love', icon: Heart, label: 'Loving' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading your diary...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isNightMode
        ? 'bg-amber-900 text-amber-100'
        : 'bg-amber-50 text-gray-800'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="text-2xl font-light" style={{ fontFamily: 'var(--font-kalam)' }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className={`p-2 rounded-full ${
            isNightMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-200 text-amber-800'
          }`}
        >
          {isNightMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
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
      </div>

      {/* Footer */}
      <div className="px-6 py-4 text-sm opacity-60" style={{ fontFamily: 'var(--font-kalam)' }}>
        Your thoughts are safe here.
      </div>
    </div>
  );
}