"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthContext } from "@/components/AuthProvider";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationToggle } from "@/components/NotificationToggle";

const TOGGLEABLE_TABS = [
  { href: "/agenda", label: "Agenda" },
  { href: "/feeding", label: "Eten" },
  { href: "/notes", label: "Noties" },
  { href: "/weekmenu", label: "Menu" },
  { href: "/maaltijden", label: "Maaltijd" },
  { href: "/boodschappen", label: "Boodschap" },
  { href: "/klusjes", label: "Klusjes" },
  { href: "/medicijn", label: "Medicijn" },
  { href: "/community", label: "Community" },
];

export default function SettingsPage() {
  const { user, logout, visibleTabs, updateVisibleTabs } = useAuthContext();
  const { isSupported, isSubscribed, subscribe, unsubscribe } = useNotifications();

  const defaultTabs = TOGGLEABLE_TABS.map((t) => t.href);
  const [localTabs, setLocalTabs] = useState<string[]>(visibleTabs ?? defaultTabs);
  const [vitaminHour, setVitaminHour] = useState<number>(10);
  const [vitaminSaving, setVitaminSaving] = useState(false);

  useEffect(() => {
    if (visibleTabs) {
      setLocalTabs(visibleTabs);
    }
  }, [visibleTabs]);

  useEffect(() => {
    fetch("/api/settings/vitamin-time")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.vitaminReminderHour === "number") {
          setVitaminHour(data.vitaminReminderHour);
        }
      })
      .catch(() => {});
  }, []);

  const saveVitaminHour = async (hour: number) => {
    setVitaminHour(hour);
    setVitaminSaving(true);
    try {
      await fetch("/api/settings/vitamin-time", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vitaminReminderHour: hour }),
      });
    } catch {
      // ignore
    } finally {
      setVitaminSaving(false);
    }
  };

  const handleToggle = async (href: string, enabled: boolean) => {
    const next = enabled
      ? [...localTabs, href]
      : localTabs.filter((t) => t !== href);
    if (next.length === 0) return; // must keep at least one
    setLocalTabs(next);
    await updateVisibleTabs(next);
  };

  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Instellingen</h1>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Zichtbare tabbladen</h2>
        <div className="space-y-1">
          {TOGGLEABLE_TABS.map(({ href, label }) => (
            <NotificationToggle
              key={href}
              label={label}
              enabled={localTabs.includes(href)}
              onToggle={(on) => handleToggle(href, on)}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Meldingen</h2>
        {isSupported ? (
          <div className="space-y-1">
            <NotificationToggle
              label="Push meldingen"
              enabled={isSubscribed}
              onToggle={(on) => (on ? subscribe() : unsubscribe())}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Push meldingen worden niet ondersteund in deze browser.</p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Vitamine herinnering</h2>
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <span>Herinneringstijd</span>
          <select
            value={vitaminHour}
            onChange={(e) => saveVitaminHour(Number(e.target.value))}
            disabled={vitaminSaving}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
          {vitaminSaving && <span className="text-xs text-gray-400">Opslaan…</span>}
        </label>
        <p className="text-xs text-gray-400 mt-1">
          Momenteel krijgt iedereen de herinnering om 10:00. Je voorkeur wordt bewaard voor toekomstig gebruik.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Familie</h2>
        <Link
          href="/invite"
          className="inline-block text-emerald-600 hover:text-emerald-700 text-sm font-medium"
        >
          Uitnodigen
        </Link>
      </section>

      {user?.role === "admin" && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Beheer</h2>
          <Link
            href="/admin"
            className="inline-block text-emerald-600 hover:text-emerald-700 text-sm font-medium"
          >
            Beheerder dashboard
          </Link>
        </section>
      )}

      <section>
        <button
          onClick={logout}
          className="w-full py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
        >
          Uitloggen
        </button>
      </section>
    </main>
  );
}
