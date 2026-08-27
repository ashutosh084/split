"use client";

import { useState, useEffect } from "react";
import type { Friend, FriendRequest } from "@/lib/api";
import {
  getIncomingFriendRequests,
  getOutgoingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  ApiError,
} from "@/lib/api";

interface Props {
  friends: Friend[];
  onChanged: () => void;
}

export function FriendList({ friends, onChanged }: Props) {
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const [inc, out] = await Promise.all([
        getIncomingFriendRequests(),
        getOutgoingFriendRequests(),
      ]);
      setIncoming(inc.requests);
      setOutgoing(out.requests);
    } catch {
      // silently ignore — requests tab is auxiliary
    }
  };

  const handleAccept = async (requestId: string) => {
    setActionError("");
    setActionLoading(requestId);
    try {
      await acceptFriendRequest(requestId);
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
      onChanged();
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setActionError("");
    setActionLoading(requestId);
    try {
      await rejectFriendRequest(requestId);
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      if (err instanceof ApiError) setActionError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const hasRequests = incoming.length > 0 || outgoing.length > 0;

  return (
    <div className="space-y-4">
      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-accent font-mono border-b border-tac-border pb-2 mb-2">
            [ Requests ({incoming.length}) ]
          </h3>
          <div className="space-y-2">
            {incoming.map((req) => (
              <div
                key={req.id}
                className="card-tactical flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 bg-tac-border flex items-center justify-center text-tac-accent font-mono font-bold text-xs border border-tac-border shrink-0">
                    {req.from_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-tac-primary truncate">
                      {req.from_name}
                    </p>
                    <p className="text-[10px] text-tac-dim font-mono truncate">
                      {req.from_email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={actionLoading === req.id}
                    className="text-[10px] uppercase tracking-wider font-mono px-2.5 py-1 bg-tac-accent text-black rounded hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    {actionLoading === req.id ? "[ ... ]" : "[ ✓ ]"}
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoading === req.id}
                    className="text-[10px] uppercase tracking-wider font-mono px-2.5 py-1 border border-tac-border text-tac-muted rounded hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-50"
                  >
                    [ ✕ ]
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoing.length > 0 && (
        <div>
          <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono border-b border-tac-border pb-2 mb-2">
            [ Sent ({outgoing.length}) ]
          </h3>
          <div className="space-y-2">
            {outgoing.map((req) => (
              <div
                key={req.id}
                className="card-tactical flex items-center gap-3"
              >
                <div className="h-8 w-8 bg-tac-bg border border-tac-border flex items-center justify-center text-tac-muted font-mono font-bold text-xs shrink-0">
                  {req.to_name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-mono text-xs text-tac-primary truncate">
                    {req.to_name}
                  </p>
                  <p className="text-[10px] text-tac-dim font-mono truncate">
                    {req.to_email}
                  </p>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-tac-muted font-mono ml-auto shrink-0">
                  pending
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {actionError && (
        <div className="alert-tactical-error text-[10px]">{actionError}</div>
      )}

      {/* Friends list */}
      <h3 className="text-[11px] uppercase tracking-[0.25em] text-tac-muted font-mono border-b border-tac-border pb-2">
        [ Friends ({friends.length}) ]
      </h3>
      {friends.length === 0 && !hasRequests ? (
        <div className="card-tactical text-center text-tac-dim py-8 font-mono text-xs uppercase tracking-wider">
          No friends yet. Send a friend request to get started!
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="card-tactical flex items-center gap-3"
            >
              <div className="h-10 w-10 bg-tac-border flex items-center justify-center text-tac-accent font-mono font-bold text-sm border border-tac-border">
                {friend.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-mono text-xs text-tac-primary">
                  {friend.name}
                </p>
                <p className="text-[10px] text-tac-dim font-mono">
                  {friend.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
