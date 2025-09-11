'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { setAuthToken, setUser, setProfile } from '../../lib/auth';
import { signInWithGoogle, getGoogleRedirectResult } from '../../lib/firebase';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('signup');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    userType: 'client'
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login') {
      setActiveTab('login');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle redirect result on page load
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        console.log('Checking for Google redirect result...');
        const result = await getGoogleRedirectResult();
        console.log('Redirect result:', result);
        
        if (result && result.user) {
          console.log('Found redirect result, processing user...');
          setLoading(true);
          await processGoogleUser(result.user);
        } else {
          console.log('No redirect result found');
        }
      } catch (error: any) {
        console.error('Google redirect result error:', error);
        setLoading(false);
        // Only show error if it's not the expected "no redirect" error
        if (error.code && error.code !== 'auth/no-redirect-operation-pending') {
          console.error('Actual redirect error:', error);
          toast.error('Failed to complete Google sign-in');
        }
      }
    };

    // Add a small delay to ensure Firebase is fully initialized
    const timer = setTimeout(handleRedirectResult, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      console.log('Initiating Google sign-in...');
      const result = await signInWithGoogle();
      
      console.log('Google sign-in result:', result);
      
      // If popup mode was used, handle result immediately
      if (result && result.user) {
        console.log('Processing popup result');
        await processGoogleUser(result.user);
      } else {
        console.log('No immediate result, waiting for redirect...');
        // If redirect mode was used, user will be redirected and result handled in useEffect
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
      setLoading(false);
    }
  };

  const processGoogleUser = async (user: any) => {
    try {
      console.log('Processing Google user:', user);
      
      // Send Google user data to backend
      const response = await api.post('/auth/google/', {
        uid: user.uid,
        email: user.email,
        first_name: user.displayName?.split(' ')[0] || '',
        last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
        photo_url: user.photoURL
      });

      console.log('Backend response:', response.data);
      const { user: backendUser, token, profile, is_new_user } = response.data;
      
      console.log('Is new user:', is_new_user);
      console.log('Profile:', profile);
      console.log('Profile user_type:', profile?.user_type);
      
      // Ensure Google users are marked as verified
      const updatedProfile = {
        ...profile,
        auth_provider: 'google',
        email_verified: true,
        is_verified: true
      };
      
      setAuthToken(token);
      setUser(backendUser);
      setProfile(updatedProfile);
      
      // Check if user needs role selection (no user_type set)
      if (!updatedProfile.user_type || updatedProfile.user_type === '') {
        console.log('User has no user_type, redirecting to role selection');
        if (is_new_user) {
          toast.success('Welcome to Neurolancer! Account created successfully.');
        } else {
          toast.success('Successfully signed in with Google!');
        }
        router.push('/role-selection');
        return;
      }
      
      // User has a role, go to dashboard (onboarding will be handled there if needed)
      console.log('User has user_type, going to dashboard');
      toast.success('Successfully signed in with Google!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Backend authentication error:', error);
      
      // Check if this is a network/timeout error but user might have been created
      const isNetworkError = !error.response || error.code === 'NETWORK_ERROR' || error.message?.includes('timeout');
      const isServerError = error.response?.status >= 500;
      
      if (isNetworkError || isServerError) {
        console.log('Network/server error detected, attempting retry with same credentials...');
        
        // Wait a moment and try again - user might have been created on first attempt
        setTimeout(async () => {
          try {
            const retryResponse = await api.post('/auth/google/', {
              uid: user.uid,
              email: user.email,
              first_name: user.displayName?.split(' ')[0] || '',
              last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
              photo_url: user.photoURL
            });
            
            console.log('Retry successful:', retryResponse.data);
            const { user: backendUser, token, profile, is_new_user } = retryResponse.data;
            
            const updatedProfile = {
              ...profile,
              auth_provider: 'google',
              email_verified: true,
              is_verified: true
            };
            
            setAuthToken(token);
            setUser(backendUser);
            setProfile(updatedProfile);
            
            if (!updatedProfile.user_type || updatedProfile.user_type === '') {
              toast.success('Successfully registered with Google!');
              router.push('/role-selection');
            } else {
              toast.success('Successfully signed in with Google!');
              router.push('/dashboard');
            }
            setLoading(false);
          } catch (retryError: any) {
            console.error('Retry also failed:', retryError);
            setLoading(false);
            
            // Show more user-friendly error message
            if (retryError.response?.status === 400 && retryError.response?.data?.error?.includes('already exists')) {
              toast.error('Account already exists. Please try signing in again.');
            } else {
              toast.error('Connection issue. Please check your internet and try again.');
            }
          }
        }, 2000); // Wait 2 seconds before retry
        
        return; // Don't set loading to false yet, retry will handle it
      }
      
      // Handle other types of errors normally
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Status:', error.response.status);
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Authentication failed';
      toast.error('Authentication failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login/', {
        username: formData.username,
        password: formData.password
      });

      const { user, token, profile } = response.data;
      
      setAuthToken(token);
      setUser(user);
      setProfile(profile);
      
      toast.success('Login successful!');
      
      // Go directly to dashboard (onboarding will be handled there if needed)
      router.push('/dashboard');
    } catch (error: any) {
      toast.error((error as any).response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const res = await api.get('/auth/check-email/', { params: { email } });
      if (typeof res.data?.exists === 'boolean') return res.data.exists;
    } catch (err) {
      try {
        const res2 = await api.post('/auth/check-email/', { email });
        if (typeof (res2 as any).data?.exists === 'boolean') return (res2 as any).data.exists;
      } catch (_) {
        // If endpoint not available, fall back to server-side validation during registration
      }
    }
    return false;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      // Pre-check if email already exists (prevents dupes incl. Google-registered emails)
      const exists = await checkEmailExists(formData.email);
      if (exists) {
        toast.error('An account with this email already exists. Please sign in or use Google.');
        setActiveTab('login');
        return;
      }

      const response = await api.post('/auth/register/', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        user_type: formData.userType
      });

      // Some backends return 201/204 with no body — handle gracefully
      const data = response?.data ?? {};
      const token = (data as any)?.token as string | undefined;
      const user = (data as any)?.user as any;
      const profile = (data as any)?.profile as any;

      if (token && user) {
        setAuthToken(token);
        setUser(user);
        if (profile) setProfile(profile);
      }
      
      const successMsg = (data as any)?.message || 'Registration successful! Please check your email to verify your account.';
      toast.success(successMsg);
      // Regular users go to login page (no onboarding redirect)
      router.push('/auth?tab=login');
    } catch (error: any) {
      const errorMsg = (error as any).response?.data?.username?.[0] || 
                      (error as any).response?.data?.email?.[0] || 
                      (error as any).response?.data?.error ||
                      'Registration failed';

      // Fallback: some backends return 4xx/5xx even after creating the account (e.g., email send failure).
      // Try to sign in with the just-registered credentials; if it works, treat as success.
      try {
        const loginRes = await api.post('/auth/login/', {
          username: formData.username,
          password: formData.password,
        });
        const { user, token, profile } = loginRes.data || {};
        if (token && user) {
          setAuthToken(token);
          setUser(user);
          if (profile) setProfile(profile);
          toast.success('Account created! Please verify your email.');
          router.push('/verify-email');
          return;
        }
      } catch (_) {
        // Ignore; will show original error below
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#F6F6EB] via-white to-[#E8F5F3] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0D9E86] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FF8559] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Link href="/" className="flex justify-center mb-8">
              <div className="px-3 py-2 rounded-lg" style={{backgroundColor: '#0D9E86'}}>
                <Image
                  src="/assets/Neurolancer-logo/vector/default-monochrome-white.svg"
                  alt="Neurolancer"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
              </div>
            </Link>
            <div className="text-center animate-fade-in">
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
                {activeTab === 'login' ? 'Welcome back!' : 'Join Neurolancer'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {activeTab === 'login' 
                  ? 'Sign in to continue your AI journey' 
                  : 'Start your AI freelance journey today'
                }
              </p>
            </div>
          </div>

          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="card py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
              {/* Tab Navigation */}
              <div className="flex mb-8 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-3 px-4 text-center font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'signup'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-3 px-4 text-center font-medium rounded-lg transition-all duration-200 ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 mb-6 disabled:opacity-50"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
                </div>
              </div>

              {/* Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-6 animate-slide-in">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username or Email
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your username or email"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <Link 
                        href="/forgot-password" 
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>
              )}

              {/* Signup Form */}
              {activeTab === 'signup' && (
                <form onSubmit={handleSignup} className="space-y-6 animate-slide-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">I want to:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.userType === 'client' 
                          ? 'border-blue-500 bg-blue-50 text-blue-600' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="userType"
                          value="client"
                          checked={formData.userType === 'client'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center w-full">
                          <div className="text-2xl mb-1">🎯</div>
                          <div className="text-sm font-medium">Hire AI experts</div>
                        </div>
                      </label>
                      <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.userType === 'freelancer' 
                          ? 'border-green-500 bg-green-50 text-green-600' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="userType"
                          value="freelancer"
                          checked={formData.userType === 'freelancer'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center w-full">
                          <div className="text-2xl mb-1">🚀</div>
                          <div className="text-sm font-medium">Work as freelancer</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="johndoe"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  By joining, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>




    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthContent />
    </Suspense>
  );
}
