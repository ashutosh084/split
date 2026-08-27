"use client";

import { useState } from "react";
import { createGroup, ApiError } from "@/lib/api";
import { Modal } from "./Modal";

interface Props {
  onCreated: () => void;
}

export function CreateGroupForm({ onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter a group name.");
      return;
    }

    setLoading(true);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
      setExpanded(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to create group.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="btn-tactical-primary w-full"
      >
        [ + NEW GROUP ]
      </button>
    );
  }

  return (
    <Modal title="[ New Group ]" onClose={() => setExpanded(false)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Name
          </label>
          <input
            type="text"
            className="input-tactical"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Trip to Goa, Flatmates, etc."
            required
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Description (optional)
          </label>
          <textarea
            className="input-tactical resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group for?"
          />
        </div>

        {error && <div className="alert-tactical-error">{error}</div>}

        <button
          type="submit"
          className="btn-tactical-primary w-full"
          disabled={loading}
        >
          {loading ? "[ PROCESSING... ]" : "[ CREATE GROUP ]"}
        </button>
      </form>
    </Modal>
  );
}
