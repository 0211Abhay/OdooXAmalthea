import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpenseCard, Expense } from "@/components/ui/expense-card";
import { motion } from "framer-motion";

const TeamExpenses = () => {
  const teamExpenses: Expense[] = [
    {
      id: "1",
      title: "Client Dinner - Luigi's Restaurant",
      amount: 245.50,
      category: "Meals & Entertainment",
      date: "2024-01-15",
      status: "approved",
      description: "Team dinner with potential client",
    },
    {
      id: "2",
      title: "Flight to NYC - Business Conference",
      amount: 580.00,
      category: "Travel",
      date: "2024-01-12",
      status: "pending",
    },
    {
      id: "3",
      title: "Office Supplies - Staples",
      amount: 127.35,
      category: "Office Supplies",
      date: "2024-01-10",
      status: "approved",
    },
  ];

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
          {teamExpenses.map((expense, index) => (
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

export default TeamExpenses;
