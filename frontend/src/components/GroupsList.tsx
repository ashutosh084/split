"use client";

import type { Group } from "@/lib/api";

interface Props {
  groups: Group[];
  loading: boolean;
  onSelectGroup: (groupId: string) => void;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "₹0.00";
  return `₹${n.toFixed(2)}`;
}

export function GroupsList({ groups, loading, onSelectGroup }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="spinner-tactical" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono">
        [ Your Groups ]
      </h3>

      {groups.length === 0 ? (
        <div className="card-tactical text-center text-tac-dim py-12 font-mono text-xs uppercase tracking-wider">
          No groups yet. Create one to organize expenses for an activity.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className="card-tactical hover:border-tac-border-active transition-colors text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-mono text-sm text-tac-primary">
                  {group.name}
                </h4>
                <span className="badge-tactical-green">
                  {group.memberCount}{" "}
                  {group.memberCount === 1 ? "MEMBER" : "MEMBERS"}
                </span>
              </div>
              {group.description && (
                <p className="text-xs text-tac-dim mt-1.5 font-mono line-clamp-2">
                  {group.description}
                </p>
              )}
              <p
                className={`text-xs mt-2 font-mono ${
                  (group.netBalance ?? 0) > 0
                    ? "text-tac-accent"
                    : (group.netBalance ?? 0) < 0
                      ? "text-amber-400"
                      : "text-tac-dim"
                }`}
              >
                {(group.netBalance ?? 0) > 0
                  ? `[ YOU LENT ${fmt(group.netBalance)} ]`
                  : (group.netBalance ?? 0) < 0
                    ? `[ YOU OWE ${fmt(Math.abs(group.netBalance ?? 0))} ]`
                    : "[ SETTLED UP ]"}
              </p>
              <p className="text-[10px] text-tac-dim mt-2 font-mono uppercase tracking-wider">
                [ OPEN GROUP ]
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
