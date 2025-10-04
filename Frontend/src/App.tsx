import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Dashboard
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";

// Employee pages
import SubmitExpense from "./pages/employee/SubmitExpense";
import ExpenseHistory from "./pages/employee/ExpenseHistory";
import ExpenseStatus from "./pages/employee/ExpenseStatus";

// Manager pages
import PendingApprovals from "./pages/manager/PendingApprovals";
import TeamExpenses from "./pages/manager/TeamExpenses";

// Admin pages
import UserManagement from "./pages/admin/UserManagement";
import ApprovalFlow from "./pages/admin/ApprovalFlow";
import Rules from "./pages/admin/Rules";
import AllExpenses from "./pages/admin/AllExpenses";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />
              
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Employee Routes */}
              <Route
                path="/employee/submit-expense"
                element={
                  <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                    <SubmitExpense />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/history"
                element={
                  <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                    <ExpenseHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employee/status/:id"
                element={
                  <ProtectedRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                    <ExpenseStatus />
                  </ProtectedRoute>
                }
              />

              {/* Manager Routes */}
              <Route
                path="/manager/pending"
                element={
                  <ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
                    <PendingApprovals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/team"
                element={
                  <ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
                    <TeamExpenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/expense/:id"
                element={
                  <ProtectedRoute allowedRoles={["MANAGER", "ADMIN"]}>
                    <ExpenseStatus />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/approvals"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <ApprovalFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/rules"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <Rules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/expenses"
                element={
                  <ProtectedRoute allowedRoles={["ADMIN"]}>
                    <AllExpenses />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
