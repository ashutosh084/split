"use client";

import { useState, useEffect, useRef } from "react";
import type { Friend, User } from "@/lib/api";
import { createExpense, ApiError, getTagSuggestions } from "@/lib/api";
import TagInput from "./TagInput";
import { Modal } from "./Modal";
import { SplitsEditor, type SplitDraft } from "./SplitsEditor";

interface Props {
  friends: Friend[];
  currentUser: User;
  onCreated: () => void;
  /** When set, the expense is created inside this group. */
  groupId?: string;
  /**
   * When provided, the parent controls visibility: renders the modal when
   * `true` and nothing when `false` (parent supplies its own trigger).
   */
  open?: boolean;
  onClose?: () => void;
}

export function CreateExpenseForm({
  friends,
  currentUser,
  onCreated,
  groupId,
  open,
  onClose,
}: Props) {
  const isControlled = open !== undefined;
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [splits, setSplits] = useState<SplitDraft[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const autoFillDoneRef = useRef(false);

  const isOpen = isControlled ? open : expanded;

  const close = () => {
    if (isControlled) onClose?.();
    else setExpanded(false);
  };

  // Reset auto-fill flag when amount or split selection changes
  const resetAutoFill = () => {
    autoFillDoneRef.current = false;
  };

  // Fetch tag suggestions from user + friends on mount
  useEffect(() => {
    let cancelled = false;
    setTagsLoading(true);
    getTagSuggestions()
      .then((data) => {
        if (!cancelled) {
          setTagSuggestions(data.tags.map((t) => t.name));
        }
      })
      .catch(() => {
        // Silently ignore — suggestions are non-critical
      })
      .finally(() => {
        if (!cancelled) setTagsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-populate splits: only current user by default; in a group,
  // include all group members (the user can still deselect any of them).
  useEffect(() => {
    const initial: SplitDraft[] = [
      { userId: currentUser.id, userName: currentUser.name, amountOwed: "" },
    ];
    if (groupId) {
      initial.push(
        ...friends.map((f) => ({
          userId: f.id,
          userName: f.name,
          amountOwed: "",
        })),
      );
    }
    setSplits(initial);
    resetAutoFill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, groupId]);

  // Auto-calculation: equally mode — divide total among all selected
  useEffect(() => {
    if (splitMode !== "equal") return;
    const total = parseFloat(amount);
    if (!total || total <= 0 || splits.length === 0) return;

    // Truncate to cents, give remainder to the last person to avoid rounding gaps
    const truncatedCents = Math.floor((total / splits.length) * 100) / 100;
    const lastAmount =
      Math.round((total - truncatedCents * (splits.length - 1)) * 100) / 100;

    setSplits((prev) =>
      prev.map((s, i) => ({
        ...s,
        amountOwed:
          i === splits.length - 1
            ? lastAmount.toFixed(2)
            : truncatedCents.toFixed(2),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, splitMode, splits.length]);

  // Auto-calculation: custom mode — smart auto-fill
  useEffect(() => {
    if (splitMode !== "custom") return;
    const total = parseFloat(amount);
    if (!total || total <= 0) return;

    const filled = splits.filter(
      (s) => s.amountOwed !== "" && parseFloat(s.amountOwed) >= 0,
    );
    const empty = splits.filter(
      (s) => s.amountOwed === "" || parseFloat(s.amountOwed) < 0,
    );

    if (splits.length === 2) {
      // 2 people: auto-calculate remaining on every change
      if (filled.length === 1 && empty.length === 1) {
        const filledSum = filled.reduce(
          (sum, s) => sum + parseFloat(s.amountOwed),
          0,
        );
        const remaining = (total - filledSum).toFixed(2);
        setSplits((prev) =>
          prev.map((s) =>
            s.userId === empty[0].userId ? { ...s, amountOwed: remaining } : s,
          ),
        );
      }
    } else if (splits.length >= 3 && !autoFillDoneRef.current) {
      // 3+ people: auto-fill last empty only once
      if (empty.length === 1 && filled.length === splits.length - 1) {
        const filledSum = filled.reduce(
          (sum, s) => sum + parseFloat(s.amountOwed),
          0,
        );
        const remaining = (total - filledSum).toFixed(2);
        setSplits((prev) =>
          prev.map((s) =>
            s.userId === empty[0].userId ? { ...s, amountOwed: remaining } : s,
          ),
        );
        autoFillDoneRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, splitMode, splits]);

  const toggleFriend = (friend: Friend) => {
    resetAutoFill();
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
    if (splitMode === "custom") {
      resetAutoFill();
    }
    setSplits(
      splits.map((s) =>
        s.userId === userId ? { ...s, amountOwed: value } : s,
      ),
    );
  };

  const handleModeToggle = (mode: "equal" | "custom") => {
    setSplitMode(mode);
    resetAutoFill();
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
        tags: tags.length > 0 ? tags : undefined,
        splits: splitData,
        groupId,
      });
      setName("");
      setAmount("");
      setDescription("");
      setTags([]);
      setSplits(
        groupId
          ? [
              {
                userId: currentUser.id,
                userName: currentUser.name,
                amountOwed: "",
              },
              ...friends.map((f) => ({
                userId: f.id,
                userName: f.name,
                amountOwed: "",
              })),
            ]
          : [
              {
                userId: currentUser.id,
                userName: currentUser.name,
                amountOwed: "",
              },
            ],
      );
      setSplitMode("equal");
      close();
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

  if (!isOpen) {
    if (isControlled) return null;
    return (
      <button
        onClick={() => setExpanded(true)}
        className="btn-tactical-primary w-full"
      >
        [ + NEW EXPENSE ]
      </button>
    );
  }

  return (
    <Modal
      title="[ New Expense ]"
      onClose={close}
      footer={
        <div className="space-y-3">
          {error && <div className="alert-tactical-error">{error}</div>}
          <button
            type="submit"
            form="create-expense-form"
            className="btn-tactical-primary w-full"
            disabled={loading}
          >
            {loading ? "[ PROCESSING... ]" : "[ CREATE EXPENSE ]"}
          </button>
        </div>
      }
    >
      <form
        id="create-expense-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
              Name
            </label>
            <input
              type="text"
              className="input-tactical"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dinner, Rent, etc."
              required
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="input-tactical"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Description (optional)
          </label>
          <input
            type="text"
            className="input-tactical"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional notes..."
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Tags
          </label>
          <TagInput
            selectedTags={tags}
            onChange={setTags}
            suggestions={tagSuggestions}
            loading={tagsLoading}
          />
        </div>

        {/* Splits */}
        <SplitsEditor
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          currentUserEmail={currentUser.email}
          friends={friends}
          splits={splits}
          splitMode={splitMode}
          onToggleFriend={toggleFriend}
          onAmountChange={updateSplitAmount}
          onModeToggle={handleModeToggle}
        />
      </form>
    </Modal>
  );
}
