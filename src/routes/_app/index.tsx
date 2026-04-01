"use client";

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { authClient } from "~/lib/auth-client";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export const Route = createFileRoute("/_app/")({
  component: AppHome,
});

function AppHome() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const currentUser = useQuery(api.auth.getCurrentUser);
  const updateProfile = useMutation(api.users.updateProfile);

  const [username, setUsername] = useState("");
  const [occupation, setOccupation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const needsProfile = currentUser && !currentUser.username;

  useEffect(() => {
    if (needsProfile) {
      const stored = localStorage.getItem("deqly_signup_profile");
      if (stored) {
        try {
          const profile = JSON.parse(stored);
          setUsername(profile.username ?? "");
          setOccupation(profile.occupation ?? "");
          setMobileNumber(profile.mobileNumber ?? "");
          setWebsiteLink(profile.websiteLink ?? "");
        } catch {
          // ignore parse errors
        }
      }
    } else if (currentUser) {
      setUsername(currentUser.username ?? "");
      setOccupation(currentUser.occupation ?? "");
      setMobileNumber(currentUser.mobileNumber ?? "");
      setWebsiteLink(currentUser.websiteLink ?? "");
    }
  }, [currentUser, needsProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        username,
        occupation: occupation || undefined,
        mobileNumber: mobileNumber || undefined,
        websiteLink: websiteLink || undefined,
      });
      localStorage.removeItem("deqly_signup_profile");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.navigate({ to: "/login" });
  };

  if (currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            {needsProfile ? "Complete your profile" : "Your Profile"}
          </h1>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Sign out
          </button>
        </div>

        {session?.user && (
          <p className="text-sm text-gray-500 mb-6">
            Signed in as {session.user.email}
          </p>
        )}

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium mb-1.5"
            >
              Username / Handle *
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="onlyayep"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
            {username && (
              <p className="text-xs text-gray-400 mt-1">
                Your public profile: deqly.com/{username}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="occupation"
              className="block text-sm font-medium mb-1.5"
            >
              Occupation
            </label>
            <input
              id="occupation"
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Software Engineer"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="mobileNumber"
              className="block text-sm font-medium mb-1.5"
            >
              Mobile Number
            </label>
            <input
              id="mobileNumber"
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+65 9123 4567"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="websiteLink"
              className="block text-sm font-medium mb-1.5"
            >
              Website
            </label>
            <input
              id="websiteLink"
              type="url"
              value={websiteLink}
              onChange={(e) => setWebsiteLink(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !username}
            className="w-full py-2.5 px-4 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
