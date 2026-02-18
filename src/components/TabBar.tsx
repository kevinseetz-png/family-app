"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";

const ALL_TABS = [
  { href: "/agenda", label: "Agenda" },
  { href: "/feeding", label: "Eten" },
  { href: "/notes", label: "Noties" },
  { href: "/weekmenu", label: "Menu" },
  { href: "/maaltijden", label: "Maaltijd" },
  { href: "/boodschappen", label: "Boodschap" },
  { href: "/klusjes", label: "Taken" },
  { href: "/medicijn", label: "Medicijn" },
  { href: "/community", label: "Community" },
  { href: "/supermarkt", label: "Supermarkt" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { user, visibleTabs } = useAuthContext();

  if (!user) return null;

  const filteredTabs = visibleTabs
    ? ALL_TABS.filter((tab) => visibleTabs.includes(tab.href))
    : ALL_TABS;

  const tabs = [
    ...filteredTabs,
    { href: "/instellingen" as const, label: "⚙️" },
  ];

  return (
    <nav aria-label="Hoofdnavigatie" className="sticky top-0 z-40 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <ul className="flex overflow-x-auto scrollbar-hide">
        {tabs.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-shrink-0">
              <Link
                href={href}
                className={`block py-3 text-center text-xs sm:text-sm font-medium whitespace-nowrap px-3 transition-colors ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
