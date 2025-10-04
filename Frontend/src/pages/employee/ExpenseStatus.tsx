import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Clock,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ExpenseStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data
  const expense = {
    id,
    title: "Client Dinner - Luigi's Restaurant",
    amount: 245.50,
    category: "Meals & Entertainment",
    date: "2024-01-15",
    status: "approved" as const,
    description: "Team dinner with potential client to discuss Q2 partnership opportunities and contract details.",
    submittedBy: "John Doe",
    submittedDate: "2024-01-15",
    approvedBy: "Jane Manager",
    approvedDate: "2024-01-16",
    attachments: ["receipt_001.pdf", "menu.jpg"],
  };

  const statusConfig = {
    pending: {
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
    },
    approved: {
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
    },
    rejected: {
      icon: XCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
    },
  };

  const config = statusConfig[expense.status];
  const StatusIcon = config.icon;

  const timeline = [
    {
      title: "Submitted",
      date: expense.submittedDate,
      user: expense.submittedBy,
      completed: true,
    },
    {
      title: "Under Review",
      date: expense.submittedDate,
      user: "Automated System",
      completed: true,
    },
    {
      title: expense.status === "approved" ? "Approved" : expense.status === "rejected" ? "Rejected" : "Pending Approval",
      date: expense.approvedDate || "Pending",
      user: expense.approvedBy || "Awaiting manager",
      completed: expense.status === "approved" || expense.status === "rejected",
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/employee/history")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </Button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{expense.title}</h1>
              <p className="mt-1 text-muted-foreground">Expense Details</p>
            </div>
            <Badge
              variant="outline"
              className={cn("capitalize", config.bg, config.color, config.border)}
            >
              <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
              {expense.status}
            </Badge>
          </div>
        </motion.div>

        {/* Main Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 shadow-lg">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="text-xl font-bold text-foreground">
                      ${expense.amount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <Tag className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <p className="font-semibold text-foreground">{expense.category}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold text-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2">
                    <User className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted By</p>
                    <p className="font-semibold text-foreground">{expense.submittedBy}</p>
                  </div>
                </div>
              </div>
            </div>

            {expense.description && (
              <>
                <Separator className="my-6" />
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Description
                    </p>
                  </div>
                  <p className="text-foreground">{expense.description}</p>
                </div>
              </>
            )}

            {expense.attachments.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <p className="mb-3 text-sm font-medium text-muted-foreground">
                    Attachments
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {expense.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                      >
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Card>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 shadow-lg">
            <h3 className="mb-6 text-lg font-semibold text-foreground">
              Approval Timeline
            </h3>
            <div className="space-y-6">
              {timeline.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2",
                        step.completed
                          ? "border-success bg-success text-success-foreground"
                          : "border-border bg-muted text-muted-foreground"
                      )}
                    >
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    {index < timeline.length - 1 && (
                      <div
                        className={cn(
                          "h-full w-0.5 flex-1 mt-2",
                          step.completed ? "bg-success" : "bg-border"
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-6">
                    <p className="font-semibold text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground">{step.user}</p>
                    <p className="text-xs text-muted-foreground">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ExpenseStatus;
