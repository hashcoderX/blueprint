'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');
  
  // Login form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Redirect to dashboard if already logged in
      window.location.href = '/dashboard';
      return;
    }

    // Check for remembered credentials
    const remembered = localStorage.getItem('rememberMe');
    if (remembered) {
      const creds = JSON.parse(remembered);
      setIdentifier(creds.identifier.trim());
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        if (rememberMe) {
          localStorage.setItem('rememberMe', JSON.stringify({ identifier }));
        } else {
          localStorage.removeItem('rememberMe');
        }

        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // If not logged in, show login form
  return (
      <div className="min-h-screen bg-gradient-to-br from-powerbi-blue-50 via-white to-powerbi-blue-100 dark:from-powerbi-gray-900 dark:via-powerbi-gray-800 dark:to-powerbi-blue-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-powerbi-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-powerbi-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-powerbi-accent/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="max-w-md mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-powerbi-primary to-powerbi-secondary rounded-2xl mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97.99 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-powerbi-primary to-powerbi-secondary bg-clip-text text-transparent mb-3">
              Blueprint
            </h2>
          </div>

          <div className="bg-white/80 dark:bg-powerbi-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-powerbi-gray-200/50 dark:border-powerbi-gray-700/50 overflow-hidden animate-fade-in-up delay-200">
            <div className="px-4 sm:px-8 pt-8 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <button onClick={() => {
                  window.location.href = `${API_BASE}/api/auth/google`;
                }} className="flex items-center justify-center px-4 py-3 bg-white dark:bg-powerbi-gray-700 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-xl hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-600 transition-all duration-200 transform hover:scale-105 shadow-sm">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">Google</span>
                </button>
              </div>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-powerbi-gray-300 dark:border-powerbi-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-powerbi-gray-800 text-powerbi-gray-500 dark:text-powerbi-gray-400">Or continue with email</span>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-8 py-4 sm:py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="animate-fade-in-up delay-300">
                  <label className="block text-sm font-semibold text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">
                    Username, Email, or Phone
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value.trim())}
                      required
                      className="w-full px-4 py-4 pl-14 border-2 border-powerbi-gray-200 dark:border-powerbi-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-powerbi-primary/20 focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 group-hover:border-powerbi-primary/50"
                      placeholder="Enter your username, email, or phone"
                    />
                    <div className="absolute left-4 top-4">
                      <svg className="w-6 h-6 text-powerbi-gray-400 group-focus-within:text-powerbi-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="animate-fade-in-up delay-400">
                  <label className="block text-sm font-semibold text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-4 pl-14 pr-14 border-2 border-powerbi-gray-200 dark:border-powerbi-gray-600 rounded-2xl shadow-sm focus:outline-none focus:ring-4 focus:ring-powerbi-primary/20 focus:border-powerbi-primary dark:bg-powerbi-gray-700 dark:text-white transition-all duration-200 group-hover:border-powerbi-primary/50"
                      placeholder="Enter your password"
                    />
                    <div className="absolute left-4 top-4">
                      <svg className="w-6 h-6 text-powerbi-gray-400 group-focus-within:text-powerbi-primary transition-colors" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                      </svg>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-powerbi-gray-400 hover:text-powerbi-primary transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92 1.11-1.11c1.73-4.39 6-7.5 11-7.5-1.73-4.39-6-7.5-11-7.5S2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5 0-.65.13-1.26.36-1.83l-2.92-2.92L12 7z"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in-up delay-500">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-powerbi-primary bg-powerbi-gray-100 border-powerbi-gray-300 rounded focus:ring-powerbi-primary dark:focus:ring-powerbi-primary dark:ring-offset-powerbi-gray-800 focus:ring-2 dark:bg-powerbi-gray-700 dark:border-powerbi-gray-600"
                    />
                    <span className="ml-2 text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400">Remember me</span>
                  </label>
                  <a href="/login" className="text-sm text-powerbi-primary hover:text-powerbi-secondary font-medium transition-colors">
                    Forgot password?
                  </a>
                </div>

                {error && (
                  <div className="p-4 bg-powerbi-error/10 border-2 border-powerbi-error/20 rounded-2xl animate-shake">
                    <div className="flex items-center">
                      <svg className="w-6 h-6 text-powerbi-error mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                      <p className="text-powerbi-error font-semibold">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-powerbi-primary to-powerbi-secondary hover:from-powerbi-secondary hover:to-powerbi-primary text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-powerbi-primary/30 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none animate-fade-in-up delay-600"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing In...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                      </svg>
                      Sign In
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center animate-fade-in-up delay-700">
                <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="text-powerbi-primary hover:text-powerbi-secondary font-bold transition-colors">
                    Create one here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}
