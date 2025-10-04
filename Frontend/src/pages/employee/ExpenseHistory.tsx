import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Calendar, DollarSign, Eye } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, Expense, Category } from "@/lib/api";

const ExpenseHistory = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, [currentPage, statusFilter, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 10,
      };

      if (statusFilter && statusFilter !== "all") params.status = statusFilter;
      if (categoryFilter && categoryFilter !== "all") params.category = categoryFilter;

      const response = await api.getExpenses(params);
      setExpenses(response.expenses);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const categoriesData = await api.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="outline">In Progress</Badge>;
      case "APPROVED":
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.merchantName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Expense History</h1>
            <p className="mt-1 text-muted-foreground">
              View and manage your submitted expenses
            </p>
          </div>
          <Button
            onClick={() => navigate("/employee/submit-expense")}
            className="bg-gradient-primary shadow-glow"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter("all");
                  setCategoryFilter("all");
                  setSearchTerm("");
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Expense List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Card key={index} className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ))
          ) : filteredExpenses.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No expenses found</p>
            </Card>
          ) : (
            filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {expense.description}
                        </h3>
                        {getStatusBadge(expense.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>${expense.amount.toFixed(2)} {expense.currency}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(expense.expenseDate).toLocaleDateString()}</span>
                        </div>
                        {expense.category && (
                          <div className="flex items-center gap-1">
                            <span className="inline-block w-2 h-2 bg-primary rounded-full"></span>
                            <span>{expense.category.name}</span>
                          </div>
                        )}
                      </div>

                      {expense.merchantName && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Merchant: {expense.merchantName}
                        </p>
                      )}

                      {expense.notes && (
                        <p className="mt-2 text-sm text-foreground">
                          {expense.notes}
                        </p>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">
                        Submitted: {new Date(expense.createdAt).toLocaleDateString()}
                        {expense.submittedAt && (
                          <span className="ml-4">
                            Status updated: {new Date(expense.submittedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {expense.receiptUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`http://localhost:5000${expense.receiptUrl}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Receipt
                        </Button>
                      )}
                      
                      {expense.approvals && expense.approvals.length > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            Step {expense.currentStep} of {expense.totalSteps}
                          </p>
                          <div className="mt-1">
                            {expense.approvals.map((approval, idx) => (
                              <div key={approval.id} className="text-xs">
                                {approval.approver.name}: {approval.status}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-2"
          >
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExpenseHistory;
