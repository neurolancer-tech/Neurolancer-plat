import api from './api';

export interface FreelancerProfile {
  id?: number;
  title: string;
  bio: string;
  hourly_rate: number;
  skills: string;
  experience_years: number;
  education: string;
  certifications: string;
  languages: string;
  portfolio_urls: string;
  github_url: string;
  linkedin_url: string;
  website_url: string;
  availability_status: 'available' | 'busy' | 'unavailable';
  rating?: number;
  total_reviews?: number;
  completed_projects?: number;
  total_earnings?: number;
}

export interface ClientProfile {
  id?: number;
  company_name: string;
  company_size: string;
  industry: string;
  company_description: string;
  website_url: string;
  linkedin_url: string;
  project_budget_range: string;
  preferred_project_types: string;
  communication_preferences: string;
  total_projects_posted?: number;
  total_spent?: number;
  active_projects?: number;
}

export const profileApi = {
  // Freelancer Profile
  async getFreelancerProfile(): Promise<FreelancerProfile> {
    const response = await api.get('/profiles/freelancer/');
    return response.data;
  },

  async createFreelancerProfile(data: Partial<FreelancerProfile>): Promise<FreelancerProfile> {
    const response = await api.post('/profiles/freelancer/', data);
    return response.data;
  },

  async updateFreelancerProfile(data: Partial<FreelancerProfile>): Promise<FreelancerProfile> {
    const response = await api.patch('/profiles/freelancer/', data);
    return response.data;
  },

  // Client Profile
  async getClientProfile(): Promise<ClientProfile> {
    const response = await api.get('/profiles/client/');
    return response.data;
  },

  async createClientProfile(data: Partial<ClientProfile>): Promise<ClientProfile> {
    const response = await api.post('/profiles/client/', data);
    return response.data;
  },

  async updateClientProfile(data: Partial<ClientProfile>): Promise<ClientProfile> {
    const response = await api.patch('/profiles/client/', data);
    return response.data;
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