import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, UserRole } from "@/types";
import {
  adminHome,
  adminLogin,
  adminLogout,
} from "@/api/admins";

interface AuthContextType {
  user: User | null;
  sessionChecked: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (requiredRole: UserRole | UserRole[]) => boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sessionToUser(admin: {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
}): User {
  const id = String(admin.id ?? admin._id ?? "");
  return {
    id,
    name: admin.fullName ?? "Admin",
    email: admin.email ?? "",
    role: "admin",
    createdAt: "",
    status: "active",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  const refreshSession = useCallback(async () => {
    try {
      const { admin } = await adminHome();
      if (admin?.email) {
        setUser(sessionToUser(admin));
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setSessionChecked(true);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    const result = await adminLogin({ email, password });
    const a = result.admin;
    setUser(
      sessionToUser({
        id: a.id,
        fullName: a.fullName,
        email: a.email,
      })
    );
    setSessionChecked(true);
  };

  const logout = async () => {
    try {
      await adminLogout();
    } catch {
      // still clear local session
    }
    setUser(null);
  };

  const hasPermission = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  };

  const isSuperAdmin = false;
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionChecked,
        isAuthenticated: !!user,
        login,
        logout,
        hasPermission,
        isSuperAdmin,
        isAdmin,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
