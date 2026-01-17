'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Search, LogOut, Settings, Moon, Sun, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState(3); // Mock notification count

  useEffect(() => {
    // Get user data from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // Check for dark mode preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

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
    <header suppressHydrationWarning className="bg-white dark:bg-powerbi-gray-800 shadow-lg border-b border-powerbi-gray-200 dark:border-powerbi-gray-700 h-16 fixed top-0 left-64 right-0 z-20 flex items-center justify-between px-6 transition-colors duration-200">
      <div className="flex items-center flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-powerbi-gray-400" />
          <input suppressHydrationWarning
            type="text"
            placeholder="Search expenses, goals, tasks..."
            className="w-full pl-10 pr-4 py-2 bg-powerbi-gray-100 dark:bg-powerbi-gray-700 border border-powerbi-gray-200 dark:border-powerbi-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-powerbi-primary focus:border-transparent transition-all duration-200"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Dark Mode Toggle */}
        <button suppressHydrationWarning
          onClick={toggleDarkMode}
          className="p-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 rounded-xl transition-all duration-200"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button suppressHydrationWarning className="p-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-900 dark:hover:text-white hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 rounded-xl transition-all duration-200 relative">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-powerbi-error text-white text-xs font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

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
                <button suppressHydrationWarning className="flex items-center w-full px-4 py-2 text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 transition-colors">
                  <User className="w-4 h-4 mr-3" />
                  Profile Settings
                </button>
                <button suppressHydrationWarning className="flex items-center w-full px-4 py-2 text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 transition-colors">
                  <Settings className="w-4 h-4 mr-3" />
                  Preferences
                </button>
              </div>

              <div className="border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 py-1">
                <button suppressHydrationWarning
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
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
    </header>
  );
}