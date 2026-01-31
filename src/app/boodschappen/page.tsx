"use client";

import { useAuthContext } from "@/components/AuthProvider";
import { useGroceries } from "@/hooks/useGroceries";
import { GroceryForm } from "@/components/GroceryForm";
import { GroceryList } from "@/components/GroceryList";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BoodschappenPage() {
  const { user, isLoading: authLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  const { items, isLoading, error, addItem, toggleItem, deleteItem } = useGroceries(
    user?.familyId
  );

  if (authLoading || isLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <main id="main-content" className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-emerald-600 mb-6">Boodschappenlijst</h1>

      <GroceryForm onAdd={addItem} />

      <div className="mt-6">
        {error && (
          <p role="alert" className="text-sm text-red-600 mb-3">{error}</p>
        )}
        <GroceryList
          items={items}
          onToggle={toggleItem}
          onDelete={deleteItem}
        />
      </div>
    </main>
  );
}
