import Cookies from 'js-cookie';
import { User, UserProfile } from '../types';

export const getAuthToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get('authToken');
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  Cookies.set('authToken', token, { expires: 7 });
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  Cookies.remove('authToken');
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = Cookies.get('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  Cookies.set('user', JSON.stringify(user), { expires: 7 });
};

export const removeUser = (): void => {
  if (typeof window === 'undefined') return;
  Cookies.remove('user');
};

export const getProfile = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  const profileStr = Cookies.get('profile');
  return profileStr ? JSON.parse(profileStr) : null;
};

export const setProfile = (profile: UserProfile): void => {
  if (typeof window === 'undefined') return;
  Cookies.set('profile', JSON.stringify(profile), { expires: 7 });
};

export const removeProfile = (): void => {
  if (typeof window === 'undefined') return;
  Cookies.remove('profile');
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!getAuthToken() && !!getUser();
};

export const updateProfile = (profileData: Partial<UserProfile>): void => {
  if (typeof window === 'undefined') return;
  const currentProfile = getProfile();
  if (currentProfile) {
    const updatedProfile = { ...currentProfile, ...profileData };
    setProfile(updatedProfile);
  }
};

export const markProfileAsCompleted = (): void => {
  if (typeof window === 'undefined') return;
  const currentProfile = getProfile();
  if (currentProfile) {
    const updatedProfile = { ...currentProfile, profile_completed: true };
    setProfile(updatedProfile);
  }
};

export const isProfileComplete = (): boolean => {
  if (typeof window === 'undefined') return false;
  const profile = getProfile();
  if (!profile) return false;
  
  // If profile_completed is explicitly set to true, consider it complete
  if (profile.profile_completed === true) {
    return true;
  }
  
  // Check if essential profile fields are filled
  const requiredFields = [
    'phone_number',
    'country', 
    'phone_verified'
  ];
  
  return requiredFields.every(field => {
    const value = profile[field as keyof UserProfile];
    return value !== null && value !== undefined && value !== '';
  }) && profile.phone_verified === true;
};

export const needsProfileCompletion = (): boolean => {
  if (typeof window === 'undefined') return false;
  const profile = getProfile();
  if (!profile) return false;
  
  // Only show profile completion for users who haven't completed it yet
  // AND haven't explicitly marked it as completed
  return profile.profile_completed !== true && !isProfileComplete();
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  removeAuthToken();
  removeUser();
  removeProfile();
  window.location.href = '/';
};