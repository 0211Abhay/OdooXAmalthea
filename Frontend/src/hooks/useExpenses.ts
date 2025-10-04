// Expense Management Hook
import { useState, useEffect, useCallback } from 'react';
import { expenseService, type Expense, type ExpenseListParams, type CreateExpenseRequest, type UpdateExpenseRequest } from '../services/expenseService';
import { toast } from 'sonner';

export interface UseExpensesResult {
  expenses: Expense[];
  totalExpenses: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchExpenses: (params?: ExpenseListParams) => Promise<void>;
  createExpense: (expenseData: CreateExpenseRequest, file?: File) => Promise<Expense | null>;
  updateExpense: (id: string, expenseData: UpdateExpenseRequest) => Promise<Expense | null>;
  deleteExpense: (id: string) => Promise<boolean>;
  submitExpense: (id: string) => Promise<boolean>;
  approveExpense: (id: string, comments?: string) => Promise<boolean>;
  rejectExpense: (id: string, comments?: string) => Promise<boolean>;
  
  // Pagination
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Filters
  setFilters: (filters: Partial<ExpenseListParams>) => void;
  clearFilters: () => void;
}

export const useExpenses = (initialParams?: ExpenseListParams): UseExpensesResult => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ExpenseListParams>(initialParams || {});

  const fetchExpenses = useCallback(async (params?: ExpenseListParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = { ...filters, ...params };
      const response = await expenseService.getExpenses(queryParams);
      
      setExpenses(response.data);
      setTotalExpenses(response.total);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch expenses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createExpense = async (expenseData: CreateExpenseRequest, file?: File): Promise<Expense | null> => {
    setLoading(true);
    setError(null);
    
    try {
      let receiptUrl;
      
      // Upload receipt if file provided
      if (file) {
        const uploadResponse = await expenseService.uploadReceipt(file);
        receiptUrl = uploadResponse.receiptUrl;
      }
      
      const newExpense = await expenseService.createExpense({
        ...expenseData,
        receiptUrl,
      });
      
      // Refresh the expenses list
      await fetchExpenses();
      
      toast.success('Expense created successfully');
      return newExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create expense';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateExpense = async (id: string, expenseData: UpdateExpenseRequest): Promise<Expense | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedExpense = await expenseService.updateExpense(id, expenseData);
      
      // Update the expense in the local list
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? updatedExpense : expense
      ));
      
      toast.success('Expense updated successfully');
      return updatedExpense;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      await expenseService.deleteExpense(id);
      
      // Remove the expense from the local list
      setExpenses(prev => prev.filter(expense => expense.id !== id));
      setTotalExpenses(prev => prev - 1);
      
      toast.success('Expense deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitExpense = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedExpense = await expenseService.submitExpense(id);
      
      // Update the expense in the local list
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? updatedExpense : expense
      ));
      
      toast.success('Expense submitted for approval');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit expense';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const approveExpense = async (id: string, comments?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedExpense = await expenseService.approveRejectExpense(id, 'APPROVED', comments);
      
      // Update the expense in the local list
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? updatedExpense : expense
      ));
      
      toast.success('Expense approved successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve expense';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectExpense = async (id: string, comments?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedExpense = await expenseService.approveRejectExpense(id, 'REJECTED', comments);
      
      // Update the expense in the local list
      setExpenses(prev => prev.map(expense => 
        expense.id === id ? updatedExpense : expense
      ));
      
      toast.success('Expense rejected');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject expense';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Pagination methods
  const nextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      fetchExpenses({ ...filters, page: newPage });
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchExpenses({ ...filters, page: newPage });
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchExpenses({ ...filters, page });
    }
  };

  // Filter methods
  const setFilters = (newFilters: Partial<ExpenseListParams>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFiltersState(updatedFilters);
    setCurrentPage(1);
    fetchExpenses(updatedFilters);
  };

  const clearFilters = () => {
    setFiltersState({});
    setCurrentPage(1);
    fetchExpenses({});
  };

  // Initial fetch
  useEffect(() => {
    fetchExpenses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    expenses,
    totalExpenses,
    currentPage,
    totalPages,
    loading,
    error,
    
    // Actions
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    submitExpense,
    approveExpense,
    rejectExpense,
    
    // Pagination
    nextPage,
    prevPage,
    goToPage,
    
    // Filters
    setFilters,
    clearFilters,
  };
};
