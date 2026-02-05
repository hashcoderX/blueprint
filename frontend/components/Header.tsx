'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Search, LogOut, Settings, ChevronDown, Menu, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../i18n/I18nProvider';
import { supportedLocales, type Locale } from '../i18n/config';

export default function Header({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const router = useRouter();
  interface UserData {
    fullname?: string;
    username?: string;
    email?: string;
  }
  const [user, setUser] = useState<UserData | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      if (stored === 'true') return true;
      if (stored === 'false') return false;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState(3); // Mock notification count
  type NotificationItem = { id: number; title: string; body?: string; is_read: 0 | 1 | boolean; created_at: string };
  const [notifItems, setNotifItems] = useState<NotificationItem[]>([]);
  const [notifFetchLoading, setNotifFetchLoading] = useState(false);
  const { t, locale, setLocale } = useI18n();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showNotifDetailModal, setShowNotifDetailModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

  const parseJsonResponse = async (res: Response) => {
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      const text = await res.text().catch(() => '');
      throw new Error(`Expected JSON, got ${ct} ${res.status}: ${text.substring(0, 200)}`);
    }
    return res.json();
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = typeof window !== 'undefined' ? window.atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  };

  const enableNotifications = async () => {
    try {
      if (typeof window === 'undefined') return;
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        alert('Notifications are not supported in this browser');
        return;
      }
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!isSecure) {
        alert('Enable notifications requires HTTPS or localhost. Please use a secure origin.');
        return;
      }
      if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in your browser settings.');
        return;
      }
      setNotifLoading(true);
      if (Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') { setNotifLoading(false); return; }
      }
      if ('permissions' in navigator) {
        try {
          const status = await (navigator as Navigator).permissions.query({ name: 'notifications' as PermissionName });
          if (status.state === 'denied') {
            alert('Notifications permission is denied by the browser. Please allow notifications for this site.');
            setNotifLoading(false);
            return;
          }
        } catch {}
      }
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        try {
          registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        } catch {
          alert('Service worker registration failed. Ensure the app is served from localhost or HTTPS.');
          setNotifLoading(false);
          return;
        }
      }
      await navigator.serviceWorker.ready;

      const token = localStorage.getItem('token');
      if (!token) { alert('Please log in to enable notifications'); setNotifLoading(false); return; }

      const keyRes = await fetch(`${API_BASE}/api/notifications/vapidPublicKey`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!keyRes.ok) {
        const msg = await keyRes.text().catch(() => '');
        throw new Error(`VAPID key request failed ${keyRes.status}: ${msg.substring(0,200)}`);
      }
      const keyJson = await parseJsonResponse(keyRes);
      const applicationServerKey = urlBase64ToUint8Array(keyJson.publicKey);

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        try {
          subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
        } catch (err) {
          const name = (err as DOMException).name;
          if (name === 'AbortError' || name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            alert('Push subscription failed: permission denied. Please allow notifications for this site in browser settings.');
            setNotifLoading(false);
            return;
          }
          alert(`Push subscription failed: ${name || 'Unknown error'}`);
          setNotifLoading(false);
          return;
        }
      }

      const subRes = await fetch(`${API_BASE}/api/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription })
      });
      if (!subRes.ok) {
        const msg = await subRes.text().catch(() => '');
        throw new Error(`Subscribe failed ${subRes.status}: ${msg.substring(0,200)}`);
      }
      await parseJsonResponse(subRes);

      setNotifEnabled(true);
    } catch (e) {
      console.error('Enable notifications failed:', e);
      alert('Failed to enable notifications');
    } finally {
      setNotifLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Please log in to send a test notification'); return; }
      const res = await fetch(`${API_BASE}/api/notifications/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => '');
        alert(`Test notification failed ${res.status}: ${msg.substring(0,200)}`);
        return;
      }
      const json = await parseJsonResponse(res).catch(() => ({} as any));
      alert('Test notification sent');
    } catch (e) {
      console.error('Test notification error:', e);
      alert('Failed to send test notification');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API_BASE}/api/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ all: true })
      });
      if (!res.ok) return;
      setNotifItems((items) => items.map((i) => ({ ...i, is_read: true })));
    } catch (e) {
      console.error('Mark all read failed', e);
    }
  };

  useEffect(() => {
    // Load user data on client after mount to avoid hydration mismatch
    try {
      const data = localStorage.getItem('user');
      if (data) {
        const parsed = JSON.parse(data);
        setTimeout(() => setUser(parsed), 0);
      }
    } catch {}

    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());

    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header suppressHydrationWarning className="bg-white dark:bg-powerbi-gray-800 shadow-lg border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 h-16 fixed top-0 left-0 lg:left-64 right-0 z-20 flex items-center justify-between px-4 sm:px-6 transition-colors duration-200">
      <div className="flex items-center flex-1">
        {/* Mobile: open sidebar */}
        <button
          onClick={() => onOpenSidebar?.()}
          className="p-2 mr-2 lg:hidden text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 rounded-xl transition-all"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-powerbi-gray-400" />
          <input suppressHydrationWarning
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 bg-powerbi-gray-100 dark:bg-powerbi-gray-700 border border-powerbi-gray-200 dark:border-powerbi-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-transparent transition-all duration-200"
            onKeyDown={(e) => {
              const val = (e.target as HTMLInputElement).value.trim();
              if (e.key === 'Enter' && val) {
                router.push(`/search?query=${encodeURIComponent(val)}`);
              }
            }}
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Dark Mode Toggle removed for now */}

        {/* Language Selector */}
        <div className="relative">
          <div className="flex items-center gap-2 p-2 rounded-xl hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700">
            <Globe className="w-5 h-5 text-powerbi-gray-600 dark:text-powerbi-gray-400" />
            <select
              suppressHydrationWarning
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
              className="bg-transparent text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300 focus:outline-none"
              title={t('header.language')}
            >
              {supportedLocales.map(l => (
                <option key={l.code} value={l.code} className="text-powerbi-gray-900 dark:text-white bg-white dark:bg-powerbi-gray-800">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button suppressHydrationWarning onClick={async () => {
            const next = !showNotifModal;
            setShowNotifModal(next);
            if (next && !notifFetchLoading) {
              try {
                setNotifFetchLoading(true);
                const token = localStorage.getItem('token');
                if (token) {
                  const res = await fetch(`${API_BASE}/api/notifications`, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) {
                    const list = await res.json();
                    setNotifItems(Array.isArray(list) ? list : []);
                  }
                }
              } catch (e) {
                console.error('Failed to load notifications', e);
              } finally {
                setNotifFetchLoading(false);
              }
            }
          }} className="p-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 rounded-xl transition-all duration-200 relative" title={t('header.notifications')}>
            <Bell className="w-5 h-5" />
            {notifItems.filter(n => !n.is_read).length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-powerbi-error text-white text-xs font-bold rounded-full flex items-center justify-center">
                {notifItems.filter(n => !n.is_read).length}
              </span>
            )}
          </button>
        </div>

        {/* Notifications Modal */}
        {showNotifModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-2xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 w-full max-w-md max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <p className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">{t('header.notifications')}</p>
                <button onClick={() => setShowNotifModal(false)} className="text-powerbi-gray-500 hover:text-powerbi-gray-700 dark:hover:text-powerbi-gray-200">✕</button>
              </div>
              <div className="px-5 py-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {notifFetchLoading && (
                  <p className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400">{t('common.loading')}</p>
                )}
                {!notifFetchLoading && notifItems.length === 0 && (
                  <p className="text-xs text-powerbi-gray-500 dark:text-powerbi-gray-400">{t('header.notificationsEmpty')}</p>
                )}
                {!notifFetchLoading && notifItems.length > 0 && (
                  <ul className="space-y-2">
                    {notifItems.map((n) => (
                      <li key={n.id} onClick={() => { setSelectedNotif(n); setShowNotifDetailModal(true); }} className="cursor-pointer p-3 rounded-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 transition">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-powerbi-gray-900 dark:text-white">{n.title}</span>
                          {!n.is_read && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-powerbi-error" />}
                        </div>
                        {n.body && <span className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400 line-clamp-2">{n.body}</span>}
                        <span className="text-xs text-powerbi-gray-500">{new Date(n.created_at).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="px-5 py-3 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex gap-2 items-center justify-between">
                {notifItems.length > 0 && (
                  <button suppressHydrationWarning onClick={markAllNotificationsRead} className="px-3 py-2 text-xs bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 rounded-lg hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600 transition">
                    {t('buttons.markAllRead')}
                  </button>
                )}
                {!notifEnabled && (
                  <button suppressHydrationWarning onClick={() => !notifLoading && enableNotifications()} className="ml-auto px-3 py-2 text-sm bg-powerbi-primary text-white rounded-lg hover:opacity-90 transition disabled:opacity-50" disabled={notifLoading}>
                    {notifLoading ? t('buttons.loading') : t('buttons.enable')}
                  </button>
                )}
                {notifEnabled && (
                  <button suppressHydrationWarning onClick={sendTestNotification} className="ml-auto px-3 py-2 text-sm bg-powerbi-secondary text-white rounded-lg hover:opacity-90 transition">
                    {t('buttons.sendTest')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification Detail Modal */}
        {showNotifDetailModal && selectedNotif && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-2xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 w-full max-w-lg max-h-[85vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <p className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">{selectedNotif.title}</p>
                <button onClick={() => setShowNotifDetailModal(false)} className="text-powerbi-gray-500 hover:text-powerbi-gray-700 dark:hover:text-powerbi-gray-200">✕</button>
              </div>
              <div className="px-5 py-4 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                <p className="text-xs text-powerbi-gray-500">{new Date(selectedNotif.created_at).toLocaleString()}</p>
                {selectedNotif.body ? (
                  <p className="text-sm text-powerbi-gray-800 dark:text-powerbi-gray-100 whitespace-pre-wrap">{selectedNotif.body}</p>
                ) : (
                  <p className="text-sm text-powerbi-gray-600 dark:text-powerbi-gray-300">{t('header.notificationsEmpty')}</p>
                )}
              </div>
              <div className="px-5 py-3 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-end gap-2">
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem('token');
                      if (!token || !selectedNotif) return;
                      const res = await fetch(`${API_BASE}/api/notifications/mark-read`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ id: selectedNotif.id })
                      });
                      if (res.ok) {
                        setNotifItems((items) => items.map((i) => i.id === selectedNotif.id ? { ...i, is_read: true } : i));
                      }
                    } catch (e) { console.error('mark read failed', e); }
                  }}
                  className="px-3 py-2 text-sm bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-800 dark:text-powerbi-gray-200 rounded-lg hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600 transition"
                >
                  {t('buttons.markAllRead')}
                </button>
                <button onClick={() => setShowNotifDetailModal(false)} className="px-3 py-2 text-sm bg-powerbi-primary text-white rounded-lg hover:opacity-90 transition">OK</button>
              </div>
            </div>
          </div>
        )}

        {/* User Menu */}
        <div className="relative">
          <button suppressHydrationWarning
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 rounded-xl transition-all duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-powerbi-primary to-powerbi-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.fullname ? getInitials(user.fullname) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">
                {user?.fullname || 'User'}
              </p>
              <p className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">
                {user?.username || 'username'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-powerbi-gray-600 dark:text-powerbi-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-powerbi-gray-800 rounded-xl shadow-xl border border-powerbi-gray-200 dark:border-powerbi-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
                <p className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">
                  {user?.fullname || 'User'}
                </p>
                <p className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              <div className="py-1">
                <button suppressHydrationWarning onClick={() => { setShowUserMenu(false); router.push('/settings'); }} className="flex items-center w-full px-4 py-2 text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 transition-colors">
                  <User className="w-4 h-4 mr-3" />
                  {t('header.profileSettings')}
                </button>
              </div>

              <div className="border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 py-1">
                <button suppressHydrationWarning
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {t('header.signOut')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay to close dropdown when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
      {showNotifModal && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifModal(false)}
        />
      )}
    </header>
  );
}