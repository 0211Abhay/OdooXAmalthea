// User Management API Service
import { apiClient } from '../lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  isActive: boolean;
  companyId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  salary?: number;
  joinDate?: string;
  country?: string;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  salary?: number;
  joinDate?: string;
  country?: string;
  currency?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  isActive?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  salary?: number;
  joinDate?: string;
  country?: string;
  currency?: string;
}

export interface UserListParams {
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  employees: number;
  managers: number;
  admins: number;
  averageSalary: number;
  totalSalary: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const userService = {
  // Get all users
  async getUsers(params?: UserListParams): Promise<UserListResponse> {
    return apiClient.get<UserListResponse>('/users', params);
  },

  // Get user by ID
  async getUserById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  // Get current user profile
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
  },

  // Update current user profile
  async updateProfile(userData: Partial<UpdateUserRequest>): Promise<User> {
    return apiClient.patch<User>('/users/me', userData);
  },

  // Create new user (admin only)
  async createUser(userData: CreateUserRequest): Promise<User> {
    return apiClient.post<User>('/users', userData);
  },

  // Update user (admin only)
  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    return apiClient.patch<User>(`/users/${id}`, userData);
  },

  // Delete user (admin only)
  async deleteUser(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/users/${id}`);
  },

  // Activate/Deactivate user
  async toggleUserStatus(id: string): Promise<User> {
    return apiClient.patch<User>(`/users/${id}/toggle-status`);
  },

  // Change password
  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>('/users/change-password', passwordData);
  },

  // Get user statistics (admin/manager only)
  async getUserStats(): Promise<UserStats> {
    return apiClient.get<UserStats>('/users/stats');
  },

  // Get employees under manager
  async getEmployees(): Promise<User[]> {
    return apiClient.get<User[]>('/users/employees');
  },

  // Bulk update users (admin only)
  async bulkUpdate(userIds: string[], updateData: Partial<UpdateUserRequest>): Promise<{ message: string; updatedCount: number }> {
    return apiClient.patch('/users/bulk-update', {
      userIds,
      updateData,
    });
  },

  // Bulk activate/deactivate users (admin only)
  async bulkToggleStatus(userIds: string[], isActive: boolean): Promise<{ message: string; updatedCount: number }> {
    return apiClient.patch('/users/bulk-toggle-status', {
      userIds,
      isActive,
    });
  },
};
