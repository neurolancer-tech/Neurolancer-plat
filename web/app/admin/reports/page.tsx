'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import { Flag, AlertTriangle, Clock, CheckCircle, XCircle, Eye, MessageSquare, User, Shield, Ticket, Users } from 'lucide-react';
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

interface SupportTicket {
  id: number;
  ticket_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
  assigned_to?: {
    id: number;
    username: string;
  };
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  replies?: Array<{
    id: number;
    message: string;
    user_name: string;
    is_staff_reply: boolean;
    created_at: string;
  }>;
}

interface TicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  tickets_by_category: Array<{ category: string; count: number }>;
  tickets_by_priority: Array<{ priority: string; count: number }>;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketStats, setTicketStats] = useState<TicketStats | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'tickets'>('reports');
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
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showCustomReplyModal, setShowCustomReplyModal] = useState(false);
  const [customReplyData, setCustomReplyData] = useState({
    message: '',
    notification_message: ''
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

    if (activeTab === 'reports') {
      loadReports();
      loadStats();
    } else {
      loadTickets();
      loadTicketStats();
    }
  }, [router, filters, pagination.page, activeTab]);

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

  const loadTickets = async () => {
    try {
      const response = await api.get('/admin/tickets/');
      setTickets(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const loadTicketStats = async () => {
    try {
      const response = await api.get('/admin/tickets/stats/');
      setTicketStats(response.data);
    } catch (error) {
      console.error('Error loading ticket stats:', error);
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

  const assignTicket = async (ticketId: number, adminId: number) => {
    try {
      await api.patch(`/admin/tickets/${ticketId}/`, { assigned_to: adminId });
      toast.success('Ticket assigned successfully');
      loadTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to assign ticket');
    }
  };

  const updateTicketStatus = async (ticketId: number, status: string) => {
    try {
      await api.patch(`/admin/tickets/${ticketId}/`, { status });
      toast.success('Ticket status updated');
      loadTickets();
      loadTicketStats();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  const sendCustomReply = async () => {
    if (!selectedTicket || !customReplyData.message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      // Send reply
      await api.post(`/admin/tickets/${selectedTicket.id}/reply/`, {
        message: customReplyData.message
      });

      // Send custom notification if provided
      if (customReplyData.notification_message.trim()) {
        await api.post(`/admin/tickets/${selectedTicket.id}/custom-notification/`, {
          message: customReplyData.notification_message
        });
      }

      toast.success('Reply sent successfully');
      setShowCustomReplyModal(false);
      setCustomReplyData({ message: '', notification_message: '' });
      loadTickets();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reply');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Reports & Support Management</h1>
          <p className="opacity-90">Monitor and manage user reports, content moderation, and support tickets</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Flag className="w-4 h-4 inline mr-2" />
                User Reports
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Ticket className="w-4 h-4 inline mr-2" />
                Support Tickets
              </button>
            </nav>
          </div>
        </div>

        {/* Statistics */}
        {activeTab === 'reports' && stats && (
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

        {activeTab === 'tickets' && ticketStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{ticketStats.total_tickets}</p>
                </div>
                <Ticket className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
                  <p className="text-2xl font-bold text-green-600">{ticketStats.open_tickets}</p>
                </div>
                <Clock className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{ticketStats.in_progress_tickets}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{ticketStats.resolved_tickets}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Closed</p>
                  <p className="text-2xl font-bold text-gray-600">{ticketStats.closed_tickets}</p>
                </div>
                <XCircle className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {activeTab === 'reports' && (
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
        )}

        {/* Reports List */}
        {activeTab === 'reports' && (
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
        )}

        {/* Support Tickets List */}
        {activeTab === 'tickets' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ticket ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{ticket.ticket_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{ticket.subject}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{ticket.description.substring(0, 50)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {ticket.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          ticket.status === 'waiting_response' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {ticket.user.username}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedTicket(ticket)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowCustomReplyModal(true);
                            }}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            <MessageSquare className="w-4 h-4" />
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

        {/* Custom Reply Modal */}
        {showCustomReplyModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Send Custom Reply & Notification</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Ticket: {selectedTicket.ticket_id} - {selectedTicket.subject}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Reply Message</label>
                  <textarea
                    placeholder="Enter your reply to the ticket..."
                    value={customReplyData.message}
                    onChange={(e) => setCustomReplyData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Custom Notification Message (Optional)</label>
                  <textarea
                    placeholder="Enter a custom notification message for the user..."
                    value={customReplyData.notification_message}
                    onChange={(e) => setCustomReplyData(prev => ({ ...prev, notification_message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If provided, this will be sent as a separate notification to the user
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowCustomReplyModal(false);
                    setCustomReplyData({ message: '', notification_message: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={sendCustomReply}
                  disabled={!customReplyData.message.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}