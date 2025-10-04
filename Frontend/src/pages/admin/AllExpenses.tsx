import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpenseCard, Expense } from "@/components/ui/expense-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search, Download } from "lucide-react";
import { useState } from "react";

const AllExpenses = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const expenses: Expense[] = [
    {
      id: "1",
      title: "Client Dinner - Luigi's Restaurant",
      amount: 245.50,
      category: "Meals & Entertainment",
      date: "2024-01-15",
      status: "approved",
    },
    {
      id: "2",
      title: "Flight to NYC",
      amount: 580.00,
      category: "Travel",
      date: "2024-01-12",
      status: "pending",
    },
    {
      id: "3",
      title: "Office Supplies",
      amount: 127.35,
      category: "Office Supplies",
      date: "2024-01-10",
      status: "approved",
    },
    {
      id: "4",
      title: "Software Subscription",
      amount: 54.99,
      category: "Software",
      date: "2024-01-08",
      status: "rejected",
    },
  ];

  const filteredExpenses = expenses.filter((expense) =>
    expense.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Expenses</h1>
            <p className="mt-1 text-muted-foreground">
              Company-wide expense overview
            </p>
          </div>
          <Button className="bg-gradient-accent">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-4">
          {filteredExpenses.map((expense, index) => (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ExpenseCard expense={expense} />
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AllExpenses;
