'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import PriceDisplay from '@/components/PriceDisplay';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  category: {
    id: number;
    name: string;
  };
  price: number;
  difficulty_level: string;
  duration_hours: number;
  rating: number;
  total_reviews: number;
  enrollment_count: number;
  learning_outcomes: string[];
  requirements: string[];
  thumbnail: string;
  status: string;
  created_at: string;
  lessons_count: number;
  is_enrolled?: boolean;
}

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadCourse();
  }, [params.id]);

  const loadCourse = async () => {
    try {
      const response = await api.get(`/courses/${params.id}/`);
      setCourse(response.data);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    
    setEnrolling(true);
    try {
      await api.post(`/courses/${course.id}/enroll/`);
      toast.success('Successfully enrolled in course!');
      setCourse(prev => prev ? { ...prev, is_enrolled: true } : null);
      router.push(`/courses/${course.id}/learn`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to enroll');
    } finally {
      setEnrolling(false);
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

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold text-gray-900">Course not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="md:flex">
            <div className="md:w-1/3">
              <img
                src={course.thumbnail || '/api/placeholder/400/300'}
                alt={course.title}
                className="w-full h-64 md:h-full object-cover"
              />
            </div>
            <div className="md:w-2/3 p-6">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {course.category.name}
                </span>
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                  {course.difficulty_level}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{course.title}</h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-4 h-4 ${i < Math.floor(Number(course.rating || 0)) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    {Number(course.rating || 0).toFixed(1)} ({course.total_reviews || 0} reviews)
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{course.enrollment_count} students</span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">{course.description}</p>
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-3xl font-bold text-primary">${course.price}</span>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    By {course.instructor.first_name} {course.instructor.last_name}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  {course.is_enrolled ? (
                    <button
                      onClick={() => router.push(`/courses/${course.id}/learn`)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                    >
                      Go to Course
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push(`/course-checkout?courseId=${course.id}`)}
                      disabled={enrolling}
                      className="bg-[#0D9E86] text-white px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">What you&apos;ll learn</h3>
              <ul className="space-y-2">
                {Array.isArray(course.learning_outcomes) ? course.learning_outcomes.map((outcome, index) => (
                  <li key={index} className="flex items-start text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {outcome}
                  </li>
                )) : (
                  <li className="text-gray-500 dark:text-gray-400">No learning outcomes available</li>
                )}
              </ul>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="card rounded-lg shadow-sm p-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-gray-100">Course Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="text-gray-900 dark:text-gray-100">{course.duration_hours} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Level</span>
                  <span className="text-gray-900 dark:text-gray-100">{course.difficulty_level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Students</span>
                  <span className="text-gray-900 dark:text-gray-100">{course.enrollment_count}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}