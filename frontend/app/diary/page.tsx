'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
}

export default function Diary() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:3001/api/diary', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Error:', data.error);
        } else {
          setNotes(data);
        }
      })
      .catch(err => console.error('Error fetching notes:', err));
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diary / Notes</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          New Note
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <div key={note.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{note.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{note.content}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{note.date}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}