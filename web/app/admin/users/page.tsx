'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import DeleteButton from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  profile?: {
    user_type: string;
    profile_picture?: string;
    phone?: string;
    location?: string;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const user = getUser();
    if (user?.email !== 'kbrian1237@gmail.com') {
      router.push('/');
      return;
    }

    loadUsers();
  }, [router, searchTerm, filterType, currentPage]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users/');
      const userData = response.data.results || response.data || [];
      setUsers(userData);
      setTotalPages(Math.ceil(userData.length / usersPerPage));
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/`, {
        is_active: !currentStatus
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'client' && user.profile?.user_type === 'client') ||
      (filterType === 'freelancer' && user.profile?.user_type === 'freelancer');
    
    return matchesSearch && matchesFilter;
  });

  // Client-side pagination
  const totalFilteredUsers = filteredUsers.length;
  const totalPagesCalculated = Math.ceil(totalFilteredUsers / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#0D9E86] to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">User Management</h1>
          <p className="opacity-90">Manage platform users and their permissions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Users</option>
              <option value="client">Clients</option>
              <option value="freelancer">Freelancers</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="text-2xl font-bold text-[#0D9E86] dark:text-teal-400">{users.length}</div>
              <div className="text-sm text-[#0D9E86] dark:text-teal-400">Total Users</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {users.filter(u => u.is_active).length}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Active Users</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-bold text-[#FF8559] dark:text-orange-400">
                {users.filter(u => u.profile?.user_type === 'freelancer').length}
              </div>
              <div className="text-sm text-[#FF8559] dark:text-orange-400">Freelancers</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {users.filter(u => u.profile?.user_type === 'client').length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Clients</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#0D9E86] to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.first_name?.[0] || user.username?.[0] || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.first_name} {user.last_name} ({user.username})
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.profile?.user_type === 'freelancer' 
                            ? 'bg-orange-100 text-[#FF8559] dark:bg-orange-900/20 dark:text-orange-300'
                            : user.profile?.user_type === 'client'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {user.profile?.user_type || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            user.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300'
                          }`}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <DeleteButton
                          label="Deactivate"
                          confirmMessage={`Deactivate user ${user.username}? This will disable their account.`}
                          request={{ url: `/admin/users/${user.id}/`, method: 'delete' }}
                          onSuccess={loadUsers}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <Pagination currentPage={currentPage} totalPages={totalPagesCalculated} onPageChange={setCurrentPage} />
        </div>
      </div>
    </AdminLayout>
  );
}