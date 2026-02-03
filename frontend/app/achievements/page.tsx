'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import {
  Trophy,
  Star,
  Target,
  TrendingUp,
  Calendar,
  Award,
  Lock,
  CheckCircle,
  Gift,
  Zap,
  DollarSign,
  PiggyBank,
  Car,
  Heart,
  Users,
  BookOpen,
  CheckSquare,
  Plus,
  Trash2,
  type LucideIcon
} from 'lucide-react';

interface Achievement {
  id: string | number;
  title: string;
  description: string;
  icon: string;
  category: string;
  requirement: string;
  reward: string;
  progress: number;
  max_progress: number;
  unlocked: boolean;
  unlocked_date?: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const achievementCategories = [
  { name: 'Savings', icon: PiggyBank, color: 'green' },
  { name: 'Expenses', icon: DollarSign, color: 'red' },
  { name: 'Goals', icon: Target, color: 'blue' },
  { name: 'Tasks', icon: CheckSquare, color: 'purple' },
  { name: 'Vehicle', icon: Car, color: 'orange' },
  { name: 'Lifestyle', icon: Heart, color: 'pink' },
  { name: 'Social', icon: Users, color: 'indigo' },
  { name: 'Learning', icon: BookOpen, color: 'teal' }
];

export default function Achievements() {
    const { t } = useI18n();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: 0,
    totalPoints: 0,
    currentStreak: 0
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<{ show: boolean; achievementId: string | number | null }>({ show: false, achievementId: null });

  useEffect(() => {
    fetchAchievements();
    fetchStats();
  }, []);

  const fetchAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAchievements(data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const createAchievement = async (data: Partial<Achievement>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:3001/api/achievements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          icon: data.icon,
          category: data.category,
          requirement: data.requirement,
          reward: data.reward,
          max_progress: data.max_progress,
          rarity: data.rarity
        })
      });

      const body = await res.json();
      if (!res.ok || body.error) {
        throw new Error(body.error || 'Failed to create achievement');
      }

      setAchievements(prev => [body, ...prev]);
      setShowCreateForm(false);
      setFormError(null);
      fetchStats();
    } catch (err: unknown) {
      console.error('Error creating achievement:', err);
      const message = err instanceof Error ? err.message : 'Error creating achievement';
      setFormError(message);
    }
  };

  const handleDeleteAchievement = async (achievementId: string | number) => {
    setShowConfirmDelete({ show: true, achievementId });
  };

  const confirmDeleteAchievement = async () => {
    const achievementId = showConfirmDelete.achievementId;
    if (!achievementId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:3001/api/achievements/${achievementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) {
        console.error('Error deleting achievement:', data.error);
      } else {
        setAchievements(achievements.filter(a => a.id !== achievementId));
        fetchStats();
      }
    } catch (err) {
      console.error('Error deleting achievement:', err);
    } finally {
      setShowConfirmDelete({ show: false, achievementId: null });
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/achievements/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalAchievements: data.total_achievements,
          unlockedAchievements: data.unlocked_achievements,
          totalPoints: data.total_points,
          currentStreak: data.current_streak
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // removed unused updateAchievementProgress to satisfy lint

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, LucideIcon> = {
      PiggyBank, DollarSign, Target, CheckSquare, Car, Heart, Users, BookOpen,
      Trophy, Star, Award, Gift, Zap, TrendingUp, Calendar
    };
    return icons[iconName] || Trophy;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
      case 'rare': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'epic': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'legendary': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const IconComponent = getIconComponent(achievement.icon);
    const progressPercentage = (achievement.progress / achievement.max_progress) * 100;

    return (
      <div className={`relative bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
        achievement.unlocked ? 'ring-2 ring-green-200 dark:ring-green-800' : ''
      }`}>
        {achievement.unlocked && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); handleDeleteAchievement(achievement.id); }}
          className="absolute top-4 right-4 p-2 text-powerbi-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors z-10"
          title="Delete Achievement"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-xl ${
            achievement.unlocked
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
              : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700'
          }`}>
            <IconComponent className={`w-6 h-6 ${
              achievement.unlocked ? 'text-white' : 'text-powerbi-gray-500 dark:text-powerbi-gray-400'
            }`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold text-base sm:text-lg ${
                achievement.unlocked
                  ? 'text-powerbi-gray-900 dark:text-white'
                  : 'text-powerbi-gray-600 dark:text-powerbi-gray-400'
              }`}>
                {achievement.title}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityColor(achievement.rarity)}`}>
                {achievement.rarity}
              </span>
            </div>

            <p className={`text-xs sm:text-sm mb-3 ${
              achievement.unlocked
                ? 'text-powerbi-gray-700 dark:text-powerbi-gray-300'
                : 'text-powerbi-gray-500 dark:text-powerbi-gray-500'
            }`}>
              {achievement.description}
            </p>

            {!achievement.unlocked && (
              <div className="mb-3">
                <div className="flex justify-between text-sm text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{achievement.progress} / {achievement.max_progress}</span>
                </div>
                <div className="w-full bg-powerbi-gray-200 dark:bg-powerbi-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-powerbi-primary to-powerbi-secondary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Gift className="w-4 h-4 text-powerbi-gray-500" />
                <span className="text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300">
                  {achievement.reward}
                </span>
              </div>

              {achievement.unlocked && achievement.unlocked_date && (
                <div className="flex items-center space-x-1 text-xs text-powerbi-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(achievement.unlocked_date).toLocaleDateString()}</span>
                </div>
              )}

              {!achievement.unlocked && (
                <Lock className="w-4 h-4 text-powerbi-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-8 mt-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-powerbi-gray-900 dark:text-white flex items-center text-center sm:text-left">
              <Trophy className="w-8 h-8 mr-3 text-yellow-500" />
              {t('pages.achievements.title')}
            </h1>
            <p className="text-sm sm:text-base text-powerbi-gray-600 dark:text-powerbi-gray-400 mt-1 text-center sm:text-left">
              {t('pages.achievements.subtitle')}
            </p>
          </div>
          <button
            onClick={() => { setShowCreateForm(true); setFormError(null); }}
            className="inline-flex items-center gap-2 bg-powerbi-primary hover:brightness-110 text-white px-4 py-2 rounded-xl transition-colors flex-shrink-0 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            {t('pages.achievements.addButton')}
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Total Achievements</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalAchievements}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Unlocked</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.unlockedAchievements}</p>
              </div>
              <Award className="w-8 h-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Points Earned</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.totalPoints.toLocaleString()}</p>
              </div>
              <Star className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Current Streak</p>
                <p className="text-2xl sm:text-3xl font-bold">{stats.currentStreak} days</p>
              </div>
              <Zap className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">{t('pages.achievements.categories')}</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                selectedCategory === 'all'
                  ? 'bg-powerbi-primary text-white shadow-lg'
                  : 'bg-powerbi-gray-100 dark:bg-powerbi-gray-700 text-powerbi-gray-700 dark:text-powerbi-gray-300 hover:bg-powerbi-gray-200 dark:hover:bg-powerbi-gray-600'
              }`}
            >
              {t('pages.achievements.all')}
            </button>
            {achievementCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    selectedCategory === category.name
                      ? `bg-${category.color}-500 text-white shadow-lg`
                      : `bg-${category.color}-100 dark:bg-${category.color}-900/20 text-${category.color}-700 dark:text-${category.color}-300 hover:bg-${category.color}-200 dark:hover:bg-${category.color}-900/30`
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredAchievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-powerbi-gray-300 dark:text-powerbi-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-2">
              {t('pages.achievements.noAchievementsFound')}
            </h3>
            <p className="text-powerbi-gray-500 dark:text-powerbi-gray-500">
              {t('pages.achievements.emptyHint')}
            </p>
          </div>
        )}

        {/* Create Achievement Modal */}
        {showCreateForm && (
          <AchievementForm
            onSave={createAchievement}
            onCancel={() => { setShowCreateForm(false); setFormError(null); }}
            error={formError}
          />
        )}

        {/* Confirmation Modal */}
        {showConfirmDelete.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-powerbi-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-powerbi-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400 mb-6">
                  Are you sure you want to delete this achievement? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowConfirmDelete({ show: false, achievementId: null })}
                    className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteAchievement}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AchievementForm({
  onSave,
  onCancel,
  error
}: {
  onSave: (data: Partial<Achievement>) => void;
  onCancel: () => void;
  error?: string | null;
}) {
  const iconOptions = [
    'PiggyBank', 'DollarSign', 'Target', 'CheckSquare', 'Car', 'Heart', 'Users', 'BookOpen',
    'Trophy', 'Star', 'Award', 'Gift', 'Zap', 'TrendingUp', 'Calendar'
  ];
  const categoryOptions = achievementCategories.map(c => c.name);
  const rarityOptions: Array<Achievement['rarity']> = ['common', 'rare', 'epic', 'legendary'];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Trophy',
    category: categoryOptions[0] || 'Savings',
    requirement: '',
    reward: '0 points',
    max_progress: 1,
    rarity: 'common' as Achievement['rarity']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-powerbi-gray-900 dark:text-white mb-6">Add Achievement</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                  placeholder="e.g., Budget Master"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Icon *</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                >
                  {iconOptions.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                placeholder="Describe the achievement..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                >
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Max Progress *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.max_progress}
                  onChange={(e) => setFormData({ ...formData, max_progress: parseInt(e.target.value || '1', 10) })}
                  className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Rarity *</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData({ ...formData, rarity: e.target.value as Achievement['rarity'] })}
                  className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                >
                  {rarityOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Requirement *</label>
                <input
                  type="text"
                  required
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: e.target.value })}
                  className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                  placeholder="e.g., Save $100 total"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-powerbi-gray-700 dark:text-powerbi-gray-300 mb-2">Reward *</label>
                <input
                  type="text"
                  required
                  value={formData.reward}
                  onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                  className="w-full px-3 py-2 border border-powerbi-gray-300 dark:border-powerbi-gray-600 rounded-lg bg-white dark:bg-powerbi-gray-700 text-powerbi-gray-900 dark:text-white"
                  placeholder="e.g., 100 points"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-powerbi-gray-600 dark:text-powerbi-gray-400 hover:text-powerbi-gray-800 dark:hover:text-powerbi-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-powerbi-primary hover:brightness-110 text-white px-6 py-2 rounded-xl transition-colors"
              >
                Create Achievement
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}