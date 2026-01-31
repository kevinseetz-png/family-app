"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthContext } from "@/components/AuthProvider";

const tabs = [
  { href: "/feeding", label: "Food" },
  { href: "/notes", label: "Noties" },
  { href: "/weekmenu", label: "Menu" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { user } = useAuthContext();

  if (!user) return null;

  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <ul className="flex">
        {tabs.map(({ href, label }) => {
          const isActive = pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`block py-3 text-center text-sm font-medium transition-colors ${
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
