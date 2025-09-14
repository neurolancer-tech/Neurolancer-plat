'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile } from '@/lib/auth';
import { getProfileCompletionPercentage } from '@/lib/profile';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileCompletionModal({ isOpen, onClose }: ProfileCompletionModalProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const userProfile = getProfile();
      if (userProfile) {
        setProfile(userProfile);
        setCompletionPercentage(getProfileCompletionPercentage(userProfile));
      }
    }
  }, [isOpen]);

  const handleCompleteProfile = () => {
    onClose();
    router.push('/auth/complete-profile');
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Complete Your Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Help others learn more about you by completing your profile
          </p>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Profile Completion
            </span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm">
            <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
              profile?.phone_verified ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              {profile?.phone_verified && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={profile?.phone_verified ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
              Phone verification
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
              profile?.country ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              {profile?.country && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={profile?.country ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
              Location information
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <div className={`w-4 h-4 rounded-full mr-3 flex items-center justify-center ${
              profile?.skills ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              {profile?.skills && (
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={profile?.skills ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
              Professional information
            </span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleCompleteProfile}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Complete Profile
          </button>
        </div>
      </div>
    </div>
  );
}