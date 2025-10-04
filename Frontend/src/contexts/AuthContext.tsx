import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { api, User, Company } from "@/lib/api";

type UserRole = "EMPLOYEE" | "MANAGER" | "ADMIN";

interface AuthUser extends User {
  company?: Company;
}

interface AuthContextType {
  user: AuthUser | null;
  company: Company | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, companyName: string, country: string, currency: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth data on app load
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedCompany = localStorage.getItem("company");

    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const companyData = storedCompany ? JSON.parse(storedCompany) : null;
        setUser(userData);
        setCompany(companyData);
      } catch (error) {
        console.error("Failed to parse stored auth data:", error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      
      // Store auth data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("company", JSON.stringify(response.company));
      
      setUser(response.user);
      setCompany(response.company);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const signup = async (
    name: string, 
    email: string, 
    password: string, 
    companyName: string,
    country: string,
    currency: string
  ) => {
    try {
      const response = await api.signup({
        name,
        email,
        password,
        companyName,
        country,
        currency,
      });
      
      // Store auth data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      localStorage.setItem("company", JSON.stringify(response.company));
      
      setUser(response.user);
      setCompany(response.company);
    } catch (error) {
      console.error("Signup failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setCompany(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("company");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        loading,
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
