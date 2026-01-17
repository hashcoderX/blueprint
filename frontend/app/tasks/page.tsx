'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useState, useEffect } from 'react';

interface Task {
  id: number;
  title: string;
  status: 'todo' | 'inProgress' | 'done';
  priority: 'low' | 'medium' | 'high';
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:3001/api/tasks', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Error:', data.error);
        } else {
          setTasks(data);
        }
      })
      .catch(err => console.error('Error fetching tasks:', err));
  }, []);

  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    inProgress: tasks.filter(t => t.status === 'inProgress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tasks</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(tasksByStatus).map(([column, columnTasks]) => (
          <div key={column} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
              {column.replace(/([A-Z])/g, ' $1')}
            </h3>
            <div className="space-y-3">
              {columnTasks.map((task) => (
                <div key={task.id} className="bg-white dark:bg-gray-800 p-3 rounded shadow-sm">
                  <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                  <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${priorityColors[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}