'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Course {
  id: number;
  title: string;
  instructor: {
    first_name: string;
    last_name: string;
  };
}

function CourseReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course');
  
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    
    if (!courseId) {
      router.push('/my-courses');
      return;
    }
    
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}/`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
      router.push('/my-courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reviewData.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/courses/${courseId}/reviews/`, {
        rating: reviewData.rating,
        comment: reviewData.comment.trim()
      });
      
      toast.success('Review submitted successfully!');
      router.push('/my-courses');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Completed!</h1>
            <p className="text-gray-600">How was your learning experience?</p>
          </div>
          
          {course && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="font-semibold text-lg">{course.title}</h2>
              <p className="text-gray-600">
                by {course.instructor.first_name} {course.instructor.last_name}
              </p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate this course
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                    className={`text-3xl ${
                      star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {reviewData.rating} star{reviewData.rating !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Write your review
              </label>
              <textarea
                value={reviewData.comment}
                onChange={(e) => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                rows={6}
                placeholder="Share your thoughts about this course. What did you like? What could be improved?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/my-courses')}
                className="btn-secondary"
              >
                Skip Review
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CourseReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourseReviewContent />
    </Suspense>
  );
}
