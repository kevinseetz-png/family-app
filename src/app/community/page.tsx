"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useCommunity } from "@/hooks/useCommunity";
import { CommunityForm } from "@/components/CommunityForm";
import { CommunityList } from "@/components/CommunityList";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CommunityPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { posts, isLoading, error, addPost } = useCommunity();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p>Laden...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-md px-4 py-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Community</h1>

        <section aria-labelledby="new-post-heading" className="mb-6">
          <h2 id="new-post-heading" className="sr-only">Nieuw bericht maken</h2>
          <CommunityForm onAdd={addPost} />
        </section>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <section aria-labelledby="posts-heading">
          <h2 id="posts-heading" className="sr-only">Community berichten</h2>
          <CommunityList posts={posts} isLoading={isLoading} />
        </section>
      </div>
    </main>
  );
}
