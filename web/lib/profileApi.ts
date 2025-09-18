import api from './api';

export interface FreelancerProfile {
  id?: number;
  title: string;
  bio: string;
  hourly_rate: number;
  skills: string;
  experience_years: number;
  portfolio_url: string;
  github_url: string;
  linkedin_url: string;
  availability: 'full_time' | 'part_time' | 'contract' | 'freelance';
  rating?: number;
  total_reviews?: number;
  completed_projects?: number;
  response_time?: string;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ClientProfile {
  id?: number;
  company_name: string;
  company_size: string;
  industry: string;
  website_url: string;
  typical_budget: string;
  project_types: string;
  total_projects_posted?: number;
  total_spent?: number;
  avg_rating_given?: number;
  is_active?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export const profileApi = {
  // Freelancer Profile
  async getFreelancerProfile(): Promise<FreelancerProfile> {
    const response = await api.get('/profiles/freelancer/');
    const data = response.data;
    const profile = data.profile || data;
    // Normalize is_active flag if backend returns it under different keys
    if (profile && typeof (profile as any).is_active === 'undefined' && typeof (profile as any).isPublished !== 'undefined') {
      (profile as any).is_active = (profile as any).isPublished;
    }
    return profile;
  },

  async createFreelancerProfile(data: Partial<FreelancerProfile>): Promise<FreelancerProfile> {
    // Clean the data to only include valid fields
    const cleanData = {
      title: data.title || '',
      bio: data.bio || '',
      hourly_rate: data.hourly_rate || 0,
      skills: data.skills || '',
      experience_years: data.experience_years || 0,
      portfolio_url: data.portfolio_url || '',
      github_url: data.github_url || '',
      linkedin_url: data.linkedin_url || '',
      availability: data.availability || 'freelance'
    };
    
    const response = await api.post('/profiles/freelancer/', cleanData);
    return response.data.profile || response.data;
  },

  async updateFreelancerProfile(data: Partial<FreelancerProfile>): Promise<FreelancerProfile> {
    // Clean the data to only include valid fields
    const cleanData = {
      title: data.title || '',
      bio: data.bio || '',
      hourly_rate: data.hourly_rate || 0,
      skills: data.skills || '',
      experience_years: data.experience_years || 0,
      portfolio_url: data.portfolio_url || '',
      github_url: data.github_url || '',
      linkedin_url: data.linkedin_url || '',
      availability: data.availability || 'freelance'
    };
    
    const response = await api.put('/profiles/freelancer/', cleanData);
    return response.data.profile || response.data;
  },

  // Client Profile
  async getClientProfile(): Promise<ClientProfile> {
    const response = await api.get('/profiles/client/');
    const data = response.data;
    if (data.success && data.profile) {
      return data.profile;
    } else if (data.success && !data.exists) {
      throw new Error('No profile found');
    }
    return data;
  },

  async createClientProfile(data: Partial<ClientProfile>): Promise<ClientProfile> {
    const response = await api.post('/profiles/client/', data);
    return response.data.profile || response.data;
  },

  async updateClientProfile(data: Partial<ClientProfile>): Promise<ClientProfile> {
    const response = await api.put('/profiles/client/', data);
    return response.data.profile || response.data;
  },

  // Get profile by user ID
  async getFreelancerProfileById(userId: number): Promise<FreelancerProfile> {
    const response = await api.get(`/profiles/freelancer/${userId}/`);
    return response.data;
  },

  async getClientProfileById(userId: number): Promise<ClientProfile> {
    const response = await api.get(`/profiles/client/${userId}/`);
    return response.data;
  }
};