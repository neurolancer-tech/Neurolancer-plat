'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import LikeButton from '@/components/LikeButton';
import { Gig, Category } from '@/types';
interface Subcategory {
  id: number;
  category: number;
  name: string;
  description: string;
  created_at: string;
}
import api from '@/lib/api';
import Pagination from '@/components/Pagination';
import { getProfile } from '@/lib/auth';


export default function GigsPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    minLikes: '',
    sortBy: 'created_at'
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const gigsPerPage = 12;

  useEffect(() => {
    loadCategories();
    loadGigs();
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

  const filteredGigs = useMemo(() => {
    return gigs.filter(gig => {
      const matchesSearch = gig.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                           gig.description.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory = !filters.category || gig.category.id.toString() === filters.category;
      const matchesSubcategory = !filters.subcategory || 
        ((gig as any).subcategories && (gig as any).subcategories.some((sub: any) => sub.id.toString() === filters.subcategory));
      const matchesMinPrice = !filters.minPrice || gig.basic_price >= parseFloat(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || gig.basic_price <= parseFloat(filters.maxPrice);
      const matchesRating = !filters.rating || gig.rating >= parseFloat(filters.rating);
      const matchesMinLikes = !filters.minLikes || ((gig.likes_count || 0) >= parseInt(filters.minLikes));
      
      return matchesSearch && matchesCategory && matchesSubcategory && matchesMinPrice && matchesMaxPrice && matchesRating && matchesMinLikes;
    });
  }, [gigs, filters]);

  const sortedGigs = useMemo(() => {
    const arr = [...filteredGigs];
    const key = filters.sortBy;
    const getVal = (g: Gig, k: string) => {
      switch (k) {
        case 'created_at': return g.created_at ? new Date(g.created_at).getTime() : 0;
        case 'basic_price': return g.basic_price || 0;
        case 'rating': return g.rating || 0;
        case 'likes_count': return g.likes_count || 0;
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
  }, [filteredGigs, filters.sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedGigs.length / gigsPerPage);
  const startIndex = (currentPage - 1) * gigsPerPage;
  const paginatedGigs = sortedGigs.slice(startIndex, startIndex + gigsPerPage);

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

  const profile = getProfile();

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
          <h1 className="text-4xl font-bold mb-4">Browse AI Gigs</h1>
          <p className="text-xl mb-6">Find the perfect AI service for your project from expert freelancers</p>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="card p-4 sticky top-24">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">Filter Gigs</h3>
              
              {/* Search */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search gigs..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              {/* Category Filter */}
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

              {/* Price Range */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Price Range</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Rating</label>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({...filters, rating: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>

              {/* Likes Filter */}
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
                  minPrice: '',
                  maxPrice: '',
                  rating: '',
                  minLikes: '',
                  sortBy: 'created_at'
                })}
                className="w-full text-primary py-1.5 px-3 text-sm rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Gigs List */}
          <div className="lg:w-3/4">
            <div className="card">
              {/* Header */}
              <div className="p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Available Gigs</h2>
                  <p className="text-gray-600 dark:text-gray-400">{filteredGigs.length} gigs found</p>
                </div>
                <div className="flex items-center gap-4">
                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="input-field"
                  >
                    <option value="-created_at">Newest First</option>
                    <option value="created_at">Oldest First</option>
                    <option value="basic_price">Price: Low to High</option>
                    <option value="-basic_price">Price: High to Low</option>
                    <option value="-rating">Highest Rated</option>
                    <option value="-likes_count">Most Liked</option>
                  </select>
                  {(() => { const p = getProfile(); return p?.user_type === 'freelancer' ? (
                    <Link href="/create-gig" className="btn-primary whitespace-nowrap">Create Gig</Link>
                  ) : null; })()}
                </div>
              </div>

              {/* Gigs Grid */}
              <div className="p-6">

                {filteredGigs.length === 0 ? (
                  <div className="text-center py-16">
                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No gigs found</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting your search or filters</p>
                    <button
                      onClick={() => setFilters({
                        search: '',
                        category: '',
                        subcategory: '',
                        minPrice: '',
                        maxPrice: '',
                        rating: '',
                        minLikes: '',
                        sortBy: 'created_at'
                      })}
                      className="text-primary hover:text-primary-dark font-medium"
                    >
                      Reset Search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedGigs.map(gig => (
                      <div key={gig.id} className="card rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden cursor-pointer" onClick={() => window.location.href = `/gigs/${gig.id}`}>
                        <div className="h-48 overflow-hidden">
                          <Image
                            src={gig.image || '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg'}
                            alt={gig.title}
                            width={400}
                            height={200}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/assets/images/gigsdefault_imgupscaler.ai_General_2.jpeg';
                            }}
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <Avatar
                              src={gig.freelancer_profile?.profile_picture}
                              size="sm"
                              alt={gig.freelancer.first_name}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{gig.freelancer.first_name} {gig.freelancer.last_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">AI Expert</p>
                            </div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">{gig.title}</h3>
                          
                          {/* Subcategories */}
                          {((gig as any).subcategories) && ((gig as any).subcategories).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {((gig as any).subcategories).slice(0, 2).map((sub: any) => (
                                <span key={sub.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                  {sub.name}
                                </span>
                              ))}
                              {((gig as any).subcategories).length > 2 && (
                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                  +{((gig as any).subcategories).length - 2}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{gig.description}</p>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-1 text-sm">
                              <span className="text-yellow-400">⭐</span>
                              <span className="font-medium">{gig.rating || '5.0'}</span>
                              <span className="text-gray-500 dark:text-gray-400">({gig.total_reviews || 0})</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{gig.basic_delivery_time} days</div>
                          </div>
                          <div className="flex items-center justify-center mb-3">
                            <LikeButton
                              contentType="gig"
                              objectId={gig.id}
                              initialLikes={gig.likes_count || 0}
                              initialDislikes={gig.dislikes_count || 0}
                              size="sm"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-semibold text-primary">From ${gig.basic_price}</div>
                            <div className="flex space-x-1">
                              <button 
                                className="px-2 py-1 border border-primary text-primary rounded text-xs hover:bg-primary hover:text-white transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Contact functionality
                                }}
                              >
                                Contact
                              </button>
                              {(!profile || profile.user_type !== 'freelancer') && (
                                <button 
                                  className="px-2 py-1 bg-primary text-white rounded text-xs hover:bg-primary-dark transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.location.href = `/gigs/${gig.id}`;
                                  }}
                                >
                                  Order Now
                                </button>
                              )}
                            </div>
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