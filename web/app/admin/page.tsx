'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import './admin.css';

interface AdminStats {
  total_users: number;
  active_users: number;
  total_orders: number;
  completed_orders: number;
  pending_disputes: number;
  pending_reports: number;
  total_revenue: number;
  monthly_revenue?: number[];
  order_stats?: Record<string, number>;
  recent_activities: Array<{
    description: string;
    timestamp: string;
  }>;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    checkAdminAccess();
  }, [router]);

  const checkAdminAccess = async () => {
    try {
      const user = getUser();
      if (user?.email === 'kbrian1237@gmail.com') {
        setIsAdmin(true);
        await loadAdminData();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const response = await api.get('/admin/dashboard/stats/');
      const stats = response.data as any;

      // Also fetch recent activities for display
      let recent_activities: { description: string; timestamp: string }[] = [];
      try {
        const aRes = await api.get('/admin/activity/');
        const acts = aRes.data?.results || aRes.data || [];
        if (Array.isArray(acts) && acts.length > 0) {
          recent_activities = (acts as any[]).slice(0, 5).map((a: any) => ({
            description: a.description || 'Activity',
            timestamp: a.created_at || new Date().toISOString(),
          }));
        } else {
          // fallback to recent_activities from stats endpoint if activity list is empty
          recent_activities = (stats.recent_activities || []).slice(0, 5);
        }
      } catch {
        // fallback to recent_activities from stats endpoint if available
        recent_activities = (stats.recent_activities || []).slice(0, 5);
      }

      setAdminStats({
        total_users: stats.total_users ?? 0,
        active_users: stats.active_users ?? 0,
        total_orders: stats.total_orders ?? 0,
        completed_orders: stats.completed_orders ?? 0,
        pending_disputes: stats.pending_disputes ?? 0,
        pending_reports: stats.pending_reports ?? 0,
        total_revenue: stats.total_revenue ?? 0,
        recent_activities,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Fallback: aggregate minimal stats from available endpoints
      try {
        const [uRes, gRes, oRes, aRes] = await Promise.all([
          api.get('/admin/users/').catch(() => ({ data: [] })),
          api.get('/gigs/').catch(() => ({ data: [] })),
          api.get('/orders/').catch(() => ({ data: [] })),
          api.get('/admin/activity/').catch(() => ({ data: [] })),
        ]);
        const users = uRes.data?.results || uRes.data || [];
        const orders = oRes.data?.results || oRes.data || [];
        const recentActs = aRes.data?.results || aRes.data || [];
        const total_revenue = (orders as any[])
          .filter((o: any) => (o.status || '').toLowerCase() === 'completed')
          .reduce((sum: number, o: any) => sum + (o.price ?? o.total_amount ?? 0), 0);

        const recent_activities: { description: string; timestamp: string }[] = (recentActs as any[])
          .slice(0, 5)
          .map((a: any) => ({ description: a.description || 'Activity', timestamp: a.created_at || new Date().toISOString() }));

        setAdminStats({
          total_users: users.length,
          active_users: (users as any[]).filter((u: any) => u.is_active).length,
          total_orders: orders.length,
          completed_orders: (orders as any[]).filter((o: any) => (o.status || '').toLowerCase() === 'completed').length,
          pending_disputes: 0,
          pending_reports: 0,
          total_revenue,
          recent_activities,
        });
      } catch (e) {
        setAdminStats({
          total_users: 0,
          active_users: 0,
          total_orders: 0,
          completed_orders: 0,
          pending_disputes: 0,
          pending_reports: 0,
          total_revenue: 0,
          recent_activities: []
        });
      }
    } finally {
      setLoading(false);
    }
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
        {!isAdmin ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FF8559] to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">Admin privileges required</p>
            </div>
          </div>
        ) : (
          <>
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-[#0D9E86] to-teal-600 rounded-xl p-8 text-white mb-8">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm mr-6">
                  <span className="text-2xl">⚙️</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
                  <p className="text-xl opacity-90">Platform administration and management</p>
                </div>
              </div>
            </div>

            {/* Admin Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-[#0D9E86] to-teal-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">Total Users</p>
                    <p className="text-3xl font-bold">{adminStats?.total_users || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">👥</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#FF8559] to-orange-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Active Users</p>
                    <p className="text-3xl font-bold">{adminStats?.active_users || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">🚀</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold">{adminStats?.total_orders || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">📋</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Revenue</p>
                    <p className="text-3xl font-bold">${adminStats?.total_revenue || 0}</p>
                  </div>
                  <div className="text-4xl opacity-80">💰</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Link href="/admin/users" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Users</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Manage platform users</p>
                  </div>
                  <div className="text-2xl opacity-80 group-hover:scale-110 transition-transform">👥</div>
                </div>
              </Link>

              <Link href="/admin/orders" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Orders</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Track all orders</p>
                  </div>
                  <div className="text-2xl opacity-80 group-hover:scale-110 transition-transform">📋</div>
                </div>
              </Link>

              <Link href="/admin/transactions" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Transactions</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Financial overview</p>
                  </div>
                  <div className="text-2xl opacity-80 group-hover:scale-110 transition-transform">💳</div>
                </div>
              </Link>

              <Link href="/admin/reports" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 group border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Reports</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Analytics & insights</p>
                  </div>
                  <div className="text-2xl opacity-80 group-hover:scale-110 transition-transform">📈</div>
                </div>
              </Link>
            </div>

            {/* Recent Activity and Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Activity</h3>
                  <Link href="/admin/activity" className="text-sm text-[#0D9E86] hover:text-teal-700 dark:hover:text-teal-300 font-medium">
                    View All →
                  </Link>
                </div>
                <div className="space-y-4">
                  {adminStats?.recent_activities && adminStats.recent_activities.length > 0 ? (
                    adminStats.recent_activities.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-2 h-2 bg-[#0D9E86] rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-gray-100">{activity.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/admin/users" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="mr-3 text-lg">👥</span>
                    <span className="text-gray-900 dark:text-gray-100">Manage Users</span>
                  </Link>
                  <Link href="/admin/gigs" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="mr-3 text-lg">🚀</span>
                    <span className="text-gray-900 dark:text-gray-100">Review Gigs</span>
                  </Link>
                  <Link href="/admin/orders" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="mr-3 text-lg">📋</span>
                    <span className="text-gray-900 dark:text-gray-100">Monitor Orders</span>
                  </Link>
                  <Link href="/admin/settings" className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <span className="mr-3 text-lg">⚙️</span>
                    <span className="text-gray-900 dark:text-gray-100">Platform Settings</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Analytics: Monthly Revenue & Order Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Monthly Revenue */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue (last 6)</h3>
                {adminStats?.monthly_revenue && adminStats.monthly_revenue.length > 0 ? (
                  <div className="flex items-end space-x-2 h-32">
                    {adminStats.monthly_revenue.map((value, idx) => {
                      const vals = adminStats.monthly_revenue as number[];
                      const max = Math.max(...vals, 1);
                      const height = Math.max(4, Math.round((value / max) * 100));
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">${Number(value).toFixed(0)}</div>
                          <div className="w-6 bg-gradient-to-t from-teal-600 to-[#0D9E86] rounded" style={{ height: `${height}%` }} />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">No revenue data</div>
                )}
              </div>

              {/* Order Status Distribution */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Order Status Distribution</h3>
                {adminStats?.order_stats && Object.keys(adminStats.order_stats).length > 0 ? (
                  <div>
                    {/* Progress bar */}
                    {(() => {
                      const entries = Object.entries(adminStats.order_stats as Record<string, number>);
                      const total = entries.reduce((s, [, v]) => s + (v || 0), 0) || 1;
                      return (
                        <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex">
                          {entries.map(([status, count]) => {
                            const pct = Math.round(((count || 0) / total) * 100);
                            const color = status === 'completed' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : status === 'in_progress' ? 'bg-blue-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400';
                            return <div key={status} className={`${color}`} style={{ width: `${pct}%` }} title={`${status}: ${count}`} />;
                          })}
                        </div>
                      );
                    })()}
                    {/* Legend */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(adminStats.order_stats).map(([status, count]) => (
                        <div key={status} className="flex items-center space-x-2">
                          <span className={`inline-block w-3 h-3 rounded ${status === 'completed' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : status === 'in_progress' ? 'bg-blue-500' : status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'}`} />
                          <span className="text-gray-700 dark:text-gray-300">{status.replace('_', ' ')}: {count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">No order stats</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}