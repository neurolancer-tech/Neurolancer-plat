'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { convertUSDToKES } from '@/lib/currency';

interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail?: string;
  rating: number;
  enrollment_count: number;
  duration_hours: number;
  difficulty_level: string;
}

function CourseCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [kesPrice, setKesPrice] = useState(0);
  const [processingFee, setProcessingFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('paystack');
  const initialized = useRef(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    const courseId = searchParams.get('courseId');
    if (!courseId) {
      toast.error('Course not found');
      router.push('/courses');
      return;
    }

    loadCourse(courseId);
  }, [router, searchParams]);

  const loadCourse = async (courseId: string) => {
    try {
      const response = await api.get(`/courses/${courseId}/`);
      const courseData = response.data;
      setCourse(courseData);
      
      // Convert USD to KES
      const converted = await convertUSDToKES(courseData.price);
      const fee = Math.round(converted * 0.05);
      const total = converted + fee;
      
      setKesPrice(converted);
      setProcessingFee(fee);
      setTotalAmount(total);
    } catch (error) {
      console.error('Error loading course:', error);
      toast.error('Failed to load course details');
      router.push('/courses');
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      if (paymentMethod === 'paystack') {
        await processPaystackPayment();
      } else {
        if (!course) {
          toast.error('Course not found');
          return;
        }
        
        const response = await api.post('/payments/initialize/', {
          payment_type: 'course',
          course_id: course.id,
          amount: course.price
        });
        
        if (response.data.status === 'success') {
          const { authorization_url } = response.data.data;
          window.location.href = authorization_url;
        } else {
          throw new Error(response.data.error || 'Payment initialization failed');
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error((error as any).response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const processPaystackPayment = async () => {
    const PaystackPop = (window as any).PaystackPop;
    if (!PaystackPop) {
      toast.error('Paystack not loaded. Please refresh the page.');
      return;
    }

    const handler = PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      email: getCurrentUserEmail(),
      amount: Math.round(totalAmount * 100),
      currency: 'KES',
      ref: `course_${course?.id}_${Date.now()}`,
      callback: function(response: any) {
        toast.success('Payment successful!');
        enrollInCourse(response.reference);
      },
      onClose: function() {
        toast('Payment cancelled');
      }
    });
    
    handler.openIframe();
  };

  const getCurrentUserEmail = () => {
    if (typeof window !== 'undefined') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.email || 'test@example.com';
    }
    return 'test@example.com';
  };

  const enrollInCourse = async (paymentReference: string) => {
    if (!course) {
      toast.error('Course not found');
      return;
    }
    
    try {
      const response = await api.post(`/courses/${course.id}/enroll/`, {
        payment_reference: paymentReference
      });
      
      if (response.status === 201) {
        toast.success('Successfully enrolled in course!');
        router.push('/my-courses');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error('Payment successful but enrollment failed. Please contact support.');
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-8"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Course Enrollment</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Complete your payment to access the course</p>
          </div>

          <div className="p-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-4">
                {course.thumbnail && (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{course.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">{course.description}</p>
                  <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>⭐ {course.rating}/5</span>
                    <span>👥 {course.enrollment_count} students</span>
                    <span>⏱️ {course.duration_hours} hours</span>
                    <span className="capitalize">📊 {course.difficulty_level}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Course Price:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">KES {kesPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Processing Fee (5%):</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">KES {processingFee.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Total Amount:</span>
                    <span className="text-[#0D9E86]">KES {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Payment Method</h3>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-[#0D9E86] bg-white dark:bg-gray-700">
                  <input 
                    type="radio" 
                    name="payment" 
                    value="paystack" 
                    checked={paymentMethod === 'paystack'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="sr-only" 
                  />
                  <div className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
                    paymentMethod === 'paystack' ? 'border-[#0D9E86]' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'paystack' && <div className="w-2 h-2 bg-[#0D9E86] rounded-full"></div>}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-8 h-8 mr-3 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <div>
                      <span className="font-medium text-blue-700 dark:text-blue-400">Paystack</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Card, Bank Transfer, M-Pesa</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900">Secure Payment</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    Your payment is processed securely through Paystack. After successful payment, you&apos;ll get instant access to the course.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Link
                href="/courses"
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Back to Courses
              </Link>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="bg-[#0D9E86] text-white px-6 py-3 rounded-lg hover:bg-[#0B8A73] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Enroll Now - KES {totalAmount.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CourseCheckoutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourseCheckoutContent />
    </Suspense>
  );
}
