'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { isAuthenticated, getUser } from '@/lib/auth';
import api from '@/lib/api';
import Pagination from '@/components/Pagination';

interface Conversation {
  id: number;
  name: string;
  conversation_type: string;
  participants: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  }>;
  last_message?: {
    content: string;
    sender: { username: string };
    created_at: string;
  };
  created_at: string;
  updated_at: string;
  message_count: number;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const conversationsPerPage = 10;

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

    loadConversations();
  }, [router]);

  const loadConversations = async () => {
    try {
      // Mock data since we don't have admin conversation endpoint
      const mockConversations = [
        {
          id: 1,
          name: 'AI Project Discussion',
          conversation_type: 'group',
          participants: [
            { id: 1, username: 'client_john', first_name: 'John', last_name: 'Doe' },
            { id: 2, username: 'freelancer_sarah', first_name: 'Sarah', last_name: 'Smith' }
          ],
          last_message: {
            content: 'The project is progressing well. I should have the first milestone ready by tomorrow.',
            sender: { username: 'freelancer_sarah' },
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
          },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          message_count: 45
        },
        {
          id: 2,
          name: 'Direct Message',
          conversation_type: 'direct',
          participants: [
            { id: 3, username: 'client_mike', first_name: 'Mike', last_name: 'Johnson' },
            { id: 4, username: 'freelancer_anna', first_name: 'Anna', last_name: 'Wilson' }
          ],
          last_message: {
            content: 'Thank you for the quick delivery! The work looks great.',
            sender: { username: 'client_mike' },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
          },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          message_count: 23
        },
        {
          id: 3,
          name: 'Machine Learning Team',
          conversation_type: 'group',
          participants: [
            { id: 5, username: 'team_lead', first_name: 'Team', last_name: 'Lead' },
            { id: 6, username: 'dev_bob', first_name: 'Bob', last_name: 'Developer' },
            { id: 7, username: 'designer_alice', first_name: 'Alice', last_name: 'Designer' }
          ],
          last_message: {
            content: 'Let\'s schedule a meeting to discuss the model architecture.',
            sender: { username: 'team_lead' },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
          },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          message_count: 78
        },
        {
          id: 4,
          name: 'Support Chat',
          conversation_type: 'direct',
          participants: [
            { id: 8, username: 'user_help', first_name: 'Help', last_name: 'User' },
            { id: 9, username: 'support_agent', first_name: 'Support', last_name: 'Agent' }
          ],
          last_message: {
            content: 'Your issue has been resolved. Is there anything else I can help you with?',
            sender: { username: 'support_agent' },
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
          },
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          updated_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          message_count: 12
        }
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = 
      conversation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.participants.some(p => 
        p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesType = typeFilter === 'all' || conversation.conversation_type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredConversations.length / conversationsPerPage);
  const startIndex = (currentPage - 1) * conversationsPerPage;
  const paginatedConversations = filteredConversations.slice(startIndex, startIndex + conversationsPerPage);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'group': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Message Management</h1>
          <p className="opacity-90">Monitor platform conversations and communications</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Types</option>
              <option value="direct">Direct Messages</option>
              <option value="group">Group Chats</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{conversations.length}</div>
              <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Conversations</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {conversations.filter(c => c.conversation_type === 'direct').length}
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Direct Messages</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {conversations.filter(c => c.conversation_type === 'group').length}
              </div>
              <div className="text-sm text-purple-600 dark:text-purple-400">Group Chats</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {conversations.reduce((sum, c) => sum + c.message_count, 0)}
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">Total Messages</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Conversation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Participants</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Messages</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedConversations.map((conversation) => (
                      <tr key={conversation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {conversation.name}
                            </div>
                            {conversation.last_message && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                {conversation.last_message.content}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {conversation.participants.slice(0, 3).map((participant) => (
                              <span
                                key={participant.id}
                                className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                              >
                                {participant.first_name} {participant.last_name}
                              </span>
                            ))}
                            {conversation.participants.length > 3 && (
                              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                                +{conversation.participants.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(conversation.conversation_type)}`}>
                            {conversation.conversation_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {conversation.message_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(conversation.updated_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-300 rounded text-xs font-medium">
                            View
                          </button>
                          <button className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 rounded text-xs font-medium">
                            Archive
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}