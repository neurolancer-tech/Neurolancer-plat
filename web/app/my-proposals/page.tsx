'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Proposal } from '@/types';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function MyProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    if (profile?.user_type === 'client') {
      toast.error('Only freelancers can view proposals');
      router.push('/jobs');
      return;
    }

    loadProposals();
  }, [router]);

  const loadProposals = async () => {
    try {
      const response = await api.get('/proposals/my/');
      setProposals(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading proposals:', error);
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const withdrawProposal = async (proposalId: number) => {
    if (!confirm('Are you sure you want to withdraw this proposal?')) return;

    try {
      await api.patch(`/proposals/${proposalId}/update-status/`, {
        status: 'withdrawn'
      });
      toast.success('Proposal withdrawn successfully');
      loadProposals();
    } catch (error) {
      console.error('Error withdrawing proposal:', error);
      toast.error('Failed to withdraw proposal');
    }
  };

  const updateJobStatus = async (jobId: number, status: string, message?: string) => {
    try {
      await api.post(`/jobs/${jobId}/update-status/`, {
        status,
        message: message || `Job status updated to ${status.replace('_', ' ')}`
      });
      toast.success('Job status updated successfully!');
      loadProposals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update job status');
    }
  };

  const completeWork = async (jobId: number) => {
    const notes = prompt('Enter delivery notes for the client (optional):');
    try {
      await api.post(`/jobs/${jobId}/complete/`, {
        notes: notes || 'Work completed and delivered'
      });
      toast.success('Work marked as completed!');
      loadProposals();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to complete work');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    if (filter === 'all') return true;
    return proposal.status === filter;
  });

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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Proposals</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Track your submitted job proposals</p>
          </div>
          <Link href="/jobs" className="btn-primary">
            Browse Jobs
          </Link>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All ({proposals.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'pending' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pending ({proposals.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'accepted' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Accepted ({proposals.filter(p => p.status === 'accepted').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === 'rejected' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Rejected ({proposals.filter(p => p.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Proposals List */}
        <div className="space-y-6">
          {filteredProposals.map(proposal => (
            <div key={proposal.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Link 
                    href={`/jobs/${proposal.job?.id}`} 
                    className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-primary"
                  >
                    {proposal.job?.title || 'Job Title'}
                  </Link>
                  <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="mr-4">Client: {proposal.job?.client?.first_name || ''} {proposal.job?.client?.last_name || proposal.job?.client?.username || 'Client'}</span>
                    <span className="mr-4">• Submitted: {proposal.created_at ? new Date(proposal.created_at).toLocaleDateString() : 'N/A'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    ${proposal.proposed_price}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{proposal.delivery_time} days</div>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">{proposal.cover_letter}</p>
              
              {proposal.questions && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Questions for Client:</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{proposal.questions}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Budget: ${proposal.job?.budget_min} - ${proposal.job?.budget_max}</span>
                  <span>• Category: {proposal.job?.category?.name || 'Uncategorized'}</span>
                  <span>• Proposals: {proposal.job?.proposal_count || 0}</span>
                </div>
                <div className="flex space-x-2">
                  {proposal.status === 'pending' && (
                    <button
                      onClick={() => withdrawProposal(proposal.id)}
                      className="px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
                    >
                      Withdraw
                    </button>
                  )}
                  {proposal.status === 'accepted' && (
                    <>
                      {proposal.job?.status === 'in_progress' && (
                        <button
                          onClick={() => completeWork(proposal.job!.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Mark Complete
                        </button>
                      )}
                      {proposal.job?.status === 'open' && (
                        <button
                          onClick={() => updateJobStatus(proposal.job!.id, 'in_progress', 'Work has started on this job')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          Start Work
                        </button>
                      )}
                      <Link
                        href={`/orders`}
                        className="btn-primary text-sm"
                      >
                        View Order
                      </Link>
                    </>
                  )}
                  <Link
                    href={`/jobs/${proposal.job?.id}`}
                    className="btn-secondary text-sm"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4">
              {filter === 'all' ? 'No proposals yet' : `No ${filter} proposals`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filter === 'all' 
                ? 'Start by browsing available jobs and submitting proposals'
                : `You don't have any ${filter} proposals at the moment`
              }
            </p>
            <Link href="/jobs" className="btn-primary">
              Browse Jobs
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}