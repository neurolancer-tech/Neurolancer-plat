'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import { UserProfile } from '@/types';
import api from '@/lib/api';
import { profileApi } from '@/lib/profileApi';
import Pagination from '@/components/Pagination';

export default function ClientsPage() {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    industry: '',
    company_size: '',
    budget_range: '',
    sortBy: 'recent'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 12;

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      // Get all users with client type
      const response = await api.get('/users/?user_type=client');
      const clientsData = response.data.results || response.data;
      
      // Enhance with professional profiles
      const enhancedClients = await Promise.all(
        clientsData.map(async (client: any) => {
          try {
            const professionalProfile = await profileApi.getClientProfileById(client.id);
            return { ...client, professionalProfile };
          } catch {
            return client;
          }
        })
      );
      
      setClients(enhancedClients);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.first_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         client.last_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                         (client as any).professionalProfile?.company_name?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesIndustry = !filters.industry || (client as any).professionalProfile?.industry === filters.industry;
    const matchesCompanySize = !filters.company_size || (client as any).professionalProfile?.company_size === filters.company_size;
    const matchesBudget = !filters.budget_range || (client as any).professionalProfile?.project_budget_range === filters.budget_range;
    
    return matchesSearch && matchesIndustry && matchesCompanySize && matchesBudget;
  });

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);
  const startIndex = (currentPage - 1) * clientsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + clientsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
          <h1 className="text-4xl font-bold mb-4">Browse Clients</h1>
          <p className="text-xl mb-6">Connect with companies looking for AI expertise</p>
        </div>
      </section>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="card p-4 sticky top-24">
              <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-gray-100">Filter Clients</h3>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Industry</label>
                <select
                  value={filters.industry}
                  onChange={(e) => setFilters({...filters, industry: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Industries</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="consulting">Consulting</option>
                  <option value="media">Media & Entertainment</option>
                  <option value="nonprofit">Non-profit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Company Size</label>
                <select
                  value={filters.company_size}
                  onChange={(e) => setFilters({...filters, company_size: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Sizes</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Budget Range</label>
                <select
                  value={filters.budget_range}
                  onChange={(e) => setFilters({...filters, budget_range: e.target.value})}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Budgets</option>
                  <option value="under_1k">Under $1,000</option>
                  <option value="1k_5k">$1,000 - $5,000</option>
                  <option value="5k_10k">$5,000 - $10,000</option>
                  <option value="10k_25k">$10,000 - $25,000</option>
                  <option value="25k_50k">$25,000 - $50,000</option>
                  <option value="50k_plus">$50,000+</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({
                  search: '',
                  industry: '',
                  company_size: '',
                  budget_range: '',
                  sortBy: 'recent'
                })}
                className="w-full text-primary py-1.5 px-3 text-sm rounded-lg border border-primary hover:bg-primary hover:text-white transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Clients List */}
          <div className="lg:w-3/4">
            <div className="card">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Active Clients</h2>
                  <p className="text-gray-600 dark:text-gray-400">{filteredClients.length} clients found</p>
                </div>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="input-field w-auto"
                >
                  <option value="recent">Recently Joined</option>
                  <option value="company_name">Company Name</option>
                  <option value="industry">Industry</option>
                </select>
              </div>
              
              <div className="p-6">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No clients found</h3>
                    <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedClients.map(client => (
                      <div key={client.id} className="card p-6 hover:shadow-md transition-shadow">
                        <div className="text-center mb-4">
                          <Avatar
                            src={(client as any).profile_picture}
                            avatarType={(client as any).avatar_type || 'avatar'}
                            selectedAvatar={(client as any).selected_avatar}
                            googlePhotoUrl={(client as any).google_photo_url}
                            size="lg"
                            className="mx-auto mb-3"
                          />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {client.first_name} {client.last_name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                        </div>

                        {(client as any).professionalProfile && (
                          <div className="mb-4">
                            <div className="text-center mb-3">
                              <h4 className="font-medium text-blue-600 dark:text-blue-400">
                                {(client as any).professionalProfile.company_name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {(client as any).professionalProfile.industry}
                              </p>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Size:</span>
                                <span className="font-medium">{(client as any).professionalProfile.company_size}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                                <span className="font-medium text-green-600">
                                  {(client as any).professionalProfile.project_budget_range?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Not specified'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <Link href={`/clients/${client.id}`} className="flex-1 btn-primary text-center text-sm py-2">
                            View Profile
                          </Link>
                          <Link href={`/messages?user=${client.id}`} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-center transition-colors text-sm">
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