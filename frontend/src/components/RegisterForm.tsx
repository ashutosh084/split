"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";

interface Props {
  onRegister: (
    email: string,
    password: string,
    name: string,
    username: string,
  ) => Promise<void>;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onRegister, onSwitchToLogin }: Props) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await onRegister(email, password, name, username);
      setSuccess(
        "Registration successful! You may now sign in after admin approval.",
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-tactical">
      <h2 className="text-sm uppercase tracking-[0.3em] text-tac-muted font-mono mb-6 border-b border-tac-border pb-4">
        [ Create Account ]
      </h2>
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
            placeholder="Your name"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Username
          </label>
          <input
            type="text"
            className="input-tactical"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-[0.2em] text-tac-muted font-mono mb-1.5">
            Email
          </label>
          <input
            type="email"
            className="input-tactical"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
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
            placeholder="Min. 8 characters"
            required
            minLength={8}
          />
        </div>
        {error && <div className="alert-tactical-error">{error}</div>}
        {success && <div className="alert-tactical-success">{success}</div>}
        <button
          type="submit"
          className="btn-tactical-primary w-full"
          disabled={loading}
        >
          {loading ? "[ CREATING... ]" : "[ CREATE ACCOUNT ]"}
        </button>
      </form>
      <p className="text-[11px] text-tac-dim text-center mt-5 font-mono uppercase tracking-wider">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-tac-accent hover:text-tac-bright transition-colors font-mono"
        >
          [ Sign In ]
        </button>
      </p>
    </div>
  );
}
