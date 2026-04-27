/**
 * API Client - Axios-based HTTP client with interceptors
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { logger } from '../utils/logger';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  client.interceptors.request.use(
    config => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      logger.debug('API Request:', { method: config.method, url: config.url });
      return config;
    },
    error => {
      logger.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    response => {
      logger.debug('API Response:', { status: response.status, url: response.config.url });
      return response;
    },
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Handle unauthorized
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }

      logger.error('API Error:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url,
      });

      return Promise.reject(error);
    }
  );

  return client;
};

export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await createApiClient().get<T>(url);
    return response.data;
  },

  async post<T>(url: string, data: any): Promise<T> {
    const response = await createApiClient().post<T>(url, data);
    return response.data;
  },

  async put<T>(url: string, data: any): Promise<T> {
    const response = await createApiClient().put<T>(url, data);
    return response.data;
  },

  async delete<T = void>(url: string): Promise<T> {
    const response = await createApiClient().delete<T>(url);
    return response.data as T;
  },

  async patch<T>(url: string, data: any): Promise<T> {
    const response = await createApiClient().patch<T>(url, data);
    return response.data;
  },
};

export default apiClient;
