"use client";

import { useState, type FormEvent } from "react";
import type { ReactElement } from "react";

interface RegisterFormProps {
  onSubmit: (name: string, email: string, password: string, inviteCode: string) => Promise<string | null>;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSubmit, onSwitchToLogin }: RegisterFormProps): ReactElement {
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const errorMsg = await onSubmit(name, email, password, inviteCode);
    if (errorMsg) {
      setError(errorMsg);
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Je hebt een uitnodigingscode nodig</p>

      <div>
        <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Uitnodigingscode
        </label>
        <input
          id="invite-code"
          type="text"
          required
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Vul je uitnodigingscode in"
          aria-describedby={error ? "register-error" : undefined}
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Naam
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Je naam"
        />
      </div>

      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          E-mail
        </label>
        <input
          id="reg-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="jij@voorbeeld.nl"
        />
      </div>

      <div>
        <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Wachtwoord
        </label>
        <input
          id="reg-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          placeholder="Minimaal 8 tekens"
        />
      </div>

      {error && (
        <p id="register-error" role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Account aanmaken..." : "Registreren"}
      </button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Al een account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-emerald-600 hover:text-emerald-500 focus:underline focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        >
          Inloggen
        </button>
      </p>
    </form>
  );
}
