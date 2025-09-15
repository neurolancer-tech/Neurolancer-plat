'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import { UserProfile } from '@/types';
import api from '@/lib/api';
import { profileApi } from '@/lib/profileApi';
import Pagination from '@/components/Pagination';


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
    category: '',
    subcategory: '',
    sortBy: 'rating'
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const freelancersPerPage = 9;

  useEffect(() => {
    loadFreelancers();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // Try the new endpoint first, fallback to existing categories
      let categoriesData = [];
      try {
        const response = await api.get('/categories-with-subcategories/');
        categoriesData = response.data;
      } catch {
        // Fallback to existing categories endpoint
        const response = await api.get('/categories/');
        categoriesData = response.data.results || response.data || [];
        
        // Try to get subcategories for each category
        for (const category of categoriesData) {
          try {
            const subResponse = await api.get(`/subcategories/?category=${category.id}`);
            category.subcategories = subResponse.data.results || subResponse.data || [];
          } catch {
            category.subcategories = [];
          }
        }
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    }
  };

  useEffect(() => {
    if (filters.category) {
      const selectedCategory = categories.find(cat => cat.id.toString() === filters.category);
      setSubcategories(selectedCategory?.subcategories || []);
    } else {
      setSubcategories([]);
    }
    setFilters(prev => ({ ...prev, subcategory: '' }));
  }, [filters.category, categories]);

  const loadFreelancers = async () => {
    try {
      // Get all users and filter for those with freelancer profiles or current freelancer role
      const response = await api.get('/users/');
      const usersData = response.data.results || response.data;
      
      // Filter and enhance with professional profiles
      const freelancersWithProfiles = [];
      
      for (const user of usersData) {
        try {
          // Try to get freelancer profile
          const professionalProfile = await profileApi.getFreelancerProfileById(user.id);
          
          // Create freelancer object structure
          const freelancerData = {
            id: user.id,
            user: user,
            user_type: user.user_type || 'freelancer',
            bio: user.bio || professionalProfile.bio || '',
            skills: user.skills || professionalProfile.skills || '',
            hourly_rate: user.hourly_rate || professionalProfile.hourly_rate || 0,
            total_earnings: user.total_earnings || 0,
            rating: user.rating || 0,
            total_reviews: user.total_reviews || 0,
            likes_count: user.likes_count || 0,
            dislikes_count: user.dislikes_count || 0,
            profile_picture: user.profile_picture,
            avatar_type: user.avatar_type,
            selected_avatar: user.selected_avatar,
            google_photo_url: user.google_photo_url,
            onboarding_response: user.onboarding_response,
            professionalProfile
          };
          
          freelancersWithProfiles.push(freelancerData);
        } catch {
          // If user has freelancer role but no professional profile, still include them
          if (user.user_type === 'freelancer' || user.user_type === 'both') {
            const freelancerData = {
              id: user.id,
              user: user,
              user_type: user.user_type,
              bio: user.bio || '',
              skills: user.skills || '',
              hourly_rate: user.hourly_rate || 0,
              total_earnings: user.total_earnings || 0,
              rating: user.rating || 0,
              total_reviews: user.total_reviews || 0,
              likes_count: user.likes_count || 0,
              dislikes_count: user.dislikes_count || 0,
              profile_picture: user.profile_picture,
              avatar_type: user.avatar_type,
              selected_avatar: user.selected_avatar,
              google_photo_url: user.google_photo_url,
              onboarding_response: user.onboarding_response
            };
            
            freelancersWithProfiles.push(freelancerData);
          }
        }
      }
      
      setFreelancers(freelancersWithProfiles);
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
      
      // Category and subcategory filtering based on onboarding data
      let matchesCategory = true;
      let matchesSubcategory = true;
      
      if (filters.category || filters.subcategory) {
        const onboardingData = (freelancer as any).onboarding_response;
        if (onboardingData?.interested_subcategories) {
          if (filters.category) {
            const categorySubcategories = categories.find(cat => cat.id.toString() === filters.category)?.subcategories || [];
            const categorySubcategoryIds = categorySubcategories.map((sub: any) => sub.id);
            matchesCategory = onboardingData.interested_subcategories.some((sub: any) => 
              categorySubcategoryIds.includes(sub.id)
            );
          }
          
          if (filters.subcategory) {
            matchesSubcategory = onboardingData.interested_subcategories.some((sub: any) => 
              sub.id.toString() === filters.subcategory
            );
          }
        } else {
          matchesCategory = false;
          matchesSubcategory = false;
        }
      }
      
      return matchesSearch && matchesSkills && matchesMinRate && matchesMaxRate && matchesRating && matchesMinLikes && matchesCategory && matchesSubcategory;
    });
  }, [freelancers, filters, categories]);

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

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {subcategories.length > 0 && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subcategory</label>
                  <select
                    value={filters.subcategory}
                    onChange={(e) => setFilters({...filters, subcategory: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All Subcategories</option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setFilters({
                  search: '',
                  skills: '',
                  minRate: '',
                  maxRate: '',
                  rating: '',
                  minLikes: '',
                  category: '',
                  subcategory: '',
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
                          {((freelancer as any).professionalProfile?.hourly_rate || freelancer.hourly_rate) && (
                            <div className="text-center text-lg font-bold text-primary">
                              ${(freelancer as any).professionalProfile?.hourly_rate || freelancer.hourly_rate}/hr
                            </div>
                          )}
                          {(freelancer as any).professionalProfile?.availability_status && (
                            <div className="text-center mt-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                (freelancer as any).professionalProfile.availability_status === 'available' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : (freelancer as any).professionalProfile.availability_status === 'busy'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {(freelancer as any).professionalProfile.availability_status === 'available' ? '🟢 Available' :
                                 (freelancer as any).professionalProfile.availability_status === 'busy' ? '🟡 Busy' : '🔴 Unavailable'}
                              </span>
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

                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                          {(freelancer as any).professionalProfile?.bio || freelancer.bio}
                        </p>

                        <div className="mb-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Skills:</div>
                          <div className="flex flex-wrap gap-1">
                            {((freelancer as any).professionalProfile?.skills || freelancer.skills).split(',').slice(0, 3).map((skill: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {(freelancer as any).professionalProfile?.experience_years && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Experience:</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {(freelancer as any).professionalProfile.experience_years} years
                            </div>
                          </div>
                        )}

                        {(freelancer as any).onboarding_response?.interested_subcategories && (freelancer as any).onboarding_response.interested_subcategories.length > 0 && (
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Expertise:</div>
                            <div className="flex flex-wrap gap-1">
                              {(freelancer as any).onboarding_response.interested_subcategories.slice(0, 2).map((sub: any) => (
                                <span key={sub.id} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded">
                                  {sub.name.length > 30 ? sub.name.substring(0, 30) + '...' : sub.name}
                                </span>
                              ))}
                              {(freelancer as any).onboarding_response.interested_subcategories.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                                  +{(freelancer as any).onboarding_response.interested_subcategories.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

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