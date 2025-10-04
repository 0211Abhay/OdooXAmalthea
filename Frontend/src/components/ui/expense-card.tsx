import { motion } from "framer-motion";
import { Calendar, DollarSign, FileText, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: "pending" | "approved" | "rejected";
  description?: string;
}

interface ExpenseCardProps {
  expense: Expense;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ExpenseCard = ({ expense, onView, onEdit, onDelete }: ExpenseCardProps) => {
  const statusStyles = {
    pending: "bg-warning/10 text-warning border-warning/20",
    approved: "bg-success/10 text-success border-success/20",
    rejected: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="overflow-hidden border-border bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-foreground">{expense.title}</h3>
                <Badge
                  variant="outline"
                  className={cn("capitalize", statusStyles[expense.status])}
                >
                  {expense.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-medium">${expense.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4" />
                  <span>{expense.category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(expense.date).toLocaleDateString()}</span>
                </div>
              </div>

              {expense.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {expense.description}
                </p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50 bg-popover">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(expense.id)}>
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(expense.id)}>
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(expense.id)}
                    className="text-destructive"
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
