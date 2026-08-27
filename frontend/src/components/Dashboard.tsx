"use client";

import type { DashboardData } from "@/lib/api";

interface Props {
  data: DashboardData;
}

/** Safely format a number to 2 decimal places, even for absurdly large values */
function fmt(n: number): string {
  if (!isFinite(n)) return "₹0.00";
  if (n > 1e15 || n < -1e15) return "₹0.00";
  return `₹${n.toFixed(2)}`;
}

export function Dashboard({ data }: Props) {
  const stats = [
    {
      label: "Total Spent",
      value: fmt(data.totalSpent),
      color: "text-tac-primary",
    },
    {
      label: "You Owe",
      value: fmt(data.iOwe),
      color: "text-red-400",
    },
    {
      label: "You Are Owed",
      value: fmt(data.othersOweMe),
      color: "text-tac-accent",
    },
    {
      label: "Net Balance",
      value: `${data.netBalance >= 0 ? "+" : ""}${fmt(data.netBalance).replace("₹", "")}`,
      color: data.netBalance >= 0 ? "text-tac-accent" : "text-red-400",
    },
  ];

  return (
    <div>
      <h2 className="text-sm uppercase tracking-[0.3em] text-tac-muted font-mono mb-4 border-b border-tac-border pb-3">
        [ Dashboard ]
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="stat-label">{stat.label}</p>
            <p className={`stat-value ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick summary */}
      <div className="card-tactical">
        <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono mb-3 border-b border-tac-border pb-2">
          [ Summary ]
        </h3>
        {data.iOwe === 0 && data.othersOweMe === 0 ? (
          <p className="text-xs text-tac-dim font-mono">
            You&apos;re all settled up! 🎉
          </p>
        ) : data.iOwe > 0 && data.othersOweMe > 0 ? (
          <p className="text-xs text-tac-muted font-mono">
            You owe{" "}
            <span className="font-bold text-red-400">
              ₹{data.iOwe.toFixed(2)}
            </span>{" "}
            and are owed{" "}
            <span className="font-bold text-tac-accent">
              ₹{data.othersOweMe.toFixed(2)}
            </span>
            .
            {data.netBalance > 0
              ? ` Overall, you're in the green by ${fmt(data.netBalance)}.`
              : ` Overall, you're in the red by ${fmt(Math.abs(data.netBalance))}.`}
          </p>
        ) : data.iOwe > 0 ? (
          <p className="text-xs text-tac-muted font-mono">
            You owe{" "}
            <span className="font-bold text-red-400">
              ₹{data.iOwe.toFixed(2)}
            </span>
            . Time to settle up!
          </p>
        ) : (
          <p className="text-xs text-tac-muted font-mono">
            You&apos;re owed{" "}
            <span className="font-bold text-tac-accent">
              ₹{data.othersOweMe.toFixed(2)}
            </span>
            .
          </p>
        )}
      </div>
    </div>
  );
}
