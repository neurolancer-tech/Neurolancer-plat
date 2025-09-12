'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Avatar from '@/components/Avatar';
import AvatarSelector from '@/components/AvatarSelector';
import OnboardingModal from '@/components/OnboardingModal';
import { User, UserProfile } from '@/types';
import { isAuthenticated, getUser, getProfile, setUser, setProfile } from '@/lib/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface OnboardingData {
  // Client fields
  company_name?: string;
  company_size?: string;
  industry?: string;
  project_types?: string;
  budget_range?: string;
  timeline_preference?: string;
  goals?: string;
  hear_about_us?: string;
  
  // Freelancer fields
  specialization?: string;
  experience_years?: string;
  education_level?: string;
  work_preference?: string;
  availability?: string;
  rate_expectation?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUserState] = useState<User | null>(null);
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [completedCoursesCount, setCompletedCoursesCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [dashboardStats, setDashboardStats] = useState<any | null>(null);
  const [clientProjectStats, setClientProjectStats] = useState<{ projectsCount: number; tasksCount: number } | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    gender: '',
    bio: '',
    skills: '',
    hourly_rate: '',
    title: '',
    experience_years: '',
    education: '',
    certifications: '',
    languages: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    linkedin: '',
    github: ''
  });
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [skillBadges, setSkillBadges] = useState<any[]>([]);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth');
      return;
    }

    const currentUser = getUser();
    const currentProfile = getProfile();
    
    if (currentUser && currentProfile) {
      setUserState(currentUser);
      setProfileState(currentProfile);
      const profileData = currentProfile as any;
      setFormData({
        first_name: currentUser.first_name || '',
        last_name: currentUser.last_name || '',
        email: currentUser.email || '',
        gender: profileData.gender || '',
        bio: currentProfile.bio || '',
        skills: currentProfile.skills || '',
        hourly_rate: currentProfile.hourly_rate?.toString() || '',
        title: profileData.title || '',
        experience_years: profileData.experience_years?.toString() || '',
        education: profileData.education || '',
        certifications: profileData.certifications || '',
        languages: profileData.languages || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        city: profileData.city || '',
        country: profileData.country || '',
        website: profileData.website || '',
        linkedin: profileData.linkedin || '',
        github: profileData.github || ''
      });
      
      // Load professional documents
      loadDocuments();
      
      // Fetch onboarding data
      fetchOnboardingData();
      
      // Load completed courses count
      loadCompletedCourses();

      // Load dashboard stats for role-based metrics
      loadDashboardStats();

      // Load client project/task statistics (for clients or both)
      if (currentProfile?.user_type === 'client' || currentProfile?.user_type === 'both') {
        loadClientProjectStats();
      }
      
      // Load skill badges for freelancers
      if (currentProfile?.user_type === 'freelancer' || currentProfile?.user_type === 'both') {
        loadSkillBadges();
      }
    }
  }, [router]);

  const fetchOnboardingData = async () => {
    try {
      const response = await api.get('/onboarding/');
      setOnboardingData(response.data);
    } catch (error) {
      console.log('No onboarding data found');
    }
  };

  const loadCompletedCourses = async () => {
    try {
      const response = await api.get('/enrollments/?status=completed');
      const completedCourses = response.data.results || response.data || [];
      setCompletedCoursesCount(completedCourses.length);
    } catch (error) {
      console.error('Error loading completed courses:', error);
      setCompletedCoursesCount(0);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats/');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setDashboardStats(null);
    }
  };

  const loadClientProjectStats = async () => {
    try {
      let pc = 0;
      let tc = 0;
      let url: string | null = '/projects/';
      while (url) {
        const data: any = (await api.get(url as any)).data;
        const results = Array.isArray(data) ? data : (data.results || []);
        if (Array.isArray(results) && results.length) {
          pc += results.length;
          tc += results.reduce((sum: number, p: any) => sum + (p?.tasks_count || 0), 0);
        }
        url = data.next || null;
      }
      setClientProjectStats({ projectsCount: pc, tasksCount: tc });
    } catch (error) {
      console.error('Error loading client project stats:', error);
      setClientProjectStats({ projectsCount: 0, tasksCount: 0 });
    }
  };

  const loadDocuments = async () => {
    try {
      const response = await api.get('/profile/documents/');
      // Handle paginated response
      const documentsData = response.data.results || response.data || [];
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    }
  };

  const loadSkillBadges = async () => {
    try {
      const response = await api.get('/assessments/my-badges/');
      const badgesData = response.data.results || response.data || [];
      setSkillBadges(Array.isArray(badgesData) ? badgesData : []);
    } catch (error: any) {
      console.error('Error loading skill badges:', error);
      setSkillBadges([]);
    }
  };

  const uploadDocument = async (file: File, name: string, type: string, description: string) => {
    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('document_type', type);
      formData.append('description', description);
      formData.append('is_public', 'true');
      
      await api.post('/profile/documents/create/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Document uploaded successfully!');
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.response?.status === 404) {
        toast.error('Backend server not available. Please ensure the Django server is running.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to upload document');
      }
    } finally {
      setUploadingDocument(false);
    }
  };

  const deleteDocument = async (id: number) => {
    try {
      await api.delete(`/profile/documents/${id}/delete/`);
      toast.success('Document deleted successfully!');
      loadDocuments();
    } catch (error: any) {
      console.error('Delete error:', error);
      if (error.response?.status === 404) {
        toast.error('Backend server not available. Please ensure the Django server is running.');
      } else {
        toast.error(error.response?.data?.error || 'Failed to delete document');
      }
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    fetchOnboardingData(); // Refresh data
  };

  const hasOnboardingData = onboardingData && (
    onboardingData.company_name || 
    onboardingData.specialization || 
    onboardingData.goals
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarSelect = async (avatar: string) => {
    try {
      const response = await api.post('/profile/avatar/update/', {
        avatar_type: 'avatar',
        selected_avatar: avatar
      });
      
      // Update profile state
      if (profile) {
        const updatedProfile = { ...profile, selected_avatar: avatar, avatar_type: 'avatar', profile_picture: undefined };
        setProfileState(updatedProfile);
        setProfile(updatedProfile);
      }
      
      toast.success('Avatar updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update avatar');
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      formData.append('avatar_type', 'upload');
      
      const response = await api.post('/profile/avatar/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update profile state
      if (profile) {
        const updatedProfile = { 
          ...profile, 
          avatar_type: 'upload', 
          profile_picture: response.data.profile_picture,
          selected_avatar: undefined 
        };
        setProfileState(updatedProfile);
        setProfile(updatedProfile);
      }
      
      toast.success('Profile picture updated successfully!');
    } catch (error: any) {
      toast.error('Failed to upload image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile info (includes user data)
      const profileData: any = {
        // User fields
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        // Profile fields
        bio: formData.bio,
        skills: formData.skills,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        gender: formData.gender,
        title: formData.title,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        education: formData.education,
        certifications: formData.certifications,
        languages: formData.languages,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        website: formData.website,
        linkedin: formData.linkedin,
        github: formData.github
      };
      
      const profileResponse = await api.patch('/profile/update/', profileData);

      // Update local storage
      if (profileResponse.data.user) {
        setUser(profileResponse.data.user);
      }
      setProfile(profileResponse.data);
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const formatProjectTypes = (projectTypesStr: string) => {
    try {
      const types = JSON.parse(projectTypesStr);
      return types.map((type: string) => {
        return type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      }).join(', ');
    } catch {
      return projectTypesStr;
    }
  };

  const formatSpecialization = (specializationStr: string) => {
    try {
      const specs = JSON.parse(specializationStr);
      return specs.map((spec: string) => {
        return spec.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      }).join(', ');
    } catch {
      return specializationStr;
    }
  };

  const formatBudgetRange = (range: string) => {
    const ranges: { [key: string]: string } = {
      'under_1k': 'Under $1,000',
      '1k_5k': '$1,000 - $5,000',
      '5k_10k': '$5,000 - $10,000',
      '10k_25k': '$10,000 - $25,000',
      '25k_50k': '$25,000 - $50,000',
      '50k_plus': '$50,000+'
    };
    return ranges[range] || range;
  };

  const formatRateExpectation = (rate: string) => {
    const rates: { [key: string]: string } = {
      'under_25': 'Under $25/hr',
      '25_50': '$25-50/hr',
      '50_75': '$50-75/hr',
      '75_100': '$75-100/hr',
      '100_150': '$100-150/hr',
      '150_plus': '$150+/hr'
    };
    return rates[rate] || rate;
  };

  const handleRoleChange = async (newRole: 'client' | 'freelancer' | 'both') => {
    try {
      const response = await api.patch('/profile/update/', { user_type: newRole });
      if (profile) {
        const updatedProfile = { ...profile, user_type: newRole } as UserProfile;
        setProfileState(updatedProfile);
        setProfile(updatedProfile);
      }
      toast.success('Role updated successfully!');
      setShowRoleMenu(false);
    } catch (error: any) {
      toast.error('Failed to update role');
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: '👤' },
    { id: 'contact', label: 'Contact Details', icon: '📞' },
    { id: 'professional', label: 'Professional', icon: '💼' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    ...(profile?.user_type === 'freelancer' || profile?.user_type === 'both' ? [{ id: 'badges', label: 'Skill Badges', icon: '🏆' }] : []),
    { id: 'onboarding', label: 'Background', icon: '📋' },
    { id: 'stats', label: 'Statistics', icon: '📊' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
        {/* Header Section */}
        <div className="card rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar
                  src={profile?.profile_picture}
                  avatarType={(profile?.avatar_type as "upload" | "avatar" | "google") || 'avatar'}
                  selectedAvatar={profile?.selected_avatar}
                  googlePhotoUrl={profile?.google_photo_url}
                  size="xl"
                  className="ring-4 ring-white shadow-lg"
                />
                <button
                  onClick={() => setShowAvatarSelector(true)}
                  className="absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full p-2 shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setShowAvatarSelector(true)}
                className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium transition-all shadow-md"
              >
                Change Avatar
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {user?.first_name} {user?.last_name}
              </h1>
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {profile?.user_type === 'client' ? '🏢 Client' : 
                   profile?.user_type === 'freelancer' ? '💼 Freelancer' : 
                   '🔄 Client & Freelancer'}
                </p>
                <RoleChangeButton currentRole={profile?.user_type} onRoleChange={handleRoleChange} />
              </div>
              {profile?.bio && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl">
                  {profile.bio}
                </p>
              )}
              
              {/* Quick Stats (role-based) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
                {(profile?.user_type === 'freelancer' || profile?.user_type === 'both') ? (
                  <>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">⭐ {profile?.rating || '0.0'}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{profile?.total_reviews || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Reviews</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{dashboardStats?.completed_orders ?? (profile as any)?.completed_gigs ?? 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-orange-600">{completedCoursesCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Courses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-500">👍 {profile?.likes_count || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-500">👎 {profile?.dislikes_count || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Dislikes</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">${dashboardStats?.total_spent || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Total Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-600">{dashboardStats?.total_orders || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-purple-600">{dashboardStats?.active_orders || 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-indigo-600">{clientProjectStats?.projectsCount ?? 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Projects</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-teal-600">{clientProjectStats?.tasksCount ?? 0}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Tasks</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="card rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-8 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800" style={{ scrollbarWidth: 'thin' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-lg"
                  >
                    {loading ? 'Updating...' : 'Update Personal Info'}
                  </button>
                </div>
              </form>
            )}

            {/* Contact Details Tab */}
            {activeTab === 'contact' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="New York"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="United States"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      LinkedIn Profile
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      GitHub Profile
                    </label>
                    <input
                      type="url"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Your full address..."
                  />
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 transition-all font-medium shadow-lg"
                  >
                    {loading ? 'Updating...' : 'Update Contact Details'}
                  </button>
                </div>
              </form>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Professional Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="Senior AI Engineer, Data Scientist, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      min="0"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Tell us about yourself and your expertise..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="AI, Machine Learning, Python, TensorFlow"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Languages (comma-separated)
                    </label>
                    <input
                      type="text"
                      name="languages"
                      value={formData.languages}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="English, Spanish, French"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Education
                  </label>
                  <textarea
                    name="education"
                    rows={3}
                    value={formData.education}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Your educational background..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Certifications
                  </label>
                  <textarea
                    name="certifications"
                    rows={3}
                    value={formData.certifications}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Your professional certifications..."
                  />
                </div>

                {(profile?.user_type === 'freelancer' || profile?.user_type === 'both') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      name="hourly_rate"
                      min="5"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="50.00"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all font-medium shadow-lg"
                  >
                    {loading ? 'Updating...' : 'Update Professional Info'}
                  </button>
                </div>
              </form>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <DocumentsSection 
                documents={documents}
                onUpload={uploadDocument}
                onDelete={deleteDocument}
                uploading={uploadingDocument}
              />
            )}

            {/* Skill Badges Tab */}
            {activeTab === 'badges' && (
              <SkillBadgesSection badges={skillBadges} />
            )}

            {/* Onboarding/Background Tab */}
            {activeTab === 'onboarding' && (
              <div className="space-y-8">
                {onboardingData ? (
                  <>
                    {profile?.user_type === 'client' || profile?.user_type === 'both' ? (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Client Background</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {onboardingData.company_name && (
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                              <label className="block text-sm font-medium text-blue-100 mb-1">Company Name</label>
                              <p className="text-white font-medium">{onboardingData.company_name}</p>
                            </div>
                          )}
                          
                          {onboardingData.company_size && (
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg text-white">
                              <label className="block text-sm font-medium text-green-100 mb-1">Company Size</label>
                              <p className="text-white font-medium">{onboardingData.company_size} employees</p>
                            </div>
                          )}
                          
                          {onboardingData.industry && (
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                              <label className="block text-sm font-medium text-purple-100 mb-1">Industry</label>
                              <p className="text-white font-medium capitalize">{onboardingData.industry}</p>
                            </div>
                          )}
                          
                          {onboardingData.budget_range && (
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                              <label className="block text-sm font-medium text-blue-100 mb-1">Budget Range</label>
                              <p className="text-white font-medium">{formatBudgetRange(onboardingData.budget_range)}</p>
                            </div>
                          )}
                        </div>
                        
                        {onboardingData.project_types && (
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg text-white">
                            <label className="block text-sm font-medium text-green-100 mb-1">Project Types</label>
                            <p className="text-white font-medium">{formatProjectTypes(onboardingData.project_types)}</p>
                          </div>
                        )}
                        
                        {onboardingData.goals && (
                          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                            <label className="block text-sm font-medium text-purple-100 mb-1">Goals</label>
                            <p className="text-white font-medium">{onboardingData.goals}</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                    
                    {profile?.user_type === 'freelancer' || profile?.user_type === 'both' ? (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Freelancer Background</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {onboardingData.experience_years && (
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                              <label className="block text-sm font-medium text-blue-100 mb-1">Experience</label>
                              <p className="text-white font-medium">{onboardingData.experience_years} years</p>
                            </div>
                          )}
                          
                          {onboardingData.work_preference && (
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg text-white">
                              <label className="block text-sm font-medium text-green-100 mb-1">Work Preference</label>
                              <p className="text-white font-medium">{onboardingData.work_preference.replace(/_/g, ' ')}</p>
                            </div>
                          )}
                          
                          {onboardingData.rate_expectation && (
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                              <label className="block text-sm font-medium text-purple-100 mb-1">Rate Expectation</label>
                              <p className="text-white font-medium">{formatRateExpectation(onboardingData.rate_expectation)}</p>
                            </div>
                          )}
                        </div>
                        
                        {onboardingData.specialization && (
                          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                            <label className="block text-sm font-medium text-blue-100 mb-1">Specialization</label>
                            <p className="text-white font-medium">{formatSpecialization(onboardingData.specialization)}</p>
                          </div>
                        )}
                        
                        {onboardingData.goals && (
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-lg text-white">
                            <label className="block text-sm font-medium text-green-100 mb-1">Career Goals</label>
                            <p className="text-white font-medium">{onboardingData.goals}</p>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-6xl mb-4">📋</div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Background Information</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Complete your onboarding to see your background information here.</p>
                    <button
                      onClick={() => setShowOnboarding(true)}
                      className={`px-6 py-3 text-white rounded-lg font-medium shadow-lg ${
                        profile?.user_type === 'freelancer' 
                          ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                      }`}
                    >
                      Complete Onboarding
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {/* Statistics Tab (role-based) */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Profile Statistics</h3>

                {(profile?.user_type === 'freelancer' || profile?.user_type === 'both') ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-100">Average Rating</p>
                            <p className="text-3xl font-bold text-white">{profile?.rating || '0.0'}</p>
                          </div>
                          <div className="text-white text-2xl">⭐</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-100">Total Reviews</p>
                            <p className="text-3xl font-bold text-white">{profile?.total_reviews || 0}</p>
                          </div>
                          <div className="text-white text-2xl">💬</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-100">Total Earnings</p>
                            <p className="text-3xl font-bold text-white">${profile?.total_earnings || '0.00'}</p>
                          </div>
                          <div className="text-white text-2xl">💰</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-100">Completed Orders</p>
                            <p className="text-3xl font-bold text-white">{dashboardStats?.completed_orders ?? (profile as any)?.completed_gigs ?? 0}</p>
                          </div>
                          <div className="text-white text-2xl">✅</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-100">Completed Courses</p>
                            <p className="text-3xl font-bold text-white">{completedCoursesCount}</p>
                          </div>
                          <div className="text-white text-2xl">🎓</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-100">Profile Likes</p>
                            <p className="text-3xl font-bold text-white">{profile?.likes_count || 0}</p>
                          </div>
                          <div className="text-white text-2xl">👍</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
                      <h4 className="text-lg font-semibold text-white mb-4">Community Engagement</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-purple-100">Profile Likes</p>
                          <p className="text-2xl font-bold text-white">👍 {profile?.likes_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-purple-100">Profile Dislikes</p>
                          <p className="text-2xl font-bold text-white">👎 {profile?.dislikes_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-purple-100">Engagement Ratio</p>
                          <p className="text-2xl font-bold text-white">
                            {profile?.likes_count && profile?.dislikes_count ? 
                              Math.round((profile.likes_count / (profile.likes_count + profile.dislikes_count)) * 100) : 100}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl text-white">
                      <h4 className="text-lg font-semibold text-white mb-4">Account Balance</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm text-indigo-100">Available Balance</p>
                          <p className="text-2xl font-bold text-white">${dashboardStats?.available_balance ?? (profile as any)?.available_balance ?? '0.00'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-indigo-100">Escrow Balance</p>
                          <p className="text-2xl font-bold text-white">${dashboardStats?.escrow_balance ?? (profile as any)?.escrow_balance ?? '0.00'}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-100">Total Spent</p>
                            <p className="text-3xl font-bold text-white">${dashboardStats?.total_spent || 0}</p>
                          </div>
                          <div className="text-white text-2xl">💸</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-100">Total Orders</p>
                            <p className="text-3xl font-bold text-white">{dashboardStats?.total_orders || 0}</p>
                          </div>
                          <div className="text-white text-2xl">📦</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-100">Completed Orders</p>
                            <p className="text-3xl font-bold text-white">{dashboardStats?.completed_orders || 0}</p>
                          </div>
                          <div className="text-white text-2xl">✅</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-red-500 to-red-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-100">Active Orders</p>
                            <p className="text-3xl font-bold text-white">{dashboardStats?.active_orders || 0}</p>
                          </div>
                          <div className="text-white text-2xl">🔥</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-indigo-100">Total Projects</p>
                            <p className="text-3xl font-bold text-white">{clientProjectStats?.projectsCount ?? 0}</p>
                          </div>
                          <div className="text-white text-2xl">📁</div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 rounded-xl text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-pink-100">Total Tasks</p>
                            <p className="text-3xl font-bold text-white">{clientProjectStats?.tasksCount ?? 0}</p>
                          </div>
                          <div className="text-white text-2xl">🧩</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
        </div>
        </div>
      </main>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        onUpload={handleAvatarUpload}
        currentAvatar={profile?.selected_avatar}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        userType={profile?.user_type === 'freelancer' ? 'freelancer' : 'client'}
        onComplete={handleOnboardingComplete}
      />
      
      {/* Click outside to close role menu */}
      {showRoleMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowRoleMenu(false)}
        />
      )}
    </div>
  );
}

// Documents Section Component
function DocumentsSection({ documents, onUpload, onDelete, uploading }: {
  documents: any[];
  onUpload: (file: File, name: string, type: string, description: string) => void;
  onDelete: (id: number) => void;
  uploading: boolean;
}) {
  // Ensure documents is always an array
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'cv',
    description: '',
    file: null as File | null
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({ ...uploadForm, file, name: file.name.split('.')[0] });
    }
  };

  const handleUpload = () => {
    if (uploadForm.file && uploadForm.name) {
      onUpload(uploadForm.file, uploadForm.name, uploadForm.type, uploadForm.description);
      setUploadForm({ name: '', type: 'cv', description: '', file: null });
      setShowUploadModal(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      cv: '📄',
      portfolio: '🎨',
      certificate: '🏆',
      degree: '🎓',
      license: '📜',
      other: '📁'
    };
    return icons[type] || '📁';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Professional Documents</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Upload your CV, certificates, and other professional documents. These will be visible to clients on your profile.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Upload Document</span>
        </button>
      </div>

      {safeDocuments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Documents Uploaded</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Upload your professional documents to showcase your qualifications to clients.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
          >
            Upload Your First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {safeDocuments.map((doc: any) => (
            <div key={doc.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getDocumentIcon(doc.document_type)}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{doc.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{doc.document_type.replace('_', ' ')}</p>
                    {doc.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{doc.description}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                    title="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </a>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="text-red-600 hover:text-red-800 p-1 rounded"
                    title="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="card rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Resume"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Type</label>
                <select
                  value={uploadForm.type}
                  onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                  className="input-field"
                >
                  <option value="cv">CV/Resume</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="certificate">Certificate</option>
                  <option value="degree">Degree</option>
                  <option value="license">License</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Brief description of the document..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">File</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="input-field"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <p className="text-xs text-gray-500 mt-1">Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadForm.file || !uploadForm.name || uploading}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Role Change Button Component
function RoleChangeButton({ currentRole, onRoleChange }: { currentRole?: string; onRoleChange: (role: 'client' | 'freelancer' | 'both') => void }) {
  const [showMenu, setShowMenu] = useState(false);
  
  const roles: Array<{ value: 'client' | 'freelancer' | 'both'; label: string; desc: string }> = [
    { value: 'client', label: '🏢 Client', desc: 'Hire freelancers' },
    { value: 'freelancer', label: '💼 Freelancer', desc: 'Offer services' },
    { value: 'both', label: '🔄 Both', desc: 'Client & Freelancer' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        title="Change Role"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      </button>
      
      {showMenu && (
        <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 min-w-48">
          {roles.map((role) => (
            <button
              key={role.value}
              onClick={() => {
                onRoleChange(role.value);
                setShowMenu(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                currentRole === role.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="font-medium">{role.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{role.desc}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Skill Badges Section Component
function SkillBadgesSection({ badges }: { badges: any[] }) {
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
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Skill Badges</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Badges earned from skill assessments showcase your verified expertise to potential clients.
        </p>
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Skill Badges Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Take skill assessments to earn badges and showcase your expertise.
          </p>
          <a
            href="/skill-assessments"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all inline-block"
          >
            Take Skill Assessment
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge: any) => (
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
          ))}
        </div>
      )}
    </div>
  );
}