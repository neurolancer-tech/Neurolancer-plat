'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface VerificationData {
  id_document: File | null;
  id_document_type: string;
  secondary_document: File | null;
  secondary_document_type: string;
  certificates: File | null;
  portfolio_link: string;
  linkedin_profile: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  phone_number: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [formData, setFormData] = useState<VerificationData>({
    id_document: null,
    id_document_type: 'id_card',
    secondary_document: null,
    secondary_document_type: 'passport',
    certificates: null,
    portfolio_link: '',
    linkedin_profile: '',
    full_name: '',
    date_of_birth: '',
    address: '',
    phone_number: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadVerificationStatus();
  }, [router]);

  const loadVerificationStatus = async () => {
    try {
      const response = await api.get('/verification/status/');
      if (response.data.status === 'success') {
        setVerificationStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error loading verification status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      
      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (typeof value === 'string' && value) {
          submitData.append(key, value);
        }
      });

      // Add files
      if (formData.id_document) {
        submitData.append('id_document', formData.id_document);
      }
      if (formData.secondary_document) {
        submitData.append('secondary_document', formData.secondary_document);
      }
      if (formData.certificates) {
        submitData.append('certificates', formData.certificates);
      }

      const response = await api.post('/verification/submit/', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        toast.success('Verification request submitted successfully!');
        loadVerificationStatus();
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to submit verification request');
    } finally {
      setLoading(false);
    }
  };

  if (verificationStatus?.has_request) {
    const request = verificationStatus.request;
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verification Status</h1>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    request.status === 'verified' ? 'bg-green-500' :
                    request.status === 'rejected' ? 'bg-red-500' :
                    request.status === 'verifying' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 capitalize">
                      Status: {request.status}
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                      Submitted on {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    {request.admin_notes && (
                      <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                        <strong>Admin Notes:</strong> {request.admin_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Get Verified</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Verify your identity to build trust with clients and access premium features
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full legal name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    required
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="+1234567890"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Enter your full address"
                  />
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Identity Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primary ID Document *
                  </label>
                  <select
                    name="id_document_type"
                    value={formData.id_document_type}
                    onChange={handleInputChange}
                    className="input-field mb-2"
                  >
                    <option value="id_card">National ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                  <input
                    type="file"
                    name="id_document"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="input-field"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Secondary Document *
                  </label>
                  <select
                    name="secondary_document_type"
                    required
                    value={formData.secondary_document_type}
                    onChange={handleInputChange}
                    className="input-field mb-2"
                  >
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="id_card">National ID Card</option>
                  </select>
                  <input
                    type="file"
                    name="secondary_document"
                    accept="image/*,.pdf"
                    required
                    onChange={handleFileChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Professional Verification */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Professional Verification</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Professional Certificates *
                  </label>
                  <input
                    type="file"
                    name="certificates"
                    accept="image/*,.pdf"
                    multiple
                    required
                    onChange={handleFileChange}
                    className="input-field"
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload relevant certifications, degrees, or licenses</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Portfolio Link *
                  </label>
                  <input
                    type="url"
                    name="portfolio_link"
                    required
                    value={formData.portfolio_link}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="https://your-portfolio.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    LinkedIn Profile *
                  </label>
                  <input
                    type="url"
                    name="linkedin_profile"
                    required
                    value={formData.linkedin_profile}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important Notice</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    All documents will be securely processed and reviewed by our verification team. 
                    This process typically takes 2-5 business days. Your personal information is protected 
                    and will only be used for verification purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit for Verification
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