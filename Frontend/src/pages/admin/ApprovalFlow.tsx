import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, X } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

interface ApprovalStep {
  id: string;
  title: string;
  type: "manager" | "specific" | "amount";
  condition?: string;
}

const ApprovalFlow = () => {
  const [steps, setSteps] = useState<ApprovalStep[]>([
    { id: "1", title: "Direct Manager", type: "manager" },
    { id: "2", title: "Amount > $500", type: "amount", condition: "> $500" },
    { id: "3", title: "CFO Approval", type: "specific" },
  ]);

  const removeStep = (id: string) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Approval Flow</h1>
            <p className="mt-1 text-muted-foreground">
              Configure the expense approval workflow
            </p>
          </div>
          <Button className="bg-gradient-primary shadow-glow">
            <Plus className="mr-2 h-4 w-4" />
            Add Step
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="cursor-move border-border bg-card p-6 shadow-md transition-all hover:shadow-lg">
                <div className="flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                    </div>
                    {step.condition && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Condition: {step.condition}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(step.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Card className="border-dashed border-2 border-border bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder approval steps
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApprovalFlow;
