'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import api from '../lib/api';
import Avatar from './Avatar';

interface Group {
  id: number;
  name: string;
  description: string;
  participants: any[];
  group_info: {
    member_count: number;
    admin: any;
  };
  group_type: 'public' | 'private' | 'project';
  project?: any;
}

interface User {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  userprofile?: {
    user_type: string;
    bio: string;
    avatar_type: 'upload' | 'avatar' | 'google' | undefined;
    selected_avatar: string;
    google_photo_url: string;
    profile_picture: string;
  };
  // Also support direct structure for backward compatibility
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface GroupDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupJoined: (group: Group) => void;
  onConversationStarted?: (conversation: any) => void;
}

export default function GroupDiscoveryModal({ isOpen, onClose, onGroupJoined, onConversationStarted }: GroupDiscoveryModalProps) {
  const [activeTab, setActiveTab] = useState<'groups' | 'users'>('groups');
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningGroup, setJoiningGroup] = useState<number | null>(null);
  const [startingConversation, setStartingConversation] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'groups') {
        loadGroups();
      } else {
        loadUsers();
      }
    }
  }, [isOpen, activeTab]);

  // Trigger search when searchQuery changes
  useEffect(() => {
    if (isOpen) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        if (activeTab === 'groups') {
          loadGroups();
        } else {
          loadUsers();
        }
      }, 300);
    }
  }, [searchQuery, isOpen, activeTab]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get('/groups/discover/', {
        params: { q: searchQuery }
      });
      // Exclude project groups and groups with 'Team' in their name from discovery
      const all = response.data;
      const filtered = Array.isArray(all) ? all.filter((g: any) => 
        g.group_type !== 'project' && 
        !g.name.toLowerCase().includes('team')
      ) : [];
      setGroups(filtered);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    console.log('GroupDiscoveryModal: Loading users with query:', searchQuery);
    try {
      const response = await api.get('/users/', {
        params: { q: searchQuery }
      });
      console.log('GroupDiscoveryModal: Users loaded:', response.data.length, 'users');
      console.log('GroupDiscoveryModal: Sample user data:', response.data[0]);
      setUsers(response.data);
    } catch (error) {
      console.error('GroupDiscoveryModal: Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (group: Group, password?: string) => {
    setJoiningGroup(group.id);
    try {
      const payload = password ? { password } : {};
      await api.post(`/groups/${group.id}/join/`, payload);
      onGroupJoined(group);
      onClose();
    } catch (error: any) {
      if (error.response?.status === 400 && group.group_type === 'private') {
        alert('Invalid password');
      } else {
        alert('Failed to join group');
      }
    } finally {
      setJoiningGroup(null);
      setShowPasswordModal(false);
      setPassword('');
    }
  };

  const handleJoinClick = (group: Group) => {
    if (group.group_type === 'private') {
      setSelectedGroup(group);
      setShowPasswordModal(true);
    } else {
      joinGroup(group);
    }
  };

  // Derive a non-generic display name for a user
  const getDisplayName = (user: User) => {
    // The /users/ endpoint returns UserProfile objects with nested user data
    // Structure: { id, user: { first_name, last_name, email, username }, userprofile: {...} }
    const userData = user.user || user; // Handle both nested and direct structures
    const firstName = userData.first_name || '';
    const lastName = userData.last_name || '';
    const email = userData.email || '';
    const username = userData.username || '';
    
    const full = `${firstName} ${lastName}`.trim();
    if (full) return full;
    
    const emailPrefix = email.split('@')[0];
    const genericRe = /^user\d*$/i;
    if (emailPrefix && !genericRe.test(emailPrefix)) return emailPrefix;
    
    if (username && !genericRe.test(username)) return username;
    
    return `User #${user.id}`;
  };

  const startDirectConversation = async (user: User) => {
    const userId = user.user?.id || user.id;
    setStartingConversation(userId);
    try {
      console.log('Starting conversation with user:', userId, user);
      const response = await api.post('/conversations/direct/start/', {
        user_id: userId
      });
      
      console.log('Conversation started successfully:', response.data);
      if (onConversationStarted) {
        onConversationStarted(response.data.conversation);
      }
      onClose();
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Failed to start conversation';
      alert(errorMessage);
    } finally {
      setStartingConversation(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card rounded-xl shadow-xl w-full max-w-lg max-h-[70vh] overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Discover & Connect</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-3 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'groups'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Groups
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Users
            </button>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (activeTab === 'groups' ? loadGroups() : loadUsers())}
              placeholder={activeTab === 'groups' ? 'Search groups...' : 'Search users...'}
              className="input-field pl-8 py-1.5 text-sm"
            />
            <svg className="w-3 h-3 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="p-4 overflow-y-auto max-h-64">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : activeTab === 'groups' ? (
            groups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="font-medium text-gray-900 dark:text-gray-100">No groups found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-2">
                {groups.map(group => (
                  <div key={group.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-1">
                              <span>{group.name}</span>
                              {group.group_type === 'private' && (
                                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              )}
                              {group.group_type === 'project' && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded-full">Project</span>
                              )}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{(group.group_info?.member_count ?? group.participants?.length ?? 0)} members</p>
                          </div>
                        </div>
                        {group.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{group.description}</p>
                        )}
                      </div>
                      {group.group_type === 'project' ? (
                        <span className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          Project Only
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoinClick(group)}
                          disabled={joiningGroup === group.id}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center space-x-1 text-sm"
                        >
                          {joiningGroup === group.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span>Join</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="font-medium text-gray-900 dark:text-gray-100">No users found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Avatar
                            src={user.userprofile?.profile_picture}
                            avatarType={user.userprofile?.avatar_type}
                            selectedAvatar={user.userprofile?.selected_avatar}
                            googlePhotoUrl={user.userprofile?.google_photo_url}
                            size="w-8 h-8"
                          />
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {getDisplayName(user)}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{user.userprofile?.user_type}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => startDirectConversation(user)}
                        disabled={startingConversation === (user.user?.id || user.id)}
                        className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-3 py-1.5 rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center space-x-1 text-sm"
                      >
                        {startingConversation === (user.user?.id || user.id) ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>Message</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="card rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Join Private Group</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                &quot;{selectedGroup.name}&quot; is a private group. Enter the password to join.
              </p>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Group password"
                className="input-field mb-3 py-1.5 text-sm"
                onKeyPress={(e) => e.key === 'Enter' && joinGroup(selectedGroup, password)}
              />
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPassword('');
                  }}
                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => joinGroup(selectedGroup, password)}
                  disabled={!password || joiningGroup === selectedGroup.id}
                  className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-sm"
                >
                  Join Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}