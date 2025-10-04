import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { Save, Settings2 } from "lucide-react";
import { toast } from "sonner";

const Rules = () => {
  const handleSave = () => {
    toast.success("Rules updated successfully!");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Approval Rules</h1>
            <p className="mt-1 text-muted-foreground">
              Configure automatic approval rules and thresholds
            </p>
          </div>
          <Button onClick={handleSave} className="bg-gradient-primary shadow-glow">
            <Save className="mr-2 h-4 w-4" />
            Save Rules
          </Button>
        </div>

        <div className="space-y-6">
          {/* Auto-Approval Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-6 shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Auto-Approval Rules
                </h2>
              </div>
              <Separator className="mb-6" />
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Auto-Approval</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve expenses below threshold
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Auto-Approval Threshold ($)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    defaultValue="100"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Expenses below this amount will be auto-approved
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Amount-Based Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold text-foreground">
                  Amount-Based Approval
                </h2>
              </div>
              <Separator className="mb-6" />
              
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Manager Approval Limit ($)</Label>
                    <Input type="number" defaultValue="1000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Director Approval Limit ($)</Label>
                    <Input type="number" defaultValue="5000" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Expenses exceeding these amounts require additional approval levels
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Category Rules */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-warning" />
                <h2 className="text-xl font-semibold text-foreground">
                  Category-Specific Rules
                </h2>
              </div>
              <Separator className="mb-6" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                  <div>
                    <p className="font-medium text-foreground">Travel Expenses</p>
                    <p className="text-sm text-muted-foreground">
                      Require receipt attachment
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                  <div>
                    <p className="font-medium text-foreground">Equipment Purchases</p>
                    <p className="text-sm text-muted-foreground">
                      Require manager pre-approval
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                  <div>
                    <p className="font-medium text-foreground">Software Subscriptions</p>
                    <p className="text-sm text-muted-foreground">
                      Auto-approve recurring expenses
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Rules;
