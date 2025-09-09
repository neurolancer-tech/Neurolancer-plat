'use client';

import { useState, useEffect } from 'react';
import Avatar from './Avatar';
import api from '../lib/api';

interface Project {
  id: number;
  title: string;
  team_members: any[];
  conversation_id?: number;
}

interface ProjectTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function ProjectTeamModal({ isOpen, onClose, project }: ProjectTeamModalProps) {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setTeamMembers(project.team_members || []);
      setLoading(false);
      loadCurrentUser();
    }
  }, [isOpen, project]);

  const loadCurrentUser = async () => {
    try {
      const response = await api.get('/auth/profile/');
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const openGroupChat = async () => {
    try {
      if (project.conversation_id) {
        // Navigate to existing group chat
        window.location.href = `/messages?group=${project.conversation_id}`;
      } else {
        // Get current user profile to include client in group
        const profileResponse = await api.get('/auth/profile/');
        const currentUser = profileResponse.data.user;
        
        console.log('Team members:', teamMembers);
        console.log('Current user:', currentUser);
        
        // Get fresh project data to ensure we have latest team members
        const projectResponse = await api.get(`/projects/${project.id}/`);
        const freshTeamMembers = projectResponse.data.team_members || [];
        
        console.log('Fresh team members:', freshTeamMembers);
        
        // Include all team members plus the client
        const teamMemberIds = freshTeamMembers.map((member: any) => member.id);
        const allParticipants = [
          currentUser.id, // Include the client
          ...teamMemberIds
        ].filter((id, index, arr) => arr.indexOf(id) === index); // Remove duplicates
        
        console.log('All participants:', allParticipants);
        
        if (allParticipants.length < 2) {
          alert('Cannot create group chat: No team members found. Please assign tasks to freelancers first.');
          return;
        }
        
        // Create new group chat for project
        const response = await api.post('/conversations/group/create/', {
          name: `${project.title} - Team Chat`,
          description: `Project team communication for ${project.title}`,
          participants: allParticipants,
          project_id: project.id
        });
        
        // Update project with conversation_id
        await api.patch(`/projects/${project.id}/update/`, {
          conversation: response.data.id
        });
        
        window.location.href = `/messages?group=${response.data.id}`;
      }
    } catch (error) {
      console.error('Error with group chat:', error);
    }
  };

  const leaveGroup = async () => {
    if (!project.conversation_id || !currentUser) return;
    
    if (!confirm('Are you sure you want to leave this group chat?')) return;
    
    try {
      await api.post(`/groups/${project.conversation_id}/leave/`);
      
      // Update project to remove conversation_id if user was admin
      await api.patch(`/projects/${project.id}/update/`, {
        conversation: null
      });
      
      alert('You have left the group chat.');
      onClose();
    } catch (error) {
      console.error('Error leaving group:', error);
      alert('Failed to leave group. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-container">
      <div className="modal-content bg-white dark:bg-gray-800">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Project Team</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{project.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D9E86] mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Team Members List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Team Members ({teamMembers.length})
                </h3>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No team members yet</h4>
                    <p className="text-gray-600 dark:text-gray-400">Assign tasks to freelancers to build your team</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                        <div className="flex items-center space-x-4">
                          <Avatar
                            src={member.profile_picture}
                            avatarType={member.profile_picture ? 'upload' : 'avatar'}
                            size="md"
                            alt={`${member.first_name} ${member.last_name}`}
                          />
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {member.first_name} {member.last_name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.role || 'Freelancer'}</p>
                            {member.skills && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.skills.slice(0, 3).map((skill: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            ★ {member.rating || 0} ({member.total_reviews || 0} reviews)
                          </div>
                          <div className="text-sm font-medium text-[#0D9E86]">
                            ${member.hourly_rate || 0}/hr
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Group Chat Section */}
              {teamMembers.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Communication</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {project.conversation_id 
                          ? 'Project team group chat is active'
                          : 'Create a group chat for your project team'
                        }
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={openGroupChat}
                        className="btn-primary flex items-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>{project.conversation_id ? 'Chat in Group' : 'Create Group'}</span>
                      </button>
                      {project.conversation_id && (
                        <button
                          onClick={leaveGroup}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Leave Group</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}