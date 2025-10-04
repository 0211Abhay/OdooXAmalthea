import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, MessageSquare, Loader2 } from "lucide-react";
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
import { api } from "@/lib/api";

const PendingApprovals = () => {
  const navigate = useNavigate();
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const approvals = await api.getPendingApprovals();
      setPendingApprovals(approvals);
    } catch (error) {
      console.error("Failed to fetch pending approvals:", error);
      toast.error("Failed to load pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedExpense) return;
    
    setIsProcessing(true);
    try {
      // Use the expense-based approval endpoint
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
      const response = await fetch(`${API_BASE_URL}/expenses/${selectedExpense}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: "APPROVED",
          comments: comment.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve expense');
      }
      
      toast.success("Expense approved successfully!");
      setIsApproveDialogOpen(false);
      setComment("");
      setSelectedExpense(null);
      
      // Refresh the list
      await fetchPendingApprovals();
    } catch (error: any) {
      console.error("Approval error:", error);
      toast.error(error?.message || "Failed to approve expense");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExpense || !comment.trim()) return;
    
    setIsProcessing(true);
    try {
      // Use the expense-based approval endpoint
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
      const response = await fetch(`${API_BASE_URL}/expenses/${selectedExpense}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: "REJECTED",
          comments: comment.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject expense');
      }
      
      toast.success("Expense rejected");
      setIsRejectDialogOpen(false);
      setComment("");
      setSelectedExpense(null);
      
      // Refresh the list
      await fetchPendingApprovals();
    } catch (error: any) {
      console.error("Rejection error:", error);
      toast.error(error?.message || "Failed to reject expense");
    } finally {
      setIsProcessing(false);
    }
  };

  const openApproveDialog = (approvalId: string) => {
    // Find the approval to get the expense ID
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (approval) {
      setSelectedExpense(approval.expense.id);
      setIsApproveDialogOpen(true);
    }
  };

  const openRejectDialog = (approvalId: string) => {
    // Find the approval to get the expense ID
    const approval = pendingApprovals.find(a => a.id === approvalId);
    if (approval) {
      setSelectedExpense(approval.expense.id);
      setIsRejectDialogOpen(true);
    }
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
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-lg border border-dashed border-border bg-muted/20 p-12 text-center"
            >
              <Loader2 className="mx-auto h-12 w-12 text-muted-foreground animate-spin" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                Loading pending approvals...
              </p>
            </motion.div>
          ) : pendingApprovals.length === 0 ? (
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
            pendingApprovals.map((approval, index) => {
              const expense = approval.expense;
              const expenseCard: Expense = {
                id: expense.id,
                title: expense.description,
                amount: approval.expense.displayAmount || expense.amount,
                category: expense.category?.name || "Other",
                date: expense.expenseDate,
                status: "pending",
                description: expense.notes || expense.description
              };

              return (
                <motion.div
                  key={approval.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Submitted by:</span>
                        <span className="font-medium">{expense.user.name}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Email:</span>
                        <span className="text-sm">{expense.user.email}</span>
                      </div>
                    </div>
                    <ExpenseCard expense={expenseCard} />
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
                        onClick={() => openRejectDialog(approval.id)}
                        variant="outline"
                        className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => openApproveDialog(approval.id)}
                        className="flex-1 bg-gradient-accent"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
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
              <Button 
                variant="outline" 
                onClick={() => setIsApproveDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleApprove} 
                className="bg-gradient-accent"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve"
                )}
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
              <Button 
                variant="outline" 
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                disabled={!comment.trim() || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default PendingApprovals;
