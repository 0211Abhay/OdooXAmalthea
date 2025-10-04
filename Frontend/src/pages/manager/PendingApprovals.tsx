import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpenseCard, Expense } from "@/components/ui/expense-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PendingApprovals = () => {
  const navigate = useNavigate();
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [comment, setComment] = useState("");

  const pendingExpenses: Expense[] = [
    {
      id: "1",
      title: "Flight to NYC - Business Conference",
      amount: 580.00,
      category: "Travel",
      date: "2024-01-12",
      status: "pending",
      description: "Round trip for annual tech conference",
    },
    {
      id: "2",
      title: "Team Lunch - Pizza Place",
      amount: 89.20,
      category: "Meals & Entertainment",
      date: "2024-01-05",
      status: "pending",
    },
    {
      id: "3",
      title: "New Laptop for Development",
      amount: 1899.00,
      category: "Equipment",
      date: "2024-01-03",
      status: "pending",
      description: "MacBook Pro 16-inch for software development team",
    },
  ];

  const handleApprove = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Expense approved successfully!");
    setIsApproveDialogOpen(false);
    setComment("");
  };

  const handleReject = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.error("Expense rejected");
    setIsRejectDialogOpen(false);
    setComment("");
  };

  const openApproveDialog = (id: string) => {
    setSelectedExpense(id);
    setIsApproveDialogOpen(true);
  };

  const openRejectDialog = (id: string) => {
    setSelectedExpense(id);
    setIsRejectDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pending Approvals</h1>
          <p className="mt-1 text-muted-foreground">
            Review and approve team expense submissions
          </p>
        </div>

        <div className="space-y-4">
          {pendingExpenses.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center"
            >
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                All caught up!
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                No pending approvals at the moment
              </p>
            </motion.div>
          ) : (
            pendingExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                  <ExpenseCard expense={expense} />
                  <div className="mt-4 flex gap-3">
                    <Button
                      onClick={() => navigate(`/manager/expense/${expense.id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      onClick={() => openRejectDialog(expense.id)}
                      variant="outline"
                      className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => openApproveDialog(expense.id)}
                      className="flex-1 bg-gradient-accent"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Approve Dialog */}
        <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Approve Expense</DialogTitle>
              <DialogDescription>
                Add an optional comment for this approval
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approve-comment">Comment (Optional)</Label>
                <Textarea
                  id="approve-comment"
                  placeholder="Add a note..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} className="bg-gradient-accent">
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Reject Expense</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejection
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reject-comment">Reason for Rejection</Label>
                <Textarea
                  id="reject-comment"
                  placeholder="Explain why this expense cannot be approved..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                disabled={!comment.trim()}
              >
                Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PendingApprovals;
