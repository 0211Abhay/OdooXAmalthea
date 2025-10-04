import { createContext, useContext, useState, ReactNode, useEffect } from "react";

type UserRole = "employee" | "manager" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company: string;
  managerId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, company: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock user data based on email
    const mockUser: User = {
      id: "1",
      name: email.split("@")[0],
      email,
      role: email.includes("admin") ? "admin" : email.includes("manager") ? "manager" : "employee",
      company: "Demo Company",
    };
    
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
  };

  const signup = async (name: string, email: string, password: string, company: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: "admin", // First user becomes admin
      company,
    };
    
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
