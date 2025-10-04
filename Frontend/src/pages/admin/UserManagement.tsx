import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, MoreVertical, Mail, Shield } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "admin";
  status: "active" | "inactive";
}

const UserManagement = () => {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<string>("");

  const users: User[] = [
    { id: "1", name: "John Doe", email: "john@company.com", role: "admin", status: "active" },
    { id: "2", name: "Jane Smith", email: "jane@company.com", role: "manager", status: "active" },
    { id: "3", name: "Bob Johnson", email: "bob@company.com", role: "employee", status: "active" },
    { id: "4", name: "Alice Williams", email: "alice@company.com", role: "employee", status: "inactive" },
  ];

  const handleAddUser = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("User added successfully!");
    setIsAddUserOpen(false);
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("");
  };

  const roleColors = {
    admin: "bg-destructive/10 text-destructive border-destructive/20",
    manager: "bg-warning/10 text-warning border-warning/20",
    employee: "bg-accent/10 text-accent border-accent/20",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Management</h1>
            <p className="mt-1 text-muted-foreground">
              Manage team members and their roles
            </p>
          </div>
          <Button
            onClick={() => setIsAddUserOpen(true)}
            className="bg-gradient-primary shadow-glow"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-border"
                  >
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={roleColors[user.role]}>
                        <Shield className="mr-1 h-3 w-3" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.status === "active"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-muted text-muted-foreground border-border"
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50 bg-popover">
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuItem>Change Role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </Card>
        </motion.div>

        {/* Add User Dialog */}
        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent className="bg-card">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account and assign their role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name</Label>
                <Input
                  id="user-name"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="john@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-gradient-primary"
                disabled={!newUserName || !newUserEmail || !newUserRole}
              >
                Add User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
