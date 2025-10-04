import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpenseCard, Expense } from "@/components/ui/expense-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ExpenseHistory = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data
  const expenses: Expense[] = [
    {
      id: "1",
      title: "Client Dinner - Luigi's Restaurant",
      amount: 245.50,
      category: "Meals & Entertainment",
      date: "2024-01-15",
      status: "approved",
      description: "Team dinner with potential client to discuss Q2 partnership",
    },
    {
      id: "2",
      title: "Flight to NYC - Business Conference",
      amount: 580.00,
      category: "Travel",
      date: "2024-01-12",
      status: "pending",
      description: "Round trip for annual tech conference",
    },
    {
      id: "3",
      title: "Office Supplies - Staples",
      amount: 127.35,
      category: "Office Supplies",
      date: "2024-01-10",
      status: "approved",
    },
    {
      id: "4",
      title: "Adobe Creative Cloud Subscription",
      amount: 54.99,
      category: "Software",
      date: "2024-01-08",
      status: "rejected",
      description: "Monthly subscription renewal",
    },
    {
      id: "5",
      title: "Team Lunch - Pizza Place",
      amount: 89.20,
      category: "Meals & Entertainment",
      date: "2024-01-05",
      status: "pending",
    },
  ];

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || expense.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Expense List */}
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center"
            >
              <p className="text-lg font-medium text-muted-foreground">
                No expenses found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters or submit a new expense
              </p>
            </motion.div>
          ) : (
            filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ExpenseCard
                  expense={expense}
                  onView={(id) => navigate(`/employee/status/${id}`)}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExpenseHistory;
