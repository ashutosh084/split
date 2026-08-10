"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  getMe,
  login,
  register,
  logout,
  ApiError,
  DashboardData,
  getDashboard,
  Expense,
  getExpenses,
  Friend,
  getFriends,
} from "@/lib/api";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { Dashboard } from "@/components/Dashboard";
import { ExpenseList } from "@/components/ExpenseList";
import { FriendList } from "@/components/FriendList";
import { CreateExpenseForm } from "@/components/CreateExpenseForm";
import { AddFriendForm } from "@/components/AddFriendForm";
import { AdminPanel } from "@/components/AdminPanel";

type View = "login" | "register" | "dashboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("login");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "expenses" | "friends" | "admin"
  >("overview");
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    getMe()
      .then((data) => {
        setUser(data.user);
        setView("dashboard");
        loadDashboardData();
      })
      .catch(() => setLoading(false));
  }, []);

  const loadDashboardData = useCallback(async () => {
    try {
      const [dash, exp, fr] = await Promise.all([
        getDashboard(),
        getExpenses(),
        getFriends(),
      ]);
      setDashboard(dash);
      setExpenses(exp.expenses);
      setFriends(fr.friends);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const data = await login({ email, password });
    setUser(data.user);
    setView("dashboard");
    setLoading(true);
    await loadDashboardData();
  };

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
  ) => {
    await register({ email, password, name });
    setView("login");
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setDashboard(null);
    setExpenses([]);
    setFriends([]);
    setView("login");
    setActiveTab("overview");
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  // --- Auth views ---
  if (view !== "dashboard" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-600">Split</h1>
            <p className="text-gray-500 mt-2">
              Split expenses with friends, effortlessly.
            </p>
          </div>

          {view === "login" && (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => setView("register")}
            />
          )}
          {view === "register" && (
            <RegisterForm
              onRegister={handleRegister}
              onSwitchToLogin={() => setView("login")}
            />
          )}
        </div>
      </div>
    );
  }

  // --- App shell ---
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600">Split</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user.name}</span>
            {user.isAdmin && (
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
            )}
            <button onClick={handleLogout} className="btn-secondary text-xs">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-5xl mx-auto px-4 flex gap-0">
          {[
            ["overview", "Overview"],
            ["expenses", "Expenses"],
            ["friends", "Friends"],
            ...(user.isAdmin ? ([["admin", "Admin"]] as const) : []),
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && dashboard && (
              <Dashboard data={dashboard} />
            )}
            {activeTab === "expenses" && (
              <div className="space-y-6">
                <CreateExpenseForm friends={friends} onCreated={refreshData} />
                <ExpenseList
                  expenses={expenses}
                  currentUserId={user.id}
                  onSettled={refreshData}
                />
              </div>
            )}
            {activeTab === "friends" && (
              <div className="space-y-6">
                <AddFriendForm onAdded={refreshData} />
                <FriendList friends={friends} />
              </div>
            )}
            {activeTab === "admin" && user.isAdmin && <AdminPanel />}
          </>
        )}
      </main>
    </div>
  );
}
