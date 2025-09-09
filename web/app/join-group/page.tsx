'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { isAuthenticated } from '../../lib/auth';
import api from '../../lib/api';

function JoinGroupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const groupId = searchParams.get('id');
  const groupName = searchParams.get('name');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    if (groupId) {
      loadGroupInfo();
    } else {
      setError('Invalid group invitation link');
      setLoading(false);
    }
  }, [groupId, router]);

  const loadGroupInfo = async () => {
    try {
      const response = await api.get(`/conversations/${groupId}/`);
      if (response.data && response.data.conversation_type === 'group') {
        setGroup(response.data);
      } else {
        setError('Group not found or no longer available');
      }
    } catch (error) {
      setError('Group not found or no longer available');
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!group) return;

    setJoining(true);
    setError('');

    try {
      const payload = group.group_type === 'private' && password ? { password } : {};
      await api.post(`/groups/${group.id}/join/`, payload);
      router.push('/messages');
    } catch (error: any) {
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || '';
        if (errorMessage === 'Already in the group') {
          setError('Already in the group');
        } else if (group.group_type === 'private') {
          setError('Invalid password');
          setShowPasswordInput(true);
        } else {
          setError('Failed to join group');
        }
      } else {
        setError('Failed to join group. Please try again.');
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9E86]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-sm p-8">
          {error ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Join Group</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => router.push('/messages')}
                className="bg-[#0D9E86] text-white px-6 py-2 rounded-lg hover:opacity-90"
              >
                Go to Messages
              </button>
            </div>
          ) : group ? (
            <div>
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-[#0D9E86] to-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{group.name}</h1>
                <p className="text-gray-600 mb-4">{group.group_info?.member_count || 0} members</p>
                {group.description && (
                  <p className="text-gray-700 mb-6">{group.description}</p>
                )}
              </div>

              <div className="bg-gradient-to-r from-[#0D9E86] to-blue-600 text-white p-6 rounded-lg mb-6">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <div>
                    <h3 className="font-semibold">You&apos;re Invited!</h3>
                    <p className="text-sm opacity-90">Join this group to start chatting with the members</p>
                  </div>
                </div>
              </div>

              {showPasswordInput && group.group_type === 'private' && (
                <div className="mb-6">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter group password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9E86]"
                    onKeyPress={(e) => e.key === 'Enter' && joinGroup()}
                  />
                  {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/messages')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => group.group_type === 'private' && !showPasswordInput ? setShowPasswordInput(true) : joinGroup()}
                  disabled={joining || (showPasswordInput && !password)}
                  className="flex-1 px-6 py-3 bg-[#0D9E86] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {joining ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Join Group</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function JoinGroupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JoinGroupContent />
    </Suspense>
  );
}