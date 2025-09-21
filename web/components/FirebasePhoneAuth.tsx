'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface FirebasePhoneAuthProps {
  onVerificationSuccess: (phoneNumber: string) => void;
  onError: (error: string) => void;
}

export default function FirebasePhoneAuth({ onVerificationSuccess, onError }: FirebasePhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
        }
      });
    }
  };

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      onError('Please enter a phone number');
      return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setCodeSent(true);
      console.log('SMS sent successfully');
    } catch (error: any) {
      console.error('SMS sending failed:', error);
      onError(error.message || 'Failed to send SMS');
      
      // Reset reCAPTCHA on error (guarded)
      try {
        if ((window as any).recaptchaVerifier && typeof (window as any).recaptchaVerifier.clear === 'function') {
          (window as any).recaptchaVerifier.clear();
        }
      } catch (e) {
        console.warn('recaptcha clear failed (ignored)', e);
      } finally {
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult || !verificationCode) {
      onError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      console.log('Phone verification successful:', result);
      onVerificationSuccess(phoneNumber);
    } catch (error: any) {
      console.error('Verification failed:', error);
      onError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!codeSent ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>
          
          <button
            onClick={sendVerificationCode}
            disabled={loading || !phoneNumber}
            className="w-full btn-primary disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the 6-digit code sent to {phoneNumber}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={verifyCode}
              disabled={loading || !verificationCode}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <button
              onClick={() => {
                setCodeSent(false);
                setVerificationCode('');
                setConfirmationResult(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Change Number
            </button>
          </div>
        </>
      )}
      
      {/* reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}