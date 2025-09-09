'use client';

import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import api from '../lib/api';

// Extend Window interface for TypeScript
declare global {
  interface Window {
    searchTimeout?: NodeJS.Timeout;
  }
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
  userprofile: {
    user_type: string;
    bio: string;
    avatar_type: 'upload' | 'avatar' | 'google' | undefined;
    selected_avatar: string;
    google_photo_url: string;
    profile_picture: string;
  };
}

interface GroupInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: number;
  groupName: string;
}

export default function GroupInviteModal({ isOpen, onClose, groupId, groupName }: GroupInviteModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showLinkCopied, setShowLinkCopied] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      generateInviteLink();
    }
  }, [isOpen]);

  // Trigger search when searchQuery changes
  useEffect(() => {
    if (isOpen) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        loadUsers();
      }, 300);
    }
  }, [searchQuery, isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    console.log('GroupInviteModal: Loading users with query:', searchQuery);
    try {
      // Get all users
      const usersResponse = await api.get('/users/', {
        params: { q: searchQuery }
      });
      console.log('GroupInviteModal: Raw users loaded:', usersResponse.data.length, 'users');
      
      // Get group details to find current participants
      const groupResponse = await api.get(`/conversations/${groupId}/`);
      const currentParticipantIds = groupResponse.data.participants?.map((p: any) => p.id) || [];
      console.log('GroupInviteModal: Current participants:', currentParticipantIds);
      
      // Filter out users who are already in the group
      const availableUsers = usersResponse.data.filter((user: User) => 
        !currentParticipantIds.includes(user.user?.id || user.id)
      );
      console.log('GroupInviteModal: Available users after filtering:', availableUsers.length, 'users');
      
      setUsers(availableUsers);
    } catch (error) {
      console.error('GroupInviteModal: Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/join-group?id=${groupId}&name=${encodeURIComponent(groupName)}`;
    setInviteLink(link);
  };

  const toggleUserSelection = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const getDisplayName = (user: User): string => {
    const firstName = user.user?.first_name || '';
    const lastName = user.user?.last_name || '';
    const username = user.user?.username || '';
    const email = user.user?.email || '';
    
    // Priority: full name > non-generic email prefix > non-generic username > fallback
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    const emailPrefix = email.split('@')[0];
    if (emailPrefix && !emailPrefix.match(/^(user|test|admin)\d*$/i)) {
      return emailPrefix;
    }
    
    if (username && !username.match(/^(user|test|admin)\d*$/i)) {
      return username;
    }
    
    return `User #${user.user?.id || user.id}`;
  };

  const sendInvites = async () => {
    if (selectedUsers.size === 0) return;
    
    setSending(true);
    try {
      const invitePromises = Array.from(selectedUsers).map(async (userId) => {
        console.log('Sending invite to user:', userId);
        const payload = {
          user_id: userId,
          title: `Group Invitation: ${groupName}`,
          message: `You've been invited to join the group "${groupName}". Click to join!`,
          notification_type: 'group_invite',
          action_url: `/join-group?id=${groupId}&name=${encodeURIComponent(groupName)}`
        };
        console.log('Payload:', payload);
        
        try {
          const response = await api.post('/notifications/create/', payload);
          console.log('Success response:', response.data);
          return response;
        } catch (err: unknown) {
          const msg = (err as any)?.response?.data ?? (err as Error)?.message ?? String(err);
          console.error('Individual invite error:', msg);
          throw err;
        }
      });
      
      await Promise.all(invitePromises);
      alert(`Invitations sent to ${selectedUsers.size} user(s)!`);
      onClose();
    } catch (error: unknown) {
      const msg = (error as any)?.response?.data ?? (error as Error)?.message ?? String(error);
      console.error('Error sending invites:', msg);
      alert('Failed to send invitations');
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setShowLinkCopied(true);
      setTimeout(() => setShowLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.user?.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.user?.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.user?.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Invite to {groupName}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Invite Link Section */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">Share Invite Link</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button
                onClick={copyInviteLink}
                className="px-3 py-1.5 bg-[#0D9E86] text-white rounded-lg hover:opacity-90 transition-opacity flex items-center space-x-1 text-xs"
              >
                {showLinkCopied ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search Users */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadUsers()}
              placeholder="Search users to invite..."
              className="w-full px-3 py-1.5 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9E86] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <svg className="w-3 h-3 absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9E86]"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{searchQuery ? 'No users found matching your search' : 'All users are already in this group'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div
                  key={user.user?.id || user.id}
                  onClick={() => toggleUserSelection(user.user?.id || user.id)}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.has(user.user?.id || user.id) ? 'bg-[#0D9E86] bg-opacity-10 border-2 border-[#0D9E86]' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center flex-1 space-x-2">
                    <Avatar
                      src={user.userprofile?.profile_picture}
                      avatarType={user.userprofile?.avatar_type}
                      selectedAvatar={user.userprofile?.selected_avatar}
                      googlePhotoUrl={user.userprofile?.google_photo_url}
                      size="sm"
                      alt={getDisplayName(user)}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {getDisplayName(user)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        @{user.user?.username || 'user'} • {user.userprofile?.user_type || 'User'}
                      </div>
                    </div>
                  </div>
                  {selectedUsers.has(user.user?.id || user.id) && (
                    <svg className="w-4 h-4 text-[#0D9E86]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {selectedUsers.size} user(s) selected • {filteredUsers.length} available to invite
            </span>
            <button
              onClick={sendInvites}
              disabled={sending || selectedUsers.size === 0}
              className="bg-[#0D9E86] text-white px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center space-x-1 text-sm"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send Invites</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}