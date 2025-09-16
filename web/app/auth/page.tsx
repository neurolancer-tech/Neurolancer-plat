'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { setAuthToken, setUser, setProfile, isProfileComplete } from '../../lib/auth';
import { signInWithGoogle, getGoogleRedirectResult } from '../../lib/firebase';

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score += 1;
  else suggestions.push('At least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else suggestions.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else suggestions.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else suggestions.push('Add numbers');

  if (/[^\w\s]/.test(password)) score += 1;
  else suggestions.push('Add special characters');

  const strengthLevels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Good', color: 'bg-blue-500' },
    { label: 'Strong', color: 'bg-green-500' }
  ];

  return {
    score,
    label: strengthLevels[score]?.label || 'Very Weak',
    color: strengthLevels[score]?.color || 'bg-red-500',
    suggestions
  };
};

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

  const [loginRole, setLoginRole] = useState<'client' | 'freelancer'>('client');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, label: '', color: '', suggestions: [] });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login') {
      setActiveTab('login');
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Calculate password strength for signup
    if (name === 'password' && activeTab === 'signup') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
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
      
      // Only show profile completion for new users or users who haven't completed it
      if (is_new_user && !isProfileComplete()) {
        console.log('New user needs profile completion, redirecting to complete-profile');
        toast.success('Welcome to Neurolancer! Please complete your profile.');
        router.push('/auth/complete-profile');
        return;
      }
      
      // Check if user needs role selection (no user_type set)
      if (!updatedProfile.user_type || updatedProfile.user_type === '') {
        console.log('User has no user_type, redirecting to role selection');
        toast.success('Please select your role to continue.');
        router.push('/role-selection');
        return;
      }
      
      // User has completed profile and has role, go to dashboard
      console.log('User has completed profile and role, going to dashboard');
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
              // Check profile completion in retry as well
              const retryRequiresCompletion = !updatedProfile.phone ||
                                            updatedProfile.phone === '' ||
                                            !updatedProfile.country ||
                                            updatedProfile.country === '' ||
                                            !updatedProfile.city ||
                                            updatedProfile.city === '';
              
              if (retryRequiresCompletion) {
                toast.success('Welcome! Please complete your profile.');
                router.push('/auth/complete-profile');
              } else {
                toast.success('Successfully signed in with Google!');
                router.push('/dashboard');
              }
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

      const { user, token, profile, requires_completion, is_new_user } = response.data;
      
      // Update profile with selected role
      const updatedProfile = { ...profile, user_type: loginRole };
      
      setAuthToken(token);
      setUser(user);
      setProfile(updatedProfile);
      
      // Update role on backend
      try {
        await api.patch('/profile/update/', {
          user_type: loginRole
        });
      } catch (roleError) {
        console.log('Role update failed, but continuing with login');
      }
      
      toast.success(`Welcome back! Signed in as ${loginRole}.`);
      
      // Only show profile completion for users who haven't completed it yet
      if (requires_completion || (!updatedProfile.profile_completed && !isProfileComplete())) {
        console.log('Profile needs completion, redirecting to complete-profile');
        router.push('/auth/complete-profile');
        return;
      }
      
      // Profile is complete, go to dashboard
      console.log('Profile is complete, going to dashboard');
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
      
      const successMsg = (data as any)?.message || 'Registration successful!';
      toast.success(successMsg);
      
      // All new registrations need profile completion
      console.log('New registration successful, redirecting to complete-profile');
      router.push('/auth/complete-profile');
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
        const { user, token, profile, is_new_user } = loginRes.data || {};
        if (token && user) {
          setAuthToken(token);
          setUser(user);
          if (profile) setProfile(profile);
          toast.success('Account created! Please complete your profile.');
          router.push('/auth/complete-profile');
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
      <div className="min-h-screen bg-gradient-to-br from-[#F6F6EB] via-white to-[#E8F5F3] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0D9E86] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FF8559] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10">
          <div className="sm:mx-auto sm:w-full sm:max-w-md lg:max-w-lg">
            <Link href="/" className="flex justify-center mb-6 sm:mb-8">
              <div className="px-3 py-2 rounded-lg" style={{backgroundColor: '#0D9E86'}}>
                <Image
                  src="/assets/Neurolancer-logo/vector/default-monochrome-white.svg"
                  alt="Neurolancer"
                  width={120}
                  height={32}
                  className="h-6 sm:h-8 w-auto"
                />
              </div>
            </Link>
            <div className="text-center animate-fade-in">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
                {activeTab === 'login' ? 'Welcome back!' : 'Join Neurolancer'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg">
                {activeTab === 'login' 
                  ? 'Sign in to continue your AI journey' 
                  : 'Start your AI freelance journey today'
                }
              </p>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md lg:max-w-lg">
            <div className="card py-6 sm:py-8 px-4 sm:px-6 lg:px-10 shadow-2xl sm:rounded-2xl">
              {/* Tab Navigation */}
              <div className="flex mb-6 sm:mb-8 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                <button
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center font-medium rounded-lg transition-all duration-200 text-sm sm:text-base ${
                    activeTab === 'signup'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 sm:py-3 px-2 sm:px-4 text-center font-medium rounded-lg transition-all duration-200 text-sm sm:text-base ${
                    activeTab === 'login'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                >
                  Sign In
                </button>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 mb-4 sm:mb-6 disabled:opacity-50 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-4 sm:mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
                </div>
              </div>

              {/* Login Form */}
              {activeTab === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6 animate-slide-in">
                  {/* Role Selection for Login */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Sign in as:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setLoginRole('client')}
                        className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                          loginRole === 'client' 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">🎯</div>
                          <div className="text-sm font-medium">Client</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Hire freelancers</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoginRole('freelancer')}
                        className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                          loginRole === 'freelancer' 
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">🚀</div>
                          <div className="text-sm font-medium">Freelancer</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Find work</div>
                        </div>
                      </button>
                    </div>
                  </div>

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
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                      placeholder="Enter your username or email"
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Password
                      </label>
                      <Link 
                        href="/forgot-password" 
                        className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 sm:py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none font-medium text-sm sm:text-base"
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
                <form onSubmit={handleSignup} className="space-y-4 sm:space-y-6 animate-slide-in">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">I want to:</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <label className={`flex items-center p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.userType === 'client' 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
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
                          <div className="text-xl sm:text-2xl mb-1">🎯</div>
                          <div className="text-xs sm:text-sm font-medium">Hire AI experts</div>
                        </div>
                      </label>
                      <label className={`flex items-center p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.userType === 'freelancer' 
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
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
                          <div className="text-xl sm:text-2xl mb-1">🚀</div>
                          <div className="text-xs sm:text-sm font-medium">Work as freelancer</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                        placeholder="John"
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                        placeholder="Doe"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                      placeholder="john@example.com"
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                      placeholder="johndoe"
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.score <= 1 ? 'text-red-600' :
                            passwordStrength.score <= 2 ? 'text-orange-600' :
                            passwordStrength.score <= 3 ? 'text-yellow-600' :
                            passwordStrength.score <= 4 ? 'text-blue-600' :
                            'text-green-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          />
                        </div>
                        {passwordStrength.suggestions.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {passwordStrength.suggestions.slice(0, 2).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm sm:text-base ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-300 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-green-500'
                        }`}
                        placeholder="Confirm your password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || Boolean(formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 sm:py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:transform-none font-medium text-sm sm:text-base"
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

              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By joining, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
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
