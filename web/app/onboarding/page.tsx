'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [emailVerified, setEmailVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    checkEmailVerification();
  }, [router]);

  const checkEmailVerification = async () => {
    try {
      const response = await api.get('/auth/check-verification/');
      setEmailVerified(response.data.email_verified);
      
      if (response.data.email_verified) {
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error checking email verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setIsResending(true);
    setResendMessage('');
    
    try {
      await api.post('/auth/resend-verification/');
      setResendMessage('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      setResendMessage(error.response?.data?.error || 'Failed to send verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleUserTypeSelection = async (type: string) => {
    try {
      await api.patch('/profile/update/', {
        user_type: type
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error updating user type:', error);
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {emailVerified ? '✓' : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">Verify Email</span>
            </div>
            <div className={`w-16 h-0.5 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">Choose Role</span>
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Verify Your Email</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We&apos;ve sent a verification email to <strong>{getUser()?.email}</strong>.
              Please check your inbox and click the verification link to continue.
            </p>
            
            {resendMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                resendMessage.includes('sent') 
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
                {resendMessage}
              </div>
            )}
            
            <div className="space-y-4">
              <button
                onClick={resendVerificationEmail}
                disabled={isResending}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </button>
              
              <div>
                <button
                  onClick={checkEmailVerification}
                  className="text-primary hover:text-primary-dark dark:text-primary-light text-sm"
                >
                  I&apos;ve verified my email
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="card p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Role</h2>
              <p className="text-gray-600 dark:text-gray-300">
                How do you plan to use Neurolancer? You can change this later.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                onClick={() => handleUserTypeSelection('client')}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors bg-white dark:bg-gray-800"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8zM8 14v.01M12 14v.01M16 14v.01" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">I&apos;m a Client</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    I want to hire AI experts and freelancers for my projects
                  </p>
                </div>
              </div>

              <div 
                onClick={() => handleUserTypeSelection('freelancer')}
                className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors bg-white dark:bg-gray-800"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">I&apos;m a Freelancer</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    I want to offer my AI and tech skills to clients
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}