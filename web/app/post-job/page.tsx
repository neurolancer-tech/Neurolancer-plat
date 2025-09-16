'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { Category } from '@/types';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Subcategory {
  id: number;
  category: number;
  name: string;
  description: string;
  created_at: string;
}

export default function PostJobPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategories: [] as string[],
    budget_min: '',
    budget_max: '',
    deadline: '',
    skills_required: '',
    experience_level: 'intermediate',
    job_type: 'fixed',
    location: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    if (profile && profile.user_type === 'freelancer') {
      toast.error('Only clients can post jobs');
      router.push('/dashboard');
      return;
    }

    loadCategories();
  }, [router]);

  useEffect(() => {
    if (formData.category) {
      loadSubcategories(formData.category);
    } else {
      setSubcategories([]);
    }
  }, [formData.category]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSubcategories = async (categoryId: string) => {
    setSubcategoriesLoading(true);
    try {
      const response = await api.get(`/subcategories/?category=${categoryId}`);
      setSubcategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading subcategories:', error);
      setSubcategories([]);
    } finally {
      setSubcategoriesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
      // Clear subcategories when category changes
      ...(name === 'category' && { subcategories: [] })
    });
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    const updatedSubcategories = formData.subcategories.includes(subcategoryId)
      ? formData.subcategories.filter(id => id !== subcategoryId)
      : [...formData.subcategories, subcategoryId];
    
    setFormData({
      ...formData,
      subcategories: updatedSubcategories
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const jobData = {
        ...formData,
        budget_min: parseFloat(formData.budget_min),
        budget_max: parseFloat(formData.budget_max),
        category_id: parseInt(formData.category),
        subcategory_ids: formData.subcategories.map(id => parseInt(id))
      };
      
      // Remove the original category and subcategories fields to avoid confusion
      delete (jobData as any).category;
      delete (jobData as any).subcategories;
      
      const response = await api.post('/jobs/create/', jobData);
      
      toast.success('Job posted successfully!');
      router.push('/my-jobs');
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error(error.response?.data?.error || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Post a Job</h1>
          <p className="text-gray-600 dark:text-gray-400">Find the perfect AI expert for your project</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Job Details</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Build an AI chatbot for customer service"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategories */}
              {formData.category && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategories (Select relevant ones)
                  </label>
                  {subcategoriesLoading ? (
                    <div className="text-sm text-gray-500">Loading subcategories...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                      {subcategories.map(sub => (
                        <label key={sub.id} className="flex items-start space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={formData.subcategories.includes(sub.id.toString())}
                            onChange={() => handleSubcategoryChange(sub.id.toString())}
                            className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="text-gray-700">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Description *
                </label>
                <textarea
                  name="description"
                  required
                  rows={6}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Describe your project requirements, goals, and expectations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skills Required *
                </label>
                <input
                  type="text"
                  name="skills_required"
                  required
                  value={formData.skills_required}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Python, TensorFlow, Natural Language Processing, API Development"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Experience Level
                  </label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <select
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="hourly">Hourly Rate</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Budget & Timeline</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Budget ($) *
                  </label>
                  <input
                    type="number"
                    name="budget_min"
                    required
                    min="5"
                    value={formData.budget_min}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Budget ($) *
                  </label>
                  <input
                    type="number"
                    name="budget_max"
                    required
                    min="5"
                    value={formData.budget_max}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="2000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Deadline *
                </label>
                <input
                  type="date"
                  name="deadline"
                  required
                  value={formData.deadline}
                  onChange={handleInputChange}
                  className="input-field"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location Preference
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Remote, US, Europe, etc."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Job'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}