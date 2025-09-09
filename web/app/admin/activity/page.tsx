'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import Pagination from '@/components/Pagination';

// Matches AdminAction from backend
interface Activity {
  id: number;
  action_type: string;
  description: string;
  admin: { username: string; first_name: string; last_name: string };
  target_user?: { username: string; first_name: string; last_name: string } | null;
  created_at: string;
  details?: any;
}

export default function AdminActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const activitiesPerPage = 10;

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const user = getUser();
    if (user?.email !== 'kbrian1237@gmail.com') {
      router.push('/');
      return;
    }

    loadActivities();
  }, [router]);

  const loadActivities = async () => {
    try {
      const res = await api.get('/admin/activity/');
      const data = res.data?.results || res.data || [];
      if (Array.isArray(data) && data.length) {
        setActivities(data);
      } else {
        // Fallback: use recent_activities from dashboard stats
        try {
          const statsRes = await api.get('/admin/dashboard/stats/');
          const recent = statsRes.data?.recent_activities || [];
          const mapped: Activity[] = (recent as any[]).map((a: any, i: number) => ({
            id: i + 1,
            action_type: 'general',
            description: a.description || 'Activity',
            admin: { username: 'system', first_name: 'System', last_name: 'User' },
            target_user: null,
            created_at: a.timestamp || new Date().toISOString(),
          }));
          setActivities(mapped);
        } catch {
          setActivities([]);
        }
      }
    } catch (error) {
      console.error('Error loading activities:', error);
      // Fallback: try stats
      try {
        const statsRes = await api.get('/admin/dashboard/stats/');
        const recent = statsRes.data?.recent_activities || [];
        const mapped: Activity[] = (recent as any[]).map((a: any, i: number) => ({
          id: i + 1,
          action_type: 'general',
          description: a.description || 'Activity',
          admin: { username: 'system', first_name: 'System', last_name: 'User' },
          target_user: null,
          created_at: a.timestamp || new Date().toISOString(),
        }));
        setActivities(mapped);
      } catch {
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_suspend': return '⏸️';
      case 'user_activate': return '✅';
      case 'content_remove': return '🧹';
      case 'content_approve': return '👍';
      case 'dispute_resolve': return '⚖️';
      case 'refund_process': return '💵';
      case 'payment_release': return '💳';
      default: return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_suspend': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'user_activate': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'content_remove': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'content_approve': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'dispute_resolve': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'refund_process': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'payment_release': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filterType !== 'all' && activity.action_type !== filterType) return false;
    
    if (timeFilter !== 'all') {
      const activityTime = new Date(activity.created_at);
      const now = new Date();
      const diffHours = (now.getTime() - activityTime.getTime()) / (1000 * 60 * 60);
      
      switch (timeFilter) {
        case 'hour': return diffHours <= 1;
        case 'day': return diffHours <= 24;
        case 'week': return diffHours <= 168;
        default: return true;
      }
    }
    
    return true;
  });

  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);
  const startIndex = (currentPage - 1) * activitiesPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, startIndex + activitiesPerPage);

  const activityStats = {
    total: activities.length,
    lastHour: activities.filter(a => {
      const diffHours = (new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60);
      return diffHours <= 1;
    }).length,
    lastDay: activities.filter(a => {
      const diffHours = (new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    }).length,
    byType: activities.reduce((acc, activity) => {
      acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#0D9E86] to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Recent Activity</h1>
          <p className="opacity-90">Monitor all platform activities in real-time</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Activities</option>
              <option value="user_suspend">User Suspended</option>
              <option value="user_activate">User Activated</option>
              <option value="content_remove">Content Removed</option>
              <option value="content_approve">Content Approved</option>
              <option value="dispute_resolve">Dispute Resolved</option>
              <option value="refund_process">Refund Processed</option>
              <option value="payment_release">Payment Released</option>
            </select>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Time</option>
              <option value="hour">Last Hour</option>
              <option value="day">Last 24 Hours</option>
              <option value="week">Last Week</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-teal-50 dark:bg-teal-900/20 p-4 rounded-lg border border-teal-200 dark:border-teal-800">
              <div className="text-2xl font-bold text-[#0D9E86] dark:text-teal-400">{activityStats.total}</div>
              <div className="text-sm text-[#0D9E86] dark:text-teal-400">Total Activities</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activityStats.lastHour}</div>
              <div className="text-sm text-green-600 dark:text-green-400">Last Hour</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-bold text-[#FF8559] dark:text-orange-400">{activityStats.lastDay}</div>
              <div className="text-sm text-[#FF8559] dark:text-orange-400">Last 24 Hours</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {Object.keys(activityStats.byType).length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Activity Types</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#0D9E86] to-teal-600 rounded-full flex items-center justify-center text-white text-lg">
{getActivityIcon(activity.action_type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityColor(activity.action_type)}`}>
                          {activity.action_type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(activity.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {activity.description}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        by {activity.admin.first_name} {activity.admin.last_name} (@{activity.admin.username})
                      </p>
                    </div>
                  </div>
                ))}
                
                {filteredActivities.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-4">📭</div>
                    <p>No activities found for the selected filters</p>
                  </div>
                )}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}