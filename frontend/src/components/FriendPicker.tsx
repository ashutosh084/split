"use client";

import { useState } from "react";
import type { Friend } from "@/lib/api";

interface Props {
  friends: Friend[];
  selectedIds: Set<string>;
  search: string;
  onSearchChange: (value: string) => void;
  onToggleFriend: (friend: Friend) => void;
}

/**
 * Searchable friend picker panel.
 * Lists friends not yet added to the split, with a text search filter.
 */
export function FriendPicker({
  friends,
  selectedIds,
  search,
  onSearchChange,
  onToggleFriend,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(7);

  const filtered = friends.filter((f) => {
    if (selectedIds.has(f.id)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)
    );
  });

  // Search shows all matches; browsing without a query is limited to a
  // visible window that can be expanded with "show more".
  const visible = search ? filtered : filtered.slice(0, visibleCount);
  const hasMore = !search && visibleCount < filtered.length;

  return (
    <div className="border border-tac-border rounded bg-tac-bg p-2 space-y-2">
      <input
        type="text"
        className="input-tactical text-[11px] py-1.5"
        placeholder="Search friends..."
        value={search}
        onChange={(e) => {
          setVisibleCount(7);
          onSearchChange(e.target.value);
        }}
        autoFocus
      />
      <div className="space-y-0.5">
        {filtered.length === 0 && (
          <div className="text-[10px] text-tac-muted font-mono text-center py-2">
            {search ? "No matches found." : "All friends already added."}
          </div>
        )}
        {visible.map((friend) => (
          <div
            key={friend.id}
            onClick={() => onToggleFriend(friend)}
            className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-tac-accent/10 transition-colors"
          >
            <span className="text-[10px] text-tac-muted font-mono">+</span>
            <span className="text-xs font-mono truncate">{friend.name}</span>
            <span className="text-[10px] text-tac-muted font-mono truncate ml-auto">
              {friend.email}
            </span>
          </div>
        ))}
        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + 7)}
            className="w-full text-[10px] uppercase tracking-wider font-mono py-1.5 text-tac-muted hover:text-tac-bright transition-colors"
          >
            [ SHOW MORE ({filtered.length - visibleCount}) ]
          </button>
        )}
      </div>
    </div>
  );
}
