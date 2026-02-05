'use client';

import DashboardLayout from '../../../components/DashboardLayout';
import { useI18n } from '../../../i18n/I18nProvider';
import { useEffect, useState } from 'react';
import { MessageSquare, Send, Users, FileText } from 'lucide-react';

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

type ViewMode = 'chat' | 'tickets';

interface TicketItem {
  id: number;
  user_id: number;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  created_at: string;
  closed_at?: string;
  user?: { id: number; username?: string; fullname?: string } | null;
}

export default function SupportDeskPage() {
  const { t } = useI18n();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

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

  const loadTickets = async () => {
    if (!token) return;
    try {
      setTicketsLoading(true);
      const res = await fetch(`${API_BASE}/api/support/tickets/all`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort newest first
        data.sort((a: TicketItem, b: TicketItem) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setTickets(data);
      }
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'tickets' && tickets.length === 0) {
      loadTickets();
    }
  }, [viewMode]);

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-powerbi-gray-900 dark:text-white">Support Desk</h1>
          </div>
          <div className="inline-flex rounded-xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('chat')}
              className={`px-4 py-2 text-sm flex items-center gap-2 ${viewMode === 'chat' ? 'bg-powerbi-primary text-white' : 'bg-white dark:bg-powerbi-gray-800 text-powerbi-gray-900 dark:text-white'}`}
            >
              <MessageSquare className="w-4 h-4" /> Chats
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tickets')}
              className={`px-4 py-2 text-sm flex items-center gap-2 ${viewMode === 'tickets' ? 'bg-powerbi-primary text-white' : 'bg-white dark:bg-powerbi-gray-800 text-powerbi-gray-900 dark:text-white'}`}
            >
              <FileText className="w-4 h-4" /> Tickets
            </button>
          </div>
        </div>

        {viewMode === 'chat' ? (
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
                      <span className="text-sm font-medium text-powerbi-gray-900 dark:text-white">User #{th.user_id}{(th as any).user && (th as any).user.username ? ` - ${(th as any).user.username}` : ''}</span>
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
        ) : (
          <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-powerbi-gray-600 dark:text-powerbi-gray-400 mr-2" />
              <h3 className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">Support Tickets</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-powerbi-gray-600 dark:text-powerbi-gray-400">
                    <th className="px-3 py-2 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">Ticket</th>
                    <th className="px-3 py-2 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">User</th>
                    <th className="px-3 py-2 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">Status</th>
                    <th className="px-3 py-2 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsLoading ? (
                    <tr><td className="px-3 py-4" colSpan={4}>Loading tickets…</td></tr>
                  ) : tickets.length === 0 ? (
                    <tr><td className="px-3 py-4" colSpan={4}>No tickets found.</td></tr>
                  ) : (
                    tickets.map((tk) => (
                      <tr key={tk.id} className="border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                        <td className="px-3 py-2">
                          <div className="font-medium text-powerbi-gray-900 dark:text-white">[{tk.id}] {tk.subject}</div>
                          <div className="text-powerbi-gray-600 dark:text-powerbi-gray-400">{tk.message}</div>
                        </td>
                        <td className="px-3 py-2">User #{tk.user_id}{tk.user && tk.user.username ? ` - ${tk.user.username}` : ''}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${tk.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-powerbi-gray-100 text-powerbi-gray-700 dark:bg-powerbi-gray-700 dark:text-powerbi-gray-300'}`}>{tk.status}</span>
                        </td>
                        <td className="px-3 py-2">{new Date(tk.created_at).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <button type="button" onClick={loadTickets} className="inline-flex items-center gap-2 bg-powerbi-primary text-white px-4 py-2 rounded-xl hover:brightness-110 disabled:opacity-50">
                Refresh Tickets
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
