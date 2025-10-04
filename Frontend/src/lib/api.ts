// API configuration and utilities
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: {
    method?: string;
    headers?: HeadersInit;
    body?: BodyInit;
  } = {}
): Promise<T> {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {};
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const config: RequestInit = {
    method: options.method || "GET",
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API call failed: ${response.status}`);
  }

  return response.json();
}

// API functions
export const api = {
  // Authentication
  login: (credentials: LoginCredentials) =>
    apiCall<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  signup: (data: SignupData) =>
    apiCall<AuthResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Categories
  getCategories: () => apiCall<Category[]>("/categories"),

  // Expenses
  getExpenses: (params?: ExpenseFilters) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }
    const query = searchParams.toString();
    return apiCall<ExpenseResponse>(`/expenses${query ? `?${query}` : ""}`);
  },

  getExpenseById: (id: string) => apiCall<Expense>(`/expenses/${id}`),

  createExpense: (expense: CreateExpenseData) =>
    apiCall<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    }),

  uploadReceipt: (expenseId: string, file: File) => {
    const formData = new FormData();
    formData.append("receipt", file);
    return apiCall<{ message: string; receiptUrl: string }>(
      `/expenses/${expenseId}/upload-receipt`,
      {
        method: "POST",
        body: formData,
      }
    );
  },

  approveExpense: (expenseId: string, data: ApprovalData) =>
    apiCall<{ message: string }>(`/expenses/${expenseId}/approve`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  submitExpense: (expenseId: string) =>
    apiCall<Expense>(`/expenses/${expenseId}/submit`, {
      method: "POST",
    }),

  getPendingApprovals: () => apiCall<PendingApproval[]>("/expenses/pending/approvals"),

  getDashboardStats: (timeframe?: string) => {
    const query = timeframe ? `?timeframe=${timeframe}` : "";
    return apiCall<DashboardStats>(`/expenses/stats/dashboard${query}`);
  },

  getCategoryStats: (timeframe?: string) => {
    const query = timeframe ? `?timeframe=${timeframe}` : "";
    return apiCall<CategoryStat[]>(`/expenses/stats/categories${query}`);
  },

  // Users
  getUsers: () => apiCall<User[]>("/users"),

  createUser: (userData: CreateUserData) =>
    apiCall<User>("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  updateUser: (userId: string, userData: Partial<CreateUserData>) =>
    apiCall<User>(`/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

  deleteUser: (userId: string) =>
    apiCall<{ message: string }>(`/users/${userId}`, {
      method: "DELETE",
    }),

  // Company
  getCompany: () => apiCall<Company>("/company"),

  updateCompany: (data: Partial<UpdateCompanyData>) =>
    apiCall<Company>("/company", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Approval Rules
  getApprovalRules: () => apiCall<ApprovalRule[]>("/approval-rules"),

  createApprovalRule: (ruleData: CreateApprovalRuleData) =>
    apiCall<ApprovalRule>("/approval-rules", {
      method: "POST",
      body: JSON.stringify(ruleData),
    }),

  updateApprovalRule: (ruleId: string, ruleData: Partial<CreateApprovalRuleData>) =>
    apiCall<ApprovalRule>(`/approval-rules/${ruleId}`, {
      method: "PUT",
      body: JSON.stringify(ruleData),
    }),

  deleteApprovalRule: (ruleId: string) =>
    apiCall<{ message: string }>(`/approval-rules/${ruleId}`, {
      method: "DELETE",
    }),

  // Utilities
  getCurrencies: () => apiCall<Currency[]>("/utils/currencies"),
  getCountries: () => apiCall<Country[]>("/utils/countries"),

  // OCR
  processOCR: (file: File) => {
    const formData = new FormData();
    formData.append("receipt", file);
    return apiCall<{
      expense: Expense;
      ocrData: OCRData;
      message: string;
    }>("/ocr/upload-receipt", {
      method: "POST",
      body: formData,
    });
  },
};

// Type definitions
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  name: string;
  password: string;
  companyName: string;
  country: string;
  currency: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  company: Company;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  companyId: string;
  isApprover: boolean;
  approverLevel?: number;
}

export interface Company {
  id: string;
  name: string;
  country: string;
  currency: string;
  sequentialApproval: boolean;
  minimumApprovalPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  amount: number;
  originalAmount?: number;
  originalCurrency?: string;
  categoryId: string;
  description: string;
  expenseDate: string;
  notes?: string;
  merchantName?: string;
}

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
  status: "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
  currentStep: number;
  totalSteps: number;
  submittedAt?: string;
  isReadonly: boolean;
  userId: string;
  companyId: string;
  categoryId?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  category?: Category;
  approvals?: ExpenseApproval[];
}

export interface ExpenseApproval {
  id: string;
  expenseId: string;
  approverId: string;
  step: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments?: string;
  approvedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  approver: {
    id: string;
    name: string;
    role: string;
  };
}

export interface ExpenseFilters {
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseResponse {
  expenses: Expense[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ApprovalData {
  action: "APPROVED" | "REJECTED";
  comments?: string;
}

export interface PendingApproval {
  id: string;
  expenseId: string;
  approverId: string;
  step: number;
  status: "PENDING";
  createdAt: string;
  expense: Expense & {
    displayAmount?: number;
    displayCurrency?: string;
  };
}

export interface DashboardStats {
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  totalAmount: number;
  pendingApprovals: number;
}

export interface CategoryStat {
  category: string;
  amount: number;
  count: number;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  isApprover?: boolean;
  approverLevel?: number;
}

export interface UpdateCompanyData {
  name?: string;
  country?: string;
  currency?: string;
  sequentialApproval?: boolean;
  minimumApprovalPercent?: number;
}

export interface ApprovalRule {
  id: string;
  name: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  categoryIds: string[];
  isActive: boolean;
  companyId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  steps: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  ruleId: string;
  userId: string;
  step: number;
  createdAt: string;
}

export interface CreateApprovalRuleData {
  name: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  categoryIds: string[];
  steps: Array<{
    userId: string;
    step: number;
  }>;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface OCRData {
  totalAmount?: number;
  merchantName?: string;
  date?: string;
  currency?: string;
  confidence?: number;
  items?: Array<{ description: string; amount: number }>;
}
