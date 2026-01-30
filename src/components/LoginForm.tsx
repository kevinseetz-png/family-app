"use client";

import { useState, type FormEvent } from "react";
import type { ReactElement } from "react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<string | null>;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSubmit, onSwitchToRegister }: LoginFormProps): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const errorMsg = await onSubmit(email, password);
    if (errorMsg) {
      setError(errorMsg);
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="you@example.com"
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Your password"
          aria-describedby={error ? "login-error" : undefined}
        />
      </div>

      {error && (
        <p id="login-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Logging in..." : "Log in"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-indigo-600 hover:text-indigo-500 focus:underline focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          Create account
        </button>
      </p>
    </form>
  );
}
