"use client";

import { useState } from "react";
import type { CustomCategory } from "@/types/customCategory";
import { COLOR_SCHEMES } from "@/types/customCategory";

import { CATEGORY_CONFIG, BUILT_IN_CATEGORIES } from "@/types/agenda";

interface CategoryManagerProps {
  categories: CustomCategory[];
  onAdd: (data: { label: string; emoji: string; colorScheme: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  hiddenBuiltIn: string[];
  onToggleBuiltIn: (category: string) => Promise<void>;
}

const COLOR_SCHEME_KEYS = Object.keys(COLOR_SCHEMES);

export function CategoryManager({ categories, onAdd, onDelete, hiddenBuiltIn, onToggleBuiltIn }: CategoryManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [colorScheme, setColorScheme] = useState("groen");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async () => {
    if (!label.trim() || !emoji.trim()) return;
    setBusy(true);
    try {
      await onAdd({ label: label.trim(), emoji: emoji.trim(), colorScheme });
      setLabel("");
      setEmoji("");
      setColorScheme("groen");
      setShowForm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Eigen categorieën</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
          aria-label="Categorie toevoegen"
        >
          {showForm ? "Annuleren" : "Toevoegen"}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700">
          <div>
            <label htmlFor="cat-label" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Naam</label>
            <input
              id="cat-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="bijv. Huisdier"
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="cat-emoji" className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Emoji</label>
            <input
              id="cat-emoji"
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="bijv. 🐕"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Kleur</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_SCHEME_KEYS.map((key) => {
                const scheme = COLOR_SCHEMES[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setColorScheme(key)}
                    className={`w-8 h-8 rounded-full ${scheme.bgColor} border-2 ${
                      colorScheme === key ? `${scheme.borderColor} ring-2 ring-offset-1` : "border-transparent"
                    }`}
                    aria-label={key}
                    aria-pressed={colorScheme === key}
                  />
                );
              })}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={busy || !label.trim()}
            className="w-full px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            aria-label="Bewaar categorie"
          >
            Bewaar
          </button>
        </div>
      )}

      {categories.length === 0 && !showForm && (
        <p className="text-sm text-gray-400 dark:text-gray-500">Geen eigen categorieën</p>
      )}

      <ul className="space-y-2">
        {categories.map((cat) => {
          const scheme = COLOR_SCHEMES[cat.colorScheme] ?? COLOR_SCHEMES.grijs;
          return (
            <li
              key={cat.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${scheme.bgColor} ${scheme.borderColor} border`} />
                <span className="text-sm">{cat.emoji}</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{cat.label}</span>
              </div>
              <button
                onClick={() => onDelete(cat.id)}
                className="text-red-400 hover:text-red-600 text-xs font-medium"
                aria-label={`Verwijder ${cat.label}`}
              >
                &#x2715;
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-6 mb-3">Standaard categorieën</h3>
      <ul className="space-y-2">
        {BUILT_IN_CATEGORIES.filter((cat) => !hiddenBuiltIn.includes(cat)).map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          return (
            <li
              key={cat}
              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            >
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${config.bgColor} ${config.borderColor} border`} />
                <span className="text-sm">{config.emoji}</span>
                <span className="text-sm text-gray-900 dark:text-gray-100">{config.label}</span>
              </div>
              <button
                onClick={() => onToggleBuiltIn(cat)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 text-xs font-medium"
                aria-label={`Verberg ${config.label}`}
              >
                Verberg
              </button>
            </li>
          );
        })}
      </ul>

      {hiddenBuiltIn.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-6 mb-3">Verborgen categorieën</h3>
          <ul className="space-y-2">
            {hiddenBuiltIn.map((cat) => {
              const config = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
              if (!config) return null;
              return (
                <li
                  key={cat}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-center gap-2 opacity-50">
                    <span className={`w-3 h-3 rounded-full ${config.bgColor} ${config.borderColor} border`} />
                    <span className="text-sm">{config.emoji}</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{config.label}</span>
                  </div>
                  <button
                    onClick={() => onToggleBuiltIn(cat)}
                    className="text-emerald-600 hover:text-emerald-700 text-xs font-medium"
                    aria-label={`Terugzetten ${config.label}`}
                  >
                    Terugzetten
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
