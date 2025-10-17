import axios from 'axios';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'https://neurolancer-plat.onrender.com/api';

export const api = axios.create({ baseURL, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  // TODO: attach bearer token from secure storage
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // TODO: implement refresh token flow
    return Promise.reject(error);
  }
);
