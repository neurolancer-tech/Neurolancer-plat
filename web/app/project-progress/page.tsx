'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Proposal } from '@/types';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

function ProjectProgressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('proposal');
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    message: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    if (profile?.user_type === 'client') {
      toast.error('Only freelancers can manage project progress');
      router.push('/dashboard');
      return;
    }

    if (!proposalId) {
      toast.error('No proposal specified');
      router.push('/my-proposals');
      return;
    }

    loadProposalDetails();
  }, [proposalId, router]);

  const loadProposalDetails = async () => {
    try {
      const response = await api.get('/proposals/my/');
      const proposals = response.data.results || response.data;
      const foundProposal = proposals.find((p: Proposal) => p.id.toString() === proposalId);
      
      if (!foundProposal) {
        toast.error('Proposal not found');
        router.push('/my-proposals');
        return;
      }

      if (foundProposal.status !== 'accepted') {
        toast.error('Can only manage accepted proposals');
        router.push('/my-proposals');
        return;
      }

      setProposal(foundProposal);
      setFormData({
        status: 'in_progress',
        message: ''
      });
    } catch (error) {
      console.error('Error loading proposal:', error);
      toast.error('Failed to load proposal details');
      router.push('/my-proposals');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.message.trim()) {
      toast.error('Please provide a progress message');
      return;
    }
    
    setUpdating(true);
    
    try {
      // Update proposal status
      await api.patch(`/proposals/${proposalId}/update/`, {
        status: formData.status
      });

      // Send progress update to client
      await api.post('/notifications/create/', {
        recipient_id: proposal!.job.client.id,
        title: `Progress Update: ${proposal!.job.title}`,
        message: `${proposal!.freelancer.first_name} updated progress: ${formData.message}`,
        notification_type: 'project_progress'
      });
      
      toast.success('Progress updated successfully!');
      router.push('/my-proposals');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update progress');
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestPayment = async () => {
    if (!proposal) return;
    
    try {
      await api.post('/request-payment/', {
        proposal_id: proposal.id,
        amount: proposal.proposed_price,
        note: 'Project completed successfully. Requesting payment.'
      });
      
      toast.success('Payment request sent to client!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to request payment');
    }
  };

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

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Not Found</h1>
            <Link href="/my-proposals" className="btn-primary">
              Back to My Proposals
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Details */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Project Details</h3>
              
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Project:</span>
                  <p className="font-medium">{proposal.job.title}</p>
                </div>
                <div>
                  <span className="text-gray-600">Client:</span>
                  <p className="font-medium">{proposal.job.client.first_name} {proposal.job.client.last_name}</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Bid:</span>
                  <span className="font-medium">${proposal.proposed_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="font-medium">{proposal.delivery_time} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Your Proposal</h4>
                <p className="text-sm text-gray-600 line-clamp-3">{proposal.cover_letter}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <Link href="/my-proposals" className="text-primary hover:text-primary/80 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to proposals
                </Link>
              </div>
            </div>
          </div>

          {/* Progress Management */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-gray-900">Manage Project Progress</h1>
                <p className="text-gray-600 mt-2">Keep your client updated on project progress</p>
              </div>

              <div className="p-6">
                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  <button
                    onClick={() => handleRequestPayment()}
                    className="p-4 border border-gray-300 rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <div>
                        <h3 className="font-semibold">Request Payment</h3>
                        <p className="text-sm text-gray-600">Project completed? Request payment from client</p>
                      </div>
                    </div>
                  </button>

                  <Link
                    href={`/messages?user=${proposal.job.client.id}`}
                    className="p-4 border border-gray-300 rounded-lg hover:border-primary transition-colors text-left block"
                  >
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <div>
                        <h3 className="font-semibold">Message Client</h3>
                        <p className="text-sm text-gray-600">Communicate directly with your client</p>
                      </div>
                    </div>
                  </Link>
                </div>

                {/* Progress Update Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="needs_revision">Needs Revision</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Progress Update Message *
                    </label>
                    <textarea
                      name="message"
                      rows={6}
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Describe what you&apos;ve completed, current progress, next steps, or any questions for the client..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This message will be sent to the client as a progress update
                    </p>
                  </div>

                  {/* Progress Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Progress Update Tips:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Be specific about what you&apos;ve accomplished</li>
                      <li>• Include any challenges or roadblocks</li>
                      <li>• Mention next steps and timeline</li>
                      <li>• Ask questions if you need clarification</li>
                      <li>• Share screenshots or demos when possible</li>
                    </ul>
                  </div>

                  <div className="flex justify-end pt-6 border-t">
                    <button
                      type="submit"
                      disabled={updating}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending Update...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send Progress Update
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProjectProgressPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProjectProgressContent />
    </Suspense>
  );
}
