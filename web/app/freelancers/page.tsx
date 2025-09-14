'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import { UserProfile } from '@/types';
import api from '@/lib/api';
import Pagination from '@/components/Pagination';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Freelancers - Hire Expert AI Professionals | Neurolancer',
  description: 'Find and hire top AI freelancers and experts. Browse profiles of machine learning engineers, data scientists, computer vision specialists, and NLP experts.',
  keywords: 'AI freelancers, machine learning engineers, data scientists, computer vision experts, NLP specialists, AI professionals, hire AI talent',
  openGraph: {
    title: 'AI Freelancers - Hire Expert AI Professionals | Neurolancer',
    description: 'Find and hire top AI freelancers and experts. Browse profiles of machine learning engineers, data scientists, and AI specialists.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Freelancers - Hire Expert AI Professionals | Neurolancer',
    description: 'Find and hire top AI freelancers and experts. Browse profiles of machine learning engineers, data scientists, and AI specialists.',
  },
};

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    minRate: '',
    maxRate: '',
    rating: '',
    minLikes: '',
    sortBy: 'rating'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const freelancersPerPage = 9;

  useEffect(() => {
    loadFreelancers();
  }, []);

  const loadFreelancers = async () => {
    try {
      const response = await api.get('/freelancers/');
      setFreelancers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFreelancers = useMemo(() => {
    return freelancers.filter(freelancer => {
      const matchesSearch = freelancer.user.first_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           freelancer.user.last_name.toLowerCase().includes(filters.search.toLowerCase()) ||
                           freelancer.bio.toLowerCase().includes(filters.search.toLowerCase());
      const matchesSkills = !filters.skills || freelancer.skills.toLowerCase().includes(filters.skills.toLowerCase());
      const matchesMinRate = !filters.minRate || ((freelancer.hourly_rate || 0) >= parseFloat(filters.minRate));
      const matchesMaxRate = !filters.maxRate || ((freelancer.hourly_rate || 0) <= parseFloat(filters.maxRate));
      const matchesRating = !filters.rating || (freelancer.rating || 0) >= parseFloat(filters.rating);
      const matchesMinLikes = !filters.minLikes || ((freelancer.likes_count || 0) >= parseInt(filters.minLikes));
      
      return matchesSearch && matchesSkills && matchesMinRate && matchesMaxRate && matchesRating && matchesMinLikes;
    });
  }, [freelancers, filters]);

  const sortedFreelancers = useMemo(() => {
    const arr = [...filteredFreelancers];
    const key = filters.sortBy;
    const getVal = (f: UserProfile, k: string) => {
      switch (k) {
        case 'rating': return f.rating || 0;
        case 'total_reviews': return f.total_reviews || 0;
        case 'hourly_rate': return f.hourly_rate || 0;
        case 'likes_count': return f.likes_count || 0;
        default: return 0;
      }
    };
    if (key.startsWith('-')) {
      const k = key.slice(1);
      arr.sort((a,b) => getVal(b,k) - getVal(a,k));
    } else {
      arr.sort((a,b) => getVal(a,key) - getVal(b,key));
    }
    return arr;
  }, [filteredFreelancers, filters.sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedFreelancers.length / freelancersPerPage);
  const startIndex = (currentPage - 1) * freelancersPerPage;
  const paginatedFreelancers = sortedFreelancers.slice(startIndex, startIndex + freelancersPerPage);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl font-bold mb-4">Find AI Experts</h1>
          <p className="text-xl mb-6">Connect with skilled AI professionals and freelancers</p>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="card p-4 sticky top-24">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">Filter Freelancers</h3>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search freelancers..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
                <input
                  type="text"
                  placeholder="Skills..."
                  value={filters.skills}
                  onChange={(e) => setFilters({...filters, skills: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minRate}
                    onChange={(e) => setFilters({...filters, minRate: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxRate}
                    onChange={(e) => setFilters({...filters, maxRate: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({...filters, rating: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4.8">4.8+ Stars</option>
                </select>
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
                  skills: '',
                  minRate: '',
                  maxRate: '',
                  rating: '',
                  minLikes: '',
                  sortBy: 'rating'
                })}
                className="w-full text-primary py-1.5 px-3 text-sm rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Freelancers List */}
          <div className="lg:w-3/4">
            <div className="card">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Experts</h2>
                  <p className="text-gray-600 dark:text-gray-400">{filteredFreelancers.length} freelancers found</p>
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="input-field w-auto"
>
                  <option value="-rating">Highest Rated</option>
                  <option value="-total_reviews">Most Reviews</option>
                  <option value="hourly_rate">Hourly Rate (Low to High)</option>
                  <option value="-hourly_rate">Hourly Rate (High to Low)</option>
                  <option value="-likes_count">Most Liked</option>
                </select>
              </div>
              
              <div className="p-6">
                {filteredFreelancers.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No freelancers found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search terms</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedFreelancers.map(freelancer => (
                      <div key={freelancer.id} className="card p-6 hover:shadow-md transition-shadow">
                        <div className="text-center mb-4">
                          <Avatar
                            src={freelancer.profile_picture}
                            avatarType={(freelancer.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                            selectedAvatar={freelancer.selected_avatar}
                            googlePhotoUrl={freelancer.google_photo_url}
                            size="lg"
                            className="mx-auto mb-3"
                          />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {freelancer.user.first_name} {freelancer.user.last_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{freelancer.user_type}</p>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-center justify-center mb-2">
                            <span className="text-yellow-400 mr-1">★</span>
                            <span className="font-medium">{freelancer.rating}</span>
                            <span className="text-gray-600 dark:text-gray-400 ml-1">({freelancer.total_reviews} reviews)</span>
                          </div>
                          {freelancer.hourly_rate && (
                            <div className="text-center text-lg font-bold text-primary">
                              ${freelancer.hourly_rate}/hr
                            </div>
                          )}
                          <div className="flex justify-center mt-2">
                            <LikeButton
                              contentType="freelancer"
                              objectId={freelancer.user.id}
                              initialLikes={freelancer.likes_count || 0}
                              initialDislikes={freelancer.dislikes_count || 0}
                              size="sm"
                            />
                          </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">{freelancer.bio}</p>

                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Skills:</div>
                          <div className="flex flex-wrap gap-1">
                            {freelancer.skills.split(',').slice(0, 3).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Link href={`/freelancer/${freelancer.user.id}`} className="flex-1 btn-primary text-center text-sm py-2">
                            View Profile
                          </Link>
                          <Link href={`/messages?user=${freelancer.user.id}`} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center transition-colors text-sm">
                            Message
                          </Link>
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