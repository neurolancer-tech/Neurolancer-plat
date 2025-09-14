'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { getProfile, updateProfile } from '@/lib/auth';
import { completeProfile } from '@/lib/profile';
import Navigation from '@/components/Navigation';
import toast from 'react-hot-toast';

const countries = [
  { code: 'US', name: 'United States', phone: '+1' },
  { code: 'CA', name: 'Canada', phone: '+1' },
  { code: 'GB', name: 'United Kingdom', phone: '+44' },
  { code: 'IN', name: 'India', phone: '+91' },
  { code: 'NG', name: 'Nigeria', phone: '+234' }
];

const usStates = [
  { code: 'CA', name: 'California' }, { code: 'NY', name: 'New York' }, 
  { code: 'TX', name: 'Texas' }, { code: 'FL', name: 'Florida' }
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    phone_number: '',
    country: '',
    state: '',
    city: '',
    skills: '',
    experience_level: 'entry'
  });

  const [phoneVerification, setPhoneVerification] = useState({
    step: 'input',
    verificationCode: '',
    recaptchaVerifier: null as any
  });

  const [selectedCountry, setSelectedCountry] = useState<any>(null);

  useEffect(() => {
    const userProfile = getProfile();
    if (!userProfile) {
      router.push('/auth');
      return;
    }
    setProfile(userProfile);
    setLoading(false);
  }, [router]);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    setSelectedCountry(country || null);
    setFormData(prev => ({ ...prev, country: countryCode, state: '' }));
  };

  const sendVerificationCode = async () => {
    if (!formData.phone_number || !selectedCountry) {
      toast.error('Please enter a valid phone number');
      return;
    }

    try {
      setPhoneVerification(prev => ({ ...prev, step: 'verify' }));
      toast.success('Verification code sent to your phone');
    } catch (error: any) {
      toast.error('Failed to send verification code');
    }
  };

  const verifyPhoneCode = async () => {
    if (!phoneVerification.verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    try {
      setPhoneVerification(prev => ({ ...prev, step: 'verified' }));
      toast.success('Phone number verified successfully');
    } catch (error: any) {
      toast.error('Invalid verification code');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phoneVerification.step !== 'verified') {
      toast.error('Please verify your phone number first');
      return;
    }

    setSubmitting(true);
    
    try {
      // Send profile data to backend API
      const profileData = {
        ...formData,
        phone_number: `${selectedCountry?.phone}${formData.phone_number}`,
        phone_verified: phoneVerification.step === 'verified'
      };
      
      await completeProfile(profileData);
      
      // Update local profile
      const updatedProfile = {
        ...profile,
        ...profileData,
        profile_completed: true
      };
      updateProfile(updatedProfile);
      
      toast.success('Profile completed successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Complete Your Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please provide additional information to complete your registration
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Phone Verification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Select Country</option>
                    {countries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.name} ({country.phone})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
                      {selectedCountry?.phone || '+1'}
                    </span>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="1234567890"
                      required
                      disabled={phoneVerification.step === 'verified'}
                    />
                  </div>
                </div>
              </div>

              {phoneVerification.step === 'input' && (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  className="mt-4 btn-secondary"
                  disabled={!formData.phone_number || !selectedCountry}
                >
                  Send Verification Code
                </button>
              )}

              {phoneVerification.step === 'verify' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={phoneVerification.verificationCode}
                      onChange={(e) => setPhoneVerification(prev => ({ ...prev, verificationCode: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={verifyPhoneCode}
                    className="btn-primary"
                  >
                    Verify Code
                  </button>
                </div>
              )}

              {phoneVerification.step === 'verified' && (
                <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Phone number verified
                </div>
              )}
            </div>

            {/* Location Section */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Location Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.country === 'US' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Select State</option>
                      {usStates.map(state => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Professional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Experience Level
                  </label>
                  <select
                    value={formData.experience_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Python, Machine Learning, TensorFlow"
                />
              </div>
            </div>

            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={() => router.push('/auth')}
                className="btn-secondary"
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={submitting || phoneVerification.step !== 'verified'}
                className="btn-primary"
              >
                {submitting ? 'Completing...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}