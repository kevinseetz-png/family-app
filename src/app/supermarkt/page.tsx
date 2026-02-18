"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useSupermarktSearch } from "@/hooks/useSupermarktSearch";
import { SupermarktSearch } from "@/components/SupermarktSearch";
import { SupermarktResults } from "@/components/SupermarktResults";
import { SupermarktFilter } from "@/components/SupermarktFilter";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { SUPERMARKT_LABELS } from "@/types/supermarkt";
import type { SupermarktId } from "@/types/supermarkt";

const ALL_IDS = new Set(Object.keys(SUPERMARKT_LABELS) as SupermarktId[]);

export default function SupermarktPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();
  const { query, setQuery, results, isSearching, error } = useSupermarktSearch();
  const [enabledSupermarkten, setEnabledSupermarkten] = useState<Set<SupermarktId>>(ALL_IDS);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const handleToggle = useCallback((id: SupermarktId) => {
    setEnabledSupermarkten((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  if (authLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
        Prijsvergelijking
      </h1>

      <SupermarktSearch query={query} onQueryChange={setQuery} />
      <SupermarktFilter enabled={enabledSupermarkten} onToggle={handleToggle} />

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
          {error}
        </p>
      )}

      <SupermarktResults
        results={results}
        isSearching={isSearching}
        hasSearched={query.trim().length > 0}
        enabledSupermarkten={enabledSupermarkten}
      />
    </main>
  );
}
