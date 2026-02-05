'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useI18n } from '../../i18n/I18nProvider';
import { Users, UserCheck, UserX, Crown, Power, PowerOff, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: number;
  username: string;
  fullname: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  currency: string;
  job_type: string;
  job_subcategory: string;
  role: string;
  status: string;
  is_paid: boolean;
  super_free?: boolean;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
}

export default function UserList() {
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    limit: 10
  });

  useEffect(() => {
    fetchUsers(1);
  }, []);

  const fetchUsers = async (page: number = 1) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const limit = pagination?.limit || 10;
      const response = await fetch(`http://localhost:3001/api/users?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 403) {
        setError('Access denied. Super admin privileges required.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        limit: 10
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <UserCheck className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'inactive':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300';
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: string) => {
    // Prevent super_admin from deactivating themselves
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (userId === currentUser.id) {
      setError('You cannot deactivate your own account');
      return;
    }

    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setUpdatingUserId(userId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user status');
      }

      // Update the local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleSuperFree = async (userId: number, currentSuperFree: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token found');
      return;
    }
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`http://localhost:3001/api/users/${userId}/super-free`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ super_free: !currentSuperFree })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update Super Free');
      }
      setUsers(users.map(u => u.id === userId ? { ...u, super_free: !currentSuperFree } : u));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update Super Free');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-powerbi-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <UserX className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-powerbi-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-powerbi-gray-900 dark:text-white mb-2">User Management</h1>
          <p className="text-powerbi-gray-600 dark:text-powerbi-gray-400">View and manage all registered users</p>
        </div>

        <div className="bg-white dark:bg-powerbi-gray-800 rounded-2xl shadow-lg border border-powerbi-gray-200 dark:border-powerbi-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-powerbi-gray-200 dark:border-powerbi-gray-700">
            <h2 className="text-xl font-semibold text-powerbi-gray-900 dark:text-white">All Users ({pagination?.totalUsers || 0})</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-powerbi-gray-50 dark:bg-powerbi-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Job Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Country</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-powerbi-gray-500 dark:text-powerbi-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-powerbi-gray-200 dark:divide-powerbi-gray-600">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                      {user.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                      {user.fullname}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-900 dark:text-white">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <span className="ml-2 capitalize">{user.role.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      {user.job_type} {user.job_subcategory && `(${user.job_subcategory})`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      {user.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-powerbi-gray-500 dark:text-powerbi-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(() => {
                        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                        const isCurrentUser = user.id === currentUser.id;
                        return (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.status)}
                              disabled={updatingUserId === user.id || isCurrentUser}
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                user.status === 'active'
                                  ? 'bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300'
                                  : 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {updatingUserId === user.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              ) : user.status === 'active' ? (
                                <PowerOff className="w-4 h-4 mr-2" />
                              ) : (
                                <Power className="w-4 h-4 mr-2" />
                              )}
                              {isCurrentUser ? 'Current User' : (user.status === 'active' ? 'Deactivate' : 'Activate')}
                            </button>
                            <button
                              onClick={() => toggleSuperFree(user.id, Boolean(user.super_free))}
                              disabled={updatingUserId === user.id}
                              className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                user.super_free ? 'bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-300'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {user.super_free ? <UserCheck className="w-4 h-4 mr-2" /> : <Crown className="w-4 h-4 mr-2" />}
                              {user.super_free ? 'Remove Super Free' : 'Make Super Free'}
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(pagination?.totalPages || 1) > 1 && (
            <div className="px-6 py-4 border-t border-powerbi-gray-200 dark:border-powerbi-gray-700 flex items-center justify-between">
              <div className="text-sm text-powerbi-gray-700 dark:text-powerbi-gray-300">
                Showing {((pagination?.currentPage || 1) - 1) * (pagination?.limit || 10) + 1} to {Math.min((pagination?.currentPage || 1) * (pagination?.limit || 10), pagination?.totalUsers || 0)} of {pagination?.totalUsers || 0} users
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fetchUsers((pagination?.currentPage || 1) - 1)}
                  disabled={(pagination?.currentPage || 1) === 1 || loading}
                  className="px-3 py-2 rounded-md text-sm font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-300 dark:border-powerbi-gray-600 hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination?.totalPages || 1) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min((pagination?.totalPages || 1) - 4, (pagination?.currentPage || 1) - 2)) + i;
                    if (pageNum > (pagination?.totalPages || 1)) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchUsers(pageNum)}
                        disabled={loading}
                        className={`px-3 py-2 rounded-md text-sm font-medium ${
                          pageNum === (pagination?.currentPage || 1)
                            ? 'bg-powerbi-primary text-white'
                            : 'text-powerbi-gray-500 dark:text-powerbi-gray-400 bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-300 dark:border-powerbi-gray-600 hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => fetchUsers((pagination?.currentPage || 1) + 1)}
                  disabled={(pagination?.currentPage || 1) === (pagination?.totalPages || 1) || loading}
                  className="px-3 py-2 rounded-md text-sm font-medium text-powerbi-gray-500 dark:text-powerbi-gray-400 bg-white dark:bg-powerbi-gray-800 border border-powerbi-gray-300 dark:border-powerbi-gray-600 hover:bg-powerbi-gray-50 dark:hover:bg-powerbi-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}