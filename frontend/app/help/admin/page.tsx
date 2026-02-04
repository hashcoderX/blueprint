'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useI18n } from '../../../i18n/I18nProvider';
import { useEffect, useState } from 'react';
import { MessageSquare, Send, Users } from 'lucide-react';

interface ChatMessage {
  id: number;
  user_id: number;
  type: 'user' | 'admin';
  message: string;
  created_at: string;
}

interface ChatThread {
  user_id: number;
  messages: ChatMessage[];
}

export default function SupportDeskPage() {
  const { t } = useI18n();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadThreads = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/support/chat/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort messages by time ascending for each thread
        data.forEach((th: ChatThread) => th.messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        setThreads(data);
        if (data.length > 0 && selectedUserId === null) setSelectedUserId(data[0].user_id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadThreads(); }, []);

  const sendReply = async () => {
    if (!token || !selectedUserId || !replyText.trim()) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/support/chat/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ user_id: selectedUserId, message: replyText })
      });
      if (res.ok) {
        const msg = await res.json();
        setThreads((prev) => prev.map(th => th.user_id === selectedUserId ? { ...th, messages: [...th.messages, msg] } : th));
        setReplyText('');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentThread = threads.find(t => t.user_id === selectedUserId);

  return (
    <DashboardLayout>
      <div className="mt-16 p-6">
        <div className="flex items-center mb-6">
          <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">Support Desk</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Threads list */}
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4">
            <div className="flex items-center mb-3">
              <Users className="w-5 h-5 text-powerbi-gray-600 dark:text-powerbi-gray-400 mr-2" />
              <h3 className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">User Threads</h3>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {threads.length === 0 && (
                <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">No chat threads yet.</p>
              )}
              {threads.map((th) => (
                <button key={th.user_id} onClick={() => setSelectedUserId(th.user_id)} className={`w-full text-left px-3 py-2 rounded-lg border ${selectedUserId === th.user_id ? 'border-powerbi-primary bg-powerbi-blue-50 dark:bg-powerbi-blue-900/20' : 'border-powerbi-gray-200 dark:border-powerbi-gray-700'} hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-powerbi-gray-900 dark:text-white">User #{th.user_id}{th.user && th.user.username ? ` - ${th.user.username}` : ''}</span>
                    <span className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">{th.messages.length} messages</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Conversation */}
          <div className="lg:col-span-2 bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4">
            {currentThread ? (
              <>
                <div className="flex items-center mb-3">
                  <MessageSquare className="w-5 h-5 text-powerbi-gray-600 dark:text-powerbi-gray-400 mr-2" />
                  <h3 className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">Conversation with User #{currentThread.user_id}{(currentThread as any).user && (currentThread as any).user.username ? ` - ${(currentThread as any).user.username}` : ''}</h3>
                </div>
                <div className="border border-powerbi-gray-200 dark:border-powerbi-gray-700 rounded-xl p-4 max-h-[55vh] overflow-y-auto space-y-3">
                  {currentThread.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-2 rounded-lg text-sm ${m.type === 'admin' ? 'bg-blue-600 text-white' : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white'}`}>
                        <p>{m.message}</p>
                        <span className="block mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type a reply"
                    className="flex-1 px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                  />
                  <button onClick={sendReply} disabled={loading || !replyText.trim()} className="inline-flex items-center gap-2 bg-powerbi-primary text-white px-4 py-2 rounded-xl hover:brightness-110 disabled:opacity-50">
                    <Send className="w-4 h-4" /> Send
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Select a user thread to view conversation.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
