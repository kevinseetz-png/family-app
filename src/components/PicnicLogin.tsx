"use client";

import { useState, type FormEvent } from "react";

interface PicnicLoginProps {
  onLogin: (username: string, password: string) => Promise<void>;
}

export function PicnicLogin({ onLogin }: PicnicLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen mislukt");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Verbind met Picnic</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Log in met je Picnic account om producten te zoeken en toe te voegen aan je mandje.
      </p>
      <div>
        <label htmlFor="picnic-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          E-mail
        </label>
        <input
          id="picnic-email"
          type="email"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="je@email.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="picnic-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Wachtwoord
        </label>
        <input
          id="picnic-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 dark:bg-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Picnic wachtwoord"
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Verbinden..." : "Verbinden"}
      </button>
    </form>
  );
}
