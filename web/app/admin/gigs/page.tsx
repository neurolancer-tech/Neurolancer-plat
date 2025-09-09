'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import DeleteButton from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';

interface Gig {
  id: number;
  title: string;
  description: string;
  price: number;
  category: { name: string };
  freelancer: { username: string; first_name: string; last_name: string };
  is_active: boolean;
  created_at: string;
  orders_count: number;
}

export default function AdminGigsPage() {
  const router = useRouter();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const gigsPerPage = 10;

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

    loadGigs();
  }, [router]);

  const loadGigs = async () => {
    try {
      const response = await api.get('/gigs/');
      setGigs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading gigs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGigStatus = async (gigId: number, currentStatus: boolean) => {
    try {
      await api.patch(`/gigs/${gigId}/update/`, {
        is_active: !currentStatus
      });
      loadGigs();
    } catch (error) {
      console.error('Error updating gig status:', error);
    }
  };

  const deleteGig = async (gigId: number) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;
    
    try {
      await api.delete(`/gigs/${gigId}/delete/`);
      loadGigs();
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  const filteredGigs = gigs.filter(gig => 
    gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.freelancer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    gig.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Client-side pagination
  const totalPages = Math.ceil(filteredGigs.length / gigsPerPage);
  const startIndex = (currentPage - 1) * gigsPerPage;
  const paginatedGigs = filteredGigs.slice(startIndex, startIndex + gigsPerPage);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Gig Management</h1>
          <p className="opacity-90">Monitor and manage all platform gigs</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search gigs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{gigs.length}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Total Gigs</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {gigs.filter(g => g.is_active).length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Active Gigs</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${gigs.reduce((sum, g) => sum + g.price, 0).toFixed(2)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Value</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {gigs.reduce((sum, g) => sum + (g.orders_count || 0), 0)}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">Total Orders</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gig</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Freelancer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Orders</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedGigs.map((gig) => (
                    <tr key={gig.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                            {gig.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {gig.category.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {gig.freelancer.first_name} {gig.freelancer.last_name}
                        <div className="text-xs text-gray-500 dark:text-gray-400">@{gig.freelancer.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${gig.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          gig.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                        }`}>
                          {gig.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {gig.orders_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleGigStatus(gig.id, gig.is_active)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            gig.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300'
                          }`}
                        >
                          {gig.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <DeleteButton
                          label="Delete"
                          confirmMessage="Are you sure you want to delete this gig?"
                          request={{ url: `/admin/gigs/${gig.id}/`, method: 'delete' }}
                          onSuccess={loadGigs}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </AdminLayout>
  );
}