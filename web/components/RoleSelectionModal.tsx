'use client';

import { useState } from 'react';
import api from '../lib/api';

interface RoleSelectionModalProps {
  isOpen: boolean;
  onComplete: (userType: 'client' | 'freelancer') => void;
}

export default function RoleSelectionModal({ isOpen, onComplete }: RoleSelectionModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleRoleSelection = async (selectedType: 'client' | 'freelancer') => {
    setLoading(true);
    try {
      console.log('Updating user type to:', selectedType);
      
      // Update user profile with selected type
      await api.patch('/profile/update/', {
        user_type: selectedType
      });
      
      console.log('Profile updated successfully');
      onComplete(selectedType);
    } catch (error) {
      console.error('Failed to update user type:', error);
      // Still complete even if API fails to prevent blocking
      onComplete(selectedType);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Neurolancer!</h2>
          <p className="text-gray-600 dark:text-gray-300">How do you plan to use our platform?</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => handleRoleSelection('client')}
            disabled={loading}
            className="w-full p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 dark:hover:from-blue-900/20 dark:hover:to-blue-800/20 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              <div className="text-4xl mr-4 group-hover:scale-110 transition-transform">🎯</div>
              <div>
                <div className="font-semibold text-lg text-gray-900 dark:text-white">I'm a Client</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">I want to hire AI experts for my projects</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleRoleSelection('freelancer')}
            disabled={loading}
            className="w-full p-6 border-2 border-gray-200 dark:border-gray-600 rounded-xl hover:border-green-500 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20 transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center">
              <div className="text-4xl mr-4 group-hover:scale-110 transition-transform">🚀</div>
              <div>
                <div className="font-semibold text-lg text-gray-900 dark:text-white">I'm a Freelancer</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">I want to offer my AI expertise and services</div>
              </div>
            </div>
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Don't worry, you can change this later in your profile settings
          </p>
          {loading && (
            <div className="mt-4 flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Updating profile...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}