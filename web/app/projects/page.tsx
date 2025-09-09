'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CreateProjectModal from '../../components/CreateProjectModal';
import Navigation from '../../components/Navigation';
import api from '../../lib/api';

interface Project {
  id: number;
  title: string;
  description: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  total_budget: number;
  deadline?: string;
  category: string;
  requirements: string;
  tasks_count: number;
  team_members_count: number;
  conversation_id?: number;
  progress: {
    percentage: number;
    completed: number;
    total: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTask, setRatingTask] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await api.get('/projects/');
      setProjects(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => 
    filter === 'all' || project.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (project: Project) => {
    return project.progress?.percentage || 0;
  };

  const handleRateFreelancer = (task: any) => {
    setRatingTask(task);
    setShowRatingModal(true);
  };

  const submitRating = async () => {
    if (!ratingTask) return;
    
    try {
      await api.post('/reviews/', {
        freelancer: ratingTask.assigned_freelancer.id,
        task: ratingTask.id,
        rating: rating,
        review_text: reviewText
      });
      
      alert('Rating submitted successfully!');
      setShowRatingModal(false);
      setRatingTask(null);
      setRating(5);
      setReviewText('');
      loadProjects();
    } catch (error: any) {
      alert('Failed to submit rating');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F6EB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900">
      <Navigation />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Projects</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">Manage your AI projects and collaborate with freelancers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center space-x-2 w-full sm:w-auto px-4 py-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Project</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
          {[
            { key: 'all', label: 'All Projects' },
            { key: 'planning', label: 'Planning' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' },
            { key: 'on_hold', label: 'On Hold' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                filter === key
                  ? 'bg-[#0D9E86] text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first project to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-2 sm:space-y-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {project.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)} w-fit`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(project)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#0D9E86] h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(project)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      {project.tasks_count || 0} tasks
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      {project.team_members_count || 0} members
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-lg font-semibold text-[#0D9E86]">
                      ${project.total_budget.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
      
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={loadProjects}
      />

      {/* Rating Modal */}
      {showRatingModal && ratingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 sm:p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Rate Freelancer
              </h2>
              <button
                onClick={() => setShowRatingModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">{ratingTask.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">How was your experience with this freelancer?</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent"
                placeholder="Share your experience working with this freelancer..."
              />
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowRatingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={submitRating}
                className="flex-1 px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:opacity-90"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}