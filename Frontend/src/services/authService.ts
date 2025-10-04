// Authentication API Service
import { apiClient } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  companyId: string;
  country?: string;
  currency?: string;
  isActive: boolean;
  isApprover?: boolean;
  approverLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  sequentialApproval: boolean;
  minimumApprovalPercent: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  companyName: string;
  country?: string;
  currency?: string;
  role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  company?: Company;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.token) {
      apiClient.setToken(response.token);
      localStorage.setItem('authToken', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem('company', JSON.stringify(response.company));
      }
    }
    
    return response;
  },

  async signup(userData: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/signup', userData);
    
    if (response.token) {
      apiClient.setToken(response.token);
      localStorage.setItem('authToken', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem('company', JSON.stringify(response.company));
      }
    }
    
    return response;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with local cleanup even if API call fails
      console.error('Logout API call failed:', error);
    }
    
    apiClient.clearToken();
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  },

  getStoredCompany(): Company | null {
    try {
      const companyStr = localStorage.getItem('company');
      return companyStr ? JSON.parse(companyStr) : null;
    } catch (error) {
      console.error('Error parsing stored company:', error);
      return null;
    }
  },

  getStoredToken(): string | null {
    return localStorage.getItem('authToken');
  },

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });

    if (response.token) {
      apiClient.setToken(response.token);
      localStorage.setItem('authToken', response.token);
      if (response.refreshToken) {
        localStorage.setItem('refreshToken', response.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      if (response.company) {
        localStorage.setItem('company', JSON.stringify(response.company));
      }
    }

    return response;
  },
};
