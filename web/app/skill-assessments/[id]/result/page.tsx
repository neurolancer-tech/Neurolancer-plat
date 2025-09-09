'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AssessmentResult {
  score: number;
  passed: boolean;
  total_points: number;
  earned_points: number;
  time_spent: number;
  correct_answers: number;
  total_questions: number;
  badge_earned?: {
    id: number;
    badge_level: string;
    score_percentage: number;
    earned_at: string;
  };
}

export default function AssessmentResultPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');

  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    
    if (!attemptId) {
      toast.error('Invalid assessment attempt');
      router.push(`/skill-assessments/${params.id}`);
      return;
    }
    
    loadResult();
  }, [params.id, attemptId]);

  const loadResult = async () => {
    try {
      const response = await api.get(`/assessments/attempts/${attemptId}/result/`);
      setResult(response.data);
    } catch (error) {
      console.error('Error loading result:', error);
      toast.error('Failed to load assessment result');
      router.push(`/skill-assessments/${params.id}`);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'platinum': return 'from-purple-400 to-purple-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'bronze': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getBadgeIcon = (level: string) => {
    switch (level) {
      case 'platinum': return '💎';
      case 'gold': return '🥇';
      case 'silver': return '🥈';
      case 'bronze': return '🥉';
      default: return '🏅';
    }
  };

  const getScoreColor = (score: number, passed: boolean) => {
    if (!passed) return 'text-red-600';
    if (score >= 95) return 'text-purple-600';
    if (score >= 85) return 'text-yellow-600';
    if (score >= 75) return 'text-gray-600';
    return 'text-orange-600';
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Result not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
            result.passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <i className={`text-4xl ${
              result.passed ? 'fas fa-check text-green-600' : 'fas fa-times text-red-600'
            }`}></i>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Assessment {result.passed ? 'Completed!' : 'Not Passed'}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {result.passed 
              ? 'Congratulations! You have successfully passed the assessment.'
              : 'Don\'t worry, you can retake the assessment to improve your score.'
            }
          </p>
        </div>

        {/* Score Display */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <div className={`text-8xl font-bold mb-4 ${getScoreColor(result.score, result.passed)}`}>
              {result.score}%
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {result.correct_answers}/{result.total_questions}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Correct Answers</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {result.earned_points}/{result.total_points}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Points Earned</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(result.time_spent)}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Time Spent</div>
              </div>
              
              <div className="text-center">
                <div className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {result.passed ? 'PASSED' : 'FAILED'}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Status</div>
              </div>
            </div>
          </div>
        </div>

        {/* Badge Earned */}
        {result.badge_earned && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                🎉 Badge Earned!
              </h2>
              
              <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br ${getBadgeColor(result.badge_earned.badge_level)} mb-6`}>
                <span className="text-6xl">
                  {getBadgeIcon(result.badge_earned.badge_level)}
                </span>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {result.badge_earned.badge_level.charAt(0).toUpperCase() + result.badge_earned.badge_level.slice(1)} Badge
              </h3>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This badge will be displayed on your profile to showcase your expertise to potential clients.
              </p>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 inline-block">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Earned on {new Date(result.badge_earned.earned_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Performance Breakdown</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Accuracy Rate</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(result.correct_answers / result.total_questions) * 100}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round((result.correct_answers / result.total_questions) * 100)}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Points Efficiency</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(result.earned_points / result.total_points) * 100}%` }}
                  ></div>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.round((result.earned_points / result.total_points) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What's Next?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.passed ? (
              <>
                <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <i className="fas fa-user-circle text-2xl text-green-600 mb-3"></i>
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    Update Your Profile
                  </h3>
                  <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                    Your new badge is now visible on your freelancer profile.
                  </p>
                  <button
                    onClick={() => router.push('/profile')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    View Profile
                  </button>
                </div>
                
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <i className="fas fa-search text-2xl text-blue-600 mb-3"></i>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Find Relevant Jobs
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm mb-4">
                    Look for projects that match your newly verified skills.
                  </p>
                  <button
                    onClick={() => router.push('/jobs')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Browse Jobs
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <i className="fas fa-redo text-2xl text-orange-600 mb-3"></i>
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                    Retake Assessment
                  </h3>
                  <p className="text-orange-700 dark:text-orange-300 text-sm mb-4">
                    You can retake this assessment to improve your score.
                  </p>
                  <button
                    onClick={() => router.push(`/skill-assessments/${params.id}`)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Try Again
                  </button>
                </div>
                
                <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <i className="fas fa-book text-2xl text-purple-600 mb-3"></i>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                    Study More
                  </h3>
                  <p className="text-purple-700 dark:text-purple-300 text-sm mb-4">
                    Check out our courses to improve your skills.
                  </p>
                  <button
                    onClick={() => router.push('/courses')}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                  >
                    Browse Courses
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/skill-assessments')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
          >
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Assessments
          </button>
          
          <button
            onClick={() => router.push('/skill-assessments/my-attempts')}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all"
          >
            <i className="fas fa-history mr-2"></i>
            View All Attempts
          </button>
        </div>
      </div>
    </div>
  );
}