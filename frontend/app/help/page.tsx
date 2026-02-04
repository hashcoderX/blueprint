'use client';

import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import { useEffect, useState } from 'react';
import { Mail, MessageSquare, Send, Ticket, X, CheckCircle } from 'lucide-react';

export default function HelpPage() {
  const { t } = useI18n();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  // Contact form state
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ id: number; type: 'user' | 'admin'; message: string; created_at: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Tickets state
  const [tickets, setTickets] = useState<Array<{ id: number; subject: string; message: string; priority: string; status: string; created_at: string }>>([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low'|'medium'|'high'>('medium');
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketSuccess, setTicketSuccess] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const loadChat = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/support/chat`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setChatMessages(data);
    } catch {}
  };

  const loadTickets = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setTickets(data);
    } catch {}
  };

  useEffect(() => {
    loadChat();
    loadTickets();
  }, []);

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);
    setContactSuccess(null);
    if (!token) { setContactError('Please log in to contact support'); return; }
    try {
      setContactLoading(true);
      const res = await fetch(`${API_BASE}/api/support/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: contactSubject, message: contactMessage })
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to send');
      }
      setContactSuccess('Message sent to administration desk.');
      setContactSubject('');
      setContactMessage('');
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setContactLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!token || !chatInput.trim()) return;
    try {
      setChatLoading(true);
      const res = await fetch(`${API_BASE}/api/support/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: chatInput })
      });
      if (res.ok) {
        const msg = await res.json();
        setChatMessages((prev) => [...prev, msg]);
        setChatInput('');
      }
    } finally {
      setChatLoading(false);
    }
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setTicketError(null);
    setTicketSuccess(null);
    if (!token) { setTicketError('Please log in to create a ticket'); return; }
    try {
      setTicketLoading(true);
      const res = await fetch(`${API_BASE}/api/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject: ticketSubject, message: ticketMessage, priority: ticketPriority })
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || 'Failed to create ticket');
      }
      const data = await res.json();
      setTickets((prev) => [data, ...prev]);
      setTicketSuccess('Ticket created successfully');
      setTicketSubject('');
      setTicketMessage('');
      setTicketPriority('medium');
    } catch (err) {
      setTicketError(err instanceof Error ? err.message : 'Failed to create ticket');
    } finally {
      setTicketLoading(false);
    }
  };

  const closeTicket = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'closed' })
      });
      if (res.ok) {
        const updated = await res.json();
        setTickets((prev) => prev.map(t => t.id === id ? updated : t));
      }
    } catch {}
  };
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white">{t('pages.help.title')}</h1>
          <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1">
            Find answers to common questions and get support
          </p>
        </div>

        {/* Contact Administration Desk */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-8">
          <div className="flex items-center mb-4">
            <Mail className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Contact Administration Desk</h3>
          </div>
          <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-4">
            Email: <a className="text-blue-600 hover:underline" href="mailto:support@codemint.space">support@codemint.space</a>
          </p>
          <form onSubmit={submitContact} className="space-y-3">
            <input
              type="text"
              value={contactSubject}
              onChange={(e) => setContactSubject(e.target.value)}
              placeholder="Subject"
              className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
              required
            />
            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Your message"
              className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white min-h-28"
              required
            />
            {contactError && <div className="text-sm text-red-600">{contactError}</div>}
            {contactSuccess && <div className="text-sm text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> {contactSuccess}</div>}
            <div className="flex justify-end">
              <button disabled={contactLoading} className="inline-flex items-center gap-2 bg-powerbi-primary text-white px-4 py-2 rounded-xl hover:brightness-110 disabled:opacity-50">
                <Send className="w-4 h-4" /> {contactLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>

        {/* Instant Message */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-8">
          <div className="flex items-center mb-4">
            <MessageSquare className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Instant Message</h3>
          </div>
          <div className="border border-powerbi-gray-200 dark:border-powerbi-gray-700 rounded-xl p-4 max-h-64 overflow-y-auto space-y-3">
            {chatMessages.length === 0 && (
              <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">No messages yet.</p>
            )}
            {chatMessages.map((m) => (
              <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg text-sm ${m.type === 'user' ? 'bg-blue-600 text-white' : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white'}`}>
                  <p>{m.message}</p>
                  <span className="block mt-1 text-[10px] opacity-70">{new Date(m.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message"
              className="flex-1 px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
            />
            <button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50">
              <Send className="w-4 h-4" /> Send
            </button>
          </div>
        </div>

        {/* Ticketing */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-8">
          <div className="flex items-center mb-4">
            <Ticket className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">Support Tickets</h3>
          </div>
          <form onSubmit={submitTicket} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Subject"
                className="md:col-span-2 px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                required
              />
              <select
                value={ticketPriority}
                onChange={(e) => setTicketPriority(e.target.value as 'low'|'medium'|'high')}
                className="px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <textarea
              value={ticketMessage}
              onChange={(e) => setTicketMessage(e.target.value)}
              placeholder="Describe your issue"
              className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white min-h-28"
              required
            />
            {ticketError && <div className="text-sm text-red-600">{ticketError}</div>}
            {ticketSuccess && <div className="text-sm text-green-600 flex items-center"><CheckCircle className="w-4 h-4 mr-1" /> {ticketSuccess}</div>}
            <div className="flex justify-end">
              <button disabled={ticketLoading} className="inline-flex items-center gap-2 bg-powerbi-primary text-white px-4 py-2 rounded-xl hover:brightness-110 disabled:opacity-50">
                <Send className="w-4 h-4" /> {ticketLoading ? 'Creating...' : 'Create Ticket'}
              </button>
            </div>
          </form>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">No tickets yet.</td>
                  </tr>
                )}
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">{t.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' : t.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'}`}>{t.priority}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.status === 'open' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' : 'bg-powerbi-gray-100 text-powerbi-gray-800 dark:bg-powerbi-gray-900/20 dark:text-powerbi-gray-300'}`}>{t.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button onClick={() => closeTicket(t.id)} disabled={t.status === 'closed'} className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium text-powerbi-gray-700 bg-powerbi-gray-100 hover:bg-powerbi-gray-200 dark:text-powerbi-gray-300 dark:bg-powerbi-gray-700 dark:hover:bg-powerbi-gray-600 disabled:opacity-50">
                        <X className="w-4 h-4 mr-1" /> Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}