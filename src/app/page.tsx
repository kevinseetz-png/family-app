"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InstallBanner } from "@/components/InstallBanner";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
      <h1 className="text-4xl font-bold text-indigo-600 mb-2">Family App</h1>
      <p className="text-lg text-gray-600 mb-8">
        Welcome back, <span className="font-semibold">{user.name}</span>!
      </p>
      <button
        onClick={logout}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
      >
        Log out
      </button>
      <InstallBanner />
    </main>
  );
}
