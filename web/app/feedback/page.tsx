'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    feedback_type: '',
    rating: 5,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const user = Cookies.get('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setFormData(prev => ({
          ...prev,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}`.trim()
            : userData.username || '',
          email: userData.email || ''
        }));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post('/feedback/submit/', formData);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setFormData({ name: '', email: '', feedback_type: '', rating: 5, message: '' });
      } else {
        toast.error(response.data.error || 'Failed to send feedback');
      }
    } catch (error: any) {
      console.error('Feedback form error:', error);
      const errorMessage = error.response?.data?.error || 'Failed to send feedback. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Send Feedback</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">Help us improve Neurolancer with your suggestions</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback Type</label>
              <select
                required
                value={formData.feedback_type}
                onChange={(e) => setFormData({...formData, feedback_type: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select feedback type</option>
                <option value="bug_report">Bug Report</option>
                <option value="feature_request">Feature Request</option>
                <option value="ui_improvement">UI/UX Improvement</option>
                <option value="performance">Performance Issue</option>
                <option value="suggestion">General Suggestion</option>
                <option value="compliment">Compliment</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Overall Rating: {formData.rating}/5
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({...formData, rating: star})}
                    className={`text-3xl ${star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Feedback</label>
              <textarea
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Tell us what you think about Neurolancer..."
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0D9E86] text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? 'Sending...' : 'Send Feedback'}
            </button>
          </form>
        </div>

        <div className="mt-8 bg-gradient-to-r from-[#0D9E86] to-teal-600 rounded-xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Thank You!</h3>
          <p>Your feedback helps us build a better platform for the AI community. Every suggestion matters to us.</p>
        </div>
      </div>
    </div>
  );
}