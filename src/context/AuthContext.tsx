import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  changePassword as changePasswordRequest,
  clearStoredAuthToken,
  loadCurrentUser,
  loginUser,
  logoutUser,
  requestBloggerAccess,
  requestMagazineAccess,
  registerUser,
  requestAdminAccess,
  setStoredAuthToken,
} from "../services/authApi";
import type { AuthUser, RegisterPayload } from "../services/authApi";
import { AuthContext } from "./authContextValue";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const result = await loadCurrentUser();
      setUser(result.user);
      return result.user;
    } catch {
      clearStoredAuthToken();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const result = await loadCurrentUser();
        if (isMounted) {
          setUser(result.user);
        }
      } catch {
        clearStoredAuthToken();
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await loginUser(identifier, password);
    setStoredAuthToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const result = await registerUser(payload);
    setStoredAuthToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } finally {
      clearStoredAuthToken();
      setUser(null);
    }
  }, []);

  const requestAdmin = useCallback(async () => {
    const result = await requestAdminAccess();
    setUser(result.user);
    return result.user;
  }, []);

  const requestBlogger = useCallback(async () => {
    const result = await requestBloggerAccess();
    setUser(result.user);
    return result.user;
  }, []);

  const requestMagazine = useCallback(async (reference: string, note?: string) => {
    const result = await requestMagazineAccess({ reference, note });
    setUser(result.user);
    return result.user;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    await changePasswordRequest(currentPassword, newPassword, confirmPassword);
    clearStoredAuthToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      requestAdmin,
      requestBlogger,
      requestMagazine,
      changePassword,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, requestAdmin, requestBlogger, requestMagazine, changePassword, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
