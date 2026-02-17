"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PicnicProduct, PicnicCartSelection } from "@/types/picnic";

interface PicnicAddToCartModalProps {
  ingredients: string[];
  searchResults: Record<string, PicnicProduct[]>;
  onSearch: (ingredient: string) => Promise<void>;
  onConfirm: (selections: PicnicCartSelection[]) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function PicnicAddToCartModal({
  ingredients,
  searchResults,
  onSearch,
  onConfirm,
  onCancel,
  isLoading,
}: PicnicAddToCartModalProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const searchedRef = useRef<Set<string>>(new Set());
  const dialogRef = useRef<HTMLDivElement>(null);

  // Search ingredients that haven't been searched yet (using ref to prevent loops)
  useEffect(() => {
    for (const ingredient of ingredients) {
      if (!searchedRef.current.has(ingredient) && !searchResults[ingredient]) {
        searchedRef.current.add(ingredient);
        onSearch(ingredient);
      }
    }
  }, [ingredients, searchResults, onSearch]);

  // Focus trap and Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSelectProduct = useCallback((ingredient: string, productId: string) => {
    setSelections((prev) => {
      if (prev[ingredient] === productId) {
        const next = { ...prev };
        delete next[ingredient];
        return next;
      }
      return { ...prev, [ingredient]: productId };
    });
  }, []);

  function handleConfirm() {
    const cartSelections: PicnicCartSelection[] = Object.values(selections).map(
      (productId) => ({ productId, count: 1 })
    );
    onConfirm(cartSelections);
  }

  const selectedCount = Object.keys(selections).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="picnic-modal-title"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-4 border-b dark:border-gray-700">
          <h2 id="picnic-modal-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Ingrediënten naar Picnic mandje
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Selecteer producten per ingrediënt om toe te voegen.
          </p>
        </div>

        <div className="p-4 space-y-4">
          {ingredients.map((ingredient) => {
            const results = searchResults[ingredient] || [];
            const selectedProductId = selections[ingredient];

            return (
              <div key={ingredient} className="space-y-2">
                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {ingredient}
                </p>
                {results.length === 0 ? (
                  <p className="text-xs text-gray-400" aria-live="polite">Zoeken...</p>
                ) : (
                  <ul className="space-y-1">
                    {results.slice(0, 3).map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectProduct(ingredient, product.id)}
                          aria-pressed={selectedProductId === product.id}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedProductId === product.id
                              ? "bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500"
                              : "bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-650"
                          }`}
                          aria-label={`Selecteer ${product.name}`}
                        >
                          <span className="font-medium">{product.name}</span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            {product.displayPrice}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0 || isLoading}
            className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Toevoegen aan mandje"
          >
            {isLoading
              ? "Toevoegen..."
              : `Toevoegen aan mandje (${selectedCount})`}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Annuleren"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}
