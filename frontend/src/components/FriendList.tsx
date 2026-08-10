"use client";

import type { Friend } from "@/lib/api";

interface Props {
  friends: Friend[];
}

export function FriendList({ friends }: Props) {
  if (friends.length === 0) {
    return (
      <div className="card text-center text-gray-500 py-8">
        No friends yet. Add friends to start splitting expenses!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">
        Your Friends ({friends.length})
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {friends.map((friend) => (
          <div key={friend.id} className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
              {friend.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-sm">{friend.name}</p>
              <p className="text-xs text-gray-500">{friend.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
