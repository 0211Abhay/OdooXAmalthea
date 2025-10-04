import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpenseCard, Expense } from "@/components/ui/expense-card";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const TeamExpenses = () => {
  const [teamExpenses, setTeamExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamExpenses();
  }, []);

  const fetchTeamExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.getExpenses();
      setTeamExpenses(response.expenses);
    } catch (error) {
      console.error("Failed to fetch team expenses:", error);
      toast.error("Failed to load team expenses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Expenses</h1>
          <p className="mt-1 text-muted-foreground">
            All expenses submitted by your team members
          </p>
        </div>

        <div className="space-y-4">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center"
            >
              <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                Loading team expenses...
              </p>
            </motion.div>
          ) : teamExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center"
            >
              <p className="text-lg font-medium text-muted-foreground">
                No team expenses found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Team members haven't submitted any expenses yet
              </p>
            </motion.div>
          ) : (
            teamExpenses.map((expense, index) => {
              const expenseCard: Expense = {
                id: expense.id,
                title: expense.description,
                amount: expense.amount,
                category: expense.category?.name || "Other",
                date: expense.expenseDate,
                status: expense.status.toLowerCase(),
                description: expense.notes || expense.description
              };

              return (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ExpenseCard expense={expenseCard} />
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TeamExpenses;
