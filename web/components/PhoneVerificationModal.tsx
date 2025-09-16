'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import FirebasePhoneVerification from './FirebasePhoneVerification';
import { getIdToken } from 'firebase/auth';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PhoneVerificationModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: PhoneVerificationModalProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerificationSuccess = async (phoneNumber: string) => {
    setLoading(true);
    setError('');

    try {
      // Get Firebase ID token
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      const idToken = await getIdToken(user);

      // Send to backend for verification
      const response = await fetch('/api/auth/verify-phone-number/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          firebase_token: idToken,
          phone_number: phoneNumber
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setError(error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Verify Phone Number</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Verifying...</p>
          </div>
        )}

        {!loading && (
          <FirebasePhoneVerification
            onVerificationSuccess={handleVerificationSuccess}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
}