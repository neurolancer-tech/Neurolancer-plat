'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Job } from '@/types';
import { isAuthenticated, getProfile, getUser } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function JobProgressPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    message: ''
  });

  const loadJobDetails = useCallback(async () => {
    try {
      const response = await api.get(`/jobs/${jobId}/`);
      const jobData = response.data;
      
      // Job data loaded successfully
      
      setJob(jobData);
      setFormData({
        status: jobData.status || 'open',
        message: ''
      });
    } catch (error: any) {
      console.error('Error loading job:', error);
      const errorMessage = error.response?.status === 404 ? 'Job not found' :
                          error.response?.status === 401 ? 'Authentication required' :
                          error.response?.status === 403 ? 'Permission denied' :
                          'Job not found';
      toast.error(errorMessage);
      router.push('/my-jobs');
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    loadJobDetails();
  }, [loadJobDetails]);



  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.status) {
      toast.error('Please select a status');
      return;
    }
    
    setUpdating(true);
    
    try {
      const response = await api.post(`/jobs/${jobId}/update-status/`, {
        status: formData.status,
        message: formData.message
      });
      
      console.log('Job status update response:', response.data);
      toast.success('Job progress updated successfully!');
      loadJobDetails();
    } catch (error: any) {
      console.error('Job status update error:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to update job progress');
    } finally {
      setUpdating(false);
    }
  };

  const JOB_STATUSES = {
    open: { color: 'bg-green-100 text-green-800', label: 'Open' },
    in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
    completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
    cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' }
  } as const;

  const getStatusColor = (status: string) => {
    return JOB_STATUSES[status as keyof typeof JOB_STATUSES]?.color || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return JOB_STATUSES[status as keyof typeof JOB_STATUSES]?.label || status;
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
            <Link href="/my-jobs" className="btn-primary">
              Back to My Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Update Job Progress</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Update the status and progress of this job</p>
          </div>

          {/* Job Details */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{job.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{job.description.substring(0, 150)}...</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Budget:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">${job.budget_min} - ${job.budget_max}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Current Status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {getStatusLabel(job.status)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600 dark:text-gray-400">Proposals:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{job.proposal_count}</span>
            </div>
          </div>

          {/* Progress Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Job Status *
                </label>
                <select
                  name="status"
                  required
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <ul className="space-y-1">
                    <li><strong>Open:</strong> Job is still accepting proposals</li>
                    <li><strong>In Progress:</strong> Work has started on the job</li>
                    <li><strong>Completed:</strong> Job has been finished successfully</li>
                    <li><strong>Cancelled:</strong> Job has been cancelled</li>
                  </ul>
                </div>
              </div>

              {/* Progress Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Progress Update Message
                </label>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Describe the current progress, what has been completed, and next steps..."
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  This message will be sent to freelancers who have submitted proposals
                </p>
              </div>

              {/* Status Change Effects */}
              {formData.status !== job.status && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Status Change Effects:</h4>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {formData.status === 'in_progress' && (
                      <p>• Freelancers will be notified that work has started</p>
                    )}
                    {formData.status === 'completed' && (
                      <p>• Job will be marked as completed and freelancers will be notified</p>
                    )}
                    {formData.status === 'cancelled' && (
                      <p>• Job will be cancelled and all pending proposals will be rejected</p>
                    )}
                    {formData.status === 'open' && (
                      <p>• Job will be reopened for new proposals</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/my-jobs"
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={updating}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Update Progress
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}