'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: string;
  is_read: boolean;
  action_url?: string;
  related_object_id?: number;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState('all');
  const [lastCheck, setLastCheck] = useState<string>('');
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadNotifications();
    
    // Set up real-time polling
    const interval = setInterval(() => {
      if (realTimeEnabled) {
        checkForNewNotifications();
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [router, realTimeEnabled]);

  const loadNotifications = async () => {
    try {
      if (!api) {
        throw new Error('API client not initialized');
      }
      const response = await api.get('/notifications/');
      const notificationData = response.data.results || response.data;
      setNotifications(notificationData);
      setLastCheck(new Date().toISOString());
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewNotifications = useCallback(async () => {
    if (!lastCheck || !api) return;
    
    try {
      const response = await api.get(`/notifications/real-time/?last_check=${lastCheck}`);
      const { notifications: newNotifications, unread_count, timestamp } = response.data;
      
      if (newNotifications && newNotifications.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const uniqueNew = newNotifications.filter((n: Notification) => !existingIds.has(n.id));
          return [...uniqueNew, ...prev];
        });
        
        // Show toast for new notifications
        if (newNotifications.length === 1) {
          toast.success(`New notification: ${newNotifications[0].title}`);
        } else {
          toast.success(`${newNotifications.length} new notifications`);
        }
      }
      
      setLastCheck(timestamp);
    } catch (error) {
      console.error('Error checking for new notifications:', error);
    }
  }, [lastCheck]);

  const markAsRead = async (notificationId: number) => {
    if (!api) return;
    try {
      await api.post(`/notifications/${notificationId}/mark-read/`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (!api) return;
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const handleTaskAssignment = async (taskId: number, action: 'accept' | 'decline', notificationId: number) => {
    try {
      if (action === 'accept') {
        const response = await api.post(`/tasks/${taskId}/accept/`);
        toast.success('Task assignment accepted! You have been added to the project team.');
        
        // Mark notification as read
        markAsRead(notificationId);
        
        // Redirect to project page if conversation exists
        if (response.data.conversation_id) {
          router.push(`/messages?conversation=${response.data.conversation_id}`);
        }
      } else {
        const reason = prompt('Please provide a reason for declining (optional):');
        await api.post(`/tasks/${taskId}/decline/`, { reason: reason || 'No reason provided' });
        toast.success('Task assignment declined.');
        
        // Mark notification as read
        markAsRead(notificationId);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${action} task assignment`);
    }
  };

  const getActionButtons = (notification: Notification) => {
    const buttons = [];
    
    switch (notification.notification_type) {
      case 'task_assignment':
        if (!notification.is_read && notification.related_object_id) {
          buttons.push(
            <button
              key="accept-task"
              onClick={(e) => {
                e.stopPropagation();
                handleTaskAssignment(notification.related_object_id!, 'accept', notification.id);
              }}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors mr-2"
            >
              Accept Task
            </button>
          );
          buttons.push(
            <button
              key="decline-task"
              onClick={(e) => {
                e.stopPropagation();
                handleTaskAssignment(notification.related_object_id!, 'decline', notification.id);
              }}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              Decline
            </button>
          );
        }
        break;
        
      case 'order':
        buttons.push(
          <button
            key="view-order"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/my-orders`);
            }}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            View Order
          </button>
        );
        break;
        
      case 'proposal':
        buttons.push(
          <button
            key="view-proposals"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/my-proposals`);
            }}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            View Proposals
          </button>
        );
        break;
        
      case 'message':
        buttons.push(
          <button
            key="view-messages"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/messages`);
            }}
            className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
          >
            View Messages
          </button>
        );
        break;
        
      case 'payment':
        buttons.push(
          <button
            key="view-transactions"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/transactions`);
            }}
            className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
          >
            View Transactions
          </button>
        );
        break;
        
      case 'job':
        buttons.push(
          <button
            key="view-jobs"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/my-jobs`);
            }}
            className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
          >
            View Jobs
          </button>
        );
        break;
        
      case 'system':
        if (notification.action_url) {
          buttons.push(
            <button
              key="take-action"
              onClick={(e) => {
                e.stopPropagation();
                router.push(notification.action_url!);
              }}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
            >
              Take Action
            </button>
          );
        }
        break;
        
      case 'verification':
        buttons.push(
          <button
            key="view-verification"
            onClick={(e) => {
              e.stopPropagation();
              router.push('/verify');
            }}
            className="px-3 py-1 text-xs bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
          >
            View Status
          </button>
        );
        break;
    }
    
    return buttons;
  };

  const getFilteredNotifications = () => {
    let filtered = notifications;
    
    if (filter === 'unread') {
      filtered = notifications.filter(notif => !notif.is_read);
    } else if (filter !== 'all') {
      filtered = notifications.filter(notif => notif.notification_type === filter);
    }
    
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getNotificationIcon = (type: string) => {
    const iconClasses = "w-4 h-4";
    
    switch (type) {
      case 'order':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        );
      case 'proposal':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'message':
        return (
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-yellow-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        );
      case 'task_assignment':
        return (
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-orange-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        );
      case 'job':
        return (
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-indigo-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2M8 6v2a2 2 0 002 2h4a2 2 0 002-2V6" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case 'verification':
        return (
          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-teal-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className={`${iconClasses} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5H7.5" />
            </svg>
          </div>
        );
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-800';
      case 'proposal': return 'bg-green-100 text-green-800';
      case 'message': return 'bg-purple-100 text-purple-800';
      case 'payment': return 'bg-yellow-100 text-yellow-800';
      case 'job': return 'bg-indigo-100 text-indigo-800';
      case 'task_assignment': return 'bg-orange-100 text-orange-800';
      case 'system': return 'bg-red-100 text-red-800';
      case 'verification': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Notifications</h1>
            <p className="text-gray-600 dark:text-gray-400">Stay updated with your latest activities</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-primary hover:opacity-80 text-sm font-medium"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="card rounded-lg shadow-sm border mb-6">
          <div className="flex flex-wrap border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'unread'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('order')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'order'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Orders
            </button>
            <button
              onClick={() => setFilter('proposal')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'proposal'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Proposals
            </button>
            <button
              onClick={() => setFilter('message')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'message'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Messages
            </button>
            <button
              onClick={() => setFilter('payment')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'payment'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Payments
            </button>
            <button
              onClick={() => setFilter('task_assignment')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'task_assignment'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setFilter('verification')}
              className={`px-4 py-3 text-sm font-medium ${
                filter === 'verification'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Verification
            </button>
          </div>
          
          {/* Real-time toggle */}
          <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Real-time notifications</span>
              <button
                onClick={() => setRealTimeEnabled(!realTimeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  realTimeEnabled ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    realTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5H7.5" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filter === 'unread' 
                  ? 'All caught up! Check back later for new updates.'
                  : 'When you receive notifications, they\'ll appear here.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`card rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${
                  !notification.is_read ? 'border-l-4 border-l-primary bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start space-x-4">
                  {getNotificationIcon(notification.notification_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-1 pr-2">
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{notification.message}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getNotificationTypeColor(notification.notification_type)
                        }`}>
                          {notification.notification_type.replace('_', ' ')}
                        </span>
                        <div className="flex space-x-1">
                          {getActionButtons(notification)}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {formatTimeAgo(notification.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}