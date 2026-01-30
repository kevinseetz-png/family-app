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
      <h1 className="text-3xl font-bold text-indigo-600 mb-2">Invite Family</h1>
      <p className="text-gray-600 mb-8">Generate a code to invite someone to your family</p>

      {!code ? (
        <button
          onClick={generateCode}
          disabled={isLoading}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
        >
          {isLoading ? "Generating..." : "Generate invite code"}
        </button>
      ) : (
        <div className="w-full max-w-sm space-y-4">
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Invite code</p>
            <p className="text-2xl font-mono font-bold text-indigo-600 tracking-wider">{code}</p>
          </div>

          {inviteUrl && (
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-600 mb-1">Or share this link</p>
              <p className="text-sm text-gray-800 break-all">{inviteUrl}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={share}
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
            >
              Share
            </button>
          </div>

          <button
            onClick={generateCode}
            disabled={isLoading}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Generate new code
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <Link
        href="/"
        className="mt-8 text-sm text-indigo-600 hover:text-indigo-500 font-medium"
      >
        Back to home
      </Link>
    </main>
  );
}
