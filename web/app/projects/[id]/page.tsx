'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TaskCard from '../../../components/TaskCard';
import CreateTaskModal from '../../../components/CreateTaskModal';
import ProjectTeamModal from '../../../components/ProjectTeamModal';
import Navigation from '../../../components/Navigation';
import api from '../../../lib/api';

interface Task {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  budget: number;
  deadline: string;
  assigned_freelancer?: {
    id: number;
    first_name: string;
    last_name: string;
    profile_picture?: string;
  };
  progress: number;
  order?: {
    id: number;
    status: string;
  };
}

interface Project {
  id: number;
  title: string;
  description: string;
  status: string;
  total_budget: number;
  created_at: string;
  deadline?: string;
  category: string;
  requirements: string;
  tasks: Task[];
  team_members: any[];
  conversation_id?: number;
  progress: {
    percentage: number;
    completed: number;
    total: number;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (params.id) {
      loadProject();
      // Auto-refresh every 5 seconds to show status updates
      const interval = setInterval(loadProject, 5000);
      return () => clearInterval(interval);
    }
  }, [params.id]);

  const loadProject = async () => {
    try {
      const response = await api.get(`/projects/${params.id}/`);
      console.log('Project data:', response.data); // Debug log
      setProject(response.data);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F6EB] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#F6F6EB] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600">The project you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const progressPercentage = project.progress?.percentage || 0;

  return (
    <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900">
      <Navigation />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push('/projects')}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Projects
            </button>
          </div>
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{project.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">{project.description}</p>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)} w-fit`}>
                  {project.status.replace('_', ' ')}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
                {project.deadline && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Due {new Date(project.deadline).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowTeamModal(true)}
                className="btn-outline flex items-center justify-center space-x-2 text-sm px-3 py-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Team ({project.team_members.length})</span>
              </button>
              <button
                onClick={() => setShowCreateTask(true)}
                className="btn-primary flex items-center justify-center space-x-2 text-sm px-3 py-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Project Progress</span>
              <span>{progressPercentage}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-[#0D9E86] h-3 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-[#0D9E86]">${project.total_budget.toLocaleString()}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Budget</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{project.progress?.total || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-green-600">{project.progress?.completed || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-2xl font-bold text-blue-600">{project.team_members?.length || 0}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Team Members</div>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Project Tasks</h2>
            <button
              onClick={() => setShowCreateTask(true)}
              className="btn-primary flex items-center justify-center space-x-2 text-sm px-3 py-2 w-full sm:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Task</span>
            </button>
          </div>

          {project.tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tasks yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Break down your project into manageable tasks</p>
              <button
                onClick={() => setShowCreateTask(true)}
                className="btn-primary"
              >
                Create First Task
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {project.tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onTaskUpdate={loadProject}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={project.id}
        onTaskCreated={loadProject}
      />

      <ProjectTeamModal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        project={project}
      />
    </div>
  );
}