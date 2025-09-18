"use client";

import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import api from "@/lib/api";
import { profileApi, ClientProfile as ProfessionalClientProfile } from "@/lib/profileApi";
import { useParams } from "next/navigation";
import { getProfile } from "@/lib/auth";

interface ClientUser {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email?: string;
}

interface ClientStats {
  user: ClientUser;
  user_type: string;
  total_orders?: number;
  active_orders?: number;
  pending_orders?: number;
  completed_orders?: number;
  total_spent?: number;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: '👤' },
  { id: 'professional', label: 'Company Profile', icon: '🏢' },
  { id: 'projects', label: 'Project History', icon: '📊' }
];

export default function ClientDetailsPage() {
  const params = useParams();
  const userId = Number(params.id);
  const [data, setData] = useState<ClientStats | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalClientProfile | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        // Basic user stats endpoint (uses existing user profile view)
        const res = await api.get(`/freelancers/${userId}/`);
        setData(res.data);
        
        // Load professional profile
        try {
          const professionalProfileData = await profileApi.getClientProfileById(userId);
          setProfessionalProfile((professionalProfileData as any)?.profile || professionalProfileData);
        } catch (error) {
          console.log('No professional profile found');
        }
        
        // Load client's jobs (open jobs only by default)
        try {
          const jobsResp = await api.get(`/jobs/?client=${userId}`);
          setJobs(jobsResp.data.results || jobsResp.data || []);
        } catch (e) {
          setJobs([]);
        }
      } catch (e: any) {
        setError(e?.response?.data?.error || "Failed to load client details");
      } finally {
        setLoading(false);
      }
    };
    if (!isNaN(userId)) load();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      {/* Publish reminder for own unpublished client profile */}
      {(() => {
        try {
          const me = getProfile();
          const isOwn = me?.user?.id === (data as any)?.user?.id;
          // Check is_active on professionalProfile if available, else assume published
          const isPublished = (professionalProfile as any)?.is_active !== false;
          if (isOwn && !isPublished) {
            return (
              <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded-lg p-4 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>⚠️</span>
                    <span>Your client profile is unpublished. Toggle “Publish” in Profile Setup to activate and open jobs.</span>
                  </div>
                  <a href="/profile" className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700">Go to Profile</a>
                </div>
              </div>
            );
          }
        } catch {}
        return null;
      })()}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="text-red-600 dark:text-red-400">{error}</div>
        ) : data ? (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8">
              <div className="flex items-center gap-6 mb-6">
                <Avatar size="xl" alt={data.user.first_name || data.user.username} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {data.user.first_name} {data.user.last_name}
                    </h1>
                    {professionalProfile && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        professionalProfile.is_active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {professionalProfile.is_active !== false ? 'Published' : 'Unpublished'}
                      </span>
                    )}
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">@{data.user.username} • Client</p>
                  {professionalProfile?.company_name && (
                    <p className="text-blue-600 dark:text-blue-400 font-medium">
                      {professionalProfile.company_name}
                    </p>
                  )}
                  {professionalProfile?.industry && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {professionalProfile.industry} • {professionalProfile.company_size}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl text-center">
                  <div className="text-sm text-blue-600 dark:text-blue-300">Total Orders</div>
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-200">{data.total_orders ?? 0}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl text-center">
                  <div className="text-sm text-green-600 dark:text-green-300">Active</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-200">{data.active_orders ?? 0}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl text-center">
                  <div className="text-sm text-purple-600 dark:text-purple-300">Completed</div>
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-200">{data.completed_orders ?? 0}</div>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl text-center">
                  <div className="text-sm text-orange-600 dark:text-orange-300">Total Spent</div>
                  <div className="text-2xl font-bold text-orange-700 dark:text-orange-200">${(data.total_spent ?? 0).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8 px-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: '👤' },
                    { id: 'professional', label: 'Company Profile', icon: '🏢' },
                    { id: 'projects', label: 'Project History', icon: '📊' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Client Activity</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">Recently joined</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Projects:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile?.total_projects_posted || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Active Orders:</span>
                            <span className="font-medium text-green-600">{data.active_orders || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Spending Summary</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Total Spent:</span>
                            <span className="font-medium text-green-600">${(professionalProfile?.total_spent || data.total_spent || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Budget Range:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {professionalProfile?.typical_budget ? 
                                professionalProfile.typical_budget.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 
                                'Not specified'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Profile Tab */}
                {activeTab === 'professional' && (
                  <div className="space-y-8">
                    {professionalProfile ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Company Information</h3>
                            <div className="space-y-3">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block text-sm">Company Name</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile.company_name}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block text-sm">Industry</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile.industry}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block text-sm">Company Size</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile.company_size}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Preferences</h3>
                            <div className="space-y-3">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block text-sm">Budget Range</span>
                                <span className="font-medium text-green-600">
                                  {professionalProfile.typical_budget?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400 block text-sm">Communication</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  Not specified
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>



                        {professionalProfile.project_types && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Types</h3>
                            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{professionalProfile.project_types}</p>
                            </div>
                          </div>
                        )}

                        {professionalProfile.website_url && (
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Company Links</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <a href={professionalProfile.website_url} target="_blank" rel="noopener noreferrer" 
                                 className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                                <span className="text-blue-500">🌐</span>
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">Company Website</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Visit website</p>
                                </div>
                              </a>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🏢</div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Company Profile</h3>
                        <p className="text-gray-600 dark:text-gray-400">This client hasn't completed their company profile yet.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Projects Tab */}
                {activeTab === 'projects' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Client Jobs</h3>
                    {jobs.length === 0 ? (
                      <div className="text-center py-12 text-gray-600 dark:text-gray-400">No open jobs at the moment.</div>
                    ) : (
                      <div className="space-y-4">
                        {jobs.map((job: any) => (
                          <div key={job.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 dark:text-gray-100 hover:text-primary block truncate">
                                  {job.title}
                                </Link>
                                <div className="text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-2 mt-1">
                                  <span>{job.category?.name || job.category_name || 'Uncategorized'}</span>
                                  <span>•</span>
                                  <span>{job.experience_level}</span>
                                  <span>•</span>
                                  <span>{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'No deadline'}</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-primary font-bold">${job.budget_min} - ${job.budget_max}</div>
                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {job.status?.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

