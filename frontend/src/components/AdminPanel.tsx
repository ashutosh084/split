"use client";

import { useState, useEffect } from "react";
import type { AdminUser } from "@/lib/api";
import { getPendingUsers, approveUser, getAllUsers } from "@/lib/api";

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data.users);
    } catch {
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      await approveUser(userId);
      loadUsers();
    } catch {
      setError("Failed to approve user.");
    }
  };

  const pendingCount = users.filter((u) => !u.is_approved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin h-6 w-6 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-1">Admin Panel</h2>
        <p className="text-sm text-gray-500">
          {pendingCount} user{pendingCount !== 1 ? "s" : ""} pending approval
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="card">
        <h3 className="text-sm font-medium text-gray-700 mb-4">All Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-50">
                  <td className="py-2">{user.name}</td>
                  <td className="py-2 text-gray-500">{user.email}</td>
                  <td className="py-2">
                    {user.is_approved ? (
                      <span className="text-green-600 text-xs font-medium">
                        ✓ Approved
                      </span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    {user.is_admin ? (
                      <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        Admin
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">User</span>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {!user.is_approved && (
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="text-xs btn-primary py-1 px-2"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
