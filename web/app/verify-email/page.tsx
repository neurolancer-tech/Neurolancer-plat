'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '../../lib/api';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    } else {
      // No token: show friendly prompt to verify and allow resend
      setStatus('expired');
      setMessage('Please verify your email. A verification email was sent to your inbox.');
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.post('/auth/verify-email/', {
        token: verificationToken
      });
      
      setStatus('success');
      setMessage(response.data.message);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      
    } catch (error: any) {
      if (error.response?.data?.error?.includes('expired')) {
        setStatus('expired');
        setMessage('Verification link has expired');
      } else {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed');
      }
    }
  };

  const checkVerificationStatus = async () => {
    setIsResending(true);
    try {
      const response = await api.get('/auth/profile/');
      const profile = response.data;
      
      const isVerified = !!(
        profile?.email_verified ||
        profile?.is_verified ||
        profile?.verified ||
        profile?.user?.is_verified ||
        profile?.auth_provider === 'google'
      );
      
      if (isVerified) {
        toast.success('Email verified successfully!');
        router.push('/onboarding');
      } else {
        toast.error('Email not yet verified. Please check your email and click the verification link.');
        setMessage('Email not yet verified. Please check your email and click the verification link.');
      }
    } catch (error: any) {
      console.error('Verification check error:', error);
      toast.error('Failed to check verification status');
    } finally {
      setIsResending(false);
    }
  };

  const resendVerification = async () => {
    setIsResending(true);
    try {
      console.log('Attempting to resend verification email...');
      const res = await api.post('/auth/resend-verification/');
      console.log('Resend verification response:', res);

      if (res?.status && res.status >= 200 && res.status < 300) {
        setMessage('New verification email sent! Please check your inbox and spam folder.');
        toast.success('Verification email sent successfully!');
      } else {
        console.error('Unexpected response status:', res?.status);
        setMessage('Failed to resend verification email');
        toast.error('Failed to resend verification email');
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      console.error('Error response:', error?.response?.data);
      const status = error?.response?.status;
      const backendMsg = error?.response?.data?.error || error?.response?.data?.message;
      
      // If email is already verified, redirect to onboarding
      if (backendMsg === 'Email is already verified') {
        toast.success('Email already verified!');
        router.push('/onboarding');
        return;
      }
      
      const msg = status === 401
        ? 'Please log in to resend the verification email.'
        : backendMsg || error?.message || 'Failed to resend verification email';
      setMessage(msg);
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Email Verification
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Confirming your email address
          </p>
        </div>
        
        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          {status === 'loading' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-400 mb-2">Email Verified Successfully!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-400">
                    🎉 Welcome to Neurolancer! Your account is now fully activated.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to dashboard in 3 seconds...</p>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Go to Dashboard Now
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Verification Failed</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-400">
                    The verification link may be invalid or corrupted. Please try requesting a new one.
                  </p>
                </div>
              </div>
              <Link 
                href="/auth" 
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Login
              </Link>
            </div>
          )}

          {status === 'expired' && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400 mb-2">Link Expired</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    Verification links expire after 30 days for security reasons. Request a new one below.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={checkVerificationStatus}
                  disabled={isResending}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Checking...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      I've Verified My Email
                    </>
                  )}
                </button>
                <button
                  onClick={resendVerification}
                  disabled={isResending}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isResending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Send New Verification Email
                    </>
                  )}
                </button>
                <Link 
                  href="/auth" 
                  className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Login
                </Link>
              </div>
            </div>
          )}
        </div>


      </div>
      </div>
    </>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
