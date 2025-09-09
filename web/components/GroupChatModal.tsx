'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Avatar from './Avatar';
import api from '../lib/api';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
}

interface GroupChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (group: any) => void;
}

export default function GroupChatModal({ isOpen, onClose, onGroupCreated }: GroupChatModalProps) {
  const [step, setStep] = useState(1);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/');
      setAvailableUsers(response.data.results || response.data);
    } catch (error) {
      console.error('Error loading users:', error);
      console.error('Error details:', (error as any).response?.data);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => 
    (user.first_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.last_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;

    setCreating(true);
    try {
      const response = await api.post('/conversations/group/create/', {
        name: groupName,
        description: groupDescription,
        participants: selectedUsers.map(u => u.id)
      });

      onGroupCreated(response.data);
      handleClose();
    } catch (error) {
      console.error('Error creating group:', error);
      console.error('Error details:', (error as any).response?.data);
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setGroupName('');
    setGroupDescription('');
    setSearchQuery('');
    setSelectedUsers([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create Group Chat</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {step === 1 ? 'Enter group details' : 'Add participants'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-3">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
              step >= 1 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
              step >= 2 ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!groupName.trim()}
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search Users
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or username..."
                    className="w-full px-3 py-2 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Selected ({selectedUsers.length})
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {selectedUsers.map(user => (
                      <div key={user.id} className="flex items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full text-xs">
                        <div className="mr-1">
                          <Avatar
                            src={user.profile_picture}
                            avatarType={(user as any).avatar_type || 'avatar'}
                            selectedAvatar={(user as any).selected_avatar}
                            googlePhotoUrl={(user as any).google_photo_url}
                            size="xs"
                            alt={user.first_name}
                          />
                        </div>
                        {user.first_name} {user.last_name}
                        <button
                          onClick={() => toggleUserSelection(user)}
                          className="ml-1 hover:bg-white hover:bg-opacity-20 rounded-full p-0.5"
                        >
                          <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Users */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Users
                </label>
                <div className="border border-gray-200 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </div>
                  ) : (
                    filteredUsers.map(user => {
                      const isSelected = selectedUsers.find(u => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          onClick={() => toggleUserSelection(user)}
                          className={`flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                            isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''
                          }`}
                        >
                          <div className="relative">
                            <Avatar
                              src={user.profile_picture}
                              avatarType={(user as any).avatar_type || 'avatar'}
                              selectedAvatar={(user as any).selected_avatar}
                              googlePhotoUrl={(user as any).google_photo_url}
                              size="sm"
                              alt={user.first_name}
                            />
                            {isSelected && (
                              <div className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-4 h-4 flex items-center justify-center">
                                <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="ml-2 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                >
                  Back
                </button>
                <div className="space-x-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    disabled={selectedUsers.length === 0 || creating}
                    className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {creating ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}