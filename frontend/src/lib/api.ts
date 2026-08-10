const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Typed fetch wrapper for the Split API.
 * Automatically includes auth_token cookie and handles JSON serialization.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(data.error || "Request failed", res.status);
  }

  return data as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// --- Auth ---

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export async function login(payload: LoginPayload) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function register(payload: RegisterPayload) {
  return apiFetch<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function logout() {
  return apiFetch<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMe() {
  return apiFetch<{ user: User }>("/api/auth/me");
}

// --- Expenses ---

export interface Split {
  userId: string;
  amountOwed: number;
}

export interface CreateExpensePayload {
  amount: number;
  name: string;
  description?: string;
  tags?: string[];
  splits: Split[];
}

export interface Expense {
  id: string;
  payer_id: string;
  payer_name: string;
  amount: number;
  name: string;
  description: string | null;
  created_at: number;
  splits?: ExpenseSplit[];
  tags?: Tag[];
}

export interface ExpenseSplit {
  id: string;
  user_id: string;
  user_name: string;
  amount_owed: number;
  is_paid: number;
}

export interface Tag {
  id: string;
  name: string;
}

export async function createExpense(payload: CreateExpensePayload) {
  return apiFetch<{ message: string; expenseId: string }>("/api/expenses", {
    method: "POST",
    body: payload,
  });
}

export async function getExpenses() {
  return apiFetch<{ expenses: Expense[] }>("/api/expenses");
}

export async function getExpense(id: string) {
  return apiFetch<Expense>(`/api/expenses/${id}`);
}

export async function settleExpense(expenseId: string) {
  return apiFetch<{ message: string }>(`/api/expenses/${expenseId}/settle`, {
    method: "PATCH",
  });
}

// --- Friends ---

export interface Friend {
  id: string;
  email: string;
  name: string;
}

export async function addFriend(friendEmail: string) {
  return apiFetch<{ message: string; friend: Friend }>("/api/friends", {
    method: "POST",
    body: { friendEmail },
  });
}

export async function getFriends() {
  return apiFetch<{ friends: Friend[] }>("/api/friends");
}

// --- Users ---

export interface DashboardData {
  totalSpent: number;
  iOwe: number;
  othersOweMe: number;
  netBalance: number;
}

export interface TagBreakdown {
  name: string;
  total: number;
}

export async function getDashboard() {
  return apiFetch<DashboardData>("/api/users/me/dashboard");
}

export async function getTagBreakdown() {
  return apiFetch<{ tags: TagBreakdown[] }>("/api/users/me/tags");
}

export async function searchUsers(query: string) {
  return apiFetch<{ users: Friend[] }>(
    `/api/users/search?q=${encodeURIComponent(query)}`,
  );
}

// --- Admin ---

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_approved: number;
  is_admin: number;
}

export async function getPendingUsers() {
  return apiFetch<{ users: AdminUser[] }>("/api/admin/users/pending");
}

export async function approveUser(userId: string) {
  return apiFetch<{ message: string }>(`/api/admin/users/${userId}/approve`, {
    method: "PATCH",
  });
}

export async function getAllUsers() {
  return apiFetch<{ users: AdminUser[] }>("/api/admin/users");
}
