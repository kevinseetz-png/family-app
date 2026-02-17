"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useInviteCode } from "@/hooks/useInviteCode";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function InvitePage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { code, inviteUrl, isLoading, error, copied, generateCode, copyToClipboard, share } =
    useInviteCode();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  if (authLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-emerald-600 mb-2">Familie uitnodigen</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Genereer een code om iemand uit te nodigen</p>

      {!code ? (
        <button
          onClick={generateCode}
          disabled={isLoading}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? "Genereren..." : "Genereer uitnodigingscode"}
        </button>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Uitnodigingscode</p>
            <p className="text-2xl font-mono font-bold text-emerald-600 tracking-wider">{code}</p>
          </div>

          {inviteUrl && (
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Of deel deze link</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 break-all">{inviteUrl}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
            >
              {copied ? "Gekopieerd!" : "Kopieer link"}
            </button>
            <button
              onClick={share}
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
            >
              Delen
            </button>
          </div>

          <button
            onClick={generateCode}
            disabled={isLoading}
            className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Nieuwe code genereren
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <Link
        href="/"
        className="mt-8 text-sm text-emerald-600 hover:text-emerald-500 font-medium"
      >
        Terug naar home
      </Link>
    </main>
  );
}
