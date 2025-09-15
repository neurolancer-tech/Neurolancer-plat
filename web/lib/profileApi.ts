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
}

export const profileApi = {
  // Freelancer Profile
  async getFreelancerProfile(): Promise<FreelancerProfile> {
    const response = await api.get('/profiles/freelancer/');
    const data = response.data;
    if (data.success && data.profile) {
      return data.profile;
    } else if (data.success && !data.exists) {
      throw new Error('No profile found');
    }
    return data;
  },

  async createFreelancerProfile(data: Partial<FreelancerProfile>): Promise<FreelancerProfile> {
    const response = await api.post('/profiles/freelancer/', data);
    return response.data.profile || response.data;
  },

  async updateFreelancerProfile(data: Partial<FreelancerProfile>): Promise<FreelancerProfile> {
    const response = await api.put('/profiles/freelancer/', data);
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