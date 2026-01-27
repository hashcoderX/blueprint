import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Home,
  DollarSign,
  Target,
  Trophy,
  CheckSquare,
  Car,
  BookOpen,
  BarChart3,
  Settings,
  HelpCircle,
  Key,
  FolderOpen
} from 'lucide-react';

// Removed legacy navItems; using dynamic items via getNavItems()

const secondaryItems = [
  { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Detailed reports' },
  { name: 'Settings', href: '/settings', icon: Settings, description: 'Preferences' },
  { name: 'Help', href: '/help', icon: HelpCircle, description: 'Support & FAQ' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userJobType, setUserJobType] = useState<string | null>(null);
  const [userJobSubcategory, setUserJobSubcategory] = useState<string | null>(null);

  useEffect(() => {
    // Get user job type from API
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:3001/api/user/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUserJobType(userData.job_type || null);
            setUserJobSubcategory(userData.job_subcategory || null);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  // Dynamic nav items based on user type
  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview & insights' },
      { name: 'Goals', href: '/goals', icon: Target, description: 'Financial targets' },
      { name: 'Achievements', href: '/achievements', icon: Trophy, description: 'Milestones & rewards' },
      { name: 'Income & Expenses', href: '/expenses', icon: DollarSign, description: 'Track Income & spending' },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare, description: 'To-do list' },
      { name: 'Vehicle Maintains', href: '/vehicle-expenses', icon: Car, description: 'Car costs' },
      { name: 'Diary', href: '/diary', icon: BookOpen, description: 'Personal notes' },
      { name: 'Manage Password', href: '/manage-password', icon: Key, description: 'Update your password' },
    ];

    // Add Manage My Projects for freelancers
    if (userJobType === 'freelancer') {
      baseItems.splice(7, 0, {
        name: 'Manage My Projects',
        href: '/manage-projects',
        icon: FolderOpen,
        description: 'Project management & tracking'
      });
    }

    // Add Manage My Gem Business for businessmen with Gem Business subcategory
    if (userJobType === 'businessman' && (userJobSubcategory || '').toLowerCase() === 'gem business') {
      baseItems.splice(7, 0, {
        name: 'Manage My Gem Business',
        href: '/manage-gembusiness',
        icon: FolderOpen,
        description: 'Manage inventory, purchases, and income'
      });
    }

    return baseItems;
  };

  return (
    <div className="w-64 bg-white dark:bg-powerbi-gray-800 shadow-2xl h-screen fixed left-0 top-0 z-10 border-r border-powerbi-gray-200 dark:border-powerbi-gray-700 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-powerbi-primary to-powerbi-secondary rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97.99 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-powerbi-primary to-powerbi-secondary bg-clip-text text-transparent">
              Blueprint
            </h1>
            <p className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">
              Personal Finance
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6 overflow-y-auto">
        {/* Main Navigation */}
        <div className="px-4 mb-6">
          <h3 className="text-xs font-semibold text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider mb-3">
            Main
          </h3>
          <ul className="space-y-1">
            {getNavItems().map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-powerbi-primary/10 text-powerbi-primary border-r-2 border-powerbi-primary'
                        : 'text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 hover:text-powerbi-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                      isActive ? 'text-powerbi-primary' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 group-hover:text-powerbi-primary'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className={`text-xs transition-opacity ${
                        isActive ? 'text-powerbi-primary/70' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 opacity-0 group-hover:opacity-100'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Secondary Navigation */}
        <div className="px-4">
          <h3 className="text-xs font-semibold text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider mb-3">
            More
          </h3>
          <ul className="space-y-1">
            {secondaryItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-powerbi-primary/10 text-powerbi-primary border-r-2 border-powerbi-primary'
                        : 'text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-100 dark:hover:bg-powerbi-gray-700 hover:text-powerbi-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-3 transition-colors ${
                      isActive ? 'text-powerbi-primary' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 group-hover:text-powerbi-primary'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className={`text-xs transition-opacity ${
                        isActive ? 'text-powerbi-primary/70' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 opacity-0 group-hover:opacity-100'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700">
        <div className="bg-gradient-to-r from-powerbi-primary/10 to-powerbi-secondary/10 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-powerbi-primary to-powerbi-secondary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-powerbi-gray-900 dark:text-white">
                Pro Tip
              </p>
              <p className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400">
                Track expenses daily for better insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}