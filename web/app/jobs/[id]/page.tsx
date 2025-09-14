'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import { Job } from '@/types';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
    setUserProfile(getProfile());
    loadJobDetails();
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}/`);
      setJob(response.data);
    } catch (error) {
      console.error('Error loading job:', error);
      toast.error('Job not found');
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProposal = () => {
    if (!isLoggedIn) {
      toast.error('Please login to submit a proposal');
      router.push('/auth');
      return;
    }

    if (userProfile?.user_type === 'client') {
      toast.error('Only freelancers can submit proposals');
      return;
    }

    router.push(`/jobs/${jobId}/propose`);
  };

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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Job Not Found</h1>
            <Link href="/jobs" className="btn-primary">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isJobOwner = isLoggedIn && userProfile?.id === job?.client?.id;
  const canSubmitProposal = isLoggedIn && userProfile?.user_type !== 'client' && !isJobOwner && job?.status === 'open';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Job Header */}
            <div className="card p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 break-words">{job.title}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <Link href={`/clients/${job.client?.id || ''}`} className="hover:text-primary">
                        {job.client?.first_name || ''} {job.client?.last_name || job.client?.username || 'Client'}
                      </Link>
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Posted {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {job.proposal_count} proposals
                    </span>
                    {job.location && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      job.experience_level === 'entry' ? 'bg-green-100 text-green-800' :
                      job.experience_level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                      {job.job_type === 'fixed' ? 'Fixed Price' : 'Hourly'}
                    </span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                      {job.category?.name || 'Uncategorized'}
                    </span>
                    {/* Subcategories */}
                    {((job as any).subcategories) && ((job as any).subcategories).length > 0 && (
                      ((job as any).subcategories).slice(0, 2).map((sub: any, index: number) => (
                        <span key={sub.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                          {sub.name}
                        </span>
                      ))
                    )}
                    {((job as any).subcategories) && ((job as any).subcategories).length > 2 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        +{((job as any).subcategories).length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Project Description</h3>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words overflow-hidden">
                {job.description}
              </div>
            </div>

            {/* Subcategories */}
            {((job as any).subcategories) && ((job as any).subcategories).length > 0 && (
              <div className="card p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Subcategories</h3>
                <div className="flex flex-wrap gap-2">
                  {((job as any).subcategories).map((sub: any) => (
                    <span key={sub.id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                      {sub.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills Required */}
            <div className="card p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills_required?.split(',').map((skill, index) => (
                  <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Attachments */}
            {job.attachments && (
              <div className="card p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Attachments</h3>
                <a 
                  href={job.attachments} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-primary hover:text-primary/80"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Download attachment
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Budget & Timeline */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Budget & Timeline</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-primary break-words">
                    ${job.budget_min} - ${job.budget_max}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{job.job_type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Deadline:</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Experience Level:</div>
                  <div className="font-semibold capitalize text-gray-900 dark:text-gray-100">{job.experience_level}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Proposals:</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{job.proposal_count}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Actions</h3>
              {!isLoggedIn ? (
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Login to submit a proposal</p>
                  <Link href="/auth" className="btn-primary w-full">
                    Login / Sign Up
                  </Link>
                </div>
              ) : isJobOwner ? (
                <div className="space-y-3">
                  <Link href={`/my-jobs`} className="btn-primary w-full">
                    Manage This Job
                  </Link>
                  <Link href={`/jobs/${jobId}/progress`} className="btn-secondary w-full">
                    View Proposals
                  </Link>
                </div>
              ) : canSubmitProposal ? (
                <div className="space-y-3">
                  <button onClick={handleSubmitProposal} className="btn-primary w-full">
                    Submit Proposal
                  </button>
                </div>
              ) : userProfile?.user_type === 'client' ? (
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Clients cannot submit proposals</p>
                  <Link href="/post-job" className="btn-primary w-full">
                    Post Your Own Job
                  </Link>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Job is no longer accepting proposals</p>
                  <Link href="/jobs" className="btn-secondary w-full">
                    Browse Other Jobs
                  </Link>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">About the Client</h3>
              <div className="flex items-center space-x-3 mb-4">
                <Link href={`/clients/${job.client?.id || ''}`} className="flex items-center">
                  <Avatar
                    src={job.client?.profile_picture || job.client?.profile?.profile_picture}
                    avatarType={(job.client?.avatar_type || job.client?.profile?.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                    selectedAvatar={job.client?.selected_avatar || job.client?.profile?.selected_avatar || 'user'}
                    googlePhotoUrl={job.client?.google_photo_url || job.client?.profile?.google_photo_url}
                    size="md"
                    alt={job.client?.first_name || 'Client'}
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    <Link href={`/clients/${job.client?.id || ''}`} className="hover:text-primary">
                      {job.client?.first_name || ''} {job.client?.last_name || job.client?.username || 'Client'}
                    </Link>
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Client</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Member since:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {job.client?.date_joined ? new Date(job.client.date_joined).getFullYear() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Jobs posted:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}