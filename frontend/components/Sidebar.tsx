import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useI18n } from '../i18n/I18nProvider';
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
  FolderOpen,
  X,
  Users
} from 'lucide-react';

// Removed legacy navItems; using dynamic items via getNavItems()

const secondaryItemsBase = [
  { key: 'analytics', href: '/analytics', icon: BarChart3, descKey: 'analyticsDesc' },
  { key: 'settings', href: '/settings', icon: Settings, descKey: 'settingsDesc' },
  { key: 'help', href: '/help', icon: HelpCircle, descKey: 'helpDesc' },
  { key: 'tutorials', href: '/tutorials', icon: BookOpen, descKey: 'tutorialsDesc' },
];

export default function Sidebar({ className, mobile = false, onClose }: { className?: string; mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userJobType, setUserJobType] = useState<string | null>(null);
  const [userJobSubcategory, setUserJobSubcategory] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userIsPaid, setUserIsPaid] = useState<boolean>(false);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [userSuperFree, setUserSuperFree] = useState<boolean>(false);
  const { t } = useI18n();

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

  const parseJsonResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      throw new Error(`Unexpected response type (${res.status}): ${text.substring(0,200)}`);
    }
    return res.json();
  };

  useEffect(() => {
    // Get user job type from API
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch(`${API_BASE}/api/user/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch((err) => { throw err; });
          if (!response.ok) {
            // Handle invalid/expired token: clear and redirect to login
            if (response.status === 401 || response.status === 403) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // Avoid throwing; redirect user to login
              router.push('/login');
              return;
            }
            const msg = await response.text().catch(() => '');
            throw new Error(`Profile fetch failed ${response.status}: ${msg.substring(0,200)}`);
          }
          const userData = await parseJsonResponse(response);
          setUserJobType(userData.job_type || null);
          setUserJobSubcategory(userData.job_subcategory || null);
          setUserRole(userData.role || null);
          setUserIsPaid(Boolean(userData.is_paid));
          setUserSuperFree(Boolean(userData.super_free));
          setUserCreatedAt(userData.created_at || null);
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
      { key: 'dashboard', href: '/dashboard', icon: Home, descKey: 'dashboardDesc' },
      { key: 'goals', href: '/goals', icon: Target, descKey: 'goalsDesc' },
      { key: 'achievements', href: '/achievements', icon: Trophy, descKey: 'achievementsDesc' },
      { key: 'expenses', href: '/expenses', icon: DollarSign, descKey: 'expensesDesc' },
      { key: 'tasks', href: '/tasks', icon: CheckSquare, descKey: 'tasksDesc' },
      { key: 'vehicleExpenses', href: '/vehicle-expenses', icon: Car, descKey: 'vehicleExpensesDesc' },
      { key: 'diary', href: '/diary', icon: BookOpen, descKey: 'diaryDesc' },
      { key: 'managePassword', href: '/manage-password', icon: Key, descKey: 'managePasswordDesc' },
    ];

    // Add Manage My Projects for freelancers
    if (userJobType === 'freelancer') {
      baseItems.splice(7, 0, {
        key: 'manageProjects',
        href: '/manage-projects',
        icon: FolderOpen,
        descKey: 'manageProjectsDesc'
      });
    }

    // Add Manage My Gem Business for businessmen with Gem Business subcategory
    if (userJobType === 'businessman' && (userJobSubcategory || '').toLowerCase() === 'gem business') {
      baseItems.splice(7, 0, {
        key: 'manageGemBusiness',
        href: '/manage-gembusiness',
        icon: FolderOpen,
        descKey: 'manageGemBusinessDesc'
      });
    }

    // Add User List for super_admin
    if (userRole === 'super_admin') {
      baseItems.splice(8, 0, {
        key: 'userList',
        href: '/user-list',
        icon: Users,
        descKey: 'userListDesc'
      });
      baseItems.splice(9, 0, {
        key: 'supportDesk',
        href: '/help/admin',
        icon: HelpCircle,
        descKey: 'supportDeskDesc'
      });
    }

    // Add Support Desk for admin
    if (userRole === 'admin') {
      baseItems.splice(8, 0, {
        key: 'supportDesk',
        href: '/help/admin',
        icon: HelpCircle,
        descKey: 'supportDeskDesc'
      });
    }

    const isStaff = userRole === 'admin' || userRole === 'super_admin';
    const created = userCreatedAt ? new Date(userCreatedAt) : null;
    const trialActive = created ? (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
    const hasFullAccess = userIsPaid || isStaff || trialActive || userSuperFree;
    if (!hasFullAccess) {
      // Free plan: show only goals, achievements, tasks
      return baseItems.filter(item => ['goals', 'achievements', 'tasks'].includes(item.key));
    }
    return baseItems;
  };

  // Compute access level (Pro/staff or within 7-day trial)
  const created = userCreatedAt ? new Date(userCreatedAt) : null;
  const trialActive = created ? (Date.now() - created.getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
  const isStaff = userRole === 'admin' || userRole === 'super_admin';
  const hasFullAccess = userIsPaid || isStaff || trialActive || userSuperFree;

  return (
    <div className={`${mobile ? 'fixed left-0 top-0 h-screen w-72 z-30 flex flex-col' : 'hidden lg:flex lg:w-64 lg:h-screen lg:fixed lg:left-0 lg:top-0 z-10 flex flex-col'} bg-gradient-to-b from-white to-powerbi-gray-50 dark:from-powerbi-gray-800 dark:to-powerbi-gray-900 shadow-2xl border-r border-powerbi-gray-200/50 dark:border-powerbi-gray-700/50 backdrop-blur-sm ${className || ''}`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-powerbi-gray-200/30 dark:border-powerbi-gray-700/30 bg-gradient-to-r from-powerbi-primary/5 to-transparent flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-powerbi-primary/3 to-transparent opacity-50"></div>
        <div className="flex items-center space-x-4 relative z-10">
          <div className="w-12 h-12 bg-gradient-to-br from-powerbi-primary via-powerbi-secondary to-powerbi-accent-dark rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-200">
            <svg className="w-7 h-7 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97.99 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-powerbi-primary via-powerbi-secondary to-powerbi-accent-dark bg-clip-text text-transparent drop-shadow-sm">
              Blueprint
            </h1>
            <p className="text-xs text-powerbi-gray-600 dark:text-powerbi-gray-400 font-medium tracking-wide">
              Personal Finance
            </p>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-powerbi-gray-100/80 dark:hover:bg-powerbi-gray-700/80 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-white transition-all duration-200 backdrop-blur-sm relative z-10" aria-label="Close sidebar">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6 overflow-y-auto custom-scrollbar">
        {/* Main Navigation */}
        <div className="px-4 mb-8">
          <h3 className="text-xs font-bold text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider mb-4 px-2">
            {t('sidebar.main')}
          </h3>
          <ul className="space-y-2">
            {getNavItems().map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3 rounded-2xl transition-all duration-300 ease-out transform hover:scale-[1.02] ${
                      isActive
                        ? 'bg-gradient-to-r from-powerbi-primary/15 to-powerbi-primary/5 text-powerbi-primary border-r-4 border-powerbi-primary shadow-lg shadow-powerbi-primary/10'
                        : 'text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-gradient-to-r hover:from-powerbi-gray-100/80 hover:to-powerbi-gray-50/80 dark:hover:from-powerbi-gray-700/80 dark:hover:to-powerbi-gray-600/80 hover:text-powerbi-gray-900 dark:hover:text-white hover:shadow-md'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-4 transition-all duration-300 ${
                      isActive ? 'text-powerbi-primary scale-110' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 group-hover:text-powerbi-primary group-hover:scale-105'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm transition-all duration-200 ${
                        isActive ? 'text-powerbi-primary' : 'text-powerbi-gray-800 dark:text-powerbi-gray-200 group-hover:text-powerbi-gray-900 dark:group-hover:text-white'
                      }`}>
                        {t(`sidebar.items.${item.key}`)}
                      </div>
                      <div className={`text-xs mt-0.5 transition-all duration-300 ${
                        isActive ? 'text-powerbi-primary/80 opacity-100' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0'
                      }`}>
                        {t(`sidebar.descriptions.${item.descKey}`)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Secondary Navigation */}
        <div className="px-4 pb-6">
          <h3 className="text-xs font-bold text-powerbi-gray-500 dark:text-powerbi-gray-400 uppercase tracking-wider mb-4 px-2">
            {t('sidebar.more')}
          </h3>
          <ul className="space-y-2">
            {hasFullAccess ? secondaryItemsBase.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3 rounded-2xl transition-all duration-300 ease-out transform hover:scale-[1.02] ${
                      isActive
                        ? 'bg-gradient-to-r from-powerbi-primary/15 to-powerbi-primary/5 text-powerbi-primary border-r-4 border-powerbi-primary shadow-lg shadow-powerbi-primary/10'
                        : 'text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-gradient-to-r hover:from-powerbi-gray-100/80 hover:to-powerbi-gray-50/80 dark:hover:from-powerbi-gray-700/80 dark:hover:to-powerbi-gray-600/80 hover:text-powerbi-gray-900 dark:hover:text-white hover:shadow-md'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 mr-4 transition-all duration-300 ${
                      isActive ? 'text-powerbi-primary scale-110' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 group-hover:text-powerbi-primary group-hover:scale-105'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm transition-all duration-200 ${
                        isActive ? 'text-powerbi-primary' : 'text-powerbi-gray-800 dark:text-powerbi-gray-200 group-hover:text-powerbi-gray-900 dark:group-hover:text-white'
                      }`}>
                        {t(`sidebar.items.${item.key}`)}
                      </div>
                      <div className={`text-xs mt-0.5 transition-all duration-300 ${
                        isActive ? 'text-powerbi-primary/80 opacity-100' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0'
                      }`}>
                        {t(`sidebar.descriptions.${item.descKey}`)}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            }) : null}
          </ul>
        </div>
      </nav>

      {/* Footer removed: ProTip feature disabled */}
    </div>
  );
}