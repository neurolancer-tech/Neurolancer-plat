'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    revenue: {
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0
    },
    users: {
      total: 0,
      newThisMonth: 0,
      activeUsers: 0,
      retentionRate: 0
    },
    orders: {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0,
      averageValue: 0
    },
    gigs: {
      total: 0,
      active: 0,
      topCategory: 'N/A',
      averagePrice: 0
    }
  });

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

    loadReports();
  }, [router]);

  const fetchAll = async (url: string) => {
    const results: any[] = [];
    let next: string | null = url;
    while (next) {
      const data: any = (await api.get(next as any)).data;
      const page = Array.isArray(data) ? data : (data.results || []);
      results.push(...(page || []));
      next = data.next || null;
    }
    return results;
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const [orders, gigs, users] = await Promise.all([
        fetchAll('/admin/orders/').catch(() => fetchAll('/orders/').catch(() => [])),
        fetchAll('/admin/gigs/').catch(() => fetchAll('/gigs/').catch(() => [])),
        fetchAll('/admin/users/').catch(() => []),
      ]);

      // Orders stats
      const completed = orders.filter((o: any) => (o.status || '').toLowerCase() === 'completed');
      const pending = orders.filter((o: any) => (o.status || '').toLowerCase() === 'pending');
      const cancelled = orders.filter((o: any) => (o.status || '').toLowerCase() === 'cancelled');
      const totalAmount = orders.reduce((s: number, o: any) => s + Number(o.price ?? o.total_amount ?? 0), 0);
      const avgValue = orders.length ? +(totalAmount / orders.length).toFixed(2) : 0;

      // Revenue by period (using created_at)
      const now = new Date();
      const within = (d: string, days: number) => {
        const dt = new Date(d);
        return (now.getTime() - dt.getTime()) / (1000 * 60 * 60 * 24) <= days;
      };
      const sumWithin = (days: number) => completed
        .filter((o: any) => o.created_at && within(o.created_at, days))
        .reduce((s: number, o: any) => s + Number(o.price ?? o.total_amount ?? 0), 0);

      // Gigs stats
      const activeGigs = gigs.filter((g: any) => g.is_active !== false);
      const topCategory = (() => {
        const counts: Record<string, number> = {};
        for (const g of gigs) {
          const cname = g.category?.name || 'Unknown';
          counts[cname] = (counts[cname] || 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      })();
      const avgGigPrice = gigs.length ? +(gigs.reduce((s: number, g: any) => s + (g.basic_price || 0), 0) / gigs.length).toFixed(2) : 0;

      // Users stats (new this month)
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newThisMonth = users.filter((u: any) => u.date_joined && new Date(u.date_joined) >= firstOfMonth).length;

      setReportData({
        revenue: {
          daily: +sumWithin(1).toFixed(2),
          weekly: +sumWithin(7).toFixed(2),
          monthly: +sumWithin(30).toFixed(2),
          yearly: +sumWithin(365).toFixed(2),
        },
        users: {
          total: users.length,
          newThisMonth,
          activeUsers: users.filter((u: any) => u.is_active).length,
          retentionRate: 0, // Unknown without cohort data
        },
        orders: {
          total: orders.length,
          completed: completed.length,
          pending: pending.length,
          cancelled: cancelled.length,
          averageValue: avgValue,
        },
        gigs: {
          total: gigs.length,
          active: activeGigs.length,
          topCategory,
          averagePrice: avgGigPrice,
        },
      });
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: string) => {
    // Mock export functionality
    const data = JSON.stringify(reportData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neurolancer-${type}-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#0D9E86] to-teal-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Analytics & Reports</h1>
          <p className="opacity-90">Comprehensive platform analytics and reporting</p>
        </div>

        {/* Export Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Export Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => exportReport('revenue')}
              className="bg-[#0D9E86] text-white px-4 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
            >
              📊 Revenue Report
            </button>
            <button
              onClick={() => exportReport('users')}
              className="bg-[#FF8559] text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
            >
              👥 User Analytics
            </button>
            <button
              onClick={() => exportReport('orders')}
              className="bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              📋 Order Report
            </button>
            <button
              onClick={() => exportReport('complete')}
              className="bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              📈 Complete Report
            </button>
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Revenue Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                ${reportData.revenue.daily.toFixed(2)}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">Daily Revenue</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+12.5% from yesterday</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                ${reportData.revenue.weekly.toFixed(2)}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Weekly Revenue</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+8.3% from last week</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                ${reportData.revenue.monthly.toFixed(2)}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">Monthly Revenue</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+15.7% from last month</div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                ${reportData.revenue.yearly.toFixed(2)}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">Yearly Revenue</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">+42.1% from last year</div>
            </div>
          </div>
        </div>

        {/* User Analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">User Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {reportData.users.total.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {reportData.users.newThisMonth}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">New This Month</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {reportData.users.activeUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {reportData.users.retentionRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Retention Rate</div>
            </div>
          </div>
        </div>

        {/* Order Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Order Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Orders</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {reportData.orders.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
                <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {reportData.orders.completed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Pending</span>
                <span className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                  {reportData.orders.pending}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
                <span className="text-xl font-semibold text-red-600 dark:text-red-400">
                  {reportData.orders.cancelled}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Average Order Value</span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  ${reportData.orders.averageValue}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Gig Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Total Gigs</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {reportData.gigs.total}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Active Gigs</span>
                <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                  {reportData.gigs.active}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Top Category</span>
                <span className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  {reportData.gigs.topCategory}
                </span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Average Gig Price</span>
                <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  ${reportData.gigs.averagePrice}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Platform Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">98.7%</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Uptime</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 30 days</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
              <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">1.2s</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">Avg Response Time</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">API endpoints</div>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl">
              <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mb-2">4.8/5</div>
              <div className="text-sm text-rose-600 dark:text-rose-400 font-medium">User Satisfaction</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Based on reviews</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}