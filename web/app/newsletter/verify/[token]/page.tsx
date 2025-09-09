'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaEnvelope, FaHome } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';
import { newsletterService } from '../../../../lib/newsletter';

const NewsletterVerifyPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_verified'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        const token = params.token as string;
        if (!token) {
          setStatus('error');
          setMessage('Invalid verification link');
          return;
        }

        const response = await newsletterService.verify(token);
        
        if (response.already_verified) {
          setStatus('already_verified');
          setMessage(response.message);
        } else if (response.verified) {
          setStatus('success');
          setMessage(response.message);
        } else {
          setStatus('error');
          setMessage('Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Verification failed');
      }
    };

    verifySubscription();
  }, [params.token]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <FaSpinner className="animate-spin text-6xl text-blue-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Verifying Your Subscription
            </h1>
            <p className="text-gray-600 text-lg">
              Please wait while we confirm your newsletter subscription...
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="relative mb-6">
              <FaCheckCircle className="text-6xl text-green-500 mx-auto" />
              <HiSparkles className="absolute -top-2 -right-2 text-2xl text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              🎉 Subscription Confirmed!
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              {message}
            </p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">What&apos;s Next?</h2>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start">
                  <FaEnvelope className="text-blue-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Weekly Insights</h3>
                    <p className="text-sm text-gray-600">Get the latest AI trends and opportunities every Tuesday</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <HiSparkles className="text-purple-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Exclusive Content</h3>
                    <p className="text-sm text-gray-600">Access premium resources and success stories</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                <FaHome className="mr-2" />
                Explore Neurolancer
              </Link>
              <Link
                href="/learning"
                className="inline-flex items-center px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300"
              >
                Start Learning
              </Link>
            </div>
          </div>
        );

      case 'already_verified':
        return (
          <div className="text-center">
            <FaCheckCircle className="text-6xl text-blue-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Already Verified
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              {message}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
            >
              <FaHome className="mr-2" />
              Back to Home
            </Link>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Verification Failed
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              {message}
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Possible Reasons:</h2>
              <ul className="text-left text-red-700 space-y-1">
                <li>• The verification link has expired</li>
                <li>• The link has already been used</li>
                <li>• The link is invalid or corrupted</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                <FaHome className="mr-2" />
                Back to Home
              </Link>
              <button
                onClick={() => router.push('/#newsletter')}
                className="inline-flex items-center px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-300"
              >
                Subscribe Again
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {renderContent()}
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200 rounded-full opacity-20 blur-xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-200 rounded-full opacity-20 blur-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterVerifyPage;