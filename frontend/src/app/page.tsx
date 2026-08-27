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
  Group,
  getGroups,
} from "@/lib/api";
import { LoginForm } from "@/components/LoginForm";
import { RegisterForm } from "@/components/RegisterForm";
import { Dashboard } from "@/components/Dashboard";
import { TagOverview } from "@/components/TagOverview";
import { ExpenseList } from "@/components/ExpenseList";
import { FriendList } from "@/components/FriendList";
import { CreateExpenseForm } from "@/components/CreateExpenseForm";
import { AddFriendForm } from "@/components/AddFriendForm";
import { AdminPanel } from "@/components/AdminPanel";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import { GroupsList } from "@/components/GroupsList";
import { GroupDetailView } from "@/components/GroupDetailView";

type View = "login" | "register" | "dashboard";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>("login");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "friends" | "groups" | "admin"
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

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const data = await getGroups();
      setGroups(data.groups);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const handleLogin = async (identifier: string, password: string) => {
    const data = await login({ identifier, password });
    setUser(data.user);
    setView("dashboard");
    setLoading(true);
    await loadDashboardData();
  };

  const handleRegister = async (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => {
    await register({ email, password, name, username });
    setView("login");
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setDashboard(null);
    setExpenses([]);
    setFriends([]);
    setGroups([]);
    setSelectedGroup(null);
    setView("login");
    setActiveTab("overview");
  };

  const refreshData = async () => {
    await loadDashboardData();
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedGroup(null);
  };

  // Load groups when the Groups tab is opened
  useEffect(() => {
    if (activeTab === "groups") {
      loadGroups();
    }
  }, [activeTab, loadGroups]);

  // --- Auth views ---
  if (view !== "dashboard" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-mono font-bold text-tac-accent tracking-[0.15em] uppercase">
              [ SPLIT ]
            </h1>
            <p className="text-tac-muted text-xs uppercase tracking-[0.3em] mt-3 font-mono">
              Expense Manager v1.0
            </p>
            <div className="mt-4 border-t border-tac-border w-16 mx-auto" />
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
      <header className="bg-tac-surface border-b border-tac-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-2 sm:px-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3 py-2 sm:py-3">
          <h1 className="text-lg font-mono font-bold text-tac-accent tracking-[0.15em] uppercase">
            [ SPLIT ]
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-tac-muted uppercase tracking-wider font-mono">
              {user.name}
            </span>
            <span className="text-[10px] text-tac-dim font-mono">
              {user.email}
            </span>
            {user.isAdmin && (
              <span className="badge-tactical-amber">ADMIN</span>
            )}
            <button
              onClick={handleLogout}
              className="btn-tactical-ghost text-[10px] px-3 py-1"
            >
              [ LOGOUT ]
            </button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-5xl mx-auto px-2 sm:px-4 flex flex-wrap gap-1 sm:gap-2 overflow-x-auto pb-2 sm:pb-3">
          {[
            ["overview", "[ Overview ]"],
            ["activity", "[ Activity ]"],
            ["friends", "[ Friends ]"],
            ["groups", "[ Groups ]"],
            ...(user.isAdmin ? ([["admin", "[ Admin ]"]] as const) : []),
          ].map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab as typeof activeTab)}
              className={`tab-tactical ${
                activeTab === tab
                  ? "tab-tactical-active"
                  : "tab-tactical-inactive"
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
            <div className="spinner-tactical" />
          </div>
        ) : (
          <>
            {activeTab === "overview" && dashboard && (
              <div className="space-y-6">
                <Dashboard data={dashboard} />
                <TagOverview expenses={expenses} currentUserId={user.id} />
              </div>
            )}
            {activeTab === "activity" && (
              <div className="space-y-6">
                <CreateExpenseForm
                  friends={friends}
                  currentUser={user}
                  onCreated={refreshData}
                />
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
                <FriendList friends={friends} onChanged={loadDashboardData} />
              </div>
            )}
            {activeTab === "groups" && !selectedGroup && (
              <div className="space-y-6">
                <CreateGroupForm onCreated={loadGroups} />
                <GroupsList
                  groups={groups}
                  loading={groupsLoading}
                  onSelectGroup={setSelectedGroup}
                />
              </div>
            )}
            {activeTab === "groups" && selectedGroup && (
              <GroupDetailView
                groupId={selectedGroup}
                currentUser={user}
                friends={friends}
                onBack={() => setSelectedGroup(null)}
                onChanged={refreshData}
              />
            )}
            {activeTab === "admin" && user.isAdmin && <AdminPanel />}
          </>
        )}
      </main>
    </div>
  );
}
