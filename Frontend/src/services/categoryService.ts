// Category Management API Service
import { apiClient } from '../lib/api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  expenseCount?: number;
  totalAmount?: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
}

export interface CategoryListParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CategoryListResponse {
  data: Category[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const categoryService = {
  // Get all categories
  async getCategories(params?: CategoryListParams): Promise<CategoryListResponse> {
    return apiClient.get<CategoryListResponse>('/categories', params);
  },

  // Get category by ID
  async getCategoryById(id: string): Promise<Category> {
    return apiClient.get<Category>(`/categories/${id}`);
  },

  // Create new category
  async createCategory(categoryData: CreateCategoryRequest): Promise<Category> {
    return apiClient.post<Category>('/categories', categoryData);
  },

  // Update category
  async updateCategory(id: string, categoryData: UpdateCategoryRequest): Promise<Category> {
    return apiClient.patch<Category>(`/categories/${id}`, categoryData);
  },

  // Delete category
  async deleteCategory(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/categories/${id}`);
  },

  // Get category statistics
  async getCategoryStats(): Promise<Category[]> {
    return apiClient.get<Category[]>('/categories/stats');
  },
};
