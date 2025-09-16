'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface VerificationRequest {
  id: number;
  user_email: string;
  user_first_name: string;
  user_last_name: string;
  status: string;
  full_name: string;
  phone_number: string;
  address: string;
  id_document_type: string;
  secondary_document_type: string;
  portfolio_link: string;
  linkedin_profile: string;
  admin_notes: string;
  created_at: string;
  reviewed_at: string;
  reviewed_by_name: string;
}

export default function AdminVerifyUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const user = getUser();
    if (!isAuthenticated() || user?.email !== 'kbrian1237@gmail.com') {
      router.push('/');
      return;
    }
    loadVerificationRequests();
  }, [router, statusFilter]);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/verification/admin/requests/?status=${statusFilter}`);
      if (response.data.status === 'success') {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error loading verification requests:', error);
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setNewStatus(request.status);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;
    
    setUpdating(true);
    try {
      const response = await api.put(`/verification/admin/requests/${selectedRequest.id}/`, {
        status: newStatus,
        admin_notes: adminNotes
      });

      if (response.data.status === 'success') {
        toast.success('Verification request updated successfully');
        setSelectedRequest(null);
        loadVerificationRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update verification request');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'verifying': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'invalid': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Verification Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Review and manage user verification requests</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Requests List */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Verification Requests</h2>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-field w-auto"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verifying">Verifying</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="invalid">Invalid</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading requests...</p>
                  </div>
                ) : requests.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">No verification requests found</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestClick(request)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedRequest?.id === request.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {request.full_name || `${request.user_first_name} ${request.user_last_name}`}
                          </h3>
                          <p className="text-sm text-gray-500">{request.user_email}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Submitted: {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="lg:col-span-1">
            {selectedRequest ? (
              <div className="card">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Request Details</h3>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      User Information
                    </label>
                    <div className="text-sm space-y-1">
                      <p><strong>Name:</strong> {selectedRequest.full_name}</p>
                      <p><strong>Email:</strong> {selectedRequest.user_email}</p>
                      <p><strong>Phone:</strong> {selectedRequest.phone_number || 'Not provided'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRequest.address || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Documents
                    </label>
                    <div className="text-sm space-y-1">
                      <p><strong>Primary ID:</strong> {selectedRequest.id_document_type}</p>
                      {selectedRequest.secondary_document_type && (
                        <p><strong>Secondary:</strong> {selectedRequest.secondary_document_type}</p>
                      )}
                    </div>
                  </div>

                  {(selectedRequest.portfolio_link || selectedRequest.linkedin_profile) && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Professional Links
                      </label>
                      <div className="text-sm space-y-1">
                        {selectedRequest.portfolio_link && (
                          <p>
                            <strong>Portfolio:</strong>{' '}
                            <a 
                              href={selectedRequest.portfolio_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Portfolio
                            </a>
                          </p>
                        )}
                        {selectedRequest.linkedin_profile && (
                          <p>
                            <strong>LinkedIn:</strong>{' '}
                            <a 
                              href={selectedRequest.linkedin_profile} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              View Profile
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Update Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="input-field"
                    >
                      <option value="pending">Pending</option>
                      <option value="verifying">Verifying</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="invalid">Invalid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Admin Notes
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={4}
                      className="input-field"
                      placeholder="Add notes about this verification request..."
                    />
                  </div>

                  <button
                    onClick={handleUpdateRequest}
                    disabled={updating}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Update Request'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500">Select a verification request to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}