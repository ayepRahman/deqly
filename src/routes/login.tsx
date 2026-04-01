"use client";

import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/" });
    }
  },
});

type FormMode = "login" | "signup";

function LoginPage() {
  const [mode, setMode] = useState<FormMode>("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [occupation, setOccupation] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [websiteLink, setWebsiteLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        localStorage.setItem(
          "deqly_signup_profile",
          JSON.stringify({ username, occupation, mobileNumber, websiteLink }),
        );
      }

      await authClient.signIn.magicLink(
        { email },
        {
          onSuccess: () => {
            setSent(true);
            setLoading(false);
          },
          onError: (errorCtx: { error: { message: string } }) => {
            setError(errorCtx.error.message);
            setLoading(false);
          },
        },
      );
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
            <div className="text-4xl mb-4">&#9993;</div>
            <h2 className="text-xl font-semibold mb-2">Check your email</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              We sent a magic link to{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {email}
              </span>
              . Click the link in the email to sign in.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setLoading(false);
              }}
              className="mt-6 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
            >
              Use a different email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            {mode === "login"
              ? "Enter your email to sign in with a magic link"
              : "Fill in your details to get started"}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
              />
            </div>

            {mode === "signup" && (
              <>
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium mb-1.5"
                  >
                    Username / Handle
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
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
