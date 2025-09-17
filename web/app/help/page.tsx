'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Ticket {
  id: string | number;
  ticket_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  replies?: Reply[];
}

interface Reply {
  id: string | number;
  message: string;
  is_staff_reply: boolean;
  user_name?: string;
  user_username?: string;
  created_at: string;
}

interface Stats {
  total_tickets?: number;
  open_tickets?: number;
  in_progress_tickets?: number;
  resolved_tickets?: number;
}

export default function HelpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'other',
    priority: 'medium'
  });
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastTicketTime, setLastTicketTime] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    // Check for last ticket time in localStorage
    const lastTime = localStorage.getItem('lastTicketTime');
    if (lastTime) {
      setLastTicketTime(parseInt(lastTime));
    }

    loadData();
  }, [router]);

  useEffect(() => {
    // Update cooldown timer
    const interval = setInterval(() => {
      if (lastTicketTime) {
        const now = Date.now();
        const timeDiff = now - lastTicketTime;
        const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        
        if (timeDiff < twoHours) {
          setCooldownRemaining(Math.ceil((twoHours - timeDiff) / 1000));
        } else {
          setCooldownRemaining(0);
          setLastTicketTime(null);
          localStorage.removeItem('lastTicketTime');
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastTicketTime]);

  const loadData = async () => {
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/tickets/'),
        api.get('/tickets/stats/')
      ]);
      setTickets(ticketsRes.data.results || ticketsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check cooldown
    if (cooldownRemaining > 0) {
      const hours = Math.floor(cooldownRemaining / 3600);
      const minutes = Math.floor((cooldownRemaining % 3600) / 60);
      toast.error(`Please wait ${hours}h ${minutes}m before creating another ticket`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/tickets/', newTicket);
      setTickets([response.data, ...tickets]);
      setNewTicket({ subject: '', description: '', category: 'other', priority: 'medium' });
      setShowCreateForm(false);
      
      // Set cooldown
      const now = Date.now();
      setLastTicketTime(now);
      localStorage.setItem('lastTicketTime', now.toString());
      
      toast.success('✅ Ticket created successfully!');
      await loadData(); // Refresh stats
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast.error(error.response?.data?.error || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (ticketId: string | number) => {
    if (!replyMessage.trim()) return;
    
    try {
      await api.post(`/tickets/${ticketId}/reply/`, { message: replyMessage });
      setReplyMessage('');
      toast.success('Reply sent successfully!');
      // Refresh ticket details
      const response = await api.get(`/tickets/${ticketId}/`);
      setSelectedTicket(response.data);
    } catch (error: any) {
      console.error('Error adding reply:', error);
      toast.error(error.response?.data?.error || 'Failed to send reply');
    }
  };

  const formatCooldownTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'open': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'waiting_response': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-gray-100 text-gray-800',
      'closed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F6EB] dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Help Center</h1>
          <p className="text-gray-600 dark:text-gray-400">Submit and manage your support tickets</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.total_tickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.open_tickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.in_progress_tickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{stats.resolved_tickets || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tickets List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Support Tickets</h2>
                  <button
                    onClick={() => {
                      if (cooldownRemaining > 0) {
                        const hours = Math.floor(cooldownRemaining / 3600);
                        const minutes = Math.floor((cooldownRemaining % 3600) / 60);
                        toast.error(`Please wait ${hours}h ${minutes}m before creating another ticket`);
                        return;
                      }
                      setShowCreateForm(true);
                    }}
                    disabled={cooldownRemaining > 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      cooldownRemaining > 0 
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#0D9E86] text-white hover:bg-teal-700'
                    }`}
                  >
                    {cooldownRemaining > 0 ? `Wait ${formatCooldownTime(cooldownRemaining)}` : 'Create Ticket'}
                  </button>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {tickets.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">No support tickets yet</p>
                    <button
                      onClick={() => {
                        if (cooldownRemaining > 0) {
                          const hours = Math.floor(cooldownRemaining / 3600);
                          const minutes = Math.floor((cooldownRemaining % 3600) / 60);
                          toast.error(`Please wait ${hours}h ${minutes}m before creating another ticket`);
                          return;
                        }
                        setShowCreateForm(true);
                      }}
                      disabled={cooldownRemaining > 0}
                      className={`mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                        cooldownRemaining > 0 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-[#0D9E86] text-white hover:bg-teal-700'
                      }`}
                    >
                      {cooldownRemaining > 0 ? `Wait ${formatCooldownTime(cooldownRemaining)}` : 'Create Your First Ticket'}
                    </button>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">#{ticket.ticket_id}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`text-sm font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{ticket.subject}</h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                            <span>Category: {ticket.category.replace('_', ' ')}</span>
                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                            {ticket.replies && ticket.replies.length > 0 && (
                              <span>{ticket.replies.length} replies</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Ticket Details or Create Form */}
          <div className="lg:col-span-1">
            {showCreateForm ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Support Ticket</h3>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleCreateTicket} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="account">Account Issues</option>
                      <option value="payment">Payment & Billing</option>
                      <option value="technical">Technical Support</option>
                      <option value="gig">Gig Related</option>
                      <option value="order">Order Issues</option>
                      <option value="verification">Verification</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button 
                      type="submit" 
                      disabled={submitting || cooldownRemaining > 0}
                      className="flex-1 px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        'Create Ticket'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : selectedTicket ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">#{selectedTicket.ticket_id}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedTicket.status)}`}>
                        {selectedTicket.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`text-sm font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{selectedTicket.subject}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedTicket.description}</p>
                  </div>
                  
                  {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Replies</h5>
                      <div className="space-y-3">
                        {selectedTicket.replies.map((reply, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            reply.is_staff_reply ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800'
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {reply.is_staff_reply ? 'Support Team' : reply.user_name || reply.user_username}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                    <div className="border-t pt-4">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Add Reply</h5>
                      <div className="space-y-3">
                        <textarea
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your message..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleReply(selectedTicket.id)}
                          disabled={!replyMessage.trim()}
                          className="w-full px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select a Ticket</h3>
                  <p className="text-gray-600 dark:text-gray-400">Choose a ticket from the list to view details and replies</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}