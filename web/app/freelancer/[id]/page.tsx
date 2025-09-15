'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import { isAuthenticated } from '@/lib/auth';
import api from '@/lib/api';
import { profileApi, FreelancerProfile as ProfessionalFreelancerProfile } from '@/lib/profileApi';
import toast from 'react-hot-toast';

interface FreelancerProfile {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  user_type: string;
  bio: string;
  profile_picture: string;
  avatar_type: string;
  selected_avatar: string;
  google_photo_url: string;
  skills: string;
  hourly_rate: number;
  title: string;
  experience_years: number;
  education: string;
  certifications: string;
  languages: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  website: string;
  linkedin: string;
  github: string;
  rating: number;
  total_reviews: number;
  completed_gigs: number;
  total_earnings: number;
  likes_count: number;
  dislikes_count: number;
  completed_courses_count: number;
  professional_documents: any[];
}

interface Gig {
  id: number;
  title: string;
  description: string;
  image: string;
  basic_price: number;
  rating: number;
  total_reviews: number;
  category: {
    name: string;
  };
}

export default function FreelancerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null);
  const [professionalProfile, setProfessionalProfile] = useState<ProfessionalFreelancerProfile | null>(null);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [skillBadges, setSkillBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [startingConversation, setStartingConversation] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }
    loadFreelancerData();
  }, [params.id, router]);

  const loadFreelancerData = async () => {
    try {
      const [profileResponse, gigsResponse, coursesResponse, badgesResponse] = await Promise.all([
        api.get(`/freelancers/${params.id}/`),
        api.get(`/gigs/?freelancer=${params.id}`),
        api.get(`/enrollments/?student=${params.id}&status=completed`).catch(() => ({ data: { results: [] } })),
        api.get(`/assessments/my-badges/?user=${params.id}`).catch(() => ({ data: { results: [] } }))
      ]);
      
      const freelancerData = {
        ...profileResponse.data,
        completed_courses_count: coursesResponse.data.results?.length || 0
      };
      
      // Load professional profile
      try {
        const professionalProfileData = await profileApi.getFreelancerProfileById(Number(params.id));
        setProfessionalProfile(professionalProfileData);
      } catch (error) {
        console.log('No professional profile found');
      }
      
      setFreelancer(freelancerData);
      setGigs(gigsResponse.data.results || gigsResponse.data);
      setSkillBadges(badgesResponse.data.results || badgesResponse.data || []);
    } catch (error) {
      console.error('Error loading freelancer data:', error);
      toast.error('Failed to load freelancer profile');
    } finally {
      setLoading(false);
    }
  };

  const startDirectConversation = async () => {
    if (!freelancer) return;
    
    setStartingConversation(true);
    try {
      // Try multiple endpoints as fallback
      let response;
      try {
        response = await api.post('/conversations/direct/create/', {
          participant_id: freelancer.user.id
        });
      } catch (primaryError) {
        console.log('Primary endpoint failed, trying alternative:', primaryError);
        // Try with user_id parameter
        response = await api.post('/conversations/direct/start/', {
          user_id: freelancer.user.id
        });
      }
      
      // Handle different response formats
      const conversationId = response.data.id || response.data.conversation?.id;
      if (conversationId) {
        router.push(`/messages?conversation=${conversationId}`);
      } else {
        // Fallback: navigate to messages page
        router.push('/messages');
        toast.success('Conversation started successfully');
      }
    } catch (error: any) {
      console.error('All conversation endpoints failed:', error);
      // Final fallback: just navigate to messages
      router.push('/messages');
      toast.success('Redirected to messages. You can start a conversation there.');
    } finally {
      setStartingConversation(false);
    }
  };

  const viewGig = (gigId: number) => {
    router.push(`/gigs/${gigId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation />
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Freelancer Not Found</h2>
          <p className="text-gray-600 mt-2">The freelancer you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '👤' },
    { id: 'professional', label: 'Professional Profile', icon: '💼' },
    { id: 'gigs', label: 'Services', icon: '💼' },
    { id: 'badges', label: 'Skill Badges', icon: '🏆' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'contact', label: 'Contact', icon: '📞' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar
                src={freelancer.profile_picture}
                avatarType={(freelancer.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                selectedAvatar={freelancer.selected_avatar}
                googlePhotoUrl={freelancer.google_photo_url}
                size="xl"
                className="ring-4 ring-white shadow-lg"
              />
              <div className="flex space-x-3">
                <button
                  onClick={startDirectConversation}
                  disabled={startingConversation}
                  className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center space-x-2"
                >
                  {startingConversation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Freelancer Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {freelancer.user.first_name} {freelancer.user.last_name}
              </h1>
              {(professionalProfile?.title || freelancer.title) && (
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
                  {professionalProfile?.title || freelancer.title}
                </p>
              )}
              {(professionalProfile?.bio || freelancer.bio) && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl mb-6">
                  {professionalProfile?.bio || freelancer.bio}
                </p>
              )}
              
              {professionalProfile?.availability && (
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    professionalProfile.availability === 'freelance' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : professionalProfile.availability === 'part_time'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {professionalProfile.availability === 'freelance' ? '🟢 Available for freelance' :
                     professionalProfile.availability === 'part_time' ? '🟡 Part time' : 
                     professionalProfile.availability === 'full_time' ? '🔵 Full time' : '🟠 Contract'}
                  </span>
                </div>
              )}
              
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">⭐ {freelancer.rating || '0.0'}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{freelancer.total_reviews || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">{freelancer.completed_gigs || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Gigs Done</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-orange-600">{freelancer.completed_courses_count || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-purple-600">🏆 {skillBadges.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Badges</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-green-500">👍 {freelancer.likes_count || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Likes</div>
                </div>
                {(professionalProfile?.hourly_rate || freelancer.hourly_rate) && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">${professionalProfile?.hourly_rate || freelancer.hourly_rate}/hr</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Rate</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-8 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800" style={{ scrollbarWidth: 'thin' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Skills */}
                  {(professionalProfile?.skills || freelancer.skills) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {(professionalProfile?.skills || freelancer.skills).split(',').map((skill, index) => (
                          <span
                            key={index}
                            className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {freelancer.languages && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {freelancer.languages.split(',').map((language, index) => (
                          <span
                            key={index}
                            className="bg-gradient-to-r from-green-100 to-blue-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
                          >
                            {language.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Experience & Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Experience */}
                  {(professionalProfile?.experience_years || freelancer.experience_years) && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Experience</h3>
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <p className="text-gray-700 dark:text-gray-300">
                          {professionalProfile?.experience_years || freelancer.experience_years} years of professional experience
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Engagement Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Community Engagement</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Profile Likes</span>
                        <span className="font-medium text-green-600">👍 {freelancer.likes_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Profile Dislikes</span>
                        <span className="font-medium text-red-600">👎 {freelancer.dislikes_count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Courses Completed</span>
                        <span className="font-medium text-blue-600">🎓 {freelancer.completed_courses_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Education */}
                {freelancer.education && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Education</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {freelancer.education}
                      </p>
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {freelancer.certifications && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Certifications</h3>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {freelancer.certifications}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Professional Profile Tab */}
            {activeTab === 'professional' && (
              <div className="space-y-8">
                {professionalProfile ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Professional Details</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Title:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Hourly Rate:</span>
                            <span className="font-medium text-green-600">${professionalProfile.hourly_rate}/hr</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Experience:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile.experience_years} years</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Availability:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {professionalProfile.availability?.replace('_', ' ') || 'Not specified'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Stats</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Rating:</span>
                            <span className="font-medium text-yellow-600">⭐ {professionalProfile.rating || '0.0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Reviews:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile.total_reviews || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Projects:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{professionalProfile.completed_projects || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Earnings:</span>
                            <span className="font-medium text-green-600">${freelancer.total_earnings || '0.00'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {professionalProfile.bio && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Professional Bio</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{professionalProfile.bio}</p>
                        </div>
                      </div>
                    )}

                    {(professionalProfile.portfolio_url || professionalProfile.github_url || professionalProfile.linkedin_url) && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Professional Links</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {professionalProfile.portfolio_url && (
                            <a href={professionalProfile.portfolio_url} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                              <span className="text-blue-500">🎨</span>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">Portfolio</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">View work samples</p>
                              </div>
                            </a>
                          )}
                          {professionalProfile.github_url && (
                            <a href={professionalProfile.github_url} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                              <span className="text-gray-700 dark:text-gray-300">💻</span>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">GitHub</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Code repositories</p>
                              </div>
                            </a>
                          )}
                          {professionalProfile.linkedin_url && (
                            <a href={professionalProfile.linkedin_url} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                              <span className="text-blue-600">💼</span>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">LinkedIn</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Professional network</p>
                              </div>
                            </a>
                          )}

                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💼</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Professional Profile</h3>
                    <p className="text-gray-600 dark:text-gray-400">This freelancer hasn't completed their professional profile yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Gigs Tab */}
            {activeTab === 'gigs' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Available Services</h3>
                {gigs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">💼</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Services Available</h3>
                    <p className="text-gray-600 dark:text-gray-400">This freelancer hasn&apos;t created any services yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gigs.map((gig) => (
                      <div key={gig.id} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-lg transition-shadow card">
                        {gig.image && (
                          <img
                            src={gig.image}
                            alt={gig.title}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{gig.title}</h4>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{gig.description}</p>
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-lg font-bold text-green-600">
                              Starting at ${gig.basic_price}
                            </span>
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-500">⭐</span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {gig.rating || '0.0'} ({gig.total_reviews || 0})
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => viewGig(gig.id)}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                          >
                            Order Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Skill Badges Tab */}
            {activeTab === 'badges' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Verified Skill Badges</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  These badges represent {freelancer.user.first_name}&apos;s verified expertise through skill assessments.
                </p>
                {skillBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">🏆</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Skill Badges Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">This freelancer hasn&apos;t earned any skill badges yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skillBadges.map((badge: any) => {
                      const getBadgeColor = (level: string) => {
                        switch (level) {
                          case 'platinum': return 'from-purple-500 to-purple-600';
                          case 'gold': return 'from-yellow-500 to-yellow-600';
                          case 'silver': return 'from-gray-400 to-gray-500';
                          case 'bronze': return 'from-orange-500 to-orange-600';
                          default: return 'from-gray-400 to-gray-500';
                        }
                      };
                      
                      const getBadgeIcon = (level: string) => {
                        switch (level) {
                          case 'platinum': return '💎';
                          case 'gold': return '🥇';
                          case 'silver': return '🥈';
                          case 'bronze': return '🥉';
                          default: return '🏅';
                        }
                      };
                      
                      return (
                        <div key={badge.id} className={`bg-gradient-to-br ${getBadgeColor(badge.badge_level)} p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105`}>
                          <div className="text-center">
                            <div className="text-4xl mb-3">{getBadgeIcon(badge.badge_level)}</div>
                            <h4 className="font-bold text-lg mb-2">{badge.assessment?.title}</h4>
                            <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium mb-3">
                              {badge.badge_level.charAt(0).toUpperCase() + badge.badge_level.slice(1)} Badge
                            </div>
                            <div className="text-2xl font-bold mb-1">{badge.score_percentage}%</div>
                            <div className="text-sm opacity-90">
                              Earned {new Date(badge.earned_at).toLocaleDateString()}
                            </div>
                            {badge.assessment?.category && (
                              <div className="mt-3 text-xs bg-white/20 rounded-full px-2 py-1 inline-block">
                                {badge.assessment.category.name}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Professional Documents</h3>
                {freelancer.professional_documents?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📄</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Documents Available</h3>
                    <p className="text-gray-600 dark:text-gray-400">This freelancer hasn&apos;t uploaded any documents yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {freelancer.professional_documents?.map((doc: any) => (
                      <div key={doc.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow card">
                        <div className="flex items-start space-x-3">
                          <div className="text-2xl">📄</div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">{doc.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{doc.document_type.replace('_', ' ')}</p>
                            {doc.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{doc.description}</p>
                            )}
                          </div>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded text-sm hover:from-blue-600 hover:to-purple-700 transition-all"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {freelancer.city && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">📍</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Location</p>
                        <p className="text-gray-600 dark:text-gray-400">{freelancer.city}{freelancer.country && `, ${freelancer.country}`}</p>
                      </div>
                    </div>
                  )}
                  
                  {freelancer.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">📞</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Phone</p>
                        <p className="text-gray-600 dark:text-gray-400">{freelancer.phone}</p>
                      </div>
                    </div>
                  )}
                  
                  {freelancer.website && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">🌐</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Website</p>
                        <a
                          href={freelancer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {freelancer.website}
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {freelancer.linkedin && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">💼</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">LinkedIn</p>
                        <a
                          href={freelancer.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          LinkedIn Profile
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {freelancer.github && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">💻</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">GitHub</p>
                        <a
                          href={freelancer.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          GitHub Profile
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {freelancer.user.email && (
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-500">✉️</div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Email</p>
                        <p className="text-gray-600 dark:text-gray-400">{freelancer.user.email}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Ready to work together?</h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Contact {freelancer.user.first_name} to discuss your project requirements and get started.
                  </p>
                  
                  {/* Quick Stats Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{freelancer.rating || '0.0'}</div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{freelancer.completed_gigs || 0}</div>
                      <div className="text-xs text-gray-500">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{freelancer.likes_count || 0}</div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={startDirectConversation}
                    disabled={startingConversation}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
                  >
                    {startingConversation ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Start Conversation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}