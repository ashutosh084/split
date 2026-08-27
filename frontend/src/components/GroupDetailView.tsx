"use client";

import { useEffect, useState } from "react";
import type { Friend, GroupDetail, User } from "@/lib/api";
import { getGroup, addGroupMembers } from "@/lib/api";
import { CreateExpenseForm } from "./CreateExpenseForm";
import { BulkExpenseForm } from "./BulkExpenseForm";
import { ExpenseList } from "./ExpenseList";
import { Modal } from "./Modal";

interface Props {
  groupId: string;
  currentUser: User;
  friends: Friend[];
  onBack: () => void;
  onChanged: () => void;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "₹0.00";
  const abs = Math.abs(n);
  if (abs >= 1e15) return "₹0.00";
  return `₹${n.toFixed(2)}`;
}

export function GroupDetailView({
  groupId,
  currentUser,
  friends,
  onBack,
  onChanged,
}: Props) {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingMembers, setSavingMembers] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [expenseMode, setExpenseMode] = useState<"closed" | "single" | "bulk">(
    "closed",
  );
  const [expenseMenuOpen, setExpenseMenuOpen] = useState(false);

  const loadGroup = async () => {
    setLoading(true);
    try {
      const data = await getGroup(groupId);
      setGroup(data);
    } catch {
      setError("Failed to load group.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner-tactical" />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="btn-tactical-ghost text-[11px]">
          [ ← BACK TO GROUPS ]
        </button>
        <div className="alert-tactical-error">
          {error || "Group not found."}
        </div>
      </div>
    );
  }

  const memberIds = new Set(group.members.map((m) => m.id));
  const addableFriends = friends.filter((f) => !memberIds.has(f.id));
  const memberFriends: Friend[] = group.members
    .filter((m) => m.id !== currentUser.id)
    .map((m) => ({ id: m.id, email: m.email, name: m.name }));

  const toggleMember = (friendId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) next.delete(friendId);
      else next.add(friendId);
      return next;
    });
  };

  const handleAddMembers = async () => {
    if (selectedIds.size === 0) {
      setMemberError("Select at least one friend to add.");
      return;
    }
    setSavingMembers(true);
    setMemberError("");
    try {
      await addGroupMembers(groupId, Array.from(selectedIds));
      setSelectedIds(new Set());
      setShowAddMembers(false);
      await loadGroup();
      onChanged();
    } catch (err) {
      setMemberError(
        err instanceof Error ? err.message : "Failed to add members.",
      );
    } finally {
      setSavingMembers(false);
    }
  };

  const insights = group.insights;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="btn-tactical-ghost text-[11px]">
        [ ← BACK TO GROUPS ]
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-mono text-2xl text-tac-primary">{group.name}</h2>
          {group.description && (
            <p className="text-sm text-tac-muted mt-1 font-mono">
              {group.description}
            </p>
          )}
          <p className="text-[10px] text-tac-dim mt-2 font-mono uppercase tracking-wider">
            {group.members.length}{" "}
            {group.members.length === 1 ? "MEMBER" : "MEMBERS"}
          </p>
        </div>
        <button
          onClick={() => setShowAddMembers(true)}
          className="btn-tactical-primary text-[11px]"
        >
          [ + ADD MEMBERS ]
        </button>
      </div>

      {/* Insights */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card">
          <span className="stat-label">Total Group Spend</span>
          <span className="stat-value text-tac-accent">
            {fmt(insights.totalGroupExpenditure)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Your Share</span>
          <span className="stat-value">
            {fmt(insights.individualExpenditure)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">You Lent</span>
          <span className="stat-value text-tac-accent">
            {fmt(insights.lent)}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">You Borrowed</span>
          <span className="stat-value text-amber-400">
            {fmt(insights.borrowed)}
          </span>
        </div>
      </div>

      {/* Members */}
      <div className="card-tactical">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono mb-3">
          [ Members ]
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {group.members.map((m) => (
            <span key={m.id} className="badge-tactical-green">
              {m.name}
              {m.id === currentUser.id && (
                <span className="text-tac-accent"> (YOU)</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Add expense */}
      <div>
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono mb-3">
          [ Add Expense ]
        </h3>

        <div className="relative">
          <div className="flex">
            <button
              onClick={() => setExpenseMode("single")}
              className="btn-tactical-primary flex-1"
            >
              [ + NEW EXPENSE ]
            </button>
            <button
              onClick={() => setExpenseMenuOpen((v) => !v)}
              className="btn-tactical-primary px-3 border-l-0"
              aria-label="More expense options"
              aria-expanded={expenseMenuOpen}
            >
              [ ▾ ]
            </button>
          </div>

          {expenseMenuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setExpenseMenuOpen(false)}
                aria-label="Close menu"
                tabIndex={-1}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-64 bg-tac-surface border border-tac-border shadow-2xl">
                <button
                  onClick={() => {
                    setExpenseMenuOpen(false);
                    setExpenseMode("single");
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-mono text-tac-primary hover:bg-tac-bg hover:text-tac-accent transition-colors"
                >
                  [ + SINGLE EXPENSE ]
                </button>
                <button
                  onClick={() => {
                    setExpenseMenuOpen(false);
                    setExpenseMode("bulk");
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-mono text-tac-primary hover:bg-tac-bg hover:text-tac-accent transition-colors border-t border-tac-border"
                >
                  [ ⤒ BULK UPLOAD (CSV) ]
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {expenseMode === "single" && (
        <CreateExpenseForm
          friends={memberFriends}
          currentUser={currentUser}
          groupId={groupId}
          open
          onClose={() => setExpenseMode("closed")}
          onCreated={() => {
            loadGroup();
            onChanged();
          }}
        />
      )}

      {expenseMode === "bulk" && (
        <BulkExpenseForm
          groupId={groupId}
          members={group.members}
          onClose={() => setExpenseMode("closed")}
          onCreated={() => {
            loadGroup();
            onChanged();
          }}
        />
      )}

      {/* Group expense history */}
      <ExpenseList
        expenses={group.expenses}
        currentUserId={currentUser.id}
        onSettled={() => {
          loadGroup();
          onChanged();
        }}
      />

      {/* Add members modal */}
      {showAddMembers && (
        <Modal title="[ Add Members ]" onClose={() => setShowAddMembers(false)}>
          <div className="space-y-4">
            {addableFriends.length === 0 ? (
              <p className="text-xs text-tac-dim font-mono">
                All of your friends are already in this group.
              </p>
            ) : (
              <div className="space-y-2">
                {addableFriends.map((friend) => {
                  const selected = selectedIds.has(friend.id);
                  return (
                    <div
                      key={friend.id}
                      onClick={() => toggleMember(friend.id)}
                      className={`split-row ${
                        selected ? "split-row-selected" : "split-row-unselected"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleMember(friend.id)}
                        className="mr-1"
                      />
                      <div>
                        <p className="text-sm text-tac-primary">
                          {friend.name}
                        </p>
                        <p className="text-[10px] text-tac-dim">
                          {friend.email}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {memberError && (
              <div className="alert-tactical-error">{memberError}</div>
            )}

            <button
              onClick={handleAddMembers}
              className="btn-tactical-primary w-full"
              disabled={savingMembers || addableFriends.length === 0}
            >
              {savingMembers ? "[ ADDING... ]" : "[ ADD SELECTED ]"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
