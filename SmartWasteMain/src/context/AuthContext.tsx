import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Role } from "@/lib/types";
import { authApi, usersApi } from "@/api/client";
import { toast } from "sonner";

interface AuthUser { id: string; name: string; email: string; role: Role; points: number; }
interface AuthCtx {
  user: AuthUser | null;
  login: (credentials: { email: string; password: string }) => Promise<AuthUser | null>;
  register: (data: { name: string; email: string; password: string; role: Role; phone?: string; address?: string; location?: string; swmCode?: string; }) => Promise<AuthUser | null>;
  logout: () => void;
  addPoints: (p: number) => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const userData = await usersApi.getMe();
    setUser({
      id: userData._id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      points: userData.points || 0,
    });
  };

  // Restore user on mount if token exists
  useEffect(() => {
    const restoreUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        // Token invalid, clear it
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      
      localStorage.setItem("token", response.token);
      const newUser: AuthUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as Role,
        points: response.user.points,
      };
      
      setUser(newUser);
      return newUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; role: Role; phone?: string; address?: string; location?: string; swmCode?: string; }) => {
    try {
      setIsLoading(true);
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        ...(data.role === "worker" && {
          phone: data.phone,
          address: data.address,
          location: data.location,
          swmCode: data.swmCode,
        }),
      });
      
      localStorage.setItem("token", response.token);
      const newUser: AuthUser = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as Role,
        points: response.user.points,
      };
      
      setUser(newUser);
      return newUser;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const addPoints = async (points: number) => {
    if (!user) return;
    try {
      const response = await usersApi.addPoints(user.id, points);
      setUser((prev) => prev ? { ...prev, points: response.points } : null);
    } catch (error) {
      console.error("Error adding points:", error);
    }
  };

  return (
    <Ctx.Provider value={{ user, login, register, logout, addPoints, refreshUser, isLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside provider");
  return c;
};
