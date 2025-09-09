'use client';

import Navigation from '@/components/Navigation';
import Link from 'next/link';

export default function SupportPage() {
  const supportOptions = [
    {
      title: 'Help Center',
      description: 'Browse our comprehensive knowledge base',
      icon: '📚',
      link: '/help',
      color: 'bg-blue-500'
    },
    {
      title: 'Contact Support',
      description: 'Get in touch with our support team',
      icon: '💬',
      link: '/contact',
      color: 'bg-green-500'
    },
    {
      title: 'FAQ',
      description: 'Find answers to frequently asked questions',
      icon: '❓',
      link: '/faq',
      color: 'bg-purple-500'
    },
    {
      title: 'Send Feedback',
      description: 'Help us improve Neurolancer',
      icon: '💡',
      link: '/feedback',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Support Center</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">We&apos;re here to help you succeed on Neurolancer</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {supportOptions.map((option, index) => (
            <Link
              key={index}
              href={option.link}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all transform hover:scale-105"
            >
              <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
                {option.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{option.title}</h3>
              <p className="text-gray-600 dark:text-gray-300">{option.description}</p>
            </Link>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-4">
              <div className="bg-[#0D9E86] p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Email Support</h4>
                <p className="text-gray-600 dark:text-gray-300">neurolancermail@gmail.com</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Response within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-[#0D9E86] p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Support Hours</h4>
                <p className="text-gray-600 dark:text-gray-300">24/7 Online Support</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Always here to help</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="bg-[#0D9E86] p-3 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Priority Support</h4>
                <p className="text-gray-600 dark:text-gray-300">Premium members</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Faster response times</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}