import { createContext } from "react";
import type { AuthUser, RegisterPayload } from "../services/authApi";

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  requestAdmin: () => Promise<AuthUser>;
  requestBlogger: () => Promise<AuthUser>;
  requestMagazine: (reference: string, note?: string) => Promise<AuthUser>;
  requestMagazinePurchase: (magazineId: string, reference: string, note?: string) => Promise<AuthUser>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
