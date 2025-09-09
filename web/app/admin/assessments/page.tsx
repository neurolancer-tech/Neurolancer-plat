'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AssessmentCategory {
  id: number;
  name: string;
  description: string;
  assessments_count: number;
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  category: AssessmentCategory;
  price: string;
  duration_minutes: number;
  passing_score: number;
  is_active: boolean;
  questions_count: number;
  attempts_count: number;
}

interface AssessmentAttempt {
  id: number;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  assessment: {
    title: string;
    category: {
      name: string;
    };
  };
  score: number;
  passed: boolean;
  completed_at: string;
  badge_earned: string | null;
}

export default function AdminAssessmentsPage() {
  const [categories, setCategories] = useState<AssessmentCategory[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'assessments' | 'attempts'>('categories');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesRes, assessmentsRes, attemptsRes] = await Promise.all([
        api.get('/assessments/categories/'),
        api.get('/admin/assessments/'),
        api.get('/admin/assessments/attempts/')
      ]);
      
      setCategories(categoriesRes.data.results || categoriesRes.data);
      setAssessments(assessmentsRes.data.results || assessmentsRes.data);
      setAttempts(attemptsRes.data.results || attemptsRes.data);
    } catch (error) {
      console.error('Error loading assessment data:', error);
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const toggleAssessmentStatus = async (assessmentId: number, isActive: boolean) => {
    try {
      await api.patch(`/admin/assessments/${assessmentId}/`, { is_active: !isActive });
      setAssessments(prev => prev.map(a => 
        a.id === assessmentId ? { ...a, is_active: !isActive } : a
      ));
      toast.success(`Assessment ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update assessment status');
    }
  };

  const deleteAssessment = async (assessmentId: number) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;
    
    try {
      await api.delete(`/admin/assessments/${assessmentId}/`);
      setAssessments(prev => prev.filter(a => a.id !== assessmentId));
      toast.success('Assessment deleted successfully');
    } catch (error) {
      toast.error('Failed to delete assessment');
    }
  };

  const loadQuestions = async (assessmentId: number) => {
    try {
      const response = await api.get(`/admin/assessments/${assessmentId}/questions/`);
      setQuestions(response.data.results || response.data);
    } catch (error) {
      toast.error('Failed to load questions');
    }
  };

  const viewQuestions = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    loadQuestions(assessment.id);
    setShowQuestionsModal(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Skill Assessments</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage assessment categories, tests, and user attempts</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#0D9E86] text-white px-4 py-2 rounded-lg hover:bg-[#0B8A73] transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Create Assessment</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'categories', label: 'Categories', count: categories.length },
              { key: 'assessments', label: 'Assessments', count: assessments.length },
              { key: 'attempts', label: 'Attempts', count: attempts.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-[#0D9E86] text-[#0D9E86]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assessment Categories</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assessments
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {category.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {category.assessments_count} assessments
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Assessments Tab */}
        {activeTab === 'assessments' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assessments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {assessments.map((assessment) => (
                    <tr key={assessment.id}>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {assessment.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {assessment.description.substring(0, 60)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          {assessment.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        ${assessment.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {assessment.duration_minutes} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {assessment.questions_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {assessment.attempts_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          assessment.is_active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {assessment.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => viewQuestions(assessment)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Questions
                          </button>
                          <button
                            onClick={() => {
                              setEditingAssessment(assessment);
                              setShowCreateModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleAssessmentStatus(assessment.id, assessment.is_active)}
                            className={`${
                              assessment.is_active
                                ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300'
                                : 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300'
                            }`}
                          >
                            {assessment.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => deleteAssessment(assessment.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attempts Tab */}
        {activeTab === 'attempts' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assessment Attempts</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Result
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Badge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {attempt.user.first_name} {attempt.user.last_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {attempt.user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {attempt.assessment.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {attempt.assessment.category.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {attempt.score}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          attempt.passed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {attempt.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {attempt.badge_earned ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            {attempt.badge_earned}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">No badge</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Assessment Modal */}
        <CreateAssessmentModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setEditingAssessment(null);
          }}
          assessment={editingAssessment}
          categories={categories}
          onSuccess={() => {
            loadData();
            setShowCreateModal(false);
            setEditingAssessment(null);
          }}
        />

        {/* Questions Modal */}
        <QuestionsModal
          isOpen={showQuestionsModal}
          onClose={() => setShowQuestionsModal(false)}
          assessment={selectedAssessment}
          questions={questions}
          onQuestionsUpdate={() => loadQuestions(selectedAssessment?.id || 0)}
        />
      </div>
    </AdminLayout>
  );
}

// Create Assessment Modal Component
function CreateAssessmentModal({ isOpen, onClose, assessment, categories, onSuccess }: {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  categories: AssessmentCategory[];
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty_level: 'beginner',
    duration_minutes: 60,
    passing_score: 70,
    price: '5.00'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assessment) {
      setFormData({
        title: assessment.title,
        description: assessment.description,
        category: assessment.category.id.toString(),
        difficulty_level: 'beginner', // Default since not in interface
        duration_minutes: assessment.duration_minutes,
        passing_score: assessment.passing_score,
        price: assessment.price
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: '',
        difficulty_level: 'beginner',
        duration_minutes: 60,
        passing_score: 70,
        price: '5.00'
      });
    }
  }, [assessment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { category, ...restData } = formData;
      const data = {
        ...restData,
        category_id: parseInt(category),
        duration_minutes: parseInt(formData.duration_minutes.toString()),
        passing_score: parseInt(formData.passing_score.toString()),
        price: parseFloat(formData.price)
      };

      if (assessment) {
        await api.patch(`/admin/assessments/${assessment.id}/`, data);
        toast.success('Assessment updated successfully');
      } else {
        await api.post('/admin/assessments/', data);
        toast.success('Assessment created successfully');
      }
      
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save assessment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {assessment ? 'Edit Assessment' : 'Create New Assessment'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  min="15"
                  max="180"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={formData.passing_score}
                  onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  min="50"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:bg-[#0B8A73] disabled:opacity-50"
              >
                {loading ? 'Saving...' : (assessment ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Questions Modal Component
function QuestionsModal({ isOpen, onClose, assessment, questions, onQuestionsUpdate }: {
  isOpen: boolean;
  onClose: () => void;
  assessment: Assessment | null;
  questions: any[];
  onQuestionsUpdate: () => void;
}) {
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    options: ['', '', '', ''],
    correct_option: 0
  });
  const [loading, setLoading] = useState(false);

  const addQuestion = async () => {
    if (!assessment) return;
    
    setLoading(true);
    try {
      const data = {
        assessment_id: assessment.id,
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        points: questionForm.points,
        order: questions.length + 1
      };

      const response = await api.post('/admin/assessments/questions/', data);
      
      // Add options for multiple choice questions
      if (questionForm.question_type === 'multiple_choice') {
        for (let i = 0; i < questionForm.options.length; i++) {
          if (questionForm.options[i].trim()) {
            await api.post('/admin/assessments/question-options/', {
              question_id: response.data.id,
              option_text: questionForm.options[i],
              is_correct: i === questionForm.correct_option,
              order: i + 1
            });
          }
        }
      }
      
      toast.success('Question added successfully');
      onQuestionsUpdate();
      setShowAddQuestion(false);
      setQuestionForm({
        question_text: '',
        question_type: 'multiple_choice',
        points: 1,
        options: ['', '', '', ''],
        correct_option: 0
      });
    } catch (error) {
      toast.error('Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    
    try {
      await api.delete(`/admin/assessments/questions/${questionId}/`);
      toast.success('Question deleted successfully');
      onQuestionsUpdate();
    } catch (error) {
      toast.error('Failed to delete question');
    }
  };

  if (!isOpen || !assessment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Questions for {assessment.title}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddQuestion(true)}
                className="bg-[#0D9E86] text-white px-4 py-2 rounded-lg hover:bg-[#0B8A73] text-sm"
              >
                Add Question
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Add Question Form */}
          {showAddQuestion && (
            <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Question</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Question Text
                  </label>
                  <textarea
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Type
                    </label>
                    <select
                      value={questionForm.question_type}
                      onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="text">Text Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {questionForm.question_type === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Options (select correct answer)
                    </label>
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 mb-2">
                        <input
                          type="radio"
                          name="correct_option"
                          checked={questionForm.correct_option === index}
                          onChange={() => setQuestionForm({ ...questionForm, correct_option: index })}
                          className="text-[#0D9E86] focus:ring-[#0D9E86]"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionForm.options];
                            newOptions[index] = e.target.value;
                            setQuestionForm({ ...questionForm, options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddQuestion(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addQuestion}
                    disabled={loading || !questionForm.question_text.trim()}
                    className="px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:bg-[#0B8A73] disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Question'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-4">
            {questions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">No questions added yet.</p>
              </div>
            ) : (
              questions.map((question, index) => (
                <div key={question.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Q{index + 1}. {question.question_text}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>Type: {question.question_type.replace('_', ' ')}</span>
                        <span>Points: {question.points}</span>
                        {question.options && (
                          <span>Options: {question.options.length}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteQuestion(question.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}