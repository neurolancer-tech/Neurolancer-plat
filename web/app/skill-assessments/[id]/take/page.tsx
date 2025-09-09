'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Question {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  is_required: boolean;
  options: {
    id: number;
    option_text: string;
    order: number;
  }[];
}

interface Answer {
  question_id: number;
  selected_option_id?: number;
  text_answer?: string;
}

export default function TakeAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get('attempt');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    
    loadQuestions();
  }, [params.id, attemptId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitAssessment();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const loadQuestions = async () => {
    try {
      const response = await api.get(`/assessments/${params.id}/questions/`);
      setQuestions(response.data.questions);
      setTimeRemaining(response.data.time_remaining);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load assessment questions');
      router.push(`/skill-assessments/${params.id}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = async (questionId: number, answer: Answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    
    // Auto-save answer
    try {
      await api.post(`/assessments/attempts/${attemptId}/answer/`, {
        question_id: questionId,
        selected_option_id: answer.selected_option_id,
        text_answer: answer.text_answer
      });
    } catch (error) {
      console.error('Error saving answer:', error);
      // Don't show error toast for auto-save failures
    }
  };

  const handleSubmitAssessment = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      const response = await api.post(`/assessments/attempts/${attemptId}/submit/`);
      
      toast.success('Assessment submitted successfully!');
      router.push(`/skill-assessments/${params.id}/result?attempt=${attemptId}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining > 300) return 'text-green-600'; // > 5 minutes
    if (timeRemaining > 60) return 'text-yellow-600';  // > 1 minute
    return 'text-red-600'; // < 1 minute
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;

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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">No questions found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Assessment in Progress
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="text-right">
              <div className={`text-3xl font-bold ${getTimeColor()}`}>
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Time Remaining</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'Point' : 'Points'}
              </span>
              {currentQuestion.is_required && (
                <span className="text-red-500 text-sm">* Required</span>
              )}
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {currentQuestion.question_type === 'multiple_choice' && (
              <>
                {currentQuestion.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      currentAnswer?.selected_option_id === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.id}
                      checked={currentAnswer?.selected_option_id === option.id}
                      onChange={() => handleAnswerChange(currentQuestion.id, {
                        question_id: currentQuestion.id,
                        selected_option_id: option.id
                      })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      currentAnswer?.selected_option_id === option.id
                        ? 'border-primary bg-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {currentAnswer?.selected_option_id === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">{option.option_text}</span>
                  </label>
                ))}
              </>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <>
                {currentQuestion.options.map((option) => (
                  <label
                    key={option.id}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      currentAnswer?.selected_option_id === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.id}
                      checked={currentAnswer?.selected_option_id === option.id}
                      onChange={() => handleAnswerChange(currentQuestion.id, {
                        question_id: currentQuestion.id,
                        selected_option_id: option.id
                      })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                      currentAnswer?.selected_option_id === option.id
                        ? 'border-primary bg-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {currentAnswer?.selected_option_id === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-gray-900 dark:text-white">{option.option_text}</span>
                  </label>
                ))}
              </>
            )}

            {(currentQuestion.question_type === 'text' || currentQuestion.question_type === 'coding') && (
              <textarea
                value={currentAnswer?.text_answer || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, {
                  question_id: currentQuestion.id,
                  text_answer: e.target.value
                })}
                placeholder="Enter your answer here..."
                rows={6}
                className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>

          <div className="flex items-center space-x-4">
            {/* Question Navigation */}
            <div className="flex items-center space-x-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-white'
                      : answers[questions[index].id]
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <button
              onClick={handleSubmitAssessment}
              disabled={submitting}
              className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Submitting...
                </>
              ) : (
                <>
                  Submit Assessment
                  <i className="fas fa-check ml-2"></i>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-all"
            >
              Next
              <i className="fas fa-chevron-right ml-2"></i>
            </button>
          )}
        </div>

        {/* Warning for time */}
        {timeRemaining <= 300 && timeRemaining > 0 && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <span className="font-medium">
                {timeRemaining <= 60 ? 'Less than 1 minute remaining!' : 'Less than 5 minutes remaining!'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}