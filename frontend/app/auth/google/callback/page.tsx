'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GoogleCallback() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const code = new URLSearchParams(search).get('code');
    if (!code) {
      setError('Missing authorization code');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/google/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (res.ok && data.token && data.user) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          router.replace('/dashboard');
        } else {
          setError(data.error || 'OAuth failed');
        }
      } catch (e) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-powerbi-blue-50 dark:bg-powerbi-gray-900">
      <div className="bg-white dark:bg-powerbi-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md text-center">
        {loading ? (
          <>
            <div className="animate-pulse w-16 h-16 mx-auto rounded-full bg-powerbi-primary/20" />
            <p className="mt-6 text-powerbi-gray-700 dark:text-powerbi-gray-300">Signing you in with Google…</p>
          </>
        ) : error ? (
          <>
            <p className="text-powerbi-error font-semibold">{error}</p>
            <button onClick={() => router.replace('/login')} className="mt-6 px-4 py-2 rounded-lg bg-powerbi-primary text-white">Back to Login</button>
          </>
        ) : (
          <p className="text-powerbi-gray-700 dark:text-powerbi-gray-300">Redirecting…</p>
        )}
      </div>
    </div>
  );
}