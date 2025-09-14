'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import toast from 'react-hot-toast';

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string) => void;
  countryCode: string;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
}

export default function PhoneVerification({ 
  onVerified, 
  countryCode, 
  phoneNumber, 
  onPhoneChange 
}: PhoneVerificationProps) {
  const [step, setStep] = useState<'input' | 'verify' | 'verified'>('input');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !recaptchaVerifier) {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => console.log('reCAPTCHA solved')
      });
      setRecaptchaVerifier(verifier);
    }
  }, []);

  const sendVerificationCode = async () => {
    if (!phoneNumber || !recaptchaVerifier) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep('verify');
      toast.success('Verification code sent to your phone');
    } catch (error: any) {
      console.error('Phone verification error:', error);
      toast.error('Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || !confirmationResult) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(verificationCode);
      setStep('verified');
      onVerified(`${countryCode}${phoneNumber}`);
      toast.success('Phone number verified successfully');
    } catch (error: any) {
      console.error('Code verification error:', error);
      toast.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Phone Number
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm">
            {countryCode}
          </span>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
            placeholder="1234567890"
            disabled={step === 'verified'}
          />
        </div>
      </div>

      {step === 'input' && (
        <button
          type="button"
          onClick={sendVerificationCode}
          disabled={!phoneNumber || loading}
          className="btn-secondary"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter 6-digit code"
              maxLength={6}
            />
          </div>
          <button
            type="button"
            onClick={verifyCode}
            disabled={!verificationCode || loading}
            className="btn-primary"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </div>
      )}

      {step === 'verified' && (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Phone number verified
        </div>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
}