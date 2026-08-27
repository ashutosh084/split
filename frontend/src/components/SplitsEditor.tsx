"use client";

import { useState } from "react";
import type { Friend } from "@/lib/api";
import { SplitRow } from "./SplitRow";
import { FriendPicker } from "./FriendPicker";

export interface SplitDraft {
  userId: string;
  userName: string;
  amountOwed: string;
}

interface Props {
  currentUserId: string;
  currentUserName: string;
  currentUserEmail: string;
  friends: Friend[];
  splits: SplitDraft[];
  splitMode: "equal" | "custom";
  onToggleFriend: (friend: Friend) => void;
  onAmountChange: (userId: string, value: string) => void;
  onModeToggle: (mode: "equal" | "custom") => void;
}

/**
 * Split selection editor: mode toggle (equal/custom), per-person amounts,
 * and the "add people" friend picker.
 */
export function SplitsEditor({
  currentUserId,
  currentUserName,
  currentUserEmail,
  friends,
  splits,
  splitMode,
  onToggleFriend,
  onAmountChange,
  onModeToggle,
}: Props) {
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");

  const selectedIds = new Set(splits.map((s) => s.userId));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono">
          Splits
        </label>
        <div className="flex border border-tac-border rounded overflow-hidden">
          <button
            type="button"
            onClick={() => onModeToggle("equal")}
            className={`text-[10px] uppercase tracking-wider font-mono px-2.5 py-1 transition-colors ${
              splitMode === "equal"
                ? "bg-tac-accent text-black"
                : "bg-transparent text-tac-muted hover:text-tac-bright"
            }`}
          >
            Equally
          </button>
          <button
            type="button"
            onClick={() => onModeToggle("custom")}
            className={`text-[10px] uppercase tracking-wider font-mono px-2.5 py-1 transition-colors ${
              splitMode === "custom"
                ? "bg-tac-accent text-black"
                : "bg-transparent text-tac-muted hover:text-tac-bright"
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {/* Current user — always visible, toggleable */}
        <SplitRow
          userId={currentUserId}
          userName={currentUserName}
          amountOwed={
            splits.find((s) => s.userId === currentUserId)?.amountOwed ?? ""
          }
          splitMode={splitMode}
          isSelf
          isSelected={selectedIds.has(currentUserId)}
          onToggle={() =>
            onToggleFriend({
              id: currentUserId,
              email: currentUserEmail,
              name: currentUserName,
            })
          }
          onAmountChange={(v) => onAmountChange(currentUserId, v)}
        />

        {/* Selected friends (excluding current user) */}
        {splits
          .filter((s) => s.userId !== currentUserId)
          .map((split) => {
            const friend = friends.find((f) => f.id === split.userId);
            const displayName = friend ? friend.name : split.userName;
            return (
              <SplitRow
                key={split.userId}
                userId={split.userId}
                userName={displayName}
                amountOwed={split.amountOwed}
                splitMode={splitMode}
                isSelf={false}
                isSelected
                onToggle={() =>
                  onToggleFriend({
                    id: split.userId,
                    email: "",
                    name: displayName,
                  })
                }
                onAmountChange={(v) => onAmountChange(split.userId, v)}
              />
            );
          })}

        {/* Add People button */}
        <button
          type="button"
          onClick={() => {
            setShowFriendPicker(!showFriendPicker);
            setFriendSearch("");
          }}
          className="w-full text-[10px] uppercase tracking-wider font-mono py-2 border border-dashed border-tac-border rounded text-tac-muted hover:text-tac-bright hover:border-tac-accent transition-colors"
        >
          {showFriendPicker
            ? "[ – CLOSE ]"
            : `[ + ADD PEOPLE${splits.length > 1 ? ` (${splits.length - 1})` : ""} ]`}
        </button>

        {/* Friend picker panel */}
        {showFriendPicker && (
          <FriendPicker
            friends={friends}
            selectedIds={selectedIds}
            search={friendSearch}
            onSearchChange={setFriendSearch}
            onToggleFriend={onToggleFriend}
          />
        )}
      </div>
    </div>
  );
}
