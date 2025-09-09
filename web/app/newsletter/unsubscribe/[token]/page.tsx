'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaHome, FaHeart, FaSadTear } from 'react-icons/fa';
import { BiSupport } from 'react-icons/bi';
import { newsletterService } from '../../../../lib/newsletter';

const NewsletterUnsubscribePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already_unsubscribed'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const unsubscribeUser = async () => {
      try {
        const token = params.token as string;
        if (!token) {
          setStatus('error');
          setMessage('Invalid unsubscribe link');
          return;
        }

        const response = await newsletterService.unsubscribe(token);
        
        if (response.already_unsubscribed) {
          setStatus('already_unsubscribed');
          setMessage(response.message);
        } else if (response.unsubscribed) {
          setStatus('success');
          setMessage(response.message);
        } else {
          setStatus('error');
          setMessage('Unsubscribe failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Unsubscribe failed');
      }
    };

    unsubscribeUser();
  }, [params.token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {status === 'loading' && (
            <div className="text-center">
              <FaSpinner className="animate-spin text-6xl text-blue-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Processing Request</h1>
              <p className="text-gray-600 text-lg">Please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <FaCheckCircle className="text-6xl text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Successfully Unsubscribed</h1>
              <p className="text-gray-600 text-lg mb-8">{message}</p>
              <div className="flex gap-4 justify-center">
                <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  <FaHome className="inline mr-2" />Back to Home
                </Link>
                <button onClick={() => router.push('/#newsletter')} className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50">
                  Resubscribe
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Unsubscribe Failed</h1>
              <p className="text-gray-600 text-lg mb-8">{message}</p>
              <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                <FaHome className="inline mr-2" />Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsletterUnsubscribePage;