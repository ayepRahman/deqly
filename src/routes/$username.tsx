"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/$username")({
  component: PublicProfile,
});

function PublicProfile() {
  const { username } = Route.useParams();
  const user = useQuery(api.users.getByUsername, { username });

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-gray-500">
            No user with the handle &ldquo;{username}&rdquo; exists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-gray-500">
            {user.username?.charAt(0).toUpperCase()}
          </div>

          <h1 className="text-xl font-bold">@{user.username}</h1>

          {user.occupation && (
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {user.occupation}
            </p>
          )}

          <div className="mt-6 flex flex-col gap-3 text-sm">
            {user.email && (
              <a
                href={`mailto:${user.email}`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span>&#9993;</span>
                <span>{user.email}</span>
              </a>
            )}

            {user.mobileNumber && (
              <a
                href={`tel:${user.mobileNumber}`}
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span>&#9742;</span>
                <span>{user.mobileNumber}</span>
              </a>
            )}

            {user.websiteLink && (
              <a
                href={user.websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span>&#127760;</span>
                <span>{user.websiteLink}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
