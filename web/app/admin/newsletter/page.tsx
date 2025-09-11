'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import Pagination from '@/components/Pagination';

interface Newsletter {
  id: number;
  title: string;
  subject: string;
  newsletter_type: string;
  status: string;
  created_by_name: string;
  total_recipients: number;
  total_opened: number;
  open_rate: number;
  created_at: string;
  content?: string;
}

interface NewsletterTemplate {
  id: number;
  name: string;
  template_type: string;
  description: string;
  html_content: string;
  is_active: boolean;
}

const NewsletterAdminPage: React.FC = () => {
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNewsletter, setNewNewsletter] = useState({
    title: '',
    subject: '',
    content: '',
    newsletter_type: 'weekly_digest'
  });
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const newslettersPerPage = 10;



  const loadTemplate = (template: NewsletterTemplate) => {
    setNewNewsletter({...newNewsletter, content: template.html_content});
  };

  const loadTemplateForEdit = (template: NewsletterTemplate) => {
    if (editingNewsletter) {
      setEditingNewsletter({...editingNewsletter, content: template.html_content});
    }
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await api.get('/admin/newsletter/templates/');
      setTemplates(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  };

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

    loadNewsletters();
    loadTemplates();
  }, [router]);

  const loadNewsletters = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/newsletter/');
      setNewsletters(response.data.results || response.data || []);
      
      // Also load subscriber count
      const subscribersResponse = await api.get('/admin/newsletter/subscribers/');
      const count = subscribersResponse.data.count || subscribersResponse.data.length || 0;
      setSubscriberCount(count);
      
      // Update newsletters with actual subscriber count
      setNewsletters(prev => prev.map(newsletter => ({
        ...newsletter,
        total_recipients: count
      })));
    } catch (error) {
      console.error('Error loading newsletters:', error);
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  };

  const createNewsletter = async () => {
    try {
      await api.post('/admin/newsletter/', newNewsletter);
      setShowCreateModal(false);
      setNewNewsletter({ title: '', subject: '', content: '', newsletter_type: 'weekly_digest' });
      loadNewsletters();
    } catch (error) {
      console.error('Error creating newsletter:', error);
    }
  };

  const editNewsletter = async () => {
    if (!editingNewsletter) return;
    try {
      await api.put(`/admin/newsletter/${editingNewsletter.id}/`, editingNewsletter);
      setShowEditModal(false);
      setEditingNewsletter(null);
      loadNewsletters();
    } catch (error) {
      console.error('Error updating newsletter:', error);
    }
  };

  const deleteNewsletter = async (newsletterId: number) => {
    if (!confirm('Are you sure you want to delete this newsletter?')) return;
    try {
      await api.delete(`/admin/newsletter/${newsletterId}/`);
      loadNewsletters();
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const openEditModal = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter);
    setShowEditModal(true);
  };

  const sendNewsletter = async (newsletterId: number) => {
    if (!confirm('Are you sure you want to send this newsletter?')) return;
    
    try {
      const response = await api.post(`/admin/newsletter/${newsletterId}/send/`);
      alert(`Newsletter sent to ${response.data.sent_count} subscribers!`);
      loadNewsletters();
    } catch (error: any) {
      alert(`Error: ${error.response?.data?.error || 'Failed to send newsletter'}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      sent: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Newsletter Management</h1>
          <p className="opacity-90">Create and send newsletters to {subscriberCount} subscribers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{subscriberCount}</p>
                <p className="text-gray-600 dark:text-gray-400">Total Subscribers</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{newsletters.filter(n => n.status === 'sent').length}</p>
                <p className="text-gray-600 dark:text-gray-400">Sent Newsletters</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{newsletters.filter(n => n.status === 'draft').length}</p>
                <p className="text-gray-600 dark:text-gray-400">Draft Newsletters</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Newsletters</h2>
              <p className="text-gray-600 dark:text-gray-400">{newsletters.length} newsletters</p>
            </div>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-[#0D9E86] text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Newsletter</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Newsletter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Recipients</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Open Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {newsletters.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        No newsletters found. Create your first newsletter to get started.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const totalPages = Math.ceil(newsletters.length / newslettersPerPage);
                      const startIndex = (currentPage - 1) * newslettersPerPage;
                      const paginatedNewsletters = newsletters.slice(startIndex, startIndex + newslettersPerPage);
                      return paginatedNewsletters.map((newsletter) => (
                        <tr key={newsletter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{newsletter.title}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{newsletter.subject}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(newsletter.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {newsletter.total_recipients || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {newsletter.open_rate ? newsletter.open_rate.toFixed(1) : '0.0'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-3">
                              <button 
                                onClick={() => openEditModal(newsletter)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Edit Newsletter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              {newsletter.status === 'draft' && (
                                <button 
                                  onClick={() => sendNewsletter(newsletter.id)}
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  title="Send Newsletter"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                </button>
                              )}
                              <button 
                                onClick={() => deleteNewsletter(newsletter.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete Newsletter"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              {newsletter.status === 'sent' && (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  ✓ Sent
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ));
                    })()
                  )}
                </tbody>
              </table>
            </div>
          )}

          <Pagination currentPage={currentPage} totalPages={Math.ceil(newsletters.length / newslettersPerPage)} onPageChange={setCurrentPage} />
        </div>

        {/* Create Newsletter Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Newsletter</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={newNewsletter.title}
                    onChange={(e) => setNewNewsletter({...newNewsletter, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Newsletter title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={newNewsletter.subject}
                    onChange={(e) => setNewNewsletter({...newNewsletter, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Email subject line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Templates</label>
                  {templatesLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0D9E86]"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading templates...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => loadTemplate(template)}
                          className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#667eea] hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{template.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{template.description}</div>
                        </button>
                      ))}
                      {templates.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
                          No templates available
                        </div>
                      )}
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                  <textarea
                    value={newNewsletter.content}
                    onChange={(e) => setNewNewsletter({...newNewsletter, content: e.target.value})}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder="Newsletter content (HTML supported)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={newNewsletter.newsletter_type}
                    onChange={(e) => setNewNewsletter({...newNewsletter, newsletter_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="weekly_digest">Weekly Digest</option>
                    <option value="platform_updates">Platform Updates</option>
                    <option value="featured_gigs">Featured Gigs</option>
                    <option value="learning_spotlight">Learning Spotlight</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={createNewsletter}
                  className="px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:opacity-90"
                >
                  Create Newsletter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Newsletter Modal */}
        {showEditModal && editingNewsletter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Newsletter</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    value={editingNewsletter.title}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={editingNewsletter.subject}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, subject: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Templates</label>
                  {templatesLoading ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0D9E86]"></div>
                      <span className="ml-2 text-sm text-gray-500">Loading templates...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() => loadTemplateForEdit(template)}
                          className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#667eea] hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{template.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{template.description}</div>
                        </button>
                      ))}
                      {templates.length === 0 && (
                        <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
                          No templates available
                        </div>
                      )}
                    </div>
                  )}
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Content</label>
                  <textarea
                    value={editingNewsletter.content || ''}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, content: e.target.value})}
                    rows={12}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                    placeholder="Newsletter content (HTML supported)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select
                    value={editingNewsletter.newsletter_type}
                    onChange={(e) => setEditingNewsletter({...editingNewsletter, newsletter_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="weekly_digest">Weekly Digest</option>
                    <option value="platform_updates">Platform Updates</option>
                    <option value="featured_gigs">Featured Gigs</option>
                    <option value="learning_spotlight">Learning Spotlight</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={editNewsletter}
                  className="px-4 py-2 bg-[#0D9E86] text-white rounded-lg hover:opacity-90"
                >
                  Update Newsletter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default NewsletterAdminPage;