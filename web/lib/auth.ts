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

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  removeAuthToken();
  removeUser();
  removeProfile();
  window.location.href = '/';
};