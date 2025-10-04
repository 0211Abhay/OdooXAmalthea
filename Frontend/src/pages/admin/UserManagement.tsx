import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, MoreVertical, Mail, Shield, Eye, EyeOff } from "lucide-react";
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
import { api, User as APIUser, CreateUserData } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

interface User extends APIUser {
  _count?: {
    expenses: number;
    approvedExpenses: number;
  };
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"EMPLOYEE" | "MANAGER" | "ADMIN">("EMPLOYEE");
  const [isApprover, setIsApprover] = useState(false);
  const [approverLevel, setApproverLevel] = useState<number>(1);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    // Generate a random password with at least 8 characters
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewUserPassword(password);
    toast.success("Password generated! Make sure to save it securely.");
  };

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail || !newUserPassword || !newUserRole) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const userData: CreateUserData = {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        isApprover: isApprover || newUserRole !== "EMPLOYEE",
        approverLevel: isApprover ? approverLevel : undefined,
      };

      const newUser = await api.createUser(userData);
      
      // Add to local state
      setUsers(prev => [newUser, ...prev]);
      
      toast.success(`User ${newUser.name} added successfully!`);
      
      // Reset form
      setIsAddUserOpen(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("EMPLOYEE");
      setIsApprover(false);
      setApproverLevel(1);
    } catch (error: any) {
      console.error("Add user error:", error);
      const errorMessage = error?.message || "Failed to add user";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success(`User ${userName} deleted successfully`);
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast.error(error?.message || "Failed to delete user");
    }
  };  const roleColors = {
    ADMIN: "bg-destructive/10 text-destructive border-destructive/20",
    MANAGER: "bg-warning/10 text-warning border-warning/20",
    EMPLOYEE: "bg-accent/10 text-accent border-accent/20",
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="mt-1 text-muted-foreground">Loading users...</p>
            </div>
          </div>
          <Card className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
                  <TableHead>Role & Permissions</TableHead>
                  <TableHead>Activity</TableHead>
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={roleColors[user.role]}>
                          <Shield className="mr-1 h-3 w-3" />
                          {user.role}
                        </Badge>
                        {user.isApprover && (
                          <Badge variant="secondary" className="text-xs">
                            Approver L{user.approverLevel || 1}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {user._count ? (
                          <>
                            {user._count.expenses} expenses | {user._count.approvedExpenses} approved
                          </>
                        ) : (
                          "No activity"
                        )}
                      </div>
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
                          {user.id !== currentUser?.id && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                            >
                              Delete User
                            </DropdownMenuItem>
                          )}
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
                <Label htmlFor="user-name">Full Name *</Label>
                <Input
                  id="user-name"
                  placeholder="John Doe"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-email">Email *</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="john@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="user-password">Password *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                  >
                    Generate
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter secure password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The user will receive this password via email. Make sure to save it securely.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-role">Role *</Label>
                <Select 
                  value={newUserRole} 
                  onValueChange={(value) => setNewUserRole(value as "EMPLOYEE" | "MANAGER" | "ADMIN")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-popover">
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-approver"
                    checked={isApprover || newUserRole !== "EMPLOYEE"}
                    onCheckedChange={(checked) => setIsApprover(!!checked)}
                    disabled={newUserRole !== "EMPLOYEE"}
                  />
                  <Label htmlFor="is-approver" className="text-sm font-medium">
                    Can approve expenses
                  </Label>
                </div>
                
                {(isApprover || newUserRole !== "EMPLOYEE") && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="approver-level">Approver Level</Label>
                    <Select 
                      value={approverLevel.toString()} 
                      onValueChange={(value) => setApproverLevel(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        <SelectItem value="1">Level 1 (First Approver)</SelectItem>
                        <SelectItem value="2">Level 2 (Second Approver)</SelectItem>
                        <SelectItem value="3">Level 3 (Final Approver)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Lower numbers have higher approval priority
                    </p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddUserOpen(false);
                  setNewUserName("");
                  setNewUserEmail("");
                  setNewUserPassword("");
                  setNewUserRole("EMPLOYEE");
                  setIsApprover(false);
                  setApproverLevel(1);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                className="bg-gradient-primary"
                disabled={!newUserName || !newUserEmail || !newUserPassword || !newUserRole || isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;
