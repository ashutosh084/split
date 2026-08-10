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
      setSuccess(`Added ${data.friend.name} as a friend!`);
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
    <div className="card">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Add a Friend</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          className="input flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          required
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "..." : "Add"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-2">{success}</p>}
    </div>
  );
}
