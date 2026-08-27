"use client";

import { useState, useEffect } from "react";
import type { AdminUser } from "@/lib/api";
import { approveUser, getAllUsers, deleteUser } from "@/lib/api";

export function AdminPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

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

  const handleRemove = async (userId: string) => {
    setError("");
    try {
      await deleteUser(userId);
      setConfirmRemoveId(null);
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove user.";
      setError(msg);
      setConfirmRemoveId(null);
    }
  };

  const pendingCount = users.filter((u) => !u.is_approved).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="spinner-tactical-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card-tactical flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm uppercase tracking-[0.3em] text-tac-muted font-mono mb-1">
            [ Admin Panel ]
          </h2>
          <p className="text-[10px] text-tac-dim font-mono uppercase tracking-wider">
            {pendingCount} user{pendingCount !== 1 ? "s" : ""} pending approval
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="badge-tactical-amber">{pendingCount}</span>
        )}
      </div>

      {error && <div className="alert-tactical-error">{error}</div>}

      <div className="card-tactical">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono mb-4 border-b border-tac-border pb-2">
          [ All Users ]
        </h3>
        <div className="overflow-x-auto">
          <table className="table-tactical">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Role</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="font-mono text-tac-primary">{user.name}</td>
                  <td className="text-tac-dim">{user.email}</td>
                  <td>
                    {user.is_approved ? (
                      <span className="badge-tactical-green">✓ APPROVED</span>
                    ) : (
                      <span className="badge-tactical-amber">PENDING</span>
                    )}
                  </td>
                  <td>
                    {user.is_admin ? (
                      <span className="badge-tactical-amber">ADMIN</span>
                    ) : (
                      <span className="text-[10px] text-tac-dim uppercase tracking-wider font-mono">
                        USER
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!user.is_approved && (
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="btn-tactical-primary text-[10px] py-1 px-3"
                        >
                          [ APPROVE ]
                        </button>
                      )}
                      {user.is_approved &&
                        !user.is_admin &&
                        (confirmRemoveId === user.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-tac-warning font-mono uppercase tracking-wider mr-1">
                              CONFIRM?
                            </span>
                            <button
                              onClick={() => handleRemove(user.id)}
                              className="btn-tactical-danger text-[10px] py-1 px-2"
                            >
                              YES
                            </button>
                            <button
                              onClick={() => setConfirmRemoveId(null)}
                              className="text-[10px] text-tac-dim hover:text-tac-primary font-mono py-1 px-2"
                            >
                              NO
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmRemoveId(user.id)}
                            className="btn-tactical-danger text-[10px] py-1 px-3"
                          >
                            [ REMOVE ]
                          </button>
                        ))}
                    </div>
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
