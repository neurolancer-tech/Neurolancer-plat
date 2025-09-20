'use client';

import { useState } from 'react';
import Avatar from './Avatar';
import TaskProposalModal from './TaskProposalModal';
import ReviewModal from './ReviewModal';
import api from '../lib/api';

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
    has_review?: boolean;
    escrow_released?: boolean;
    is_paid?: boolean;
    gig?: {
      id: number;
      title: string;
    };
  };
}

interface TaskCardProps {
  task: Task;
  onTaskUpdate: () => void;
}

export default function TaskCard({ task, onTaskUpdate }: TaskCardProps) {
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [hasReview, setHasReview] = useState(task.order?.has_review || false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'review': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const updateTaskStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      await api.patch(`/tasks/${task.id}/`, { status: newStatus });
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
    } finally {
      setUpdating(false);
    }
  };

  const updateProgress = async (newProgress: number) => {
    setUpdating(true);
    try {
      await api.patch(`/tasks/${task.id}/`, { progress: newProgress });
      onTaskUpdate();
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setUpdating(false);
    }
  };

  const payFreelancer = () => {
    if (!task.order) return;
    // Redirect to checkout page with order details
    window.location.href = `/checkout?orderId=${task.order.id}&amount=${task.budget}&type=task_payment`;
  };

  const getTaskDisplayStatus = () => {
    if (task.assigned_freelancer && task.order) {
      const orderStatus = task.order.status;
      if (orderStatus === 'pending') return 'Assignment Pending';
      if (orderStatus === 'accepted') return `${task.assigned_freelancer.first_name} ${task.assigned_freelancer.last_name} Assigned`;
      if (orderStatus === 'in_progress') return `${task.assigned_freelancer.first_name} Working`;
      if (orderStatus === 'delivered') return 'Work Delivered - Awaiting Release';
      if (orderStatus === 'completed') {
        if (task.order.escrow_released) return 'Completed & Paid (Released)';
        if (task.order.is_paid) return 'Completed - Payment in Escrow';
        return 'Completed';
      }
    }
    
    if (task.assigned_freelancer) {
      return `${task.assigned_freelancer.first_name} ${task.assigned_freelancer.last_name} Assigned`;
    }
    
    return task.status.replace('_', ' ');
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.order?.status || task.status)} w-fit`}>
                {task.assigned_freelancer ? getTaskDisplayStatus() : task.status.replace('_', ' ')}
              </span>
              <span className={`text-xs sm:text-sm font-medium ${getPriorityColor(task.priority)} w-fit`}>
                {task.priority} priority
              </span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">{task.description}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-lg font-bold text-[#0D9E86]">${task.budget}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Due: {new Date(task.deadline).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Assigned Freelancer */}
      {task.assigned_freelancer ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <Avatar
              src={task.assigned_freelancer.profile_picture}
              avatarType={task.assigned_freelancer.profile_picture ? 'upload' : 'avatar'}
              size="sm"
              alt={`${task.assigned_freelancer.first_name} ${task.assigned_freelancer.last_name}`}
            />
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {task.assigned_freelancer.first_name} {task.assigned_freelancer.last_name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{getTaskDisplayStatus()}</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            {task.order?.status === 'delivered' && (
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={payFreelancer}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:opacity-90 w-full sm:w-auto"
                >
                  Pay Freelancer
                </button>
                <button
                  onClick={async () => {
                    try {
                      await api.post('/payments/release-escrow/', { order_id: task.order?.id });
                      // Optional: notify handled in page-level; minimal here
                      alert('Payment released to freelancer.');
                      onTaskUpdate();
                    } catch (e) {
                      alert('Failed to release payment');
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:opacity-90 w-full sm:w-auto"
                >
                  Release Payment
                </button>
              </div>
            )}
            {task.order?.status === 'completed' && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                {task.order?.escrow_released ? (
                  <span className="px-3 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm rounded-lg text-center">
                    ✓ Paid & Released
                  </span>
                ) : task.order?.is_paid ? (
                  <span className="px-3 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm rounded-lg text-center">
                    Payment in Escrow
                  </span>
                ) : null}
                {!hasReview && task.order.gig && (
                  <button
                    onClick={() => setShowReviewModal(true)}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:opacity-90 w-full sm:w-auto"
                  >
                    Leave Review
                  </button>
                )}
                {hasReview && (
                  <span className="px-3 py-2 bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-lg text-center">
                    ✓ Reviewed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm text-yellow-800 dark:text-yellow-200">No freelancer assigned</span>
          </div>
          <button
            onClick={() => setShowProposalModal(true)}
            className="px-4 py-2 bg-[#0D9E86] text-white text-sm rounded-lg hover:opacity-90 w-full sm:w-auto"
          >
            Find Freelancer
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-600 space-y-3 sm:space-y-0">
        <div className="flex flex-wrap gap-2">
          {task.status === 'pending' && !task.assigned_freelancer && (
            <button
              onClick={() => setShowProposalModal(true)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:opacity-90"
            >
              Assign
            </button>
          )}
          {task.status === 'assigned' && (
            <button
              onClick={() => updateTaskStatus('in_progress')}
              disabled={updating}
              className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:opacity-90 disabled:opacity-50"
            >
              Start Work
            </button>
          )}
          {task.status === 'completed' && (
            <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
              ✓ Completed
            </span>
          )}
        </div>
        
        <div className="flex space-x-2 justify-end">
          <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <TaskProposalModal
        isOpen={showProposalModal}
        onClose={() => setShowProposalModal(false)}
        task={task}
        onTaskAssigned={onTaskUpdate}
      />
      
      {task.order && task.assigned_freelancer && task.order.gig && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          orderId={task.order.id}
          freelancerName={`${task.assigned_freelancer.first_name} ${task.assigned_freelancer.last_name}`}
          gigTitle={task.order.gig.title}
          gigId={task.order.gig.id}
          onReviewSubmitted={() => {
            setHasReview(true);
            onTaskUpdate();
          }}
        />
      )}
    </div>
  );
}