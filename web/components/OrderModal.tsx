'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../lib/api';

interface Gig {
  id: number;
  title: string;
  description: string;
  basic_price: number;
  basic_description: string;
  basic_delivery_time: number;
  standard_price?: number;
  standard_description?: string;
  standard_delivery_time?: number;
  premium_price?: number;
  premium_description?: string;
  premium_delivery_time?: number;
  rating: number;
  total_reviews: number;
  freelancer: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  gig: Gig | null;
}

export default function OrderModal({ isOpen, onClose, gig }: OrderModalProps) {
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedTask, setSelectedTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks(selectedProject);
    } else {
      setTasks([]);
      setSelectedTask('');
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      console.log('Loading projects...');
      
      // Check token
      const token = document.cookie.split('; ').find(row => row.startsWith('authToken='))?.split('=')[1];
      console.log('Auth token:', token ? 'exists' : 'missing');
      
      // Check auth status first
      const profileResponse = await api.get('/auth/profile/');
      console.log('Current user:', profileResponse.data);
      console.log('User ID:', profileResponse.data?.user?.id);
      console.log('Username:', profileResponse.data?.user?.username);
      
      const response = await api.get('/projects/');
      console.log('Projects response:', response.data);
      console.log('Projects count:', response.data?.length || 0);
      console.log('Response status:', response.status);
      console.log('Results array:', response.data?.results);
      let projectsData = Array.isArray(response.data?.results) ? response.data.results : (Array.isArray(response.data) ? response.data : []);
      
      // If no projects found, try getting all projects (for testing)
      if (projectsData.length === 0) {
        console.log('No user projects found, checking all projects...');
        try {
          const allResponse = await api.get('/projects/');
          projectsData = Array.isArray(allResponse.data) ? allResponse.data : [];
        } catch (e) {
          console.log('Could not fetch all projects');
        }
      }
      
      console.log('Setting projects:', projectsData);
      setProjects(projectsData);
    } catch (error: unknown) {
      console.error('Error loading projects:', error);
      const status = (error as any)?.response?.status;
      if (status === 401) {
        console.error('User not authenticated');
      }
      setProjects([]);
    }
  };

  const loadTasks = async (projectId: string) => {
    try {
      const response = await api.get(`/projects/${projectId}/`);
      const availableTasks = response.data.tasks?.filter((task: any) => 
        task.status === 'pending' && !task.assigned_freelancer
      ) || [];
      setTasks(availableTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    }
  };

  if (!isOpen || !gig) return null;



  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProject(e.target.value);
    setSelectedTask('');
  };

  const handleAssignToProject = () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }
    setShowTaskModal(true);
  };

  const handleTaskAssignment = async (taskId: string) => {
    setLoading(true);
    try {
      const payload = {
        task_id: taskId,
        freelancer_id: gig.freelancer.id,
        gig_id: gig.id,
        message: `Task assignment from gig: ${gig.title}`
      };
      console.log('Sending task assignment:', payload);
      
      const response = await api.post('/task-assignments/create/', payload);
      
      alert('Task assigned to freelancer! Notification sent.');
      setShowTaskModal(false);
      onClose();
      // Redirect to project page
      window.location.href = `/projects/${selectedProject}`;
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to assign task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-container">
      <div className="modal-content card">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Assign Freelancer to Task</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Freelancer Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Assigning to Freelancer:</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                {gig.freelancer.first_name.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{gig.freelancer.first_name} {gig.freelancer.last_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Gig: {gig.title}</p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span>★ {gig.rating} ({gig.total_reviews} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Project *
              </label>
              <select
                value={selectedProject}
                onChange={handleProjectChange}
                className="input-field"
                required
              >
                <option value="">Choose a project...</option>
                {Array.isArray(projects) && projects.map((project: any) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
              {projects.length === 0 && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  No projects found. <Link href="/projects" className="underline">Create a project</Link> first to assign tasks.
                </p>
              )}
              {selectedProject && (
                <p className="text-sm text-gray-600 mt-1">
                  {tasks.length} available tasks in this project
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssignToProject}
                disabled={!selectedProject || loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Assigning...' : 'Assign Task to Freelancer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Selection Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="card rounded-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Select Task to Assign</h3>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">No available tasks in this project</p>
                  </div>
                ) : (
                  tasks.map((task: any) => (
                    <div
                      key={task.id}
                      className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-primary cursor-pointer transition-colors card"
                      onClick={() => handleTaskAssignment(task.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">{task.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              task.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {task.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-lg font-bold text-primary">${task.budget}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">Budget</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}