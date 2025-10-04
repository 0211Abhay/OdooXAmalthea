import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Clock, CheckCircle, BarChart3 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const Dashboard = () => {
  const { user } = useAuth();

  const expenseData = [
    { month: "Jan", amount: 4500 },
    { month: "Feb", amount: 5200 },
    { month: "Mar", amount: 4800 },
    { month: "Apr", amount: 6100 },
    { month: "May", amount: 5500 },
    { month: "Jun", amount: 7200 },
  ];

  const categoryData = [
    { category: "Travel", amount: 12500 },
    { category: "Meals", amount: 8300 },
    { category: "Supplies", amount: 5600 },
    { category: "Software", amount: 9200 },
  ];

  const stats = [
    {
      title: "Total Expenses",
      value: "$35,420",
      icon: DollarSign,
      trend: { value: 12.5, isPositive: true },
      variant: "default" as const,
    },
    {
      title: "Pending Approvals",
      value: "8",
      icon: Clock,
      description: "Awaiting review",
      variant: "warning" as const,
    },
    {
      title: "Approved This Month",
      value: "24",
      icon: CheckCircle,
      trend: { value: 8.3, isPositive: true },
      variant: "success" as const,
    },
    {
      title: "Average Expense",
      value: "$1,476",
      icon: TrendingUp,
      trend: { value: 3.2, isPositive: false },
      variant: "accent" as const,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Overview of your expense activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <StatCard {...stat} />
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 shadow-md">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Monthly Expenses
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={expenseData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 shadow-md">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                <h3 className="text-lg font-semibold text-foreground">
                  Expenses by Category
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="category" className="text-xs text-muted-foreground" />
                  <YAxis className="text-xs text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Role-specific message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-l-4 border-l-primary bg-primary/5 p-6">
            <h3 className="font-semibold text-foreground">
              {user?.role === "admin" && "Admin Dashboard"}
              {user?.role === "manager" && "Manager Dashboard"}
              {user?.role === "employee" && "Employee Dashboard"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {user?.role === "admin" &&
                "Manage users, configure approval flows, and oversee all company expenses."}
              {user?.role === "manager" &&
                "Review and approve team expenses, track team spending, and manage approvals."}
              {user?.role === "employee" &&
                "Submit expenses, track reimbursements, and view your expense history."}
            </p>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
