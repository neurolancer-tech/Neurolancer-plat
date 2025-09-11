'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import LikeButton from '@/components/LikeButton';
import EditJobModal from '@/components/EditJobModal';
import { Job, Proposal } from '@/types';
import { isAuthenticated, getProfile, getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function MyJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [totalJobLikes, setTotalJobLikes] = useState(0);
  const [totalJobDislikes, setTotalJobDislikes] = useState(0);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showProposals, setShowProposals] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingJob, setRatingJob] = useState<Job | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    // Allow both clients and freelancers to access this page
    // Clients see jobs they posted, freelancers see jobs they're working on

    loadJobs();
  }, [router]);

  const loadJobs = async () => {
    try {
      const response = await api.get('/jobs/my/');
      const jobsData = response.data.results || response.data;
      setJobs(jobsData);
      
      // Calculate total likes and dislikes for all jobs
      const totalLikes = jobsData.reduce((sum: number, job: Job) => sum + (job.likes_count || 0), 0);
      const totalDislikes = jobsData.reduce((sum: number, job: Job) => sum + (job.dislikes_count || 0), 0);
      setTotalJobLikes(totalLikes);
      setTotalJobDislikes(totalDislikes);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };



  const loadProposals = async (jobId: number) => {
    try {
      const response = await api.get(`/jobs/${jobId}/proposals/`);
      setProposals(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading proposals:', error);
    }
  };

  const handleAcceptProposal = async (proposalId: number) => {
    try {
      await api.post(`/proposals/${proposalId}/accept/`);
      toast.success('Proposal accepted successfully!');
      loadJobs();
      loadProposals(selectedJob!.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to accept proposal');
    }
  };

  const handleRejectProposal = async (proposalId: number) => {
    try {
      await api.post(`/proposals/${proposalId}/reject/`);
      toast.success('Proposal rejected');
      loadProposals(selectedJob!.id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reject proposal');
    }
  };

  const handlePayForJob = (job: Job) => {
    // Navigate to checkout page with job details
    router.push(`/checkout?type=job&id=${job.id}&amount=${job.budget_max}&title=${encodeURIComponent(job.title)}`);
  };

  const handleRequestPayment = async (job: Job) => {
    try {
      const response = await api.post(`/jobs/${job.id}/request-payment/`);
      
      if (response.data.message) {
        toast.success('Payment request sent to client!');
        loadJobs();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to request payment');
    }
  };

  const handleRateFreelancer = (job: Job) => {
    setRatingJob(job);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!ratingJob) return;
    
    try {
      // Find the accepted proposal for this job
      const jobProposals = await api.get(`/jobs/${ratingJob.id}/proposals/`);
      const acceptedProposal = jobProposals.data.find((p: any) => p.status === 'accepted');
      
      if (!acceptedProposal) {
        toast.error('No accepted proposal found for this job');
        return;
      }

      await api.post('/reviews/', {
        freelancer: acceptedProposal.freelancer.id,
        job: ratingJob.id,
        rating: rating,
        review_text: reviewText
      });
      
      toast.success('Rating submitted successfully!');
      setShowRatingModal(false);
      setRatingJob(null);
      setRating(5);
      setReviewText('');
      loadJobs();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit rating');
    }
  };

  const handleContactFreelancer = async (freelancerId: number) => {
    try {
      const response = await api.post('/conversations/start/', {
        user_id: freelancerId
      });
      
      if (response.data) {
        router.push(`/messages?conversation=${response.data.id}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const viewProposals = (job: Job) => {
    setSelectedJob(job);
    loadProposals(job.id);
    setShowProposals(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setShowEditModal(true);
  };

  const handleJobUpdated = () => {
    loadJobs();
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return job.status === 'open';
    if (activeTab === 'in_progress') return job.status === 'in_progress';
    if (activeTab === 'completed') return job.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const profile = getProfile();
  const isJobOwner = (job: Job) => job.client?.id === getUser()?.id;

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">My Jobs</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your posted jobs and proposals</p>
            <div className="flex items-center space-x-4 mt-2 text-sm">
              <div className="flex items-center text-green-600">
                <span className="mr-1">👍</span>
                <span>{totalJobLikes} Job Likes</span>
              </div>
              <div className="flex items-center text-red-600">
                <span className="mr-1">👎</span>
                <span>{totalJobDislikes} Job Dislikes</span>
              </div>
            </div>
          </div>
          <Link href="/post-job" className="btn-primary">
            Post New Job
          </Link>
        </div>

        {/* Tabs */}
        <div className="card mb-8">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Jobs' },
                { key: 'open', label: 'Open' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No jobs posted yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Start by posting your first job</p>
                <Link href="/post-job" className="btn-primary">
                  Post Your First Job
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div key={job.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <Link 
                          href={`/jobs/${job.id}`}
                          className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary"
                        >
                          {job.title}
                        </Link>
                        <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                          <span>{job.category?.name || 'Uncategorized'}</span>
                          <span className="mx-2">•</span>
                          <span>{job.experience_level}</span>
                          <span className="mx-2">•</span>
                          <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          ${job.budget_min} - ${job.budget_max}
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">{job.description}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>Proposals: {job.proposal_count}</span>
                        <span>• Skills: {job.skills_required}</span>
                        <span>• Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                      </div>
                      <LikeButton
                        contentType="job"
                        objectId={job.id}
                        initialLikes={job.likes_count || 0}
                        initialDislikes={job.dislikes_count || 0}
                        size="sm"
                      />
                    </div>
                    <div className="flex justify-end">
                      <div className="flex space-x-2">
                        {job.proposal_count > 0 && (
                          <button
                            onClick={() => viewProposals(job)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                          >
                            View Proposals ({job.proposal_count})
                          </button>
                        )}
                        {job.status === 'completed' && isJobOwner(job) && (
                          <>
                            <button
                              onClick={() => handlePayForJob(job)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              Process Payment
                            </button>
                            {job.is_paid && (
                              <button
                                onClick={() => handleRateFreelancer(job)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                                Rate Freelancer
                              </button>
                            )}
                          </>
                        )}
                        {job.status === 'completed' && !isJobOwner(job) && (
                          <button
                            onClick={() => handleRequestPayment(job)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Request Payment
                          </button>
                        )}
                        <Link 
                          href={`/jobs/${job.id}/progress`}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Update Progress
                        </Link>
                        <button
                          onClick={() => handleEditJob(job)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Proposals Modal */}
      {showProposals && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Proposals for &quot;{selectedJob.title}&quot;
                </h2>
                <button
                  onClick={() => setShowProposals(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {proposals.map(proposal => (
                  <div key={proposal.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {proposal.freelancer.first_name} {proposal.freelancer.last_name}
                        </h3>
                        <div className="text-sm text-gray-600">
                          Submitted {new Date(proposal.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">${proposal.proposed_price}</div>
                        <div className="text-sm text-gray-600">{proposal.delivery_time} days</div>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4">{proposal.cover_letter}</p>

                    {proposal.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptProposal(proposal.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectProposal(proposal.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {proposal.status === 'accepted' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleContactFreelancer(proposal.freelancer.id)}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                        >
                          Contact Freelancer
                        </button>
                        <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                          Accepted
                        </span>
                      </div>
                    )}
                    {proposal.status === 'rejected' && (
                      <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800">
                        Rejected
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Job Modal */}
      {showEditModal && editingJob && (
        <EditJobModal
          job={editingJob}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingJob(null);
          }}
          onJobUpdated={handleJobUpdated}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && ratingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Rate Freelancer
                </h2>
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{ratingJob.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">How was your experience with this freelancer?</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`text-2xl ${
                        star <= rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Share your experience working with this freelancer..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRating}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}