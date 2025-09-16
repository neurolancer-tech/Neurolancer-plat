'use client';

import { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential
} from 'firebase/auth';

interface FirebasePhoneVerificationProps {
  onVerificationSuccess: (phoneNumber: string) => void;
  onError: (error: string) => void;
}

export default function FirebasePhoneVerification({ 
  onVerificationSuccess, 
  onError 
}: FirebasePhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifier = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // Initialize reCAPTCHA
    if (recaptchaRef.current && !recaptchaVerifier.current) {
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          onError('reCAPTCHA expired. Please try again.');
        }
      });
    }

    return () => {
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = null;
      }
    };
  }, [onError]);

  const sendVerificationCode = async () => {
    if (!phoneNumber) {
      onError('Please enter a phone number');
      return;
    }

    if (!recaptchaVerifier.current) {
      onError('reCAPTCHA not initialized');
      return;
    }

    setLoading(true);
    try {
      // Format phone number to E.164 format
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      const confirmation = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        recaptchaVerifier.current
      );
      
      setConfirmationResult(confirmation);
      setCodeSent(true);
      console.log('SMS sent successfully');
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      onError(error.message || 'Failed to send verification code');
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifier.current) {
        recaptchaVerifier.current.clear();
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'normal',
          callback: () => console.log('reCAPTCHA solved'),
          'expired-callback': () => onError('reCAPTCHA expired. Please try again.')
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult) {
      onError('No verification in progress');
      return;
    }

    if (!verificationCode) {
      onError('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(verificationCode);
      console.log('Phone verification successful:', result);
      
      // Get the phone credential
      const credential = PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        verificationCode
      );
      
      onVerificationSuccess(phoneNumber);
    } catch (error: any) {
      console.error('Error verifying code:', error);
      onError(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setCodeSent(false);
    setConfirmationResult(null);
    setVerificationCode('');
    
    // Reset reCAPTCHA
    if (recaptchaVerifier.current) {
      recaptchaVerifier.current.clear();
      recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'normal',
        callback: () => console.log('reCAPTCHA solved'),
        'expired-callback': () => onError('reCAPTCHA expired. Please try again.')
      });
    }
  };

  return (
    <div className="space-y-4">
      {!codeSent ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter phone number with country code (e.g., +1234567890)
            </p>
          </div>

          <div id="recaptcha-container" ref={recaptchaRef}></div>

          <button
            onClick={sendVerificationCode}
            disabled={loading || !phoneNumber}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </>
      ) : (
        <>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Verification code sent to {phoneNumber}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={verifyCode}
              disabled={loading || !verificationCode}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            
            <button
              onClick={resetVerification}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
          </div>
        </>
      )}
    </div>
  );
}