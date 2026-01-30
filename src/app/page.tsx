"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Link from "next/link";

export default function Home() {
  const { user, isLoading, logout } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) return null;

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold text-emerald-600 mb-2">Family App</h1>
      <p className="text-lg text-gray-600 mb-8">
        Welcome back, <span className="font-semibold">{user.name}</span>!
      </p>

      <nav className="flex flex-col gap-3 w-full max-w-xs mb-8">
        <Link
          href="/feeding"
          className="rounded-lg bg-emerald-600 px-4 py-3 text-center text-white font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
        >
          Food Tracker
        </Link>
        <Link
          href="/invite"
          className="rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
        >
          Invite family member
        </Link>
      </nav>

      <button
        onClick={logout}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:outline-none"
      >
        Log out
      </button>
    </main>
  );
}
