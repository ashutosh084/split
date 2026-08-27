"use client";

import type { Expense } from "@/lib/api";
import { requestSettleExpense, approveSettlement, getExpense } from "@/lib/api";
import { useState } from "react";

interface Props {
  expenses: Expense[];
  currentUserId: string;
  onSettled: () => void;
}

export function ExpenseList({ expenses, currentUserId, onSettled }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Expense | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    setLoadingDetail(true);
    try {
      const data = await getExpense(id);
      setDetail(data);
    } catch {
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRequestSettle = async (expenseId: string) => {
    setSettling(expenseId);
    try {
      await requestSettleExpense(expenseId);
      // Re-fetch detail so the UI updates to AWAITING immediately
      const updated = await getExpense(expenseId);
      setDetail(updated);
      onSettled();
    } catch (err) {
      console.error("Failed to request settlement:", err);
    } finally {
      setSettling(null);
    }
  };

  const handleApprove = async (expenseId: string, splitId: string) => {
    setSettling(splitId);
    try {
      await approveSettlement(expenseId, splitId);
      // Re-fetch detail so the UI updates to ✓ SETTLED immediately
      const updated = await getExpense(expenseId);
      setDetail(updated);
      onSettled();
    } catch (err) {
      console.error("Failed to approve settlement:", err);
    } finally {
      setSettling(null);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="card-tactical text-center text-tac-dim py-8 font-mono text-xs uppercase tracking-wider">
        No expenses yet. Create your first expense above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono">
        [ Recent Activity ]
      </h3>
      {expenses.map((expense) => {
        const isPayer = expense.payer_id === currentUserId;
        return (
          <div
            key={expense.id}
            className="card-tactical hover:border-tac-border-active transition-colors"
          >
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleExpand(expense.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-mono text-sm text-tac-primary">
                    {expense.name}
                  </h4>
                  {isPayer && (
                    <span className="badge-tactical-green">PAID</span>
                  )}
                </div>
                <p className="text-xs text-tac-dim mt-0.5 font-mono">
                  Paid by {expense.payer_name} •{" "}
                  {new Date(expense.created_at * 1000).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-tac-accent">
                  ₹{expense.amount.toFixed(2)}
                </p>
                <p className="text-[10px] text-tac-dim font-mono">
                  {expandedId === expense.id && loadingDetail
                    ? "[ LOADING... ]"
                    : expandedId === expense.id
                      ? "[ COLLAPSE ]"
                      : "[ DETAILS ]"}
                </p>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === expense.id && loadingDetail && (
              <div className="mt-4 pt-4 border-t border-tac-border flex items-center justify-center py-6">
                <div className="spinner-tactical" />
              </div>
            )}
            {expandedId === expense.id && !loadingDetail && detail && (
              <div className="mt-4 pt-4 border-t border-tac-border">
                {detail.description && (
                  <p className="text-xs text-tac-muted mb-3 font-mono">
                    {detail.description}
                  </p>
                )}
                {detail.tags && detail.tags.length > 0 && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {detail.tags.map((tag) => (
                      <span key={tag.id} className="badge-tactical-green">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="table-tactical">
                    <thead>
                      <tr>
                        <th>Person</th>
                        <th className="text-right">Amount</th>
                        <th className="text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.splits?.map((split) => (
                        <tr key={split.id}>
                          <td>
                            {split.user_name}
                            {split.user_id === detail.payer_id && (
                              <span className="text-tac-accent text-[10px] ml-1">
                                (PAYER)
                              </span>
                            )}
                          </td>
                          <td className="text-right font-mono">
                            ₹{split.amount_owed.toFixed(2)}
                          </td>
                          <td className="text-right">
                            {split.is_paid ? (
                              <span className="text-tac-accent text-[10px] uppercase tracking-wider">
                                ✓ SETTLED
                              </span>
                            ) : split.settlement_requested &&
                              currentUserId === detail.payer_id ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(expense.id, split.id);
                                }}
                                disabled={settling === split.id}
                                className="btn-tactical-primary text-[10px] py-1 px-2"
                              >
                                {settling === split.id
                                  ? "[ ... ]"
                                  : "[ APPROVE ]"}
                              </button>
                            ) : split.settlement_requested &&
                              split.user_id === currentUserId ? (
                              <span className="text-amber-400 text-[10px] uppercase tracking-wider">
                                AWAITING
                              </span>
                            ) : split.user_id === currentUserId ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRequestSettle(expense.id);
                                }}
                                disabled={settling === expense.id}
                                className="btn-tactical-primary text-[10px] py-1 px-2"
                              >
                                {settling === expense.id
                                  ? "[ ... ]"
                                  : "[ SETTLE UP ]"}
                              </button>
                            ) : (
                              <span className="text-amber-400 text-[10px] uppercase tracking-wider">
                                PENDING
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
