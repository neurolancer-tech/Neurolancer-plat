'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AssessmentCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  assessments_count: number;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  category: AssessmentCategory;
  difficulty_level: string;
  duration_minutes: number;
  passing_score: number;
  price: string;
  questions_count: number;
  user_attempts: number;
  best_score: number | null;
  has_paid: boolean;
}

export default function SkillAssessmentsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, assessmentsRes] = await Promise.all([
        api.get('/assessments/categories/'),
        api.get('/assessments/')
      ]);
      
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setAssessments(assessmentsRes.data.results || assessmentsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const filterAssessments = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory.toString());
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);
      
      const response = await api.get(`/assessments/?${params.toString()}`);
      setAssessments(response.data.results || response.data);
    } catch (error) {
      console.error('Error filtering assessments:', error);
      toast.error('Failed to filter assessments');
    }
  };

  useEffect(() => {
    if (!loading) {
      filterAssessments();
    }
  }, [selectedCategory, selectedDifficulty]);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeLevel = (score: number) => {
    if (score >= 95) return { level: 'Platinum', color: 'bg-purple-100 text-purple-800' };
    if (score >= 85) return { level: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 75) return { level: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { level: 'Bronze', color: 'bg-orange-100 text-orange-800' };
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Skill Assessments
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Validate your expertise and earn skill badges to showcase your abilities to potential clients.
            Each assessment costs $5 and provides industry-recognized certification.
          </p>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCategory === null
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
              }`}
            >
              <div className="text-center">
                <i className="fas fa-th-large text-2xl mb-2"></i>
                <h3 className="font-semibold">All Categories</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {assessments.length} assessments
                </p>
              </div>
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedCategory === category.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }`}
              >
                <div className="text-center">
                  <i className={`${category.icon} text-2xl mb-2`}></i>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {category.assessments_count} assessments
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">All Difficulty Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>

        {/* Assessments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {assessment.title}
                    </h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(assessment.difficulty_level)}`}>
                      {assessment.difficulty_level.charAt(0).toUpperCase() + assessment.difficulty_level.slice(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">${assessment.price}</div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {assessment.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assessment.duration_minutes}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {assessment.questions_count}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Questions</div>
                  </div>
                </div>

                {/* User Progress */}
                {assessment.user_attempts > 0 && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attempts: {assessment.user_attempts}
                      </span>
                      {assessment.best_score && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBadgeLevel(assessment.best_score).color}`}>
                          Best: {assessment.best_score}% - {getBadgeLevel(assessment.best_score).level}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => router.push(`/skill-assessments/${assessment.id}`)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                    assessment.has_paid
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-primary hover:bg-primary-dark text-white'
                  }`}
                >
                  {assessment.has_paid ? (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-play mr-2"></i>
                      Take Assessment
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-credit-card mr-2"></i>
                      Purchase & Take
                    </span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {assessments.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-clipboard-list text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No assessments found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters to see more assessments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}