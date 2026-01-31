"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";

const ALL_TABS = [
  { href: "/feeding", label: "Eten" },
  { href: "/notes", label: "Noties" },
  { href: "/weekmenu", label: "Menu" },
  { href: "/boodschappen", label: "Boodschap" },
  { href: "/community", label: "Community" },
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
    <nav aria-label="Hoofdnavigatie" className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <ul className="flex">
        {tabs.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`block py-3 text-center text-xs sm:text-sm font-medium truncate px-1 transition-colors ${
                  isActive
                    ? "text-emerald-600 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-700"
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
