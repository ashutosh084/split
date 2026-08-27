"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Expense } from "@/lib/api";

interface Props {
  expenses: Expense[];
  currentUserId: string;
}

/**
 * Groups expenses by their tags and displays them from most specific
 * (fewest expenses per tag) to most generic (most expenses per tag).
 *
 * Includes a filter input with dropdown that filters tag groups
 * based on the user's current input.
 */
export function TagOverview({ expenses, currentUserId }: Props) {
  const [filterInput, setFilterInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build tag → expenses map
  const tagGroups = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    for (const expense of expenses) {
      if (expense.tags && expense.tags.length > 0) {
        for (const tag of expense.tags) {
          if (!map[tag.name]) map[tag.name] = [];
          map[tag.name].push(expense);
        }
      }
    }
    // Sort groups: most specific (fewer expenses) first → most generic (more expenses) last
    const sorted = Object.entries(map).sort(
      ([, a], [, b]) => a.length - b.length,
    );
    return sorted;
  }, [expenses]);

  // All unique tag names for the dropdown
  const allTagNames = useMemo(
    () => tagGroups.map(([name]) => name),
    [tagGroups],
  );

  // Filter dropdown suggestions based on input
  const filteredSuggestions = useMemo(() => {
    if (!filterInput.trim()) return allTagNames;
    const q = filterInput.toLowerCase();
    return allTagNames.filter((name) => name.toLowerCase().includes(q));
  }, [allTagNames, filterInput]);

  // Filter displayed tag groups based on filter input
  const displayedGroups = useMemo(() => {
    if (!filterInput.trim()) return tagGroups;
    const q = filterInput.toLowerCase();
    return tagGroups.filter(([name]) => name.toLowerCase().includes(q));
  }, [tagGroups, filterInput]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (name: string) => {
    setFilterInput(name);
    setShowDropdown(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filteredSuggestions.length) {
        selectSuggestion(filteredSuggestions[highlightIndex]);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
      );
      return;
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  // Expenses without tags
  const untaggedExpenses = useMemo(
    () => expenses.filter((e) => !e.tags || e.tags.length === 0),
    [expenses],
  );

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div className="card-tactical">
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono mb-3 border-b border-tac-border pb-2">
        [ Expenses by Tag ]
      </h3>

      {/* Filter input with dropdown */}
      <div className="relative mb-4">
        <input
          ref={inputRef}
          type="text"
          value={filterInput}
          onChange={(e) => {
            setFilterInput(e.target.value);
            setShowDropdown(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder="Filter by tag..."
          className="input-tactical text-xs"
        />
        {filterInput && (
          <button
            type="button"
            onClick={() => setFilterInput("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-tac-muted hover:text-tac-bright text-xs"
          >
            ✕
          </button>
        )}

        {/* Suggestions dropdown */}
        {showDropdown && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 left-0 right-0 mt-1 max-h-36 overflow-y-auto border border-tac-border rounded bg-tac-surface shadow-lg"
          >
            {filteredSuggestions.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => selectSuggestion(name)}
                className={`w-full text-left px-3 py-1.5 text-sm font-mono transition-colors ${
                  i === highlightIndex
                    ? "bg-tac-accent/20 text-tac-accent"
                    : "text-tac-bright hover:bg-tac-accent/10"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tag groups */}
      {displayedGroups.length === 0 && filterInput.trim() ? (
        <p className="text-xs text-tac-dim font-mono text-center py-4">
          No tags matching &quot;{filterInput}&quot;
        </p>
      ) : (
        <div className="space-y-4">
          {displayedGroups.map(([tagName, exps]) => (
            <div key={tagName}>
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-tactical-green text-[11px]">
                  {tagName}
                </span>
                <span className="text-[10px] text-tac-dim font-mono">
                  {exps.length} expense{exps.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-1.5">
                {exps.map((expense) => {
                  const isPayer = expense.payer_id === currentUserId;
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between py-1.5 px-3 border border-tac-border/40 bg-tac-bg/50 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-tac-primary truncate">
                          {expense.name}
                        </span>
                        {isPayer && (
                          <span className="text-[9px] text-tac-accent/60 uppercase tracking-wider flex-shrink-0">
                            (PAID)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className="text-tac-dim text-[10px]">
                          {expense.payer_name}
                        </span>
                        <span className="text-tac-accent font-bold tabular-nums">
                          ₹{expense.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Untagged expenses */}
      {untaggedExpenses.length > 0 && !filterInput.trim() && (
        <div className="mt-4 pt-4 border-t border-tac-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-tactical text-[11px] bg-tac-bg border-tac-dim text-tac-dim">
              UNTAGGED
            </span>
            <span className="text-[10px] text-tac-dim font-mono">
              {untaggedExpenses.length} expense
              {untaggedExpenses.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-1.5">
            {untaggedExpenses.map((expense) => {
              const isPayer = expense.payer_id === currentUserId;
              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-1.5 px-3 border border-tac-border/40 bg-tac-bg/50 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-tac-dim truncate">
                      {expense.name}
                    </span>
                    {isPayer && (
                      <span className="text-[9px] text-tac-accent/60 uppercase tracking-wider flex-shrink-0">
                        (PAID)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-tac-dim text-[10px]">
                      {expense.payer_name}
                    </span>
                    <span className="text-tac-accent font-bold tabular-nums">
                      ₹{expense.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
