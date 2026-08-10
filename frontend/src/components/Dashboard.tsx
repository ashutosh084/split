"use client";

import type { DashboardData } from "@/lib/api";

interface Props {
  data: DashboardData;
}

export function Dashboard({ data }: Props) {
  const stats = [
    {
      label: "Total Spent",
      value: `$${data.totalSpent.toFixed(2)}`,
      color: "text-gray-900",
      bg: "bg-gray-50",
    },
    {
      label: "You Owe",
      value: `$${data.iOwe.toFixed(2)}`,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "You Are Owed",
      value: `$${data.othersOweMe.toFixed(2)}`,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Net Balance",
      value: `${data.netBalance >= 0 ? "+" : ""}$${data.netBalance.toFixed(2)}`,
      color: data.netBalance >= 0 ? "text-green-600" : "text-red-600",
      bg: data.netBalance >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`card ${stat.bg}`}>
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick summary */}
      <div className="mt-6 card">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Summary</h3>
        {data.iOwe === 0 && data.othersOweMe === 0 ? (
          <p className="text-gray-500 text-sm">
            You&apos;re all settled up! 🎉
          </p>
        ) : data.iOwe > 0 && data.othersOweMe > 0 ? (
          <p className="text-gray-600 text-sm">
            You owe{" "}
            <span className="font-semibold text-red-600">
              ${data.iOwe.toFixed(2)}
            </span>{" "}
            and are owed{" "}
            <span className="font-semibold text-green-600">
              ${data.othersOweMe.toFixed(2)}
            </span>
            .
            {data.netBalance > 0
              ? ` Overall, you're in the green by $${data.netBalance.toFixed(2)}.`
              : ` Overall, you're in the red by $${Math.abs(data.netBalance).toFixed(2)}.`}
          </p>
        ) : data.iOwe > 0 ? (
          <p className="text-gray-600 text-sm">
            You owe{" "}
            <span className="font-semibold text-red-600">
              ${data.iOwe.toFixed(2)}
            </span>
            . Time to settle up!
          </p>
        ) : (
          <p className="text-gray-600 text-sm">
            You&apos;re owed{" "}
            <span className="font-semibold text-green-600">
              ${data.othersOweMe.toFixed(2)}
            </span>
            .
          </p>
        )}
      </div>
    </div>
  );
}
