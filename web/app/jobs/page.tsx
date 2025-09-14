'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import { Job, Category } from '@/types';
import { getProfile } from '@/lib/auth';
import api from '@/lib/api';
import Pagination from '@/components/Pagination';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Jobs - Find Artificial Intelligence Projects',
  description: 'Browse AI and machine learning job opportunities. Find projects in neural networks, deep learning, NLP, computer vision, and more. Post your AI job or apply as a freelancer.',
  keywords: ['AI jobs', 'machine learning jobs', 'artificial intelligence projects', 'neural network jobs', 'deep learning freelance'],
  openGraph: {
    title: 'AI Jobs - Find Artificial Intelligence Projects | Neurolancer',
    description: 'Browse AI and machine learning job opportunities. Find projects in neural networks, deep learning, NLP, computer vision, and more.',
  },
};

interface Subcategory {
  id: number;
  category: number;
  name: string;
  description: string;
  created_at: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    experienceLevel: '',
    jobType: '',
    minBudget: '',
    maxBudget: '',
    minLikes: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  
  const profile = getProfile();
  const isFreelancer = profile?.user_type === 'freelancer' || profile?.user_type === 'both';

  useEffect(() => {
    loadCategories();
    loadJobs();
  }, []);

  useEffect(() => {
    if (filters.category) {
      loadSubcategories(filters.category);
    } else {
      setSubcategories([]);
    }
  }, [filters.category]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories/');
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const response = await api.get('/jobs/');
      setJobs(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
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

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!job || !job.title) return false;
      
      const matchesSearch = !filters.search || (
        job.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        job.description?.toLowerCase().includes(filters.search.toLowerCase())
      );
      const matchesCategory = !filters.category || (job.category?.id?.toString() === filters.category);
      const matchesSubcategory = !filters.subcategory || 
        (((job as any).subcategories) && ((job as any).subcategories).some((sub: any) => sub.id.toString() === filters.subcategory));
      const matchesExperience = !filters.experienceLevel || job.experience_level === filters.experienceLevel;
      const matchesJobType = !filters.jobType || job.job_type === filters.jobType;
      const matchesMinBudget = !filters.minBudget || job.budget_min >= parseFloat(filters.minBudget);
      const matchesMaxBudget = !filters.maxBudget || job.budget_max <= parseFloat(filters.maxBudget);
      const matchesMinLikes = !filters.minLikes || (job.likes_count && job.likes_count >= parseInt(filters.minLikes));
      
      return matchesSearch && matchesCategory && matchesSubcategory && matchesExperience && matchesJobType && matchesMinBudget && matchesMaxBudget && matchesMinLikes;
    });
  }, [jobs, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <section 
        className="text-white py-16 relative"
        style={{
          background: 'linear-gradient(to right, #0D9E86, #0d7377)',
          backgroundImage: `url('/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4">Find AI Jobs</h1>
              <p className="text-xl">Discover opportunities in artificial intelligence and machine learning</p>
            </div>
            {!isFreelancer && (
              <Link href="/post-job" className="bg-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-100" style={{color: '#0D9E86'}}>
                Post a Job
              </Link>
            )}
          </div>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="card p-4 sticky top-24">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">Filter Jobs</h3>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value, subcategory: ''})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory Filter */}
              {filters.category && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategory</label>
                  <select
                    value={filters.subcategory}
                    onChange={(e) => setFilters({...filters, subcategory: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    disabled={subcategoriesLoading}
                  >
                    <option value="">All Subcategories</option>
                    {subcategories.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                  {subcategoriesLoading && (
                    <div className="text-xs text-gray-500 mt-1">Loading subcategories...</div>
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Level</label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => setFilters({...filters, experienceLevel: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Levels</option>
                  <option value="entry">Entry Level</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Job Type</label>
                <select
                  value={filters.jobType}
                  onChange={(e) => setFilters({...filters, jobType: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Range</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minBudget}
                    onChange={(e) => setFilters({...filters, minBudget: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxBudget}
                    onChange={(e) => setFilters({...filters, maxBudget: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Likes</label>
                <input
                  type="number"
                  placeholder="Min likes..."
                  value={filters.minLikes}
                  onChange={(e) => setFilters({...filters, minLikes: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                onClick={() => setFilters({
                  search: '',
                  category: '',
                  subcategory: '',
                  experienceLevel: '',
                  jobType: '',
                  minBudget: '',
                  maxBudget: '',
                  minLikes: ''
                })}
                className="w-full text-primary py-1.5 px-3 text-sm rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:w-3/4">
            <div className="card">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Available Jobs</h2>
                  <p className="text-gray-600 dark:text-gray-400">{filteredJobs.length} jobs found</p>
                </div>
                {/* Role-based action: only clients can post jobs */}
                {(!isFreelancer) && (
                  <Link href="/post-job" className="btn-primary">Post Job</Link>
                )}
              </div>
              
              <div className="p-6">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No jobs found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {paginatedJobs.map(job => (
                      <div key={job.id} className="card p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-3">
                          <div className="flex-1 min-w-0">
                            <Link href={`/jobs/${job.id}`} className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-primary block">
                              <span className="line-clamp-2">{job.title}</span>
                            </Link>
                            <div className="flex flex-col sm:flex-row sm:items-center mt-2 text-sm text-gray-600 dark:text-gray-400 gap-2">
                              <div className="flex items-center">
                                <Link href={`/clients/${job.client?.id || ''}`} className="flex items-center">
                                  <Avatar
                                    src={(job.client as any)?.profile_picture}
                                    avatarType={((job.client as any)?.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                                    selectedAvatar={(job.client as any)?.selected_avatar}
                                    googlePhotoUrl={(job.client as any)?.google_photo_url}
                                    size="sm"
                                    alt={job.client?.first_name || 'Client'}
                                    className="mr-2"
                                  />
                                </Link>
                                <Link href={`/clients/${job.client?.id || ''}`} className="truncate hover:text-primary">
                                  Posted by {job.client?.first_name || ''} {job.client?.last_name || job.client?.username || 'Client'}
                                </Link>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                                <span>• {job.category?.name || 'Uncategorized'}</span>
                                <span>• {job.experience_level}</span>
                                <span>• {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <div className="text-base sm:text-lg font-bold text-primary">
                              ${job.budget_min} - ${job.budget_max}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{job.job_type}</div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{job.description}</p>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400 min-w-0">
                            <span className="truncate">Skills: {job.skills_required}</span>
                            <div className="flex gap-2 text-xs sm:text-sm">
                              <span>• Proposals: {job.proposal_count}</span>
                              <span>• Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <LikeButton
                              contentType="job"
                              objectId={job.id}
                              initialLikes={job.likes_count || 0}
                              initialDislikes={job.dislikes_count || 0}
                              size="sm"
                            />
                            {isFreelancer && (
                              <Link href={`/jobs/${job.id}/propose`} className="btn-primary text-center flex-shrink-0">
                                Submit Proposal
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}