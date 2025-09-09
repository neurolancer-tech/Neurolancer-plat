'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import DeleteButton from '@/components/DeleteButton';
import Pagination from '@/components/Pagination';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  gigs_count?: number;
  jobs_count?: number;
  courses_count?: number;
  created_at?: string;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const categoriesPerPage = 12;
  const totalPages = Math.ceil(categories.length / categoriesPerPage);
  const startIndex = (currentPage - 1) * categoriesPerPage;
  const paginatedCategories = categories.slice(startIndex, startIndex + categoriesPerPage);

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

    loadCategories();
  }, [router]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories/');
      const data = res.data?.results || res.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}/`, {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
        });
      } else {
        await api.post(`/categories/`, {
          name: formData.name,
          description: formData.description,
          icon: formData.icon,
        });
      }
      loadCategories();
      setShowCreateModal(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '', icon: '' });
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await api.delete(`/categories/${categoryId}/`);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Failed to delete category');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', icon: '' });
    setEditingCategory(null);
    setShowCreateModal(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Category Management</h1>
              <p className="opacity-90">Manage platform service categories</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition-all duration-300"
            >
              Add Category
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{categories.length}</div>
              <div className="text-sm text-teal-600 dark:text-teal-400">Total Categories</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {categories.reduce((sum, c) => sum + (c.gigs_count ?? 0), 0)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Total Gigs</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {categories.reduce((sum, c) => sum + (c.jobs_count ?? 0), 0)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Total Jobs</div>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {categories.reduce((sum, c) => sum + (c.courses_count ?? 0), 0)}
              </div>
              <div className="text-sm text-pink-600 dark:text-pink-400">Total Courses</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {categories.length > 0 ? Math.round(categories.reduce((sum, c) => sum + (c.gigs_count ?? 0), 0) / categories.length) : 0}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Avg Gigs/Category</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
          ) : (
            paginatedCategories.map((category) => (
              <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-xl">
                      {category.icon || '📁'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <DeleteButton
                      label="Delete"
                      confirmMessage={`Delete this category?`}
                      request={{ url: `/categories/${category.id}/`, method: 'delete' }}
                      onSuccess={loadCategories}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{category.gigs_count ?? 0}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400">Gigs</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{category.jobs_count ?? 0}</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Jobs</div>
                  </div>
                  <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                    <div className="text-xl font-bold text-pink-600 dark:text-pink-400">{category.courses_count ?? 0}</div>
                    <div className="text-xs text-pink-600 dark:text-pink-400">Courses</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={Math.ceil(categories.length / categoriesPerPage)} onPageChange={setCurrentPage} />

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                    placeholder="🤖"
                  />
                </div>
                
                {/* Single category model; no type selection required */}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-medium hover:from-cyan-600 hover:to-teal-500 transition-all duration-300"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}