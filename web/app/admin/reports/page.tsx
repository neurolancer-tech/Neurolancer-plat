'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import { Flag, AlertTriangle, Clock, CheckCircle, XCircle, Eye, MessageSquare, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

interface Report {
  id: number;
  title: string;
  description: string;
  report_type: string;
  category: string;
  severity: string;
  status: string;
  reporter: {
    id: number;
    username: string;
    email: string;
  };
  reported_user?: {
    id: number;
    username: string;
    email: string;
    full_name?: string;
  };
  content_details?: {
    type: string;
    title: string;
    id: number;
    owner: any;
    url: string;
  };
  assigned_admin?: {
    id: number;
    username: string;
  };
  created_at: string;
  resolved_at?: string;
}

interface ReportStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  reports_last_30_days: number;
  reports_last_7_days: number;
  reports_by_type: Array<{ report_type: string; count: number }>;
  reports_by_category: Array<{ category: string; count: number }>;
  reports_by_severity: Array<{ severity: string; count: number }>;
  high_risk_users: number;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    severity: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0
  });
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({
    action_type: '',
    action_description: '',
    custom_message: ''
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
    loadStats();
  }, [router, filters, pagination.page]);

  const loadReports = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        per_page: pagination.per_page.toString(),
        ...filters
      });

      const response = await api.get(`/user-reports/?${params}`);
      setReports(response.data.reports || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/user-reports/statistics/');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const takeAction = async (reportId: number) => {
    try {
      await api.post(`/user-reports/${reportId}/action/`, actionData);
      toast.success('Action taken successfully');
      setShowActionModal(false);
      loadReports();
      loadStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to take action');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'investigating': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Report Management</h1>
          <p className="opacity-90">Monitor and manage user reports and content moderation</p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total_reports}</p>
                </div>
                <Flag className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending_reports}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved_reports}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High Risk Users</p>
                  <p className="text-2xl font-bold text-red-600">{stats.high_risk_users}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All Types</option>
              <option value="gig">Gig</option>
              <option value="job">Job</option>
              <option value="freelancer">Freelancer</option>
              <option value="client">Client</option>
              <option value="order">Order</option>
            </select>
            
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            >
              <option value="">All Severity</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            
            <input
              type="text"
              placeholder="Search reports..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            />
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{report.title}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{report.category}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {report.report_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {report.reporter.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {report.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowActionModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Action
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Modal */}
        {showActionModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Take Action on Report</h3>
              
              <div className="space-y-4">
                <select
                  value={actionData.action_type}
                  onChange={(e) => setActionData(prev => ({ ...prev, action_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select Action</option>
                  <option value="warning">Send Warning</option>
                  <option value="content_removal">Remove Content</option>
                  <option value="account_suspension">Suspend Account</option>
                  <option value="custom_message">Send Custom Message</option>
                  <option value="no_action">No Action Required</option>
                </select>
                
                <textarea
                  placeholder="Action description..."
                  value={actionData.action_description}
                  onChange={(e) => setActionData(prev => ({ ...prev, action_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
                
                {actionData.action_type === 'custom_message' && (
                  <textarea
                    placeholder="Custom message to user..."
                    value={actionData.custom_message}
                    onChange={(e) => setActionData(prev => ({ ...prev, custom_message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                  />
                )}
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => takeAction(selectedReport.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
                >
                  Take Action
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}