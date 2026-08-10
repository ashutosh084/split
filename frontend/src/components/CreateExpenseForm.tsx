"use client";

import { useState, useEffect } from "react";
import type { Friend } from "@/lib/api";
import { createExpense, ApiError, searchUsers } from "@/lib/api";

interface Props {
  friends: Friend[];
  onCreated: () => void;
}

export function CreateExpenseForm({ friends, onCreated }: Props) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [splits, setSplits] = useState<
    { userId: string; userName: string; amountOwed: string }[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Reset splits when friends change
  useEffect(() => {
    setSplits(
      friends.map((f) => ({ userId: f.id, userName: f.name, amountOwed: "" })),
    );
  }, [friends]);

  const toggleFriend = (friend: Friend) => {
    const exists = splits.find((s) => s.userId === friend.id);
    if (exists) {
      setSplits(splits.filter((s) => s.userId !== friend.id));
    } else {
      setSplits([
        ...splits,
        { userId: friend.id, userName: friend.name, amountOwed: "" },
      ]);
    }
  };

  const updateSplitAmount = (userId: string, value: string) => {
    setSplits(
      splits.map((s) =>
        s.userId === userId ? { ...s, amountOwed: value } : s,
      ),
    );
  };

  const splitEqually = () => {
    const numPeople = splits.length;
    if (numPeople === 0 || !amount) return;
    const each = (parseFloat(amount) / numPeople).toFixed(2);
    setSplits(splits.map((s) => ({ ...s, amountOwed: each })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const totalAmount = parseFloat(amount);
    if (!totalAmount || totalAmount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    const splitData = splits
      .filter((s) => s.userId && parseFloat(s.amountOwed) > 0)
      .map((s) => ({
        userId: s.userId,
        amountOwed: parseFloat(s.amountOwed),
      }));

    if (splitData.length === 0) {
      setError("Please add at least one split.");
      return;
    }

    const splitSum = splitData.reduce((sum, s) => sum + s.amountOwed, 0);
    if (Math.abs(splitSum - totalAmount) > 0.01) {
      setError(
        `Split total (${splitSum.toFixed(2)}) must equal the expense amount (${totalAmount.toFixed(2)}).`,
      );
      return;
    }

    setLoading(true);
    try {
      await createExpense({
        amount: totalAmount,
        name,
        description: description || undefined,
        tags: tags
          ? tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : undefined,
        splits: splitData,
      });
      setName("");
      setAmount("");
      setDescription("");
      setTags("");
      setSplits(
        friends.map((f) => ({
          userId: f.id,
          userName: f.name,
          amountOwed: "",
        })),
      );
      setExpanded(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create expense.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="btn-primary w-full">
        + New Expense
      </button>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">New Expense</h3>
        <button
          onClick={() => setExpanded(false)}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dinner, Rent, etc."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <input
            type="text"
            className="input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            className="input"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="groceries, utilities"
          />
        </div>

        {/* Splits */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Splits</label>
            <button
              type="button"
              onClick={splitEqually}
              className="text-xs text-primary-600 hover:underline"
            >
              Split Equally
            </button>
          </div>

          {friends.length === 0 ? (
            <p className="text-sm text-gray-400">
              Add friends first to split expenses.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {friends.map((friend) => {
                const split = splits.find((s) => s.userId === friend.id);
                const isSelected = !!split;
                return (
                  <div
                    key={friend.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary-300 bg-primary-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => toggleFriend(friend)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFriend(friend)}
                      className="rounded text-primary-600"
                    />
                    <span className="text-sm flex-1">{friend.name}</span>
                    {isSelected && (
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        className="input w-24 text-xs"
                        value={split.amountOwed}
                        onChange={(e) =>
                          updateSplitAmount(friend.id, e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        placeholder="0.00"
                        required
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating..." : "Create Expense"}
        </button>
      </form>
    </div>
  );
}
