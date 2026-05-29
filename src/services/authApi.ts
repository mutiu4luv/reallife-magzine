import { API_BASE_URL } from "../config/api";

const AUTH_TOKEN_KEY = "realitylife_admin_token";

export type UserRole = "user" | "blogger" | "admin";
export type AdminRequestStatus = "none" | "pending" | "approved" | "rejected";
export type PermissionRequestStatus = "none" | "pending" | "approved" | "rejected";

export const AVAILABLE_PERMISSIONS = [
  "posts:create",
  "posts:update",
  "posts:delete",
  "news:create",
  "news:update",
  "news:delete",
  "events:create",
  "events:update",
  "events:delete",
  "pastEditions:create",
  "pastEditions:delete",
  "testimonies:create",
  "testimonies:update",
  "testimonies:delete",
  "interviews:create",
  "interviews:update",
  "interviews:delete",
  "photoGallery:create",
  "photoGallery:delete",
] as const;

export type Permission = (typeof AVAILABLE_PERMISSIONS)[number];

export type AuthUser = {
  _id: string;
  name: string;
  email: string;
  phonenumber: string;
  role: UserRole;
  permissions: Array<Permission | "*">;
  adminRequestStatus: AdminRequestStatus;
  permissionRequestStatus: PermissionRequestStatus;
  requestedPermissions: Permission[];
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phonenumber: string;
  password: string;
  address: string;
  state: string;
};

export type AuditLog = {
  _id: string;
  actorName?: string;
  actorEmail?: string;
  action: string;
  resource: string;
  method?: string;
  path?: string;
  targetId?: string;
  createdAt?: string;
  metadata?: {
    title?: string;
    [key: string]: unknown;
  };
};

const AUTH_ENDPOINT = `${API_BASE_URL}/api/auth`;

const normalizePermissions = (value: unknown): Array<Permission | "*"> =>
  Array.isArray(value)
    ? value.filter((permission): permission is Permission | "*" =>
        permission === "*" || AVAILABLE_PERMISSIONS.includes(permission as Permission)
      )
    : [];

const normalizeUser = (user: AuthUser): AuthUser => ({
  ...user,
  role: user.role || "user",
  permissions: normalizePermissions(user.permissions),
  adminRequestStatus: user.adminRequestStatus || "none",
  permissionRequestStatus: user.permissionRequestStatus || "none",
  requestedPermissions: normalizePermissions(user.requestedPermissions).filter(
    (permission): permission is Permission => permission !== "*"
  ),
});

const normalizeAuthResponse = (response: AuthResponse): AuthResponse => ({
  ...response,
  user: normalizeUser(response.user),
});

const normalizeUserResponse = <T extends { user: AuthUser }>(response: T): T => ({
  ...response,
  user: normalizeUser(response.user),
});

export const getStoredAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY) || "";

export const setStoredAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearStoredAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = await response.json();
    return data?.error || data?.message || fallback;
  } catch {
    return fallback;
  }
};

export const authRequest = async <T,>(path: string, init?: RequestInit, fallback = "Request failed.") => {
  const headers = new Headers(init?.headers);

  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const authHeaders = getAuthHeaders();
  Object.entries(authHeaders).forEach(([key, value]) => headers.set(key, value));

  const response = await fetch(`${AUTH_ENDPOINT}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallback));
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
};

export const registerUser = (payload: RegisterPayload) =>
  authRequest<AuthResponse>(
    "/register",
    { method: "POST", body: JSON.stringify(payload) },
    "Unable to register."
  ).then(normalizeAuthResponse);

export const loginUser = (identifier: string, password: string) =>
  authRequest<AuthResponse>(
    "/login",
    { method: "POST", body: JSON.stringify({ identifier, password }) },
    "Unable to login."
  ).then(normalizeAuthResponse);

export const loadCurrentUser = () =>
  authRequest<{ user: AuthUser }>("/me", undefined, "Unable to load your session.").then(normalizeUserResponse);

export const logoutUser = () =>
  authRequest<{ message: string }>("/logout", { method: "POST" }, "Unable to logout.");

export const requestAdminAccess = () =>
  authRequest<{ user: AuthUser; message: string }>(
    "/request-admin",
    { method: "POST" },
    "Unable to request admin access."
  ).then(normalizeUserResponse);

export const requestBloggerAccess = () =>
  authRequest<{ user: AuthUser; message: string }>(
    "/request-permissions",
    { method: "POST", body: JSON.stringify({ request: "blogger" }) },
    "Unable to request blogger access."
  ).then(normalizeUserResponse);

export const changePassword = (currentPassword: string, newPassword: string, confirmPassword: string) =>
  authRequest<{ message: string }>(
    "/change-password",
    { method: "PATCH", body: JSON.stringify({ currentPassword, newPassword, confirmPassword }) },
    "Unable to change password."
  );

export const loadAdminRequests = () =>
  authRequest<AuthUser[]>("/admin-requests", undefined, "Unable to load admin requests.").then((users) =>
    users.map(normalizeUser)
  );

export const loadPermissionRequests = () =>
  authRequest<AuthUser[]>("/permission-requests", undefined, "Unable to load permission requests.").then((users) =>
    users.map(normalizeUser)
  );

export const loadUsers = () =>
  authRequest<AuthUser[]>("/users", undefined, "Unable to load users.").then((users) => users.map(normalizeUser));

export const deleteUser = (userId: string) =>
  authRequest<{ message: string; user: AuthUser }>(
    `/users/${userId}`,
    { method: "DELETE" },
    "Unable to delete user."
  );

export const updateUserRole = (userId: string, role: "user" | "blogger") =>
  authRequest<{ user: AuthUser }>(
    `/users/${userId}/role`,
    { method: "PATCH", body: JSON.stringify({ role }) },
    "Unable to update user role."
  ).then(normalizeUserResponse);

export const loadAuditLogs = () =>
  authRequest<AuditLog[]>("/audit-logs", undefined, "Unable to load audit logs.");

export const resolveAdminRequest = (userId: string, status: "approved" | "rejected") =>
  authRequest<{ user: AuthUser }>(
    `/admin-requests/${userId}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    "Unable to update admin request."
  ).then(normalizeUserResponse);

export const resolvePermissionRequest = (
  userId: string,
  status: "approved" | "rejected"
) =>
  authRequest<{ user: AuthUser }>(
    `/permission-requests/${userId}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
    "Unable to update blogger request."
  ).then(normalizeUserResponse);

export const hasPermission = (user: AuthUser | null | undefined, permission: Permission) =>
  user?.role === "admin" ||
  user?.role === "blogger" ||
  user?.permissions?.includes("*") ||
  user?.permissions?.includes(permission);

export const hasAnyPermission = (user: AuthUser | null | undefined) =>
  user?.role === "admin" || user?.role === "blogger" || Boolean(user?.permissions?.length);
