"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";
import { useGroceries } from "@/hooks/useGroceries";
import { usePicnic } from "@/hooks/usePicnic";
import { GroceryForm } from "@/components/GroceryForm";
import { GroceryList } from "@/components/GroceryList";
import { PicnicLogin } from "@/components/PicnicLogin";
import { PicnicSearch } from "@/components/PicnicSearch";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { PicnicProduct } from "@/types/picnic";

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
  const { status: picnicStatus, login, search, addToCart } = usePicnic(user?.familyId);

  const [picnicProducts, setPicnicProducts] = useState<PicnicProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showPicnic, setShowPicnic] = useState(false);
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  const handlePicnicSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      const products = await search(query);
      setPicnicProducts(products);
    } catch {
      setPicnicProducts([]);
    } finally {
      setIsSearching(false);
    }
  }, [search]);

  const handleAddToCart = useCallback(async (productId: string) => {
    try {
      await addToCart(productId);
      setCartMessage("Toegevoegd aan Picnic mandje!");
      setTimeout(() => setCartMessage(null), 3000);
    } catch {
      setCartMessage("Kon niet toevoegen aan mandje");
      setTimeout(() => setCartMessage(null), 3000);
    }
  }, [addToCart]);

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

      {/* Picnic integration section */}
      <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
        <button
          onClick={() => setShowPicnic(!showPicnic)}
          aria-expanded={showPicnic}
          className="flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${showPicnic ? "rotate-90" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Picnic
          {picnicStatus === "connected" && (
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              Verbonden
            </span>
          )}
        </button>

        {showPicnic && (
          <div className="mt-4 space-y-4">
            {picnicStatus === "disconnected" && (
              <PicnicLogin onLogin={login} />
            )}

            {picnicStatus === "connected" && (
              <>
                {cartMessage && (
                  <p className="text-sm text-emerald-600 font-medium" role="status">
                    {cartMessage}
                  </p>
                )}
                <PicnicSearch
                  onSearch={handlePicnicSearch}
                  onAddToCart={handleAddToCart}
                  products={picnicProducts}
                  isSearching={isSearching}
                  hasSearched={hasSearched}
                />
              </>
            )}

            {picnicStatus === "loading" && (
              <p className="text-sm text-gray-500">Picnic status laden...</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
