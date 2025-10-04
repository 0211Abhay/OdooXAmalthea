// Expense Management API Service
import { apiClient } from '../lib/api';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  exchangeRate?: number;
  currency: string;
  expenseDate: string;
  receiptUrl?: string;
  merchantName?: string;
  notes?: string;
  ocrData?: any;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  currentStep: number;
  totalSteps: number;
  submittedAt?: string;
  isReadonly: boolean;
  userId: string;
  companyId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  approvals?: ExpenseApproval[];
}

export interface ExpenseApproval {
  id: string;
  expenseId: string;
  approverId: string;
  step: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  approver: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateExpenseRequest {
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  categoryId: string;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
  merchantName?: string;
}

export interface UpdateExpenseRequest {
  amount?: number;
  originalAmount?: number;
  originalCurrency?: string;
  categoryId?: string;
  description?: string;
  expenseDate?: string;
  receiptUrl?: string;
  merchantName?: string;
}

export interface ExpenseListParams {
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseListResponse {
  data: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ExpenseStats {
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
}

export const expenseService = {
  // Get all expenses with filters
  async getExpenses(params?: ExpenseListParams): Promise<ExpenseListResponse> {
    return apiClient.get<ExpenseListResponse>('/expenses', params);
  },

  // Get expense by ID
  async getExpenseById(id: string): Promise<Expense> {
    return apiClient.get<Expense>(`/expenses/${id}`);
  },

  // Create new expense
  async createExpense(expenseData: CreateExpenseRequest): Promise<Expense> {
    return apiClient.post<Expense>('/expenses', expenseData);
  },

  // Update expense
  async updateExpense(id: string, expenseData: UpdateExpenseRequest): Promise<Expense> {
    return apiClient.patch<Expense>(`/expenses/${id}`, expenseData);
  },

  // Delete expense
  async deleteExpense(id: string): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/expenses/${id}`);
  },

  // Submit expense for approval
  async submitExpense(id: string): Promise<Expense> {
    return apiClient.post<Expense>(`/expenses/${id}/submit`);
  },

  // Approve or reject expense
  async approveRejectExpense(id: string, action: 'APPROVED' | 'REJECTED', comments?: string): Promise<Expense> {
    return apiClient.post<Expense>(`/expenses/${id}/approve`, {
      action,
      comments,
    });
  },

  // Upload receipt
  async uploadReceipt(file: File): Promise<{ receiptUrl: string }> {
    return apiClient.uploadFile<{ receiptUrl: string }>('/expenses/upload-receipt', file);
  },

  // OCR processing
  async processOCR(file: File): Promise<any> {
    return apiClient.uploadFile('/ocr/process', file);
  },

  // Get expense statistics
  async getExpenseStats(): Promise<ExpenseStats> {
    return apiClient.get<ExpenseStats>('/expenses/stats');
  },

  // Get pending approvals (for managers/admins)
  async getPendingApprovals(): Promise<Expense[]> {
    return apiClient.get<Expense[]>('/expenses/pending-approvals');
  },

  // Bulk approve expenses
  async bulkApprove(expenseIds: string[], comments?: string): Promise<{ message: string; updatedCount: number }> {
    return apiClient.post('/expenses/bulk-approve', {
      expenseIds,
      comments,
    });
  },

  // Bulk reject expenses
  async bulkReject(expenseIds: string[], comments?: string): Promise<{ message: string; updatedCount: number }> {
    return apiClient.post('/expenses/bulk-reject', {
      expenseIds,
      comments,
    });
  },
};
