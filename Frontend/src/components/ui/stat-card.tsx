import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "accent";
}

export const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
}: StatCardProps) => {
  const variantStyles = {
    default: "from-primary/10 to-primary/5",
    success: "from-success/10 to-success/5",
    warning: "from-warning/10 to-warning/5",
    accent: "from-accent/10 to-accent/5",
  };

  const iconStyles = {
    default: "bg-primary text-primary-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    accent: "bg-accent text-accent-foreground",
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="relative overflow-hidden border-border bg-gradient-to-br shadow-md">
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50", variantStyles[variant])} />
        
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      trend.isPositive ? "text-success" : "text-destructive"
                    )}
                  >
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              )}
            </div>
            
            <div className={cn("rounded-lg p-3 shadow-sm", iconStyles[variant])}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
