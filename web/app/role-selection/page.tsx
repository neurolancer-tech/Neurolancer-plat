'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { getUser, getProfile, isAuthenticated, setProfile } from '../../lib/auth';

export default function RoleSelectionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setUserProfile] = useState(null);

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

    // If user already has a role, redirect to dashboard
    if (currentProfile?.user_type && currentProfile.user_type !== '') {
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
    <div className="min-h-screen bg-gradient-to-br from-[#F6F6EB] via-white to-[#E8F5F3] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
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
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2">
              Welcome to Neurolancer!
            </h2>
            <p className="text-gray-600 text-lg mb-2">
              Hi {user?.first_name || user?.username}! 👋
            </p>
            <p className="text-gray-600 text-lg">
              How do you plan to use our platform?
            </p>
          </div>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
            <div className="space-y-6">
              <button
                onClick={() => handleRoleSelection('client')}
                disabled={loading}
                className="w-full p-8 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <div className="flex items-center">
                  <div className="text-6xl mr-6 group-hover:scale-110 transition-transform">🎯</div>
                  <div>
                    <div className="font-bold text-2xl text-gray-900 mb-2">I'm a Client</div>
                    <div className="text-gray-600">I want to hire AI experts for my projects</div>
                    <div className="text-sm text-blue-600 mt-2 font-medium">
                      → Post jobs, hire freelancers, manage projects
                    </div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleRoleSelection('freelancer')}
                disabled={loading}
                className="w-full p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
              >
                <div className="flex items-center">
                  <div className="text-6xl mr-6 group-hover:scale-110 transition-transform">🚀</div>
                  <div>
                    <div className="font-bold text-2xl text-gray-900 mb-2">I'm a Freelancer</div>
                    <div className="text-gray-600">I want to offer my AI expertise and services</div>
                    <div className="text-sm text-green-600 mt-2 font-medium">
                      → Create gigs, find jobs, earn money
                    </div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-xs text-gray-500">
                Don't worry, you can change this later in your profile settings
              </p>
              {loading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
                  <span className="text-sm text-gray-600">Setting up your account...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}