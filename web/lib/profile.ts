import api from './api';

export interface ProfileData {
  phone_number?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  skills?: string;
  experience_level?: 'entry' | 'intermediate' | 'expert';
  hourly_rate?: number;
  availability?: 'full-time' | 'part-time' | 'contract' | 'freelance';
  bio?: string;
  date_of_birth?: string;
  phone_verified?: boolean;
  profile_completed?: boolean;
}

export const completeProfile = async (profileData: ProfileData) => {
  try {
    const response = await api.post('/auth/complete-profile/', profileData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const sendPhoneVerification = async (phoneNumber: string) => {
  try {
    const response = await api.post('/auth/send-phone-verification/', {
      phone_number: phoneNumber
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const verifyPhoneNumber = async (code: string) => {
  try {
    const response = await api.post('/auth/verify-phone/', {
      code: code
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/profile/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (profileData: Partial<ProfileData>) => {
  try {
    const response = await api.patch('/auth/profile/', profileData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const validateProfileCompletion = (profile: any): boolean => {
  const requiredFields = [
    'phone',
    'country', 
    'city',
    'experience_level'
  ];
  
  return requiredFields.every(field => profile[field] && profile[field] !== '');
};

export const getProfileCompletionPercentage = (profile: any): number => {
  const allFields = [
    'phone',
    'country',
    'state', 
    'city',
    'skills',
    'experience_level',
    'bio',
    'hourly_rate'
  ];
  
  const completedFields = allFields.filter(field => 
    profile[field] && profile[field] !== ''
  );
  
  return Math.round((completedFields.length / allFields.length) * 100);
};