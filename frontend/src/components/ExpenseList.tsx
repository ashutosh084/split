"use client";

import type { Expense } from "@/lib/api";
import { settleExpense, getExpense } from "@/lib/api";
import { useState } from "react";

interface Props {
  expenses: Expense[];
  currentUserId: string;
  onSettled: () => void;
}

export function ExpenseList({ expenses, currentUserId, onSettled }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Expense | null>(null);
  const [settling, setSettling] = useState(false);

  const handleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    try {
      const data = await getExpense(id);
      setDetail(data);
    } catch {
      setDetail(null);
    }
  };

  const handleSettle = async (expenseId: string) => {
    setSettling(true);
    try {
      await settleExpense(expenseId);
      onSettled();
    } catch (err) {
      console.error("Failed to settle:", err);
    } finally {
      setSettling(false);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-8">
        No expenses yet. Create your first expense above!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Recent Expenses</h3>
      {expenses.map((expense) => {
        const isPayer = expense.payer_id === currentUserId;
        return (
          <div key={expense.id} className="card">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleExpand(expense.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{expense.name}</h4>
                  {isPayer && (
                    <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">
                      Paid
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  Paid by {expense.payer_name} •{" "}
                  {new Date(expense.created_at * 1000).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${expense.amount.toFixed(2)}</p>
                <p className="text-xs text-gray-400">
                  {expandedId === expense.id ? "▲ Less" : "▼ Details"}
                </p>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === expense.id && detail && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                {detail.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {detail.description}
                  </p>
                )}
                {detail.tags && detail.tags.length > 0 && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {detail.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-2 font-medium">Person</th>
                      <th className="pb-2 font-medium text-right">Amount</th>
                      <th className="pb-2 font-medium text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.splits?.map((split) => (
                      <tr key={split.id} className="border-t border-gray-50">
                        <td className="py-2">
                          {split.user_name}
                          {split.user_id === detail.payer_id && (
                            <span className="text-xs text-primary-500 ml-1">
                              (payer)
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          ${split.amount_owed.toFixed(2)}
                        </td>
                        <td className="py-2 text-right">
                          {split.is_paid ? (
                            <span className="text-green-600 text-xs font-medium">
                              ✓ Settled
                            </span>
                          ) : split.user_id === currentUserId ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSettle(expense.id);
                              }}
                              disabled={settling}
                              className="text-xs btn-primary py-1 px-2"
                            >
                              {settling ? "..." : "Settle Up"}
                            </button>
                          ) : (
                            <span className="text-amber-600 text-xs">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
