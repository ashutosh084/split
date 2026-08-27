"use client";

import { useState } from "react";
import { addFriend, ApiError } from "@/lib/api";

interface Props {
  onAdded: () => void;
}

export function AddFriendForm({ onAdded }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const data = await addFriend(email);
      const targetName = data.friend?.name ?? data.recipient?.name ?? email;
      setSuccess(
        data.friend
          ? `You and ${targetName} are now friends!`
          : `Friend request sent to ${targetName}!`,
      );
      setEmail("");
      onAdded();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to add friend.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-tactical">
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono mb-3 border-b border-tac-border pb-2">
        [ Add Friend ]
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          className="input-tactical flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          required
        />
        <button
          type="submit"
          className="btn-tactical-primary"
          disabled={loading}
        >
          {loading ? "[ ... ]" : "[ ADD ]"}
        </button>
      </form>
      {error && (
        <div className="alert-tactical-error mt-2 text-[10px]">{error}</div>
      )}
      {success && (
        <div className="alert-tactical-success mt-2 text-[10px]">{success}</div>
      )}
    </div>
  );
}
