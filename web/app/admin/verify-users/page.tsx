'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
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
  id_document: string;
  id_document_type: string;
  secondary_document: string;
  secondary_document_type: string;
  certificates: string;
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
  const [badges, setBadges] = useState<any[]>([]);
  const [userVerifications, setUserVerifications] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const user = getUser();
    if (user?.email !== 'kbrian1237@gmail.com') {
      router.push('/');
      return;
    }
    loadVerificationRequests();
  }, [router]);

  const loadVerificationRequests = async () => {
    try {
      setLoading(true);
      // Load comprehensive verification data
      const response = await api.get('/verification/admin/overview/');
      if (response.data.status === 'success') {
        const data = response.data.data;
        setRequests(data.verification_requests || []);
        setBadges(data.verification_badges || []);
        setUserVerifications(data.user_verifications || []);
        setSummary(data.summary || {});
      } else {
        setRequests([]);
        setBadges([]);
        setUserVerifications([]);
        setSummary(null);
      }
    } catch (error: any) {
      console.error('Error loading verification data:', error);
      toast.error(error.response?.data?.message || 'Failed to load verification data');
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
        toast.success(`Verification request updated to ${newStatus}. User has been notified.`);
        setSelectedRequest(null);
        loadVerificationRequests();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update verification request');
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
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">User Verification Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Review and manage user verification requests</p>
          
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{summary.total_requests}</div>
                <div className="text-sm text-blue-800 dark:text-blue-400">Total Requests</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{summary.pending_requests}</div>
                <div className="text-sm text-yellow-800 dark:text-yellow-400">Pending</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.verified_users}</div>
                <div className="text-sm text-green-800 dark:text-green-400">Verified Users</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{summary.total_badges}</div>
                <div className="text-sm text-purple-800 dark:text-purple-400">Total Badges</div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">{summary.total_user_verifications}</div>
                <div className="text-sm text-indigo-800 dark:text-indigo-400">User Verifications</div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {[
                { id: 'requests', label: 'Verification Requests', count: requests.length },
                { id: 'badges', label: 'Verification Badges', count: badges.length },
                { id: 'user_verifications', label: 'User Verifications', count: userVerifications.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data List */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {activeTab === 'requests' && 'Verification Requests'}
                    {activeTab === 'badges' && 'Verification Badges'}
                    {activeTab === 'user_verifications' && 'User Verifications'}
                  </h2>
                  {activeTab === 'requests' && (
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
                  )}
                </div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading data...</p>
                  </div>
                ) : (
                  <>
                    {activeTab === 'requests' && (
                      requests.filter(req => !statusFilter || req.status === statusFilter).length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No verification requests found</p>
                        </div>
                      ) : (
                        requests.filter(req => !statusFilter || req.status === statusFilter).map((request) => (
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
                      )
                    )}
                    
                    {activeTab === 'badges' && (
                      badges.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No verification badges found</p>
                        </div>
                      ) : (
                        badges.map((badge) => (
                          <div key={badge.user} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {badge.username}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Level: {badge.verification_level}
                                </p>
                                {badge.verified_at && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    Verified: {new Date(badge.verified_at).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                badge.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {badge.is_verified ? 'Verified' : 'Not Verified'}
                              </span>
                            </div>
                          </div>
                        ))
                      )
                    )}
                    
                    {activeTab === 'user_verifications' && (
                      userVerifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-gray-500">No user verifications found</p>
                        </div>
                      ) : (
                        userVerifications.map((verification) => (
                          <div key={verification.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  User ID: {verification.user}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  Type: {verification.verification_type}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Created: {new Date(verification.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(verification.status)}`}>
                                {verification.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </>
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
                    <div className="text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span><strong>Primary ID:</strong> {selectedRequest.id_document_type}</span>
                        {selectedRequest.id_document && (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/verification/admin/document/${selectedRequest.id}/id_document/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            📄 View
                          </a>
                        )}
                      </div>
                      {selectedRequest.secondary_document_type && (
                        <div className="flex items-center justify-between">
                          <span><strong>Secondary:</strong> {selectedRequest.secondary_document_type}</span>
                          {selectedRequest.secondary_document && (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/verification/admin/document/${selectedRequest.id}/secondary_document/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded"
                            >
                              📄 View
                            </a>
                          )}
                        </div>
                      )}
                      {selectedRequest.certificates && (
                        <div className="flex items-center justify-between">
                          <span><strong>Certificates:</strong> Uploaded</span>
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/verification/admin/document/${selectedRequest.id}/certificates/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            🏆 View
                          </a>
                        </div>
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
      </div>
    </AdminLayout>
  );
}