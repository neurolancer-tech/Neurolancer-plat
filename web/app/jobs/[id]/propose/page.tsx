'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { Job } from '@/types';
import { isAuthenticated, getProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function SubmitProposalPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    cover_letter: '',
    proposed_price: '',
    delivery_time: '',
    questions: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const profile = getProfile();
    if (profile?.user_type === 'client') {
      toast.error('Only freelancers can submit proposals');
      router.push('/jobs');
      return;
    }

    loadJobDetails();
  }, [jobId, router]);

  const loadJobDetails = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}/`);
      if (response.data) {
        setJob(response.data);
        
        // Set suggested values
        const avgBudget = (response.data.budget_min + response.data.budget_max) / 2;
        setFormData(prev => ({
          ...prev,
          proposed_price: avgBudget.toString()
        }));
      } else {
        throw new Error('No job data received');
      }
    } catch (error) {
      console.error('Error loading job:', error);
      toast.error('Job not found');
      router.push('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const calculateFees = useMemo(() => {
    const price = parseFloat(formData.proposed_price) || 0;
    const platformFee = price * 0.1; // 10% platform fee
    const youReceive = price - platformFee;
    return { price, platformFee, youReceive };
  }, [formData.proposed_price]);

  const validateForm = () => {
    if (formData.cover_letter.length < 100) {
      toast.error('Cover letter must be at least 100 characters');
      return false;
    }
    
    const price = parseFloat(formData.proposed_price);
    if (!price || price < 1) {
      toast.error('Please enter a valid bid amount');
      return false;
    }
    
    if (job && (price < job.budget_min || price > job.budget_max)) {
      toast.error(`Bid should be between $${job.budget_min} and $${job.budget_max}`);
      return false;
    }
    
    const deliveryTime = parseInt(formData.delivery_time);
    if (!deliveryTime || deliveryTime < 1) {
      toast.error('Please enter a valid delivery time');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      const jobIdNum = parseInt(jobId);
      if (isNaN(jobIdNum)) {
        toast.error('Invalid job ID');
        return;
      }
      
      await api.post('/proposals/create/', {
        job_id: jobIdNum,
        cover_letter: formData.cover_letter,
        proposed_price: parseFloat(formData.proposed_price),
        delivery_time: parseInt(formData.delivery_time),
        questions: formData.questions
      });
      
      toast.success('Proposal submitted successfully!');
      router.push('/my-proposals');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <Link href="/jobs" className="btn-primary">
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { price, platformFee, youReceive } = calculateFees;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Job Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">{job.title}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-medium">${job.budget_min} - ${job.budget_max}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium capitalize">{job.experience_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{job.job_type === 'fixed' ? 'Fixed Price' : 'Hourly'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Proposals:</span>
                  <span className="font-medium">{job.proposal_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline:</span>
                  <span className="font-medium">{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {job.skills_required?.split(',').map((skill, index) => (
                    <span key={index} className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                      {skill.trim()}
                    </span>
                  )) || []}
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">{job.description}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t">
                <Link href={`/jobs/${jobId}`} className="text-primary hover:text-primary/80 text-sm flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to job details
                </Link>
              </div>
            </div>
          </div>

          {/* Proposal Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6 border-b">
                <h1 className="text-2xl font-bold text-gray-900">Submit Your Proposal</h1>
                <p className="text-gray-600 mt-2">Craft a compelling proposal to win this project</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                  {/* Cover Letter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter *
                    </label>
                    <textarea
                      name="cover_letter"
                      rows={8}
                      required
                      value={formData.cover_letter}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Introduce yourself and explain why you're the best fit for this project. Highlight your relevant experience, skills, and approach to this specific project."
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm text-gray-500">Minimum 100 characters</p>
                      <span className={`text-sm ${formData.cover_letter.length >= 100 ? 'text-green-600' : 'text-red-500'}`}>
                        {formData.cover_letter.length} / 100
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Tips for a great cover letter:</strong></p>
                      <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>Address the client&apos;s specific needs</li>
                        <li>Highlight relevant experience and skills</li>
                        <li>Explain your approach to the project</li>
                        <li>Show enthusiasm and professionalism</li>
                      </ul>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Bid *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        name="proposed_price"
                        required
                        min="1"
                        step="0.01"
                        value={formData.proposed_price}
                        onChange={handleInputChange}
                        className="input-field pl-8"
                        placeholder="Enter your bid amount"
                      />
                    </div>
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Your bid:</span>
                        <span>${price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600 mt-1">
                        <span>Neurolancer fee (10%):</span>
                        <span>${platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-900 mt-2 pt-2 border-t">
                        <span>You&apos;ll receive:</span>
                        <span>${youReceive.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Set a competitive bid within the client&apos;s budget range</p>
                  </div>

                  {/* Delivery Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Time *
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        name="delivery_time"
                        required
                        min="1"
                        max="365"
                        value={formData.delivery_time}
                        onChange={handleInputChange}
                        className="w-24 input-field"
                      />
                      <span className="text-gray-700">days</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">How many days do you need to complete this project?</p>
                  </div>

                  {/* Questions */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions for the Client</h3>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 mb-2">Use this section to ask any clarifying questions about the project requirements, timeline, or deliverables.</p>
                      <textarea
                        name="questions"
                        rows={3}
                        value={formData.questions}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Do you have any specific preferences for the AI framework? Are there any integration requirements? etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-8 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Submit Proposal
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}