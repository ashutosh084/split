"use client";

import { useState } from "react";
import type { GroupMember } from "@/lib/api";
import { createExpense, ApiError } from "@/lib/api";
import { Modal } from "./Modal";

interface Props {
  groupId: string;
  members: GroupMember[];
  onCreated: () => void;
  onClose: () => void;
}

interface ParsedRow {
  amount: number;
  name: string;
}

/** Split an amount evenly into `count` parts, giving the remainder to the last. */
function equalSplit(total: number, count: number): number[] {
  const truncatedCents = Math.floor((total / count) * 100) / 100;
  const lastAmount =
    Math.round((total - truncatedCents * (count - 1)) * 100) / 100;
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? lastAmount : truncatedCents,
  );
}

/** Parse `amount,expense_name` lines (no header). Returns valid rows + errors. */
function parseCsv(text: string): { rows: ParsedRow[]; errors: string[] } {
  const rows: ParsedRow[] = [];
  const errors: string[] = [];

  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .forEach((line, i) => {
      const lineNo = i + 1;
      const parts = line.split(",");
      const amountStr = (parts[0] ?? "").trim();
      const name = parts.slice(1).join(",").trim();
      const amount = Number(amountStr);

      if (!amountStr || Number.isNaN(amount) || amount <= 0) {
        errors.push(`Line ${lineNo}: invalid amount "${amountStr}".`);
        return;
      }
      if (!name) {
        errors.push(`Line ${lineNo}: missing expense name.`);
        return;
      }
      rows.push({ amount, name });
    });

  return { rows, errors };
}

export function BulkExpenseForm({
  groupId,
  members,
  onCreated,
  onClose,
}: Props) {
  const [csv, setCsv] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  const preview = parseCsv(csv);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (members.length === 0) {
      setError("This group has no members.");
      return;
    }

    const { rows, errors } = parseCsv(csv);
    if (rows.length === 0) {
      setError(
        errors.length > 0
          ? `No valid rows. First error: ${errors[0]}`
          : "Paste at least one row of `amount,expense_name`.",
      );
      return;
    }

    setLoading(true);
    let created = 0;
    try {
      for (let i = 0; i < rows.length; i++) {
        setProgress(`Uploading ${i + 1}/${rows.length}...`);
        const { amount, name } = rows[i];
        const amounts = equalSplit(amount, members.length);
        await createExpense({
          amount,
          name,
          splits: members.map((m, idx) => ({
            userId: m.id,
            amountOwed: amounts[idx],
          })),
          groupId,
        });
        created++;
      }
      setProgress("");
      setCsv("");
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          created > 0
            ? `Uploaded ${created} of ${rows.length} expenses, then failed: ${err.message}`
            : err.message,
        );
      } else {
        setError("Failed to bulk upload expenses.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="[ Bulk Upload Expenses ]"
      onClose={onClose}
      footer={
        <div className="space-y-3">
          {error && <div className="alert-tactical-error">{error}</div>}
          <button
            type="submit"
            form="bulk-expense-form"
            className="btn-tactical-primary w-full"
            disabled={loading}
          >
            {loading
              ? `[ ${progress || "PROCESSING..."} ]`
              : `[ UPLOAD ${preview.rows.length} EXPENSE${preview.rows.length === 1 ? "" : "S"} ]`}
          </button>
        </div>
      }
    >
      <form
        id="bulk-expense-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <p className="text-xs text-tac-muted font-mono mb-2 leading-relaxed">
            Paste one expense per line as{" "}
            <span className="text-tac-accent">amount,expense_name</span> (no
            header). Each amount is split equally between all {members.length}{" "}
            {members.length === 1 ? "member" : "members"}.
          </p>
          <textarea
            className="input-tactical min-h-[10rem] resize-y"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder={"100,taxi\n2000,dinner\n50,misc"}
            disabled={loading}
          />
        </div>

        {preview.rows.length > 0 && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
              [ Preview ]
            </p>
            <div className="space-y-1">
              {preview.rows.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm font-mono border border-tac-border px-3 py-1.5"
                >
                  <span className="text-tac-primary">{r.name}</span>
                  <span className="text-tac-accent">
                    ₹{r.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {preview.errors.length > 0 && (
          <div className="alert-tactical-error">
            <p className="font-bold mb-1">Invalid rows (skipped):</p>
            <ul className="list-disc list-inside space-y-0.5">
              {preview.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}
