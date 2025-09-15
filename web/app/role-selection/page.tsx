'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { getUser, getProfile, isAuthenticated, setProfile, isProfileComplete } from '../../lib/auth';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const currentUser = getUser();
    const currentProfile = getProfile();
    
    setUser(currentUser);
    setUserProfile(currentProfile);

    // Check if profile is complete first
    if (!isProfileComplete()) {
      router.push('/auth/complete-profile');
      return;
    }
    
    // If user already has a role, redirect to dashboard
    if (currentProfile?.user_type) {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  const handleRoleSelection = async (selectedType: 'client' | 'freelancer') => {
    setLoading(true);
    try {
      console.log('Updating user type to:', selectedType);
      
      // Update user profile with selected type
      const response = await api.patch('/profile/update/', {
        user_type: selectedType
      });
      
      console.log('Profile updated successfully');
      
      // Update local profile state
      const updatedProfile = { ...profile, user_type: selectedType };
      setProfile(updatedProfile);
      
      toast.success(`Welcome! You're now set up as a ${selectedType}.`);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to update user type:', error);
      toast.error('Failed to update user type. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F6EB] via-white to-[#E8F5F3] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0D9E86] dark:bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#FF8559] dark:bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-purple-300 dark:bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
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
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
              What do you want to do today?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
              Hi {user?.first_name || user?.username}! 👋 Choose how you'd like to get started.
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4">
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-2xl sm:rounded-2xl sm:px-10 border dark:border-gray-700">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Hire a Freelancer Card */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hire a Freelancer</h3>
                <button
                  onClick={() => handleRoleSelection('client')}
                  disabled={loading}
                  className="w-full p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-300 text-center group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
                  <div className="font-bold text-xl text-gray-900 dark:text-white mb-3">I'm a Client</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    Find and hire AI experts for your projects
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20 rounded-lg py-2 px-3">
                    Post jobs • Hire talent • Manage projects
                  </div>
                </button>
              </div>

              {/* Work as a Freelancer Card */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Work as a Freelancer</h3>
                <button
                  onClick={() => handleRoleSelection('freelancer')}
                  disabled={loading}
                  className="w-full p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-500 dark:hover:border-green-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 transition-all duration-300 text-center group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
                  <div className="font-bold text-xl text-gray-900 dark:text-white mb-3">I'm a Freelancer</div>
                  <div className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    Offer your AI expertise and earn money
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/20 rounded-lg py-2 px-3">
                    Create gigs • Find jobs • Build portfolio
                  </div>
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-1">
                  💡 Flexible Choice
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  You can always switch between roles later in your profile settings
                </p>
              </div>
              {loading && (
                <div className="mt-4 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg py-3 px-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">Setting up your account...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}