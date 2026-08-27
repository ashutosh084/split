"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";

interface Props {
  onLogin: (identifier: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onLogin, onSwitchToRegister }: Props) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onLogin(identifier, password);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-tactical">
      <h2 className="text-sm uppercase tracking-[0.3em] text-tac-muted font-mono mb-6 border-b border-tac-border pb-4">
        [ Sign In ]
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Email or Username
          </label>
          <input
            type="text"
            className="input-tactical"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or username"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Password
          </label>
          <input
            type="password"
            className="input-tactical"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>
        {error && <div className="alert-tactical-error">{error}</div>}
        <button
          type="submit"
          className="btn-tactical-primary w-full"
          disabled={loading}
        >
          {loading ? "[ AUTHENTICATING... ]" : "[ SIGN IN ]"}
        </button>
      </form>
      <p className="text-[11px] text-tac-dim text-center mt-5 font-mono uppercase tracking-wider">
        No account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-tac-accent hover:text-tac-bright transition-colors font-mono"
        >
          [ Register ]
        </button>
      </p>
    </div>
  );
}
